<?php
$host = 'localhost';
$db   = 'u357867701_grandmidiaapp';
$user = 'u357867701_grandmidiaapp';
$pass = '9e~ZTgMygu+?';
try {
    $pdo = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $stmt = $pdo->query("SELECT id, nome, cpf, email, nivel, status_licenca, validade_licenca, plano, limite_tvs, created_at FROM usuarios");
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo "Erro: " . $e->getMessage();
}
