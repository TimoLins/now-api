const path = require('path')
const webpack = require('webpack')
const nodeExternals = require('webpack-node-externals')

const nodeConfig = {
  entry: './src/index.js',
  target: 'node',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'node.js',
    libraryTarget: 'commonjs2'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      }
    ]
  },
  resolve: {
    modules: ['node_modules', path.resolve('./src')],
    alias: {
      'custom-webpack-alias-requestLib': 'request-promise-native',
      'custom-webpack-alias-getToken': 'platforms/node/get-token'
    }
  },
  externals: [nodeExternals()]
}

const srcConfig = {
  entry: [
    './src/index'
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'browser.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      },
      {
        test: /\.json$/,
        use: ['json-loader']
      }
    ]
  },
  devtool: 'source-map',
  plugins: [
    new webpack.NamedModulesPlugin(),
    new webpack.NoEmitOnErrorsPlugin()
  ],
  resolve: {
    modules: ['node_modules', path.resolve('./src')],
    alias: {
      'custom-webpack-alias-requestLib': 'browser-request',
      'custom-webpack-alias-getToken': 'platforms/browser/get-token'
    }
  }
}

// Shift off hot stuff
if (process.env.NODE_ENV === 'production') {
  srcConfig.devtool = 'false'
}

module.exports = [nodeConfig, srcConfig]
