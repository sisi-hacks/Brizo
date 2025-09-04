import { defineConfig } from "vitest/config";
import { vitestSetupFilePath } from "@hirosystems/clarinet-sdk/vitest";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: [vitestSetupFilePath],
    env: {
      CLARINET_MANIFEST_PATH: "./contracts/Clarinet.toml"
    }
  },
});
