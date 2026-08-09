<?php
// Script de Migração Unificada (Totens + Widgets) para servidor remoto
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
    echo "<h3>Migração de Banco de Dados</h3>";

    // 1. Totens: Adicionar data_cadastro
    echo "<b>1. Totens:</b><br>";
    $query = $db->query("SHOW COLUMNS FROM totens");
    $columns = array_column($query->getResultArray(), 'Field');
    
    if (!in_array('data_cadastro', $columns)) {
        $db->query("ALTER TABLE totens ADD COLUMN data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP");
        echo "- Coluna 'data_cadastro' adicionada em totens.<br>";
    } else {
        echo "- Coluna 'data_cadastro' já existe.<br>";
    }
    
    if (!in_array('ultima_sincronizacao', $columns)) {
        $db->query("ALTER TABLE totens ADD COLUMN ultima_sincronizacao DATETIME DEFAULT NULL");
        echo "- Coluna 'ultima_sincronizacao' adicionada em totens.<br>";
    } else {
        echo "- Coluna 'ultima_sincronizacao' já existe.<br>";
    }

    // 2. Tabela Widgets
    echo "<br><b>2. Widgets:</b><br>";
    $query = $db->query("SHOW TABLES LIKE 'widgets'");
    $hasWidgets = $query->getRow();
    
    if (!$hasWidgets) {
        $db->query("CREATE TABLE widgets (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nome VARCHAR(255) NOT NULL,
            identificador VARCHAR(100) NOT NULL UNIQUE,
            api_url VARCHAR(255) NULL,
            api_key VARCHAR(255) NULL,
            ativo BOOLEAN DEFAULT TRUE,
            em_manutencao BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )");
        echo "- Tabela 'widgets' criada com sucesso.<br>";

        // Inserir os defaults
        $db->table('widgets')->insertBatch([
            [
                'nome' => 'Clima e Tempo',
                'identificador' => 'clima',
                'api_url' => 'https://api.openweathermap.org/data/2.5/weather',
                'api_key' => '',
                'ativo' => 1,
                'em_manutencao' => 0
            ],
            [
                'nome' => 'Loterias Caixa',
                'identificador' => 'loteria',
                'api_url' => 'https://servicebus2.caixa.gov.br/portaldeloterias/api',
                'api_key' => '',
                'ativo' => 1,
                'em_manutencao' => 0
            ],
            [
                'nome' => 'Notícias RSS',
                'identificador' => 'noticias',
                'api_url' => 'https://rss.uol.com.br/feed',
                'api_key' => '',
                'ativo' => 1,
                'em_manutencao' => 0
            ]
        ]);
        echo "- Widgets padrão inseridos.<br>";
    } else {
        echo "- Tabela 'widgets' já existe.<br>";
    }

    echo "<br><b style='color:green'>Migração concluída com sucesso!</b> Pode fechar esta tela.";
} catch (Exception $e) {
    echo "<br><b style='color:red'>Erro:</b> " . $e->getMessage();
}
