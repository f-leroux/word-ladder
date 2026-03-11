import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function getBasePath() {
  if (!process.env.GITHUB_ACTIONS) {
    return "/";
  }

  const [owner, repo] = (process.env.GITHUB_REPOSITORY ?? "").split("/");
  if (!owner || !repo) {
    return "/";
  }

  const isUserOrOrgSite = repo.toLowerCase() === `${owner}.github.io`.toLowerCase();
  return isUserOrOrgSite ? "/" : `/${repo}/`;
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: getBasePath(),
});
