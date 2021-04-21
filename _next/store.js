let store = {
	server: {
		// TLS
		encrypted: bool,
		authorized: bool,
		authorizationError: string,
		peerCertificate: string,
		cypher: object,
		ephemeral: object,
		protocol: string,
		remoteFamily: number,
		remoteAddress: string,
		remotePort: number,

		// IRC
		motd: string[],
		nickLength: number,
		topicLength: number,

		channelPrefixes: string[],
		channelLimit: number,
		channelModes: string[],
		channelLength: number,

		stats: {
			totalServers: number,
			totalVisibleUsers: number,
			totalInvisibleUsers: number,
			totalMaxUsers: number,

			localAllUsers: number,
			localMaxUsers: number,

			operatorsOnline: number,
			unknownConnections: number,
			channelsFormed: number,
		}
	},
	user: {
		nick: string,
		username: string,
		hostname: string,
		realname: string,
		away: string,
		address: string,
		secondsIdle: number,
		signonTime: moment,
		username: string,
	},
	channels: [
		{
			name: string,
			topic: {
				text: string,
				setBy: string,
				setOn: moment,
			},
			modes: { [mode]: value },
			users: [
				{
					nick: string,
					modes: string[],
				},
			],
		},
	],
	users: [
		{
			nick: string,
			username: string,
			hostname: string,
			realname: string,

			away: string = null,

			ssl: boolean,
			serverHost: string,
			serverInfo: string,

			operator: boolean = false,
			service: boolean = false,
		},
	],
};

let my_nick = store.get('user.nick');
let my_topics = store.channels
	.filter(channel => channel.topic.setBy === my_nick)
	.map(channel => `${channel.topic.text} ${channel.name}`);

function findByNick(users, nick) {
	return users.find(user => user.nick === nick);
}

function findByMode(users, mode) {
	return users.filter(user => user.mode.includes(mode));
}

let home_limit = store.get('home.modes.l');
let home_has_limit = store.get('home.modes').hasOwnProperty('l');
let home_has_limit = 'l' in store.get('home.modes');
let home_ops = findByMode(store.get('home.users'), '@');
let home_ops_users = home_ops.map(user => findByNick(store.get('users'), user.nick));
let foo_in_home = !!findByNick(store.get('home.users'), 'foo');

let home_ops = store.findByMode('home.users', '@');
let home_ops_users = home_ops.map(user => store.findByNick('users', user.nick));
let foo_in_home = !!store.findByNick('home.users', 'foo');
