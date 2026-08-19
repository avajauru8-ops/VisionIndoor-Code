<?php

namespace App\Controllers;

use CodeIgniter\RESTful\ResourceController;

class Api extends ResourceController
{
    public function config()
    {
        try {
            $db = \Config\Database::connect();
            $config = $db->table('configuracoes_admin')->get()->getRowArray();
            return $this->respond($config ?: []);
        } catch (\Exception $e) {
            return $this->response->setJSON(['error' => $e->getMessage()])->setStatusCode(500);
        }
    }

    public function migrateNow()
    {
        try {
            $db = \Config\Database::connect();
            // Existing ones for status support
            $db->query("ALTER TABLE totens MODIFY COLUMN status VARCHAR(255) DEFAULT 'offline'");
            $db->query("ALTER TABLE totens MODIFY COLUMN ultima_informacao VARCHAR(255) DEFAULT NULL");
            $db->query("ALTER TABLE totens MODIFY COLUMN versao_app VARCHAR(100) DEFAULT NULL");
            $db->query("ALTER TABLE totens MODIFY COLUMN sistema_operacional VARCHAR(100) DEFAULT NULL");
            $db->query("ALTER TABLE totens MODIFY COLUMN resolucao VARCHAR(50) DEFAULT NULL");
            
            // New columns for "Extras" tab and Commands
            $columns = [
                'iniciar_tv_energia' => "BOOLEAN DEFAULT FALSE",
                'fuso_horario' => "VARCHAR(100) DEFAULT 'America/Sao_Paulo'",
                'exibir_barra_tarefas' => "BOOLEAN DEFAULT TRUE",
                'audio_ligado' => "BOOLEAN DEFAULT TRUE",
                'auto_reiniciar_horas' => "INT DEFAULT 0",
                'exibir_notificacoes' => "BOOLEAN DEFAULT FALSE",
                'limpeza_automatica' => "BOOLEAN DEFAULT TRUE",
                'tempo_exibicao_padrao' => "INT DEFAULT 10",
                'id_monetizacao' => "VARCHAR(150) DEFAULT NULL",
                'comando_acao' => "VARCHAR(100) DEFAULT NULL",
                'comando_id' => "VARCHAR(100) DEFAULT NULL",
                'data_hora_tv' => "VARCHAR(100) DEFAULT NULL",
                'horario_inicio' => "VARCHAR(100) DEFAULT NULL",
                'horario_fim' => "VARCHAR(100) DEFAULT NULL"
            ];
            
            $errors = [];
            foreach ($columns as $col => $def) {
                try {
                    $db->query("ALTER TABLE totens ADD COLUMN {$col} {$def}");
                } catch (\Exception $e) {
                    $errors[] = $col . ": " . $e->getMessage();
                }
            }
            
            if (count($errors) > 0) {
                return $this->respond(['success' => false, 'errors' => $errors]);
            }
            return $this->respond(['success' => true, 'msg' => 'Todas as colunas extras foram atualizadas/criadas na produção!']);
        } catch (\Exception $e) {
            return $this->response->setJSON(['error' => $e->getMessage()])->setStatusCode(500);
        }
    }

    public function blobUpload()
    {
        return $this->respond(['error' => 'Blob upload via API descontinuado. Use o upload do CodeIgniter.'], 400);
    }

