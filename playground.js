// Local Dependencies
const Client = require('./lib/client');
const logger = require('./lib/logger');

let client = new Client({
	host: 'irc.div0.ch',
	port: 6697,
	ssl: true,
	rejectUnauthorized: true,

	nick: 'bot',
	username: 'rxbot',

	// saslMechanism: 'plain',
	// saslPassword: 'secret',
});

client.connect(function () {
	this.actionOut$.next({
		command: 'JOIN',
		channels: ['#home', '#rxbot'],
	});

	this.join$.subscribe(({ channel }) => {
		if (channel === '#rxbot') {
			this.actionOut$.next({
				command: 'PRIVMSG',
				target: channel,
				text: ['First line', 'Second line', 'Third line'],
				prefix: 'Test:',
			});
		}
	});

	this.messageIn$.subscribe(message => {
		logger.debug(JSON.stringify(message, null, 2));
	});

	this.privmsg$.subscribe(({ sender, target, text }) => {
		logger.log(`S: PRIVMSG ${sender} ${target} :${text}`);

		if (text === 'json') {
			console.log(this.store.json());
		} else if (text === 'ctcp') {
			this.actionOut$.next({
				command: 'CTCP',
				message: 'VERSION',
				nick: sender,
			});
		}
	});

	this.notice$.subscribe(({ sender, target, text }) => {
		logger.log(`S: NOTICE ${sender} ${target} :${text}`);
	});

	this.pong$.subscribe(({ id }) => {
		logger.log(`S: PONG ${id}`);
	});

	this.who$.subscribe(({ channel, users }) => {
		let template = '{nick}!{username}@{host} ({server}) {realname}';
		let strings = users.map(user => template
			.replace('{nick}', user.nick)
			.replace('{username}', user.username)
			.replace('{host}', user.host)
			.replace('{server}', user.server)
			.replace('{realname}', user.realname)
		);
		logger.log(`S: WHO ${channel} ${JSON.stringify(strings)}`);
	});
});
