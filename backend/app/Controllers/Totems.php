<?php

namespace App\Controllers;

use CodeIgniter\RESTful\ResourceController;

class Totems extends ResourceController
{
    public function index()
    {
        try {
            $db = \Config\Database::connect();
            $user_id = $this->request->getHeaderLine('X-User-Id');
            $nivel = $this->request->getHeaderLine('X-User-Nivel');
            
            $builder = $db->table('totens');
            
            if ($nivel !== 'admin') {
                $builder->where('usuario_id', $user_id);
            }
            
            $totens = $builder->get()->getResultArray();
            
            foreach ($totens as &$t) {
                $t['id'] = (string)$t['id'];
            }
            
            return $this->respond($totens);
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
            
            $builder = $db->table('totens')->where('id', $id);
            if ($nivel !== 'admin') {
                $builder->where('usuario_id', $user_id);
            }
            
            $totem = $builder->get()->getRowArray();
            if (!$totem) {
                return $this->response->setJSON(['error' => 'Totem não encontrado'])->setStatusCode(404);
            }
            
            $totem['id'] = (string)$totem['id'];
            return $this->respond($totem);
        } catch (\Exception $e) {
            return $this->response->setJSON(['error' => 'Erro DB/PHP: ' . $e->getMessage()])->setStatusCode(500);
        }
    }

    public function create()
    {
        try {
            $json = $this->request->getJSON();
            $db = \Config\Database::connect();
            $user_id = $this->request->getHeaderLine('X-User-Id');
            
            // Limit Check
            $user = $db->table('usuarios')->where('id', $user_id)->get()->getRowArray();
            if (!$user) {
                return $this->response->setJSON(['error' => 'Usuário não encontrado'])->setStatusCode(404);
            }
            
            $totens_count = $db->table('totens')->where('usuario_id', $user_id)->countAllResults();
            $plano = $user['plano'] ?? 'gratis';
            $limite = (int)($user['limite_tvs'] ?? 1);
            
            if ($plano === 'gratis' && $totens_count >= 1) {
                return $this->response->setJSON(['error' => 'Limite de TVs atingindo', 'code' => 'LIMIT_REACHED'])->setStatusCode(403);
            }
            if ($plano === 'pago' && $totens_count >= $limite) {
                return $this->response->setJSON(['error' => 'Limite de TVs atingindo', 'code' => 'LIMIT_REACHED'])->setStatusCode(403);
            }
            
            $nome = $json->nome ?? '';
            if (empty($nome)) {
                $nome = 'TV - ' . date('d/m/Y');
            }

            $data = [
                'nome' => $nome,
                'device_id' => $json->device_id ?? '',
                'usuario_id' => $user_id,
                'status' => 'offline'
            ];
            
            $db->table('totens')->insert($data);
            return $this->respondCreated(['id' => (string)$db->insertID()]);
        } catch (\Exception $e) {
            return $this->response->setJSON(['error' => 'Erro DB/PHP: ' . $e->getMessage()])->setStatusCode(500);
        }
    }

    public function update($id = null)
    {
        try {
            $json = $this->request->getJSON();
            $db = \Config\Database::connect();
            
            $data = [];
            if (isset($json->nome)) $data['nome'] = $json->nome;
            if (isset($json->device_id)) $data['device_id'] = $json->device_id;
            if (isset($json->status)) $data['status'] = $json->status;
            if (isset($json->auto_iniciar)) $data['auto_iniciar'] = $json->auto_iniciar ? 1 : 0;
            
            if (!empty($data)) {
                $db->table('totens')->where('id', $id)->update($data);
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
            $db->table('totens')->where('id', $id)->delete();
            return $this->respondDeleted(['id' => $id]);
        } catch (\Exception $e) {
            return $this->response->setJSON(['error' => 'Erro DB/PHP: ' . $e->getMessage()])->setStatusCode(500);
        }
    }
}
