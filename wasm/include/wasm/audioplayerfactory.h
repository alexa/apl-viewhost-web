/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#ifndef APL_WASM_AUDIO_PLAYER_FACTORY_H
#define APL_WASM_AUDIO_PLAYER_FACTORY_H

#include "apl/apl.h"
#include <emscripten/bind.h>

#include "wasm/audioplayer.h"

namespace apl {
namespace wasm {

class AudioPlayerFactory;

using AudioPlayerFactoryPtr = std::shared_ptr<AudioPlayerFactory>;

/**
 * AudioPlayerFactory shim to translate JS calls to APL concepts.
 */
class AudioPlayerFactory : public apl::AudioPlayerFactory {
public:
    static std::shared_ptr<AudioPlayerFactory> create(emscripten::val playerFactory);

    AudioPlayerFactory(emscripten::val playerFactory);

    /// apl::AudioPlayerFactory 
    apl::AudioPlayerPtr createPlayer(apl::AudioPlayerCallback playerCallback,
                                     apl::SpeechMarkCallback speechMarkCallback) override;

    /**
     * Drive time updates for all created players.
     */
    void tick();

    /**
     * Clear existing players.
     */
    void clear() { mPlayers.clear(); }
                    
private:
    emscripten::val mPlayerFactory;
    std::vector<apl::wasm::AudioPlayerPtr> mPlayers;
};

} // namespace wasm
} // namespace apl

#endif // APL_WASM_AUDIO_PLAYER_FACTORY_H
