// It's ok to set this to a high value to avoid flakiness. The timeouts
// are set on Selenium anyway.
jest.setTimeout(100000);

// serializer for requests
expect.addSnapshotSerializer({
  print([url, { body, method }], serialize) {
    try {
      // eslint-disable-next-line no-param-reassign
      body = JSON.parse(body);
    } catch (e) {
      // skip if not parsable
    }
    return serialize({
      body,
      method,
      url,
    });
  },

  test(value) {
    return (
      value &&
      value.length === 2 &&
      typeof value[0] === 'string' &&
      value[0].startsWith('http')
    );
  },
});
