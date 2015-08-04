/**
 * @namespace DOM操作封装
 * @private
 */
var Dom = {
	root : null,
	hiddenRoot : null,
	callbacks : {},

	/**
	 * Append some content.
	 * 
	 * @param content
	 *            {String|Node} a DOM Node or HTML string
	 * @param root
	 *            {Node} (optional) a custom root node
	 * @return {Node} the node that was just appended
	 */
	append : function(content, root) {
		if (!root) {
			if (!Dom.root) {
				Dom.root = document.getElementById('renren-root');
				if (!Dom.root) {
					Dom.root = document.createElement('div');
					Dom.root.id = 'renren-root';
					(document.body || document.getElementsByTagName('body')[0])
							.appendChild(Dom.root);
				}
			}
			root = Dom.root;
		}

		if (typeof content == 'string') {
			var div = document.createElement('div');
			root.appendChild(div).innerHTML = content;
			return div;
		} else {
			return root.appendChild(content);
		}
	},

	/**
	 * Append some hidden content.
	 * 
	 * @param content
	 *            {String|Node} a DOM Node or HTML string
	 * @return {Node} the node that was just appended
	 */
	appendHidden : function(content) {
		if (!Dom.hiddenRoot) {
			var hiddenRoot = document.createElement('div'), style = hiddenRoot.style;
			style.positon = 'absolute';
			style.top = '-10000px';
			style.width = style.height = '0px';
			Dom.hiddenRoot = Dom.append(hiddenRoot);
		}
		return Dom.append(content, Dom.hiddenRoot);
	},

	onIframeReady : function(cbId) {
		var cb = Dom.callbacks[cbId];
		cb && cb();
	},

	/**
	 * Insert a new iframe. Unfortunately, its tricker than you imagine.
	 * 
	 * NOTE: These iframes have no border, overflow hidden and no scrollbars.
	 * 
	 * The opts can contain: root DOMElement required root node (must be empty)
	 * url String required iframe src attribute className String optional class
	 * attribute height Integer optional height in px id String optional id
	 * attribute name String optional name attribute onload Function optional
	 * onload handler width Integer optional width in px
	 * 
	 * @param opts
	 *            {Object} the options described above
	 */
	insertIframe : function(opts) {
		opts.id = opts.id || guid();
		opts.name = opts.name || guid();

		// Since we set the src _after_ inserting the iframe node into the
		// DOM,
		// some browsers will fire two onload events, once for the first
		// empty
		// iframe insertion and then again when we set the src. Here some
		// browsers are Webkit browsers which seem to be trying to do the
		// "right thing". So we toggle this boolean right before we expect
		// the
		// correct onload handler to get fired.
		var srcSet = false, onloadDone = false;
		Dom.callbacks[opts.id] = function() {
			if (srcSet && !onloadDone) {
				onloadDone = true;
				opts.onload && opts.onload(opts.root.firstChild);
				delete Dom.callbacks[opts.id];
			}
		};

		if (document.attachEvent) {
			var html = ('<iframe id="'
					+ opts.id
					+ '" name="'
					+ opts.name
					+ '"'
					+ (opts.className ? ' class="' + opts.className + '"' : '')
					+ ' style="border:none;'
					+ (opts.width ? 'width:' + opts.width + 'px;' : '')
					+ (opts.height ? 'height:' + opts.height + 'px;' : '')
					+ '" src="'
					+ opts.url
					+ '" frameborder="0" scrolling="no" allowtransparency="true"'
					+ ' onload="Renren.onIframeReady(\'' + opts.id + '\')"' + '></iframe>');

			// There is an IE bug with iframe caching that we have to work
			// around. We
			// need to load a dummy iframe to consume the initial cache
			// stream. The
			// setTimeout actually sets the content to the HTML we created
			// above, and
			// because its the second load, we no longer suffer from cache
			// sickness.
			// It must be javascript:false instead of about:blank, otherwise
			// IE6 will
			// complain in https.
			// Since javascript:false actually result in an iframe
			// containing the
			// string 'false', we set the iframe height to 1px so that it
			// gets loaded
			// but stays invisible.
			opts.root.innerHTML = '<iframe src="javascript:false" frameborder="0" scrolling="no" style="height:1px;"></iframe>';

			// Now we'll be setting the real src.
			srcSet = true;

			// You may wonder why this is a setTimeout. Read the IE source
			// if you can
			// somehow get your hands on it, and tell me if you figure it
			// out. This
			// is a continuation of the above trick which apparently does
			// not work if
			// the innerHTML is changed right away. We need to break apart
			// the two
			// with this setTimeout 0 which seems to fix the issue.
			window.setTimeout(function() {
						opts.root.innerHTML = html;
					}, 0);
		} else {
			// This block works for alls non IE browsers. But it's
			// specifically
			// designed for FF where we need to set the src after inserting
			// the
			// iframe node into the DOM to prevent cache issues.
			var node = document.createElement('iframe');
			node.id = opts.id;
			node.name = opts.name;
			node.onload = Dom.callbacks[opts.id];
			node.style.border = 'none';
			node.style.overflow = 'hidden';
			if (opts.className) {
				node.className = opts.className;
			}
			if (opts.height) {
				node.style.height = opts.height + 'px';
			}
			if (opts.width) {
				node.style.width = opts.width + 'px';
			}
			opts.root.appendChild(node);
			// Now we'll be setting the real src.
			srcSet = true;
			node.src = opts.url;
		}
	},

	/**
	 * Dynamically generate a &lt;form&gt; and POST it to the given target.
	 * 
	 * @protected
	 * @param options
	 *            {Object} the options
	 */
	postTarget : function(options) {
		var form = document.createElement('form');
		form.action = options.url;
		form.target = options.target;
		form.method = 'POST';
		form.acceptCharset = "utf-8";
		forEach(options.params, function(val, key) {
					if (val !== null && val !== undefined) {
						var input = document.createElement('input');
						input.name = key;
						input.value = val;
						form.appendChild(input);
					}
				});
		Dom.appendHidden(form);
		try {
			form.submit(); // popup block
		} finally {
			form.parentNode.removeChild(form);
		}
	},

	popupWindow : function(opts) {
		var screenX = typeof window.screenX != 'undefined'
				? window.screenX
				: window.screenLeft, screenY = typeof window.screenY != 'undefined'
				? window.screenY
				: window.screenTop, outerWidth = typeof window.outerWidth != 'undefined'
				? window.outerWidth
				: document.documentElement.clientWidth, outerHeight = typeof window.outerHeight != 'undefined'
				? window.outerHeight
				: (document.documentElement.clientHeight - 22), width = opts.width, height = opts.height, left = opts.left != null
				? opts.left
				: parseInt(screenX + ((outerWidth - width) / 2), 10), top = opts.top != null
				? opts.top
				: parseInt(screenY + ((outerHeight - height) / 2.5), 10), features = ('width='
				+ width + ',height=' + height + ',left=' + left + ',top=' + top), w = window
				.open(opts.url, opts.id, features);
		if (w && opts.onload)
			opts.onload(w, opts.id);
		return w
	},

	currentWindow : function(opts) {
		window.location.href = opts.url;
		if (opts.onload)
			opts.onload(window);
		return window;
	},

	createUI : function(opts) {
		if (opts.display === 'page') {
			return Dom.currentWindow(opts);
		}
		if (opts.display !== 'hidden' && opts.display !== 'iframe') {
			return Dom.popupWindow(opts);
		}
		var dialog = document.createElement('div'), dstyle = dialog.style;
		dstyle.position = 'absolute';
		dstyle.top = '-10000px';
		dstyle.zIndex = '10001';
		dstyle.height = opts.height + 'px';
		dstyle.width = opts.width + 'px';
		if (opts.display === 'hidden') {
			dialog.className = 'rr_ui_hidden';
			opts.root = dialog;
			Dom.insertIframe(opts);
			Dom.append(dialog);
			return dialog;
		}
		dialog.className = 'rr_ui_dialog';
		var bws = Browser.getBrowser();
		if (bws.name == 'ie' && bws.version < 9) {
			forEach(['top_left', 'top_right', 'bottom_left', 'bottom_right'],
					function(item) {
						var span = document.createElement('span'), style = span.style, p = item
								.split('_');
						span.className = 'rr_dialog_' + item;
						style.height = style.width = '10px';
						style.overflow = 'hidden';
						style.position = 'absolute';
						style.background = 'url(' + rrUrls.rrstatic
								+ 'connect/img/dialog/pop_dialog_' + item
								+ '.png) no-repeat 0 0';
						style[p[0]] = style[p[1]] = '-10px';
						dialog.appendChild(span);
					});
			forEach(['top', 'left', 'right', 'bottom'], function(item) {
						var span = document.createElement('span'), style = span.style;
						span.className = 'rr_dialog_border_' + item;
						style.position = 'absolute';
						style.backgroundColor = 'rgb(82, 82, 82)';
						style.overflow = 'hidden';
						style.filter = 'alpha(opacity=70)';
						style.opacity = '0.7';
						style[item] = '-10px';
						if (item == 'left' || item == 'right') {
							style.width = '10px';
							style.height = '100%';
						} else {
							style.height = '10px';
							style.width = '100%';
						}
						dialog.appendChild(span);
					});
		} else {
			dstyle.padding = '10px';
			dstyle.backgroundColor = 'rgba(82, 82, 82, 0.7)';
			dstyle.MozBorderRadius = '8px';
			dstyle.borderRadius = '8px';
		}

		var dialogContent = document.createElement('div'), cstyle = dialogContent.style;
		dialogContent.className = 'rr_dialog_content';
		cstyle.backgroundColor = '#fff';
		cstyle.height = opts.height + 'px';
		cstyle.width = opts.width + 'px';
		opts.root = dialogContent;
		Dom.insertIframe(opts);
		dialog.appendChild(dialogContent);
		Dom.append(dialog);

		var view = Dom.getViewportInfo(), left = opts.left != null ? opts.left
				+ (bws.name == 'ie' ? 10 : 0) : (view.scrollLeft + (view.width
				- opts.width - 20)
				/ 2), top = opts.top != null ? opts.top
				+ (bws.name == 'ie' ? 10 : 0) : (view.scrollTop + (view.height
				- opts.height - 20)
				/ 2.5);
		dstyle.left = (left > 0 ? left : 0) + 'px';
		dstyle.top = (top > 0 ? top : 0) + 'px';
		return dialog;
	},

	getViewportInfo : function() {
		var d = (document.documentElement && document.compatMode == 'CSS1Compat')
				? document.documentElement
				: document.body;
		return {
			scrollTop : d.scrollTop,
			scrollLeft : d.scrollLeft,
			width : self.innerWidth ? self.innerWidth : d.clientWidth,
			height : self.innerHeight ? self.innerHeight : d.clientHeight
		};
	}
}