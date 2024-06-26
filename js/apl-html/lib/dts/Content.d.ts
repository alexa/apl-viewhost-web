/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

declare namespace APL {
    export class ImportRef {
        public version(): string;
        public name(): string;
        public toString(): string;
    }

    export class ImportRequest {
        public isValid(): boolean;
        public reference(): ImportRef;
        public source(): string;
    }

    export class Content extends Deletable {
        public static create(document: string, session: Session): Content;
        public static createWithConfig(document: string, session: Session,
                                       metrics: Metrics, config: RootConfig): Content;
        public refresh(metrics: Metrics, config: RootConfig): void;
        public load(onSuccess: () => void, onFailure: () => void): void;
        public getRequestedPackages(): Set<ImportRequest>;
        public addPackage(request: ImportRequest, data: string): void;
        public isError(): boolean;
        public isReady(): boolean;
        public isWaiting(): boolean;
        public addData(name: string, data: string): void;
        public getAPLVersion(): string;
        public getExtensionRequests(): Set<string>;
        public getExtensionSettings(uri: string): object;
        public getParameterAt(index: number): string;
        public getParameterCount(): number;
    }
}
