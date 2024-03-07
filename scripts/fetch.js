#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

const artifactUrl = 'https://d1gkjrhppbyzyh.cloudfront.net/apl-viewhost-web/9bb16d5d-b8e2-4557-b782-41835a511338/index.js';

const outputFilePath = 'index.js';
const outputFile = fs.createWriteStream(outputFilePath);

https.get(artifactUrl, (response) => {
    response.pipe(outputFile);
}).on('error', (e) => {
    throw Error(`Failed to fetch apl-viewhostweb-artifact: ${e}`);
});
