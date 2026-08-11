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
        'auto_iniciar' => 'TINYINT(1) DEFAULT 1',
        'iniciar_tv_energia' => 'TINYINT(1) DEFAULT 0',
        'fuso_horario' => "VARCHAR(100) DEFAULT 'America/Sao_Paulo'",
        'exibir_barra_tarefas' => 'TINYINT(1) DEFAULT 1',
        'audio_ligado' => 'TINYINT(1) DEFAULT 1',
        'auto_reiniciar_horas' => 'INT DEFAULT 0',
        'exibir_notificacoes' => 'TINYINT(1) DEFAULT 0',
        'limpeza_automatica' => 'TINYINT(1) DEFAULT 1',
        'tempo_exibicao_padrao' => 'INT DEFAULT 15'
    ];

    foreach ($cols as $col => $def) {
        try {
            $pdo->exec("ALTER TABLE totens ADD COLUMN $col $def");
            echo "Coluna '$col' adicionada.\n";
        } catch(Exception $e) { 
            echo "$col ja existe ou erro: " . $e->getMessage() . "\n"; 
        }
    }

    echo "Migracao concluida.\n";
} catch (PDOException $e) {
    echo "Erro de conexao: " . $e->getMessage();
}
