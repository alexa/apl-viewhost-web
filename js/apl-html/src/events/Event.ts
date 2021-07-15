/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import APLRenderer from '../APLRenderer';
import { PropertyKey } from '../enums/PropertyKey';
import { EventType } from '../enums/EventType';
import { LoggerFactory } from '../logging/LoggerFactory';
import { ILogger } from '../logging/ILogger';

const EVENT_TYPE_MAP = {
    [EventType.kEventTypeSendEvent]: 'SendEvent',
    [EventType.kEventTypeControlMedia]: 'ControlMedia',
    [EventType.kEventTypePlayMedia]: 'PlayMedia',
    [EventType.kEventTypeRequestFirstLineBounds]: 'RequestFirstLineBounds',
    [EventType.kEventTypePreroll]: 'Preroll',
    [EventType.kEventTypeSpeak]: 'Speak',
    [EventType.kEventTypeFinish]: 'Finish',
    [EventType.kEventTypeFocus]: 'Focus',
    [EventType.kEventTypeOpenURL]: 'OpenURL',
    [EventType.kEventTypeExtension]: 'Extension',
    [EventType.kEventTypeDataSourceFetchRequest]: 'DataSourceFetchRequest'
};

export abstract class Event {
    /// Logger to be used for this component logs.
    protected type: string;

    protected logger: ILogger;

    protected isTerminated: boolean = false;

    constructor(protected event: APL.Event, protected renderer: APLRenderer) {
        this.type = EVENT_TYPE_MAP[event.getType()] || 'Event';
        this.logger = LoggerFactory.getLogger(this.type);
        event.addTerminateCallback(() => {
            this.terminate();
        });
    }

    public abstract execute();

    public terminate() {
        this.isTerminated = true;
    }

    protected resolve() {
        this.event.resolve();
    }

    protected async waitForValidLayout(component: APL.Component): Promise<void> {
        while (true) {
            const bounds = component.getCalculatedByKey<APL.Rect>(PropertyKey.kPropertyBounds);
            if (bounds.width > 0 && bounds.width < 1000000) {
                break;
            }
            await this.waitAFrame();
        }
    }

    protected wait(duration: number): Promise<void> {
        return new Promise((res) => {
            setTimeout(res, duration);
        });
    }

    protected waitAFrame(): Promise<number> {
        const time = Date.now();
        return new Promise((res) => {
            requestAnimationFrame(() => {
                res(Date.now() - time);
            });
        });
    }

    protected destroy() {
        (this.renderer as any) = undefined;
        (this.event as any) = undefined;
    }
}
