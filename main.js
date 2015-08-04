$(document).ready(function (e) {
	$("#search_btn").button();
	$("#main").center({
		x: 0,
		y: -100
	});
	$("#search_btn").click(function(){
		if($("#keyword").val().length>0){
			var utf8=encodings["js"].encode($("#keyword").val(), charsets["us_ascii"]);
			window.location.href="./search.html?keyword="+encodeURI($("#keyword").val())+"&utf8="+utf8;
		}
	});
});
