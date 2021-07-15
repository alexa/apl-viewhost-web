/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Algorithm {
    RSASHA1 = 'RSA/ECB/OAEPWithSHA1AndMGF1Padding',
    RSASHA256 = 'RSA/ECB/OAEPWithSHA256AndMGF1Padding',
    AES = 'AES/GCM/NoPadding'
}

export enum CryptoHash {
    SHA256 = 'SHA-256',
    SHA1 = 'SHA-1'
}

export interface EncodeBase64Args {
    token: string;
    value: string;
}

export interface EncryptBase64Args extends EncodeBase64Args {
    algorithm: string;
    key: string;
    aad?: string;
    base64Encoded?: boolean;
}

export interface Base64EncodeResult {
    token: string;
    base64EncodedData: string;
}

export interface RSAEncryptResult {
    token: string;
    base64EncryptedData: string;
}

export interface AESEncryptResult {
    token: string;
    base64EncryptedData: string;
    base64EncodedIV: string;
    base64EncodedKey?: string;
}

export interface EncryptionError {
    token: string;
    errorReason: string;
}

export type EncryptResult = RSAEncryptResult | AESEncryptResult | EncryptionError;
export type ExtensionResult = EncryptResult | Base64EncodeResult;

function getStringFrom(source: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(source);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return binary;
}

function getBase64From(source: ArrayBuffer): string {
    return btoa(getStringFrom(source));
}

function getArrayBufferFromBase64(base64Source: string): ArrayBuffer {
    return getArrayBufferFrom(atob(base64Source));
}

function getArrayBufferFrom(source: string): ArrayBuffer {
    const arrayBuffer = new ArrayBuffer(source.length);
    const view = new Uint8Array(arrayBuffer);
    for (let i = 0, strLen = source.length; i < strLen; i++) {
        view[i] = source.charCodeAt(i);
    }
    return arrayBuffer;
}

export function encodeBase64(args: EncodeBase64Args): Base64EncodeResult {
    return {
        token: args.token,
        base64EncodedData: btoa(args.value)
    };
}

const EncryptionAlgorithms = {
    [Algorithm.RSASHA1]: getEncryptRSAWithHash(CryptoHash.SHA1),
    [Algorithm.RSASHA256]: getEncryptRSAWithHash(CryptoHash.SHA256),
    [Algorithm.AES]: encryptAES
};

export async function encrypt(args: EncryptBase64Args): Promise<EncryptResult> {
    const {
        algorithm,
        token
    } = args;
    if (args.base64Encoded) {
        args.value = atob(args.value);
    }

    if (EncryptionAlgorithms.hasOwnProperty(algorithm)) {
        return await EncryptionAlgorithms[algorithm](args);
    }

    return {
        token,
        errorReason: `Unsupported Algorithm supplied: ${algorithm}`
    };
}

function getEncryptRSAWithHash(hash: CryptoHash): (args: EncryptBase64Args) => Promise<RSAEncryptResult> {
    return async (args: EncryptBase64Args) => {
        const keydata = getArrayBufferFromBase64(args.key);
        const format = 'spki';
        const algorithm = {
            name: 'RSA-OAEP',
            hash
        };
        const extractable = false;
        const keyUsages = ['encrypt'];
        const key = await crypto.subtle.importKey(
            format,
            keydata,
            algorithm,
            extractable,
            keyUsages
        );

        const data = getArrayBufferFrom(args.value);
        const buffer = await crypto.subtle.encrypt({
            name: 'RSA-OAEP'
        }, key, data);

        const base64EncryptedData = getBase64From(buffer);
        return {
            token: args.token,
            base64EncryptedData
        };
    };
}

async function encryptAES(args: EncryptBase64Args): Promise<AESEncryptResult> {
    let key: CryptoKey;
    let base64EncodedKey;
    const format = 'raw';
    const algorithm = 'AES-GCM';
    if (args.key) {
        const keydata = getArrayBufferFromBase64(args.key);
        const extractable = true;
        const keyUsages = ['encrypt'];
        key = await crypto.subtle.importKey(
            format,
            keydata,
            algorithm,
            extractable,
            keyUsages
        );
    } else {
        key = await generateKey({name: algorithm, length: 256});
        base64EncodedKey = getBase64From(await crypto.subtle.exportKey(format, key));
    }
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const data = getArrayBufferFrom(args.value);
    let buffer;
    if (args.aad) {
        const additionalData = getArrayBufferFrom(args.aad);
        buffer = await crypto.subtle.encrypt({
            name: algorithm,
            iv,
            additionalData
        }, key, data);
    } else {
        buffer = await crypto.subtle.encrypt({
            name: algorithm,
            iv
        }, key, data);
    }

    const base64EncryptedData = getBase64From(buffer);
    // @ts-ignore
    const base64EncodedIV = getBase64From(iv);

    return {
        token: args.token,
        base64EncryptedData,
        base64EncodedIV,
        base64EncodedKey
    };
}

async function generateKey(algorithm: AesKeyGenParams): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(algorithm, true, ['encrypt']);
}

export const testUtils = {getArrayBufferFrom, getStringFrom, getArrayBufferFromBase64, getBase64From};
