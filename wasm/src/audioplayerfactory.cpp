/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#include "wasm/audioplayerfactory.h"

namespace apl {
namespace wasm {

AudioPlayerFactoryPtr
AudioPlayerFactory::create(emscripten::val playerFactory)
{
    return std::make_shared<AudioPlayerFactory>(playerFactory);
}

AudioPlayerFactory::AudioPlayerFactory(emscripten::val playerFactory)
    : mPlayerFactory(playerFactory)
{}

apl::AudioPlayerPtr 
AudioPlayerFactory::createPlayer(AudioPlayerCallback playerCallback,
                                SpeechMarkCallback speechMarkCallback)
{
    auto player = AudioPlayer::create(std::move(playerCallback), std::move(speechMarkCallback), mPlayerFactory);
    mPlayers.emplace_back(player);
    return player;
}

void 
AudioPlayerFactory::tick()
{
    for (auto& player : mPlayers) {
        player->tick();
    }
}

EMSCRIPTEN_BINDINGS(wasm_audioplayer_factory) {
    emscripten::class_<AudioPlayerFactory>("AudioPlayerFactory")
        .smart_ptr<AudioPlayerFactoryPtr>("AudioPlayerFactoryPtr")
        .class_function("create", &AudioPlayerFactory::create)
        .function("tick", &AudioPlayerFactory::tick);
}

} // namespace wasm

} // namespace apl