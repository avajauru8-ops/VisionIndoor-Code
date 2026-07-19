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
                ->where('usuario_id', $user['id'])
                ->groupStart()
                    ->where('totem_id', $totem['id'])
                    ->orWhere('totem_id', null)
                    ->orWhere('totem_id', 0)
                ->groupEnd()
                ->where('ativo', 1)
                ->get()->getResultArray();
                
            $playlist = [];
            foreach ($campanhas as $c) {
                if ($c['data_inicio'] && $c['data_inicio'] > $now) continue;
                if ($c['data_fim'] && $c['data_fim'] < $now) continue;
                
                $url = $c['arquivo_url'];
                if (empty($url)) continue; // Evita quebrar o app Android com mídia vazia
                
                if ($url && !preg_match('/^https?:\/\//', $url)) {
                    $url = base_url('uploads/' . ltrim($url, '/'));
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
                'playlist' => $playlist
            ]);
        } catch (\Exception $e) {
            return $this->respond(['erro' => 'Erro interno: ' . $e->getMessage()]);
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
            curl_close($ch);

            if ($httpCode !== 200 || !$response) {
                return $this->fail('Erro ao buscar dados da Caixa', 500);
            }

            return $this->response->setJSON($response);
        } catch (\Exception $e) {
            return $this->fail('Erro interno: ' . $e->getMessage(), 500);
        }
    }
}
