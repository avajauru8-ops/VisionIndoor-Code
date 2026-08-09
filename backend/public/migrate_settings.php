<?php
define('FCPATH', __DIR__ . DIRECTORY_SEPARATOR);
require realpath(FCPATH . '../app/Config/Paths.php') ?: FCPATH . '../app/Config/Paths.php';
$paths = new Config\Paths();
require rtrim($paths->systemDirectory, '\\/ ') . DIRECTORY_SEPARATOR . 'bootstrap.php';

if (!class_exists('CodeIgniter\CodeIgniter')) {
    require rtrim($paths->systemDirectory, '\\/ ') . DIRECTORY_SEPARATOR . 'Common.php';
    require rtrim($paths->systemDirectory, '\\/ ') . DIRECTORY_SEPARATOR . 'Autoloader/Autoloader.php';
}

$db = \Config\Database::connect();

try {
    echo "<h3>Migração de Configurações Globais</h3>";
    $query = $db->query("SHOW COLUMNS FROM configuracoes_admin");
    $columns = array_column($query->getResultArray(), 'Field');
    
    $colsToAdd = [
        'show_apk_banner' => "BOOLEAN DEFAULT TRUE",
        'apk_banner_title' => "VARCHAR(255) DEFAULT 'Player Android'",
        'apk_banner_desc' => "TEXT DEFAULT NULL",
        'apk_banner_btn_text' => "VARCHAR(100) DEFAULT 'Instalar Player'",
        'apk_file_url' => "VARCHAR(255) DEFAULT NULL",
        'openweather_api_key' => "VARCHAR(255) DEFAULT NULL"
    ];

    foreach ($colsToAdd as $col => $def) {
        if (!in_array($col, $columns)) {
            $db->query("ALTER TABLE configuracoes_admin ADD COLUMN $col $def");
            echo "- Coluna '$col' adicionada.<br>";
        } else {
            echo "- Coluna '$col' já existe.<br>";
        }
    }
    
    echo "<br><b style='color:green'>Migração concluída com sucesso!</b> Pode fechar esta tela e testar novamente.";
} catch (Exception $e) {
    echo "<br><b style='color:red'>Erro:</b> " . $e->getMessage();
}
