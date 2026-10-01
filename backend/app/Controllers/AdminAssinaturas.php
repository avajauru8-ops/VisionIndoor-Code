<?php

namespace App\Controllers;

use App\Libraries\Payments\AssinaturaHelper;
use CodeIgniter\RESTful\ResourceController;

/**
 * Painel administrativo: listagem de assinaturas com aprovação/reprovação manual.
 *
 * Fluxo: cliente clica em "Assinar" (POST /api/assinaturas/checkout) ->
 * registro "pendente" -> admin aprova (ativa plano/validade/limite do usuário)
 * ou reprova.
 */
class AdminAssinaturas extends ResourceController
{
    protected $format = 'json';

    // GET /api/admin/assinaturas  (?status=pendente)
    public function index()
    {
        try {
            $db = \Config\Database::connect();
            AssinaturaHelper::garantirTabela($db);

            $builder = $db->table('assinaturas');
            $builder->select('assinaturas.*, usuarios.nome AS usuario_nome, usuarios.email AS usuario_email, usuarios.plano AS usuario_plano, usuarios.limite_tvs AS usuario_limite_tvs, usuarios.status_licenca AS usuario_status_licenca');
            $builder->join('usuarios', 'usuarios.id = assinaturas.usuario_id', 'left');

            $status = (string)$this->request->getGet('status');
            if ($status !== '' && $status !== 'todas') {
                $builder->where('assinaturas.status', $status);
            }

            $assinaturas = $builder->orderBy('assinaturas.id', 'DESC')->get()->getResultArray();

            foreach ($assinaturas as &$a) {
                $a['valor'] = (float)$a['valor'];
                $a['limite_telas'] = $a['limite_telas'] !== null ? (int)$a['limite_telas'] : null;
            }
            unset($a);

            $resumo = ['pendente' => 0, 'ativa' => 0, 'rejeitada' => 0, 'total' => 0];
            $todos = $db->table('assinaturas')->select('status, COUNT(*) AS qtd', false)->groupBy('status')->get()->getResultArray();
            foreach ($todos as $r) {
                $resumo[$r['status']] = (int)$r['qtd'];
                $resumo['total'] += (int)$r['qtd'];
            }

            return $this->response->setJSON([
                'assinaturas' => $assinaturas,
                'resumo'      => $resumo,
            ]);
        } catch (\Throwable $e) {
            return $this->response->setJSON(['error' => 'Erro DB/PHP: ' . $e->getMessage()])->setStatusCode(500);
        }
    }

    // POST /api/admin/assinaturas/:id/aprovar  { limite_telas?: int }
    public function aprovar($id = null)
    {
        try {
            $db = \Config\Database::connect();
            AssinaturaHelper::garantirTabela($db);

            $assinatura = $db->table('assinaturas')->where('id', $id)->get()->getRowArray();
            if (!$assinatura) {
                return $this->response->setJSON(['error' => 'Assinatura não encontrada'])->setStatusCode(404);
            }
            if ($assinatura['status'] === 'ativa') {
                return $this->response->setJSON(['error' => 'Assinatura já está ativa'])->setStatusCode(400);
            }

            $json = $this->request->getJSON(true);
            if (!is_array($json)) {
                $json = [];
            }

            $limite = null;
            if (isset($json['limite_telas']) && (int)$json['limite_telas'] > 0) {
                $limite = (int)$json['limite_telas'];
            } elseif (!empty($assinatura['limite_telas'])) {
                $limite = (int)$assinatura['limite_telas'];
            }

            $agora = date('Y-m-d H:i:s');
            $fim = AssinaturaHelper::dataFimPorPeriodo((string)($assinatura['periodo'] ?? 'mensal'));

            $db->table('assinaturas')->where('id', $assinatura['id'])->update([
                'status'      => 'ativa',
                'data_inicio' => $assinatura['data_inicio'] ?? $agora,
                'data_fim'    => $fim,
                'limite_telas' => $limite ?? $assinatura['limite_telas'],
            ]);

            $usuarioUpdate = [
                'plano'            => AssinaturaHelper::planoUsuario((string)$assinatura['plano']),
                'status_licenca'   => 'ativa',
                'validade_licenca' => $fim,
            ];
            if ($limite !== null) {
                $usuarioUpdate['limite_tvs'] = $limite;
            }
            $db->table('usuarios')->where('id', $assinatura['usuario_id'])->update($usuarioUpdate);

            $atualizada = $db->table('assinaturas')->where('id', $assinatura['id'])->get()->getRowArray();
            $atualizada['valor'] = (float)$atualizada['valor'];

            return $this->response->setJSON([
                'ok'          => true,
                'mensagem'    => 'Assinatura aprovada. O plano do usuário foi ativado.',
                'assinatura'  => $atualizada,
            ]);
        } catch (\Throwable $e) {
            return $this->response->setJSON(['error' => 'Erro DB/PHP: ' . $e->getMessage()])->setStatusCode(500);
        }
    }

    // POST /api/admin/assinaturas/:id/reprovar
    public function reprovar($id = null)
    {
        try {
            $db = \Config\Database::connect();
            AssinaturaHelper::garantirTabela($db);

            $assinatura = $db->table('assinaturas')->where('id', $id)->get()->getRowArray();
            if (!$assinatura) {
                return $this->response->setJSON(['error' => 'Assinatura não encontrada'])->setStatusCode(404);
            }
            if ($assinatura['status'] === 'ativa') {
                return $this->response->setJSON([
                    'error' => 'Assinatura ativa não pode ser reprovada. Altere a licença do usuário em "Usuários & Licenças".',
                ])->setStatusCode(400);
            }

            $db->table('assinaturas')->where('id', $assinatura['id'])->update(['status' => 'rejeitada']);

            $atualizada = $db->table('assinaturas')->where('id', $assinatura['id'])->get()->getRowArray();
            $atualizada['valor'] = (float)$atualizada['valor'];

            return $this->response->setJSON([
                'ok'         => true,
                'mensagem'   => 'Assinatura reprovada.',
                'assinatura' => $atualizada,
            ]);
        } catch (\Throwable $e) {
            return $this->response->setJSON(['error' => 'Erro DB/PHP: ' . $e->getMessage()])->setStatusCode(500);
        }
    }
}
