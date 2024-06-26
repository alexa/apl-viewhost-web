/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#ifndef APL_WASM_DOCUMENT_MANAGER_H
#define APL_WASM_DOCUMENT_MANAGER_H

#include "apl/apl.h"
#include <emscripten/bind.h>

namespace apl {
namespace wasm {

class DocumentManager;
using DocumentManagerPtr = std::shared_ptr<DocumentManager>;

class DocumentManager : public apl::DocumentManager { 
public:
    static DocumentManagerPtr create(emscripten::val requestCallback);

    DocumentManager(emscripten::val requestCallback);

    void destroy();

    void request(
        const std::weak_ptr<EmbedRequest>& request,
        EmbedRequestSuccessCallback success,
        EmbedRequestFailureCallback error
    ) override;

    apl::DocumentContextPtr embedRequestSucceeded(
        int requestId,
        const std::string& url,
        const ContentPtr& content,
        const DocumentConfigPtr& documentConfig,
        bool connectedVisualContext
    );

    void embedRequestFailed(
        int requestId,
        const std::string& url,
        const std::string& failure
    );

private:
    emscripten::val mRequestCallback;
    std::map<int, std::tuple<std::weak_ptr<EmbedRequest>, EmbedRequestSuccessCallback, EmbedRequestFailureCallback>> mRequests;
    int mRequestId = 0;
};

} // namespace wasm
} // namespace apl

#endif // APL_WASM_DOCUMENT_MANAGER_H