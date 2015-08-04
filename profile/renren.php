<?php
function post($url, $post = null) {
	$context = array();
	if (is_array($post)) {
		ksort($post);
		$context['http'] = array(
			'method' => 'POST',
			'content' => http_build_query($post, '', '&') ,
		);
	}
	return file_get_contents($url, false, stream_context_create($context));
}
$time=time();
$str = file_get_contents("https://graph.renren.com/renren_api/session_key?oauth_token=".$_POST["access_token"]);
$str=json_decode($str,true);
$session_key=$str["renren_token"]["session_key"];
$data = array();
$data["api_key"]="b51f02b7589141ada95efcd9d3168906";
$data["method"]=$_POST["method"];
$data["session_key"]=$session_key;
$data["v"]="1.0";
$data["callid"]=$time;
$data["format"]="json";
$data["fields"]=$_POST["fields"];
$data["sig"]=md5("api_key=b51f02b7589141ada95efcd9d3168906callid=".$time."fields=".$_POST["fields"]."format=jsonmethod=".$_POST["method"]."session_key=".$session_key."v=1.0f5e9fac903da4c37ac500a53789a5535");
echo post("http://api.renren.com/restserver.do", $data);
?>