<?php
require_once ("./common.php");

$query = "SELECT JSON FROM RENREN WHERE JSON LIKE '%" . str_replace("%", "\%", urlencode($_GET["keyword"])) . "%'";
$res = mysql_query($query, $dblink);
$err = mysql_error();
$row = mysql_fetch_row($res);
$comma = false;

echo "([";

while ($row = mysql_fetch_row($res)) {
	if (strlen($row[0]) > 0) {
		if(!$comma)$comma=true;
		else echo ",\n";
		echo urldecode($row[0]);
	}
} 

$query = "SELECT JSON FROM RENREN WHERE JSON LIKE '%" . str_replace("%", "\%", urlencode($_GET["utf8"])) . "%'";
$res = mysql_query($query, $dblink);
$err = mysql_error();

while ($row = mysql_fetch_row($res)) {
	if (strlen($row[0]) > 0) {
		if(!$comma)$comma=true;
		else echo ",\n";
		echo urldecode($row[0]);
	}
} 


echo "])";
?>