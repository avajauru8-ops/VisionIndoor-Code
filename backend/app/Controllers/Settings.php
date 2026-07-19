<?php

namespace App\Controllers;

use CodeIgniter\RESTful\ResourceController;

class Settings extends ResourceController
{
    public function index()
    {
        try {
            $db = \Config\Database::connect();
            
            $config = $db->table('configuracoes_admin')->get()->getRowArray();
            
            if (!$config) {
                $config = [
                    'nome_painel' => 'VisioIndoor',
                    'logo_url' => ''
                ];
                $db->table('configuracoes_admin')->insert($config);
                $config['id'] = $db->insertID();
            }
            
            return $this->respond($config);
        } catch (\Exception $e) {
            return $this->response->setJSON(['error' => 'Erro DB/PHP: ' . $e->getMessage()])->setStatusCode(500);
        }
    }

    public function update($id = null)
    {
        try {
            $db = \Config\Database::connect();
            
            $nome_painel = $this->request->getPost('nome_painel');
            
            $data = [];
            if ($nome_painel !== null) {
                $data['nome_painel'] = $nome_painel;
            }
            
            $logo = $this->request->getFile('logo_url');
            if ($logo && $logo->isValid()) {
                $newName = time() . '_logo_' . preg_replace('/[^a-zA-Z0-9.-]/', '_', $logo->getName());
                $logo->move(ROOTPATH . 'public/uploads', $newName);
                $data['logo_url'] = base_url('uploads/' . $newName);
            }
            
            if (!empty($data)) {
                // Se id for null ou não enviado, atualiza o primeiro registro (id=1)
                $db->table('configuracoes_admin')->where('id', $id ?? 1)->update($data);
            }
            
            return $this->respond(['success' => true]);
        } catch (\Exception $e) {
            return $this->response->setJSON(['error' => 'Erro DB/PHP: ' . $e->getMessage()])->setStatusCode(500);
        }
    }
}
