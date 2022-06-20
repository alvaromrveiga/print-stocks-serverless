import chromium from "chrome-aws-lambda";
import {
  BrowserConnectOptions,
  BrowserLaunchArgumentOptions,
  LaunchOptions,
  Viewport,
} from "puppeteer-core";

const windowSize: Viewport = {
  width: 1000,
  height: 500,
};

const browserConfig: LaunchOptions &
  BrowserLaunchArgumentOptions &
  BrowserConnectOptions = {
  headless: chromium.headless,
  ignoreHTTPSErrors: true,
  args: [
    `--window-size=${windowSize.width},${windowSize.width}`,
    ...chromium.args,
  ],
  defaultViewport: windowSize,
};

export async function getBrowser() {
  try {
    return chromium.puppeteer.launch({
      ...browserConfig,
      executablePath: await chromium.executablePath,
    });
  } catch (error) {
    throw new Error("Error initializing the browser: " + error);
  }
}
