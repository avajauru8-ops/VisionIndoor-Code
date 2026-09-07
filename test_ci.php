<?php
define('FCPATH', __DIR__ . DIRECTORY_SEPARATOR . 'backend/public/');
chdir(__DIR__ . '/backend/public');
require 'index.php';

$db = \Config\Database::connect();
$totem = $db->table('totens')->where('id', 1)->get()->getRowArray();
print_r($totem);
