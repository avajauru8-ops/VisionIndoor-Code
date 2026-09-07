<?php
require 'backend/app/Config/Database.php';
$db = \Config\Database::connect();
$totem = $db->table('totens')->where('id', 1)->get()->getRowArray();
echo $totem['device_id'];
