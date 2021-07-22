#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

const artifactUrl = 'https://d1gkjrhppbyzyh.cloudfront.net/apl-viewhost-web/fc1aa3e9-d453-46c4-919f-82b4274a2c68/index.js';

const outputFilePath = 'index.js';
const outputFile = fs.createWriteStream(outputFilePath);

https.get(artifactUrl, (response) => {
    response.pipe(outputFile);
}).on('error', (e) => {
    throw Error(`Failed to fetch apl-viewhostweb-artifact: ${e}`);
});
