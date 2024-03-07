# Changelog for apl-viewhost-web

## [2024.1]
This release adds support for version 2024.1 of the APL specification. Please also see APL Core Library for changes: [apl-core-library CHANGELOG](https://github.com/alexa/apl-core-library/blob/master/CHANGELOG.md)

### Added
- Add support for Log command
- Add support for runtime to override the package loading method

### Changed
- Bug fixes

## [2023.3]
This release adds support for version 2023.3 of the APL specification. Please also see APL Core Library for changes: [apl-core-library CHANGELOG](https://github.com/alexa/apl-core-library/blob/master/CHANGELOG.md)

### Added
- Add support for conditional import
- Add support for auto sizing
- Add support gradient as Frame background
- Exported caption control class `cueControl` for APL videos

### Changed
- Changed default font to sans-serif to meet the APL Spec
- Bug fixes

## [2023.2]
This release adds support for version 2023.2 of the APL specification. Please also see APL Core Library for changes: [apl-core-library CHANGELOG](https://github.com/alexa/apl-core-library/blob/master/CHANGELOG.md)

### Added
- Add support for the seekTo ControlMedia command

### Changed
- Remove usage of APL Core Library's deprecated getTheme API
- Bug fixes

## [2023.1]
This release adds support for version 2023.1 of the APL specification. Please also see APL Core Library for changes: [apl-core-library CHANGELOG](https://github.com/alexa/apl-core-library/blob/master/CHANGELOG.md)

### Added
- SRT support for APL Video textTrack
- Support for new Porter-Duff blend modes

### Changed
- Bug fixes

## [2022.2]
This release adds support for version 2022.2 of the APL specification. Please also see APL Core Library for changes: [apl-core-library CHANGELOG](https://github.com/alexa/apl-core-library/blob/master/CHANGELOG.md)

### Added
- Support continued command execution during APL document re-inflation

### Changed
- Bug fixes

## [2022.1.1]

### Changed

- Bug fixes

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
