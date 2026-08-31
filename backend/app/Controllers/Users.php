<?php

namespace App\Controllers;

use CodeIgniter\RESTful\ResourceController;

class Users extends ResourceController
{
    public function index()
    {
        try {
            $db = \Config\Database::connect();
            $builder = $db->table('usuarios');
            $users = $builder->get()->getResultArray();
            
            // Convert ID to string for JS compatibility and ensure new columns exist
            foreach ($users as &$u) {
                unset($u['senha']);
                $u['id'] = (string)$u['id'];
                $u['cpf'] = $u['cpf'] ?? '';
                $u['status_licenca'] = $u['status_licenca'] ?? 'ativa';
                $u['validade_licenca'] = $u['validade_licenca'] ?? '2099-12-31T23:59:59Z';
                $u['plano'] = $u['plano'] ?? 'gratis';
                $u['limite_tvs'] = $u['limite_tvs'] ?? 1;
                $u['nivel'] = $u['nivel'] ?? 'agencia';
            }
            
            return $this->respond($users);
        } catch (\Exception $e) {
            file_put_contents(WRITEPATH . 'logs/db_error.log', $e->getMessage());
            return $this->response->setJSON(['error' => 'Erro DB/PHP: ' . $e->getMessage()])->setStatusCode(500);
        }
    }

    public function create()
    {
        try {
            $json = $this->request->getJSON();
            $db = \Config\Database::connect();
            
            $senha = password_hash($json->senha, PASSWORD_DEFAULT);
            
            $data = [
                'nome' => $json->nome,
                'cpf' => $json->cpf,
                'email' => $json->email,
                'senha' => $senha,
                'nivel' => $json->nivel ?? 'agencia',
                'status_licenca' => $json->status_licenca ?? 'ativa',
                'validade_licenca' => $json->validade_licenca ?? '2099-12-31 23:59:59',
                'plano' => $json->plano ?? 'gratis',
                'limite_tvs' => $json->limite_tvs ?? 1,
                'created_at' => date('Y-m-d H:i:s')
            ];
            
            $db->table('usuarios')->insert($data);
            return $this->respondCreated(['id' => (string)$db->insertID()]);
        } catch (\Exception $e) {
            return $this->response->setJSON(['error' => 'Erro DB/PHP: ' . $e->getMessage()])->setStatusCode(500);
        }
    }

    public function updateLicense($id = null)
    {
        $json = $this->request->getJSON();
        $db = \Config\Database::connect();
        
        $data = [
            'status_licenca' => $json->status,
            'validade_licenca' => $json->validade ?? null
        ];
        
        $db->table('usuarios')->where('id', $id)->update($data);
        return $this->respond(['success' => true]);
    }

    public function update($id = null)
    {
        $json = $this->request->getJSON();
        $db = \Config\Database::connect();
        
        $data = [
            'nome' => $json->nome,
            'cpf' => $json->cpf,
            'email' => $json->email,
            'nivel' => $json->nivel,
            'status_licenca' => $json->status_licenca,
            'validade_licenca' => $json->validade_licenca ?? null,
            'plano' => $json->plano ?? 'gratis',
            'limite_tvs' => $json->limite_tvs ?? 1
        ];
        
        if (!empty($json->senha)) {
            $data['senha'] = password_hash($json->senha, PASSWORD_DEFAULT);
        }
        
        $db->table('usuarios')->where('id', $id)->update($data);
        return $this->respond(['success' => true]);
    }

    public function delete($id = null)
    {
        $db = \Config\Database::connect();
        $db->table('usuarios')->where('id', $id)->delete();
        return $this->respondDeleted(['success' => true]);
    }
}
