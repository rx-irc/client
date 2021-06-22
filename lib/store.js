// NPM Dependencies
const cloneDeep = require('lodash/cloneDeep');
const find = require('lodash/find');
const get = require('lodash/get');
const remove = require('lodash/remove');
const set = require('lodash/set');

//  ____  _
// / ___|| |_ ___  _ __ ___
// \___ \| __/ _ \| '__/ _ \
//  ___) | || (_) | | |  __/
// |____/ \__\___/|_|  \___|
//

module.exports = function Store() {
	let data = {
		connection: {},
		server: { stats: {}, support: {} },
		user: {},
		channels: [],
		users: [],
	};

	this.get = (path, fallback) => get(data, path, fallback);
	this.set = (path, value) => void set(data, path, value);

	this.dump = () => cloneDeep(data);
	this.json = () => JSON.stringify(data, null, 2);

	// Array
	this.push = (path, ...values) => {
		let array = getArray(data, path);
		array.push(...values);
	};
	this.find = (path, predicate) => {
		let array = getArray(data, path);
		return find(array, predicate);
	};
	this.remove = (path, predicate) => {
		let array = getArray(data, path);
		remove(array, predicate);
	};
	this.filter = (path, predicate) => {
		let array = getArray(data, path);
		return array.filter(predicate);
	};
	this.findIndex = (path, predicate) => {
		let array = getArray(data, path);
		return array.findIndex(predicate);
	};

	// Object
	this.assign = (path, ...sources) => {
		let object = getObject(data, path);
		Object.assign(object, ...sources);
	};
}

function getArray(data, path) {
	let array = get(data, path);

	if (array === undefined) {
		array = [];
		set(data, path, array);
	} else if (!Array.isArray(array)) {
		throw new Error('Path does not point to an array.');
	}

	return array;
}

function getObject(data, path) {
	let object = get(data, path);

	if (object === undefined) {
		object = {};
		set(data, path, object);
	} else if (typeof object !== 'object') {
		throw new Error('Path does not point to an object.');
	}

	return object;
};
