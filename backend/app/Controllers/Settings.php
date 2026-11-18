<?php

namespace App\Controllers;

use CodeIgniter\RESTful\ResourceController;

class Settings extends ResourceController
{
    /**
     * Garante que as colunas do banner/APK existam antes de ler ou gravar.
     * Evita "Unknown column" quando a migração manual (migrate_settings.php)
     * ainda não foi executada no ambiente.
     */
    private function ensureConfigColumns($db): void
    {
        try {
            $existing = $db->getFieldNames('configuracoes_admin');
            $required = [
                'show_apk_banner'     => 'BOOLEAN DEFAULT TRUE',
                'apk_banner_title'    => "VARCHAR(255) DEFAULT 'Player Android'",
                'apk_banner_desc'     => 'TEXT DEFAULT NULL',
                'apk_banner_btn_text' => "VARCHAR(100) DEFAULT 'Instalar Player'",
                'apk_file_url'        => 'VARCHAR(255) DEFAULT NULL',
                'openweather_api_key' => 'VARCHAR(255) DEFAULT NULL',
            ];

            foreach ($required as $column => $definition) {
                if (! in_array($column, $existing, true)) {
                    $db->query("ALTER TABLE configuracoes_admin ADD COLUMN {$column} {$definition}");
                }
            }
        } catch (\Throwable $e) {
            // Melhor esforço: o erro real (se houver) aparece na leitura/gravação.
        }
    }

    private function uploadErrorMessage(int $code): string
    {
        return match ($code) {
            UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'o arquivo excede o limite do servidor (upload_max_filesize / post_max_size)',
            UPLOAD_ERR_PARTIAL                       => 'o envio foi interrompido antes de terminar',
            UPLOAD_ERR_NO_FILE                       => 'nenhum arquivo foi enviado',
            UPLOAD_ERR_NO_TMP_DIR, UPLOAD_ERR_CANT_WRITE, UPLOAD_ERR_EXTENSION => 'falha interna do servidor ao gravar o arquivo',
            default                                  => 'erro desconhecido no upload (código ' . $code . ')',
        };
    }

    public function index()
    {
        try {
            $db = \Config\Database::connect();

            $this->ensureConfigColumns($db);

            $config = $db->table('configuracoes_admin')->get()->getRowArray();
            
            if (!$config) {
                $config = [
                    'nome_painel' => 'VisioIndoor',
                    'logo_url' => ''
                ];
                $db->table('configuracoes_admin')->insert($config);
                $config['id'] = $db->insertID();
            }

            // O driver devolve "0"/"1" (string): em JS "0" é truthy e o banner nunca desligaria.
            $config['show_apk_banner'] = in_array($config['show_apk_banner'] ?? null, [1, '1', true, 'true'], true);

            return $this->respond($config);
        } catch (\Exception $e) {
            return $this->response->setJSON(['error' => 'Erro DB/PHP: ' . $e->getMessage()])->setStatusCode(500);
        }
    }

    public function update($id = null)
    {
        try {
            $db = \Config\Database::connect();

            $this->ensureConfigColumns($db);

            $nome_painel = $this->request->getPost('nome_painel');
            $show_apk_banner = $this->request->getPost('show_apk_banner');
            $apk_banner_title = $this->request->getPost('apk_banner_title');
            $apk_banner_desc = $this->request->getPost('apk_banner_desc');
            $apk_banner_btn_text = $this->request->getPost('apk_banner_btn_text');
            $apk_file_url = $this->request->getPost('apk_file_url');

            $data = [];
            if ($nome_painel !== null) $data['nome_painel'] = $nome_painel;
            if ($show_apk_banner !== null) {
                $data['show_apk_banner'] = in_array($show_apk_banner, ['true', '1', 'on', 'yes'], true) ? 1 : 0;
            }
            if ($apk_banner_title !== null) $data['apk_banner_title'] = $apk_banner_title;
            if ($apk_banner_desc !== null) $data['apk_banner_desc'] = $apk_banner_desc;
            if ($apk_banner_btn_text !== null) $data['apk_banner_btn_text'] = $apk_banner_btn_text;
            if ($apk_file_url !== null) $data['apk_file_url'] = $apk_file_url;

            $uploadDir = ROOTPATH . 'public/uploads';
            if (! is_dir($uploadDir)) {
                @mkdir($uploadDir, 0777, true);
            }

            $logo = $this->request->getFile('logo');
            if ($logo !== null && $logo->getError() !== UPLOAD_ERR_NO_FILE) {
                if ($logo->getError() !== UPLOAD_ERR_OK) {
                    return $this->response->setJSON([
                        'error' => 'Falha no upload do logo: ' . $this->uploadErrorMessage($logo->getError()),
                    ])->setStatusCode(400);
                }
                $newName = time() . '_logo_' . preg_replace('/[^a-zA-Z0-9.-]/', '_', $logo->getName());
                try {
                    $logo->move($uploadDir, $newName);
                } catch (\Exception $e) {
                    return $this->response->setJSON([
                        'error' => 'Não foi possível gravar o logo no servidor: ' . $e->getMessage(),
                    ])->setStatusCode(500);
                }
                $data['logo_url'] = base_url('uploads/' . $newName);
            } else if ($this->request->getPost('logo_url') !== null) {
                $data['logo_url'] = $this->request->getPost('logo_url');
            }

            $apk = $this->request->getFile('apk');
            if ($apk !== null && $apk->getError() !== UPLOAD_ERR_NO_FILE) {
                if ($apk->getError() !== UPLOAD_ERR_OK) {
                    return $this->response->setJSON([
                        'error' => 'Falha no upload do APK: ' . $this->uploadErrorMessage($apk->getError()),
                    ])->setStatusCode(400);
                }
                $newName = time() . '_player_' . preg_replace('/[^a-zA-Z0-9.-]/', '_', $apk->getName());
                try {
                    $apk->move($uploadDir, $newName);
                } catch (\Exception $e) {
                    return $this->response->setJSON([
                        'error' => 'Não foi possível gravar o APK no servidor: ' . $e->getMessage(),
                    ])->setStatusCode(500);
                }
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
