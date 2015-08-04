/**
 * 引入方式：<br/>
 * &lt;script type="text/javascript" src="url to this js file"&gt;&lt;/script&gt;<br/>
 * js sdk在加载解释阶段不会改变文档的内容，可加上defer等属性以加快加载速度：<br/>
 * &lt;script type="text/javascript" src="url to this js file" charset="utf-8" defer="defer"&gt;&lt;/script&gt;
 * @class 全局范围内可访问对象，各种公开接口的入口
 * @static
 */
var Renren = {
	
	options : {},

	/**
	 * 初始化sdk，建议在dom加载完成后调用，或在&lt;body&gt;下的&lt;script&gt;标签中调用。
	 * @param options {Object} 
	 * @param options.appId {number}
	 *            应用id，如此处设值，在其它需要app id值时，如用Renren.ui调用dialog时可不用设app_id参数
	 * @param options.originPath {String} (optional)
	 *            用于构成跨域的origin值，origin用以唯一标识当前加载的页面，默认情况下 origin =
	 *            location.protocol + '//' + location.host + '/' + 随机字符串;
	 *            一般不需要设置此值，此值存在则 origin = location.protocol + '//' +
	 *            location.host + '/' + options.originPath
	 * @example Renren.init({appId:29706});           
	 */
	init : function(options) {
		this.options = merge.apply(null, append([{}, this.options], arguments));
		XD.init(this.options);
	}
},

rrUrls = {
	widget : 'http://widget.renren.com/',
	rrstatic : 'http://s.xnimg.cn/',
	apps : 'http://apps.renren.com/',
	graph : 'http://graph.renren.com/',
	graph_https : 'https://graph.renren.com/',
	callback : 'http://widget.renren.com/xd_callback.html',
	widgetOrigin : 'http://widget.renren.com'
};