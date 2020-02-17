declare module 'jest-environment-node';

declare module '@4c/fetch-mock' {
  import fetchMock from 'fetch-mock';

  export = fetchMock;
}
