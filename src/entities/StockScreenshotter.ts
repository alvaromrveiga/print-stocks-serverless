import { ElementHandle, Page } from "puppeteer-core";
import { Stock } from "./Stock";
import { DEFAULT_TIMEOUT } from "../config";
import { S3 } from "aws-sdk";

export class StockScreenshotter {
  private s3 = new S3();

  constructor(private page: Page) {}

  public async execute(stocks: string[]): Promise<Stock[]> {
    let stockChartScreenshots: Stock[] = [];

    for (let i = 0; i < stocks.length; i++) {
      await this.openStockSearch(this.page);

      await this.inputStock(this.page, stocks[i]);

      const bestStockMatch = await this.getLoadedBestStockMatch(
        this.page,
        stocks[i]
      );

      const stockDescriptionText = await this.getBestStockMatchDescription(
        this.page
      );

      await this.clickBestStockMatch(bestStockMatch);

      await this.waitStockChartLoad(this.page, stockDescriptionText);

      const screenshotUrl = await this.saveChartScreenshot(
        this.page,
        stocks[i]
      );

      const stock = new Stock(stocks[i], screenshotUrl);
      stockChartScreenshots.push(stock);
    }

    return stockChartScreenshots;
  }

  private async openStockSearch(page: Page): Promise<void> {
    try {
      const stockButton = await page.waitForXPath(
        '//div[@id="header-toolbar-symbol-search"]',
        { timeout: DEFAULT_TIMEOUT }
      );

      await stockButton?.click();
    } catch (error) {
      throw new Error("Error opening the stock search: " + error);
    }
  }

  private async inputStock(page: Page, stock: string): Promise<void> {
    try {
      const inputStock = await page.waitForXPath(
        '//input[starts-with(@class, "search-RSKUFnp7")]',
        { timeout: DEFAULT_TIMEOUT }
      );

      await inputStock?.focus();

      await page.keyboard.type(stock);
    } catch (error) {
      throw new Error(`Error inputting the stock ${stock}: ` + error);
    }
  }

  private async getLoadedBestStockMatch(
    page: Page,
    stock: string
  ): Promise<ElementHandle<Element>> {
    try {
      const stockBestMatch = await page.waitForXPath(
        `//div[starts-with(@class, "symbolTitle-uhHv1IHJ")][1]/span/em[text()="${stock}"]`,
        { timeout: DEFAULT_TIMEOUT }
      );

      return stockBestMatch!;
    } catch (error) {
      throw new Error(
        `Error getting loaded best stock match for ${stock}: ` + error
      );
    }
  }

  private async getBestStockMatchDescription(page: Page): Promise<string> {
    try {
      const stockDescription = await page.waitForXPath(
        `//div[starts-with(@class, "symbolDescription-uhHv1IHJ")][1]`,
        { timeout: DEFAULT_TIMEOUT }
      );

      const stockDescriptionText = await (
        await stockDescription?.getProperty("innerText")
      )?.jsonValue();

      return stockDescriptionText as string;
    } catch (error) {
      throw new Error(
        `Error getting the best stock match description: ` + error
      );
    }
  }

  private async clickBestStockMatch(
    bestStockMatch: ElementHandle<Element>
  ): Promise<void> {
    try {
      await bestStockMatch?.click();
    } catch (error) {
      throw new Error(`Error clicking the best stock match: ` + error);
    }
  }

  private async waitStockChartLoad(
    page: Page,
    stockDescriptionText: string
  ): Promise<void> {
    try {
      await page.waitForXPath(
        `//div[starts-with(@class, "title-OYqjX7Sg mainTitle-OYqjX7Sg") and text()="${stockDescriptionText}"]`,
        { timeout: DEFAULT_TIMEOUT }
      );
    } catch (error) {
      throw new Error(`Error waiting for stock chart to load: ` + error);
    }
  }

  private async saveChartScreenshot(
    page: Page,
    stock: string
  ): Promise<string> {
    try {
      await this.moveMouseOutsideScreenshotView(page);

      const chartTable = await page.waitForXPath(
        '//table[@class="chart-markup-table"]',
        { timeout: DEFAULT_TIMEOUT }
      );

      const buffer = (await chartTable?.screenshot()) as Buffer;

      const screenshotUrl = await this.saveScreenshot(buffer, stock);

      return screenshotUrl;
    } catch (error) {
      throw new Error(`Error taking a screenshot of the chart: ` + error);
    }
  }

  private async moveMouseOutsideScreenshotView(page: Page) {
    try {
      await page.mouse.move(0, 0);
    } catch (error) {
      throw new Error(
        `Error moving the mouse outside the screenshot view: ` + error
      );
    }
  }

  private async saveScreenshot(buffer: Buffer, stock: string): Promise<string> {
    try {
      const now = new Date()
        .toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
        .replace(/\//g, "-");

      const s3Result = await this.s3
        .upload({
          Bucket: process.env.BUCKET_NAME!,
          Key: `${stock}-${now}.png`,
          Body: buffer,
          ContentType: "image/png",
        })
        .promise();

      return s3Result.Location;
    } catch (error) {
      throw new Error(`Error saving screenshot in AWS S3: ` + error);
    }
  }
}
