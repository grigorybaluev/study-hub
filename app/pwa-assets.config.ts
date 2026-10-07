// Icons for the installed app (#189), generated at build time from public/icon.svg.
// The icon is a full-bleed square, so the iOS and maskable sizes use it without padding.
import { defineConfig, minimal2023Preset } from "@vite-pwa/assets-generator/config";

const fill = { padding: 0, resizeOptions: { background: "#0f0e23" } };

export default defineConfig({
  headLinkOptions: { preset: "2023" },
  preset: {
    ...minimal2023Preset,
    transparent: { ...minimal2023Preset.transparent, ...fill },
    maskable: { ...minimal2023Preset.maskable, ...fill },
    apple: { ...minimal2023Preset.apple, ...fill },
  },
  images: ["public/icon.svg"],
});
