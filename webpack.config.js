module.exports = {
  entry: './src/index.js',
  output: {
    filename: './dist/js-data-cordova-sqlite.js',
    libraryTarget: 'commonjs2',
    library: 'js-data-cordova-sqlite'
  },
  externals: [
    'mout',
    'js-data',
    'squel'
  ],
  module: {
    loaders: [
      {
        test: /(src)(.+)\.js$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          presets: ['es2015']
        }
      }
    ]
  }
};
