<?php

$database = \Config\Database::connect();

$sql = "CREATE TABLE IF NOT EXISTS notificacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL DEFAULT 'info',
    lida TINYINT(1) DEFAULT 0,
    totem_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
)";

if ($database->query($sql)) {
    echo "Tabela 'notificacoes' criada com sucesso!\n";
} else {
    echo "Erro ao criar tabela: " . $database->error()['message'] . "\n";
}
