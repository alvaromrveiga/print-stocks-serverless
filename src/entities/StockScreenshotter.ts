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
      await this.openStockSearch();

      await this.inputStock(stocks[i]);

      const bestStockMatch = await this.getLoadedBestStockMatch(stocks[i]);

      const stockDescriptionText = await this.getBestStockMatchDescription();

      await this.clickBestStockMatch(bestStockMatch);

      await this.waitStockChartLoad(stockDescriptionText);

      const screenshotUrl = await this.saveChartScreenshot(stocks[i]);

      const stock = new Stock(stocks[i], screenshotUrl);
      stockChartScreenshots.push(stock);
    }

    return stockChartScreenshots;
  }

  private async openStockSearch(): Promise<void> {
    try {
      const stockButton = await this.page.waitForXPath(
        '//div[@id="header-toolbar-symbol-search"]',
        { timeout: DEFAULT_TIMEOUT }
      );

      await stockButton?.click();
    } catch (error) {
      throw new Error("Error opening the stock search: " + error);
    }
  }

  private async inputStock(stock: string): Promise<void> {
    try {
      const inputStock = await this.page.waitForXPath(
        '//input[starts-with(@class, "search-RSKUFnp7")]',
        { timeout: DEFAULT_TIMEOUT }
      );

      await inputStock?.focus();

      await this.page.keyboard.type(stock);
    } catch (error) {
      throw new Error(`Error inputting the stock ${stock}: ` + error);
    }
  }

  private async getLoadedBestStockMatch(
    stock: string
  ): Promise<ElementHandle<Element>> {
    try {
      const stockBestMatch = await this.page.waitForXPath(
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

  private async getBestStockMatchDescription(): Promise<string> {
    try {
      const stockDescription = await this.page.waitForXPath(
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
    stockDescriptionText: string
  ): Promise<void> {
    try {
      await this.page.waitForXPath(
        `//div[starts-with(@class, "title-OYqjX7Sg mainTitle-OYqjX7Sg") and text()="${stockDescriptionText}"]`,
        { timeout: DEFAULT_TIMEOUT }
      );
    } catch (error) {
      throw new Error(`Error waiting for stock chart to load: ` + error);
    }
  }

  private async saveChartScreenshot(stock: string): Promise<string> {
    try {
      await this.moveMouseOutsideScreenshotView();

      const chartTable = await this.page.waitForXPath(
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

  private async moveMouseOutsideScreenshotView() {
    try {
      await this.page.mouse.move(0, 0);
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
