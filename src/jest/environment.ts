import { NodeEnvironment } from 'jest-environment-node';

import { AugmentedDriver, Config, buildDriver } from '../selenium';

export class SeleniumEnvironment extends NodeEnvironment {
  config: Config;
  global: {
    browser: AugmentedDriver<unknown>;
  };

  constructor(config: { testEnvironmentOptions: Config }) {
    super(config);
    this.global = this['global'] || {};
    this.config = config.testEnvironmentOptions;
  }

  async setup() {
    await super.setup();

    this.global.browser = await buildDriver(this.config);
  }

  async teardown() {
    const { browser } = this.global;
    if (browser) {
      // https://github.com/alexeyraspopov/jest-webdriver/issues/8
      try {
        await browser.close();
      } catch (e) {
        /* ignore */
      }

      // https://github.com/mozilla/geckodriver/issues/1151
      try {
        await browser.quit();
      } catch (e) {
        /* ignore */
      }
    }

    await super.teardown();
  }
}
