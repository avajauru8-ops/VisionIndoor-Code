<?php
// api_upload_print.php
header('Content-Type: application/json');

// Recebe os dados brutos (O Android envia via Payload Body JSON)
$data = json_decode(file_get_contents('php://input'), true);

if (isset($data['device_id']) && isset($data['imagem_base64'])) {
    
    // 1. Sanitiza o device_id para permitir apenas letras e números (evita Path Traversal)
    $device_id = preg_replace('/[^a-zA-Z0-9_-]/', '', $data['device_id']);
    $base64 = $data['imagem_base64'];

    // 2. Verifica o tamanho (limite de 5MB, por exemplo, na string base64)
    // Uma imagem de 5MB em base64 tem cerca de 6.6MB
    if (strlen($base64) > 7000000) {
        echo json_encode(["erro" => "Arquivo muito grande"]);
        exit;
    }

    // Decodifica a imagem Base64
    $imagem_decodificada = base64_decode($base64);
    
    // 3. Valida se o conteúdo decodificado é realmente uma imagem válida
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime_type = $finfo->buffer($imagem_decodificada);
    
    $tipos_permitidos = ['image/jpeg', 'image/png', 'image/gif'];
    if (!in_array($mime_type, $tipos_permitidos)) {
        echo json_encode(["erro" => "Arquivo inválido ou não é uma imagem suportada"]);
        exit;
    }
    
    // Define a extensão com base no mime-type, se quiser ser dinâmico,
    // mas forçar .jpg ou .png com base na validação é mais seguro.
    $extensao = ($mime_type == 'image/png') ? '.png' : '.jpg';
    
    // Nome do arquivo com base no ID da TV e na data
    $nome_arquivo = 'print_' . $device_id . '_' . time() . $extensao;
    
    // Salva na pasta (garanta que a pasta "prints" exista e tenha permissão segura)
    if (!is_dir('prints')) {
        // 4. Usa 0755 ao invés de 0777 por segurança
        mkdir('prints', 0755, true);
    }
    
    $caminho = 'prints/' . $nome_arquivo;
    
    // Cria fisicamente a imagem no servidor
    if (file_put_contents($caminho, $imagem_decodificada) !== false) {
        
        // Update database
        try {
            $envPath = __DIR__ . '/../.env';
            $envContent = @file_get_contents($envPath);
            $host = 'localhost'; $user = 'root'; $pass = ''; $dbname = 'visioindoor';
            if ($envContent) {
                if (preg_match('/^database\.default\.hostname\s*=\s*(.*)$/m', $envContent, $m)) $host = trim($m[1], " \t\n\r\0\x0B\"'");
                if (preg_match('/^database\.default\.username\s*=\s*(.*)$/m', $envContent, $m)) $user = trim($m[1], " \t\n\r\0\x0B\"'");
                if (preg_match('/^database\.default\.password\s*=\s*(.*)$/m', $envContent, $m)) $pass = trim($m[1], " \t\n\r\0\x0B\"'");
                if (preg_match('/^database\.default\.database\s*=\s*(.*)$/m', $envContent, $m)) $dbname = trim($m[1], " \t\n\r\0\x0B\"'");
            }
            $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            $stmt = $pdo->prepare("UPDATE totens SET ultima_captura_tela = :caminho WHERE device_id = :device_id");
            $stmt->execute(['caminho' => $caminho, 'device_id' => $device_id]);
        } catch (Exception $e) {
            // Silently fail DB update if needed, but we save the file
        }
        
        echo json_encode(["status" => "sucesso", "arquivo" => $caminho]);
    } else {
        echo json_encode(["erro" => "Falha ao salvar a imagem no servidor"]);
    }
} else {
    echo json_encode(["erro" => "Dados incompletos"]);
}
?>
