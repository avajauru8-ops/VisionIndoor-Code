<?php

namespace App\Libraries\Payments;

/**
 * Gateway neutro usado enquanto nenhum gateway real está configurado.
 * Não processa nenhum pagamento; apenas sinaliza que a cobrança está indisponível.
 */
class NullGateway implements PaymentGateway
{
    public function criarCheckout(array $dados): array
    {
        return [
            'status'  => 'indisponivel',
            'mensagem' => 'Pagamentos online ainda não foram configurados. Entre em contato com o suporte para assinar.',
            'url'     => null,
            'gateway' => 'null',
            'referencia' => null,
        ];
    }

    public function validarWebhook(?string $corpo, array $headers): ?array
    {
        return null;
    }
}
