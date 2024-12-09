/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

const path = require('path');
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
                exclude: /node_modules/
            },
            {
                test: /apl-wasm\.js$/,
                use: [{
                    loader: 'export-module',
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
            'export-module': path.resolve(__dirname, './export-module.js')
        }
    },
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'lib'),
        library: "AplRenderer",
        libraryTarget: "umd"
    },
    plugins: [
        new DtsPackerPlugin({require})
    ]
};
