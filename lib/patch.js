// NPM Dependencies
const replies = require('irc-replies');

/**
 * Tries to map numerical commands to IRC reply names.
 * Falls back to the numeric value if no mapping is found.
 *
 * @param {object} message The message with a potentially numeric command.
 * @returns {object} The passed-in (modified) message object.
 */
module.exports = function patchCommand(message) {
	if (Number(message.command) > 0) {
		message.command = replies[message.command] || message.command;
	}

	return message;
};
