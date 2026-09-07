<?php
$_SERVER['REQUEST_METHOD'] = 'POST';
$postData = json_encode([
    'device_id' => '123456', // Replace with any valid device_id if needed, or we just bypass device check
]);
// We can't easily run Api.php directly because it's a CodeIgniter controller.
// We can use curl to hit the local server. Let's just do a PHP CLI script to read the database.
require 'backend/app/Config/Database.php';
$db = \Config\Database::connect();

// Mock device
$totem = $db->table('totens')->limit(1)->get()->getRowArray();
if (!$totem) die("No totems");

$campanhas = [];
if (!empty($totem['playlist_id'])) {
    $itensLista = $db->table('playlist_itens pi')
        ->select('c.*, pi.tempo_exibicao as tempo_exibicao_lista, pi.widget_nome, pi.ordem')
        ->join('campanhas c', 'c.id = pi.campanha_id', 'left')
        ->where('pi.playlist_id', $totem['playlist_id'])
        ->orderBy('pi.ordem', 'ASC')
        ->get()->getResultArray();

    foreach ($itensLista as $item) {
        if (!empty($item['widget_nome'])) {
            $campanhas[] = [
                'id' => intval($totem['playlist_id'] . '0' . $item['ordem']),
                'tipo_midia' => 'noticia',
                'arquivo_url' => '/widget/' . $item['widget_nome'],
                'tempo_exibicao' => $item['tempo_exibicao_lista'],
                'data_inicio' => null,
                'data_fim' => null
            ];
        } else if (!empty($item['id'])) {
            $item['tempo_exibicao'] = $item['tempo_exibicao_lista'];
            $campanhas[] = $item;
        }
    }
}

$playlist = [];
foreach ($campanhas as $c) {
    $url = '';
    if ($c['tipo_midia'] == 'noticia') {
        if (isset($c['arquivo_url'])) {
            $url = 'BASE_URL' . $c['arquivo_url'];
        } else {
            $url = 'BASE_URL' . '/widget/noticias';
        }
    } else {
        if (!empty($c['arquivo_url'])) {
            $url = $c['arquivo_url'];
        } else {
            $url = 'BASE_URL' . 'uploads/campanhas/' . $c['arquivo'];
        }
    }

    $playlist[] = [
        'id' => (int)$c['id'],
        'tipo_midia' => $c['tipo_midia'],
        'url_arquivo' => $url,
        'tempo_exibicao' => (int)$c['tempo_exibicao']
    ];
}

echo json_encode($playlist, JSON_PRETTY_PRINT);
