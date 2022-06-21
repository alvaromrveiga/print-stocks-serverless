if (!process.env.STOCKS) {
  throw new Error("There are no stocks in .env file");
}

const stocks = process.env.STOCKS;

const stocksWithoutSpaces = stocks?.replace(/\s/g, "");

export const STOCKS_ARRAY = stocksWithoutSpaces.split(",");
