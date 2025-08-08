# Changelog

## [1.1.0](https://github.com/ajcuddeback/nimbus/compare/v1.0.0...v1.1.0) (2025-08-08)


### Features

* Adding google analytics ([a811e70](https://github.com/ajcuddeback/nimbus/commit/a811e7007cc20b844f88b9f50175df6158d1fa2c))

## 1.0.0 (2025-08-03)


### Features

* Adding a basic controller to fetch weather data publicly ([7e35ad8](https://github.com/ajcuddeback/nimbus/commit/7e35ad81698f85c04f72d584ff9801e775e0e8a3))
* Adding a couple more charts ([6fe7726](https://github.com/ajcuddeback/nimbus/commit/6fe772643b8782fba5b702637ea3c09ca84c88c6))
* Adding a dev application.properties file ([264b5db](https://github.com/ajcuddeback/nimbus/commit/264b5db92f7e2a8251618488aaeb5f673d902d0a))
* Adding better componentization for charts ([9a01d88](https://github.com/ajcuddeback/nimbus/commit/9a01d88093f4d9d32637eb96a059eadd8173c9cf))
* Adding better env variables for server locations and CORS ([0ea3eeb](https://github.com/ajcuddeback/nimbus/commit/0ea3eebdf14002053b81ec36309e9848badb7f05))
* Adding database connection and env variables to application.properties ([0680f34](https://github.com/ajcuddeback/nimbus/commit/0680f348ec074b6bd4764094b87699ee7d0aa587))
* Adding lightning detection to the DB for testing ([74c94be](https://github.com/ajcuddeback/nimbus/commit/74c94bea39796915e44497da49db440af04c3e94))
* Adding lightning detection to the DB for testing ([666ecbd](https://github.com/ajcuddeback/nimbus/commit/666ecbde20fac5b51c6af3842c219c1b0bf3cdf5))
* Adding lightning detection to the DB for testing ([3c49b50](https://github.com/ajcuddeback/nimbus/commit/3c49b50f0033df86b791d07887f00aa07217fa75))
* Adding minimum code to connect to MQTT client synchronously and subsribe to the weather topic ([615891c](https://github.com/ajcuddeback/nimbus/commit/615891ca9981c8a3047f5444e71dfecc6bc3f672))
* Adding primeNG with basic components to show weather data as an initial POC ([75dfebe](https://github.com/ajcuddeback/nimbus/commit/75dfebee1cfadb3875fbad1e40cc4cfba3f48c0e))
* Adding quick Angular app that polls for current weather data ([a23046f](https://github.com/ajcuddeback/nimbus/commit/a23046f2f57d62bb836fe8ece4e0dcaeb2380c74))
* Adding release please to docs ([4e13643](https://github.com/ajcuddeback/nimbus/commit/4e1364350df6d8b1ce6ab1a51855e070c988125a))
* Adding some todo comments ([29de731](https://github.com/ajcuddeback/nimbus/commit/29de7314c99f3c24ad1b49a994ecbdea89f86e19))
* Adding subscription logic ([33dc2a6](https://github.com/ajcuddeback/nimbus/commit/33dc2a6d5d864ba9e66e6bb01cc71470515ff3ea))
* Adding todays weather data API and a new chart to play with ([5359d1c](https://github.com/ajcuddeback/nimbus/commit/5359d1c92bbe7008cac40c3194d3c31a3c8bf6c5))
* Changing aggregation to minute before the hour is up. This way data is saved based on previous hour. Should revisit this logic ([4235631](https://github.com/ajcuddeback/nimbus/commit/4235631b87dce68bd84973523ddf25a6fd6a115b))
* Changing aggregation to minute before the hour is up. This way data is saved based on previous hour. Should revisit this logic ([7ba6272](https://github.com/ajcuddeback/nimbus/commit/7ba6272b98939cec7c20308ad1d42dfa88c6f3fe))
* Converting UI to only use charts ([85de9cc](https://github.com/ajcuddeback/nimbus/commit/85de9cc93567c55798e3c112c6b224e45a599912))
* Ensuring to publish stationId if it is found ([f814e7e](https://github.com/ajcuddeback/nimbus/commit/f814e7eacbe7434e5151ebf4a706d70c650f6e07))
* Fixing circular dependency issue ([3461bd9](https://github.com/ajcuddeback/nimbus/commit/3461bd9fe0ff73123dc4a300dd00e82e953b2f61))
* Fixing labels ([b25deb9](https://github.com/ajcuddeback/nimbus/commit/b25deb9d8c4b2ad22d344f58a6ae7ba06b731072))
* Improving readme ([2336c9e](https://github.com/ajcuddeback/nimbus/commit/2336c9e91cb1b6da9c039b054cc4bd32e1580d98))
* Increasing bundle size ([8681d2c](https://github.com/ajcuddeback/nimbus/commit/8681d2c2cf718bf330848cbae2a355238a569275))
* Making small UI adjustments ([5ef63a7](https://github.com/ajcuddeback/nimbus/commit/5ef63a7d998ee595aa1f4e34ef42da63a4f1a301))
* Making small UI adjustments ([017b9df](https://github.com/ajcuddeback/nimbus/commit/017b9df67cd158ad584aec3aa7b6fc74dc368a86))
* Modifying colors and adding humidity line chart ([c0bbb7b](https://github.com/ajcuddeback/nimbus/commit/c0bbb7b6b3e434644e36e31eda21ec7ccb4cb01b))
* Refactoring mqtt connection to leverage project reactor to improve code readability and introduce retries for connection ([d6bfaf8](https://github.com/ajcuddeback/nimbus/commit/d6bfaf8bd82050d2e8a547be13996a95ec9d8cc0))
* Resolving a vulnerability in BouncyCastle and improving overall error handling for duplicate key errors ([6d488f6](https://github.com/ajcuddeback/nimbus/commit/6d488f64ac1ddc753790d7a917c565ac42180b50))
* Setting cache flush to top of hour ([2b7d460](https://github.com/ajcuddeback/nimbus/commit/2b7d4601090b6d24a7007e100d5530e0c0c47791))
* Setting cache flush to top of hour ([cb57940](https://github.com/ajcuddeback/nimbus/commit/cb5794075ad4bb76b5f979a606a967b6ecfc1907))
* Some more refactor ([b1ea556](https://github.com/ajcuddeback/nimbus/commit/b1ea55608ad05912e0a986ec6e01a5263084e579))
* Splitting out stations into their own collection to save on storage and improve overall api usability ([a8f7013](https://github.com/ajcuddeback/nimbus/commit/a8f70134d811960115d69673b586f0a82e0c04e5))
* Suttle refactoring, moving qos to env variable, removing no longer needed logs ([063998b](https://github.com/ajcuddeback/nimbus/commit/063998b9f5942d469d72fa10ad634779957a1d1f))
* Updating dependencies and updating Java project to use Spring Reactive with Webflux ([6c8215d](https://github.com/ajcuddeback/nimbus/commit/6c8215d4d992b3ec3a1f7aa5303b8059e79a9c51))
* Working on basic POC for adding charts ([3c720e6](https://github.com/ajcuddeback/nimbus/commit/3c720e6a409b73ecf3dc179befed8da4b9d9fdae))
* Working to add caching system and architecture change for weather data aggregation and real time weather ([72edf2a](https://github.com/ajcuddeback/nimbus/commit/72edf2af16d60ad7b32e0c99478dba69c0972f23))
* Wrapping up weather caching system ([f870e69](https://github.com/ajcuddeback/nimbus/commit/f870e6941ca6aada87af4560f811fb5e74b0dd8d))


### Bug Fixes

* Ensuring cors only runs for dev mode ([13fa317](https://github.com/ajcuddeback/nimbus/commit/13fa3171253aa5b43e12177663b271de2dae3e1f))
* Fixing a couple of bugs and adding wind speed, wind direction, and rainfall totals ([c82d09f](https://github.com/ajcuddeback/nimbus/commit/c82d09f8b02aadca898d79473909922bb05a5631))
* Fixing a few issues with subscription and publish logic ([fede3f0](https://github.com/ajcuddeback/nimbus/commit/fede3f0b29c669da5c7f7b86be7f30d5a106ea25))
* Fixing a few small issues ([d943252](https://github.com/ajcuddeback/nimbus/commit/d94325221fa032c441feadc9e32d0903f4c299da))
* Fixing logic bug ([0bedee3](https://github.com/ajcuddeback/nimbus/commit/0bedee3ca12de17e9f95f9f1628ed2c39b7f3c89))
