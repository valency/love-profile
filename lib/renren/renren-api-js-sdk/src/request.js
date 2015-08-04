var Request = new Class(
/**
 * @lends Renren.Request.prototype
 */
		{
	Implements : [Events, Options],

	options : {
		url : '',
		params : {},
		headers : {
			'Accept' : 'text/javascript, text/html, application/xml, text/xml, */*'
		},
		method : 'POST',
		urlEncoded : true,
		encoding : 'utf-8',
		noCache : false
	},
	/**
	 * @class 跨域请求的抽象类
	 * @constructs
	 */
	initialize : function(options) {
		this.setOptions(options);
		this.id = guid();
	},

	check : function() {
		if (!this.running)
			return true;
		return false;
	},

	abort : function(response) {
		if (!this.running)
			return this;
		this.running = false;
		this.response = response || {
			error : 'request_abort',
			error_description : 'unknown reason.'
		};
		this.failure(this.response);
	},

	success : function(response) {
		this.onSuccess(response);
	},

	onSuccess : function() {
		this.fireEvent('complete', arguments, 0).fireEvent('success',
				arguments, 0);
	},

	failure : function(response) {
		this.onFailure(response);
	},

	onFailure : function() {
		this.fireEvent('complete', arguments, 0).fireEvent('failure',
				arguments, 0);
	}
});

/**
 * @namespace 请求响应跨域传回的处理
 * @private
 */
var XDResponse = {
	requests : {},

	handleXDMessages : function(msg) {
		if (msg.data && msg.data.rqid) {
			var req = XDResponse.requests[msg.data.rqid];
			if (req && req.xd) {
				if (req.xd.transport != 'fragment'
						&& (!msg.origin || msg.origin
								.indexOf(rrUrls.widgetOrigin) != 0))
					return;
				req.handleResponse(msg.data);
			}
		}
	},

	addXDRequest : function(req) {
		if (!XDResponse.requests[req.id])
			XDResponse.requests[req.id] = req;
	},

	removeXDRequest : function(req) {
		if (XDResponse.requests[req.id])
			delete XDResponse.requests[req.id];
	}
};

XD.addEvent('receivedXDMessage', XDResponse.handleXDMessages);

Request.Page = new Class(
/**
 * @lends Renren.Request.Page.prototype
 */
		{
	Extends : Request,

	options : {
		method : 'GET',
		params : {
			display : 'page'
		}
	},

	/**
	 * @class 使用当前窗口进行跨域请求
	 * @extends Renren.Request
	 * @constructs
	 */
	initialize : function(options) {
		this.parent(options);
		this.options.params.display = this.constructor.prototype.options.params.display;
	},

	/**
	 * 发送请求
	 */
	send : function() {
		if (!this.check())
			return this;
		this.running = true;
		var params = this.options.params;
		if (!params['redirect_uri']) {
			params['redirect_uri'] = this.getRedirectUri();
		}
		this.fireEvent('request');
		this.ui = this.createUI();
		if (!this.ui) {
			var err = new Error("can't create request UI.");
			err.name = 'UICreateError';
			throw err;
		}
		return this;
	},

	/**
	 * @private
	 */
	createUI : function() {
		var opts = this.options, method = opts.method, url = (method === 'GET'
				? opts.url + (opts.url.indexOf('?') < 0 ? '?' : '&')
						+ toQueryString(opts.params)
				: 'about:blank');
		if (method === 'GET') {
			var bn = Browser.getBrowser().name, maxLgh = (bn == 'ie'
					? 2050
					: 7600);
			if (url.length > maxLgh) {
				var err = new Error('The length of request url maybe too long, use POST method instend.');
				err.name = 'UrlTooLongError';
				throw err;
			}
		}
		var uiOpts = merge({
					url : url,
					id : this.id,
					display : this.constructor.prototype.options.params.display,
					onload : function(node, nodeName) {
						if (method === 'POST') {
							Dom.postTarget({
										url : opts.url,
										target : nodeName || node.name,
										params : opts.params
									});
						}
					}
				}, opts.style);
		ui = Dom.createUI(uiOpts);
		return ui;
	},

	/**
	 * @private
	 */
	getRedirectUri : function() {
		var uri = location.toString(), poundIndex = uri.indexOf('#');
		if (poundIndex > 0) {
			uri = uri.substr(0, poundIndex);
		}
		return uri;
	}
});

