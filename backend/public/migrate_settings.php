<?php
echo "<h3>Migração de Configurações Globais</h3>";

try {
    $envPath = __DIR__ . '/../.env';
    $envContent = file_get_contents($envPath);
    
    $host = 'localhost';
    $user = 'root';
    $pass = '';
    $dbname = 'visioindoor';
    
    if (preg_match('/^database\.default\.hostname\s*=\s*(.*)$/m', $envContent, $m)) $host = trim($m[1], " \t\n\r\0\x0B\"'");
    if (preg_match('/^database\.default\.username\s*=\s*(.*)$/m', $envContent, $m)) $user = trim($m[1], " \t\n\r\0\x0B\"'");
    if (preg_match('/^database\.default\.password\s*=\s*(.*)$/m', $envContent, $m)) $pass = trim($m[1], " \t\n\r\0\x0B\"'");
    if (preg_match('/^database\.default\.database\s*=\s*(.*)$/m', $envContent, $m)) $dbname = trim($m[1], " \t\n\r\0\x0B\"'");

    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $query = $pdo->query("SHOW COLUMNS FROM configuracoes_admin");
    $columns = $query->fetchAll(PDO::FETCH_COLUMN);
    
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
            $pdo->exec("ALTER TABLE configuracoes_admin ADD COLUMN $col $def");
            echo "- Coluna '$col' adicionada.<br>";
        } else {
            echo "- Coluna '$col' já existe.<br>";
        }
    }
    
    echo "<br><b style='color:green'>Migração concluída com sucesso!</b> Pode fechar esta tela e tentar salvar no painel novamente.";
} catch (Exception $e) {
    echo "<br><b style='color:red'>Erro:</b> " . $e->getMessage();
}
