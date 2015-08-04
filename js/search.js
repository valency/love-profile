$(document).ready(function (e) {
	var d = new Date();
	$.get("cgi-bin/search.php?keyword=" + gup("keyword") + "&utf8=" + gup("utf8"), function (xml) {
		var result= eval(xml);
		// Summary
		var n = new Date();
		$("#main").append("共搜索到 " + (result.weibo.length+result.renren.length) + " 条记录，耗时 " + (n.getTime() - d.getTime()) + " 毫秒。");
		if((result.weibo.length+result.renren.length)<1)$("#avatars").append("找不到人？快来<a href='./profile.html'>登记</a>吧！");
		// Renren
		var data=result.renren;
		for (var i = 0; i < data.length; i++) {
			var c = "<div id='" + data[i].uid + "' title='" + encodings["js"].decode(data[i].name, charsets["us_ascii"]) + "' style='text-align:left;display:none;'>";
			c += "<div style='float:left;margin:5px 10px 0 0;text-align:center;'><img src='" + data[i].headurl + "'/><br>";
			c += "[ <small><a href='http://www.renren.com/profile.do?id=" + data[i].uid + "' target='_blank'>" + data[i].uid + "</a></small> ]</div>";
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
			$("body").append(c);
			var c="<div onclick=\"$('#"+data[i].uid+"').dialog({height:300,width:400});\" style='padding:5px 5px 0px;border:1px solid grey;margin:5px;display:inline-block;cursor:pointer;background:#"+(data[i].sex==1?"E9F4FF":"FFE9E9")+";-webkit-box-shadow:#CCC 0px 1px 5px;float:left;'><img src='"+data[i].tinyurl+"' height='50px' width='50px'/><br>";
			c+="<div style='width:50px;white-space:nowrap;overflow:hidden;color:"+(data[i].sex==1?"blue":"#FF00FF")+";cursor:pointer;'>"+data[i].name+"</div>";
			c+="</div>";
			$("#avatars").append(c);
		}
		// Weibo
		data=result.weibo;
		for (var i = 0; i < data.length; i++) {
			var c = "<div id='" + data[i].id + "' title='" + data[i].screen_name+"（"+data[i].name + "）' style='text-align:left;display:none;'>";
			c += "<div style='float:left;margin:5px 10px 0 0;text-align:center;'><img src='" + data[i].profile_image_url + "'/><br>";
			c += "[ <small><a href='http://weibo.com/" + data[i].id + "' target='_blank'>" + data[i].id + "</a></small> ]</div>";
			c += "<div style='display:table-cell;'>";
			c += "<span style='color:#FF00FF;'>姓名：</span> " + data[i].screen_name+"（"+data[i].name + "）<br>";
			c += "<span style='color:#FF00FF;'>性别：</span> " + (data[i].gender == "m" ? "男" : "女") + "<br>";
			c += "<span style='color:#FF00FF;'>位置：</span> " + data[i].location + "<br>";
			c += "<span style='color:#FF00FF;'>个人描述：</span> " + data[i].description + "<br>";			
			c += "</div>";
			c += "</div>";
			$("body").append(c);
			var c="<div onclick=\"$('#"+data[i].id+"').dialog({height:300,width:400});\" style='padding:5px 5px 0px;border:1px solid grey;margin:5px;display:inline-block;cursor:pointer;background:#"+(data[i].gender=="m"?"E9F4FF":"FFE9E9")+";-webkit-box-shadow:#CCC 0px 1px 5px;float:left;'><img src='"+data[i].profile_image_url+"' height='50px' width='50px'/><br>";
			c+="<div style='width:50px;white-space:nowrap;overflow:hidden;color:"+(data[i].gender=="m"?"blue":"#FF00FF")+";cursor:pointer;'>"+data[i].name+"</div>";
			c+="</div>";
			$("#avatars").append(c);
		}
	});
});