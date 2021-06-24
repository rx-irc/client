//     _        _   _
//    / \   ___| |_(_) ___  _ __  ___
//   / _ \ / __| __| |/ _ \| '_ \/ __|
//  / ___ \ (__| |_| | (_) | | | \__ \
// /_/   \_\___|\__|_|\___/|_| |_|___/
//

/**
 * Turns an action object into an IRC command.
 * @param {object} action The action object to parse.
 * @returns {string|null} The parsed command or null on failure.
 */
module.exports = function stringifyAction(action) {
	switch (action.command) {
		case 'PRIVMSG':
		case 'NOTICE': {
			let command = [action.command, action.target];
			let { text, prefix } = action;
			let lines = [];

			if (typeof text === 'string') {
				lines = text.split(/[\r\n]+/);
			} else if (Buffer.isBuffer(text)) {
				lines = text.toString().split(/[\r\n]+/);
			} else if (!Array.isArray(text)) {
				return null;
			} else {
				lines = text;
			}

			lines = lines.filter(line => line.length);

			if (prefix !== undefined) {
				lines = lines.map(line => prefix + line)
			}

			return lines
				.map(line => ':' + line)
				.map(line => [...command, line].join(' '));
		}

		case 'TOPIC': {
			let command = ['TOPIC', action.channel];

			if (action.text) {
				command.push(':' + action.text);
			}

			return command.join(' ');
		}

		case 'NICK': {
			let command = ['NICK', action.nick];
			return command.join(' ');
		}

		case 'JOIN': {
			let command = ['JOIN'];
			let channels = [];
			let keys = [];

			if (action.channel) {
				channels.push(action.channel);
				keys.push(action.key || 0);
			} else if (action.channels) {
				action.channels.forEach(channel => {
					channels.push(channel.name || channel);
					keys.push(channel.key || 0);
				});
			} else {
				return null;
			}

			command.push(channels.join(','));
			command.push(keys.join(','));

			return command.join(' ');
		}

		case 'PART': {
			let command = ['PART'];
			let channels = [];

			if (action.channel) {
				channels.push(action.channel);
			} else if (action.channels) {
				channels = action.channels.map(channel => channel.name || channel);
			} else {
				return null;
			}

			command.push(channels.join(','));

			if (action.reason) {
				command.push(':' + action.reason);
			}

			return command.join(' ');
		}

		case 'KICK': {
			let command = ['KICK'];
			let channels = [];
			let users = [];

			if (action.channel) {
				channels.push(action.channel);

				if (action.user) {
					users.push(action.user);
				} else if (action.users) {
					users = action.users.map(user => user.name || user);
				} else {
					return null;
				}
			} else if (action.channels) {
				channels = action.channels.map(channel => channel.name || channel);

				if (action.user) {
					users = Array(action.channels.length).fill(action.user);
				} else {
					return null;
				}
			} else {
				return null;
			}

			command.push(channels.join(','));
			command.push(users.join(','));

			if (action.reason) {
				command.push(':' + action.reason);
			}

			return command.join(' ');
		}

		case 'CTCP': {
			let command = ['PRIVMSG', action.target];

			command.push(`:\x01${action.text}\x01`);

			return command.join(' ');
		}

		case 'QUIT': {
			let command = ['QUIT'];

			if (action.reason) {
				command.push(':' + action.reason);
			}

			return command.join(' ');
		}
	}
}
