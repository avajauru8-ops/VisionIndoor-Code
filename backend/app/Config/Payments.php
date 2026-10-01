<?php

namespace Config;

use CodeIgniter\Config\BaseConfig;

/**
 * Configuração de pagamentos e assinaturas.
 *
 * Enquanto $driver = 'null', nenhum pagamento é processado (modo scaffolding).
 * Para integrar um gateway real: implemente a interface
 * App\Libraries\Payments\PaymentGateway, registre-a no GatewayFactory
 * e troque $driver + credenciais abaixo.
 */
class Payments extends BaseConfig
{
    /**
     * Driver do gateway de pagamento ativo.
     * 'null' = nenhum gateway configurado (checkout indisponível).
     * Futuramente: 'mercadopago', 'stripe', 'paypal', etc.
     */
    public string $driver = 'null';

    /**
     * Segredo compartilhado usado para validar requisições de webhook.
     * Vazio = validação de segredo desativada (depende da assinatura do gateway).
     */
    public string $webhookSecret = '';

    /**
     * Credenciais por gateway. Preencher apenas o gateway que for integrar.
     */
    public array $gateways = [
        'mercadopago' => ['access_token' => ''],
        'stripe'      => ['secret_key' => '', 'webhook_secret' => ''],
        'paypal'      => ['client_id' => '', 'client_secret' => ''],
    ];

    /**
     * Catálogo de planos exposto em GET /api/planos.
     *
     * preco null      => preço ainda não definido (exibido como "Em breve").
     * limite_telas null => limite definido pelo admin (usuarios.limite_tvs).
     */
    public array $planos = [
        'gratuito' => [
            'nome'        => 'Gratuito',
            'descricao'   => 'Plano inicial com 1 tela.',
            'preco'       => 0.00,
            'moeda'       => 'BRL',
            'periodo'     => null,
            'limite_telas' => 1,
            'ativo'       => true,
        ],
        'pago' => [
            'nome'        => 'Pago',
            'descricao'   => 'Libera mais telas conforme o contrato comercial.',
            'preco'       => null,
            'moeda'       => 'BRL',
            'periodo'     => 'mensal',
            'limite_telas' => null,
            'ativo'       => true,
        ],
    ];
}
