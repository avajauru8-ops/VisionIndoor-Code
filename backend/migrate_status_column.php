<?php
$env = parse_ini_file(__DIR__ . '/.env', false, INI_SCANNER_RAW);
$host = $env['database.default.hostname'] ?? 'localhost';
$user = $env['database.default.username'] ?? 'root';
$pass = $env['database.default.password'] ?? '';
$db   = $env['database.default.database'] ?? 'visioindoor';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Make sure status column can hold up to 255 characters
    $pdo->exec("ALTER TABLE totens MODIFY COLUMN status VARCHAR(255) DEFAULT 'offline'");
    
    // Also ensure ultima_informacao is at least 255 (it was added as 255 in the other script, but we ensure it here as well)
    $pdo->exec("ALTER TABLE totens MODIFY COLUMN ultima_informacao VARCHAR(255) DEFAULT NULL");

    // Optional: make sure versao_app and sistema_operacional are large enough
    $pdo->exec("ALTER TABLE totens MODIFY COLUMN versao_app VARCHAR(100) DEFAULT NULL");
    $pdo->exec("ALTER TABLE totens MODIFY COLUMN sistema_operacional VARCHAR(100) DEFAULT NULL");
    $pdo->exec("ALTER TABLE totens MODIFY COLUMN resolucao VARCHAR(50) DEFAULT NULL");

    echo "Colunas atualizadas com sucesso para suportar textos longos.\n";
} catch (PDOException $e) {
    echo "Erro de conexao ou SQL: " . $e->getMessage();
}
