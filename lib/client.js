// Node Dependencies
const tls = require('tls');

// NPM Dependencies
const assert = require('assert');
const { parse: parseLine } = require('irc-message');
const replies = require('irc-replies');
const cloneDeep = require('lodash/cloneDeep');
const intersection = require('lodash/intersection');
const pick = require('lodash/pick');
const pull = require('lodash/pull');
const remove = require('lodash/remove');
const { Subject } = require('rxjs');
const { buffer, filter, map, partition } = require('rxjs/operators');
const { streamToRx: fromStream } = require('rxjs-stream');
const saslprep = require('saslprep');
const split2 = require('split2');

// Local Dependencies
const logger = require('./logger');
const patchCommand = require('./patch');
const Store = require('./store');
const package = require('../package');

//   ____ _ _            _
//  / ___| (_) ___ _ __ | |_
// | |   | | |/ _ \ '_ \| __|
// | |___| | |  __/ | | | |_
//  \____|_|_|\___|_| |_|\__|
//


const REGEXP_CTCP = /(\x01|\u0001)(\S+)(?: (.+))?\1/;
const CLIENT_VERSION = `${package.name} v${package.version}`;
const CLIENT_SOURCE = package.homepage;

const CTCP_RESPONSES = {
	CLIENTINFO: () => `CLIENTINFO ${Object.keys(CTCP_RESPONSES).join(' ')}`,
	PING: id => `PING ${id || ' '}`,
	SOURCE: () => `SOURCE ${CLIENT_SOURCE}`,
	TIME: () => `TIME ${new Date}`,
	VERSION: () => `VERSION ${CLIENT_VERSION}`,
};

const DEFAULTS = {
	port: 6697,
	rejectUnauthorized: false,
	capabilities: ['multi-prefix'],
	realname: 'ReactiveX IRC client',
	saslMechanism: null,
};

