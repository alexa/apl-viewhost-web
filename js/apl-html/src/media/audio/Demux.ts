/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

'use strict';

const mp3Parser = require('mp3-parser');

/**
 * @ignore
 */
interface IRange {
    start : number;
    length : number;
}

/**
 * Copy a range of bytes from source to dest at a given offset.
 * @param src
 * @param range
 * @param dest
 * @param offset
 * @ignore
 */
const copyBytes = (src : ArrayBuffer, range : IRange, dest : ArrayBuffer, offset : number) : void => {
    const srcView = new Uint8Array(src);
    const destView = new Uint8Array(dest);
    let i = 0;
    while (i < range.length) {
        destView[i + offset] = srcView[i + range.start];
        i++;
    }
};

const createArrayBufferFromRanges = (input : ArrayBuffer, ranges : IRange[], bufferLength : number) => {
    const outputBuffer = new ArrayBuffer(bufferLength);
    let offset = 0;
    ranges.forEach((range) => {
        copyBytes(input, range, outputBuffer, offset);
        offset += range.length;
    });

    return outputBuffer;
};

const auxHandlers = [mp3Parser.readXingTag, mp3Parser.readId3v2Tag];
const execAuxHandlers = (view : DataView, offset : number) : number => {
    for (const handler of auxHandlers) {
        const frame = handler(view, offset);
        if (frame) {
            return frame._section.byteLength;
        }
    }
    throw new Error('Unknown frame');
};

/**
 * A MP3 stream de-multiplexer
 * @ignore
 */
export class Demuxer {

    private used : boolean = false;
    private rangeLength : number = 0;
    private ranges : IRange[] = new Array<IRange>();

    /**
     * Create a data stream composed of MP3 frames only, removes ancillary frames
     * and returns a new buffer whose size is equal to or less than the original.
     * @param inputBuffer a valid MP3 buffer
     */
    public demux(inputBuffer : ArrayBuffer) : ArrayBuffer {
        if (this.used) {
            throw new Error('This demuxer instance has been used previously.');
        }
        this.used = true;

        const inputBufferLen = inputBuffer.byteLength;
        const inputView = new DataView(inputBuffer);
        let i = 0;
        while (i < inputBufferLen) {
            const frame = mp3Parser.readFrame(inputView, i);
            if (frame === null) {
                i += execAuxHandlers(inputView, i);
            } else {
                const frameLength = frame._section.byteLength;
                this.addRange(i, frameLength);
                i += frameLength;
            }
        }

        return createArrayBufferFromRanges(inputBuffer, this.ranges, this.rangeLength);
    }

    protected addRange(start : number, length : number) : void {
        const range : IRange = {
            length,
            start
        };
        this.ranges.push(range);
        this.rangeLength += length;
    }
}
