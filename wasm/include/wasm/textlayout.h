/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#ifndef APL_WASM_TEXTLAYOUT_H
#define APL_WASM_TEXTLAYOUT_H

#include "apl/apl.h"

namespace apl {
namespace wasm {

class WasmTextLayout : public apl::sg::TextLayout {
public:
    WasmTextLayout(const float width,
                   const float height,
                   const float baseline,
                   const int lineCount,
                   const std::string plainText,
                   const std::string laidOutText,
                   const bool isTruncated,
                   const std::vector<std::string> textsByLine,
                   const std::vector<apl::Rect> rectsByLine);

    bool empty() const override;
    apl::Size getSize() const override;
    float getBaseline() const override;
    int getLineCount() const override;
    std::string getLaidOutText() const override;
    std::string toDebugString() const override;
    bool isTruncated() const override;
    unsigned int getByteLength() const override;
    apl::Range getLineRangeFromByteRange(apl::Range byteRange) const override;
    apl::Rect getBoundingBoxForLines(apl::Range lineRange) const override;

private:
    const float mWidth;
    const float mHeight;
    const float mBaseline;
    const int mLineCount;
    const std::string mPlainText;
    const std::string mLaidOutText;
    const bool mIsTruncated;
    const std::vector<std::string> mTextsByLine;
    const std::vector<apl::Rect> mRectsByLine;
};

} // namespace wasm
} // namespace apl

#endif // APL_WASM_TEXTLAYOUT_H
