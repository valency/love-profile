<?php
require_once ("./common.php");

$query = "SELECT COUNT(*) FROM RENREN;";
$res = mysql_query($query, $dblink);
$row = mysql_fetch_row($res);
echo $row[0];

?>