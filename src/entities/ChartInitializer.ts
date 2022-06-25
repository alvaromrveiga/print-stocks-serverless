import { Page } from "puppeteer-core";
import { DEFAULT_TIMEOUT } from "../config";

export class ChartInitializer {
  constructor(private page: Page) {}

  public async execute() {
    await this.waitPageLoad();

    await this.changeToLogView();

    await this.closeSideTab();
  }

  private async waitPageLoad(): Promise<void> {
    try {
      await this.page.waitForXPath('//span[@class="title-ccFPqsjV"]', {
        visible: true,
        timeout: DEFAULT_TIMEOUT,
      });
    } catch (error) {
      throw new Error("Error waiting for page to load: " + error);
    }
  }

  private async changeToLogView(): Promise<void> {
    try {
      const logButton = await this.page.waitForXPath(
        '//div[starts-with(@class, "item-sFd8og5Y button-9pA37sIi")]/div[@class="js-button-text text-9pA37sIi"]',
        { timeout: DEFAULT_TIMEOUT }
      );

      await logButton?.click();
    } catch (error) {
      throw new Error("Error changing chart to Logarithmic view: " + error);
    }
  }

  private async closeSideTab(): Promise<void> {
    try {
      const barHider = await this.page.waitForXPath(
        '//div[@class="widgetbar-hider"]',
        { timeout: DEFAULT_TIMEOUT }
      );

      await barHider?.click();
    } catch (error) {
      throw new Error("Error closing the side tab: " + error);
    }
  }
}
