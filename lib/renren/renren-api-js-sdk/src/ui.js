/**
 * 本方法是对调用dialog的封装，用以弹出各种对话界面，如发送新鲜事，授权，邀请。对dialog的详细信息可见： <a
 * href="http://wiki.dev.renren.com/wiki/%E4%BA%BA%E4%BA%BA%E7%BD%91%E5%BC%80%E6%94%BE%E5%B9%B3%E5%8F%B0%E6%8A%80%E6%9C%AF%E6%9E%B6%E6%9E%84#Widget_API">Widget
 * API - Dialog</a>
 * 
 * @methodOf Renren
 * @param options
 *            {Object}
 * @param options.url
 *            {String} 请求dialog url或oauth
 *            url，非http、https开头的值将视为相对于http://widget.renren.com/dialog/的路径
 * @param options.method
 *            {String} (optional) http请求方法，可选值：GET、POST，默认为GET，只在必要时使用POST，因在经过登录流程时会被改为GET请求
 * @param options.display
 *            {String} 页面在何处显示，可选值：popup（新窗口）、iframe（类似dialog的效果）、page（当前窗口）
 * @param options.style
 *            {Object} (optional) ui的样式如：{top : 100, left : 300, width : 450,
 *            height : 350}，相应值没设置时会根据窗口大小在合适位置显示
 * @param options.params
 *            {Object} 请求所需参数值，因调用dialog而不同，相关所需参数可见各dialog的文档
 * @param options.fallback
 *            {boolean} (optional)
 *            默认为true，做些容错处理，如当请求参数过长超过浏览器限制，将转化http请求方法为POST;若用popup显示时被浏览器
 *            阻止弹窗时将用当前窗口显示，完成后再跳转回当前页，即同options.display =
 *            page。若需自己处理这些情况时可设值为false。
 * @param options.onSuccess
 *            {Function} (optional) 请求成功后的回调函数，请求结果做为回调函数的参数传入
 * @param options.onFailure
 *            {Function} (optional) 请求失败后的回调函数，请求结果做为回调函数的参数传入
 * @param options.onComplete
 *            {Function} (optional) 请求完成后的回调函数，不论请求成功或失败都会被调用，请求结果做为回调函数的参数传入
 * @param cb
 *            {Function} (optional)
 *            作用同options.onComplete，若options.onComplete已设值则此值无效
 *            @example
 * Renren.ui({
 *	url : 'feed',
 *	display : 'popup',
 *	style : {
 *		top : 50
 *	},
 *	params : {
 *		url:'http://www.swimmingacross.com',
 *		name: '新鲜事测试',
 *		description:'测试',
 *		image:'http://at-img4.tdimg.com/board/2011/5/46465.jpg'
 *	},
 *	onComplete: function(r){if(window.console) console.log("complete");},
 *	onFailure: function(r){if(window.console) console.log("failure:" + r.error + ' ' + r.error_description);} 
 * });
 */
var ui = function(options, cb) {
	if (!options.url) {
		throw new Error('The url argument must not be null.');
	}
	var url = options.url, url = (url.indexOf('http://') == 0 || url
			.indexOf('https://') == 0)
			? url
			: (rrUrls.widget + 'dialog/' + url);
	var p = /^(https?:\/\/[^\/]*\/)([^\/\?#]*\/)*([^\/\?#]*)/.exec(url);
	if (p == null
			|| (rrUrls.widget != p[1] && rrUrls.graph != p[1] && rrUrls.graph_https != p[1])) {
		return;
	}
	var reqOptns = combine({
				url : url,
				method : (options.method
						&& options.method.toUpperCase() === 'POST'
						? 'POST'
						: 'GET')
			}, options, defaults[(p[3] || '').toLowerCase()], {
				display : 'popup',
				style : {
					width : 475,
					height : 340
				},
				params : {
					app_id : rrUrls.widget == p[1]
							? Renren.options.appId
							: null,
					client_id : (rrUrls.graph == p[1] || rrUrls.graph_https == p[1])
							? Renren.options.appId
							: null
				},
				onComplete : cb
			});

	return (function(reqOpts) {
		var display = reqOpts.display, request;
		if (display.length > 0) {
			display = display.substr(0, 1).toUpperCase() + display.substr(1);
		}
		if (Request[display]) {
			request = new Request[display](reqOpts);
		}
		if (!request) {
			throw new Error("Fail to start an ui request, the display argument may be invalid.");
		}
		try {
			return request.send();
		} catch (e) {
			if (options.fallback !== false) {
				if (e.name == 'UrlTooLongError') {
					// change http method to POST
					reqOpts.method = 'POST';
					return arguments.callee(reqOpts);
				} else if (e.name == 'UICreateError'
						&& request instanceof Request.Popup) {
					// popup window may be blocked, fall back to use current
					// window
					reqOpts.display = 'page';
					return arguments.callee(reqOpts);
				}
			}
			throw e;
		}
	})(reqOptns);
};

var defaults = {
	'authorize' : {
		display : 'page',
		style : {
			width : 570,
			height : 340
		}
	},
	'request' : {
		style : {
			width : 600,
			height : 550
		}
	}
};