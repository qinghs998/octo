/**
 * @since 2016-05-29 10:50
 * @author vivaxy
 */

const path = require('path');
const glob = require('glob');
const webpack = require('webpack');
const numeral = require('numeral');
const logUpdate = require('log-update');
const autoprefixer = require('autoprefixer');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const config = require('./config');

const DEVELOPMENT_IP = config.DEVELOPMENT_IP;
const DEVELOPMENT_PORT = config.DEVELOPMENT_PORT;
const RELEASE_PATH = config.RELEASE_PATH;
const SOURCE_PATH = 'src';
const DEVELOPMENT = 'development';
const PRODUCTION = 'production';
const NODE_MODULES = 'node_modules';
const ENTRIES_FOLDER = 'entries';
const HTML_FOLDER = 'html';
const COMMON_CHUNK_NAME = 'common';

const BANNER = '@2016 vivaxy';
const baseDir = path.join(__dirname, '..');

const NODE_ENV = process.env.NODE_ENV || PRODUCTION;

const postcssLoader = {
    loader: 'postcss-loader',
    options: {
        plugins: () => {
            return [
                autoprefixer,
            ];
        },
    },
};

const eslintRule = {
    enforce: 'pre',
    test: /\.js$/,
    include: [
        path.resolve(baseDir, SOURCE_PATH),
    ],
    loader: 'eslint-loader',
};

const jsRule = {
    test: /\.js$/,
    include: [
        path.resolve(baseDir, SOURCE_PATH),
    ],
    use: [
        'babel-loader',
    ],
};

const cssRule = {
    test: /\.css$/,
    include: [
        path.resolve(baseDir, SOURCE_PATH),
    ],
    use: [
        'style-loader',
        'css-loader',
        postcssLoader,
    ],
};

const cssModuleRule = {
    test: /\.css$/,
    include: [
        path.resolve(baseDir, NODE_MODULES),
    ],
    use: [
        'style-loader',
        'css-loader',
        postcssLoader,
    ],
};

const lessRule = {
    test: /\.less$/,
    include: [
        path.resolve(baseDir, SOURCE_PATH),
    ],
    use: [
        'style-loader',
        'css-loader',
        postcssLoader,
        'less-loader',
    ],
};

const lessModuleRule = {
    test: /\.less$/,
    include: [
        path.resolve(baseDir, NODE_MODULES),
    ],
    use: [
        'style-loader',
        'css-loader',
        postcssLoader,
        'less-loader',
    ],
};

const fileRule = {
    test: /\.(png|jpg|gif)$/,
    use: [
        {
            loader: 'url-loader',
            options: {
                limit: 8192,
                name: 'images/[name]-[hash].[ext]',
            },
        },
    ],
};

// default webpack config
const webpackConfig = {
    entry: {
    },
    output: {
        path: path.resolve(baseDir, RELEASE_PATH),
        filename: 'js/[name].js',
        publicPath: '../',
    },
    module: {
        rules: [
            eslintRule,
            jsRule,
            cssRule,
            lessRule,
            fileRule,
            cssModuleRule,
            lessModuleRule,
        ],
    },
    plugins: [
        new webpack.EnvironmentPlugin([
            'NODE_ENV',
        ]),
        new webpack.optimize.CommonsChunkPlugin({
            names: [COMMON_CHUNK_NAME],
            // pages rests in different folder levels
            filename: 'js/[name].js',
            minChunks: 2, // Infinity
        }),
        new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: 'report.html',
            openAnalyzer: false,
        }),
        new webpack.NamedModulesPlugin(),
        new webpack.ProgressPlugin((percentage, msg) => {
            logUpdate('     progress:', numeral(percentage).format('00.00%'), msg);
        }),
    ],
};

// get entry
const entryFileNameList = glob.sync(`${path.join(SOURCE_PATH, ENTRIES_FOLDER)}/*.js`);
const entryNameList = entryFileNameList.map((entryFileName) => {
    return path.basename(entryFileName, '.js');
});

// get corresponding html template
const htmlFileNameList = glob.sync(`${path.join(SOURCE_PATH, HTML_FOLDER)}/*.html`);
const htmlNameList = htmlFileNameList.map((htmlFileName) => {
    return path.basename(htmlFileName, '.html');
});

// set entry
entryNameList.forEach((entryName) => {
    webpackConfig.entry[entryName] = [
        path.join(baseDir, `./${SOURCE_PATH}/${ENTRIES_FOLDER}/${entryName}.js`),
    ];

    let htmlTemplateName = 'index';
    if (htmlNameList.indexOf(entryName) !== -1) {
        htmlTemplateName = entryName;
    }

    webpackConfig.plugins.push(new HtmlWebpackPlugin({
        template: `${SOURCE_PATH}/${HTML_FOLDER}/${htmlTemplateName}.html`,
        filename: `${HTML_FOLDER}/${entryName}.html`,
        hash: true,
        inject: 'body',
        chunks: [
            COMMON_CHUNK_NAME,
            entryName,
        ],
    }));
});

// set config according to environment
switch (NODE_ENV) {
    case DEVELOPMENT:

        // support react-hot-loader@3, @see https://github.com/gaearon/react-hot-loader/tree/next-docs
        jsRule.use.push('react-hot-loader/webpack');

        entryNameList.forEach((entryName) => {
            webpackConfig.entry[entryName]
                .unshift(`webpack-dev-server/client?http://${DEVELOPMENT_IP}:${DEVELOPMENT_PORT}`);
            webpackConfig.entry[entryName].unshift('webpack/hot/log-apply-result');

            // hot reload
            // webpackConfig.entry[entryName].unshift('webpack/hot/dev-server');
            webpackConfig.entry[entryName].unshift('webpack/hot/only-dev-server');

            // support react-hot-loader@3, @see https://github.com/gaearon/react-hot-loader/tree/next-docs
            webpackConfig.entry[entryName].unshift('react-hot-loader/patch');
        });

        webpackConfig.devtool = 'eval';

        webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin());
        webpackConfig.plugins.push(new webpack.NoEmitOnErrorsPlugin());
        break;
    default:
        webpackConfig.devtool = 'source-map';
        webpackConfig.plugins.push(new webpack.BannerPlugin({
            banner: BANNER,
        }));
        webpackConfig.plugins.push(new webpack.optimize.UglifyJsPlugin({
            sourceMap: true,
        }));
        break;
}

module.exports = webpackConfig;
