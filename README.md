# @rx-irc/client - ReactiveX IRC client
A Node.js IRC client based on RxJS streams.

## Status
The client is finally ready enough to be used by [RxBot](https://github.com/rx-irc/bot).

The biggest remaining issues are:
* The store is missing channel modes list with userinfo.
* Timeout will result in quit instead of reconnect.
* Node will not exit after socket closes.
* setPrivileges legacy method is not yet an action.
* The actions API is not yet set in stone.
* Channel auto-join may move to bot.

More can be found in the [issues](https://github.com/rx-irc/client/issues).

## License
Copyright 2018, 2021 Florian Mäder - Permission granted under the [MIT license](LICENSE).
