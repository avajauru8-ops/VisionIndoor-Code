<?php
// Tenta ler o .env do diretório acima
$envFile = __DIR__ . '/../.env';
$hostname = 'localhost';
$username = 'root';
$password = '';
$database = 'visioindoor';

if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2) + [NULL, NULL];
        if ($name) {
            $name = trim($name);
            $value = trim($value);
            if ($name === 'database.default.hostname') $hostname = $value;
            if ($name === 'database.default.database') $database = $value;
            if ($name === 'database.default.username') $username = $value;
            if ($name === 'database.default.password') $password = $value;
        }
    }
}

try {
    $pdo = new PDO("mysql:host=$hostname;dbname=$database;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(['erro' => 'Falha na conexão com o banco de dados.']));
}
?>
