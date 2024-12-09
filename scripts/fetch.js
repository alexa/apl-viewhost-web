#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

const artifactUrl = 'https://d2o906d8ln7ui1.cloudfront.net/apl-viewhost-web-2024.3.js';
const outputFilePath = 'index.js';
const outputFile = fs.createWriteStream(outputFilePath);

https.get(artifactUrl, (response) => {
    response.pipe(outputFile);
}).on('error', (e) => {
    throw Error(`Failed to fetch apl-viewhostweb-artifact: ${e}`);
});
