const path = require('path');
const glob = require('glob');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// let packageJson = JSON.parse(require('fs').readFileSync(process.env.npm_package_json).toString());
// let name = packageJson.name;
// let version = packageJson.version;

const config = {
  entry: {
    devtoolsPanel: './src/ui/DevtoolsPanel.tsx',
    popup: './src/ui/popup.tsx',
    devtools: './src/js/devtools.ts',
    background: './src/js/background.ts'
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: './devtools-panel.html',
      scriptLoading: 'module',
      template: './src/templates/react.html',
      chunks: ['devtoolsPanel'],
    }),
    new HtmlWebpackPlugin({
      filename: './popup.html',
      scriptLoading: 'module',
      template: './src/templates/react.html',
      chunks: ['popup'],
    }),
    new HtmlWebpackPlugin({
      filename: './devtools.html',
      scriptLoading: 'module',
      template: './src/templates/devtools.html',
      chunks: ['devtools'],
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: './src/manifest.json', to: './' },
        { from: './assets', to: './assets' },
      ],
    }),
  ],
  devtool: 'inline-source-map',
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  devServer: {
    static: './dist',
    devMiddleware: {
      writeToDisk: true
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        },
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.s[ac]ss$/i,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.png/,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    modules: [path.join(__dirname, 'node_modules')],
  },
  resolveLoader: {
    modules: [path.join(__dirname, 'node_modules')],
  },
};

module.exports = config;