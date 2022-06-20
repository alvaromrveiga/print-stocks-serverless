import { S3, SES } from "aws-sdk";
import { SendEmailRequest } from "aws-sdk/clients/ses";
import { ElementHandle, Page } from "puppeteer-core";
import { defaultTimeout, getBrowser, stocksArray } from "../config";
import { Stock } from "../entities/Stock";

const s3 = new S3();
const ses = new SES();

async function printStocks() {
  const browser = await getBrowser();

  const page = await browser.newPage();
  await page.goto("https://br.tradingview.com/chart/");

  await waitPageLoad(page);

  await changeToLogView(page);

  await closeSideTab(page);

  let stockChartScreenshots: Stock[] = [];

  for (let i = 0; i < stocksArray.length; i++) {
    await openStockSearch(page);

    await inputStock(page, stocksArray[i]);

    const bestStockMatch = await getLoadedBestStockMatch(page, stocksArray[i]);

    const stockDescriptionText = await getBestStockMatchDescription(page);

    await clickBestStockMatch(bestStockMatch);

    await waitStockChartLoad(page, stockDescriptionText);

    const screenshotUrl = await saveChartScreenshot(page, stocksArray[i]);

    const stock = new Stock(stocksArray[i], screenshotUrl);
    stockChartScreenshots.push(stock);
  }

  await browser.close();

  await sendMail(stockChartScreenshots);
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

async function saveChartScreenshot(page: Page, stock: string): Promise<string> {
  try {
    await moveMouseOutsideScreenshotView(page);

    const chartTable = await page.waitForXPath(
      '//table[@class="chart-markup-table"]',
      { timeout: defaultTimeout }
    );

    const buffer = (await chartTable?.screenshot()) as Buffer;

    const screenshotUrl = await saveScreenshot(buffer, stock);

    return screenshotUrl;
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

async function saveScreenshot(buffer: Buffer, stock: string): Promise<string> {
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

    const s3Result = await s3
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

async function sendMail(stockChartScreenshots: Stock[]) {
  try {
    const today = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const emailText = stockChartScreenshots.reduce((accumulator, stock) => {
      accumulator += stock.name.toUpperCase() + ": " + stock.url + "\n";
      return accumulator;
    }, "");

    const emailHtmlContent = stockChartScreenshots.reduce(
      (accumulator, stock) => {
        accumulator += `<h2>${stock.name.toUpperCase()}:</h2> <img src="${
          stock.url
        }" alt="${stock.url}"/><br>`;
        return accumulator;
      },
      ""
    );

    const emailHtml = `<html><body>${emailHtmlContent}</body></html>`;

    const params: SendEmailRequest = {
      Source: process.env.SENDER_EMAIL!,
      Destination: { ToAddresses: [process.env.RECEIVER_EMAIL!] },
      Message: {
        Subject: { Data: `${today} stocks` },
        Body: {
          Text: {
            Data: emailText,
            Charset: "utf-8",
          },
          Html: {
            Data: emailHtml,
            Charset: "utf-8",
          },
        },
      },
    };

    await ses.sendEmail(params).promise();
  } catch (error) {
    throw new Error(`Error sending email in AWS SES: ` + error);
  }
}

export const handler = printStocks;
