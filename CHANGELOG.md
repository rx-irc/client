# 1.0.0 (2021-06-24)


### Bug Fixes

* add owner and admin modes to RegExp ([778e589](https://github.com/rx-irc/client/commit/778e5894de32d732af49313f0cd19624510113fb))
* clean-up after commit session ([8a35046](https://github.com/rx-irc/client/commit/8a35046b45c65f5456a08b4898df0e76f69eabd1))
* ping->pong params offset ([b329abc](https://github.com/rx-irc/client/commit/b329abcbaa429c2d5ed0ec4c9603ce4236f16832))
* pput stdin pipe into condition ([e206df2](https://github.com/rx-irc/client/commit/e206df25a185cc4bdbd0e7d6e127f9a0ee4a88dc))
* remove CAP LS and END subscriptions ([88d7216](https://github.com/rx-irc/client/commit/88d72162d9857d08044b72b91c850e1339b23fb0))
* wrong variable order in nick subscription ([6bee5ba](https://github.com/rx-irc/client/commit/6bee5ba46205ee7f75d35124482204930a851cd7))


### Features

* add privilege function (temp) ([76c2498](https://github.com/rx-irc/client/commit/76c249848e0be14b0fd5b73da98f259740499240))
* implement action objects ([3b8fcf2](https://github.com/rx-irc/client/commit/3b8fcf27c9b9fdf218d08ae16d8bcfb47b474f7a))
* implement auto-join ([5a86a6f](https://github.com/rx-irc/client/commit/5a86a6f7d122822a2d84553ef18be7d97808c89e))
* implement ERR_NICKNAMEINUSE ([3f4dbee](https://github.com/rx-irc/client/commit/3f4dbeef9f7bc5b51b7dd6488b4d84f86919d5a8))
* implement kick subscription ([c52bc4f](https://github.com/rx-irc/client/commit/c52bc4ff1ed0d70485e9708a68a82318b7c7c0b6))
* implement QUIT stream ([4a26c69](https://github.com/rx-irc/client/commit/4a26c690ade308bc059325df1331cd1dc3a13a7f))
* implement some replies ([aa52a5c](https://github.com/rx-irc/client/commit/aa52a5c54dacc5c1c2c5f459df6d6593fbfd00a7))
* log error messages ([a637435](https://github.com/rx-irc/client/commit/a637435b54e267e3990fc03cc97f5e7df2293037))
* remove obsolete aliases ([f781936](https://github.com/rx-irc/client/commit/f781936d35f829afab80ec7433fd0bc60b4e56c6))
* remove playground ([947aea8](https://github.com/rx-irc/client/commit/947aea810486be4559bdde544d0f3fef62774597))
* replace Winston with debug ([b2e2c57](https://github.com/rx-irc/client/commit/b2e2c57de39b449acc540b20eb6da0bdd1b5139b))
* squash ([822ad38](https://github.com/rx-irc/client/commit/822ad380b9a673ac14abf9df44aa00fc89cca423))
* support non-tls connections ([b36b949](https://github.com/rx-irc/client/commit/b36b949d69c0eddec1efc50988378685e1e44651))
* update logging to find unimplemented replies ([83f99e0](https://github.com/rx-irc/client/commit/83f99e0a68a404fc6e192ade6f64649c6cd197b5))
* update the CTCP API ([e9a93c9](https://github.com/rx-irc/client/commit/e9a93c9a31cac4c0b6a708c923ee5a6588d12c49))
* use Lodash for array filter and findIndex ([5436ae1](https://github.com/rx-irc/client/commit/5436ae11ffb19f8ab58631722654708e48d196ca))


### BREAKING CHANGES

* New property names that need updating in
the consuming code.
* This needs an update of the modules and config.
