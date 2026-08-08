<?php
// api_upload_print.php
header('Content-Type: application/json');

// Recebe os dados brutos (O Android envia via Payload Body JSON)
$data = json_decode(file_get_contents('php://input'), true);

if (isset($data['device_id']) && isset($data['imagem_base64'])) {
    
    $device_id = $data['device_id'];
    $base64 = $data['imagem_base64'];

    // Decodifica a imagem Base64
    $imagem_decodificada = base64_decode($base64);
    
    // Nome do arquivo com base no ID da TV e na data
    $nome_arquivo = 'print_' . $device_id . '_' . time() . '.jpg';
    
    // Salva na pasta (garanta que a pasta "prints" exista e tenha permissão de escrita/CHMOD 777)
    if (!is_dir('prints')) {
        mkdir('prints', 0777, true);
    }
    
    $caminho = 'prints/' . $nome_arquivo;
    
    // Cria fisicamente a imagem .jpg no servidor
    file_put_contents($caminho, $imagem_decodificada);
    
    // Aqui você também pode fazer um UPDATE no seu banco de dados 
    // para salvar a URL desse print ($caminho) no cadastro deste totem específico!
    
    echo json_encode(["status" => "sucesso", "arquivo" => $caminho]);
} else {
    echo json_encode(["erro" => "Dados incompletos"]);
}
?>
