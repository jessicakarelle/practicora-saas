import { promises as fs } from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const localeRoot = path.join(projectRoot, "src", "i18n", "locales");
const outputRoot = path.join(projectRoot, "src", "i18n", "generated");
const locales = ["fr", "en", "es", "pt", "de", "it", "ar"];
const excludedRelativeFiles = new Set(["content/blog-posts.json", "common/metadata.json"]);

async function listJsonFiles(directory) {
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const files = [];
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) files.push(...await listJsonFiles(fullPath));
      else if (entry.isFile() && entry.name.endsWith(".json")) files.push(fullPath);
    }
    return files;
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

function namespaceFor(localeDirectory, filePath) {
  return path.relative(localeDirectory, filePath).replaceAll(path.sep, "/").replace(/\.json$/u, "").replaceAll("/", ".");
}

function assertFlatStringMap(value, filePath) {
  if (!value || Array.isArray(value) || typeof value !== "object") throw new Error(`Translation file must contain an object: ${filePath}`);
  for (const [key, item] of Object.entries(value)) if (typeof item !== "string") throw new Error(`Translation value must be a string: ${filePath}#${key}`);
}

const sourceCatalogs = {};
for (const locale of locales) {
  const localeDirectory = path.join(localeRoot, locale);
  const files = await listJsonFiles(localeDirectory);
  const catalog = {};
  for (const filePath of files) {
    const relativePath = path.relative(localeDirectory, filePath).replaceAll(path.sep, "/");
    if (excludedRelativeFiles.has(relativePath)) continue;
    const parsed = JSON.parse(await fs.readFile(filePath, "utf8"));
    assertFlatStringMap(parsed, filePath);
    catalog[namespaceFor(localeDirectory, filePath)] = parsed;
  }
  sourceCatalogs[locale] = catalog;
}

const referenceNamespaces = Object.keys(sourceCatalogs.fr).sort();
const englishNamespaces = Object.keys(sourceCatalogs.en).sort();
if (JSON.stringify(referenceNamespaces) !== JSON.stringify(englishNamespaces)) {
  const missingInEnglish = referenceNamespaces.filter((item) => !englishNamespaces.includes(item));
  const missingInFrench = englishNamespaces.filter((item) => !referenceNamespaces.includes(item));
  throw new Error(`Locale namespace mismatch. Missing EN: ${missingInEnglish.join(", ") || "none"}. Missing FR: ${missingInFrench.join(", ") || "none"}.`);
}

for (const namespace of referenceNamespaces) {
  const frenchKeys = Object.keys(sourceCatalogs.fr[namespace]).sort();
  const englishKeys = Object.keys(sourceCatalogs.en[namespace]).sort();
  if (JSON.stringify(frenchKeys) !== JSON.stringify(englishKeys)) {
    const missingInEnglish = frenchKeys.filter((item) => !englishKeys.includes(item));
    const missingInFrench = englishKeys.filter((item) => !frenchKeys.includes(item));
    throw new Error(`Locale key mismatch in ${namespace}. Missing EN: ${missingInEnglish.join(", ") || "none"}. Missing FR: ${missingInFrench.join(", ") || "none"}.`);
  }
}

for (const locale of locales) {
  const localeNamespaces = Object.keys(sourceCatalogs[locale]).sort();
  if (JSON.stringify(referenceNamespaces) !== JSON.stringify(localeNamespaces)) {
    const missing = referenceNamespaces.filter((item) => !localeNamespaces.includes(item));
    const extra = localeNamespaces.filter((item) => !referenceNamespaces.includes(item));
    throw new Error(`Locale namespace mismatch for ${locale}. Missing: ${missing.join(", ") || "none"}. Extra: ${extra.join(", ") || "none"}.`);
  }
  for (const namespace of referenceNamespaces) {
    const referenceKeys = Object.keys(sourceCatalogs.en[namespace]).sort();
    const localeKeys = Object.keys(sourceCatalogs[locale][namespace]).sort();
    if (JSON.stringify(referenceKeys) !== JSON.stringify(localeKeys)) {
      const missing = referenceKeys.filter((item) => !localeKeys.includes(item));
      const extra = localeKeys.filter((item) => !referenceKeys.includes(item));
      throw new Error(`Locale key mismatch for ${locale}:${namespace}. Missing: ${missing.join(", ") || "none"}. Extra: ${extra.join(", ") || "none"}.`);
    }
  }
}

const mergedCatalogs = {};
const coverage = {};
for (const locale of locales) {
  const merged = {};
  let sourceCount = 0;
  let fallbackCount = 0;
  let localizedCount = 0;
  let mirroredEnglishCount = 0;
  for (const namespace of referenceNamespaces) {
    merged[namespace] = {};
    for (const key of Object.keys(sourceCatalogs.en[namespace])) {
      const sourceValue = sourceCatalogs[locale]?.[namespace]?.[key];
      if (typeof sourceValue === "string") {
        merged[namespace][key] = sourceValue;
        sourceCount += 1;
        if (locale === "fr" || locale === "en" || sourceValue !== sourceCatalogs.en[namespace][key]) localizedCount += 1;
        else mirroredEnglishCount += 1;
      } else {
        merged[namespace][key] = sourceCatalogs.en[namespace][key] ?? sourceCatalogs.fr[namespace][key];
        fallbackCount += 1;
      }
    }
  }
  mergedCatalogs[locale] = merged;
  coverage[locale] = { sourceTranslations: sourceCount, fallbackValues: fallbackCount, localizedValues: localizedCount, mirroredEnglishValues: mirroredEnglishCount };
}

await fs.mkdir(outputRoot, { recursive: true });
for (const locale of locales) await fs.writeFile(path.join(outputRoot, `${locale}.json`), `${JSON.stringify(mergedCatalogs[locale], null, 2)}\n`, "utf8");

const translationCount = Object.values(sourceCatalogs.fr).reduce((sum, namespace) => sum + Object.keys(namespace).length, 0);
const manifest = { generatedAt: new Date().toISOString(), locales, namespaces: referenceNamespaces, translationCount, coverage };
await fs.writeFile(path.join(outputRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Generated ${translationCount} translation keys across ${referenceNamespaces.length} namespaces for ${locales.length} locales.`);
for (const locale of locales) console.log(`- ${locale}: ${coverage[locale].sourceTranslations}/${translationCount} source values; ${coverage[locale].localizedValues} localized values; ${coverage[locale].mirroredEnglishValues} explicit English mirrors; ${coverage[locale].fallbackValues} runtime fallback values.`);
