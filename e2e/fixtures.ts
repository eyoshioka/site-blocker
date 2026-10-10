import http from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";

import { type BrowserContext, chromium, test as base } from "@playwright/test";

const DIST_DIR = path.resolve(import.meta.dirname, "../dist");

// 架空の *.test ドメインをテスト用のローカルサーバーに向け、外部サイトにはアクセスしない
const TEST_HOST = "127.0.0.1";

interface TestFixtures {
  context: BrowserContext;
  extensionId: string;
}

interface WorkerFixtures {
  serverPort: number;
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  serverPort: [
    // eslint-disable-next-line no-empty-pattern -- Playwright は第 1 引数の分割代入から依存する fixture を読み取る
    async ({}, use): Promise<void> => {
      const server = http.createServer((req, res): void => {
        res.end(`<h1>${req.headers.host ?? ""}</h1>`);
      });
      await new Promise<void>((resolve) => {
        server.listen(0, TEST_HOST, resolve);
      });
      await use((server.address() as AddressInfo).port);
      server.close();
    },
    { scope: "worker" },
  ],

  // テストごとに新しいプロファイルで起動し、登録したサイトが次のテストに残らないようにする
  // eslint-disable-next-line no-empty-pattern -- 同上
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext("", {
      // 拡張機能を読み込めるのは Playwright 同梱の Chromium
      channel: "chromium",
      args: [
        `--disable-extensions-except=${DIST_DIR}`,
        `--load-extension=${DIST_DIR}`,
        `--host-resolver-rules=MAP *.test ${TEST_HOST}`,
      ],
    });
    await use(context);
    await context.close();
  },

  extensionId: async ({ context }, use) => {
    const worker =
      context.serviceWorkers()[0] ??
      (await context.waitForEvent("serviceworker"));
    await use(new URL(worker.url()).host);
  },
});

export { expect } from "@playwright/test";
