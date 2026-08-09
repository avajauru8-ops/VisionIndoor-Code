<?php
// Script de Migração para Configurações Avançadas do Totem
echo "<h3>Migração de Configurações do Totem</h3>";

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

    $query = $pdo->query("SHOW COLUMNS FROM totens");
    $columns = $query->fetchAll(PDO::FETCH_COLUMN);

    $colsToAdd = [
        'rotacao' => "VARCHAR(20) DEFAULT 'padrao'",
        'auto_iniciar' => "BOOLEAN DEFAULT TRUE",
        'iniciar_tv_energia' => "BOOLEAN DEFAULT FALSE",
        'fuso_horario' => "VARCHAR(100) DEFAULT 'America/Sao_Paulo'",
        'exibir_barra_tarefas' => "BOOLEAN DEFAULT FALSE",
        'audio_ligado' => "BOOLEAN DEFAULT TRUE",
        'auto_reiniciar_horas' => "INT DEFAULT 24",
        'exibir_notificacoes' => "BOOLEAN DEFAULT FALSE",
        'limpeza_automatica' => "BOOLEAN DEFAULT TRUE",
        'tempo_exibicao_padrao' => "INT DEFAULT 15",
        'id_monetizacao' => "VARCHAR(255) DEFAULT NULL",
        'comando_acao' => "VARCHAR(100) DEFAULT NULL",
        'comando_id' => "VARCHAR(100) DEFAULT NULL",
        'ultima_captura_tela' => "VARCHAR(255) DEFAULT NULL"
    ];

    foreach ($colsToAdd as $col => $def) {
        if (!in_array($col, $columns)) {
            $pdo->exec("ALTER TABLE totens ADD COLUMN $col $def");
            echo "- Coluna '$col' adicionada.<br>";
        } else {
            echo "- Coluna '$col' já existe.<br>";
        }
    }

    echo "<br><b style='color:green'>Migração concluída com sucesso!</b> Pode fechar esta tela e voltar a salvar as TVs.";
} catch (Exception $e) {
    echo "<br><b style='color:red'>Erro:</b> " . $e->getMessage();
}
