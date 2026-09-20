<?php

namespace App\Controllers;

use CodeIgniter\RESTful\ResourceController;

class Relatorios extends ResourceController
{
    public function index()
    {
        try {
            $db = \Config\Database::connect();
            $user_id = $this->request->getHeaderLine('X-User-Id');
            $nivel = $this->request->getHeaderLine('X-User-Nivel');
            $dataInicio = $this->request->getGet('data_inicio') ?? date('Y-m-01');
            $dataFim = $this->request->getGet('data_fim') ?? date('Y-m-t');

            // Garante que a tabela existe
            $this->ensureTable($db);

            // 1. Resumo geral
            $totensBuilder = $db->table('totens');
            if ($nivel !== 'admin') {
                $totensBuilder->where('usuario_id', $user_id);
            }
            $totalTelas = $totensBuilder->countAllResults(false);

            $online = 0;
            $offline = 0;
            $totens = $totensBuilder->get()->getResultArray();
            foreach ($totens as $t) {
                if (!empty($t['ultima_sincronizacao'])) {
                    $lastSync = new \DateTime($t['ultima_sincronizacao']);
                    $now = new \DateTime();
                    $diff = $now->getTimestamp() - $lastSync->getTimestamp();
                    if ($diff < 300) $online++;
                    else $offline++;
                }
            }

            // 2. Total de exibições no período
            $exibBuilder = $db->table('relatorio_exibicao r');
            $exibBuilder->select('COUNT(*) as total_exibicoes');
            $exibBuilder->where('r.data_exibicao >=', $dataInicio);
            $exibBuilder->where('r.data_exibicao <=', $dataFim);
            if ($nivel !== 'admin') {
                $exibBuilder->join('totens t', 't.id = r.totem_id', 'left');
                $exibBuilder->where('t.usuario_id', $user_id);
            }
            $totalExibicoes = $exibBuilder->get()->getRowArray()['total_exibicoes'] ?? 0;

            // 3. Top mídias mais exibidas
            $topMidias = $db->table('relatorio_exibicao r')
                ->select('r.titulo, r.tipo_midia, COUNT(*) as exibicoes')
                ->where('r.data_exibicao >=', $dataInicio)
                ->where('r.data_exibicao <=', $dataFim)
                ->groupBy('r.titulo')
                ->orderBy('exibicoes', 'DESC')
                ->limit(10);

            if ($nivel !== 'admin') {
                $topMidias->join('totens t', 't.id = r.totem_id', 'left');
                $topMidias->where('t.usuario_id', $user_id);
            }
            $topMidias = $topMidias->get()->getResultArray();

            // 4. Exibições por tela
            $porTela = $db->table('relatorio_exibicao r')
                ->select('t.nome as totem_nome, COUNT(*) as exibicoes')
                ->join('totens t', 't.id = r.totem_id', 'left')
                ->where('r.data_exibicao >=', $dataInicio)
                ->where('r.data_exibicao <=', $dataFim)
                ->groupBy('r.totem_id')
                ->orderBy('exibicoes', 'DESC');

            if ($nivel !== 'admin') {
                $porTela->where('t.usuario_id', $user_id);
            }
            $porTela = $porTela->get()->getResultArray();

            // 5. Exibições por tipo de mídia
            $porTipo = $db->table('relatorio_exibicao r')
                ->select('r.tipo_midia, COUNT(*) as exibicoes')
                ->where('r.data_exibicao >=', $dataInicio)
                ->where('r.data_exibicao <=', $dataFim)
                ->groupBy('r.tipo_midia')
                ->orderBy('exibicoes', 'DESC');

            if ($nivel !== 'admin') {
                $porTipo->join('totens t', 't.id = r.totem_id', 'left');
                $porTipo->where('t.usuario_id', $user_id);
            }
            $porTipo = $porTipo->get()->getResultArray();

            // 6. Exibições por dia (gráfico)
            $porDia = $db->table('relatorio_exibicao r')
                ->select('r.data_exibicao, COUNT(*) as exibicoes')
                ->where('r.data_exibicao >=', $dataInicio)
                ->where('r.data_exibicao <=', $dataFim)
                ->groupBy('r.data_exibicao')
                ->orderBy('r.data_exibicao', 'ASC');

            if ($nivel !== 'admin') {
                $porDia->join('totens t', 't.id = r.totem_id', 'left');
                $porDia->where('t.usuario_id', $user_id);
            }
            $porDia = $porDia->get()->getResultArray();

            // 7. Top playlists
            $topPlaylists = $db->table('relatorio_exibicao r')
                ->select('r.playlist_nome, COUNT(*) as exibicoes')
                ->where('r.data_exibicao >=', $dataInicio)
                ->where('r.data_exibicao <=', $dataFim)
                ->where('r.playlist_nome IS NOT NULL')
                ->where('r.playlist_nome !=', '')
                ->groupBy('r.playlist_nome')
                ->orderBy('exibicoes', 'DESC')
                ->limit(10);

            if ($nivel !== 'admin') {
                $topPlaylists->join('totens t', 't.id = r.totem_id', 'left');
                $topPlaylists->where('t.usuario_id', $user_id);
            }
            $topPlaylists = $topPlaylists->get()->getResultArray();

            // 8. Log detalhado recente
            $logs = $db->table('relatorio_exibicao r')
                ->select('r.*, t.nome as totem_nome')
                ->join('totens t', 't.id = r.totem_id', 'left')
                ->where('r.data_exibicao >=', $dataInicio)
                ->where('r.data_exibicao <=', $dataFim)
                ->orderBy('r.data_exibicao DESC, r.hora_exibicao DESC')
                ->limit(100);

            if ($nivel !== 'admin') {
                $logs->where('t.usuario_id', $user_id);
            }
            $logs = $logs->get()->getResultArray();

            return $this->respond([
                'resumo' => [
                    'total_telas' => $totalTelas,
                    'telas_online' => $online,
                    'telas_offline' => $offline,
                    'total_exibicoes' => (int)$totalExibicoes,
                    'periodo_inicio' => $dataInicio,
                    'periodo_fim' => $dataFim
                ],
                'top_midias' => $topMidias,
                'por_tela' => $porTela,
                'por_tipo' => $porTipo,
                'por_dia' => $porDia,
                'top_playlists' => $topPlaylists,
                'logs' => $logs
            ]);
        } catch (\Exception $e) {
            return $this->response->setJSON(['error' => $e->getMessage()])->setStatusCode(500);
        }
    }

    private function ensureTable($db)
    {
        $db->query("CREATE TABLE IF NOT EXISTS relatorio_exibicao (
            id INT AUTO_INCREMENT PRIMARY KEY,
            totem_id INT NOT NULL,
            campanha_id INT DEFAULT NULL,
            playlist_id INT DEFAULT NULL,
            playlist_nome VARCHAR(255) DEFAULT NULL,
            titulo VARCHAR(500) DEFAULT NULL,
            tipo_midia VARCHAR(50) DEFAULT NULL,
            hora_exibicao TIME DEFAULT NULL,
            data_exibicao DATE DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )");
    }
}
