const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const path = require('path');

module.exports = {
    entry: {
        index: './src/index.js'
    },
    output: {
        path: path.join(__dirname, 'build'),
        filename: '[name].js'
    },
    optimization: {
        minimizer: [
            // new UglifyJsPlugin({
            //     sourceMap: true,
            //     test: /\.js($|\?)/i,
            //     parallel: true
            // })
        ]
    },
    // externals: ['puppeteer'],
    plugins: [
        new CopyWebpackPlugin([
            { from: 'src/html/', to: 'html/', force: true }
        ], {})
    ],
    target: 'node',
    watch: true
};