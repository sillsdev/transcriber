const webpack = require('webpack');
module.exports = {
  webpack: {
    configure: (config, { env, paths }) => {
      // eslint-disable-next-line no-param-reassign
      config.resolve.fallback = {
        fs: require.resolve('fs'),
        'orgiginal-fs': require.resolve('original-fs'),
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
