const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = function(env, argv) {
    let plugins = [];
    if(env && env.analyze) {
        plugins.push(new BundleAnalyzerPlugin());
    }
    return merge(common, {
        mode: 'production',
        plugins
    });
}