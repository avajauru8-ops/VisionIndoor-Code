<?php
$env = parse_ini_file(__DIR__ . '/.env');
$host = $env['database.default.hostname'] ?? 'localhost';
$user = $env['database.default.username'] ?? 'root';
$pass = $env['database.default.password'] ?? '';
$db   = $env['database.default.database'] ?? 'visioindoor';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    try {
        $pdo->exec("ALTER TABLE usuarios ADD COLUMN plano ENUM('gratis', 'pago') DEFAULT 'gratis' NOT NULL");
        echo "Coluna 'plano' adicionada.\n";
    } catch(Exception $e) { echo "plano: " . $e->getMessage() . "\n"; }

    try {
        $pdo->exec("ALTER TABLE usuarios ADD COLUMN limite_tvs INT DEFAULT 1 NOT NULL");
        echo "Coluna 'limite_tvs' adicionada.\n";
    } catch(Exception $e) { echo "limite_tvs: " . $e->getMessage() . "\n"; }

    echo "Migracao concluida.\n";
} catch (PDOException $e) {
    echo "Erro de conexao: " . $e->getMessage();
}
