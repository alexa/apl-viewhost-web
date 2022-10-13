/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#ifndef APL_WASM_AUDIO_PLAYER_H
#define APL_WASM_AUDIO_PLAYER_H

#include "apl/apl.h"
#include <emscripten/bind.h>

namespace apl {
namespace wasm {

class AudioPlayer;

using AudioPlayerPtr = std::shared_ptr<AudioPlayer>;

/**
 * AudioPlayer shim to translate native player controls to APL concepts.
 */
class AudioPlayer : public apl::AudioPlayer {
public:
    static AudioPlayerPtr create(apl::AudioPlayerCallback&& playerCallback,
                                 apl::SpeechMarkCallback&& speechMarkCallback,
                                 emscripten::val audioPlayerFactory);

    AudioPlayer(apl::AudioPlayerCallback&& playerCallback,
                apl::SpeechMarkCallback&& speechMarkCallback);

    /**
     * Drive time updates on the player
     */
    void tick();

    /// Player state update callbacks
    void onPrepared(const std::string& id);
    void onMarker(const std::string& id, emscripten::val markers);
    void onPlaybackStarted(const std::string& id);
    void onPlaybackFinished(const std::string& id);
    void onError(const std::string& id, const std::string& reason);

    /// apl::AudioPlayer overrides
    void release() override;
    void setTrack(MediaTrack track) override;
    void play(ActionRef actionRef) override;
    void pause() override;

private:
    void resolveExistingAction();
    void doPlayerCallback(apl::AudioPlayerEventType eventType, bool paused, bool ended, apl::TrackState trackState);
    bool isActive() const;

private:
    emscripten::val mPlayer = emscripten::val::null();
    std::string mPlaybackId;
    apl::ActionRef mPlayRef = apl::ActionRef(nullptr);
    bool mPlaying = false;
    bool mPrepared = false;
    double mPlaybackStartTime = 0;
};

} // namespace wasm
} // namespace apl

#endif // APL_WASM_AUDIO_PLAYER_H
