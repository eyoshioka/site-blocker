import type { BrowserContext, Locator, Page } from "@playwright/test";

// ポップアップの操作をまとめる
export class Popup {
  private constructor(private readonly page: Page) {}

  static async open(
    context: BrowserContext,
    extensionId: string
  ): Promise<Popup> {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    return new Popup(page);
  }

  async addSite(domain: string): Promise<void> {
    await this.page.locator("#url-input").fill(domain);
    await this.page.locator("#add-btn").click();
  }

  item(domain: string): Locator {
    return this.page.locator("#site-list li").filter({ hasText: domain });
  }

  async toggle(domain: string): Promise<void> {
    await this.item(domain).getByRole("checkbox").click();
  }

  async remove(domain: string): Promise<void> {
    await this.item(domain).getByRole("button", { name: "削除" }).click();
  }
}
