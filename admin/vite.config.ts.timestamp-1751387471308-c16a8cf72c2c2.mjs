// vite.config.ts
import path from "path";
import react from "file:///home/project/admin/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { defineConfig } from "file:///home/project/admin/node_modules/vite/dist/node/index.js";
import { VitePWA } from "file:///home/project/admin/node_modules/vite-plugin-pwa/dist/index.js";
var __vite_injected_original_dirname = "/home/project/admin";
var manifestForPlugIn = {
  registerType: "prompt",
  includeAssests: ["favicon.ico", "apple-touc-icon.png", "masked-icon.svg"],
  manifest: {
    name: "Crown Dental Management System",
    short_name: "Crown DMS",
    description: "Crown Dental Management System",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "favicon"
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "favicon"
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "apple touch icon"
      },
      {
        src: "/maskable_icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ],
    theme_color: "#171717",
    background_color: "#f0e7db",
    display: "standalone",
    scope: "/",
    start_url: "/",
    orientation: "portrait"
  }
};
var vite_config_default = defineConfig({
  plugins: [react(), VitePWA(manifestForPlugIn)],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  server: {
    host: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0L2FkbWluXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L2FkbWluL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3QvYWRtaW4vdml0ZS5jb25maWcudHNcIjtpbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tIFwidml0ZS1wbHVnaW4tcHdhXCI7XG5cbmNvbnN0IG1hbmlmZXN0Rm9yUGx1Z0luID0ge1xuICByZWdpc3RlclR5cGU6IFwicHJvbXB0XCIsXG4gIGluY2x1ZGVBc3Nlc3RzOiBbXCJmYXZpY29uLmljb1wiLCBcImFwcGxlLXRvdWMtaWNvbi5wbmdcIiwgXCJtYXNrZWQtaWNvbi5zdmdcIl0sXG4gIG1hbmlmZXN0OiB7XG4gICAgbmFtZTogXCJDcm93biBEZW50YWwgTWFuYWdlbWVudCBTeXN0ZW1cIixcbiAgICBzaG9ydF9uYW1lOiBcIkNyb3duIERNU1wiLFxuICAgIGRlc2NyaXB0aW9uOiBcIkNyb3duIERlbnRhbCBNYW5hZ2VtZW50IFN5c3RlbVwiLFxuICAgIGljb25zOiBbXG4gICAgICB7XG4gICAgICAgIHNyYzogXCIvYW5kcm9pZC1jaHJvbWUtMTkyeDE5Mi5wbmdcIixcbiAgICAgICAgc2l6ZXM6IFwiMTkyeDE5MlwiLFxuICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxuICAgICAgICBwdXJwb3NlOiBcImZhdmljb25cIixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHNyYzogXCIvYW5kcm9pZC1jaHJvbWUtNTEyeDUxMi5wbmdcIixcbiAgICAgICAgc2l6ZXM6IFwiNTEyeDUxMlwiLFxuICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxuICAgICAgICBwdXJwb3NlOiBcImZhdmljb25cIixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHNyYzogXCIvYXBwbGUtdG91Y2gtaWNvbi5wbmdcIixcbiAgICAgICAgc2l6ZXM6IFwiMTgweDE4MFwiLFxuICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxuICAgICAgICBwdXJwb3NlOiBcImFwcGxlIHRvdWNoIGljb25cIixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHNyYzogXCIvbWFza2FibGVfaWNvbi5wbmdcIixcbiAgICAgICAgc2l6ZXM6IFwiNTEyeDUxMlwiLFxuICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxuICAgICAgICBwdXJwb3NlOiBcImFueSBtYXNrYWJsZVwiLFxuICAgICAgfSxcbiAgICBdLFxuICAgIHRoZW1lX2NvbG9yOiBcIiMxNzE3MTdcIixcbiAgICBiYWNrZ3JvdW5kX2NvbG9yOiBcIiNmMGU3ZGJcIixcbiAgICBkaXNwbGF5OiBcInN0YW5kYWxvbmVcIixcbiAgICBzY29wZTogXCIvXCIsXG4gICAgc3RhcnRfdXJsOiBcIi9cIixcbiAgICBvcmllbnRhdGlvbjogXCJwb3J0cmFpdFwiLFxuICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3JlYWN0KCksIFZpdGVQV0EobWFuaWZlc3RGb3JQbHVnSW4gYXMgYW55KV0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXG4gICAgfSxcbiAgfSxcbiAgc2VydmVyIDoge1xuICAgIGhvc3Q6IHRydWUsXG4gIH1cbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUEyTyxPQUFPLFVBQVU7QUFDNVAsT0FBTyxXQUFXO0FBQ2xCLFNBQVMsb0JBQW9CO0FBQzdCLFNBQVMsZUFBZTtBQUh4QixJQUFNLG1DQUFtQztBQUt6QyxJQUFNLG9CQUFvQjtBQUFBLEVBQ3hCLGNBQWM7QUFBQSxFQUNkLGdCQUFnQixDQUFDLGVBQWUsdUJBQXVCLGlCQUFpQjtBQUFBLEVBQ3hFLFVBQVU7QUFBQSxJQUNSLE1BQU07QUFBQSxJQUNOLFlBQVk7QUFBQSxJQUNaLGFBQWE7QUFBQSxJQUNiLE9BQU87QUFBQSxNQUNMO0FBQUEsUUFDRSxLQUFLO0FBQUEsUUFDTCxPQUFPO0FBQUEsUUFDUCxNQUFNO0FBQUEsUUFDTixTQUFTO0FBQUEsTUFDWDtBQUFBLE1BQ0E7QUFBQSxRQUNFLEtBQUs7QUFBQSxRQUNMLE9BQU87QUFBQSxRQUNQLE1BQU07QUFBQSxRQUNOLFNBQVM7QUFBQSxNQUNYO0FBQUEsTUFDQTtBQUFBLFFBQ0UsS0FBSztBQUFBLFFBQ0wsT0FBTztBQUFBLFFBQ1AsTUFBTTtBQUFBLFFBQ04sU0FBUztBQUFBLE1BQ1g7QUFBQSxNQUNBO0FBQUEsUUFDRSxLQUFLO0FBQUEsUUFDTCxPQUFPO0FBQUEsUUFDUCxNQUFNO0FBQUEsUUFDTixTQUFTO0FBQUEsTUFDWDtBQUFBLElBQ0Y7QUFBQSxJQUNBLGFBQWE7QUFBQSxJQUNiLGtCQUFrQjtBQUFBLElBQ2xCLFNBQVM7QUFBQSxJQUNULE9BQU87QUFBQSxJQUNQLFdBQVc7QUFBQSxJQUNYLGFBQWE7QUFBQSxFQUNmO0FBQ0Y7QUFFQSxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxHQUFHLFFBQVEsaUJBQXdCLENBQUM7QUFBQSxFQUNwRCxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsRUFDUjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
