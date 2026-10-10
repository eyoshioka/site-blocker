import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";
import { Popup } from "./popup";

const BLOCKED_DOMAIN = "blocked.test";
const ALLOWED_DOMAIN = "allowed.test";

// ブロックには 2 つの経路がある。declarativeNetRequest は読み込み前に、
// tabs.onUpdated は読み込みが始まった後に、遅れてブロック画面へ移す。
// 後者を待つため、移らないことの確認にはこの時間だけ様子を見る
const SETTLE_MS = 1_000;

// ルールは非同期に反映されるため、期待どおりになるまで開き直す
async function expectBlockedAt(
  page: Page,
  url: string,
  blockedPage: string
): Promise<void> {
  await expect(async () => {
    await page.goto(url);
    await page.waitForURL(blockedPage, { timeout: SETTLE_MS });
  }).toPass();
}

async function expectNotBlockedAt(page: Page, url: string): Promise<void> {
  await expect(async () => {
    await page.goto(url);
    expect(page.url()).toBe(url);
  }).toPass();
  await page.waitForTimeout(SETTLE_MS);
  expect(page.url()).toBe(url);
}

test.describe("サイトのブロック", () => {
  let blockedPage: string;
  let urlOf: (domain: string) => string;

  test.beforeEach(({ extensionId, serverPort }) => {
    blockedPage = `chrome-extension://${extensionId}/blocked.html`;
    urlOf = (domain): string => `http://${domain}:${String(serverPort)}/`;
  });

  async function expectBlocked(page: Page, domain: string): Promise<void> {
    await expectBlockedAt(page, urlOf(domain), blockedPage);
  }

  async function expectNotBlocked(page: Page, domain: string): Promise<void> {
    await expectNotBlockedAt(page, urlOf(domain));
  }

  test("登録したサイトはブロックされる", async ({ context, extensionId }) => {
    const popup = await Popup.open(context, extensionId);
    await popup.addSite(BLOCKED_DOMAIN);

    await expectBlocked(await context.newPage(), BLOCKED_DOMAIN);
  });

  test("登録していないサイトはブロックされない", async ({
    context,
    extensionId,
  }) => {
    const popup = await Popup.open(context, extensionId);
    await popup.addSite(BLOCKED_DOMAIN);

    await expectNotBlocked(await context.newPage(), ALLOWED_DOMAIN);
  });

  test("無効にしたサイトはブロックされない", async ({
    context,
    extensionId,
  }) => {
    const popup = await Popup.open(context, extensionId);
    await popup.addSite(BLOCKED_DOMAIN);
    const page = await context.newPage();
    await expectBlocked(page, BLOCKED_DOMAIN);

    await popup.toggle(BLOCKED_DOMAIN);

    await expectNotBlocked(page, BLOCKED_DOMAIN);
  });

  test("削除したサイトはブロックされない", async ({ context, extensionId }) => {
    const popup = await Popup.open(context, extensionId);
    await popup.addSite(BLOCKED_DOMAIN);
    const page = await context.newPage();
    await expectBlocked(page, BLOCKED_DOMAIN);

    await popup.remove(BLOCKED_DOMAIN);
    await expect(popup.item(BLOCKED_DOMAIN)).toHaveCount(0);

    await expectNotBlocked(page, BLOCKED_DOMAIN);
  });

  // #11: 部分一致のため、x.test を登録すると box.test もブロックされる。修正したら test.fail を外す
  test.fail(
    "登録したドメインを含む別のドメインはブロックされない",
    async ({ context, extensionId }) => {
      const popup = await Popup.open(context, extensionId);
      await popup.addSite("x.test");
      const page = await context.newPage();
      await expectBlocked(page, "x.test");

      await expectNotBlocked(page, "box.test");
    }
  );
});