    public function getPlaylist()
    {
        try {
            $db = \Config\Database::connect();
            
            // 1. LÊ OS DADOS EM JSON ENVIADOS PELO APP ANDROID
            $jsonRecebido = $this->request->getJSON(true);
            
            // Pega o device_id (prioriza o JSON novo, mas aceita o GET/POST antigo por segurança)
            $device_id = $jsonRecebido['device_id'] ?? $this->request->getGetPost('device_id');
            
            if (empty($device_id)) {
                return $this->respond(['erro' => 'Identificador do dispositivo nao fornecido.']);
            }
            
            $builder = $db->table('totens');
            $totem = $builder->where('device_id', $device_id)->get()->getRowArray();
            
            if (!$totem) {
                return $this->respond([
                    'erro' => 'Dispositivo nao autorizado.',
                    'device_id' => $device_id,
                    'mensagem' => 'Cadastre este ID de dispositivo no seu painel de controle.'
                ]);
            }
            
            // ========================================================
            // 2. ATUALIZA INFORMAÇÕES DE HARDWARE E STATUS DA TV
            // ========================================================
            $updateData = [
                'ultima_sincronizacao' => date('Y-m-d H:i:s')
                // Removi a tag "status => online" bruta daqui para usar a inteligente abaixo
            ];
            
            if (isset($jsonRecebido['widget_status'])) {
                $updateData['ultima_informacao'] = $jsonRecebido['widget_status'];
                $db->table('totens')->where('id', $totem['id'])->update($updateData);
                return $this->respond(['success' => true]);
            }
            
            if (isset($jsonRecebido['info'])) {
                // Pega a cor principal enviada pelo app (Verde ou Amarelo)
                $updateData['status'] = $jsonRecebido['status_operacional'] ?? 'FUNCIONANDO CORRETAMENTE';
                
                // Dados detalhados de Hardware e Ação
                $updateData['ultima_informacao'] = $jsonRecebido['status_atual'] ?? null;
                $updateData['versao_app'] = $jsonRecebido['info']['versao_app'] ?? null;
                $updateData['sistema_operacional'] = $jsonRecebido['info']['sistema_operacional'] ?? null;
                $updateData['resolucao'] = $jsonRecebido['info']['resolucao'] ?? null;
                $updateData['espaco_utilizado'] = $jsonRecebido['info']['espaco_usado'] ?? null;
                $updateData['espaco_livre'] = $jsonRecebido['info']['espaco_livre'] ?? null;
                $updateData['data_hora_tv'] = $jsonRecebido['info']['data_hora'] ?? null;
            } else {
                // Suporte legado
                $updateData['status'] = 'FUNCIONANDO CORRETAMENTE';
                
                $versao_app = $this->request->getGetPost('versao_app');
                $sistema_operacional = $this->request->getGetPost('sistema_operacional');
                $resolucao = $this->request->getGetPost('resolucao');
                $espaco_utilizado = $this->request->getGetPost('espaco_utilizado');
                $espaco_livre = $this->request->getGetPost('espaco_livre');
                
                if ($versao_app !== null) $updateData['versao_app'] = $versao_app;
                if ($sistema_operacional !== null) $updateData['sistema_operacional'] = $sistema_operacional;
                if ($resolucao !== null) $updateData['resolucao'] = $resolucao;
                if ($espaco_utilizado !== null) $updateData['espaco_utilizado'] = $espaco_utilizado;
                if ($espaco_livre !== null) $updateData['espaco_livre'] = $espaco_livre;
            }
            
            // Salva no banco de dados
            $db->table('totens')->where('id', $totem['id'])->update($updateData);
            
            // ========================================================
            // 3. VERIFICAÇÃO DE LICENÇA
            // ========================================================
            $user = $db->table('usuarios')->where('id', $totem['usuario_id'])->get()->getRowArray();
            if (!$user || $user['status_licenca'] !== 'ativa') {
                return $this->respond(['erro' => 'Licença expirada ou inativa']);
            }
            
            if ($user['validade_licenca'] && strtotime($user['validade_licenca']) < time()) {
                 return $this->respond(['erro' => 'Licença expirada ou inativa']);
            }
            
            // ========================================================
            // 4. PREPARA COMANDOS REMOTOS (Se houver no banco)
            // ========================================================
            $comando_remoto = null;
            // Se houver uma coluna 'comando_acao' preenchida no BD, envia para a TV
            if (!empty($totem['comando_acao'])) {
                $comando_remoto = [
                    'id' => $totem['comando_id'] ?? (string)time(), // Envia o ID ou um timestamp
                    'acao' => $totem['comando_acao']
                ];
                
                // Limpa o comando do banco logo após enviar para evitar loop de reinicialização
                $db->table('totens')->where('id', $totem['id'])->update(['comando_acao' => null, 'comando_id' => null]);
            }
            
            // ========================================================
            // 5. PROCESSA CAMPANHAS E PLAYLIST
            // ========================================================
            $now = date('Y-m-d H:i:s');
            
            $campanhas = [];

            if (!empty($totem['playlist_id'])) {
                // Novo modelo: Traz os itens da Lista de Reprodução, mantendo a ordem
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
                    } else if (!empty($item['id'])) { // Is valid campaign
                        $item['tempo_exibicao'] = $item['tempo_exibicao_lista'];
                        $campanhas[] = $item;
                    }
                }
            } else {
                // Modelo Antigo (Fallback)
                $campanhas = $db->table('campanhas')
                    ->select('campanhas.*')
                    ->join('usuarios', 'usuarios.id = campanhas.usuario_id', 'left')
                    ->groupStart()
                        ->groupStart()
                            ->where('campanhas.totem_id', $totem['id'])
                            ->groupStart()
                                ->where('campanhas.usuario_id', $user['id'])
                                ->orWhere('usuarios.nivel', 'admin')
                            ->groupEnd()
                        ->groupEnd()
                        ->orGroupStart()
                            ->where('campanhas.usuario_id', $user['id'])
                            ->groupStart()
                                ->where('campanhas.totem_id', null)
                                ->orWhere('campanhas.totem_id', 0)
                            ->groupEnd()
                        ->groupEnd()
                    ->groupEnd()
                    ->where('campanhas.ativo', 1)
                    ->get()->getResultArray();
            }
                
