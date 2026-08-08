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

    public function blobUpload()
    {
        return $this->respond(['error' => 'Blob upload via API descontinuado. Use o upload do CodeIgniter.'], 400);
    }

    public function getPlaylist()
    {
        try {
            $db = \Config\Database::connect();
            
            $device_id = $this->request->getGetPost('device_id');
            $code = $this->request->getGetPost('code');
            
            $builder = $db->table('totens');
            
            if (!empty($device_id)) {
                $builder->where('device_id', $device_id);
            } else {
                return $this->respond(['erro' => 'Identificador do dispositivo nao fornecido.']);
            }
            
            $totem = $builder->get()->getRowArray();
            
            if (!$totem) {
                return $this->respond([
                    'erro' => 'Dispositivo nao autorizado.',
                    'device_id' => $device_id,
                    'mensagem' => 'Cadastre este ID de dispositivo no seu painel de controle.'
                ]);
            }
            
            // Atualiza ultima_sincronizacao
            $db->table('totens')->where('id', $totem['id'])->update(['ultima_sincronizacao' => date('Y-m-d H:i:s'), 'status' => 'online']);
            
            // Verifica licença do usuário
            $user = $db->table('usuarios')->where('id', $totem['usuario_id'])->get()->getRowArray();
            if (!$user || $user['status_licenca'] !== 'ativa') {
                return $this->respond(['erro' => 'Licença expirada ou inativa']);
            }
            
            if ($user['validade_licenca'] && strtotime($user['validade_licenca']) < time()) {
                 return $this->respond(['erro' => 'Licença expirada ou inativa']);
            }
            
            // Verifica campanhas ativas
            $now = date('Y-m-d H:i:s');
            
            $campanhas = $db->table('campanhas')
                ->select('campanhas.*')
                ->join('usuarios', 'usuarios.id = campanhas.usuario_id', 'left')
                ->groupStart()
                    // Mídias atribuídas especificamente a este totem (pelo dono ou por um admin)
                    ->groupStart()
                        ->where('campanhas.totem_id', $totem['id'])
                        ->groupStart()
                            ->where('campanhas.usuario_id', $user['id'])
                            ->orWhere('usuarios.nivel', 'admin')
                        ->groupEnd()
                    ->groupEnd()
                    // OU Mídias globais do dono do totem
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
                
            $playlist = [];
            foreach ($campanhas as $c) {
                if ($c['data_inicio'] && $c['data_inicio'] > $now) continue;
                if ($c['data_fim'] && $c['data_fim'] < $now) continue;
                
                $url = $c['arquivo_url'];
                if (empty($url)) continue; // Evita quebrar o app Android com mídia vazia
                
                if ($url && !preg_match('/^https?:\/\//', $url)) {
                    if (strpos($url, '/widget/') === 0) {
                        $url = rtrim(base_url(), '/') . $url; // Rota do React Frontend
                    } else {
                        $url = base_url('uploads/' . ltrim($url, '/')); // Imagem/Vídeo
                    }
                }
                
                $playlist[] = [
                    'id' => (int)$c['id'], // Cast para inteiro, o Android exige Integer
                    'tipo_midia' => $c['tipo_midia'],
                    'url_arquivo' => $url,
                    'tempo_exibicao' => (int)$c['tempo_exibicao']
                ];
            }
            
            return $this->respond([
                'totem_id' => $device_id,
                'auto_iniciar' => isset($totem['auto_iniciar']) ? (bool)$totem['auto_iniciar'] : false,
                'playlist' => $playlist
            ]);
        } catch (\Exception $e) {
            return $this->respond(['erro' => 'Erro interno: ' . $e->getMessage()]);
        }
    }

    public function clima()
    {
        $cidade = $this->request->getGet('cidade');
        $estado = $this->request->getGet('estado');
        
        if (!$cidade || !$estado) {
            return $this->fail('Cidade ou estado não fornecidos', 400);
        }

        try {
            $db = \Config\Database::connect();
            $config = $db->table('configuracoes_admin')->get()->getRowArray();
            $apiKey = $config ? $config['openweather_api_key'] : null;

            if (empty($apiKey)) {
                return $this->fail('Chave de API do OpenWeather não configurada no painel', 500);
            }

            // Step 1: OpenWeather 2.5 API
            $weatherUrl = "https://api.openweathermap.org/data/2.5/weather?q=" . urlencode($cidade) . "," . urlencode($estado) . ",BR&units=metric&lang=pt_br&appid=" . $apiKey;
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

            return $this->respond([
                'temp' => round($weatherData['main']['temp']),
                'condition' => $condition,
                'humidity' => $weatherData['main']['humidity'] . '%',
                'wind' => round($weatherData['wind']['speed'] * 3.6) . ' km/h', // m/s to km/h
                'isDay' => $isDay
            ]);

        } catch (\Exception $e) {
            return $this->fail('Erro interno: ' . $e->getMessage(), 500);
        }
    }

    public function loteria()
    {
        $tipo = $this->request->getGet('tipo') ?? 'megasena';
        
        $urls = [
            'lotofacil' => 'https://servicebus2.caixa.gov.br/portaldeloterias/api/lotofacil',
            'megasena' => 'https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena',
            'quina' => 'https://servicebus2.caixa.gov.br/portaldeloterias/api/quina'
        ];

        if (!array_key_exists($tipo, $urls)) {
            return $this->fail('Tipo de loteria inválido', 400);
        }

        try {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $urls[$tipo]);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            // Caixa API often blocks default curl user agents, let's use a standard browser agent
            curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

            if ($httpCode !== 200 || !$response) {
                return $this->fail('Erro ao buscar dados da Caixa', 500);
            }

            return $this->response->setJSON(json_decode($response));
        } catch (\Exception $e) {
            return $this->fail('Erro interno: ' . $e->getMessage(), 500);
        }
    }

    public function rssUol()
    {
        $feed = $this->request->getGet('feed') ?: 'noticias';
        
        // Allowed feeds to prevent SSRF
        $allowed = ['noticias', 'esporte', 'economia', 'entretenimento', 'tecnologia', 'jogos', 'carros', 'educacao', 'universa', 'tilt', 'vivabem', 'ecoa', 'nossauol'];
        if (!in_array($feed, $allowed)) {
            $feed = 'noticias';
        }

        $url = "https://rss.uol.com.br/feed/{$feed}.xml";
        $xml = @file_get_contents($url);
        
        if (!$xml) {
            return $this->fail('Erro ao buscar RSS', 500);
        }
        
        return $this->response->setContentType('text/xml')->setBody($xml);
    }
}
