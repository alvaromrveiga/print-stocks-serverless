import { Page } from "puppeteer-core";
import { DEFAULT_TIMEOUT } from "../config";

export class ChartInitializer {
  constructor(private page: Page) {}

  public async execute() {
    await this.waitPageLoad();

    await this.changeToLogView();

    await this.closeSideTab();

    await this.addDoubleExponentialMovingAverages();
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

  private async addDoubleExponentialMovingAverages(): Promise<void> {
    await this.openIndicatorsTab();

    await this.inputIndicator("EMA");

    await this.clickBestIndicatorMatch();
    await this.clickBestIndicatorMatch();

    await this.closeIndicatorsTab();

    await this.openIndicatorConfig(2);

    await this.changePeriodValue("72");

    await this.confirmIndicatorChanges();
  }

  private async openIndicatorsTab(): Promise<void> {
    try {
      const indicatorsTab = await this.page.waitForXPath(
        '//div[@id="header-toolbar-indicators"]',
        { timeout: DEFAULT_TIMEOUT }
      );

      await indicatorsTab?.click();
    } catch (error) {
      throw new Error(`Error opening the indicators tab: ` + error);
    }
  }

  private async inputIndicator(indicator: string): Promise<void> {
    try {
      const indicatorInput = await this.page.waitForXPath(
        '//input[@class="input-CcsqUMct"]',
        { timeout: DEFAULT_TIMEOUT }
      );

      await indicatorInput?.focus();

      await this.page.keyboard.type(indicator);
    } catch (error) {
      throw new Error(`Error inputting exponential moving average: ` + error);
    }
  }

  private async clickBestIndicatorMatch(): Promise<void> {
    try {
      await this.page.waitForXPath('(//div[@class="main-FkkXGK5n"])[1]', {
        timeout: DEFAULT_TIMEOUT,
      });

      await this.page.$eval("div.main-FkkXGK5n", (elem) =>
        (elem as HTMLElement).click()
      );
    } catch (error) {
      throw new Error(`Error clicking best indicator match: ` + error);
    }
  }

  private async closeIndicatorsTab(): Promise<void> {
    try {
      const closeButton = await this.page.waitForXPath(
        '//span[@class="close-tuOy5zvD"]',
        {
          timeout: DEFAULT_TIMEOUT,
        }
      );

      await closeButton?.click();
    } catch (error) {
      throw new Error(`Error closing indicators tab: ` + error);
    }
  }

  private async openIndicatorConfig(index: number = 1): Promise<void> {
    try {
      const indicator = await this.page.waitForXPath(
        `(//div[@class="sourcesWrapper-OYqjX7Sg"]//div[@class="titleWrapper-OYqjX7Sg"])[${index}]`,
        {
          timeout: DEFAULT_TIMEOUT,
        }
      );

      await indicator?.click();
      await indicator?.click();
    } catch (error) {
      throw new Error(`Error opening indicator ${index} config: ` + error);
    }
  }

  private async changePeriodValue(value: string): Promise<void> {
    try {
      const periodInput = await this.page.waitForXPath(
        '(//input[starts-with(@class, "input-uGWFLwEy")])[1]',
        {
          timeout: DEFAULT_TIMEOUT,
        }
      );

      await periodInput?.focus();
      await this.page.keyboard.type(value);
    } catch (error) {
      throw new Error(`Error changing period value: ` + error);
    }
  }

  private async confirmIndicatorChanges(): Promise<void> {
    try {
      const confirmButton = await this.page.waitForXPath(
        '//button[@name="submit" and starts-with(@class, "button-YKkCvwjV")]',
        {
          timeout: DEFAULT_TIMEOUT,
        }
      );

      await confirmButton?.click();
    } catch (error) {
      throw new Error(`Error confirming indicator changes: ` + error);
    }
  }
}
