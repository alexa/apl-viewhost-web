/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#include "wasm/mediaplayerfactory.h"

namespace apl {
namespace wasm {

MediaPlayerFactoryPtr
MediaPlayerFactory::create(emscripten::val playerFactory)
{
    return std::make_shared<MediaPlayerFactory>(playerFactory);
}

MediaPlayerFactory::MediaPlayerFactory(emscripten::val playerFactory)
    : mPlayerFactory(playerFactory)
{}

apl::MediaPlayerPtr
MediaPlayerFactory::createPlayer(MediaPlayerCallback playerCallback)
{
    cleanup(); // make sure we don't grow the list of players without bounds
    auto player = MediaPlayer::create(std::move(playerCallback), mPlayerFactory);
    mActivePlayers.emplace_back(player);
    return player;
}

void
MediaPlayerFactory::cleanup()
{
    for (auto it = mActivePlayers.begin(); it != mActivePlayers.end(); ) {
        if (!it->lock()) {
            // weak pointer is no longer valid, prune it from the array
            it = mActivePlayers.erase(it);
        } else {
            it++;
        }
    }
}

EMSCRIPTEN_BINDINGS(wasm_mediaplayer_factory) {
    emscripten::class_<MediaPlayerFactory>("MediaPlayerFactory")
        .smart_ptr<MediaPlayerFactoryPtr>("MediaPlayerFactoryPtr")
        .class_function("create", &MediaPlayerFactory::create);
}

} // namespace wasm
} // namespace apl
