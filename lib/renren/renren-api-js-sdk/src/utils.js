/**
 * #@+
 * 
 * @private
 */
var overloadSetter = function(fn) {
	return function(s, a, b) {
		if (a == null)
			return s;
		if (typeof a != 'string') {
			for (var k in a)
				fn.call(s, k, a[k]);
		} else {
			fn.call(s, a, b);
		}
		return s;
	};
},

typeOf = function(item) {
	if (item == null)
		return 'null';
	if (item instanceof String || typeof item == 'string')
		return 'string';
	if (item instanceof Array)
		return 'array';
	if (item.nodeName) {
		if (item.nodeType == 1)
			return 'element';
		if (item.nodeType == 3)
			return (/\S/).test(item.nodeValue) ? 'textnode' : 'whitespace';
	} else if (typeof item.length == 'number') {
		if (item.callee)
			return 'arguments';
		if ('item' in item)
			return 'collection';
	}
	return typeof item;
},

guid = function() {
	return (Math.random() * (1 << 30)).toString(36).replace('.', '');
},

extend = overloadSetter(function(key, value) {
			this[key] = value;
		}),

implement = overloadSetter(function(key, value) {
			this.prototype[key] = value;
		}),

bind = function(fn, thisobj, args) {
	return function() {
		if (!args && !arguments.length)
			return fn.call(thisobj);
		if (args && arguments.length)
			return fn.apply(thisobj, args.concat(Array.from(arguments)));
		return fn.apply(thisobj, args || arguments);
	};
},

cloneOf = function(item) {
	switch (typeOf(item)) {
		case 'array' :
		case 'object' :
			return clone(item);
		default :
			return item;
	}
},

clone = function(original) {
	if (typeOf(original) == 'array') {
		var i = original.length, clone = new Array(i);
		while (i--)
			clone[i] = cloneOf(original[i]);
		return clone;
	} else if (typeOf(original) == 'string') {
		return new String(original);
	}
	var clone = {};
	for (var key in original)
		clone[key] = cloneOf(original[key]);
	return clone;
},

forEach = function(object, fn, bind) {
	if (typeOf(object) == 'array') {
		for (var i = 0, l = object.length; i < l; i++) {
			if (i in object)
				fn.call(bind, object[i], i, object);
		}
	} else
		for (var key in object) {
			if (Object.prototype.hasOwnProperty.call(object, key))
				fn.call(bind, object[key], key, object);
		}
},

indexOf = function(array, item, from) {
	var len = array.length;
	for (var i = (from < 0) ? Math.max(0, len + from) : from || 0; i < len; i++) {
		if (array[i] === item)
			return i;
	}
	return -1;
},

mergeOne = function(source, key, current) {
	switch (typeOf(current)) {
		case 'object' :
			if (typeOf(source[key]) == 'object')
				merge(source[key], current);
			else
				source[key] = clone(current);
			break;
		case 'array' :
			source[key] = clone(current);
			break;
		default :
			source[key] = current;
	}
	return source;
},

merge = function(source, k, v) {
	if (typeOf(k) == 'string')
		return mergeOne(source, k, v);
	for (var i = 1, l = arguments.length; i < l; i++) {
		var object = arguments[i];
		for (var key in object)
			mergeOne(source, key, object[key]);
	}
	return source;
},

combineOne = function(source, key, value) {
	var st = typeOf(source[key]);
	switch (typeOf(value)) {
		case 'object' :
		case 'array' :
			if (st == 'object')
				combine(source[key], value);
			else if (st == 'array') {
				var array = clone(value);
				for (var i = 0, l = array.length; i < l; i++) {
					if (indexOf(source[key], array[i]) == -1)
						source[key].push(array[i]);
				}
			} else if (st == 'null')
				source[key] = clone(value);
			break;
		default :
			if (st == 'null')
				source[key] = value;
	}
	return source;
},

combine = function(source, k, v) {
	if (typeOf(k) == 'string')
		return combineOne(source, k, v);
	for (var i = 1, l = arguments.length; i < l; i++) {
		var object = arguments[i];
		for (var key in object)
			combineOne(source, key, object[key]);
	}
	return source;
},

