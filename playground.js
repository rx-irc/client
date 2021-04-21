// Local Dependencies
const Client = require('./lib/client');

let options = {
	host: 'irc.freenode.net',
	nick: 'rxbot',

	saslMechanism: 'plain',
	saslPassword: 'secret',

	logLevel: 'silly',
};

let client = new Client(options);

client.connect().then(() => {

	client.privmsg$.subscribe(({ sender, target, text }) => {
		client.logger.debug(`S: PRIVMSG ${sender} ${target} :${text}`);

		if (text === 'json') {
			console.log(client.store.json());
		} else if (text === 'ctcp') {
			client.rawOut$.next(`PRIVMSG ${sender} :\x01VERSION\x01`);
		}
	});

	client.notice$.subscribe(({ sender, target, text }) => {
		client.logger.debug(`S: NOTICE ${sender} ${target} :${text}`);
	});

	client.pong$.subscribe(({ id }) => {
		client.logger.debug(`S: PONG ${id}`);
	});

	client.who$.subscribe(({ channel, users }) => {
		let strings = users.map(user => `${user.nick}!${user.username}@${user.host} (${user.server}) ${user.realname}`);
		client.logger.debug(`S: WHO ${channel} ${JSON.stringify(strings)}`);
	});

	client.messageIn$.subscribe(message => {
		client.logger.silly(JSON.stringify(message, null, 2));
	});

}).catch(error => {
	client.logger.error(error);
});
