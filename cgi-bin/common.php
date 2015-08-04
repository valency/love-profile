<?php
$dblink=mysql_connect("localhost","loveprof_profile","q1w2e3r4t5"); 
if(!$dblink) echo "CONNECTION FAILED!\n"; 
else mysql_select_db('loveprof_profile');
?>