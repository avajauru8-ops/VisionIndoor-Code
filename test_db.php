<?php
require 'backend/app/Config/Database.php';
$db = \Config\Database::connect();
$query = $db->query('SELECT id, arquivo, tipo_midia FROM campanhas LIMIT 5');
print_r($query->getResultArray());
