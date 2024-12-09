/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#include "wasm/textlayout.h"
#include "apl/apl.h"

namespace apl {
namespace wasm {

WasmTextLayout::WasmTextLayout(const float width,
                               const float height,
                               const float baseline,
                               const int lineCount,
                               const std::string plainText,
                               const std::string laidOutText,
                               const bool isTruncated,
                               const std::vector<std::string> textsByLine,
                               const std::vector<apl::Rect> rectsByLine)
    : apl::sg::TextLayout(),
      mWidth(width),
      mHeight(height),
      mBaseline(baseline),
      mLineCount(lineCount),
      mPlainText(plainText),
      mLaidOutText(laidOutText),
      mIsTruncated(isTruncated),
      mTextsByLine(textsByLine),
      mRectsByLine(rectsByLine)
{}

bool
WasmTextLayout::empty() const {
    return mPlainText.length() <= 0;
}

apl::Size
WasmTextLayout::getSize() const {
    return {mWidth, mHeight};
}

float
WasmTextLayout::getBaseline() const {
    return mBaseline;
}

int
WasmTextLayout::getLineCount() const {
    return mLineCount;
}

std::string
WasmTextLayout::getLaidOutText() const {
    return mLaidOutText;
}

std::string 
WasmTextLayout::toDebugString() const {
    return mPlainText;
}

bool 
WasmTextLayout::isTruncated() const {
    return mIsTruncated;
}

unsigned int
WasmTextLayout::getByteLength() const {
    const char* utf8Bytes = mPlainText.c_str();
    return std::strlen(utf8Bytes);
}

apl::Range 
WasmTextLayout::getLineRangeFromByteRange(apl::Range byteRange) const {
    auto lineStart = 0;
    auto lineEnd = mLineCount - 1;
    unsigned int byteSum = 0;

    for (auto lineIndex = 0; lineIndex < mLineCount; lineIndex++) {
        auto lineText = mTextsByLine[lineIndex];
        const char* utf8Bytes = lineText.c_str();
        auto byteSize = std::strlen(utf8Bytes);

        if (byteSum <= byteRange.lowerBound() && byteSum + byteSize > byteRange.lowerBound()) {
            lineStart = lineIndex;
        }

        if (byteSum + byteSize > byteRange.upperBound()) {
            lineEnd = lineIndex;
            break;
        }

        byteSum += byteSize;
    }

    return {lineStart, lineEnd};
}

apl::Rect 
WasmTextLayout::getBoundingBoxForLines(apl::Range lineRange) const {
    auto rect = apl::Rect(0,0,0,0);

    for (auto line : lineRange) {
        if (line >= mRectsByLine.size()) {
            break;
        }

        if (rect.empty()) {
            rect = mRectsByLine.at(line);
        } else {
            rect.extend(mRectsByLine.at(line));
        }
    }

    return rect;
}

} // namespace wasm
} // namespace apl
