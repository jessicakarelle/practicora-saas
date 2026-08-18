export const BRAND = {
  name: "Practicora",
  shortName: "Practicora",
  storageKey: "practicora:v6",
  draftPrefix: "practicora:draft:",
  localProfileKey: "practicora:local-profile",
  snapshotTable: "practicora_snapshots",
  legacySnapshotTable: "stagelog_snapshots",
} as const;

export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || "bonjour@practicora.app";
