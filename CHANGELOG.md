# Changelog for apl-viewhost-web

## [2022.1]

This release adds support for version 2022.1 of the APL specification. Please also see APL Core Library for changes: [apl-core-library CHANGELOG](https://github.com/alexa/apl-core-library/blob/master/CHANGELOG.md)

### Added

- Added muted property to video component
- Exposed scrollCommandDuration

### Changed

- Improved support for HLS video
- Scale factor can be specified independently per renderer
- Changed clipping behaviour for documents using APL <= 1.5 for backwards compatibility
- Bug fixes 

## [1.9.0]

This release adds support for version 1.9 of the APL specification. Please also see APL Core Library for changes: [apl-core-library CHANGELOG](https://github.com/alexa/apl-core-library/blob/master/CHANGELOG.md)

### Added

- Image/VectorGraphics sources now allow request headers
- Additional disallow flags

### Changed

- Bug fixes
  - Audio player fix with AudioNode and AudioContext
  - Pager highlight
  - Video player release

## [1.8.0]

This release adds support for version 1.8 of the APL specification. Please also see APL Core Library for changes: [apl-core-library CHANGELOG](https://github.com/alexa/apl-core-library/blob/master/CHANGELOG.md)

### Added

- Image/VectorGraphics onLoad and onFail handlers
- Video onTrackReady and onTrackFail handlers
- DisplayState and onDisplayStateChange handler

### Changed

- Bug fixes

## [1.7.0]

This release adds support for version 1.7 of the APL specification. Please also see APL Core Library for changes: [apl-core-library CHANGELOG](https://github.com/alexa/apl-core-library/blob/master/CHANGELOG.md)

### Added

- Right to left layout support (see APL Core Library changes)
- E2E Encryption extension

### Changed

- Performance improvements for MultiChildScrollable
- Enable Audio Player to change volume
- No longer override sans-serif to be amazon-ember-display
- Updated reported APL version to 1.7
- Other bug fixes
