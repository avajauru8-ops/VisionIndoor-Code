<?php

namespace App\Libraries\Payments;

/**
 * Funções compartilhadas entre Assinaturas (painel do cliente)
 * e AdminAssinaturas (painel administrativo).
 */
class AssinaturaHelper
{
    /** Cria a tabela de assinaturas caso ainda não exista (padrão do projeto: sem migrations manuais). */
    public static function garantirTabela($db): void
    {
        try {
            $db->query("CREATE TABLE IF NOT EXISTS assinaturas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT NOT NULL,
                plano VARCHAR(50) NOT NULL DEFAULT 'pago',
                valor DECIMAL(10,2) NOT NULL DEFAULT 0,
                moeda VARCHAR(10) NOT NULL DEFAULT 'BRL',
                periodo VARCHAR(30) DEFAULT NULL,
                limite_telas INT DEFAULT NULL,
                status VARCHAR(30) NOT NULL DEFAULT 'pendente',
                gateway VARCHAR(30) DEFAULT NULL,
                gateway_ref VARCHAR(120) DEFAULT NULL,
                url_pagamento VARCHAR(500) DEFAULT NULL,
                data_inicio DATETIME DEFAULT NULL,
                data_fim DATETIME DEFAULT NULL,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_assinaturas_usuario (usuario_id),
                INDEX idx_assinaturas_ref (gateway_ref)
            )");
        } catch (\Throwable $e) {
            // Tabela já existe ou sem permissão - deixamos a query seguinte acusar
        }
    }

    /** Data de fim da assinatura a partir do período (mensal, trimestral, semestral, anual). */
    public static function dataFimPorPeriodo(string $periodo): string
    {
        $base = strtotime('+1 month');
        if ($periodo === 'anual') {
            $base = strtotime('+1 year');
        } elseif ($periodo === 'semestral') {
            $base = strtotime('+6 months');
        } elseif ($periodo === 'trimestral') {
            $base = strtotime('+3 months');
        }
        return date('Y-m-d H:i:s', $base);
    }

    /** Converte o id do plano do catálogo para o valor de usuarios.plano ('gratis'|'pago'). */
    public static function planoUsuario(string $planoId): string
    {
        return $planoId === 'gratuito' ? 'gratis' : 'pago';
    }
}
