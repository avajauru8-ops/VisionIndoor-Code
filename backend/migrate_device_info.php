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
        'versao_app' => 'VARCHAR(50) DEFAULT NULL',
        'sistema_operacional' => 'VARCHAR(100) DEFAULT NULL',
        'resolucao' => 'VARCHAR(50) DEFAULT NULL',
        'espaco_utilizado' => 'VARCHAR(50) DEFAULT NULL',
        'espaco_livre' => 'VARCHAR(50) DEFAULT NULL'
    ];

    foreach ($cols as $col => $def) {
        try {
            $pdo->exec("ALTER TABLE totens ADD COLUMN $col $def");
            echo "Coluna '$col' adicionada.\n";
        } catch(Exception $e) { 
            echo "$col já existe ou erro: " . $e->getMessage() . "\n"; 
        }
    }

    echo "Migracao concluida.\n";
} catch (PDOException $e) {
    echo "Erro de conexao: " . $e->getMessage();
}
