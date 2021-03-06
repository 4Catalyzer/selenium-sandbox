import {
  Builder,
  By,
  IWebElement,
  WebDriver,
  until,
} from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import { Origin } from 'selenium-webdriver/lib/input';
import { FileDetector } from 'selenium-webdriver/remote';

import { Context, STARTUP_STORAGE_KEY } from '../browser';

const DEFAULT_WAIT_TIMEOUT = 1000 * 10;

export interface Config {
  baseUrl: string;
  seleniumAddress: string;
  browserName: 'chrome';
  headless: boolean;
  screenSize: [number, number];
  waitTimeout?: number;
  mobileEmulation?: {
    deviceName: string;
  };
}

export function augmentDriver<T>(driver: WebDriver, baseUrl: string) {
  const getBase = driver.get.bind(driver);
  let waitTimeout = DEFAULT_WAIT_TIMEOUT;

  return Object.assign(driver, {
    get: (urlPath: string) => getBase(`${baseUrl}${urlPath}`),

    waitForAllImages: () =>
      driver.wait(
        driver.executeAsyncScript(`
              var args = [].slice.call(arguments)
              var result = (function () {
                const done = args[args.length - 1]
                function isComplete(i) { return i.complete; }
                function handler() {
                  const images = [].slice.call(document.images);
                  if (images.every(isComplete)) {
                    done();
                  } else {
                    setTimeout(handler, 10);
                  }
                }
                handler();
              })()
              return result;
              `),
        waitTimeout,
        'images never loaded',
      ),

    find: async (selector: string) => {
      const element = await driver.wait(
        until.elementLocated(By.xpath(selector)),
        waitTimeout,
        `element ${selector} not located`,
      );
      await driver.wait(
        until.elementIsVisible(element),
        waitTimeout,
        `element ${selector} not located`,
      );
      await (driver as AugmentedDriver<T>).waitForAllImages();
      await driver.sleep(50);
      return element;
    },

    // sometimes selenium click will not work in the case where target
    // element is covered by another element
    // https://github.com/angular/protractor/issues/2139
    click: async (element: IWebElement, attempts = 100) => {
      try {
        await element.click();
      } catch (e) {
        if (attempts > 0) {
          await driver.sleep(100);
          await (driver as AugmentedDriver<T>).click(element, attempts - 1);
        } else {
          throw e;
        }
      }

      // This is to avoid mouse staying on the button, sporadically
      // triggering the hover style when taking screenshots.
      await driver
        .actions({ bridge: true })
        .move({
          x: 0,
          y: 0,
          duration: 1,
          origin: Origin.VIEWPORT,
        })
        .perform();
    },

    executeInBrowser: <TRet>(
      func: (ctx: Context<T>) => TRet,
    ): PromiseLike<TRet> =>
      driver.executeScript(`return window.withTestContext(${func})`),

    executeAtStartup: (func: (ctx: Context<T>) => void) =>
      driver.executeScript(
        `return window.localStorage.setItem('${STARTUP_STORAGE_KEY}', (${func}))`,
      ),

    getRequests: () =>
      (driver as AugmentedDriver<T>).executeInBrowser(({ fetchMock }) =>
        fetchMock.calls(),
      ),

    getLastRequest: () =>
      (driver as AugmentedDriver<T>).executeInBrowser(({ fetchMock }) =>
        fetchMock.lastCall(),
      ),

    setTimeouts: async (timeout: number) => {
      waitTimeout = timeout;
      await driver.manage().setTimeouts({
        implicit: 0,
        pageLoad: waitTimeout,
        script: waitTimeout,
      });
    },
  });
}

export async function buildDriver(config: Config) {
  const builder = new Builder()
    .usingServer(config.seleniumAddress)
    .forBrowser(config.browserName);

  const [width, height] = config.screenSize;

  if (config.browserName === 'chrome') {
    let options = new chrome.Options().windowSize({ height, width });
    options = config.mobileEmulation
      ? options.setMobileEmulation(config.mobileEmulation)
      : options;
    options = config.headless ? options.headless() : options;
    builder.setChromeOptions(options);
  }

  const driver = await builder.build();

  // Needed to test file upload with remote webdriver
  // https://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/remote/index_exports_FileDetector.html
  driver.setFileDetector(new FileDetector());

  const augmentedDriver = augmentDriver(driver, config.baseUrl);
  await augmentedDriver.setTimeouts(
    config.waitTimeout || DEFAULT_WAIT_TIMEOUT,
  );

  return augmentedDriver;
}

// XXX the only reason for this class to exist is to be able to extract
// AugmentedDriver correctly and keep generic inference over T
// eslint-disable-next-line @typescript-eslint/naming-convention
class __INTERNAL__DriverAugmenterFactory<T> {
  augmentDriver(driver: WebDriver, baseUrl: string) {
    return augmentDriver<T>(driver, baseUrl);
  }
}

export type AugmentedDriver<T> = ReturnType<
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __INTERNAL__DriverAugmenterFactory<T>['augmentDriver']
>;
