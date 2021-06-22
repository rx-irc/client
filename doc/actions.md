# Actions
Invalid actions are returned as `null`.

## MODE (WIP)
* target
* modes

```js
{
	command: 'MODE',
	target: '#rxbot',
	modes: {
		'(+|-)(v|h|o|a|q)': String | String[],
		'k': false | String,
		's': Boolean,

		'x': Boolean | String,
		'(+|-)(x)': String | String[],
	},
}
```

```js
{
	command: 'MODE', 
	target: '#rxbot',
	modes: {
		'-v': 'Jack',
		'+v': ['John', 'Jane'],
	},
}
```

```js
{
	command: 'MODE', 
	target: '#rxbot',
	modes: { 
		k: '123',
		s: true,
	},
}
```

```js
{
	command: 'MODE', 
	target: '#rxbot',
	modes: { 
		k: false, 
		s: false,
	},
}
```

## PRIVMSG, NOTICE
* target
* text
* prefix

```js
{
	command: 'PRIVMSG',
	target: 'NickServ',
	text: 'IDENTIFY rxbot 123',
}
```

```js
{
	command: 'PRIVMSG',
	target: '#rxbot',
	text: [
		'Lorem ipsum',
		'dolot sit amet.',
	],
	prefix: '[Test]',
}
```

## TOPIC
* channel
* text

```js
{
	command: 'TOPIC',
	channel: '#channel1',
}
```

```js
{
	command: 'TOPIC',
	channel: '#channel1',
	text: 'Lorem ipsum dolor sit amet.',
}
```

## NICK
* nick

```js
{
	command: 'NICK',
	nick: 'JohnDoe',
}
```

## JOIN
* channel
* key
* channels
  * name
  * key

```js
{
	command: 'JOIN',
	channel: '#channel1',
}
```

```js
{
	command: 'JOIN',
	channel: '#channel3',
	key: 'Secr3tPassw0rd',
}
```

```js
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
}
```

## PART
* channel
* channels
  * name
* reason

```js
{
	command: 'PART',
	channel: '#channel1',
	reason: 'Lorem ipsum dolor sit amet.',
}
```

```js
{
	command: 'PART',
	channels: [
		'#channel1',
		{
			name: '#channel2',
		},
		{
			name: '#channel3',
//			This will need multiple commands.
//			reason: 'Overriding reason for specific channel.',
		},
	],
	reason: 'Global reason unless overridden.',
}
```

## KICK
* channel
* user
* users
  * name
* channels
  * name
* reason

```js
{
	command: 'KICK',
	channel: '#channel1',
	user: 'user1',
	reason: 'Lorem ipsum dolor sit amet.',
}
```

```js
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
//			This will need multiple commands.
//			reason: 'Overriding reason for specific user.',
		},
	],
	reason: 'Global reason unless overridden.',
}
```

```js
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
//			This will need multiple commands.
//			reason: 'Overriding reason for specific channel.',
		},
	],
	reason: 'Global reason unless overridden.',
}
```

## CTCP
* nick
* message

```js
{
	command: 'CTCP',
	message: 'VERSION',
	user: 'user1',
}
```

```js
{
	command: 'CTCP',
	message: 'TIME',
	user: 'user1',
}
```

## QUIT
* reason

```js
{
	command: 'QUIT',
	reason: 'Bye',
}
```
