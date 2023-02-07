/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#include <apl/utils/log.h>
#include <emscripten/emscripten.h>

#include "wasm/mediaplayer.h"

namespace apl {
namespace wasm {

static std::string textTrackTypeToKind(TextTrackType type) {
    switch (type) {
        case TextTrackType::kTextTrackTypeCaption:
            return "captions";
        default:
            return "unsupported";
    }
}

std::shared_ptr<MediaPlayer>
MediaPlayer::create(apl::MediaPlayerCallback&& playerCallback,
                    emscripten::val MediaPlayerFactory)
{
    auto player = std::make_shared<MediaPlayer>(std::move(playerCallback));
    player->mPlayer = MediaPlayerFactory(player);
    return player;
}

MediaPlayer::MediaPlayer(MediaPlayerCallback&& playerCallback)
    : apl::MediaPlayer(std::move(playerCallback))
{}

void
MediaPlayer::resolveExistingAction()
{
    if (!mActionRef.empty() && mActionRef.isPending()) {
        mActionRef.resolve();
    }
    mActionRef = apl::ActionRef(nullptr);
}

void
MediaPlayer::release()
{
    resolveExistingAction();
    mReleased = true;
}

void
MediaPlayer::halt()
{
    if (!isActive()) return;
    resolveExistingAction();

    mHalted = true;
    mPlayer.call<void>("stop");
}

void
MediaPlayer::setTrackList(std::vector<apl::MediaTrack> tracks)
{
    if (!isActive()) return;
    resolveExistingAction();
    
    emscripten::val trackArray = emscripten::val::array();
    
    for (int i = 0; i < tracks.size(); i++) {
        auto& track = tracks[i];
        emscripten::val trackObj = emscripten::val::object();
        trackObj.set("url", track.url);
        trackObj.set("offset", track.offset);
        trackObj.set("duration", track.duration);
        trackObj.set("repeatCount", track.repeatCount);

        emscripten::val textTrackArray = emscripten::val::array();
        for (int j = 0; j < track.textTracks.size(); j++) {
            auto& textTrack = track.textTracks[j];
            emscripten::val textTrackObj = emscripten::val::object();
            textTrackObj.set("kind", textTrackTypeToKind(textTrack.type));
            textTrackObj.set("url", textTrack.url);
            textTrackObj.set("description", textTrack.description);

            textTrackArray.set(j, textTrackObj);
        }
        trackObj.set("textTracks", textTrackArray);

        trackArray.set(i, trackObj);
    }

    mPlayer.call<void>("setTrackList", trackArray);
}

void
MediaPlayer::play(apl::ActionRef actionRef)
{
    bool waitForFinish = false;

    if (!isActive()) {
        if (!actionRef.empty()) actionRef.resolve();
        return;
    }
    
    resolveExistingAction();

    if (!actionRef.empty()) {
        // Only hold onto the ActionRef in foreground mode
        if (mAudioTrack == apl::kAudioTrackForeground) {
            mActionRef = actionRef;
            waitForFinish = true;

            // On a termination we need to discard the action reference or there is a memory cycle
            mActionRef.addTerminateCallback(
                    [&](const apl::TimersPtr&) { mActionRef = apl::ActionRef(nullptr); });
        } else {
            actionRef.resolve();
        }
    }

    mPlayer.call<void>("play", waitForFinish);
}

void
MediaPlayer::pause()
{
    if (!isActive()) return;
    resolveExistingAction();

    mPlayer.call<void>("pause");
}

void
MediaPlayer::next()
{
    if (!isActive()) return;
    resolveExistingAction();

    mPlayer.call<void>("next");
}

void
MediaPlayer::previous()
{
    if (!isActive()) return;
    resolveExistingAction();

    mPlayer.call<void>("previous");
}

void
MediaPlayer::rewind()
{
    if (!isActive()) return;
    resolveExistingAction();

    mPlayer.call<void>("rewind");
}

void
MediaPlayer::seek(int offset)
{
    if (!isActive()) return;
    resolveExistingAction();

    mPlayer.call<void>("seek", offset);
}

void
MediaPlayer::setTrackIndex(int trackIndex)
{
    if (!isActive()) return;
    resolveExistingAction();

    mPlayer.call<void>("setTrackIndex", trackIndex);
}

void
MediaPlayer::setAudioTrack(apl::AudioTrack audioTrack)
{
    if (!isActive()) return;

    mAudioTrack = audioTrack;
    mPlayer.call<void>("setAudioTrack", static_cast<int>(mAudioTrack));
}

void
MediaPlayer::setMute(bool mute)
{
    mPlayer.call<void>("setMute", mute);
}

bool
MediaPlayer::isActive() const
{
    return !mReleased && !mHalted;
}

void
MediaPlayer::updateMediaState(const emscripten::val& state) {
    if (!state.hasOwnProperty("trackIndex") || !state.hasOwnProperty("trackCount") ||
        !state.hasOwnProperty("currentTime") || !state.hasOwnProperty("duration") ||
        !state.hasOwnProperty("paused") || !state.hasOwnProperty("ended") ||
        !state.hasOwnProperty("muted")) {
        LOG(LogLevel::ERROR) << "Can't update media state. MediaStatus structure is wrong.";
        return;
    }

    MediaState mediaState(state["trackIndex"].as<int>(), state["trackCount"].as<int>(),
                          state["currentTime"].as<int>(), state["duration"].as<int>(),
                          state["paused"].as<bool>(), state["ended"].as<bool>(),
                          state["muted"].as<bool>());

    if (state.hasOwnProperty("trackState")) {
        mediaState.withTrackState(static_cast<apl::TrackState>(state["trackState"].as<int>()));
    }
    if (state.hasOwnProperty("errorCode")) {
        mediaState.withErrorCode(state["errorCode"].as<int>());
    } else {
        mediaState.withErrorCode(0);
    }
    mMediaState = mediaState;
}

void
MediaPlayer::doCallback(int eventType) {
    if (!isActive()) return;
    apl::MediaPlayerEventType mediaPlayerEventType = static_cast<apl::MediaPlayerEventType>(eventType);
    if (mediaPlayerEventType == apl::MediaPlayerEventType::kMediaPlayerEventEnd
        || eventType == apl::MediaPlayerEventType::kMediaPlayerEventTrackFail) {
        resolveExistingAction();
    }
    auto callback = mCallback;
    callback(mediaPlayerEventType, mMediaState);
}

emscripten::val
MediaPlayer::getMediaPlayerHandle() {
    return mPlayer;
}

EMSCRIPTEN_BINDINGS(wasm_MediaPlayer) {
    emscripten::class_<MediaPlayer>("MediaPlayer")
        .smart_ptr<MediaPlayerPtr>("MediaPlayerPtr")
        .function("getMediaPlayerHandle", &MediaPlayer::getMediaPlayerHandle)
        .function("updateMediaState", &MediaPlayer::updateMediaState)
        .function("doCallback", &MediaPlayer::doCallback);
}

} // namespace wasm
} // namespace apl
