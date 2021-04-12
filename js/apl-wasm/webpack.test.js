/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

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