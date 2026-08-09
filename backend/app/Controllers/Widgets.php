<?php

namespace App\Controllers;

use CodeIgniter\RESTful\ResourceController;

class Widgets extends ResourceController
{
    public function index()
    {
        try {
            $db = \Config\Database::connect();
            $builder = $db->table('widgets');
            $widgets = $builder->orderBy('nome', 'ASC')->get()->getResultArray();
            
            // Cast boolean fields for frontend compatibility
            foreach ($widgets as &$w) {
                $w['id'] = (string)$w['id'];
                $w['ativo'] = (bool)$w['ativo'];
                $w['em_manutencao'] = (bool)$w['em_manutencao'];
            }
            
            return $this->respond($widgets);
        } catch (\Exception $e) {
            return $this->response->setJSON(['error' => 'Erro DB/PHP: ' . $e->getMessage()])->setStatusCode(500);
        }
    }

    public function show($id = null)
    {
        try {
            $db = \Config\Database::connect();
            $widget = $db->table('widgets')->where('id', $id)->get()->getRowArray();
            
            if (!$widget) {
                return $this->response->setJSON(['error' => 'Widget não encontrado'])->setStatusCode(404);
            }
            
            $widget['id'] = (string)$widget['id'];
            $widget['ativo'] = (bool)$widget['ativo'];
            $widget['em_manutencao'] = (bool)$widget['em_manutencao'];
            
            return $this->respond($widget);
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
            if (isset($json->api_url)) $data['api_url'] = $json->api_url;
            if (isset($json->api_key)) $data['api_key'] = $json->api_key;
            if (isset($json->ativo)) $data['ativo'] = $json->ativo ? 1 : 0;
            if (isset($json->em_manutencao)) $data['em_manutencao'] = $json->em_manutencao ? 1 : 0;
            
            if (!empty($data)) {
                $db->table('widgets')->where('id', $id)->update($data);
            }
            
            return $this->respond(['success' => true]);
        } catch (\Exception $e) {
            return $this->response->setJSON(['error' => 'Erro DB/PHP: ' . $e->getMessage()])->setStatusCode(500);
        }
    }
}
