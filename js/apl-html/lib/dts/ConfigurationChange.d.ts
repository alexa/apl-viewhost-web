/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

declare namespace APL {
    export class ConfigurationChange extends Deletable {
        public static create() : ConfigurationChange;
        public size(width : number, height : number) : ConfigurationChange;
        public sizeRange(width : number, minWidth : number, maxWidth : number,
                         height : number, minHeight : number, maxHeight : number) : ConfigurationChange;
        public theme(theme : string) : ConfigurationChange;
        public viewportMode(viewportMode : string) : ConfigurationChange;
        public fontScale(scale : number) : ConfigurationChange;
        public screenMode(screenMode : string) : ConfigurationChange;
        public screenReader(enabled : boolean) : ConfigurationChange;
        public disallowVideo(disallowVideo : boolean) : ConfigurationChange;
        public environmentValue(key: string, value: object) : ConfigurationChange;
        public mergeConfigurationChange(other : ConfigurationChange) : void;
    }
}
