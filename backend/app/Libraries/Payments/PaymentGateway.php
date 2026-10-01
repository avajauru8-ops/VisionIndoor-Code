<?php

namespace App\Libraries\Payments;

/**
 * Contrato de um gateway de pagamento.
 *
 * Qualquer gateway real (Mercado Pago, Stripe, PayPal, PIX...) deve
 * implementar esta interface e ser registrado no GatewayFactory.
 */
interface PaymentGateway
{
    /**
     * Cria uma cobrança/assinatura e devolve os dados do checkout.
     *
     * @param array $dados [
     *   'usuario_id'   => int,
     *   'plano'        => string,
     *   'valor'        => float,
     *   'moeda'        => string,
     *   'periodo'      => ?string,
     *   'limite_telas' => ?int,
     *   'email'        => ?string,
     *   'nome'         => ?string,
     * ]
     *
     * @return array{
     *   status: string,        // 'ok' | 'indisponivel' | 'erro'
     *   mensagem?: string,
     *   url?: string|null,     // URL de pagamento (quando houver)
     *   gateway?: string,
     *   referencia?: string|null // id da cobrança no gateway
     * }
     */
    public function criarCheckout(array $dados): array;

    /**
     * Valida o payload recebido pelo webhook do gateway.
     *
     * @return array|null Evento normalizado:
     *   ['referencia' => string, 'status' => 'ativa'|'falha'|'cancelada'|'expirada', 'raw' => array]
     *   ou null quando o payload não é válido / deve ser ignorado.
     */
    public function validarWebhook(?string $corpo, array $headers): ?array;
}
