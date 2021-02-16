# Alexa Presentation Language (APL) Viewhost Web


## Introduction

The APL ViewHost Web is language-specific APL "view host", which is responsible for performing the rendering in the Web
platform or framework for which the view host was designed by leveraging the functionality and support from [APL Core library](https://github.com/alexa/apl-core-library).

## Installation

### Prerequisites

* [NodeJS](https://nodejs.org/en/) - version 10.x or higher
* [cmake](https://cmake.org/install/) - the easiest way to install on Mac is using `brew install cmake`
* [Yarn](https://yarnpkg.com/getting-started/install)

### Installation Steps
The easiest way to use apl-viewhost-web is to install it from npm and build it into your app with webpack.

```
npm install apl-viewhost-web
```

**note**: The package install will pull and build [APL Core library](https://github.com/alexa/apl-core-library) locally,
this make take a while.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This project is licensed under the Apache-2.0 License.

