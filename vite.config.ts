import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tanstackStart({
      server: { entry: "./src/server" },
    }),
    react(),
    tailwindcss(),
    tsConfigPaths(),
  ],
});
