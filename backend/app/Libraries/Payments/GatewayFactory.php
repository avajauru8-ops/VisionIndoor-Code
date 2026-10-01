<?php

namespace App\Libraries\Payments;

/**
 * Instancia o gateway configurado em Config\Payments::$driver.
 *
 * Para integrar um gateway real:
 *  1. Crie a classe implementando PaymentGateway (ex.: MercadoPagoGateway)
 *  2. Adicione o case abaixo
 *  3. Troque Config\Payments::$driver e preencha as credenciais
 */
class GatewayFactory
{
    public static function make(): PaymentGateway
    {
        $driver = strtolower((string) (config('Payments')->driver ?? 'null'));

        switch ($driver) {
            // Exemplo de futuro registro:
            // case 'mercadopago':
            //     return new MercadoPagoGateway(config('Payments')->gateways['mercadopago'] ?? []);

            default:
                return new NullGateway();
        }
    }
}
