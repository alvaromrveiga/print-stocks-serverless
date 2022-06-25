import { SES } from "aws-sdk";
import { SendEmailRequest } from "aws-sdk/clients/ses";
import { getBrowser, STOCKS_ARRAY } from "../config";
import { ChartInitializer } from "../entities/ChartInitializer";
import { Stock } from "../entities/Stock";
import { StockScreenshotter } from "../entities/StockScreenshotter";

const ses = new SES();

async function printStocks() {
  const browser = await getBrowser();

  const page = await browser.newPage();
  await page.goto("https://br.tradingview.com/chart/");

  const chartInitializer = new ChartInitializer(page);
  await chartInitializer.execute();

  const stockScreenshotter = new StockScreenshotter(page);
  const stockScreenshots = await stockScreenshotter.execute(STOCKS_ARRAY);

  await browser.close();

  await sendMail(stockScreenshots);
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
