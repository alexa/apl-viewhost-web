const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    mode: 'development',
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                enforce: 'post',
                test: /\.tsx?$/,
                use: 'istanbul-instrumenter-loader',
                exclude: /node_modules/
            },
            {
                test: /\.[jt]sx?$/,
                use: ["source-map-loader"],
                enforce: "pre"
            }
        ]
    }
});