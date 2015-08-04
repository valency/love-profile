/**
 * @namespace 处理浏览器和flash插件识别
 * @private
 */
var Browser = {
	getBrowser : function() {
		if (!Browser.browser) {
			var ua = navigator.userAgent.toLowerCase(), platform = navigator.platform
					.toLowerCase(), UA = ua
					.match(/(opera|ie|firefox|chrome|version)[\s\/:]([\w\d\.]+)?.*?(safari|version[\s\/:]([\w\d\.]+)|$)/)
					|| [null, 'unknown', 0], mode = UA[1] == 'ie'
					&& document.documentMode;

			Browser.browser = {
				name : (UA[1] == 'version') ? UA[3] : UA[1],

				version : mode
						|| parseFloat((UA[1] == 'opera' && UA[4])
								? UA[4]
								: UA[2]),

				platform : ua.match(/ip(?:ad|od|hone)/) ? 'ios' : (ua
						.match(/(?:webos|android)/)
						|| platform.match(/mac|win|linux/) || ['other'])[0]
			}
		}
		return Browser.browser;
	},

	getFlash : function() {
		if (!Browser.flash) {
			var version = '0 r0';
			try {
				version = navigator.plugins['Shockwave Flash'].description;
			} catch (e) {
				try {
					version = new ActiveXObject('ShockwaveFlash.ShockwaveFlash')
							.GetVariable('$version');
				} catch (ex) {
				}
			}
			version = version.match(/\d+/g);
			Browser.flash = {
				version : Number(version[0] || '0.' + version[1]) || 0,
				build : Number(version[2]) || 0
			};
		}
		return Browser.flash;
	}
};