<?php
// Script de Migração Unificada (Totens + Widgets) para servidor remoto
echo "<h3>Migração de Banco de Dados</h3>";

try {
    $envPath = __DIR__ . '/../.env';
    $envContent = @file_get_contents($envPath);
    
    $host = 'localhost';
    $user = 'root';
    $pass = '';
    $dbname = 'visioindoor';
    
    if ($envContent) {
        if (preg_match('/^database\.default\.hostname\s*=\s*(.*)$/m', $envContent, $m)) $host = trim($m[1], " \t\n\r\0\x0B\"'");
        if (preg_match('/^database\.default\.username\s*=\s*(.*)$/m', $envContent, $m)) $user = trim($m[1], " \t\n\r\0\x0B\"'");
        if (preg_match('/^database\.default\.password\s*=\s*(.*)$/m', $envContent, $m)) $pass = trim($m[1], " \t\n\r\0\x0B\"'");
        if (preg_match('/^database\.default\.database\s*=\s*(.*)$/m', $envContent, $m)) $dbname = trim($m[1], " \t\n\r\0\x0B\"'");
    }

    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 1. Totens: Adicionar data_cadastro
    echo "<b>1. Totens:</b><br>";
    $query = $pdo->query("SHOW COLUMNS FROM totens");
    $columns = $query->fetchAll(PDO::FETCH_COLUMN);
    
    if (!in_array('data_cadastro', $columns)) {
        $pdo->exec("ALTER TABLE totens ADD COLUMN data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP");
        echo "- Coluna 'data_cadastro' adicionada em totens.<br>";
    } else {
        echo "- Coluna 'data_cadastro' já existe.<br>";
    }
    
    if (!in_array('ultima_sincronizacao', $columns)) {
        $pdo->exec("ALTER TABLE totens ADD COLUMN ultima_sincronizacao DATETIME DEFAULT NULL");
        echo "- Coluna 'ultima_sincronizacao' adicionada em totens.<br>";
    } else {
        echo "- Coluna 'ultima_sincronizacao' já existe.<br>";
    }

    // 2. Tabela Widgets
    echo "<br><b>2. Widgets:</b><br>";
    $query = $pdo->query("SHOW TABLES LIKE 'widgets'");
    $hasWidgets = $query->fetch();
    
    if (!$hasWidgets) {
        $pdo->exec("CREATE TABLE widgets (
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
        $pdo->exec("INSERT INTO widgets (nome, identificador, api_url, api_key, ativo, em_manutencao) VALUES 
            ('Clima e Tempo', 'clima', 'https://api.openweathermap.org/data/2.5/weather', '', 1, 0),
            ('Loterias Caixa', 'loteria', 'https://servicebus2.caixa.gov.br/portaldeloterias/api', '', 1, 0),
            ('Notícias RSS', 'noticias', 'https://rss.uol.com.br/feed', '', 1, 0)
        ");
        echo "- Widgets padrão inseridos.<br>";
    } else {
        echo "- Tabela 'widgets' já existe.<br>";
    }

    echo "<br><b style='color:green'>Migração concluída com sucesso!</b> Pode fechar esta tela.";
} catch (Exception $e) {
    echo "<br><b style='color:red'>Erro:</b> " . $e->getMessage();
}