module.exports = class Client {
	/**
	 * @param {object} options
	 * @param {string} options.host
	 * @param {number} [options.port=6697]
	 * @param {boolean} [options.rejectUnauthorized=false]
	 * @param {string[]} [options.capabilities=['multi-prefix']]
	 * @param {string} options.nick
	 * @param {string} [options.username] Nick will be used if omitted.
	 * @param {string} [options.realname='ReactiveX IRC client']
	 * @param {string} [options.saslMechanism=null]
	 * @param {string} [options.saslPassword]
	 * @returns void
	 */
	constructor(options) {
		this.settings = cloneDeep({ ...DEFAULTS, ...options });

	}

	/** Add socket information to the store. */
	setStoreFromSocket(socket) {
		this.store.set('server.encrypted', socket.encrypted);
		this.store.set('server.authorized', socket.authorized);
		this.store.set('server.authorizationError', socket.authorizationError);
		//this.store.set('server.peerCertificate', socket.getPeerCertificate());
		this.store.set('server.cipher', socket.getCipher());
		this.store.set('server.ephemeral', socket.getEphemeralKeyInfo());
		this.store.set('server.protocol', socket.getProtocol());
		this.store.set('server.remoteFamily', socket.remoteFamily);
		this.store.set('server.remoteAddress', socket.remoteAddress);
		this.store.set('server.remotePort', socket.remotePort);
		this.store = new Store();
	}

	async connect() {
		// Validation
		assert(typeof this.settings.host, 'string', 'No host address provided.');
		assert(typeof this.settings.nick, 'string', 'No nickname provided.');

		// Fallbacks
		this.settings.username = this.settings.username || this.settings.nick;

		// Adjust capabilities for SASL.
		if (!this.settings.saslMechanism) {
			pull(this.settings.capabilities, 'sasl');
		} else if (!this.settings.capabilities.includes('sasl')) {
			this.settings.capabilities.push('sasl');
		}

		// Pick options for TLS socket.
		let options = pick(this.settings, ['host', 'port', 'rejectUnauthorized']);

		let socket = await new Promise((resolve, reject) => {
			let socket = tls.connect(options);
			socket.setEncoding('utf8');
			socket.on('error', reject);
			socket.once('secureConnect', () => resolve(socket));
		});

		this.setStoreFromSocket(socket);

		// Create the output RxJS stream ...
		// ... and pass the commands to the socket.
		this.rawOut$ = new Subject();
		this.rawOut$.subscribe(command => {
			this.logger.info(`C: ${command}`);
			socket.write(`${command}\r\n`);
		});

		// Pipe standard input into the socket.
		process.stdin.pipe(socket);
		process.stdin.resume();

		// Transform the chunks into lines.
		let lines = socket.pipe(split2());
		// Convert the Node stream into an RxJS observable.
		this.rawIn$ = fromStream(lines);
		// Parse the raw IRC messages into objects ...
		// ... and map numerical commands into strings.
		this.messageIn$ = this.rawIn$.pipe(
			map(parseLine),
			map(patchCommand),
		);

		this.prepareStreams();
		this.prepareSubscriptions();
	}

	//  ____  _
	// / ___|| |_ _ __ ___  __ _ _ __ ___  ___
	// \___ \| __| '__/ _ \/ _` | '_ ` _ \/ __|
	//  ___) | |_| | |  __/ (_| | | | | | \__ \
	// |____/ \__|_|  \___|\__,_|_| |_| |_|___/
	//

	prepareStreams() {
		// NOTICE
		this.notice$ = this.messageIn$.pipe(
			filter(message => message.command === 'NOTICE'),
			map(message => ({
				sender: message.prefix.split('!')[0],
				target: message.params[0],
				text: message.params[1],
			})),
		);

		// PRIVMSG, CTCP
		let [ctcp$, privmsg$] = this.messageIn$.pipe(
			filter(message => message.command === 'PRIVMSG'),
			partition(message => REGEXP_CTCP.test(message.params[1])),
		);

		this.privmsg$ = privmsg$.pipe(
			map(message => ({
				sender: message.prefix.split('!')[0],
				target: message.params[0],
				text: message.params[1],
			})),
		);

		this.ctcp$ = ctcp$.pipe(
			map(message => {
				let [, delimiter, command, params]
					= message.params[1].match(REGEXP_CTCP);

				return {
					sender: message.prefix.split('!')[0],
					target: message.params[0],

					delimiter, command, params,
				};
			}),
		);

		// CAP
		this.cap$ = this.messageIn$.pipe(
			filter(message => message.command === 'CAP'),
			map(message => ({
				subcommand: message.params[1],
				capabilities: message.params[2].split(' '),
			})),
		);

		// AUTHENTICATE
		this.authenticate$ = this.messageIn$.pipe(
			filter(message => message.command === 'AUTHENTICATE'),
			map(message => ({ message: message.params[0] })),
		);

		// PING, PONG
		this.ping$ = this.messageIn$.pipe(
			filter(message => message.command === 'PING'),
			map(message => ({ id: message.params[1] })),
		);

		this.pong$ = this.messageIn$.pipe(
			filter(message => message.command === 'PONG'),
			map(message => ({ id: message.params[1] })),
		);

		// JOIN
		this.join$ = this.messageIn$.pipe(
			filter(message => message.command === 'JOIN'),
			map(message => ({
				nick: message.prefix.split('!')[0],
				channel: message.params[0],
			})),
		);

		// PART
		this.part$ = this.messageIn$.pipe(
			filter(message => message.command === 'PART'),
			map(message => ({
				nick: message.prefix.split('!')[0],
				channel: message.params[0],
				reason: message.params[1],
			})),
		);

		// QUIT
		this.quit$ = this.messageIn$.pipe(
			filter(message => message.command === 'QUIT'),
			map(message => ({
				nick: message.prefix.split('!')[0],
				// TODO Check if params[0] is really the reason.
				reason: message.params[0],
			})),
		);

		// NICK
		this.nick$ = this.messageIn$.pipe(
			filter(message => message.command === 'NICK'),
			map(message => ({
				oldNick: message.prefix.split('!')[0],
				newNick: message.params[0],
			})),
		);

		// KICK
		this.kick$ = this.messageIn$.pipe(
			filter(message => message.command === 'KICK'),
			map(message => ({
				by: message.prefix.split('!')[0],
				channel: message.params[0],
				who: message.params[1],
				reason: message.params[2],
			})),
		);

		// TOPIC
		this.topic$ = this.messageIn$.pipe(
			filter(message => message.command === 'TOPIC'),
			map(message => ({
				channel: message.params[0],
				text: message.params[1],
				who: message.prefix.split('!')[0],
				time: new Date(),
			})),
		);

		this.topicText$ = this.messageIn$.pipe(
			filter(message => message.command === 'RPL_TOPIC'),
			map(message => ({
				channel: message.params[1],
				text: message.params[2],
			})),
		);

		this.topicWhoTime$ = this.messageIn$.pipe(
			filter(message => message.command === 'RPL_TOPIC_WHO_TIME'),
			map(message => ({
				channel: message.params[1],
				who: message.params[2].split('!')[0],
				time: new Date(message.params[3] * 1000),
			})),
		);

		// MOTD
/*
		let rpl_motdstart$ = this.messageIn$.pipe(
			filter(message => message.command === 'RPL_MOTDSTART'),
		);
*/
		let rpl_motd$ = this.messageIn$.pipe(
			filter(message => message.command === 'RPL_MOTD'),
			map(message => ({ text: message.params[1] })),
		);

		let rpl_endofmotd$ = this.messageIn$.pipe(
			filter(message => message.command === 'RPL_ENDOFMOTD'),
		);

		this.motd$ = rpl_motd$.pipe(
			buffer(rpl_endofmotd$),
			filter(messages => messages.length > 0),
			map(messages => ({
				text: messages.map(message => message.text),
			})),
		);

		// WHO
		let rpl_whoreply$ = this.messageIn$.pipe(
			filter(message => message.command === 'RPL_WHOREPLY'),
			map(message => ({
				channel: message.params[1],
				user: {
					nick: message.params[5],
					username: message.params[2],
					realname: message.params[7].match(/\S+\s+(.+)/)[1],
					host: message.params[3],
					server: message.params[4],
				},
			})),
		);

		let rpl_endofwho$ = this.messageIn$.pipe(
			filter(message => message.command === 'RPL_ENDOFWHO'),
		);

		this.who$ = rpl_whoreply$.pipe(
			buffer(rpl_endofwho$),
			filter(messages => messages.length > 0),
			map(messages => ({
				channel: messages[0].channel,
				users: messages.reduce((users, message) => users.concat(message.user), []),
			})),
		);

		// NAMES
		let rpl_namesreply$ = this.messageIn$.pipe(
			filter(message => message.command === 'RPL_NAMREPLY'),
			map(message => ({
				channel: message.params[2],
				users: message.params[3].split(' ').map(user => {
					let [, modes = '', nick] = user.match(/^([~&@%+]*)(.+)$/);

					return {
						nick,
						modes: modes.split(''),
					};
				}),
			})),
		);

		let rpl_endofnames$ = this.messageIn$.pipe(
			filter(message => message.command === 'RPL_ENDOFNAMES'),
		);

		this.names$ = rpl_namesreply$.pipe(
			buffer(rpl_endofnames$),
			filter(messages => messages.length > 0),
			map(messages => ({
				channel: messages[0].channel,
				users: messages.reduce((users, message) => users.concat(message.users), []),
			}))
		);
	}

	//  ____        _                   _       _   _
	// / ___| _   _| |__  ___  ___ _ __(_)_ __ | |_(_) ___  _ __  ___
	// \___ \| | | | '_ \/ __|/ __| '__| | '_ \| __| |/ _ \| '_ \/ __|
	//  ___) | |_| | |_) \__ \ (__| |  | | |_) | |_| | (_) | | | \__ \
	// |____/ \__,_|_.__/|___/\___|_|  |_| .__/ \__|_|\___/|_| |_|___/
	//                                   |_|
	//

	prepareSubscriptions() {
		this.messageIn$.subscribe(message => {
			switch (message.command) {
				// SASL authentication successful
				case '903':
					this.rawOut$.next('CAP END');
					break;

				case 'RPL_WELCOME':
					this.store.set('user.nick', message.params[0]);
					break;

				case 'RPL_ISUPPORT': {
					let support = message.params
						.slice(1, -1)
						.map(feature => feature.split('='))
						.map(feature => {
							let [key, value] = feature;
							if (value) {
								if (value.includes(',')) {
									value = value.split(',');
								} else if (/^\d+$/.test(value)) {
									value = Number(value);
								}
							}
							return { [key]: value };
						})
						.reduce((all, feature) => Object.assign(all, feature), {});
					this.store.assign('server.support', support);
					break;
				}

				case 'RPL_LUSEROP': {
					let [, current] = message.params;
					this.store.assign('server.stats', {
						opersOnline: Number(current),
					});
					break;
				}

				case 'RPL_LUSERCHANNELS': {
					let [, current] = message.params;
					this.store.assign('server.stats', {
						channelsFormed: Number(current),
					});
					break;
				}

				case 'RPL_LOCALUSERS': {
					let [, current, max] = message.params;
					this.store.assign('server.stats', {
						localCurrentUsers: Number(current),
						localMaxUsers: Number(max),
					});
					break;
				}

				case 'RPL_GLOBALUSERS': {
					let [, current, max] = message.params;
					this.store.assign('server.stats', {
						globalCurrentUsers: Number(current),
						globalMaxUsers: Number(max),
					});
					break;
				}
			}
		});

		// PING -> PONG
		this.ping$.subscribe(({ id }) => {
			logger.log(`S: PING ${id || ''}`);
			this.rawOut$.next(`PONG ${id || ''}`);
		});

		// NAMES
		this.names$.subscribe(({ channel, users }) => {
			logger.log(`S: NAMES ${channel} ${JSON.stringify(users)}`);
			let chan = this.store.find('channels', ['name', channel]);

			if (chan) {
				chan.users = users;
			}
		});

		// MOTD
		this.motd$.subscribe(({ text }) => {
			logger.log(`S: MOTD\r\n${text.join('\r\n')}`);
			this.store.set('server.motd', text);
		});

		// NICK
		this.nick$.subscribe(({ oldNick, newNick }) => {
			logger.log(`S: NICK ${oldNick} -> ${newNick}`);

			if (oldNick === this.store.get('user.nick')) {
				this.store.set('user.nick', newNick);
			} else {
				let user = this.store.find('users', ['nick', oldNick]);

				if (user) {
					user.nick = newNick;
				}
			}

			this.store.get('channels')
				.reduce((users, channel) => users.concat(channel.users), [])
				.filter(user => user.nick === oldNick)
				.forEach(user => user.nick = newNick);
		});

		// JOIN
		this.join$.subscribe(({ nick, channel }) => {
			logger.log(`S: JOIN ${channel} ${nick}`);

			if (nick === this.store.get('user.nick')) {
				this.store.push('channels', {
					name: channel,
					topic: {},
					modes: [],
					users: [],
				});
			} else {
				let chan = this.store.find('channels', ['name', channel]);

				if (chan) {
					chan.users.push({ nick, modes: [] });
				}
			}
		});

		// PART
		this.part$.subscribe(({ nick, channel, reason }) => {
			logger.log(`S: PART ${channel} ${nick} :${reason}`);

			if (nick === this.store.get('user.nick')) {
				this.store.remove('channels', ['name', channel]);
			} else {
				let chan = this.store.find('channels', ['name', channel]);

				if (chan) {
					remove(chan.users, user => user.nick === nick);
				}
			}
		});

		// CAP
		this.cap$.subscribe(({ subcommand, capabilities }) => {
			logger.log(`S: CAP ${subcommand} ${capabilities.join(' ')}`);

			let overlap = intersection(this.settings.capabilities, capabilities);

			switch (subcommand) {
				case 'LS':
					if (overlap.length > 0) {
						this.rawOut$.next(`CAP REQ :${overlap.join(' ')}`);
					} else {
						this.rawOut$.next('CAP END');
					}
					break;

				case 'ACK':
					if (overlap.includes('sasl')) {
						let mechanism = this.settings.saslMechanism;

						if (mechanism === 'plain') {
							this.rawOut$.next('AUTHENTICATE PLAIN');
						} else {
							throw new Error(`SASL mechanism (${mechanism}) not supported.`);
						}
					} else {
						this.rawOut$.next('CAP END');
					}
					break;
				}
			}
		});

		// AUTHENTICATE
		this.authenticate$
			.pipe(filter(({ message }) => message === '+'))
			.subscribe(() => {
				if (this.settings.saslMechanism === 'plain') {
					let token = Buffer.from(
						saslprep(this.settings.username) + '\0' +
						saslprep(this.settings.username) + '\0' +
						saslprep(this.settings.saslPassword)
					).toString('base64');

					this.rawOut$.next(`AUTHENTICATE ${token}`);
				logger.log(`S: AUTHENTICATE +`);

				}
			});

		// CTCP
		this.ctcp$
			.pipe(filter(({ target }) => target === this.store.get('user.nick')))
			.subscribe(({ sender, target, delimiter, command, params }) => {
				logger.log(`S: CTCP ${sender} ${target} :${command} ${params || ''}`);

				if (command in CTCP_RESPONSES) {
					let payload = CTCP_RESPONSES[command](params);
					let response = `NOTICE ${sender} :${delimiter}${payload}${delimiter}`;
					this.rawOut$.next(response);
				} else {
					logger.warn('Unknown CTCP request:', command, params);
				}
			});

		// TOPIC
		this.topic$.subscribe(({ channel, text, who, time }) => {
			logger.log(`S: TOPIC ${channel} :${text} BY ${who} AT ${time}`);
			let index = this.store.findIndex('channels', ['name', channel]);

			if (index > -1) {
				this.store.assign(`channels[${index}].topic`, {
					text: text,
					setBy: who,
					setOn: time,
				});
			}
		});

		this.topicText$.subscribe(({ channel, text }) => {
			logger.log(`S: TOPIC ${channel} :${text}`);
			let index = this.store.findIndex('channels', ['name', channel]);

			if (index > -1) {
				this.store.assign(`channels[${index}].topic`, {
					text: text,
				});
			}
		});

		this.topicWhoTime$.subscribe(({ channel, who, time }) => {
			logger.log(`S: TOPIC ${channel} BY ${who} AT ${time}`);
			let index = this.store.findIndex('channels', ['name', channel]);

			if (index > -1) {
				this.store.assign(`channels[${index}].topic`, {
					setBy: who,
					setOn: time,
				});
			}
		});
	}

	//  ____
	// | __ )  __ _  __ _  __ _  __ _  __ _  ___
	// |  _ \ / _` |/ _` |/ _` |/ _` |/ _` |/ _ \
	// | |_) | (_| | (_| | (_| | (_| | (_| |  __/
	// |____/ \__,_|\__, |\__, |\__,_|\__, |\___|
	//              |___/ |___/       |___/
	//
	// This is an abstraction used by the admin module.
	// Ideally, I would like to handle this use-case with an action.
	// But, I haven't had any good ideas yet.
	//

	setPrivileges(channel, action, privilege, nicks) {
		assert.strictEqual(typeof channel, 'string');
		assert.match(action, /\+|\-/);
		assert.match(privilege, /v|h|o/i);

		if (typeof nicks === 'string') {
			nicks = nicks.split(' ');
		}
		assert(nicks instanceof Array);

		let batch_size = 6;
		let batch_count = Math.ceil(nicks.length / batch_size);

		for (let i = 0; i < batch_count; i++) {
			let batch_offset = i * batch_size;
			let batch_nicks = nicks.slice(batch_offset, batch_offset + batch_size);
			let batch_mode = action + privilege.repeat(batch_nicks.length);
			let batch_args = ['MODE', channel, batch_mode].concat(batch_nicks);

			this.rawOut$.next(batch_args.join(' '));
		}
	}

	giveOps(channel, nicks) {
		this.setPrivileges(channel, '+', 'o', nicks);
	}

	takeOps(channel, nicks) {
		this.setPrivileges(channel, '-', 'o', nicks);
	}

	giveHops(channel, nicks) {
		this.setPrivileges(channel, '+', 'h', nicks);
	}

	takeHops(channel, nicks) {
		this.setPrivileges(channel, '-', 'h', nicks);
	}

	giveVoices(channel, nicks) {
		this.setPrivileges(channel, '+', 'v', nicks);
	}

	takeVoices(channel, nicks) {
		this.setPrivileges(channel, '-', 'v', nicks);
	}
}