Request.Iframe = new Class(
/**
 * @lends Renren.Request.Iframe.prototype
 */
		{
	Extends : Request.Page,

	options : {
		params : {
			display : 'iframe'
		}
	},

	/**
	 * @class 使用iframe进行跨域请求
	 * @extends Renren.Request.Page
	 * @constructs
	 */
	initialize : function(options) {
		this.parent(options);
		var ts = XD.transports, self = this;
		this.xd = {
			relation : 'parent',
			transport : ts.postMessage || ts.flash || 'fragment',
			origin : XD.origin
		};
		this.addEvents({
					'request' : function() {
						XDResponse.addXDRequest(self);
					},
					'complete' : function() {
						XDResponse.removeXDRequest(self);
					}
				});
	},

	/**
	 * @private
	 */
	handleResponse : function(data) {
		this.closeUI();
		this.response = data;
		this.running = false;
		if (!data.error)
			this.success(this.response);
		else
			this.failure(this.response);
	},

	/**
	 * @private
	 */
	getRedirectUri : function() {
		var opts = merge(this.xd, 'rqid', this.id), trans = this.xd.transport, uri;
		if (trans == 'postMessage' || trans == 'flash') {
			uri = rrUrls.callback + '#';
		} else {
			uri = location.toString();
			var poundIndex = uri.indexOf('#');
			if (poundIndex > 0) {
				uri = uri.substr(0, poundIndex);
			}
			uri += '#' + XD.Fragment.magic + "&";
		}
		return uri + toQueryString(opts);
	},

	/**
	 * 关闭使用的iframe
	 */
	closeUI : function() {
		if (this.ui) {
			this.ui.parentNode.removeChild(this.ui);
			this.ui = null;
		}
	}
});

/**
 * @class 使用隐藏iframe进行跨域请求
 * @memberOf Renren
 * @extends Renren.Request.Iframe
 */
Request.Hidden = new Class({
			Extends : Request.Iframe,

			options : {
				params : {
					display : 'hidden'
				}
			}
		});

Request.Popup = new Class(
/**
 * @lends Renren.Request.Popup.prototype
 */
		{
	Extends : Request.Iframe,

	options : {
		params : {
			display : 'popup'
		}
	},

	/**
	 * @class 使用弹出窗口进行跨域请求
	 * @extends Renren.Request.Iframe
	 * @constructs
	 */
	initialize : function(options) {
		this.parent(options);
		var ts = XD.transports;
		this.xd = {
			relation : 'opener',
			transport : ts.postMessage || ts.flash || 'fragment',
			origin : XD.origin
		};
	},

	send : function() {
		var r = this.parent(), params = this.options.params;
		if (this.ui && params['redirect_uri']
				&& params['redirect_uri'].indexOf(rrUrls.callback) == 0) {
			this.constructor.popupReqs[this.id] = this;
			this.constructor.popupMonitor();
		}
		return r;
	},

	/**
	 * @private
	 */
	handleResponse : function(data) {
		this.closeUI();
		this.response = data;
		this.running = false;
		if (!data.error)
			this.success(this.response);
		else
			this.failure(this.response);
	},

	/**
	 * 关闭弹出的窗口
	 */
	closeUI : function() {
		if (this.ui) {
			this.ui.close();
			this.ui = null;
		}
	}
});

/**
 * 处理弹出窗口被直接关闭的情况
 */
extend(Request.Popup, {
	popupReqs : {},

	popupMonitor : function() {
		var monitor;
		for (var id in this.popupReqs) {
			if (this.popupReqs.hasOwnProperty(id)
					&& this.popupReqs[id] instanceof this) {
				try {
					var request = this.popupReqs[id];
					if (!request.ui) {
						delete this.popupReqs[id];
					} else if (request.ui.closed) {
						window.setTimeout(function() {
							request.abort({
								error : 'request_abort',
								error_description : 'user close the popup window.'
							});
						}, 10);
						request.ui = null;
						delete this.popupReqs[id];
					} else {
						monitor = true;
					}
				} catch (e) {
					// probably a permission error
				}
			}
		}
		if (monitor && !this.monitorInterval) {
			this.monitorInterval = window.setInterval(bind(arguments.callee,
							this), 500);
		} else if (!monitor && this.monitorInterval) {
			window.clearInterval(this.monitorInterval);
			this.monitorInterval = null;
		}
	}
});