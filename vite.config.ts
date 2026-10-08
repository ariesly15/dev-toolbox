import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import license from "rollup-plugin-license";

export default defineConfig({
  plugins: [react()],
  base: "./",
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  esbuild: {
    legalComments: "none",
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      plugins: [
        license({
          thirdParty: {
            output: {
              file: fileURLToPath(new URL("./dist/dependencies.txt", import.meta.url)),
              template(dependencies) {
                return dependencies
                  .map((dep) => {
                    const parts = [`${dep.name} ${dep.version}`, `License: ${dep.license}`];
                    if (dep.licenseText) parts.push("", dep.licenseText.trim());
                    return parts.join("\n");
                  })
                  .join("\n\n" + "-".repeat(60) + "\n\n");
              },
            },
          },
        }),
      ],
    },
  },
});