            $playlist = [];
            foreach ($campanhas as $c) {
                if ($c['data_inicio'] && $c['data_inicio'] > $now) continue;
                if ($c['data_fim'] && $c['data_fim'] < $now) continue;
                
                $url = $c['arquivo_url'];
                if (empty($url)) continue;
                
                if ($url && !preg_match('/^https?:\/\//', $url)) {
                    if (strpos($url, '/widget/') === 0) {
                        $separator = (strpos($url, '?') !== false) ? '&' : '?';
                        $url = rtrim(base_url(), '/') . $url . $separator . 'device_id=' . urlencode($device_id);
                    } else {
                        $url = base_url('uploads/' . ltrim($url, '/'));
                    }
                }
                
                $playlist[] = [
                    'id' => (int)$c['id'],
                    'tipo_midia' => $c['tipo_midia'],
                    'url_arquivo' => $url,
                    'tempo_exibicao' => (int)$c['tempo_exibicao']
                ];
            }
            
            // ========================================================
            // 6. RETORNO FINAL DA API (JSON)
            // ========================================================
            $resposta = [
                'totem_id' => $device_id,
                'rotacao' => $totem['rotacao'] ?? 'padrao',
                'auto_iniciar' => isset($totem['auto_iniciar']) ? (bool)$totem['auto_iniciar'] : false,
                'iniciar_tv_energia' => isset($totem['iniciar_tv_energia']) ? (bool)$totem['iniciar_tv_energia'] : false,
                'fuso_horario' => $totem['fuso_horario'] ?? 'America/Sao_Paulo',
                'exibir_barra_tarefas' => isset($totem['exibir_barra_tarefas']) ? (bool)$totem['exibir_barra_tarefas'] : true,
                'audio_ligado' => isset($totem['audio_ligado']) ? (bool)$totem['audio_ligado'] : true,
                'auto_reiniciar_horas' => isset($totem['auto_reiniciar_horas']) ? (int)$totem['auto_reiniciar_horas'] : 0,
                'exibir_notificacoes' => isset($totem['exibir_notificacoes']) ? (bool)$totem['exibir_notificacoes'] : false,
                'limpeza_automatica' => isset($totem['limpeza_automatica']) ? (bool)$totem['limpeza_automatica'] : true,
                'tempo_exibicao_padrao' => isset($totem['tempo_exibicao_padrao']) ? (int)$totem['tempo_exibicao_padrao'] : 10,
                'horario_inicio' => $totem['horario_inicio'] ?? null,
                'horario_fim' => $totem['horario_fim'] ?? null,
                'id_monetizacao' => $totem['id_monetizacao'] ?? null,
                'playlist' => $playlist
            ];
            
            // Insere o comando na resposta apenas se houver um pendente
            if ($comando_remoto !== null) {
                $resposta['comando_remoto'] = $comando_remoto;
            }
            
