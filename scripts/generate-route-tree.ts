import { createServer } from "vite";

const server = await createServer({
  configFile: "./vite.config.ts",
  server: { middlewareMode: true },
  appType: "custom",
});

try {
  await server.pluginContainer.buildStart({});
} finally {
  await server.close();
}
