jQuery.fn.center = function (offset) {
	if (offset == null) offset = {
		x: 0,
		y: 0
	};
	this.css("position", "absolute");
	this.css("top", ($(window).height() - this.height()) / 2 + $(window).scrollTop() + offset.y + "px");
	this.css("left", ($(window).width() - this.width()) / 2 + $(window).scrollLeft() + offset.x + "px");
	return this;
}

function gup(name, url) {
	if (url == null) url = window.location.href;
	name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
	var regexS = "[\\?&]" + name + "=([^&#]*)";
	var regex = new RegExp(regexS);
	var results = regex.exec(url);
	if (results == null) return "";
	else return results[1];
}

function set_cookie(c_name, value, expiredays) {
	var exdate = new Date();
	exdate.setDate(exdate.getDate() + expiredays);
	document.cookie = c_name + "=" + escape(value) + ((expiredays == null) ? "" : ";expires=" + exdate.toUTCString());
}

function get_cookie(c_name) {
	if (document.cookie.length > 0) {
		c_start = document.cookie.indexOf(c_name + "=");
		if (c_start != -1) {
			c_start = c_start + c_name.length + 1;
			c_end = document.cookie.indexOf(";", c_start);
			if (c_end == -1) c_end = document.cookie.length;
			return unescape(document.cookie.substring(c_start, c_end));
		}
	}
	return null;
}

function del_cookie(c_name) {
	var exp = new Date();
	exp.setTime(exp.getTime() - 1);
	var cval = get_cookie(c_name);
	if (cval != null) document.cookie = c_name + "=" + cval + ";expires=" + exp.toGMTString();
}