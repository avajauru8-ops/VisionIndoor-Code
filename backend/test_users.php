<?php
require 'vendor/autoload.php';
require 'app/Config/Paths.php';
$paths = new Config\Paths();
require rtrim($paths->systemDirectory, '\\/ ') . DIRECTORY_SEPARATOR . 'bootstrap.php';
$db = \Config\Database::connect();
try {
    $builder = $db->table('usuarios');
    $users = $builder->select('id, nome, cpf, email, nivel, status_licenca, validade_licenca, plano, limite_tvs, created_at')->get()->getResultArray();
    print_r($users);
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
