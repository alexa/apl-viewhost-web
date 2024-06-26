/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#include "wasm/documentmanager.h"

#include <iostream>
#include <emscripten.h>

#include "wasm/embindutils.h"
#include "apl/dynamicdata.h"

using namespace std;

namespace apl {
namespace wasm {

DocumentManagerPtr 
DocumentManager::create(emscripten::val requestCallback) {
    return std::make_shared<DocumentManager>(requestCallback);
}

DocumentManager::DocumentManager(emscripten::val requestCallback) 
    : mRequestCallback(requestCallback)
{}

void
DocumentManager::destroy() {
    mRequests.clear();
}

void
DocumentManager::request(
    const std::weak_ptr<EmbedRequest>& request,
    EmbedRequestSuccessCallback success,
    EmbedRequestFailureCallback error) 
{
    auto embedRequest = request.lock();
    if (!embedRequest) {
        LOG(LogLevel::kError) << "Unable to lock EmbedRequest shared_ptr";
        return;
    } 

    auto urlRequest = embedRequest->getUrlRequest();
    auto url = urlRequest.getUrl();

    emscripten::val headers = emscripten::val::array();
    for (auto header : urlRequest.getHeaders()) {
        headers.call<void>("push", emscripten::val(header));
    }

    // Store EmbedRequest + callbacks at C++ level
    mRequests[mRequestId] = std::make_tuple(request, success, error);

    // Pass EmbedRequest to JS
    mRequestCallback(emscripten::val(mRequestId), emscripten::val(url), headers);

    mRequestId++;
}

apl::DocumentContextPtr
DocumentManager::embedRequestSucceeded(
    int requestId,
    const std::string& url,
    const ContentPtr& content,
    const DocumentConfigPtr& documentConfig,
    bool connectedVisualContext
) {
    auto pendingRequest = mRequests.find(requestId);
    if (pendingRequest == mRequests.end()) {
        LOG(LogLevel::kError) << "EmbedRequest not found for: " + url;
        return nullptr;
    }

    auto embedRequest = std::get<0>(pendingRequest->second).lock();
    auto successCallback = std::get<1>(pendingRequest->second);
    if (!embedRequest) {
        LOG(LogLevel::kError) << "Unable to lock EmbedRequest shared_ptr";
        return nullptr;
    }

    apl::DocumentContextPtr context = successCallback({
        embedRequest,
        content,
        connectedVisualContext,
        documentConfig
    });

    mRequests.erase(pendingRequest);
    return context;
}

void 
DocumentManager::embedRequestFailed(int requestId, const std::string& url, const std::string& failure) {
    auto pendingRequest = mRequests.find(requestId);
    if (pendingRequest == mRequests.end()) {
        LOG(LogLevel::kError) << "EmbedRequest not found for: " + url;
        return;
    }

    auto embedRequest = std::get<0>(pendingRequest->second).lock();
    auto failureCallback = std::get<2>(pendingRequest->second);
    if (!embedRequest) {
        LOG(LogLevel::kError) << "Unable to lock EmbedRequest shared_ptr";
        return;
    }

    failureCallback({
        embedRequest,
        failure
    });

    mRequests.erase(pendingRequest);
}

EMSCRIPTEN_BINDINGS(apl_wasm_document_manager) {
    emscripten::class_<apl::wasm::DocumentManager>("DocumentManager")
        .smart_ptr<DocumentManagerPtr>("DocumentManagerPtr")
        .class_function("create", &DocumentManager::create)
        .function("destroy", &DocumentManager::destroy)
        .function("embedRequestSucceeded", &DocumentManager::embedRequestSucceeded)
        .function("embedRequestFailed", &DocumentManager::embedRequestFailed);
}

}
}