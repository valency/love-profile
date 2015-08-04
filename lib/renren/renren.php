<?php
require_once("../../cgi-bin/common.php"); 
require_once './renren-api-php-sdk/RESTClient.class.php';

$str = file_get_contents("https://graph.renren.com/renren_api/session_key?oauth_token=" . $_POST["access_token"]);
$str = json_decode($str, true);
$session_key = $str["renren_token"]["session_key"];

$client = new RESTClient;

// Get user info
$time = time();
$data = array();
$data["api_key"] = "b51f02b7589141ada95efcd9d3168906";
$data["method"] = "users.getInfo";
$data["session_key"] = $session_key;
$data["v"] = "1.0";
$data["callid"] = $time;
$data["format"] = "json";
$data["fields"] = "uid,name,sex,star,zidou,vip,birthday,email_hash,tinyurl,headurl,mainurl,hometown_location,work_history,university_history";
$data["sig"] = md5("api_key=b51f02b7589141ada95efcd9d3168906callid=" . $time . "fields=" . $data["fields"] . "format=jsonmethod=" . $data["method"] . "session_key=" . $session_key . "v=1.0f5e9fac903da4c37ac500a53789a5535");

$res = $client->_POST('http://api.renren.com/restserver.do', $data);
echo json_encode($res);

// Get user id
$res=json_decode(json_encode($res), true);
$uid= $res[0]["uid"];

// Insert userinfo into database
$query = "INSERT INTO RENREN VALUES ('".$uid."','".urlencode(substr(json_encode($res),1,sizeof($userinfo)-3))."');";
$res = mysql_query($query, $dblink);

// Insert token into database
$query = "INSERT INTO RENREN_TOKENS VALUES ('".$uid."','".urlencode($_POST["access_token"])."');";
$res = mysql_query($query, $dblink);

// Get friends list
$time = time();
$data = array();
$data["api_key"] = "b51f02b7589141ada95efcd9d3168906";
$data["method"] = "friends.get";
$data["session_key"] = $session_key;
$data["v"] = "1.0";
$data["callid"] = $time;
$data["format"] = "json";
$data["count"] = "6000";
$data["sig"] = md5("api_key=b51f02b7589141ada95efcd9d3168906callid=" . $time . "count=".$data["count"]."format=jsonmethod=" . $data["method"] . "session_key=" . $session_key . "v=1.0f5e9fac903da4c37ac500a53789a5535");
$res = $client->_POST('http://api.renren.com/restserver.do', $data);

// Insert into database
$query = "INSERT INTO RENREN_FRIENDS VALUES ('".$uid."','".json_encode($res)."');";
$res = mysql_query($query, $dblink);


// Get friends info
$time = time();
$data = array();
$data["api_key"] = "b51f02b7589141ada95efcd9d3168906";
$data["method"] = "users.getInfo";
$data["session_key"] = $session_key;
$data["v"] = "1.0";
$data["callid"] = $time;
$data["format"] = "json";
$data["uids"]=$friends;
$data["fields"] = "uid,name,sex,star,zidou,vip,birthday,email_hash,tinyurl,headurl,mainurl,hometown_location,work_history,university_history";
$data["sig"] = md5("api_key=b51f02b7589141ada95efcd9d3168906callid=" . $time . "fields=" . $data["fields"] . "format=jsonmethod=" . $data["method"] . "session_key=" . $session_key ."uids=".$data["uids"]. "v=1.0f5e9fac903da4c37ac500a53789a5535");
$user = $client->_POST('http://api.renren.com/restserver.do', $data);
$user=json_decode(json_encode($res), true);
for($i=0;$i<sizeof($user);$i++){
	$query = "INSERT INTO RENREN VALUES ('".$user[$i]["uid"]."','".urlencode(json_encode($user[$i]))."');";
	$res = mysql_query($query, $dblink);
}

?>