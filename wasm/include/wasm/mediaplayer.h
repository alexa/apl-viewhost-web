/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#ifndef APL_WASM_MEDIA_PLAYER_H
#define APL_WASM_MEDIA_PLAYER_H

#include <apl/apl.h>
#include <emscripten/bind.h>

namespace apl {
namespace wasm {

class MediaPlayer;

using MediaPlayerPtr = std::shared_ptr<MediaPlayer>;

/**
 * MediaPlayer shim to translate native player controls to APL concepts.
 */
class MediaPlayer : public apl::MediaPlayer {
public:
    static MediaPlayerPtr create(apl::MediaPlayerCallback&& playerCallback,
                                 emscripten::val mediaPlayerFactory);

    MediaPlayer(apl::MediaPlayerCallback&& playerCallback);
    ~MediaPlayer() override = default;

    /// apl::MediaPlayer overrides
    void release() override;
    void halt() override;
    void setTrackList(std::vector<apl::MediaTrack> tracks) override;
    void play(apl::ActionRef actionRef) override;
    void pause() override;
    void next() override;
    void previous() override;
    void rewind() override;
    void seek(int offset) override;
    void setTrackIndex(int trackIndex) override;
    void setAudioTrack(apl::AudioTrack audioTrack) override;
    void setMute(bool mute) override;

    // Player state update callbacks
    void updateMediaState(const emscripten::val& state);
    void doCallback(int eventType);

    emscripten::val getMediaPlayerHandle();

 private:
    void resolveExistingAction();
    bool isActive() const;

private:
    emscripten::val mPlayer = emscripten::val::null();

    apl::AudioTrack mAudioTrack;
    apl::ActionRef mActionRef = apl::ActionRef(nullptr);
    bool mReleased = false; // Set when the media player is released and should not be used
    bool mHalted = false;   // Set when the media player was asked to halt all playback
    apl::MediaState mMediaState;
};

} // namespace wasm
} // namespace apl

#endif // APL_WASM_MEDIA_PLAYER_H
