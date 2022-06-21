import { SES } from "aws-sdk";
import { SendEmailRequest } from "aws-sdk/clients/ses";
import { Page } from "puppeteer-core";
import { DEFAULT_TIMEOUT, STOCKS_ARRAY, getBrowser } from "../config";
import { Stock } from "../entities/Stock";
import { StockScreenshotter } from "../entities/StockScreenshotter";

const ses = new SES();

async function printStocks() {
  const browser = await getBrowser();

  const page = await browser.newPage();
  await page.goto("https://br.tradingview.com/chart/");

  await waitPageLoad(page);

  await changeToLogView(page);

  await closeSideTab(page);

  const stockScreenshotter = new StockScreenshotter(page);
  const stockScreenshots = await stockScreenshotter.execute(STOCKS_ARRAY);

  await browser.close();

  await sendMail(stockScreenshots);
}

async function waitPageLoad(page: Page): Promise<void> {
  try {
    await page.waitForXPath('//span[@class="title-ccFPqsjV"]', {
      visible: true,
      timeout: DEFAULT_TIMEOUT,
    });
  } catch (error) {
    throw new Error("Error waiting for page to load: " + error);
  }
}

async function changeToLogView(page: Page): Promise<void> {
  try {
    const logButton = await page.waitForXPath(
      '//div[starts-with(@class, "item-sFd8og5Y button-9pA37sIi")]/div[@class="js-button-text text-9pA37sIi"]',
      { timeout: DEFAULT_TIMEOUT }
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
        timeout: DEFAULT_TIMEOUT,
      }
    );

    await barHider?.click();
  } catch (error) {
    throw new Error("Error closing the side tab: " + error);
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
        }"/><br>`;
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
