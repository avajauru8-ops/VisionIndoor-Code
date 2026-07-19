<?php

namespace App\Controllers;

use CodeIgniter\RESTful\ResourceController;

class Playlists extends ResourceController
{
    public function index()
    {
        try {
            $db = \Config\Database::connect();
            $user_id = $this->request->getHeaderLine('X-User-Id');
            $nivel = $this->request->getHeaderLine('X-User-Nivel');
            
            $builder = $db->table('campanhas');
            
            if ($nivel !== 'admin') {
                $builder->where('usuario_id', $user_id);
            }
            
            $playlists = $builder->get()->getResultArray();
            
            // Formata os campos
            foreach ($playlists as &$p) {
                $p['id'] = (string)$p['id'];
                $p['totem_id'] = $p['totem_id'] ? (string)$p['totem_id'] : null;
                
                // Formatar as datas para o padrão ISO que o JavaScript/React entende nativamente
                if (!empty($p['data_inicio'])) $p['data_inicio'] = str_replace(' ', 'T', $p['data_inicio']);
                if (!empty($p['data_fim'])) $p['data_fim'] = str_replace(' ', 'T', $p['data_fim']);
                
                $url = $p['arquivo_url'];
                if ($url && !preg_match('/^https?:\/\//', $url)) {
                    if (strpos($url, '/widget/') === 0) {
                        $p['arquivo_url'] = rtrim(base_url(), '/') . $url; // Rota do React Frontend
                    } else {
                        $p['arquivo_url'] = base_url('uploads/' . ltrim($url, '/'));
                    }
                }
            }
            
            return $this->respond($playlists);
        } catch (\Exception $e) {
            return $this->response->setJSON(['error' => 'Erro DB/PHP: ' . $e->getMessage()])->setStatusCode(500);
        }
    }

    private function handleFileUpload($file, $allowedExtensions)
    {
        if (!$file->isValid() || $file->hasMoved()) {
            return null;
        }
        
        $ext = '.' . $file->getExtension();
        if (!in_array(strtolower($ext), $allowedExtensions)) {
            throw new \Exception("Tipo de arquivo não permitido: $ext");
        }
        
        $newName = time() . '_' . preg_replace('/[^a-zA-Z0-9.-]/', '_', $file->getName());
        $file->move(ROOTPATH . 'public/uploads', $newName);
        
        return $newName;
    }

    public function create()
    {
        try {
            $db = \Config\Database::connect();
            $user_id = $this->request->getHeaderLine('X-User-Id');
            
            $json = $this->request->getJSON();
            
            $titulo = $json->titulo ?? $this->request->getPost('titulo');
            $tipo_midia = $json->tipo_midia ?? $this->request->getPost('tipo_midia');
            $tempo_exibicao = $json->tempo_exibicao ?? $this->request->getPost('tempo_exibicao');
            $data_inicio = $json->data_inicio ?? $this->request->getPost('data_inicio');
            $data_fim = $json->data_fim ?? $this->request->getPost('data_fim');
            $url = $json->url ?? $this->request->getPost('url');
            $totem_id = $json->totem_id ?? $this->request->getPost('totem_id');
            $arquivo_url = $json->arquivo_url ?? $this->request->getPost('arquivo_url');
            
            $finalUrl = $arquivo_url ?: $url ?: '';
            
            $file = $this->request->getFile('arquivo');
            if ($file && $file->isValid()) {
                $finalUrl = $this->handleFileUpload($file, ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.mp4', '.webm', '.avi', '.mov']);
            }
            
            if (empty($finalUrl)) {
                return $this->response->setJSON(['error' => 'Você precisa enviar um arquivo de mídia ou uma URL.'])->setStatusCode(400);
            }
            
            $tId = !empty($totem_id) ? $totem_id : null;
            $inicio = !empty($data_inicio) ? substr(str_replace('T', ' ', $data_inicio), 0, 19) : '1970-01-01 00:00:00';
            $fim = !empty($data_fim) ? substr(str_replace('T', ' ', $data_fim), 0, 19) : '2099-12-31 23:59:59';
            
            $data = [
                'usuario_id' => $user_id,
                'totem_id' => $tId,
                'titulo' => $titulo ?? '',
                'tipo_midia' => $tipo_midia ?? '',
                'tempo_exibicao' => (int)($tempo_exibicao ?? 0),
                'data_inicio' => $inicio,
                'data_fim' => $fim,
                'arquivo_url' => $finalUrl,
                'ativo' => 1
            ];
            
            $db->table('campanhas')->insert($data);
            return $this->respondCreated(['message' => 'Mídia adicionada', 'id' => (string)$db->insertID()]);
        } catch (\Exception $e) {
            return $this->response->setJSON(['error' => 'Erro DB/PHP: ' . $e->getMessage()])->setStatusCode(500);
        }
    }

    public function update($id = null)
    {
        try {
            $db = \Config\Database::connect();
            
            $json = $this->request->getJSON();
            
            $titulo = $json->titulo ?? $this->request->getPost('titulo');
            $tipo_midia = $json->tipo_midia ?? $this->request->getPost('tipo_midia');
            $tempo_exibicao = $json->tempo_exibicao ?? $this->request->getPost('tempo_exibicao');
            $data_inicio = $json->data_inicio ?? $this->request->getPost('data_inicio');
            $data_fim = $json->data_fim ?? $this->request->getPost('data_fim');
            $url = $json->url ?? $this->request->getPost('url');
            $totem_id = $json->totem_id ?? $this->request->getPost('totem_id');
            $arquivo_url = $json->arquivo_url ?? $this->request->getPost('arquivo_url');
            
            $finalUrl = $arquivo_url ?: $url ?: '';
            
            $file = $this->request->getFile('arquivo');
            if ($file && $file->isValid()) {
                $finalUrl = $this->handleFileUpload($file, ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.mp4', '.webm', '.avi', '.mov']);
            }
            
            $tId = !empty($totem_id) ? $totem_id : null;
            $inicio = !empty($data_inicio) ? substr(str_replace('T', ' ', $data_inicio), 0, 19) : '1970-01-01 00:00:00';
            $fim = !empty($data_fim) ? substr(str_replace('T', ' ', $data_fim), 0, 19) : '2099-12-31 23:59:59';
            
            $data = [
                'totem_id' => $tId,
                'titulo' => $titulo ?? '',
                'tipo_midia' => $tipo_midia ?? '',
                'tempo_exibicao' => (int)($tempo_exibicao ?? 0),
                'data_inicio' => $inicio,
                'data_fim' => $fim,
                'ativo' => $this->request->getPost('ativo') ?? 1
            ];
            
            if ($finalUrl) {
                $data['arquivo_url'] = $finalUrl;
            }
            
            $db->table('campanhas')->where('id', $id)->update($data);
            return $this->respond(['success' => true]);
        } catch (\Exception $e) {
            return $this->response->setJSON(['error' => 'Erro DB/PHP: ' . $e->getMessage()])->setStatusCode(500);
        }
    }

    public function delete($id = null)
    {
        try {
            $db = \Config\Database::connect();
            $db->table('campanhas')->where('id', $id)->delete();
            return $this->respondDeleted(['success' => true]);
        } catch (\Exception $e) {
            return $this->response->setJSON(['error' => 'Erro DB/PHP: ' . $e->getMessage()])->setStatusCode(500);
        }
    }
}
