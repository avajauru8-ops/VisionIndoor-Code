<?php

namespace App\Controllers;

use CodeIgniter\RESTful\ResourceController;

/**
 * Atualizações do aplicativo Android (cadastro do administrador).
 * A última atualização ativa é enviada ao app no XML principal
 * (app_atualizacao / app_atualizacao_url / app_atualizacao_desc).
 */
class AppUpdates extends ResourceController
{
    private function ensureSchema($db)
    {
        $query = $db->query("SHOW TABLES LIKE 'app_updates'");
        if (!$query->getRow()) {
            $db->query("CREATE TABLE IF NOT EXISTS app_updates (
                id INT AUTO_INCREMENT PRIMARY KEY,
                versao VARCHAR(50) NOT NULL,
                arquivo_url TEXT NULL,
                descricao TEXT NULL,
                ativo TINYINT(1) DEFAULT 1,
                data_cadastro DATETIME NULL
            )");
        }
    }

    public function index()
    {
        try {
            $db = \Config\Database::connect();
            $this->ensureSchema($db);
            $rows = $db->table('app_updates')->orderBy('id', 'DESC')->get()->getResultArray();
            foreach ($rows as &$r) {
                $r['id'] = (string) $r['id'];
                $r['ativo'] = (bool) ($r['ativo'] ?? 0);
            }
            return $this->respond($rows);
        } catch (\Exception $e) {
            return $this->response->setJSON(['error' => 'Erro DB/PHP: ' . $e->getMessage()])->setStatusCode(500);
        }
    }

    public function create()
    {
        try {
            $db = \Config\Database::connect();
            $this->ensureSchema($db);
            $json = $this->request->getPost();
            if (empty($json) || !is_array($json)) {
                try {
                    $json = $this->request->getJSON(true) ?? [];
                } catch (\Exception $e) {
                    $json = [];
                }
            }
            if (empty($json['versao'])) {
                return $this->response->setJSON(['error' => 'Versão obrigatória'])->setStatusCode(400);
            }
            $ativo = !isset($json['ativo']) || $json['ativo'] ? 1 : 0;
            $arquivoUrl = $json['arquivo_url'] ?? null;
            $apk = $this->request->getFile('apk');
            if ($apk && $apk->isValid()) {
                $uploadDir = ROOTPATH . 'public/uploads/' . 'app-at';
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0755, true);
                }
                $newName = time() . '_app_' . preg_replace('/[^a-zA-Z0-9.-]/', '_', $apk->getName());
                $apk->move($uploadDir, $newName);
                $arquivoUrl = base_url('uploads/' . 'app-at/' . $newName);
            }
            $db->table('app_updates')->insert([
                'versao' => (string) $json['versao'],
                'arquivo_url' => $arquivoUrl,
                'descricao' => $json['descricao'] ?? null,
                'ativo' => $ativo,
                'data_cadastro' => (new \DateTime('now', new \DateTimeZone('America/Sao_Paulo')))->format('Y-m-d H:i:s'),
            ]);
            // Apenas uma atualização ativa por vez
            if ($ativo) {
                $db->table('app_updates')->where('id !=', $db->insertID())->update(['ativo' => 0]);
            }
            return $this->respond(['ok' => true]);
        } catch (\Exception $e) {
            return $this->response->setJSON(['error' => 'Erro DB/PHP: ' . $e->getMessage()])->setStatusCode(500);
        }
    }

    public function update($id = null)
    {
        try {
            $db = \Config\Database::connect();
            $this->ensureSchema($db);
            $json = $this->request->getPost();
            if (empty($json) || !is_array($json)) {
                try {
                    $json = $this->request->getJSON(true) ?? [];
                } catch (\Exception $e) {
                    $json = [];
                }
            }
            $data = [];
            if (isset($json['versao'])) $data['versao'] = (string) $json['versao'];
            if (array_key_exists('arquivo_url', $json)) $data['arquivo_url'] = $json['arquivo_url'];
            if (array_key_exists('descricao', $json)) $data['descricao'] = $json['descricao'];
            if (isset($json['ativo'])) $data['ativo'] = $json['ativo'] ? 1 : 0;
            if (empty($data)) {
                return $this->response->setJSON(['error' => 'Nada para atualizar'])->setStatusCode(400);
            }
            if (isset($data['ativo']) && $data['ativo']) {
                $db->table('app_updates')->where('id !=', $id)->update(['ativo' => 0]);
            }
            $db->table('app_updates')->where('id', $id)->update($data);
            return $this->respond(['ok' => true]);
        } catch (\Exception $e) {
            return $this->response->setJSON(['error' => 'Erro DB/PHP: ' . $e->getMessage()])->setStatusCode(500);
        }
    }

    public function delete($id = null)
    {
        try {
            $db = \Config\Database::connect();
            $this->ensureSchema($db);
            $db->table('app_updates')->where('id', $id)->delete();
            return $this->respond(['ok' => true]);
        } catch (\Exception $e) {
            return $this->response->setJSON(['error' => 'Erro DB/PHP: ' . $e->getMessage()])->setStatusCode(500);
        }
    }
}
