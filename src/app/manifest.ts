import type { MetadataRoute } from "next";
import copy from "@/i18n/locales/fr/common/manifest.json";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: copy.name,
    short_name: copy.short_name,
    description: copy.description,
    start_url: "/fr/app",
    display: "standalone",
    background_color: "#f5f8fb",
    theme_color: "#2f6f9f",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
