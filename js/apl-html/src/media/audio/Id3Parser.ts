/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

'use strict';

import { IBaseMarker } from './SpeechMarks';

/* tslint:disable */
// http://id3.org/id3v2.4.0-structure

/*
+-----------------------------+
|      Header (10 bytes)      |
+-----------------------------+
|       Extended Header       |
| (variable length, OPTIONAL) |
+-----------------------------+
|   Frames (variable length)  |
+-----------------------------+
|           Padding           |
| (variable length, OPTIONAL) |
+-----------------------------+
| Footer (10 bytes, OPTIONAL) |
+-----------------------------+
*/

const HEADER_LENGTH = 10;

// Start sequence
const I = 73;
const D = 68;
const THREE = 51;
const T = 84;
const X = 88;
const DATA_START = 91; // '['

// const MAJOR = 0x04; // Supported major version
// const MINOR = 0x00; // Supported minor version

// Supported flags
// const FLAGS = 0x00;
// Unsynchronisation = 0
// Extended header = 0
// Experiemental indicator = 0
// Footer present = 0

// Supported frame header flags
// const FRAME_FLAGS_0 = 0x00;
// Empty
// Tag alter preservation = 0
// File alter preservation = 0
// Read only = 0
// --- Empty bits ---
// const FRAME_FLAGS_1 = 0x00;
// Empty
// Grouping identity = 0
// Empty
// Empty
// Compression = 0
// Encryption = 0
// Unsynchronisation = 0
// Data length indicator = 0

// Sync-safe integers are 4 byte sequences with the first bit set to 0
// This ensures that an integer won't be mistaken for an MP3 frame
// This function converts a syncSafe integer into a regular integer
/**
 * Convert sync safe integer to integer
 * @param msb most significant byte
 * @param third third byte from lsb
 * @param second second byte from lsb
 * @param lsb least significant byte
 */
const syncSafeInteger = (
  msb : number,
  third : number,
  second : number,
  lsb : number) : number => {
    return ((msb & 0x7f) << 21) +
      ((third & 0x7f) << 14) +
      ((second & 0x7f) << 7) +
      (lsb & 0x7f);
}

const parseFirstTXXXFrame = (buffer : Uint8Array, offset : number) : IBaseMarker[] =>  {
  // Only works with 'TXXX' frames
  if ((buffer[offset] !== T) ||
      (buffer[offset + 1] !== X) ||
      (buffer[offset + 2] !== X) ||
      (buffer[offset + 3] !== X)) {
        return [];
  }

  const length = syncSafeInteger(buffer[offset + 4],
    buffer[offset + 5],
    buffer[offset + 6],
    buffer[offset + 7]
  );

//  const flag1 = buffer[offset + 8];
//  const flag0 = buffer[offset + 9];

  let start = offset + HEADER_LENGTH + 4;
  // skip past TXXX
  while (buffer[start] !== DATA_START) {
    start++;
  }

  // Slice selects from the start byte, and ends at HEADER_LENGTH + length - 1
  // We need to skip past the header and frame length to get to the end
  const contents = buffer.slice(start, offset + HEADER_LENGTH + length - 1);
  const data = String.fromCharCode.apply(null, contents);
  return JSON.parse(data);
};

/**
 * Extracts TTS information embedded inside ID3 tags
 * This implementation is specific to Alexa TTS, extracting the first TXXX frame
 * over the entire file
 * @param arrayBuffer
 * @returns A list of markers as IBaseMarker
 */
export const extractTextFrames = (arrayBuffer : ArrayBuffer) : IBaseMarker[] => {
  let ret = new Array<IBaseMarker>();
  const buffer = new Uint8Array(arrayBuffer);
  let i = 0;
  while (i < buffer.length - 2) {
    if ((buffer[i] === I) && (buffer[i + 1] === D) && (buffer[i + 2] === THREE)) {
      // const major = buffer[i + 3];
      // const minor = buffer[i + 4];
      // const flags = buffer[i + 5];
      const length = syncSafeInteger(buffer[i + 6],
        buffer[i + 7],
        buffer[i + 8],
        buffer[i + 9]
      );
      const marks = parseFirstTXXXFrame(buffer, i + HEADER_LENGTH);
      ret = ret.concat(marks);
      i += length + HEADER_LENGTH;
    } else {
      i++;
    }
  }

  return ret;
};
