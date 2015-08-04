<?php
require_once("../../cgi-bin/common.php"); 
if($_POST["ctl"]==1)$query = "INSERT INTO WEIBO VALUES ('".$_POST["uid"]."','".urlencode($_POST["json"])."');";
if($_POST["ctl"]==2)$query = "INSERT INTO WEIBO_FRIENDS VALUES ('".$_POST["uid"]."','".urlencode($_POST["json"])."','".$_POST["page"]."');";
if($_POST["ctl"]==3)$query = "INSERT INTO WEIBO_FOLLOWERS VALUES ('".$_POST["uid"]."','".urlencode($_POST["json"])."','".$_POST["page"]."');";
$res = mysql_query($query, $dblink);
?>