<?php
// Script para rodar no servidor remoto
echo "<h3>Migração de Usuários</h3>";

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

    $query = $pdo->query("SHOW COLUMNS FROM usuarios");
    $columns = $query->fetchAll(PDO::FETCH_COLUMN);

    $colsToAdd = [
        'cpf' => "VARCHAR(20) DEFAULT NULL",
        'status_licenca' => "VARCHAR(20) DEFAULT 'ativo'",
        'validade_licenca' => "DATE DEFAULT NULL",
        'plano' => "VARCHAR(50) DEFAULT 'Mensal'",
        'limite_tvs' => "INT DEFAULT 5"
    ];

    foreach ($colsToAdd as $col => $def) {
        if (!in_array($col, $columns)) {
            $pdo->exec("ALTER TABLE usuarios ADD COLUMN $col $def");
            echo "- Coluna '$col' adicionada.<br>";
        } else {
            echo "- Coluna '$col' já existe.<br>";
        }
    }

    echo "<br><b style='color:green'>Migração concluída com sucesso!</b> Pode fechar esta tela.";
} catch (Exception $e) {
    echo "<br><b style='color:red'>Erro:</b> " . $e->getMessage();
}
