const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    mode: 'development',
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.[jt]sx?$/,
                use: ["source-map-loader"],
                enforce: "pre"
            }
        ]
    }
});