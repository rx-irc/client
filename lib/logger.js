// NPM Dependencies
const debug = require('debug');

//  _
// | |    ___   __ _  __ _  ___ _ __
// | |   / _ \ / _` |/ _` |/ _ \ '__|
// | |__| (_) | (_| | (_| |  __/ |
// |_____\___/ \__, |\__, |\___|_|
//             |___/ |___/
//

let logger = module.exports = {
	debug: debug('rx-irc:client:debug'),
	log:   debug('rx-irc:client:log'),
	info:  debug('rx-irc:client:info'),
	warn:  debug('rx-irc:client:warn'),
	error: debug('rx-irc:client:error'),
};

for (let key in logger) {
	logger[key].log = console[key].bind(console);
}
