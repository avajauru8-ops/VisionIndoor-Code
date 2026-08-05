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
            $show_apk_banner = $this->request->getPost('show_apk_banner');
            $apk_banner_title = $this->request->getPost('apk_banner_title');
            $apk_banner_desc = $this->request->getPost('apk_banner_desc');
            $apk_banner_btn_text = $this->request->getPost('apk_banner_btn_text');
            $apk_file_url = $this->request->getPost('apk_file_url');
            $openweather_api_key = $this->request->getPost('openweather_api_key');
            
            $data = [];
            if ($nome_painel !== null) $data['nome_painel'] = $nome_painel;
            if ($show_apk_banner !== null) $data['show_apk_banner'] = $show_apk_banner === 'true' ? 1 : 0;
            if ($apk_banner_title !== null) $data['apk_banner_title'] = $apk_banner_title;
            if ($apk_banner_desc !== null) $data['apk_banner_desc'] = $apk_banner_desc;
            if ($apk_banner_btn_text !== null) $data['apk_banner_btn_text'] = $apk_banner_btn_text;
            if ($apk_file_url !== null) $data['apk_file_url'] = $apk_file_url;
            if ($openweather_api_key !== null) $data['openweather_api_key'] = $openweather_api_key;
            
            $logo = $this->request->getFile('logo');
            if ($logo && $logo->isValid()) {
                $newName = time() . '_logo_' . preg_replace('/[^a-zA-Z0-9.-]/', '_', $logo->getName());
                $logo->move(ROOTPATH . 'public/uploads', $newName);
                $data['logo_url'] = base_url('uploads/' . $newName);
            } else if ($this->request->getPost('logo_url') !== null) {
                $data['logo_url'] = $this->request->getPost('logo_url');
            }

            $apk = $this->request->getFile('apk');
            if ($apk && $apk->isValid()) {
                $newName = time() . '_player_' . preg_replace('/[^a-zA-Z0-9.-]/', '_', $apk->getName());
                $apk->move(ROOTPATH . 'public/uploads', $newName);
                $data['apk_file_url'] = base_url('uploads/' . $newName);
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
