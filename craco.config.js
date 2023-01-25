const webpack = require('webpack');
module.exports = {
  webpack: {
    configure: (config, { env, paths }) => {
      // eslint-disable-next-line no-param-reassign
      config.resolve.fallback = {
        fs: require.resolve('fs'),
        'process/browser': require.resolve('process/browser'),
      };
      config.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
        })
      );
      return config;
    },
  },
};
