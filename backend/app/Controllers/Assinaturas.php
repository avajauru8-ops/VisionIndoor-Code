<?php

namespace App\Controllers;

use App\Libraries\Payments\AssinaturaHelper;
use App\Libraries\Payments\GatewayFactory;
use CodeIgniter\RESTful\ResourceController;

/**
 * Planos e assinaturas (scaffolding de pagamento).
 *
 * Estrutura pronta para futura integração com um gateway real:
 * catálogo de planos, status da assinatura, criação de checkout e
 * webhook. Enquanto Config\Payments::$driver = 'null', nenhum
 * pagamento é processado (NullGateway).
 */
class Assinaturas extends ResourceController
{
    protected $format = 'json';

    private function usuarioAtual($db): ?array
    {
        $user_id = $this->request->getHeaderLine('X-User-Id');
        if ($user_id === '') {
            return null;
        }
        $user = $db->table('usuarios')->where('id', $user_id)->get()->getRowArray();
        return $user ?: null;
    }

    private function limiteEfetivo(array $user): int
    {
        $plano = $user['plano'] ?? 'gratis';
        return $plano === 'gratis' ? 1 : max(1, (int)($user['limite_tvs'] ?? 1));
    }

    // GET /api/planos
    public function planos()
    {
        try {
            $cfg = config('Payments');
            $planos = [];
            foreach ($cfg->planos as $id => $p) {
                if (empty($p['ativo'])) {
                    continue;
                }
                $planos[] = [
                    'id'           => $id,
                    'nome'         => $p['nome'],
                    'descricao'    => $p['descricao'] ?? '',
                    'preco'        => $p['preco'],
                    'moeda'        => $p['moeda'] ?? 'BRL',
                    'periodo'      => $p['periodo'] ?? null,
                    'limite_telas' => $p['limite_telas'] ?? null,
                ];
            }

            $driver = strtolower((string)($cfg->driver ?? 'null'));
            return $this->respond([
                'planos'         => $planos,
                'gateway_ativo'  => $driver !== 'null',
            ]);
        } catch (\Throwable $e) {
            return $this->response->setJSON(['error' => 'Erro DB/PHP: ' . $e->getMessage()])->setStatusCode(500);
        }
    }

    // GET /api/assinaturas/status
    public function status()
    {
        try {
            $db = \Config\Database::connect();
            $user = $this->usuarioAtual($db);
            if (!$user) {
                return $this->response->setJSON(['error' => 'Usuário não encontrado'])->setStatusCode(404);
            }

            AssinaturaHelper::garantirTabela($db);

            $plano = $user['plano'] ?? 'gratis';
            $limite = $this->limiteEfetivo($user);
            $usados = $db->table('totens')->where('usuario_id', $user['id'])->countAllResults();

            $assinaturas = $db->table('assinaturas')
                ->where('usuario_id', $user['id'])
                ->orderBy('id', 'DESC')
                ->limit(10)
                ->get()
                ->getResultArray();

            foreach ($assinaturas as &$a) {
                $a['valor'] = (float)$a['valor'];
            }
            unset($a);

            return $this->respond([
                'plano'             => $plano,
                'nome_plano'        => $plano === 'gratis' ? 'Gratuito' : 'Pago',
                'limite_telas'      => $limite,
                'telas_usadas'      => (int)$usados,
                'telas_disponiveis' => max(0, $limite - (int)$usados),
                'status_licenca'    => $user['status_licenca'] ?? 'ativa',
                'validade_licenca'  => $user['validade_licenca'] ?? null,
                'assinaturas'       => $assinaturas,
            ]);
        } catch (\Throwable $e) {
            return $this->response->setJSON(['error' => 'Erro DB/PHP: ' . $e->getMessage()])->setStatusCode(500);
        }
    }

