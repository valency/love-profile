var XDPC = {
	Server : new Class(
			/**
			 * @lends Renren.XDPC.Server.prototype
			 */
			{
		methods : {},

		/**
		 * @class 模似rpc实现异域窗口间方法的调用，此类是提供可被跨域调用方法的服务端
		 * @constructs
		 * @param methods
		 *            {Array} 提供可被跨域调用的方法
		 * @param clientOrigins
		 *            {String | Array} (optional)
		 *            允许调用的页面来源，如允许来自'http://www.example.com/'下的页面的调用
		 *            @example
		 *            new Renren.XDPC.Server({'size': setSize, 'trace': trace}, ['http://www.example.com/']);
		 */
		initialize : function(methods, clientOrigins) {
			XD.addEvent('receivedXDMessage', bind(this.handleXDMessages, this));
			if (methods) {
				this.addMethods(methods, clientOrigins);
			}
		},

		/**
		 * 公开单个跨域方法
		 * 
		 * @param name
		 *            {String} 公开的跨域方法名
		 * @param fn
		 *            {Function} 公开的跨域方法
		 * @param orgns
		 *            {Array} (optional) 允许调用的页面来源
		 */
		addMethod : function(name, fn, orgns) {
			if (!this.methods[name]) {
				this.methods[name] = XDPC.proxy(name, fn, orgns
								&& typeOf(orgns) != 'array' ? [orgns] : orgns);
			}
		},

		/**
		 * 公开多个跨域方法
		 * 
		 * @param name
		 *            {Object} 公开的多个跨域方法，方法名为key，方法体为value
		 * @param clientOrgns
		 *            (optional) {String | Array} 允许调用的页面来源
		 */
		addMethods : function(methods, clientOrgns) {
			if (clientOrgns && typeOf(clientOrgns) != 'array') {
				clientOrgns = [clientOrgns];
			}
			var orgns = append([], clientOrgns);
			for (var name in methods) {
				this.addMethod(name, methods[name], orgns);
			}
		},

		/**
		 * 移除一个跨域方法
		 * 
		 * @param name
		 *            {String} 跨域方法名
		 */
		removeMethod : function(name) {
			if (this.methods[name])
				delete this.methods[name];
		},

		/**
		 * @private
		 */
		handleXDMessages : function(msg) {
			if (msg.data && msg.data.method) {
				var proxyMethod = this.methods[msg.data.method];
				if (proxyMethod) {
					proxyMethod(msg);
				}
			}
		}
	}),

	proxy : function(name, fn, origins) {
		return function(msg) {
			if (origins && origins.length > 0
					&& !XDPC.checkOrigin(msg.origin, origins))
				return;
			var r = fn.apply(null, fn.internal ? msg : msg.data.args);
			if (msg.data.cbid)
				XD.sendMessage({
							result : r,
							cbid : msg.data.cbid
						}, msg.origin, msg.transport, msg.source);
		}
	},

	checkOrigin : function(orgn, origins) {
		if (!orgn)
			return false;
		for (var i = 0, l = origins.length; i < l; i++) {
			if (origins[i].indexOf(orgn) == 0 || orgn.indexOf(origins[i]) == 0)
				return true;
		}
		return false;
	},

	Client : new Class(
			/**
			 * @lends Renren.XDPC.Client.prototype
			 */
			{

		callbacks : {},

		/**
		 * @class 跨域调用的客户端，发起对服务端所提供方法的调用
		 * @constructs
		 * @param server
		 *            {Object} 要调用的服务端窗口的跨域信息
		 *            @example
		 *            new Renren.XDPC.Client({relation:'parent', origin: 'http://apps.renren.com/'});
		 */
		initialize : function(server) {
			XD.addEvent('receivedXDMessage', bind(this.handleXDMessages, this));
			this.server = merge({}, server);
		},

		/**
		 * @private
		 */
		handleXDMessages : function(msg) {
			if (msg.data && msg.data.cbid) {
				var cb = this.callbacks[msg.data.cbid];
				if (cb && this.checkOrigin(msg.origin)) {
					delete this.callbacks[msg.data.cbid];
					cb(msg.data.result);
				}
			}
		},

		/**
		 * @private
		 */
		checkOrigin : function(origin) {
			return XDPC.checkOrigin(origin, [this.server.origin])
		},

		/**
		 * @param name
		 *            {String} 跨域方法名
		 * @param args
		 *            {Array} 跨域方法参数
		 * @param callback
		 *            {Function} (optional) 跨域方法执行完后再跨域回调，为空时将不进行回调
		 */
		call : function(name, args, callback) {
			var ts = XD.transports, trans = ts.postMessage || ts.flash, tp = typeOf(args), cbid;
			if (!trans)
				return;
			if (callback) {
				cbid = guid();
				this.callbacks[cbid] = callback;
			}
			if (tp != 'array' && tp != 'arguments')
				args = [args];
			XD.sendMessage({
						method : name,
						args : args,
						cbid : cbid
					}, this.server.origin, trans, this.server.relation);
		}
	})
};

XDPC.EventsReceiver = new Class({

			Extends : XDPC.Server,

			Implements : [Events],

			initialize : function(senderOrigins) {
				this.parent({
							fireXDEvent : bind(this.fireEvent, this)
						}, senderOrigins);
			}
		});

XDPC.EventsSender = new Class({
			Extends : XDPC.Client,

			fireXDEvent : function(type, args, delay) {
				this.call('fireXDEvent', [type, args, delay]);
			}
		});

/**
 * @class canvas应用调用外层app.renren.com下提供的方法
 * @extends Renren.XDPC.Client
 * @memberOf Renren
 */
XDPC.CanvasClient = new Class({

			Extends : XDPC.Client,

			initialize : function() {
				var s = location.search, params = (s == ''
						? {}
						: fromQueryString(s.substr(1)));
				this.parent({
							origin : rrUrls.apps + (params['xn_sig'] || ''),
							relation : 'parent'
						});
			}
		});