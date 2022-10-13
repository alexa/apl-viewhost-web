/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#include "wasm/audioplayer.h"
#include <emscripten/emscripten.h>

namespace apl {
namespace wasm {

std::shared_ptr<AudioPlayer> 
AudioPlayer::create(apl::AudioPlayerCallback&& playerCallback,
                    apl::SpeechMarkCallback&& speechMarkCallback,
                    emscripten::val audioPlayerFactory)
{
    auto player = std::make_shared<AudioPlayer>(std::move(playerCallback), std::move(speechMarkCallback));
    player->mPlayer = audioPlayerFactory(player);
    return player;
}

AudioPlayer::AudioPlayer(AudioPlayerCallback&& playerCallback,
                         SpeechMarkCallback&& speechMarkCallback)
    : apl::AudioPlayer(std::move(playerCallback), std::move(speechMarkCallback))
{
}

void
AudioPlayer::tick()
{
    if (!isActive()) return;
 
    doPlayerCallback(apl::AudioPlayerEventType::kAudioPlayerEventTimeUpdate, false, false, apl::TrackState::kTrackReady);
}

void
AudioPlayer::resolveExistingAction()
{
    mPlaying = false;   
    if (!mPlayRef.empty() && mPlayRef.isPending()) {
        mPlayRef.resolve();
    }
    mPlayRef = apl::ActionRef(nullptr);
}

bool
AudioPlayer::isActive() const
{
    return !mPlayRef.empty() && (!mPlayRef.isResolved() && !mPlayRef.isTerminated());
}

void
AudioPlayer::doPlayerCallback(apl::AudioPlayerEventType eventType, bool paused, bool ended, apl::TrackState trackState)
{
    if (!isActive()) return;
 
    if (eventType == apl::kAudioPlayerEventTimeUpdate && !mPlaying) {
        return;
    }
 
    auto currentOffset = emscripten_get_now() - mPlaybackStartTime;
    auto audioState = apl::AudioState(currentOffset, 0, paused, ended, trackState);
    mPlayerCallback(eventType, audioState);
}

void 
AudioPlayer::onPrepared(const std::string& id) 
{
    auto audioState = apl::AudioState(0, 0, false, false, apl::TrackState::kTrackReady);
    mPlayerCallback(apl::AudioPlayerEventType::kAudioPlayerEventReady, audioState);

    mPrepared = true;

    if (!mPlayRef.empty()) {
        // Requested playback before prepared. Do now.
        mPlayer.call<void>("play", mPlaybackId);
    }
}

static inline apl::SpeechMarkType stringToMarkType(const std::string& type) {
    auto result = apl::SpeechMarkType::kSpeechMarkUnknown;
    if (type == "word") {
        result = apl::SpeechMarkType::kSpeechMarkWord;
    } else if (type == "visime") {
        result = apl::SpeechMarkType::kSpeechMarkViseme;
    } else if (type == "sentence") {
        result = apl::SpeechMarkType::kSpeechMarkSentence;
    } else if (type == "ssml") {
        result = apl::SpeechMarkType::kSpeechMarkSSML;
    }
    return result;
}

static inline apl::SpeechMark viewhostToAplSM(emscripten::val speechMark) {
    apl::SpeechMark mark = {};
    mark.type = stringToMarkType(speechMark["type"].as<std::string>());
    mark.time = speechMark["time"].as<double>();
    mark.value = speechMark["value"].as<std::string>();

    if (mark.type == apl::SpeechMarkType::kSpeechMarkWord || mark.type == apl::SpeechMarkType::kSpeechMarkSSML) {
        mark.start = speechMark["start"].as<double>();
        mark.end = speechMark["end"].as<double>();
    }

    return mark;
}

void 
AudioPlayer::onMarker(const std::string& id, emscripten::val markers) 
{
    std::vector<apl::SpeechMark> result;

    for (const auto &speechMark : emscripten::vecFromJSArray<emscripten::val>(markers)) {       
        result.emplace_back(viewhostToAplSM(speechMark));
    }

    mSpeechMarkCallback(result);
}

void 
AudioPlayer::onPlaybackStarted(const std::string& id) 
{
    mPlaybackStartTime = emscripten_get_now();
    mPlaying = true;
    doPlayerCallback(apl::AudioPlayerEventType::kAudioPlayerEventPlay, false, false, apl::TrackState::kTrackReady);
}

void 
AudioPlayer::onPlaybackFinished(const std::string& id) 
{
    resolveExistingAction();
    doPlayerCallback(apl::AudioPlayerEventType::kAudioPlayerEventEnd, false, true, apl::TrackState::kTrackReady);
}

void 
AudioPlayer::onError(const std::string& id, const std::string& reason) 
{
    resolveExistingAction();
    doPlayerCallback(apl::AudioPlayerEventType::kAudioPlayerEventFail, false, true, apl::TrackState::kTrackFailed);    
}

void 
AudioPlayer::release() 
{
    mPlayer.call<void>("releaseAudioContext");

    mPlaybackId = "";
    mPrepared = false;

    resolveExistingAction();
}

void 
AudioPlayer::setTrack(MediaTrack track) 
{
    if (mPrepared) return;

    mPlaybackId = mPlayer.call<std::string>("prepare", track.url, true);
}

void 
AudioPlayer::play(ActionRef actionRef) 
{
    resolveExistingAction();

    mPlayRef = actionRef;

    if (mPrepared) {
        mPlayer.call<void>("play", mPlaybackId);
    }
}

void 
AudioPlayer::pause() 
{
    mPlayer.call<void>("flush");
    resolveExistingAction();
}

EMSCRIPTEN_BINDINGS(wasm_audioplayer) {
    emscripten::class_<AudioPlayer>("AudioPlayer")
        .smart_ptr<AudioPlayerPtr>("AudioPlayerPtr")
        .function("onPrepared", &AudioPlayer::onPrepared)
        .function("onMarker", &AudioPlayer::onMarker)
        .function("onPlaybackStarted", &AudioPlayer::onPlaybackStarted)
        .function("onPlaybackFinished", &AudioPlayer::onPlaybackFinished)
        .function("onError", &AudioPlayer::onError);
}

} // namespace wasm

} // namespace apl