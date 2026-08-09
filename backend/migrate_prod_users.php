<?php
$host = '199.167.144.250';
$user = 'falconsi_visioindoor';
$pass = 'B;o%Dt%ONL8Z,VhS';
$db   = 'falconsi_visioindoor';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $cols = [
        'cpf' => "VARCHAR(20) DEFAULT NULL",
        'status_licenca' => "VARCHAR(50) DEFAULT 'ativa' NOT NULL",
        'validade_licenca' => "DATETIME DEFAULT '2099-12-31 23:59:59' NOT NULL",
        'plano' => "VARCHAR(50) DEFAULT 'gratis' NOT NULL",
        'limite_tvs' => "INT DEFAULT 1 NOT NULL"
    ];

    echo "Migrando tabela usuarios na PRODUÇÃO ($host)...\n";

    foreach ($cols as $col => $def) {
        try {
            $pdo->exec("ALTER TABLE usuarios ADD COLUMN $col $def");
            echo "Coluna '$col' adicionada com sucesso.\n";
        } catch(Exception $e) { 
            echo "$col já existe ou erro: " . $e->getMessage() . "\n"; 
        }
    }

    echo "\nMigracao da tabela usuarios concluida.\n";
} catch (PDOException $e) {
    echo "Erro de conexao: " . $e->getMessage();
}
