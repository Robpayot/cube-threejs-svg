const webpack = require('webpack')
const path = require('path')
const globImporter = require('node-sass-glob-importer')

const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')

const IS_PROD = process.env.NODE_ENV === 'production'
const ASSETS_URL = '/cube-threejs-svg/assets/'

const PATHS = {
  SRC_DIR: path.resolve(__dirname, 'src/_webpack'),
  ASSET_SRC_DIR: path.resolve(__dirname, 'src/_webpack/assets/'),
  ASSET_OUTPUT_DIR: path.resolve(__dirname, 'src/assets'),
  COMPONENTS: path.resolve(__dirname, 'src/_includes/_components/'),
  SCSS_DIR: path.resolve(__dirname, 'src/_webpack/scss/'),
  JS_DIR: path.resolve(__dirname, 'src/_webpack/js/'),
}

module.exports = {
  entry: {
    main: path.resolve(PATHS.SRC_DIR, 'js/main.js'),
  },
  output: {
    path: PATHS.ASSET_OUTPUT_DIR,
    filename: IS_PROD ? '[name].min.js' : '[name].js',
    publicPath: ASSETS_URL,
  },
  resolve: {
    alias: {
      _js: PATHS.JS_DIR,
      _components: PATHS.COMPONENTS,
      _scss: PATHS.SCSS_DIR,
      _assets: PATHS.ASSET_SRC_DIR,
    },
  },
  optimization: {
    splitChunks: false,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
          },
        },
      }),
      new OptimizeCSSAssetsPlugin({}),
    ],
  },
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'eslint-loader',
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'].map(require.resolve),
            plugins: [
              '@babel/plugin-transform-spread',
              '@babel/plugin-proposal-class-properties',
            ],
          },
        },
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                importer: globImporter(),
                includePaths: [
                  // SCSS Files can be both in modules and scss folder
                  PATHS.SCSS_DIR,
                  PATHS.COMPONENTS,
                ],
              },
            },
          },
        ],
      },
      {
        // Write images to the images folder
        test: /assets\/images\/.*?\.(png|jpg|svg|gif)$/,
        use: [{
          loader: 'file-loader',
          options: {
            outputPath: 'images',
          },
        }],
      },
      {
        test: /assets\/cube\/.*?\.obj$/,
        use: [{
          loader: 'file-loader',
          options: {
            outputPath: 'cube',
          },
        }],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: IS_PROD ? '[name].min.css' : '[name].css',
    }),
    new webpack.DefinePlugin({
      IS_PROD,
      IS_DEV: !IS_PROD,
    }),
    new CopyPlugin([
      { from: `${PATHS.ASSET_SRC_DIR}/images/`, to: `${PATHS.ASSET_OUTPUT_DIR}/images/` },
    ]),
  ],
  devtool: !IS_PROD && 'source-map',
}
