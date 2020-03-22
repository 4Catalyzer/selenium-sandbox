# selenium-sandbox

easily mock a web application accessed through selenium. Contains also an environment for integrating with jest.

## Getting started

### 0. Install

    yarn add -D @4c/selenium-sandbox

### 1. Add the sandbox to your test client

First, we need to instrument our application to use the sandbox environment. Create a module (let's call it `injectSandbox.js`)

```js
import sandbox from '@4c/selenium-sandbox/browser';

const store = {
  widgets: [],
};

// additional properties and methods that can be accessed from selenium. for example here we are passing a store object
const context = { store };

sandbox.setupTestContext(context);

sandbox.fetchMock.mock('path:/api/v1/widgets', () => store.widgets);
```

> **Note**: documentation for `fetchMock` can be found [here](https://github.com/wheresrhys/fetch-mock)

### 2. Instrument Selenium

Add utilities to an already existing selenium driver (v4):

```js
import { augmentDriver } from '@4c/selenium-sandbox/webdriver';

const driver = augmentDriver(
  myBaseSeleniumDriver,
  'http://sandboxed-app-to-test',
);
```

... Alternatively you can use buildDriver to instantiate a reasonably opinionated driver:

```js
import { buildDriver } from '@4c/selenium-sandbox/webdriver';

const driver = buildDriver(
  baseUrl: 'http://sandboxed-app-to-test';
  seleniumAddress: 'localhost:5000/wd/hub';
  browserName: 'chrome';
  screenSize: [1024, 768];
  // optional
  mobileEmulation: {
      deviceName: 'iPhone 6/7/8',
  };
);
```

### 3. Usage

To mock:

```js
await driver.get('my/page');
await driver.executeInBrowser(context => {
  context.store.widgets = [{label: '1', label: '2'}]
}

const button = await driver.find('//button[text()="Get Widgets"]');
await driver.click(button);
```

If a request needs to be mocked _before_ page loading, you can use `executeAtStartup` instead of `executeInBrowser`. the code will be stored in storage and executed when the assets are loaded

> **Note**: Since the function passed to `executeInBrowser` or `executeAtStartup` needs to be stringified in order to be executed in the remote browser, it cannot access variables defined outside of its body.

You can also access fetchMock from the context to make additional mocks:

```js
await driver.executeInBrowser(context => {
  context.fetchMock.mock('path:/api/v1/users', () => ['user1', 'user2'])
}
```

Since `fetchMock` is part of the context, it can be used to make assertions on the requests. There are two helper methods on the driver to facilitate that:

```js
const request = await driver.getLastRequest();
invariant(request.headers.Authorization == 'Bearer XXX');

const requests = await driver.getRequests();
invariant(requests.every((req) => req.headers.Authorization == 'Bearer XXX'));
```

the driver has also the following utilities methods:

```js
// more resilient than element.click, will retry several times to avoid flakiness
await driver.click(element);

// accepts an xpath query and returns the first match. It will wait that all
// images are loaded and that the element is indeed visible
await driver.find('//button[text()="Get Widgets"]');

// unlike the base webdriver, allows to pass a path which is concatenated
// to `baseUrl`
await driver.get('my/page');

// the name says it all. Useful to make sure the page has finished rendering
await driver.waitForAllImages();
```

## Jest Support

There is also support for easy integration with Jest.

### Environment

add the following line to your jest config:

```js
{
  // ...
  testEnvironment: '@4c/selenium-sandbox/jest/environment.js',
  setupFilesAfterEnv: ['@4c/selenium-sandbox/jest/setup.js'],
  testEnvironmentOptions: {
    baseUrl: 'http://sandboxed-app-to-test',
    seleniumAddress: 'localhost:5000/wd/hub',
    browserName: 'chrome',
    screenSize: [1024, 768],
    // optional
    mobileEmulation: {
        deviceName: 'iPhone 6/7/8',
    },
    // optional, default 10000
    waitTimeout: 50000,
  },
}
```

this will:

- declare a global `browser` variable as described above
- set a 10s timeout which is a better fit for selenium tests
- add a snapshot serializer specific to fetchMock requests

## TypeScript Support

Type definitions come out of the box. For full jest support, you should add the following declaration to be used in your test file:

```ts
import { AugmentedDriver } from '@4c/selenium-sandbox/webdriver';

// define a context type that reflects the context passed in `setupTestContext`
type Context = {
  store: {
    widgets: {}[];
  };
};

declare const browser: AugmentedDriver<Context>;
```
