#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

const artifactUrl = 'https://d1gkjrhppbyzyh.cloudfront.net/apl-viewhost-web/6dcd129a-c82d-46fe-ab8e-93b6f3ed1870/index.js';

const outputFilePath = 'index.js';
const outputFile = fs.createWriteStream(outputFilePath);

https.get(artifactUrl, (response) => {
    response.pipe(outputFile);
}).on('error', (e) => {
    throw Error(`Failed to fetch apl-viewhostweb-artifact: ${e}`);
});
