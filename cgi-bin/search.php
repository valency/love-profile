<?php
require_once ("./common.php");

$query = "SELECT JSON FROM RENREN WHERE JSON LIKE '%" . str_replace("%", "\%", urlencode($_GET["keyword"])) . "%' LIMIT 0,20;";
$res = mysql_query($query, $dblink);
$err = mysql_error();
$comma = false;

echo "({renren:[\n";

while ($row = mysql_fetch_row($res)) {
	if (strlen($row[0]) > 0) {
		if(!$comma)$comma=true;
		else echo ",\n";
		echo urldecode($row[0]);
	}
} 

$query = "SELECT JSON FROM RENREN WHERE JSON LIKE '%" . str_replace("%", "\%", urlencode($_GET["utf8"])) . "%' LIMIT 0,20;";
$res = mysql_query($query, $dblink);
$err = mysql_error();

while ($row = mysql_fetch_row($res)) {
	if (strlen($row[0]) > 0) {
		if(!$comma)$comma=true;
		else echo ",\n";
		echo urldecode($row[0]);
	}
} 

echo "],\nweibo:[\n";

$query = "SELECT JSON FROM WEIBO WHERE JSON LIKE '%" . str_replace("%", "\%", urlencode($_GET["keyword"])) . "%' LIMIT 0,20;";
$res = mysql_query($query, $dblink);
$err = mysql_error();
$comma = false;

while ($row = mysql_fetch_row($res)) {
	if (strlen($row[0]) > 0) {
		if(!$comma)$comma=true;
		else echo ",\n";
		$user=urldecode($row[0]);
		$user=str_replace("\\',","',",$user);
		$user=str_replace(",\\'",",'",$user);
		$user=str_replace(":\\'",":'",$user);
		$user=str_replace("\\':","':",$user);
		$user=str_replace("\\'}","'}",$user);
		$user=str_replace("{\\'","{'",$user);
		echo $user;
	}
}
echo "]})";
?>