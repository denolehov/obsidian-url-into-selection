# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.11.3](///compare/1.11.2...1.11.3) (2025-07-25)

### [1.11.2](https://github.com/denolehov/obsidian-url-into-selection/compare/1.11.1...1.11.2) (2025-07-22)


### Bug Fixes

* various false positives are now fixed ([31ec582](https://github.com/denolehov/obsidian-url-into-selection/commit/31ec5827f3617d9dcd96051ee9f1014cac9872b4)), closes [#39](https://github.com/denolehov/obsidian-url-into-selection/issues/39) [#40](https://github.com/denolehov/obsidian-url-into-selection/issues/40)

### [1.11.1](https://github.com/denolehov/obsidian-url-into-selection/compare/1.11.0...1.11.1) (2025-07-22)


### Bug Fixes

* update manifest description to clarify markdown link creation ([e25aeff](https://github.com/denolehov/obsidian-url-into-selection/commit/e25aeff692127db1d6b3687fba8cbcea6bf9e176)), closes [#55](https://github.com/denolehov/obsidian-url-into-selection/issues/55)

## [1.11.0](https://github.com/denolehov/obsidian-url-into-selection/compare/1.10.0...1.11.0) (2025-07-22)


### Features

* preserve selected text as alias when pasting Obsidian wikilinks ([6a96db5](https://github.com/denolehov/obsidian-url-into-selection/commit/6a96db5287f8155a5153194355c0ea11162e1ea0)), closes [#56](https://github.com/denolehov/obsidian-url-into-selection/issues/56)


### Bug Fixes

* resolve critical bugs and refactor codebase structure ([dd4f714](https://github.com/denolehov/obsidian-url-into-selection/commit/dd4f714b169a9d2d9757f42934ec63a9cda9df72))

## [1.10.0](https://github.com/denolehov/obsidian-url-into-selection/compare/1.9.0...1.10.0) (2025-07-22)


### Features

* reject command-like text and configuration patterns in UrlIntoSelection ([44ef6f5](https://github.com/denolehov/obsidian-url-into-selection/commit/44ef6f55631975e3d79a0e3b5e4d70b7f4fa8053)), closes [#58](https://github.com/denolehov/obsidian-url-into-selection/issues/58)

## [1.9.0](https://github.com/denolehov/obsidian-url-into-selection/compare/1.8.1...1.9.0) (2025-07-22)


### Features

* add quote stripping for file paths and URLs in editor ([dd59e09](https://github.com/denolehov/obsidian-url-into-selection/commit/dd59e0993b46e552f631379f8150d2f72b502571)), closes [#60](https://github.com/denolehov/obsidian-url-into-selection/issues/60)

### [1.8.1](https://github.com/denolehov/obsidian-url-into-selection/compare/1.7.0...1.8.1) (2025-07-22)


### Bug Fixes

* changelog gen ([8eee267](https://github.com/denolehov/obsidian-url-into-selection/commit/8eee267964ddaaf5967b9fd75d74ee57cd8d9754))
* prevent angle brackets when pasting URLs inside markdown links ([829e86e](https://github.com/denolehov/obsidian-url-into-selection/commit/829e86ec2508d521ff19f27102a46a2fc5d04647)), closes [#64](https://github.com/denolehov/obsidian-url-into-selection/issues/64)

## [1.8.0](https://github.com/denolehov/obsidian-url-into-selection/compare/v1.7.0...v1.8.0) (2025-07-22)


### Bug Fixes

* prevent angle brackets when pasting URLs inside markdown links ([829e86e](https://github.com/denolehov/obsidian-url-into-selection/commit/829e86ec2508d521ff19f27102a46a2fc5d04647)), closes [#64](https://github.com/denolehov/obsidian-url-into-selection/issues/64)

## [1.7.0](https://github.com/denolehov/obsidian-url-into-selection/compare/v1.6.0...v1.7.0) (2022-01-26)


### Bug Fixes

* Fixed the plugin so that it works in live preview, closes [#33](https://github.com/denolehov/obsidian-url-into-selection/issues/33)

## [1.6.0](https://github.com/denolehov/obsidian-url-into-selection/compare/v1.5.0...v1.6.0) (2021-04-27)


### Features

* move cursor to [^](url) ([8dee070](https://github.com/denolehov/obsidian-url-into-selection/commit/8dee070b2c50b40351ba4c6a5cb11d7bae1f25b2))

## [1.5.0](https://github.com/denolehov/obsidian-url-into-selection/compare/v1.4.0...v1.5.0) (2021-04-26)


### Features

* avoid unintentional auto selection ([d81319f](https://github.com/denolehov/obsidian-url-into-selection/commit/d81319f5ee6d8035c29cc4e497f1dc0125e70166)), closes [#12](https://github.com/denolehov/obsidian-url-into-selection/issues/12)

## [1.4.0](https://github.com/denolehov/obsidian-url-into-selection/compare/v1.3.0...v1.4.0) (2021-04-19)


### Features

* change default regex to support file links ([#3](https://github.com/denolehov/obsidian-url-into-selection/issues/3)) ([8c6b435](https://github.com/denolehov/obsidian-url-into-selection/commit/8c6b435e6eda075ce7d1ff720ba9a1cdb754c2e9))

## [1.3.0](https://github.com/denolehov/obsidian-url-into-selection/compare/v1.2.0...v1.3.0) (2021-04-19)


### Features

* add behavior to native pastes ([9d76f2f](https://github.com/denolehov/obsidian-url-into-selection/commit/9d76f2fb36dcf5bfc228bf6c2102fcb995e9a859))
* ignore leading whitespace in URL ([#5](https://github.com/denolehov/obsidian-url-into-selection/issues/5)) ([a13a5e4](https://github.com/denolehov/obsidian-url-into-selection/commit/a13a5e4662a9debba920a04034841241a41dcaca))


### Bug Fixes

* fix issues with referse pasting ([96f1626](https://github.com/denolehov/obsidian-url-into-selection/commit/96f1626de27828f6d5f376561ac4037a77a4f1fe))
* remove default hotkey to avoid possible conflict ([e414f46](https://github.com/denolehov/obsidian-url-into-selection/commit/e414f463bc78ac1464f745471da9e66f9a652487))

## [1.2.0](https://github.com/denolehov/obsidian-url-into-selection/compare/v1.1.0...v1.2.0) (2021-03-29)


### Features

* regular expression for URLs is now exposed in the settings ([6f8f50e](https://github.com/denolehov/obsidian-url-into-selection/commit/6f8f50e55e19758cd90f473678638a0f0c660f1c)), closes [#3](https://github.com/denolehov/obsidian-url-into-selection/issues/3) [#8](https://github.com/denolehov/obsidian-url-into-selection/issues/8)

## [1.1.0](https://github.com/denolehov/obsidian-url-into-selection/compare/v1.0.0...v1.1.0) (2020-11-12)


### Features

* add ability to paste clipboard into URLs and creating clickable links out of it ([c808cc7](https://github.com/denolehov/obsidian-url-into-selection/commit/c808cc73cffd9e2b3fcb80d0eb4895676359e976)), closes [#2](https://github.com/denolehov/obsidian-url-into-selection/issues/2)
* users are no longer required to have text selected for hotkey to work ([f67ce01](https://github.com/denolehov/obsidian-url-into-selection/commit/f67ce019a57aeff3207b802ecee3eca652fb165e))
* **main.ts:** add unload method for paste handler ([83287fc](https://github.com/denolehov/obsidian-url-into-selection/commit/83287fc67e653c2ca08fd42c1a10546603823c72))

## 1.0.0 (2020-10-28)


### Features

* Paste URLs into selection "notion style" ([2c3aabe](https://github.com/denolehov/obsidian-url-into-selection/commit/2c3aabe8b28f08257dfe070b9d23e0bfe1b2b37f))