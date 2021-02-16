# d.ts Packer

## Problem

When webpacking dependencies with typings that need to be exposed to external users, those typings need to be available to that user.

## Solution

This module is a webpack plugin. It searches through generated delaration files in `output.path` and looks for import and export statements that pull in external modules, for example

```javascript
import {Content, APLRenderer} from 'apl-html'
import APLHtml = require('apl-html')
export * from 'apl-html'
```

If it finds a module that defines any typings in its package.json then it pulls those typings into a new folder `${output.path}/@types` and transforms the reference in the original generated d.ts file. For example, the import and export statements above would transform as shown below from an expernal module reference to a relative path module reference.

```javascript
import {Content, APLRenderer} from '../@types/apl-html/lib/index'
import APLHtml = require('../../@types/apl-html/lib/index')
export * from './@types/apl-html/lib/index'
```

## Usage

Import the default from the package and add to the plugins section of your `webpack.js` file. For example:

```javascript
const DtsPackerPlugin = require('dts-packer').default;

module.exports = {
    entry: './src/index.ts',
    mode: 'development',
    devtool: 'inline-source-map',
    rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
    ],
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'lib'),
        library: "Foo"
    },
    plugins: [new DtsPackerPlugin({require})] // needs a reference to node's require statement
}

```

## TODO

* Should be able to work with `@types` modules, not just ones that define `types` or `typings` field in their `package.json`
* Handle tripple slash directives more elegantly. I.e. how are TSDs incorporated into TypeScript's AST.