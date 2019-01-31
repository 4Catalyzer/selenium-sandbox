module.exports = api => ({
  presets: [
    [
      '@4c/4catalyzer',
      {
        target: 'node',
        modules: api.env() === 'esm' ? false : 'commonjs'
      },
    ],'@babel/preset-typescript',]
});
