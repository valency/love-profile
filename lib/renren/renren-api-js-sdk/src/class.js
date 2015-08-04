/**
 * #@+
 * 
 * @class 模拟面向对象中的“类”
 * @private
 */
var Class = function(params) {
	if (params instanceof Function)
		params = {
			initialize : params
		};

	var newClass = function() {
		reset(this);
		if (newClass.$prototyping)
			return this;
		this.$caller = null;
		var value = (this.initialize)
				? this.initialize.apply(this, arguments)
				: this;
		this.$caller = this.caller = null;
		return value;
	};
	Class.prototype.implement.call(newClass, params);

	newClass.constructor = Class;
	newClass.prototype.constructor = newClass;
	newClass.prototype.parent = parent;

	return newClass;
};
/**
 * 
 * 
 * @private
 */
var parent = function() {
	if (!this.$caller)
		throw new Error('The method "parent" cannot be called.');
	var name = this.$caller.$name, parent = this.$caller.$owner.parent, previous = (parent)
			? parent.prototype[name]
			: null;
	if (!previous)
		throw new Error('The method "' + name + '" has no parent.');
	return previous.apply(this, arguments);
};

var reset = function(object) {
	for (var key in object) {
		var value = object[key];
		switch (typeOf(value)) {
			case 'object' :
				var F = function() {
				};
				F.prototype = value;
				object[key] = reset(new F());
				break;
			case 'array' :
				object[key] = clone(value);
				break;
		}
	}
	return object;
};

var wrap = function(self, key, method) {
	if (method.$origin)
		method = method.$origin;
	var wrapper = function() {
		if (method.$protected && this.$caller == null)
			throw new Error('The method "' + key + '" cannot be called.');
		var caller = this.caller, current = this.$caller;
		this.caller = current;
		this.$caller = wrapper;
		var result = method.apply(this, arguments);
		this.$caller = current;
		this.caller = caller;
		return result;
	};
	extend(wrapper, {
				$owner : self,
				$origin : method,
				$name : key
			});
	return wrapper;
};

var implement = function(key, value, retain) {
	if (Class.Mutators.hasOwnProperty(key)) {
		value = Class.Mutators[key].call(this, value);
		if (value == null)
			return this;
	}

	if (typeof value == 'function') {
		this.prototype[key] = (retain) ? value : wrap(this, key, value);
	} else {
		merge(this.prototype, key, value);
	}

	return this;
};

var getInstance = function(klass) {
	klass.$prototyping = true;
	var proto = new klass;
	delete klass.$prototyping;
	return proto;
};

var removeOn = function(string) {
	return string.replace(/^on([A-Z])/, function(full, first) {
				return first.toLowerCase();
			});
};

Class.overloadSetter = function(fn) {
	return function(a, b) {
		if (a == null)
			return this;
		if (typeof a != 'string') {
			for (var k in a)
				fn.call(this, k, a[k]);
		} else {
			fn.call(this, a, b);
		}
		return this;
	};
};

Class.prototype.implement = Class.overloadSetter(implement);

Class.Mutators = {

	Extends : function(parent) {
		this.parent = parent;
		this.prototype = getInstance(parent);
	},

	Implements : function(items) {
		forEach(items, function(item) {
					var instance = new item;
					for (var key in instance)
						implement.call(this, key, instance[key], true);
				}, this);
	}
};
/** #@- */

var Events = new Class({
			$events : {},

			addEvent : function(type, fn, internal) {
				type = removeOn(type);
				this.$events[type] = (this.$events[type] || []);
				if (indexOf(this.$events[type], fn) == -1)
					this.$events[type].push(fn);
				if (internal)
					fn.internal = true;
				return this;
			},

			addEvents : function(events) {
				for (var type in events)
					this.addEvent(type, events[type]);
				return this;
			},

			fireEvent : function(type, args, delay) {
				type = removeOn(type);
				var events = this.$events[type];
				if (!events)
					return this;
				args = args || [];
				var t = typeOf(args);
				if (t != 'array' && t != 'arguments')
					args = [args];
				forEach(events, function(fn) {
							if (delay != null) {
								var self = this;
								window.setTimeout(function() {
											return fn.apply(self, args);
										}, delay);
							} else
								fn.apply(this, args);
						}, this);
				return this;
			},

			removeEvent : function(type, fn) {
				type = removeOn(type);
				var events = this.$events[type];
				if (events && !fn.internal) {
					var index = indexOf(events, fn);
					if (index != -1)
						delete events[index];
				}
				return this;
			},

			removeEvents : function(events) {
				var type;
				if (typeOf(events) == 'object') {
					for (type in events)
						this.removeEvent(type, events[type]);
					return this;
				}
				if (events)
					events = removeOn(events);
				for (type in this.$events) {
					if (events && events != type)
						continue;
					var fns = this.$events[type];
					for (var i = fns.length; i--;)
						if (i in fns) {
							this.removeEvent(type, fns[i]);
						}
				}
				return this;
			}

		});

var Options = new Class({
			setOptions : function() {
				var options = this.options = merge.apply(null, append([{},
										this.options], arguments));
				if (this.addEvent)
					for (var option in options) {
						if (typeof options[option] != 'function'
								|| !(/^on[A-Z]/).test(option))
							continue;
						this.addEvent(option, options[option]);
						delete options[option];
					}
				return this;
			}
		});