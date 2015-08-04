if (window.location.href.substr(7, 1) != "w") window.location.href = "http://www.loveprofile.net";
$(document).ready(function (e) {
	$("#search_btn").button();
	$("#search_btn").click(function () {
		if ($("#keyword").val().length > 0) {
			var utf8 = encodings["js"].encode($("#keyword").val(), charsets["us_ascii"]);
			window.location.href = "search.html?keyword=" + encodeURI($("#keyword").val()) + "&utf8=" + utf8.replace(/\\/g,"");
		}
	});
	$.get("cgi-bin/count.php",function(xml){
		$("#count").html("共有 <font color='#FF00FF'>"+xml+"</font> 条个人信息记录");
		$("#main").center();
	});
});