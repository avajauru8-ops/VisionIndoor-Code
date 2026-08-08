<?php
$hostname = 'localhost';
$username = 'u357867701_grandmidiaapp';
$password = '9e~ZTgMygu+?';
$database = 'u357867701_grandmidiaapp';

try {
    $conn = new PDO("mysql:host=$hostname;dbname=$database", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Check EOI06
    $stmt = $conn->prepare("SELECT t.*, u.nome, u.email FROM totens t LEFT JOIN usuarios u ON t.usuario_id = u.id WHERE t.device_id = 'EOI06'");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result) {
        echo "ENCONTRADO:\n";
        print_r($result);
    } else {
        echo "NÃO ENCONTRADO.\n";
    }
} catch(PDOException $e) {
    // If it fails, maybe the local env doesn't use these creds, try root
    try {
        $conn2 = new PDO("mysql:host=localhost;dbname=$database", 'root', '');
        $conn2->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        $stmt2 = $conn2->prepare("SELECT t.*, u.nome, u.email FROM totens t LEFT JOIN usuarios u ON t.usuario_id = u.id WHERE t.device_id = 'EOI06'");
        $stmt2->execute();
        $result2 = $stmt2->fetch(PDO::FETCH_ASSOC);
        
        if ($result2) {
            echo "ENCONTRADO (using root):\n";
            print_r($result2);
        } else {
            echo "NÃO ENCONTRADO (using root).\n";
        }
    } catch(PDOException $e2) {
        echo "Erro de conexão:\n" . $e->getMessage() . "\n" . $e2->getMessage();
    }
}
