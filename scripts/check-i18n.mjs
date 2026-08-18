import { promises as fs } from "node:fs";
import path from "node:path";
import ts from "typescript";

const projectRoot = process.cwd();
const sourceRoot = path.join(projectRoot, "src");
const extensions = new Set([".ts", ".tsx"]);
const userFacingAttributes = new Set([
  "alt",
  "aria-label",
  "aria-description",
  "placeholder",
  "title",
  "label",
  "description",
  "helperText",
  "emptyMessage",
  "confirmLabel",
  "cancelLabel",
]);
const userFacingProperties = new Set([
  "title",
  "description",
  "label",
  "message",
  "heading",
  "eyebrow",
  "subtitle",
  "helperText",
  "emptyMessage",
]);
const allowedLiteralPatterns = [
  /^https?:\/\//u,
  /^\//u,
  /^#[0-9a-f]{3,8}$/iu,
  /^[A-Z]{3}$/u,
  /^[A-Z0-9._/-]+$/u,
  /^\d+(?:[.,]\d+)?%?$/u,
  /^[\p{P}\p{S}\s]+$/u,
];
const allowedExact = new Set(["Practicora"]);

async function listSourceFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (["generated", "locales"].includes(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listSourceFiles(fullPath)));
    else if (entry.isFile() && extensions.has(path.extname(entry.name)))
      files.push(fullPath);
  }
  return files;
}

function containsLanguageText(value) {
  const text = value.trim();
  if (!text || allowedExact.has(text)) return false;
  if (!/[A-Za-zÀ-ÿ]/u.test(text)) return false;
  return !allowedLiteralPatterns.some((pattern) => pattern.test(text));
}

function lineAndColumn(sourceFile, node) {
  const point = sourceFile.getLineAndCharacterOfPosition(
    node.getStart(sourceFile),
  );
  return `${point.line + 1}:${point.character + 1}`;
}

const violations = [];
const translationReferences = [];
const files = await listSourceFiles(sourceRoot);
for (const filePath of files) {
  const sourceText = await fs.readFile(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  function report(node, value, reason) {
    violations.push({
      file: path.relative(projectRoot, filePath).replaceAll(path.sep, "/"),
      position: lineAndColumn(sourceFile, node),
      reason,
      value: value.trim().replace(/\s+/gu, " ").slice(0, 160),
    });
  }

  function visit(node) {
    if (ts.isJsxText(node)) {
      const value = node.getText(sourceFile);
      if (containsLanguageText(value)) report(node, value, "JSX text");
    }

    if (
      ts.isJsxExpression(node) &&
      node.expression &&
      ts.isStringLiteralLike(node.expression)
    ) {
      const value = node.expression.text;
      if (containsLanguageText(value))
        report(node, value, "JSX string expression");
    }

    if (
      ts.isJsxAttribute(node) &&
      node.initializer &&
      ts.isStringLiteral(node.initializer)
    ) {
      const name = node.name.getText(sourceFile);
      const value = node.initializer.text;
      if (userFacingAttributes.has(name) && containsLanguageText(value)) {
        report(node, value, `user-facing attribute ${name}`);
      }
    }

    if (
      ts.isPropertyAssignment(node) &&
      ts.isStringLiteralLike(node.initializer)
    ) {
      const name = node.name.getText(sourceFile).replace(/["']/gu, "");
      const value = node.initializer.text;
      if (userFacingProperties.has(name) && containsLanguageText(value)) {
        report(node, value, `user-facing property ${name}`);
      }
    }

    if (ts.isCallExpression(node) && node.arguments.length) {
      const callee = node.expression.getText(sourceFile);
      const tracked =
        /(?:toast\.(?:success|error|info|warning)|window\.(?:alert|confirm)|\balert|\bconfirm)$/u.test(
          callee,
        );
      if (
        tracked &&
        ts.isStringLiteralLike(node.arguments[0]) &&
        containsLanguageText(node.arguments[0].text)
      ) {
        report(
          node.arguments[0],
          node.arguments[0].text,
          `user-facing call ${callee}`,
        );
      }

      if (
        (callee === "t" || callee === "translate") &&
        node.arguments.length >= 2
      ) {
        const keyNode = node.arguments[1];
        if (ts.isStringLiteralLike(keyNode)) {
          translationReferences.push({
            key: keyNode.text,
            file: path
              .relative(projectRoot, filePath)
              .replaceAll(path.sep, "/"),
            position: lineAndColumn(sourceFile, keyNode),
          });
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

const generatedRoot = path.join(projectRoot, "src", "i18n", "generated");
const generatedCatalogs = {};
for (const locale of ["fr", "en", "es", "pt", "de", "it", "ar"]) {
  const catalogPath = path.join(generatedRoot, `${locale}.json`);
  generatedCatalogs[locale] = JSON.parse(
    await fs.readFile(catalogPath, "utf8"),
  );
}

const manifest = JSON.parse(await fs.readFile(path.join(generatedRoot, "manifest.json"), "utf8"));
const incompleteLocales = [];
for (const locale of ["fr", "en", "es", "pt", "de", "it", "ar"]) {
  const item = manifest.coverage?.[locale];
  if (!item || item.sourceTranslations !== manifest.translationCount || item.fallbackValues !== 0) {
    incompleteLocales.push({ locale, ...item });
  }
}

const missingTranslations = [];
for (const reference of translationReferences) {
  const segments = reference.key.split(".");
  if (segments.length < 2) {
    missingTranslations.push({ ...reference, locale: "fr/en" });
    continue;
  }
  const key = segments.pop();
  const namespace = segments.join(".");
  for (const locale of ["fr", "en", "es", "pt", "de", "it", "ar"]) {
    const value = generatedCatalogs[locale]?.[namespace]?.[key];
    if (typeof value !== "string") {
      missingTranslations.push({ ...reference, locale });
    }
  }
}

if (violations.length || missingTranslations.length || incompleteLocales.length) {
  if (violations.length) {
    console.error(
      "Hard-coded user-facing text was found. Move every value to src/i18n/locales/<locale>/<area>/<page>.json.",
    );
    for (const violation of violations) {
      console.error(
        `- ${violation.file}:${violation.position} [${violation.reason}] ${JSON.stringify(violation.value)}`,
      );
    }
  }
  if (incompleteLocales.length) {
    console.error("Locale source catalogs are incomplete or still require runtime fallback values.");
    for (const item of incompleteLocales) console.error(`- ${item.locale}: ${item.sourceTranslations || 0}/${manifest.translationCount}, fallback=${item.fallbackValues ?? "unknown"}`);
  }
  if (missingTranslations.length) {
    console.error(
      "Referenced translation keys are missing from the generated locale catalogs.",
    );
    for (const missing of missingTranslations) {
      console.error(
        `- ${missing.file}:${missing.position} [${missing.locale}] ${missing.key}`,
      );
    }
  }
  process.exit(1);
}

console.log(
  `i18n source and key audit passed across ${files.length} TypeScript files and ${translationReferences.length} static translation references.`,
);
