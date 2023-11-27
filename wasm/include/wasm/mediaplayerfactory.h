/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#ifndef APL_WASM_MEDIA_PLAYER_FACTORY_H
#define APL_WASM_MEDIA_PLAYER_FACTORY_H

#include <apl/apl.h>
#include <emscripten/bind.h>

#include "wasm/mediaplayer.h"

namespace apl {
namespace wasm {

class MediaPlayerFactory;

using MediaPlayerFactoryPtr = std::shared_ptr<MediaPlayerFactory>;

/**
 * MediaPlayerFactory shim to translate JS calls to APL concepts.
 */
class MediaPlayerFactory : public apl::MediaPlayerFactory {
public:
    static std::shared_ptr<MediaPlayerFactory> create(emscripten::val playerFactory);

    MediaPlayerFactory(emscripten::val playerFactory);

    /// apl::MediaPlayerFactory
    apl::MediaPlayerPtr createPlayer(apl::MediaPlayerCallback playerCallback) override;

    void destroy();

private:
    /**
     * Removes old inactive players from the list of players, if possible.
     */
    void cleanup();

private:
    emscripten::val mPlayerFactory;

    std::vector<std::weak_ptr<MediaPlayer>> mActivePlayers;
};

} // namespace wasm
} // namespace apl

#endif // APL_WASM_MEDIA_PLAYER_FACTORY_H
