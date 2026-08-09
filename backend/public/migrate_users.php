<?php
// Script para rodar no servidor remoto
define('FCPATH', __DIR__ . DIRECTORY_SEPARATOR);
require realpath(FCPATH . '../app/Config/Paths.php') ?: FCPATH . '../app/Config/Paths.php';
$paths = new Config\Paths();
require rtrim($paths->systemDirectory, '\\/ ') . DIRECTORY_SEPARATOR . 'bootstrap.php';
// Or if CI 4.5+
if (!class_exists('CodeIgniter\CodeIgniter')) {
    require rtrim($paths->systemDirectory, '\\/ ') . DIRECTORY_SEPARATOR . 'Common.php';
    require rtrim($paths->systemDirectory, '\\/ ') . DIRECTORY_SEPARATOR . 'Autoloader/Autoloader.php';
}

$db = \Config\Database::connect();

try {
    $builder = $db->table('usuarios');
    $query = $db->query("SHOW COLUMNS FROM usuarios");
    $columns = $query->getResultArray();
    $existing = array_column($columns, 'Field');

    $colsToAdd = [
        'cpf' => "VARCHAR(20) DEFAULT NULL",
        'status_licenca' => "VARCHAR(50) DEFAULT 'ativa' NOT NULL",
        'validade_licenca' => "DATETIME DEFAULT '2099-12-31 23:59:59' NOT NULL",
        'plano' => "VARCHAR(50) DEFAULT 'gratis' NOT NULL",
        'limite_tvs' => "INT DEFAULT 1 NOT NULL"
    ];

    echo "Migrando tabela usuarios...<br>\n";

    foreach ($colsToAdd as $col => $def) {
        if (!in_array($col, $existing)) {
            $db->query("ALTER TABLE usuarios ADD COLUMN $col $def");
            echo "Coluna '$col' adicionada com sucesso.<br>\n";
        } else {
            echo "Coluna '$col' já existe.<br>\n";
        }
    }

    echo "<br>\nMigracao da tabela usuarios concluida.";
} catch (Exception $e) {
    echo "Erro: " . $e->getMessage();
}
