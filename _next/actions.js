function stringifyAction(action) {
	switch (action.command) {
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
			let command = ['PRIVMSG', action.user];

			command.push(`:\x01${action.message}\x01`);

			return command.join(' ');
		}
	}
}

let actions = [

	// REVIEW name vs channel|user
	// REVIEW reason vs comment

	// Nick Actions
	{
		command: 'NICK',
		nick: 'JohnDoe',
	},

	// Join Actions
	{
		command: 'JOIN',
		channel: '#channel1',
	},

	{
		command: 'JOIN',
		channel: '#channel3',
		key: 'Secr3tPassw0rd',
	},

	{
		command: 'JOIN',
		channels: [
			'#channel1',
			{
				name: '#channel2',
			},
			{
				name: '#channel3',
				key: 'Secr3tPassw0rd',
			},
		],
	},

	// Part Actions
	{
		command: 'PART',
		channel: '#channel1',
		reason: 'Lorem ipsum dolor sit amet.',
	},

	{
		command: 'PART',
		channels: [
			'#channel1',
			{
				name: '#channel2',
			},
			{
				name: '#channel3',
//				This will need multiple commands.
//				reason: 'Overriding reason for specific channel.',
			},
		],
		reason: 'Global reason unless overridden.',
	},

	// Kick Actions
	{
		command: 'KICK',
		channel: '#channel1',
		user: 'user1',
		reason: 'Lorem ipsum dolor sit amet.',
	},

	{
		command: 'KICK',
		channel: '#channel1',
		users: [
			'user1',
			{
				name: 'user2',
			},
			{
				name: 'user3',
//				This will need multiple commands.
//				reason: 'Overriding reason for specific user.',
			},
		],
		reason: 'Global reason unless overridden.',
	},

	{
		command: 'KICK',
		user: 'user1',
		channels: [
			'#channel1',
			{
				name: '#channel2',
			},
			{
				name: '#channel3',
//				This will need multiple commands.
//				reason: 'Overriding reason for specific channel.',
			},
		],
		reason: 'Global reason unless overridden.',
	},

	// Topic Actions
	{
		command: 'TOPIC',
		channel: '#channel1',
	},

	{
		command: 'TOPIC',
		channel: '#channel1',
		text: 'Lorem ipsum dolor sit amet.',
	},

	// CTCP Actions
	{
		command: 'CTCP',
		message: 'VERSION',
		user: 'user1',
	},

	{
		command: 'CTCP',
		message: 'TIME',
		user: 'user1',
	},

];

actions.map(stringifyAction)
//	.filter(command => command !== null)
	.forEach(command => console.log(command));
