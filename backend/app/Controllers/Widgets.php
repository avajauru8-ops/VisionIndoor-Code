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
                if (isset($w['config']) && is_string($w['config'])) {
                    $w['config'] = json_decode($w['config'], true) ?? [];
                } elseif (!isset($w['config'])) {
                    $w['config'] = [];
                }
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
            if (isset($widget['config']) && is_string($widget['config'])) {
                $widget['config'] = json_decode($widget['config'], true) ?? [];
            } elseif (!isset($widget['config'])) {
                $widget['config'] = [];
            }
            
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
            if (isset($json->config)) $data['config'] = json_encode($json->config);
            
            if (!empty($data)) {
                $db->table('widgets')->where('id', $id)->update($data);
            }
            
            return $this->respond(['success' => true]);
        } catch (\Exception $e) {
            return $this->response->setJSON(['error' => 'Erro DB/PHP: ' . $e->getMessage()])->setStatusCode(500);
        }
    }

    public function upload()
    {
        try {
            $file = $this->request->getFile('file');
            if (!$file || !$file->isValid()) {
                return $this->failValidationErrors('Nenhum arquivo enviado ou arquivo inválido');
            }

            $newName = time() . '_widget_' . preg_replace('/[^a-zA-Z0-9.-]/', '_', $file->getName());
            $file->move(ROOTPATH . 'public/uploads', $newName);
            
            $url = base_url('uploads/' . $newName);
            return $this->respond(['url' => $url]);
        } catch (\Exception $e) {
            return $this->response->setJSON(['error' => 'Erro no upload: ' . $e->getMessage()])->setStatusCode(500);
        }
    }
}
