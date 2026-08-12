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
            $builder->select('totens.*, usuarios.nome as usuario_nome, usuarios.email as usuario_email');
            $builder->join('usuarios', 'usuarios.id = totens.usuario_id', 'left');
            
            if ($nivel !== 'admin') {
                $builder->where('totens.usuario_id', $user_id);
            }
            
            $totens = $builder->get()->getResultArray();
            
            foreach ($totens as &$t) {
                $t['id'] = (string)$t['id'];
                // fallback if data_cadastro is missing but created_at exists
                if (!isset($t['data_cadastro']) && isset($t['created_at'])) {
                    $t['data_cadastro'] = $t['created_at'];
                }
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
            
            $builder = $db->table('totens')->where('totens.id', $id);
            $builder->select('totens.*, usuarios.nome as usuario_nome, usuarios.email as usuario_email');
            $builder->join('usuarios', 'usuarios.id = totens.usuario_id', 'left');
            
            if ($nivel !== 'admin') {
                $builder->where('totens.usuario_id', $user_id);
            }
            
            $totem = $builder->get()->getRowArray();
            if (!$totem) {
                return $this->response->setJSON(['error' => 'Totem não encontrado'])->setStatusCode(404);
            }
            
            $totem['id'] = (string)$totem['id'];
            if (!isset($totem['data_cadastro']) && isset($totem['created_at'])) {
                $totem['data_cadastro'] = $totem['created_at'];
            }
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
            
            // Limit Check Removed as requested by user
            
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
            if (isset($json->rotacao)) $data['rotacao'] = $json->rotacao;
            if (isset($json->status)) $data['status'] = $json->status;
            if (isset($json->auto_iniciar)) $data['auto_iniciar'] = $json->auto_iniciar ? 1 : 0;
            if (isset($json->iniciar_tv_energia)) $data['iniciar_tv_energia'] = $json->iniciar_tv_energia ? 1 : 0;
            if (isset($json->fuso_horario)) $data['fuso_horario'] = $json->fuso_horario;
            if (isset($json->exibir_barra_tarefas)) $data['exibir_barra_tarefas'] = $json->exibir_barra_tarefas ? 1 : 0;
            if (isset($json->audio_ligado)) $data['audio_ligado'] = $json->audio_ligado ? 1 : 0;
            if (isset($json->auto_reiniciar_horas)) $data['auto_reiniciar_horas'] = (int)$json->auto_reiniciar_horas;
            if (isset($json->exibir_notificacoes)) $data['exibir_notificacoes'] = $json->exibir_notificacoes ? 1 : 0;
            if (isset($json->limpeza_automatica)) $data['limpeza_automatica'] = $json->limpeza_automatica ? 1 : 0;
            if (isset($json->tempo_exibicao_padrao)) $data['tempo_exibicao_padrao'] = (int)$json->tempo_exibicao_padrao;
            if (isset($json->id_monetizacao)) $data['id_monetizacao'] = $json->id_monetizacao;
            if (property_exists($json, 'playlist_id')) $data['playlist_id'] = empty($json->playlist_id) ? null : $json->playlist_id;
            
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
            
            // Remove o vínculo deste totem em qualquer campanha antes de deletá-lo
            // Isso previne o erro de Foreign Key Constraint Failure (Cannot delete parent row)
            $db->table('campanhas')->where('totem_id', $id)->update(['totem_id' => null]);
            
            $db->table('totens')->where('id', $id)->delete();
            return $this->respondDeleted(['id' => $id]);
        } catch (\Exception $e) {
            return $this->response->setJSON(['error' => 'Erro DB/PHP: ' . $e->getMessage()])->setStatusCode(500);
        }
    }

    public function comando($id = null)
    {
        try {
            $json = $this->request->getJSON();
            if (!isset($json->comando)) {
                return $this->response->setJSON(['error' => 'Comando não especificado'])->setStatusCode(400);
            }
            
            $db = \Config\Database::connect();
            $data = [
                'comando_acao' => $json->comando,
                'comando_id' => (string)time()
            ];
            
            $db->table('totens')->where('id', $id)->update($data);
            
            return $this->respond(['success' => true]);
        } catch (\Exception $e) {
            return $this->response->setJSON(['error' => 'Erro DB/PHP: ' . $e->getMessage()])->setStatusCode(500);
        }
    }
}
