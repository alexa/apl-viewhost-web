#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

const artifactUrl = 'https://d1gkjrhppbyzyh.cloudfront.net/apl-viewhost-web/c5f16015-4f4a-4450-8e3f-7924429dc443/index.js';

const outputFilePath = 'index.js';
const outputFile = fs.createWriteStream(outputFilePath);

https.get(artifactUrl, (response) => {
    response.pipe(outputFile);
}).on('error', (e) => {
    throw Error(`Failed to fetch apl-viewhostweb-artifact: ${e}`);
});
