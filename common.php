<?php
$dblink=mysql_connect("localhost","desmond","123456"); 
if(!$dblink) echo "CONNECTION FAILED!\n"; 
else mysql_select_db('LOVE_PROFILE');
?>