            return $this->respond($resposta);
            
        } catch (\Exception $e) {
            return $this->respond(['erro' => 'Erro interno: ' . $e->getMessage()]);
        }
    }

    private function checkWidgetStatus($identificador)
    {
        try {
            $db = \Config\Database::connect();
            $query = $db->query("SHOW TABLES LIKE 'widgets'");
            if (!$query->getRow()) return null; // Tabelas de widget não existem, continua normal
            
            $widget = $db->table('widgets')->where('identificador', $identificador)->get()->getRowArray();
            if ($widget) {
                if (!$widget['ativo']) {
                    return $this->fail('Widget desativado', 403);
                }
                if ($widget['em_manutencao']) {
                    return $this->fail('Widget em manutenção', 503);
                }
            }
            return $widget;
        } catch (\Exception $e) {
            return null; // Ignore DB errors during migration
        }
    }

    public function clima()
    {
        $widgetCheck = $this->checkWidgetStatus('clima');
        if ($widgetCheck instanceof \CodeIgniter\HTTP\ResponseInterface) return $widgetCheck;

        $cidade = $this->request->getGet('cidade');
        $estado = $this->request->getGet('estado');
        
        if (!$cidade || !$estado) {
            return $this->fail('Cidade ou estado não fornecidos', 400);
        }

        try {
            $apiKey = null;
            if ($widgetCheck && !empty($widgetCheck['api_key'])) {
                $apiKey = $widgetCheck['api_key'];
            }
            $apiUrl = ($widgetCheck && !empty($widgetCheck['api_url'])) ? $widgetCheck['api_url'] : "https://api.openweathermap.org/data/2.5/weather";

            if (empty($apiKey)) {
                return $this->fail('Chave de API do OpenWeather não configurada na Gestão de Widgets', 500);
            }

            // Step 1: OpenWeather 2.5 API
            $weatherUrl = $apiUrl . "?q=" . urlencode($cidade) . "," . urlencode($estado) . ",BR&units=metric&lang=pt_br&appid=" . $apiKey;
            $weatherRes = @file_get_contents($weatherUrl);
            
            if (!$weatherRes) {
                return $this->fail('Erro ao consultar OpenWeather API (2.5). Verifique sua chave de API.', 500);
            }
            
            $weatherData = json_decode($weatherRes, true);
            
            if (isset($weatherData['cod']) && $weatherData['cod'] != 200) {
                return $this->fail('Erro OpenWeather: ' . ($weatherData['message'] ?? 'Desconhecido'), 500);
            }
            
            // Map OpenWeather conditions to our Widget conditions
            $id = $weatherData['weather'][0]['id'] ?? 800;
            $icon = $weatherData['weather'][0]['icon'] ?? '01d';
            $isDay = strpos($icon, 'd') !== false ? 1 : 0;
            
            $condition = 'Estável';
            if ($id >= 200 && $id < 600) {
                $condition = 'Chuvoso';
            } else if ($id == 800) {
                $condition = $isDay ? 'Ensolarado' : 'Noite Clara';
            } else if ($id > 800) {
                $condition = 'Nublado';
            }

            $description = ucfirst($weatherData['weather'][0]['description'] ?? '');
            $feels_like = round($weatherData['main']['feels_like'] ?? $weatherData['main']['temp']);
            
            $timezone_offset = $weatherData['timezone'] ?? -10800; // default to GMT-3 se nao existir
            $sunrise_ts = ($weatherData['sys']['sunrise'] ?? time()) + $timezone_offset;
            $sunset_ts = ($weatherData['sys']['sunset'] ?? time()) + $timezone_offset;
            $sunrise = gmdate('H:i', $sunrise_ts);
            $sunset = gmdate('H:i', $sunset_ts);
            $clouds = ($weatherData['clouds']['all'] ?? 0) . '%';

            return $this->respond([
                'temp' => round($weatherData['main']['temp']),
                'condition' => $condition,
                'description' => $description,
                'humidity' => $weatherData['main']['humidity'] . '%',
                'wind' => round($weatherData['wind']['speed'] * 3.6) . ' km/h', // m/s to km/h
                'isDay' => $isDay,
                'feels_like' => $feels_like,
                'sunrise' => $sunrise,
                'sunset' => $sunset,
                'clouds' => $clouds,
                'icon_id' => $icon
            ]);

        } catch (\Exception $e) {
            return $this->fail('Erro interno: ' . $e->getMessage(), 500);
        }
    }

    public function loteria()
    {
        $widgetCheck = $this->checkWidgetStatus('loteria');
        if ($widgetCheck instanceof \CodeIgniter\HTTP\ResponseInterface) return $widgetCheck;

        $tipo = $this->request->getGet('tipo') ?? 'megasena';
        
        $baseUrl = ($widgetCheck && !empty($widgetCheck['api_url'])) ? $widgetCheck['api_url'] : 'https://servicebus2.caixa.gov.br/portaldeloterias/api';
        
        $urls = [
            'lotofacil' => $baseUrl . '/lotofacil',
            'megasena' => $baseUrl . '/megasena',
            'quina' => $baseUrl . '/quina'
        ];

        if (!array_key_exists($tipo, $urls)) {
            return $this->fail('Tipo de loteria inválido', 400);
        }

        $cacheFile = sys_get_temp_dir() . '/loteria_' . $tipo . '.json';
        $cacheMaxAge = 3600;

        if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheMaxAge) {
            $cached = json_decode(file_get_contents($cacheFile), true);
            if ($cached) {
                return $this->response->setJSON($cached);
            }
        }

        try {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $urls[$tipo]);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            curl_setopt($ch, CURLOPT_TIMEOUT, 5);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode !== 200 || !$response) {
                if (file_exists($cacheFile)) {
                    return $this->response->setJSON(json_decode(file_get_contents($cacheFile), true));
                }
                return $this->fail('Erro ao buscar dados da Caixa', 500);
            }

            $data = json_decode($response);
            if ($data) {
                @file_put_contents($cacheFile, $response);
            }
            return $this->response->setJSON($data);
        } catch (\Exception $e) {
            if (file_exists($cacheFile)) {
                return $this->response->setJSON(json_decode(file_get_contents($cacheFile), true));
            }
            return $this->fail('Erro interno: ' . $e->getMessage(), 500);
        }
    }

    public function rssUol()
    {
        $widgetCheck = $this->checkWidgetStatus('noticias');
        if ($widgetCheck instanceof \CodeIgniter\HTTP\ResponseInterface) return $widgetCheck;

        $feed = $this->request->getGet('feed') ?: 'noticias';
        
        // Allowed feeds to prevent SSRF
        $allowed = ['noticias', 'esporte', 'economia', 'entretenimento', 'tecnologia', 'jogos', 'carros', 'educacao', 'universa', 'tilt', 'vivabem', 'ecoa', 'nossauol'];
        if (!in_array($feed, $allowed)) {
            $feed = 'noticias';
        }

        $baseUrl = ($widgetCheck && !empty($widgetCheck['api_url'])) ? $widgetCheck['api_url'] : 'https://rss.uol.com.br/feed';
        $url = rtrim($baseUrl, '/') . "/{$feed}.xml";
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        
        $xml = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        
        if ($httpCode !== 200 || !$xml) {
            return $this->fail('Erro ao buscar RSS', 500);
        }
        
        return $this->response->setContentType('text/xml')->setBody($xml);
    }

    public function generateId()
    {
        try {
            $db = \Config\Database::connect();
            $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            $length = 6;
            $isUnique = false;
            $deviceId = '';
            
            while (!$isUnique) {
                $deviceId = '';
                for ($i = 0; $i < $length; $i++) {
                    $deviceId .= $chars[rand(0, strlen($chars) - 1)];
                }
                $count = $db->table('totens')->where('device_id', $deviceId)->countAllResults();
                if ($count === 0) {
                    $isUnique = true;
                }
            }
            
            return $this->respond(['device_id' => $deviceId]);
        } catch (\Exception $e) {
            return $this->response->setJSON(['error' => $e->getMessage()])->setStatusCode(500);
        }
    }

    public function ogImage()
    {
        $url = $this->request->getGet('url');
        if (!$url) return $this->fail('URL não fornecida', 400);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        
        $html = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200 || !$html) {
             return $this->respond(['image' => null]);
        }

        if (preg_match('/<meta[^>]+property=[\'"]og:image[\'"][^>]+content=[\'"]([^\'"]+)[\'"]/i', $html, $matches) || 
            preg_match('/<meta[^>]+content=[\'"]([^\'"]+)[\'"][^>]+property=[\'"]og:image[\'"]/i', $html, $matches)) {
             return $this->respond(['image' => $matches[1]]);
        }

        return $this->respond(['image' => null]);
    }
}
