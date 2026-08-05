<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

try {
    if (!file_exists('config.php')) {
        throw new Exception("config.php file not found in " . __DIR__);
    }
    include 'config.php'; 

    $device_id = $_GET['device_id'] ?? '';

    if (empty($device_id)) {
        echo json_encode(["erro" => "Identificador do dispositivo nao fornecido."]);
        exit;
    }

    if (!isset($pdo)) {
        throw new Exception('$pdo is not defined after including config.php');
    }

    // ATUALIZAÇÃO: Agora busca o id e a configuração auto_iniciar
    $stmt = $pdo->prepare("SELECT id, auto_iniciar FROM totens WHERE device_id = ?");
    $stmt->execute([$device_id]);
    $totem = $stmt->fetch();

    if (!$totem) {
        echo json_encode([
            "erro" => "Dispositivo nao autorizado.",
            "device_id" => $device_id,
            "mensagem" => "Cadastre este ID de dispositivo no seu painel de controle."
        ]);
        exit;
    }

    $stmtUpdate = $pdo->prepare("UPDATE totens SET status = 'online', ultima_sincronizacao = NOW() WHERE id = ?");
    $stmtUpdate->execute([$totem['id']]);

    $hoje = date('Y-m-d');
    $sql = "SELECT id, tipo_midia, url_arquivo, tempo_exibicao 
            FROM campanhas 
            WHERE ativo = 1 AND data_inicio <= ? AND data_fim >= ?";
    $stmtCampanhas = $pdo->prepare($sql);
    $stmtCampanhas->execute([$hoje, $hoje]);
    $playlist = $stmtCampanhas->fetchAll(PDO::FETCH_ASSOC);

    // ATUALIZAÇÃO: Envia o status do auto_iniciar no JSON
    echo json_encode([
        "totem_id" => $device_id,
        "auto_iniciar" => isset($totem['auto_iniciar']) ? (bool) $totem['auto_iniciar'] : false,
        "playlist" => $playlist
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "erro_fatal" => $e->getMessage(),
        "trace" => $e->getTraceAsString()
    ]);
}
?>
