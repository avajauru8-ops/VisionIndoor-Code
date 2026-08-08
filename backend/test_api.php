<?php
$env = parse_ini_file(__DIR__ . '/../.env', false, INI_SCANNER_RAW);
$host = $env['MYSQL_HOST'] ?? 'localhost';
$user = $env['MYSQL_USER'] ?? 'root';
$pass = $env['MYSQL_PASSWORD'] ?? '';
$db   = $env['MYSQL_DATABASE'] ?? 'visioindoor';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Apply migration to PRODUCTION DB
    $pdo->exec("ALTER TABLE totens MODIFY COLUMN status VARCHAR(255) DEFAULT 'offline'");
    $pdo->exec("ALTER TABLE totens MODIFY COLUMN ultima_informacao VARCHAR(255) DEFAULT NULL");
    $pdo->exec("ALTER TABLE totens MODIFY COLUMN versao_app VARCHAR(100) DEFAULT NULL");
    $pdo->exec("ALTER TABLE totens MODIFY COLUMN sistema_operacional VARCHAR(100) DEFAULT NULL");
    $pdo->exec("ALTER TABLE totens MODIFY COLUMN resolucao VARCHAR(50) DEFAULT NULL");

    echo "Colunas de status atualizadas na PRODUÇÃO.\n";

    $stmt = $pdo->query("SELECT id, device_id FROM totens LIMIT 1");
    $totem = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$totem || empty($totem['device_id'])) {
        echo "Nenhum totem com device_id encontrado.\n";
        exit;
    }

    $deviceId = $totem['device_id'];
    echo "Testando PROD com device_id: " . $deviceId . "\n";

    // Now test the API
    $payload = [
        "device_id" => $deviceId,
        "status_operacional" => "EM VERIFICAÇÃO",
        "status_atual" => "Baixando mídia",
        "info" => [
            "versao_app" => "2.0.1",
            "sistema_operacional" => "Android 10",
            "resolucao" => "1920x1080",
            "espaco_usado" => "5GB",
            "espaco_livre" => "20GB",
            "data_hora" => date('Y-m-d H:i:s')
        ]
    ];

    $ch = curl_init('https://aplicativo.grandmidia.com.br/api.php');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type:application/json'));
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);

    echo "Status Code da API: " . $httpCode . "\n";
    if ($err) echo "Erro cURL: $err\n";
    echo "Resposta da API: " . substr($response, 0, 200) . "...\n";

    // Verify if it was saved
    $stmt = $pdo->prepare("SELECT status, ultima_informacao, versao_app, sistema_operacional, resolucao, espaco_utilizado, espaco_livre, data_hora_tv FROM totens WHERE id = ?");
    $stmt->execute([$totem['id']]);
    $updatedTotem = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "\nDados atualizados no banco de PRODUÇÃO:\n";
    print_r($updatedTotem);

} catch (PDOException $e) {
    echo "Erro: " . $e->getMessage();
}
