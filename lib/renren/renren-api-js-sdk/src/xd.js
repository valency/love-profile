/**
 * 
 * @namespace 跨域通信
 * @memberOf Renren
 * @see <a
 *      href="https://developer.mozilla.org/en/DOM/window.postMessage">window.postMessage</a>.
 * @see <a
 *      href="http://livedocs.adobe.com/flash/9.0/ActionScriptLangRefV3/flash/net/LocalConnection.html">flash
 *      LocalConnection</a>.
 */
var XD =
/**
 * @lends Renren.XD
 */
{

	/**
	 * {String} 在跨域通信中标识当前页面，可参见<a
	 * href="https://developer.mozilla.org/en/DOM/window.postMessage">window.postMessage</a>中所定义的origin
	 */
	origin : (location.protocol + '//' + location.host + '/' + guid()),

	/**
	 * {Object} 浏览器支持的跨域通信方式
	 */
	transports : {
		fragment : 'fragment',
		postMessage : window.postMessage ? undefined : false
	},

	/**
	 * 初始化方法，在Renren.init中被调用，根椐浏览器支持情况建立对跨域消息的监听。
	 * 当收到跨域消息时将产生名为receivedXDMessage的事件，可调用Renren.XD.addEvent注册事件处理函数。
	 * @example Renren.XD.addEvent('receivedXDMessage', onReceivedXDMessage);
	 * @param options
	 *            {Object}
	 * @param options.originPath
	 *            {String} (optional) 用于构成跨域的origin值，origin用以唯一标识当前本次加载的页面
	 */
	init : function(options) {
		if (options && options.originPath != undefined)
			XD.origin = location.protocol + '//' + location.host + '/'
					+ options.originPath;
		if (XD.transports.postMessage == undefined) {
			var bws = Browser.getBrowser();
			// window.opener can't work in IE8
			if (bws.name == 'ie' && bws.version == 8)
				XD.transports.postMessage = false;
			else
				XD.PostMessage.init();
		}
		if (!XD.transports.postMessage && XD.transports.flash == undefined) {
			XD.transports.flash = Flash.hasMinVersion() ? 0 : false;
			XD.transports.flash === 0 && XD.Flash.init();
		}
	},

	/**
	 * @private
	 */
	resolveRelation : function(relation) {
		var pt, matches, parts = relation.split('.'), node = window;
		for (var i = 0, l = parts.length; i < l; i++) {
			pt = parts[i];
			if (pt == 'opener' || pt == 'parent' || pt == 'top') {
				node = node[pt];
			} else if (matches = /^frames\[['"]?([a-zA-Z0-9-_]+)['"]?\]$/
					.exec(pt)) {
				node = node.frames[matches[1]];
			} else {
				throw new SyntaxError('Malformed value to resolve: ' + relation);
			}
		}
		return node;
	},

	/**
	 * @namespace 使用window.postMessage实现跨域通信
	 * @private
	 */
	PostMessage : {
		init : function() {
			window.addEventListener ? window.addEventListener('message',
					XD.PostMessage.receiveMessage, false) : window.attachEvent(
					'onmessage', XD.PostMessage.receiveMessage);
			XD.transports.postMessage = 'postMessage';
		},

		receiveMessage : function(event) {
			XD.receiveMessage({
						data : event.data,
						origin : event.origin,
						source : event.source,
						transport : 'postMessage'
					});
		},

		sendMessage : function(message, targetOrigin, targetWin) {
			if (typeOf(message) != 'string')
				message = toQueryString(message);
			targetWin.postMessage(message, targetOrigin);
		}
	},

	/**
	 * @namespace 使用flash实现跨域通
	 * @private
	 */
	Flash : {
		init : function() {
			Flash.onReady(function() {
						XD.transports.flash = Flash.initPostMessage(
								'Renren.XD.Flash.receiveMessage', XD.origin)
								? 'flash'
								: false;
					});
		},

		receiveMessage : function(message) {
			XD.receiveMessage(message);
		},

		sendMessage : function(message, targetOrigin) {
			return Flash.postMessage(message, targetOrigin);
		}
	},

	/**
	 * @namespace 用同域页面实现跨域通信
	 * @private
	 */
	Fragment : {
		magic : 'rr_xd_fragment',

		sendMessage : function(message, targetOrigin, targetWin) {
			if (targetOrigin
					&& targetOrigin.indexOf(targetWin.location.protocol + '//'
							+ targetWin.location.host + '/') == 0)
				targetWin.Renren.XD.receiveMessage({
							data : message
						});
		}
	},

	/**
	 * @private
	 */
	receiveMessage : function(msg) {
		if (typeOf(msg.data) == 'string') {
			msg.data = fromQueryString(msg.data);
		}
		XD.fireEvent("receivedXDMessage", msg);
	},

	/**
	 * 发送跨域消息，将根据浏览器支持情况选择跨域方式
	 * @param message
	 *            {Object | String } 发送信息
	 * @param targetOrigin
	 *            {String} 接收窗体的页面标识
	 * @param transport
	 *            {String} 跨域通信方式
	 * @param targetRelWin
	 *            {String | Window} 接收窗体的window对象或和本窗体的关系
	 */
	sendMessage : function(message, targetOrigin, transport, targetRelWin) {
		if (targetOrigin && transport && transport.length > 0) {
			transport = transport.substr(0, 1).toUpperCase()
					+ transport.substr(1);
			try {
				if (typeof targetRelWin == 'string') {
					targetRelWin = XD.resolveRelation(targetRelWin);
				}
				XD[transport]
						&& XD[transport].sendMessage(message, targetOrigin,
								targetRelWin);
			} catch (e) {
			}
		}
	},

	/**
	 * @private
	 */
	dispatchLocationFragment : function(loc) {
		loc = loc || location.toString();
		if (loc.indexOf('#') == -1)
			return;
		var fragment = loc.substr(loc.indexOf('#') + 1), magicIndex = fragment
				.indexOf(XD.Fragment.magic), params = fromQueryString(fragment);
		if (magicIndex > 0) {
			document.documentElement.style.display = 'none';
		}
		params.origin
				&& XD.sendMessage(params, params.origin, params.transport,
						params.relation);
	}
};

XD.dispatchLocationFragment();

extend(XD, new Events());