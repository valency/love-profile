/**
 * @namespace 对进行跨域通信用的flash swf文件的封装
 * @private
 */
var Flash = {
	url : rrUrls.rrstatic + 'connect/swf/XdComm.swf',

	name : 'RenrenXdSwf',

	callbacks : [],

	init : function() {
		if (Flash.inited) {
			return;
		}
		Flash.inited = true;
		var html = ('<object type="application/x-shockwave-flash" id="'
				+ Flash.name
				+ '" data="'
				+ Flash.url
				+ '"'
				+ (!!document.attachEvent
						? ' name="'
								+ Flash.name
								+ '" classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"'
						: '')
				+ ' width="0" height="0"><param name="movie" value="'
				+ Flash.url + '"></param><param name="allowScriptAccess" value="always"></param><param name="flashVars" value="onReady=Renren.onFlashReady"/></object>');
		Dom.appendHidden(html);
	},

	onFlashReady : function() {
		Flash.XdComm = document[Flash.name];
		for (var i = 0, l = Flash.callbacks.length; i < l; i++) {
			Flash.callbacks[i]();
		}
		Flash.callbacks = [];
	},

	hasMinVersion : function() {
		return Browser.getFlash().version >= 9; // doesn't check strictly
	},

	onReady : function(cb) {
		Flash.init();
		if (Flash.XdComm) {
			window.setTimeout(function() {
						cb()
					}, 0);
		} else {
			Flash.callbacks.push(cb);
		}
	},

	initPostMessage : function(cb, origin) {
		return Flash.XdComm.postMessage_init(cb, origin);
	},

	postMessage : function(message, targetOrigin) {
		return Flash.XdComm.postMessage_send(message, targetOrigin);
	},

	sendXdHttpRequest : function(method, url, params, headers, callback, reqId) {
		return Flash.XdComm.sendXdHttpRequest(method, url, params, headers,
				callback, reqId);
	}
}