    // POST /api/assinaturas/checkout  { "plano": "pago" }
    public function checkout()
    {
        try {
            $json = $this->request->getJSON(true);
            if (!is_array($json)) {
                $json = [];
            }
            $planoId = strtolower(trim((string)($json['plano'] ?? '')));

            $cfg = config('Payments');
            if ($planoId === '' || !isset($cfg->planos[$planoId])) {
                return $this->response->setJSON(['error' => 'Plano inválido'])->setStatusCode(400);
            }
            if ($planoId === 'gratuito') {
                return $this->response->setJSON(['error' => 'O plano gratuito não requer assinatura'])->setStatusCode(400);
            }

            $planoCfg = $cfg->planos[$planoId];
            if (empty($planoCfg['ativo'])) {
                return $this->response->setJSON(['error' => 'Plano indisponível no momento'])->setStatusCode(400);
            }

            $db = \Config\Database::connect();
            $user = $this->usuarioAtual($db);
            if (!$user) {
                return $this->response->setJSON(['error' => 'Usuário não encontrado'])->setStatusCode(404);
            }
            AssinaturaHelper::garantirTabela($db);

            $valor = (float)($planoCfg['preco'] ?? 0);

            // Intenção de assinatura (registrada mesmo sem gateway ativo)
            $db->table('assinaturas')->insert([
                'usuario_id'  => $user['id'],
                'plano'       => $planoId,
                'valor'       => $valor,
                'moeda'       => $planoCfg['moeda'] ?? 'BRL',
                'periodo'     => $planoCfg['periodo'] ?? null,
                'limite_telas' => $planoCfg['limite_telas'] ?? null,
                'status'      => 'pendente',
            ]);
            $assinaturaId = (string)$db->insertID();

            $gateway = GatewayFactory::make();
            $resultado = $gateway->criarCheckout([
                'usuario_id'   => (int)$user['id'],
                'plano'        => $planoId,
                'valor'        => $valor,
                'moeda'        => $planoCfg['moeda'] ?? 'BRL',
                'periodo'      => $planoCfg['periodo'] ?? null,
                'limite_telas' => $planoCfg['limite_telas'] ?? null,
                'email'        => $user['email'] ?? null,
                'nome'         => $user['nome'] ?? null,
            ]);

            $db->table('assinaturas')->where('id', $assinaturaId)->update([
                'gateway'       => $resultado['gateway'] ?? null,
                'gateway_ref'   => $resultado['referencia'] ?? null,
                'url_pagamento' => $resultado['url'] ?? null,
            ]);

            $status = $resultado['status'] ?? 'indisponivel';
            if ($status !== 'ok') {
                return $this->response->setJSON([
                    'assinatura_id' => $assinaturaId,
                    'status'        => $status,
                    'mensagem'      => $resultado['mensagem'] ?? 'Não foi possível iniciar o pagamento.',
                    'url'           => null,
                ])->setStatusCode($status === 'erro' ? 502 : 200);
            }

            return $this->response->setJSON([
                'assinatura_id' => $assinaturaId,
                'status'        => 'ok',
                'url'           => $resultado['url'] ?? null,
                'gateway'       => $resultado['gateway'] ?? null,
            ])->setStatusCode(201);
        } catch (\Throwable $e) {
            return $this->response->setJSON(['error' => 'Erro DB/PHP: ' . $e->getMessage()])->setStatusCode(500);
        }
    }

    // POST /api/assinaturas/webhook (público: validado por segredo/assinatura do gateway)
    public function webhook()
    {
        try {
            $cfg = config('Payments');

            $secret = (string)($cfg->webhookSecret ?? '');
            if ($secret !== '') {
                $informado = $this->request->getHeaderLine('X-Webhook-Secret');
                if ($informado === '') {
                    $informado = (string)$this->request->getGet('secret');
                }
                if (!hash_equals($secret, $informado)) {
                    return $this->response->setJSON(['processado' => false, 'motivo' => 'Segredo inválido'])
                        ->setStatusCode(401);
                }
            }

            $headers = [];
            foreach ($this->request->getHeaders() as $name => $header) {
                $headers[strtolower($name)] = is_object($header) && method_exists($header, 'getValue')
                    ? $header->getValue()
                    : (string)$header;
            }

            $gateway = GatewayFactory::make();
            $evento = $gateway->validarWebhook($this->request->getBody(), $headers);

            if (!$evento || empty($evento['referencia'])) {
                return $this->response->setJSON([
                    'processado' => false,
                    'motivo'     => 'Evento ignorado (nenhum gateway ativo ou payload inválido)',
                ]);
            }

            $db = \Config\Database::connect();
            AssinaturaHelper::garantirTabela($db);

            $assinatura = $db->table('assinaturas')
                ->where('gateway_ref', $evento['referencia'])
                ->get()->getRowArray();
            if (!$assinatura) {
                return $this->response->setJSON(['processado' => false, 'motivo' => 'Assinatura não encontrada']);
            }

            $novoStatus = (string)$evento['status'];
            $atualizacao = ['status' => $novoStatus];

            if ($novoStatus === 'ativa') {
                $agora = date('Y-m-d H:i:s');
                $fim = AssinaturaHelper::dataFimPorPeriodo($assinatura['periodo'] ?? 'mensal');
                $atualizacao['data_inicio'] = $assinatura['data_inicio'] ?? $agora;
                $atualizacao['data_fim'] = $fim;

                $db->table('usuarios')->where('id', $assinatura['usuario_id'])->update([
                    'plano'            => AssinaturaHelper::planoUsuario((string)$assinatura['plano']),
                    'status_licenca'   => 'ativa',
                    'validade_licenca' => $fim,
                    ...( !empty($assinatura['limite_telas'])
                        ? ['limite_tvs' => (int)$assinatura['limite_telas']]
                        : [] ),
                ]);
            }

            $db->table('assinaturas')->where('id', $assinatura['id'])->update($atualizacao);

            return $this->response->setJSON(['processado' => true, 'status' => $novoStatus]);
        } catch (\Throwable $e) {
            return $this->response->setJSON(['error' => 'Erro DB/PHP: ' . $e->getMessage()])->setStatusCode(500);
        }
    }
}
