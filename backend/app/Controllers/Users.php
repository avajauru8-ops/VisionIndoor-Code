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
            $users = $builder->select('id, nome, cpf, email, nivel, status_licenca, validade_licenca, created_at')->get()->getResultArray();
            
            // Convert ID to string for JS compatibility
            foreach ($users as &$u) {
                $u['id'] = (string)$u['id'];
            }
            
            return $this->respond($users);
        } catch (\Exception $e) {
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
            'validade_licenca' => $json->validade_licenca ?? null
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
