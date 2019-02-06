/**
 * the upstream types are for v3, this adds the necessary support for v4-alpha
 */

import { ActionSequence, WebDriver } from 'selenium-webdriver';
import { Origin } from 'selenium-webdriver/lib/input';

declare module 'selenium-webdriver' {
  export interface WebDriver extends WebDriver {
    actions(config: { bridge: boolean }): ActionSequence;
  }

  export interface Options {
    setTimeouts(a: {
      implicit?: number;
      pageLoad?: number;
      script?: number;
    }): Promise<undefined>;
  }

  export interface ActionSequence extends ActionSequence {
    move(config: {
      x: number;
      y: number;
      duration: number;
      origin: Origin;
    }): ActionSequence;
  }
}
