<?php

namespace App\Controllers;

use CodeIgniter\RESTful\ResourceController;

class Listas extends ResourceController
{
    public function index()
    {
        try {
            $db = \Config\Database::connect();
            $user_id = $this->request->getHeaderLine('X-User-Id');
            $nivel = $this->request->getHeaderLine('X-User-Nivel');
            
            $builder = $db->table('playlists p');
            $builder->select('p.*, COUNT(DISTINCT t.id) as totens_vinculados, GROUP_CONCAT(DISTINCT t.nome SEPARATOR \'||\') as totens_nomes, SUM(pi.tempo_exibicao) as tempo_total');
            $builder->join('totens t', 't.playlist_id = p.id', 'left');
            $builder->join('playlist_itens pi', 'pi.playlist_id = p.id', 'left');
            
            if ($nivel !== 'admin') {
                $builder->where('p.usuario_id', $user_id);
            }
            
            $builder->groupBy('p.id');
            $playlists = $builder->get()->getResultArray();
            
            // Casts
            foreach ($playlists as &$p) {
                $p['id'] = (string)$p['id'];
                $p['totens_vinculados'] = (int)$p['totens_vinculados'];
                $p['tempo_total'] = (int)$p['tempo_total'];
            }
            
            return $this->respond($playlists);
        } catch (\Exception $e) {
            return $this->response->setJSON(['error' => 'Erro DB/PHP: ' . $e->getMessage()])->setStatusCode(500);
        }
    }

    public function show($id = null)
    {
        try {
            $db = \Config\Database::connect();
            $user_id = $this->request->getHeaderLine('X-User-Id');
            $nivel = $this->request->getHeaderLine('X-User-Nivel');
            
            $playlist = $db->table('playlists')->where('id', $id)->get()->getRowArray();
            
            if (!$playlist) {
                return $this->failNotFound('Lista não encontrada');
            }
            
            if ($nivel !== 'admin' && $playlist['usuario_id'] != $user_id) {
                return $this->failForbidden('Acesso negado');
            }
            
            $itens = $db->table('playlist_itens pi')
                ->select('pi.*, c.titulo as arquivo_titulo, c.tipo_midia, c.arquivo_url')
                ->join('campanhas c', 'c.id = pi.campanha_id', 'left')
                ->where('pi.playlist_id', $id)
                ->orderBy('pi.ordem', 'ASC')
                ->get()->getResultArray();
                
            // Format item urls
            foreach($itens as &$item) {
                if ($item['arquivo_url']) {
                     if (!preg_match('/^https?:\/\//', $item['arquivo_url'])) {
                        $item['arquivo_url'] = base_url('uploads/' . ltrim($item['arquivo_url'], '/'));
                     }
                }
            }
                
            $playlist['itens'] = $itens;
            return $this->respond($playlist);
        } catch (\Exception $e) {
            return $this->response->setJSON(['error' => 'Erro DB/PHP: ' . $e->getMessage()])->setStatusCode(500);
        }
    }

    public function create()
    {
        try {
            $db = \Config\Database::connect();
            $user_id = $this->request->getHeaderLine('X-User-Id');
            
            $json = $this->request->getJSON();
            if (empty($json->nome)) {
                return $this->failValidationErrors('Nome da lista é obrigatório');
            }
            
            $db->table('playlists')->insert([
                'usuario_id' => $user_id,
                'nome' => $json->nome
            ]);
            
            return $this->respondCreated(['id' => (string)$db->insertID(), 'message' => 'Lista criada']);
        } catch (\Exception $e) {
            return $this->response->setJSON(['error' => 'Erro DB/PHP: ' . $e->getMessage()])->setStatusCode(500);
        }
    }

    public function update($id = null)
    {
        try {
            $db = \Config\Database::connect();
            $json = $this->request->getJSON();
            
            $db->transStart();
            
            if (isset($json->nome)) {
                $db->table('playlists')->where('id', $id)->update(['nome' => $json->nome]);
            }
            
            if (isset($json->itens) && is_array($json->itens)) {
                // Remove existing items
                $db->table('playlist_itens')->where('playlist_id', $id)->delete();
                
                // Insert new items
                foreach ($json->itens as $index => $item) {
                    $db->table('playlist_itens')->insert([
                        'playlist_id' => $id,
                        'campanha_id' => isset($item->campanha_id) ? $item->campanha_id : null,
                        'widget_nome' => isset($item->widget_nome) ? $item->widget_nome : null,
                        'tempo_exibicao' => isset($item->tempo_exibicao) ? $item->tempo_exibicao : 15,
                        'ordem' => $index + 1
                    ]);
                }
            }
            
            $db->transComplete();
            
            if ($db->transStatus() === false) {
                return $this->fail('Erro ao salvar itens da lista');
            }
            
            return $this->respond(['success' => true]);
        } catch (\Exception $e) {
            return $this->response->setJSON(['error' => 'Erro DB/PHP: ' . $e->getMessage()])->setStatusCode(500);
        }
    }

    public function delete($id = null)
    {
        try {
            $db = \Config\Database::connect();
            $db->table('playlists')->where('id', $id)->delete();
            $db->table('playlist_itens')->where('playlist_id', $id)->delete();
            $db->table('totens')->where('playlist_id', $id)->update(['playlist_id' => null]);
            return $this->respondDeleted(['success' => true]);
        } catch (\Exception $e) {
            return $this->response->setJSON(['error' => 'Erro DB/PHP: ' . $e->getMessage()])->setStatusCode(500);
        }
    }
}
