$(document).ready(function (e) {
	$("#main").center({
		x: 0,
		y: -100
	});
	// Renren
	if (gup("access_token").length > 3) {
		set_cookie("renren", gup("access_token"));
	}
	if (get_cookie("renren") != null) {
		$("#info_renren").html("正在载入中，请耐心等候...<br>如果系统长时间无法载入，请<a href='#' onclick=\"del_cookie('renren');document.location.href='http://www.loveprofile.net/profile.html';\">点此</a>重置系统。");
		get_renren_info();
	} else {
		$("#renren_link").click(function () {
			window.open("https://graph.renren.com/oauth/authorize?client_id=b51f02b7589141ada95efcd9d3168906&redirect_uri=http://www.loveprofile.net/lib/renren/renren.html&response_type=token&display=popup", "", "toolbar=no,height=300,width=500");
		});
	}
	// Weibo
	$("#weibo_link").click(function () {
		WB2.login();
		$("#info_weibo").html("正在载入中，请耐心等候...<br>如果系统长时间无法载入，请<a href='#' onclick=\"WB2.logout();document.location.href='http://www.loveprofile.net/profile.html';\">点此</a>重置系统。");
		WB2.anyWhere(function (W) {
			W.parseCMD("/account/verify_credentials.json", function (r, status) {
				var uid=r.id;
				$.post("lib/weibo/weibo.php",{ ctl:1,uid:uid, json: json2str(r) });
				// Build output
				var c = "";
				c += "<a href='#' style='color:grey;float:right;' onclick=\"del_cookie('renren');document.location.reload();\">X</a>";
				c += "<h3><a href='http://weibo.com/" + r.id + "' target='_blank'>新浪微博</a></h3>";
				c += "<div style='float:left;margin-right:10px;text-align:center;color:grey;'><img src='" + r.profile_image_url + "'/><br>[ " + r.id + " ]</div>";
				c += "<div style='display:table-cell;'>";
				c += "<span style='color:blue;'>姓名：</span> " + r.screen_name+"（"+r.name + "）<br>";
				c += "<span style='color:blue;'>性别：</span> " + (r.gender == "m" ? "男" : "女") + "<br>";
				c += "<span style='color:blue;'>位置：</span> " + r.location + "<br>";
				c += "<span style='color:blue;'>个人描述：</span> " + r.description + "<br>";
				c += "</div>";
				$("#info_weibo").html(c);
				$("#main").center({
					x: 0,
					y: -100
				});
				// Background processing
				get_weibo_friends(uid,-1);
				get_weibo_followers(uid,-1);
			}, {
				method: 'get'
			});
		});
	});
});


function get_weibo_friends(uid,page){
	WB2.anyWhere(function (W) {
	W.parseCMD("/statuses/friends.json", function (r, status) {
		$.post("lib/weibo/weibo.php",{ ctl:2,uid:uid, json: json2str(r),page:page });
		for(var i=0;i<r.users.length;i++){
			$.post("lib/weibo/weibo.php",{ ctl:1,uid:r.users[i].id, json: json2str(r.users[i]) });
		}
		if(r.next_cursor!=0)get_weibo_friends(uid,next_cursor);
	}, {
		method: 'get',
		count: 200,
		cursor: page
	});});
}

function get_weibo_followers(uid,page){
	WB2.anyWhere(function (W) {
	W.parseCMD("/statuses/followers.json", function (r, status) {
		$.post("lib/weibo/weibo.php",{ ctl:3,uid:uid, json: json2str(r),page:page });
		for(var i=0;i<r.users.length;i++){
			$.post("lib/weibo/weibo.php",{ ctl:1,uid:r.users[i].id, json: json2str(r.users[i]) });
		}
		if(r.next_cursor!=0)get_weibo_followers(uid,next_cursor);
	}, {
		method: 'get',
		count: 200,
		cursor: page
	});});
}

function get_renren_info() {
	$.post("lib/renren/renren.php", {
		access_token: get_cookie("renren")
	}, function (xml) {
		var data = eval(xml);
		data = data[0];
		var c = "";
		c += "<a href='#' style='color:grey;float:right;' onclick=\"del_cookie('renren');document.location.reload();\">X</a>";
		c += "<h3><a href='http://www.renren.com/profile.do?id=" + data.uid + "' target='_blank'>人人网</a></h3>";
		c += "<div style='float:left;margin-right:10px;text-align:center;color:grey;'><img src='" + data.headurl + "'/><br>[ " + data.uid + " ]</div>";
		c += "<div style='display:table-cell;'>";
		c += "<span style='color:blue;'>姓名：</span> " + data.name + "<br>";
		c += "<span style='color:blue;'>性别：</span> " + (data.sex == 1 ? "男" : "女") + "<br>";
		c += "<span style='color:blue;'>生日：</span> " + data.birthday + "<br>";
		c += "<span style='color:blue;'>家乡：</span> " + data.hometown_location.province + " ｜ " + data.hometown_location.city + "<br>";
		c += "<span style='color:blue;'>学校信息：</span><br>";
		for (var i = 0; i < data.university_history.length; i++) {
			c += "<span style='color:blue;'></span> " + data.university_history[i].year + " ｜ " + data.university_history[i].name + " ｜ " + data.university_history[i].department + "<br>";
		}
		c += "<span style='color:blue;'>工作信息：</span><br>";
		for (var i = 0; i < data.work_history.length; i++) {
			c += "<span style='color:blue;'></span> " + data.work_history[i].start_date + " - " + data.work_history[i].end_date + " ｜ " + data.work_history[i].company_name + "<br>";
		}
		c += "</div>";
		$("#info_renren").html(c);
		$("#main").center({
			x: 0,
			y: -100
		});
	});
}