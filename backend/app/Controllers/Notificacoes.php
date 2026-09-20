<?php

namespace App\Controllers;

use CodeIgniter\RESTful\ResourceController;

class Notificacoes extends ResourceController
{
    public function index()
    {
        try {
            $db = \Config\Database::connect();
            $user_id = $this->request->getHeaderLine('X-User-Id');
            $nivel = $this->request->getHeaderLine('X-User-Nivel');

            $builder = $db->table('notificacoes n');
            $builder->select('n.*, t.nome as totem_nome');
            $builder->join('totens t', 't.id = n.totem_id', 'left');

            if ($nivel !== 'admin') {
                $builder->where('n.usuario_id', $user_id);
            }

            $builder->orderBy('n.created_at', 'DESC');
            $builder->limit(50);

            $notificacoes = $builder->get()->getResultArray();

            foreach ($notificacoes as &$n) {
                $n['id'] = (string)$n['id'];
                $n['totem_id'] = $n['totem_id'] ? (string)$n['totem_id'] : null;
                $n['lida'] = (bool)$n['lida'];
            }

            return $this->respond($notificacoes);
        } catch (\Exception $e) {
            return $this->response->setJSON(['error' => $e->getMessage()])->setStatusCode(500);
        }
    }

    public function unreadCount()
    {
        try {
            $db = \Config\Database::connect();
            $user_id = $this->request->getHeaderLine('X-User-Id');
            $nivel = $this->request->getHeaderLine('X-User-Nivel');

            $builder = $db->table('notificacoes');
            $builder->where('lida', 0);

            if ($nivel !== 'admin') {
                $builder->where('usuario_id', $user_id);
            }

            $count = $builder->countAllResults(false);

            return $this->respond(['count' => $count]);
        } catch (\Exception $e) {
            return $this->response->setJSON(['error' => $e->getMessage()])->setStatusCode(500);
        }
    }

    public function markRead($id = null)
    {
        try {
            $db = \Config\Database::connect();
            $user_id = $this->request->getHeaderLine('X-User-Id');
            $nivel = $this->request->getHeaderLine('X-User-Nivel');

            $builder = $db->table('notificacoes');
            $builder->where('id', $id);

            if ($nivel !== 'admin') {
                $builder->where('usuario_id', $user_id);
            }

            $builder->update(['lida' => 1]);

            return $this->respond(['success' => true]);
        } catch (\Exception $e) {
            return $this->response->setJSON(['error' => $e->getMessage()])->setStatusCode(500);
        }
    }

    public function markAllRead()
    {
        try {
            $db = \Config\Database::connect();
            $user_id = $this->request->getHeaderLine('X-User-Id');
            $nivel = $this->request->getHeaderLine('X-User-Nivel');

            $builder = $db->table('notificacoes');
            $builder->where('lida', 0);

            if ($nivel !== 'admin') {
                $builder->where('usuario_id', $user_id);
            }

            $builder->update(['lida' => 1]);

            return $this->respond(['success' => true]);
        } catch (\Exception $e) {
            return $this->response->setJSON(['error' => $e->getMessage()])->setStatusCode(500);
        }
    }

    public function create()
    {
        try {
            $db = \Config\Database::connect();
            $user_id = $this->request->getHeaderLine('X-User-Id');

            $json = $this->request->getJSON();

            $db->table('notificacoes')->insert([
                'usuario_id' => $user_id,
                'titulo' => $json->titulo ?? '',
                'mensagem' => $json->mensagem ?? '',
                'tipo' => $json->tipo ?? 'info',
                'totem_id' => $json->totem_id ?? null
            ]);

            return $this->respondCreated(['id' => (string)$db->insertID()]);
        } catch (\Exception $e) {
            return $this->response->setJSON(['error' => $e->getMessage()])->setStatusCode(500);
        }
    }
}
