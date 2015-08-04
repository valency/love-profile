$(document).ready(function (e) {
	var d = new Date();
	$.get("./search.php?keyword=" + gup("keyword") + "&utf8=" + gup("utf8"), function (xml) {
		var data = eval(xml);
		for (var i = 0; i < data.length; i++) {
			var c = "<div id='" + data[i].uid + "' title='" + encodings["js"].decode(data[i].name, charsets["us_ascii"]) + "' style='font-size:0.8em;'>";
			c += "<div style='float:left;margin:5px 10px 0 0;text-align:center;'><img src='" + data[i].headurl + "'/><br>";
			c += "[ <a href='http://www.renren.com/profile.do?id=" + data[i].uid + "' target='_blank'>" + data[i].uid + "</a> ]</div>";
			c += "<div style='display:table-cell;'>";
			c += "<span style='color:#FF00FF;'>姓名：</span> " + data[i].name + "<br>";
			c += "<span style='color:#FF00FF;'>性别：</span> " + (data[i].sex == 1 ? "男" : "女") + "<br>";
			c += "<span style='color:#FF00FF;'>生日：</span> " + data[i].birthday + "<br>";
			c += "<span style='color:#FF00FF;'>家乡：</span> " + data[i].hometown_location.province + " ｜ " + data[i].hometown_location.city + "<br>";
			c += "<span style='color:#FF00FF;'>学校信息：</span><br>";
			for (var j = 0; j < data[i].university_history.length; j++) {
				c += "<span style='color:#FF00FF;'></span> " + data[i].university_history[j].year + " ｜ " + data[i].university_history[j].name + " ｜ " + data[i].university_history[j].department + "<br>";
			}
			c += "<span style='color:#FF00FF;'>工作信息：</span><br>";
			for (var j = 0; j < data[i].work_history.length; j++) {
				c += "<span style='color:#FF00FF;'></span> " + data[i].work_history[j].start_date + " - " + data[i].work_history[j].end_date + " ｜ " + data[i].work_history[j].company_name + "<br>";
			}
			c += "</div>";
			c += "</div>";
			$("#main").append(c);
			$("#" + data[i].uid).dialog({
				height: 300,
				width: 400
			});
		}
		var n = new Date();
		$("#main").append("共搜索到 " + data.length + " 条记录，耗时 " + (n.getTime() - d.getTime()) + " 毫秒。");
	});
});