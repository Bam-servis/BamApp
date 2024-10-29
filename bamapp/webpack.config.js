const path = require("path");

module.exports = {
  // другие настройки...
  resolve: {
    fallback: {
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      path: require.resolve("path-browserify"),
      zlib: require.resolve("browserify-zlib"),
      querystring: require.resolve("querystring-es3"),
      buffer: require.resolve("buffer/"),
      url: require.resolve("url/"),
      fs: false,
      net: false,
      http: require.resolve("stream-http"),
      https: require.resolve("https-browserify"),
    },
  },
};
