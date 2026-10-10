import { defineConfig } from "@playwright/test";

// ブロックのルールの反映を待つ上限。これを超えたら反映されなかったとみなす
const RULE_UPDATE_TIMEOUT_MS = 5_000;

export default defineConfig({
  testDir: ".",
  forbidOnly: process.env["CI"] !== undefined,
  reporter: "list",
  expect: { toPass: { timeout: RULE_UPDATE_TIMEOUT_MS } },
});