append = function(original) {
	for (var i = 1, l = arguments.length; i < l; i++) {
		if (typeOf(original) == 'array') {
			var atp = typeOf(arguments[i]);
			if (atp == 'array' || atp == 'arguments') {
				for (var j = 0, lg = arguments[i].length; j < lg; j++)
					original.push(arguments[i][j]);
			} else if (atp != 'null')
				original.push(arguments[i]);
		} else {
			var extended = arguments[i] || {};
			for (var key in extended)
				original[key] = extended[key];
		}
	}
	return original;
},

parsePiece = function(key, val, base) {
	var sliced = /([^\]]*)\[([^\]]*)\](.*)?/.exec(key);
	if (!sliced) {
		base[key] = val;
		return;
	}
	var prop = sliced[1], subp = sliced[2], others = sliced[3];
	if (!isNaN(subp)) {
		var numVal = +subp;
		if (subp === numVal.toString(10)) {
			subp = numVal;
		}
	}
	base[prop] = base[prop] || (typeof subp == 'number' ? [] : {});
	if (others == null)
		base[prop][subp] = val;
	else
		parsePiece('' + subp + others, val, base[prop]);
},

fromQueryString = function(qs) {
	var decode = function(s) {
		return decodeURIComponent(s.replace(/\+/g, ' '));
	}, params = {}, parts = qs.split('&'), pair, val;
	for (var i = 0; i < parts.length; i++) {
		pair = parts[i].split('=', 2);
		if (pair && pair.length == 2) {
			val = decode(pair[1]);
			if (typeOf(val) == 'string') {
				val = val.replace(/^\s+|\s+$/g, '');
				// convert numerals to numbers
				if (!isNaN(val)) {
					numVal = +val;
					if (val === numVal.toString(10)) {
						val = numVal;
					}
				}
			}
			parsePiece(decode(pair[0]), val, params);
		}
	}
	return params;
},

toQueryString = function(object, base) {
	var queryString = [];
	forEach(object, function(value, key) {
				if (base)
					key = base + '[' + key + ']';
				var result;
				switch (typeOf(value)) {
					case 'object' :
						result = toQueryString(value, key);
						break;
					case 'array' :
						var qs = {};
						forEach(value, function(val, i) {
									qs[i] = val;
								});
						result = toQueryString(qs, key);
						break;
					case 'string' :
					case 'number' :
						result = encodeURIComponent(key) + '='
								+ encodeURIComponent(value);
						break;
				}
				if (result && value != null)
					queryString.push(result);
			});
	return queryString.join('&');
},

special = {
	'\b' : '\\b',
	'\t' : '\\t',
	'\n' : '\\n',
	'\f' : '\\f',
	'\r' : '\\r',
	'"' : '\\"',
	'\\' : '\\\\'
},

escape = function(chr) {
	return special[chr] || '\\u'
			+ ('0000' + chr.charCodeAt(0).toString(16)).slice(-4);
},

validateJSON = function(string) {
	string = string
			.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
			.replace(
					/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
					']').replace(/(?:^|:|,)(?:\s*\[)+/g, '');
	return (/^[\],:{}\s]*$/).test(string);
},

parseJSON = function(string) {
	if (!string || typeOf(string) != 'string')
		return null;
	if (window.JSON && window.JSON.parse)
		return window.JSON.parse(string);
	if (!validateJSON(string))
		throw new Error("Invalid JSON: " + string);
	return eval('(' + string + ')');
},

toJSON = window.JSON && window.JSON.stringify ? function(obj) {
	return window.JSON.stringify(obj);
} : function(obj) {
	if (obj && obj.toJSON)
		obj = obj.toJSON();
	switch (typeOf(obj)) {
		case 'string' :
			return '"' + obj.replace(/[\x00-\x1f\\"]/g, escape) + '"';
		case 'array' :
			var string = [];
			forEach(obj, function(value, key) {
						var json = toJSON(value);
						if (json)
							string.push(json);
					});
			return '[' + string + ']';
		case 'object' :
			var string = [];
			forEach(obj, function(value, key) {
						var json = toJSON(value);
						if (json)
							string.push(toJSON(key) + ':' + json);
					});
			return '{' + string + '}';
		case 'number' :
		case 'boolean' :
			return '' + obj;
		case 'null' :
			return 'null';
	}
	return null;
};
/** #@- */