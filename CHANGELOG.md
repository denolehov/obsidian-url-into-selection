# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.7.0]

### Bug Fixes
* Fixed the plugin so that it works in live preview, closes [#33](https://github.com/denolehov/obsidian-url-into-selection/issues/33)

## [1.6.0](https://github.com/denolehov/obsidian-url-into-selection/compare/v1.1.0...v1.6.0) (2021-04-27)


### Features

* move cursor to [^](url) ([8dee070](https://github.com/denolehov/obsidian-url-into-selection/commit/8dee070b2c50b40351ba4c6a5cb11d7bae1f25b2))
* **core.ts:** add support for file path ([e4bd4f6](https://github.com/denolehov/obsidian-url-into-selection/commit/e4bd4f602eda766907ad7bcc30227f7873937c28)), closes [#3](https://github.com/denolehov/obsidian-url-into-selection/issues/3)
* add img embed syntax whitelist ([012a588](https://github.com/denolehov/obsidian-url-into-selection/commit/012a5885fa796bf955ca34e636d7e06da9d5f6cf)), closes [#13](https://github.com/denolehov/obsidian-url-into-selection/issues/13)
* add option to insert <url> ([de57f34](https://github.com/denolehov/obsidian-url-into-selection/commit/de57f348ca6684b0e6da17372af9fa5e6662a6c9))
* add: insert inline url when nothing is selected ([6df2f5f](https://github.com/denolehov/obsidian-url-into-selection/commit/6df2f5f5dd4e22ee137f4352f3149a198178b326))
* replace autoselect option with nothingSelected ([37f4259](https://github.com/denolehov/obsidian-url-into-selection/commit/37f4259085f6643f2375fee37d14c3550a66bc95))
* switch to DOM Clipboard API ([da55fc0](https://github.com/denolehov/obsidian-url-into-selection/commit/da55fc0ac85c16910eba9d81f85766532cd64f1f))
* update default regex ([bf3fcd8](https://github.com/denolehov/obsidian-url-into-selection/commit/bf3fcd818b31e41c718d56d6d27441c8a8e9881a))
* update isUrl method to utilize browser URL API ([1254e5b](https://github.com/denolehov/obsidian-url-into-selection/commit/1254e5b513bb65af2d8415219c61ef4c5f6ff6e3)), closes [#3](https://github.com/denolehov/obsidian-url-into-selection/issues/3)


### Bug Fixes

* don't use ![](url) syntax by default if whitelist rules-list is empty ([50df2a5](https://github.com/denolehov/obsidian-url-into-selection/commit/50df2a55cc731f8be592e94a36b6417510d0838f))
* url with space, angle brackets and parentheses is no longer broken in markdown ([f9f678c](https://github.com/denolehov/obsidian-url-into-selection/commit/f9f678c98654b233c4f6c4d831371fa5c9a4143e)), closes [#16](https://github.com/denolehov/obsidian-url-into-selection/issues/16)
* **isurl:** empty text is no longer recognized as url ([08d8b19](https://github.com/denolehov/obsidian-url-into-selection/commit/08d8b19b8db2a3f2aae5e0cda4640c2d6bfc6a30))

## [1.5.0](https://github.com/denolehov/obsidian-url-into-selection/compare/v1.1.0...v1.5.0) (2021-04-26)


### Features

* avoid unintentional auto selection [@AidenLx](https://github.com/AidenLx) ([d81319f](https://github.com/denolehov/obsidian-url-into-selection/commit/d81319f5ee6d8035c29cc4e497f1dc0125e70166)), closes [#12](https://github.com/denolehov/obsidian-url-into-selection/issues/12)

## [1.4.0](https://github.com/denolehov/obsidian-url-into-selection/compare/v1.1.0...v1.4.0) (2021-04-19)


### Features

* change default regex to support file links ([#3](https://github.com/denolehov/obsidian-url-into-selection/issues/3)) ([8c6b435](https://github.com/denolehov/obsidian-url-into-selection/commit/8c6b435e6eda075ce7d1ff720ba9a1cdb754c2e9))


## [1.3.0](https://github.com/denolehov/obsidian-url-into-selection/compare/v1.1.0...v1.3.0) (2021-04-19)


### Features

* add behavior to native pastes ([9d76f2f](https://github.com/denolehov/obsidian-url-into-selection/commit/9d76f2fb36dcf5bfc228bf6c2102fcb995e9a859))
* ignore leading whitespace in URL ([#5](https://github.com/denolehov/obsidian-url-into-selection/issues/5)) ([a13a5e4](https://github.com/denolehov/obsidian-url-into-selection/commit/a13a5e4662a9debba920a04034841241a41dcaca))


### Bug Fixes

* fix issues with referse pasting ([96f1626](https://github.com/denolehov/obsidian-url-into-selection/commit/96f1626de27828f6d5f376561ac4037a77a4f1fe))
* remove default hotkey to avoid possible conflict ([e414f46](https://github.com/denolehov/obsidian-url-into-selection/commit/e414f463bc78ac1464f745471da9e66f9a652487))

## [1.2.0](https://github.com/denolehov/obsidian-url-into-selection/compare/v1.0.0...v1.2.0) (2021-03-29)


### Features

* regular expression for URLs is now exposed in the settings ([6f8f50e](https://github.com/denolehov/obsidian-url-into-selection/commit/6f8f50e55e19758cd90f473678638a0f0c660f1c)), closes [#3](https://github.com/denolehov/obsidian-url-into-selection/issues/3) [#8](https://github.com/denolehov/obsidian-url-into-selection/issues/8)

## [1.1.0](https://github.com/denolehov/obsidian-url-into-selection/compare/v1.0.0...v1.1.0) (2020-11-12)


### Features

* add ability to paste clipboard into URLs and creating clickable links out of it ([c808cc7](https://github.com/denolehov/obsidian-url-into-selection/commit/c808cc73cffd9e2b3fcb80d0eb4895676359e976)), closes [#2](https://github.com/denolehov/obsidian-url-into-selection/issues/2)
* users are no longer required to have text selected for hotkey to work ([f67ce01](https://github.com/denolehov/obsidian-url-into-selection/commit/f67ce019a57aeff3207b802ecee3eca652fb165e))

## 1.0.0 (2020-10-28)


### Features

* Paste URLs into selection "notion style" ([2c3aabe](https://github.com/denolehov/obsidian-url-into-selection/commit/2c3aabe8b28f08257dfe070b9d23e0bfe1b2b37f))
