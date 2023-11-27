/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import APLRenderer from './APLRenderer';
import { EventType } from './enums/EventType';
import { DataSourceFetchRequest } from './events/DataSourceFetchRequest';
import { ExtensionEvent } from './events/ExtensionEvent';
import { Finish } from './events/Finish';
import { Focus } from './events/Focus';
import { LineHighlight } from './events/LineHighlight';
import { MediaRequest } from './events/MediaRequest';
import { OpenUrl } from './events/OpenUrl';
import { ReInflate} from './events/ReInflate';
import { RequestLineBounds } from './events/RequestLineBounds';
import { SendEvent } from './events/SendEvent';

/**
 * Creates and executes a command
 * @param event The core engine event
 * @param renderer A reference to the renderer instance
 * @internal
 */
export const commandFactory = async (event: APL.Event, renderer: APLRenderer) => {
    if (factoryMap[event.getType()]) {
        return factoryMap[event.getType()](event, renderer);
    }
    throw new Error(`Cannot create command with type ${event.getType()}`);
};

const factoryMap = {
    [EventType.kEventTypeSendEvent]: (event: APL.Event, renderer: APLRenderer) => {
        const command = new SendEvent(event, renderer);
        command.execute();
        return command;
    },
    [EventType.kEventTypeRequestLineBounds]: (event: APL.Event, renderer: APLRenderer) => {
        const command = new RequestLineBounds(event, renderer);
        command.execute();
        return command;
    },
    [EventType.kEventTypeLineHighlight]: (event: APL.Event, renderer: APLRenderer) => {
        const command = new LineHighlight(event, renderer);
        command.execute();
        return command;
    },
    [EventType.kEventTypeReinflate]: async (event: APL.Event, renderer: APLRenderer) => {
        const command = new ReInflate(event, renderer);
        await command.execute();
        return command;
    },
    [EventType.kEventTypeFinish]: (event: APL.Event, renderer: APLRenderer) => {
        const command = new Finish(event, renderer);
        command.execute();
        return command;
    },
    [EventType.kEventTypeFocus]: (event: APL.Event, renderer: APLRenderer) => {
        const command = new Focus(event, renderer);
        command.execute();
        return command;
    },
    [EventType.kEventTypeOpenURL]: (event: APL.Event, renderer: APLRenderer) => {
        const command = new OpenUrl(event, renderer);
        command.execute();
        return command;
    },
    [EventType.kEventTypeDataSourceFetchRequest]: (event: APL.Event, renderer: APLRenderer) => {
        const command = new DataSourceFetchRequest(event, renderer);
        command.execute();
        return command;
    },
    [EventType.kEventTypeExtension]: (event: APL.Event, renderer: APLRenderer) => {
        const command = new ExtensionEvent(event, renderer);
        command.execute();
        return command;
    },
    [EventType.kEventTypeMediaRequest]: (event: APL.Event, renderer: APLRenderer) => {
        const command = new MediaRequest(event, renderer);
        command.execute();
        return command;
    }
};
