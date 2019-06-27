import fetchMock from '@4c/fetch-mock';

declare const window: any;

export const STARTUP_STORAGE_KEY = 'selenium-context-test-startup';

export type Context<T> = T & { fetchMock: typeof fetchMock };

function setupTestContext<T>(context: T) {
  fetchMock.config.fallbackToNetwork = true;
  fetchMock.config.warnOnFallback = true;

  window.withTestContext = (func: (context: Context<T>) => void) =>
    func({ fetchMock, ...context });

  const startupCode = window.localStorage.getItem(STARTUP_STORAGE_KEY);
  if (startupCode) {
    // eslint-disable-next-line no-eval
    window.withTestContext(eval(startupCode));
    window.localStorage.removeItem(STARTUP_STORAGE_KEY);
  }
}

export default {
  setupTestContext,
  fetchMock,
};
