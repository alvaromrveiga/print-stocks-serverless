import { ElementHandle, Page } from "puppeteer-core";
import { defaultTimeout, getBrowser, stocksArray } from "../config";

async function printStocks() {
  const browser = await getBrowser();

  const page = await browser.newPage();
  await page.goto("https://br.tradingview.com/chart/");

  await waitPageLoad(page);

  await changeToLogView(page);

  await closeSideTab(page);

  for (let i = 0; i < stocksArray.length; i++) {
    await openStockSearch(page);

    await inputStock(page, stocksArray[i]);

    const bestStockMatch = await getLoadedBestStockMatch(page, stocksArray[i]);

    const stockDescriptionText = await getBestStockMatchDescription(page);

    await clickBestStockMatch(bestStockMatch);

    await waitStockChartLoad(page, stockDescriptionText);

    console.log(stockDescriptionText);

    // await screenshotChart(page);
  }

  await browser.close();
}

async function waitPageLoad(page: Page): Promise<void> {
  try {
    await page.waitForXPath('//span[@class="title-ccFPqsjV"]', {
      visible: true,
      timeout: defaultTimeout,
    });
  } catch (error) {
    throw new Error("Error waiting for page to load: " + error);
  }
}

async function changeToLogView(page: Page): Promise<void> {
  try {
    const logButton = await page.waitForXPath(
      '//div[starts-with(@class, "item-sFd8og5Y button-9pA37sIi")]/div[@class="js-button-text text-9pA37sIi"]',
      { timeout: defaultTimeout }
    );

    await logButton?.click();
  } catch (error) {
    throw new Error("Error changing chart to Logarithmic view: " + error);
  }
}

async function closeSideTab(page: Page): Promise<void> {
  try {
    const barHider = await page.waitForXPath(
      '//div[@class="widgetbar-hider"]',
      {
        timeout: defaultTimeout,
      }
    );

    await barHider?.click();
  } catch (error) {
    throw new Error("Error closing the side tab: " + error);
  }
}

async function openStockSearch(page: Page): Promise<void> {
  try {
    const stockButton = await page.waitForXPath(
      '//div[@id="header-toolbar-symbol-search"]',
      { timeout: defaultTimeout }
    );

    await stockButton?.click();
  } catch (error) {
    throw new Error("Error opening the stock search: " + error);
  }
}

async function inputStock(page: Page, stock: string): Promise<void> {
  try {
    const inputStock = await page.waitForXPath(
      '//input[starts-with(@class, "search-RSKUFnp7")]',
      { timeout: defaultTimeout }
    );

    await inputStock?.focus();

    await page.keyboard.type(stock);
  } catch (error) {
    throw new Error(`Error inputting the stock ${stock}: ` + error);
  }
}

async function getLoadedBestStockMatch(
  page: Page,
  stock: string
): Promise<ElementHandle<Element>> {
  try {
    const stockBestMatch = await page.waitForXPath(
      `//div[starts-with(@class, "symbolTitle-uhHv1IHJ")][1]/span/em[text()="${stock}"]`,
      { timeout: defaultTimeout }
    );

    return stockBestMatch!;
  } catch (error) {
    throw new Error(
      `Error getting loaded best stock match for ${stock}: ` + error
    );
  }
}

async function getBestStockMatchDescription(page: Page): Promise<string> {
  try {
    const stockDescription = await page.waitForXPath(
      `//div[starts-with(@class, "symbolDescription-uhHv1IHJ")][1]`,
      { timeout: defaultTimeout }
    );

    const stockDescriptionText = await (
      await stockDescription?.getProperty("innerText")
    )?.jsonValue();

    return stockDescriptionText as string;
  } catch (error) {
    throw new Error(`Error getting the best stock match description: ` + error);
  }
}

async function clickBestStockMatch(
  bestStockMatch: ElementHandle<Element>
): Promise<void> {
  try {
    await bestStockMatch?.click();
  } catch (error) {
    throw new Error(`Error clicking the best stock match: ` + error);
  }
}

async function waitStockChartLoad(
  page: Page,
  stockDescriptionText: string
): Promise<void> {
  try {
    await page.waitForXPath(
      `//div[starts-with(@class, "title-OYqjX7Sg mainTitle-OYqjX7Sg") and text()="${stockDescriptionText}"]`,
      { timeout: defaultTimeout }
    );
  } catch (error) {
    throw new Error(`Error waiting for stock chart to load: ` + error);
  }
}

async function screenshotChart(page: Page): Promise<void> {
  try {
    await moveMouseOutsideScreenshotView(page);

    const chartTable = await page.waitForXPath(
      '//table[@class="chart-markup-table"]',
      { timeout: defaultTimeout }
    );

    await chartTable?.screenshot({
      path: "tmp/example" + new Date().toISOString() + ".png",
    });
  } catch (error) {
    throw new Error(`Error taking a screenshot of the chart: ` + error);
  }
}

async function moveMouseOutsideScreenshotView(page: Page) {
  try {
    await page.mouse.move(0, 0);
  } catch (error) {
    throw new Error(
      `Error moving the mouse outside the screenshot view: ` + error
    );
  }
}

export const handler = printStocks;
