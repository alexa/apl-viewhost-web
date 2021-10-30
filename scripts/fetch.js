#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

const artifactUrl = 'https://d1gkjrhppbyzyh.cloudfront.net/apl-viewhost-web/B07C7BCD-6E2F-409F-BC86-70E18AE4C5CC/index.js';

const outputFilePath = 'index.js';
const outputFile = fs.createWriteStream(outputFilePath);

https.get(artifactUrl, (response) => {
    response.pipe(outputFile);
}).on('error', (e) => {
    throw Error(`Failed to fetch apl-viewhostweb-artifact: ${e}`);
});
