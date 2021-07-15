/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import APLRenderer from './APLRenderer';
import { EventType } from './enums/EventType';
import { ControlMedia } from './events/ControlMedia';
import { OpenUrl } from './events/OpenUrl';
import { PlayMedia } from './events/PlayMedia';
import { SendEvent } from './events/SendEvent';
import { Speak } from './events/Speak';
import { Finish } from './events/Finish';
import { Preroll } from './events/Preroll';
import { ReInflate} from './events/ReInflate';
import { Focus } from './events/Focus';
import { RequestFirstLineBounds } from './events/RequestFirstLineBounds';
import { DataSourceFetchRequest } from './events/DataSourceFetchRequest';
import { ExtensionEvent } from './events/ExtensionEvent';

/**
 * Creates and executes a command
 * @param event The core engine event
 * @param renderer A reference to the renderer instance
 * @internal
 */
export const commandFactory = (event: APL.Event, renderer: APLRenderer) => {
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
    [EventType.kEventTypeControlMedia]: (event: APL.Event, renderer: APLRenderer) => {
        const command = new ControlMedia(event, renderer);
        command.execute();
        return command;
    },
    [EventType.kEventTypePlayMedia]: (event: APL.Event, renderer: APLRenderer) => {
        const command = new PlayMedia(event, renderer);
        command.execute();
        return command;
    },
    [EventType.kEventTypeRequestFirstLineBounds]: (event: APL.Event, renderer: APLRenderer) => {
        const command = new RequestFirstLineBounds(event, renderer);
        command.execute();
        return command;
    },
    [EventType.kEventTypePreroll]: (event: APL.Event, renderer: APLRenderer) => {
        const command = new Preroll(event, renderer);
        command.execute();
        return command;
    },
    [EventType.kEventTypeReinflate]: (event: APL.Event, renderer: APLRenderer) => {
        const command = new ReInflate(event, renderer);
        command.execute();
        return command;
    },
    [EventType.kEventTypeSpeak]: (event: APL.Event, renderer: APLRenderer) => {
        const command = new Speak(event, renderer);
        command.execute();
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
    }
};
