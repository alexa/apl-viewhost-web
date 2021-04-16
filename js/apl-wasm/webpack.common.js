/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

const path = require('path');
const webpack = require('webpack');
const DtsPackerPlugin = require('dts-packer').default;

module.exports = {
    entry: {
        "bundle": [
            './lib/apl-wasm.js',
            './src/index.ts'
        ]
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: path.resolve(__dirname, 'node_modules')
            },
            {
                test: /apl-wasm\.js$/,
                use: [{
                    loader: 'wasm-loader',
                    options: {
                        debug: true
                    }
                }]
            },
            {
                test: /\.ts$/,
                enforce: 'pre',
                loader: 'tslint-loader',
                options: {
                    emitErrors: true
                }
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    resolveLoader: {
        alias: {
            'wasm-loader': path.resolve(__dirname, './wasm-loader.js')
        }
    },
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'lib'),
        library: "AplRenderer",
        libraryTarget: "umd"
    },
    plugins: [
        new webpack.DefinePlugin({
            HLS_SUPPORT: false,
        }),
        new DtsPackerPlugin({require})
    ]
};
