<?php
$env = parse_ini_file(__DIR__ . '/.env');
$host = $env['database.default.hostname'] ?? 'localhost';
$user = $env['database.default.username'] ?? 'root';
$pass = $env['database.default.password'] ?? '';
$db   = $env['database.default.database'] ?? 'visioindoor';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Create playlists table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS playlists (
            id INT AUTO_INCREMENT PRIMARY KEY,
            usuario_id INT NOT NULL,
            nome VARCHAR(255) NOT NULL,
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
            atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "Tabela 'playlists' criada.\n";

    // Create playlist_itens table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS playlist_itens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            playlist_id INT NOT NULL,
            campanha_id INT NULL,
            widget_nome VARCHAR(100) NULL,
            tempo_exibicao INT DEFAULT 15,
            ordem INT NOT NULL,
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "Tabela 'playlist_itens' criada.\n";

    // Add playlist_id to totens
    try {
        $pdo->exec("ALTER TABLE totens ADD COLUMN playlist_id INT NULL");
        echo "Coluna 'playlist_id' adicionada em totens.\n";
    } catch(Exception $e) { 
        echo "Coluna 'playlist_id' já existe ou erro: " . $e->getMessage() . "\n"; 
    }

    echo "Migracao de listas de reproducao concluida.\n";
} catch (PDOException $e) {
    echo "Erro de conexao: " . $e->getMessage();
}
