<?php
$env = parse_ini_file(__DIR__ . '/.env');
$host = $env['database.default.hostname'] ?? 'localhost';
$user = $env['database.default.username'] ?? 'root';
$pass = $env['database.default.password'] ?? '';
$db   = $env['database.default.database'] ?? 'visioindoor';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $cols = [
        'cpf' => "VARCHAR(20) DEFAULT NULL",
        'status_licenca' => "ENUM('ativa', 'expirada') DEFAULT 'ativa' NOT NULL",
        'validade_licenca' => "DATETIME DEFAULT '2099-12-31 23:59:59' NOT NULL"
    ];

    foreach ($cols as $col => $def) {
        try {
            $pdo->exec("ALTER TABLE usuarios ADD COLUMN $col $def");
            echo "Coluna '$col' adicionada.\n";
        } catch(Exception $e) { 
            echo "$col já existe ou erro: " . $e->getMessage() . "\n"; 
        }
    }

    echo "Migracao concluida.\n";
} catch (PDOException $e) {
    echo "Erro de conexao: " . $e->getMessage();
}
