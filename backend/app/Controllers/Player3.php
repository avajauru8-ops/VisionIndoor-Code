<?php

namespace App\Controllers;

use CodeIgniter\Controller;

/**
 * API de compatibilidade com o player Android "Adeus Pendrive" (player3).
 *
 * Endpoints (mesmo formato do player original em XML):
 *   GET|POST /3_12/xml/{deviceKey}            -> documento principal (config + timeline)
 *   GET      /3_12/generatecode/{deviceKey}   -> <code>XXXXX</code> (código curto de ativação)
 *   POST     /3_12/getonlinecommand2/{dev}    -> <command>...</command> (comando pendente + heartbeat)
 *   POST     /3_12/putonlinecommand2/{dev}    -> confirmação de status
 *   POST     /3_12/putonlinelog/{dev}         -> log do player
 *   POST     /3_12/putscreenshot/{dev}        -> screenshot PNG
 *
 * O deviceKey do app é um MD5 hex de 32 caracteres. Se o totem ainda não existe
 * no painel, ele é criado automaticamente como "pendente" com um código curto de
 * 5 caracteres (codigo_curto). A ativação acontece quando o painel vincula uma
 * lista de reprodução a esse totem — aí o XML passa a virar ativacao="1".
 */
class Player3 extends Controller
{
    /** deviceKey em processamento nesta requisição. */
    private $deviceKey = '';

    private static $schemaChecked = false;

    // ================================================================ XML

    public function xml($key = null)
    {
        return $this->mainXml($key);
    }

    public function xmlPost($key = null)
    {
        return $this->mainXml($key);
    }

    private function mainXml($key = null)
    {
        date_default_timezone_set('America/Sao_Paulo');
        $this->deviceKey = $this->cleanKey($key);

        $resp = $this->response->setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
            ->setHeader('Pragma', 'no-cache')
            ->setContentType('text/xml; charset=utf-8');

        if ($this->deviceKey === '') {
            return $resp->setBody('<?xml version="1.0" encoding="UTF-8"?><player><config codigo="" codigo_curto="" ativacao=""/></player>');
        }

        try {
            $db = \Config\Database::connect();
            $this->ensureSchema($db);

            $totem = $this->findTotem($db, true);

            if (!$totem) {
                // Cria totem pendente com código curto
                $code = $this->createPendingTotem($db);
                $totem = $this->findTotem($db, false);
                if (!$totem) {
                    return $resp->setBody('<?xml version="1.0" encoding="UTF-8"?><player><config codigo="" codigo_curto="' . $code . '" ativacao=""/></player>');
                }
            }

            // Info de hardware enviada pelo app na query do XML
            $versao = (string) $this->request->getGet('versao_app');
            $resX = (string) $this->request->getGet('resolucao_x');
            $resY = (string) $this->request->getGet('resolucao_y');
            $osTipo = (string) $this->request->getGet('os_tipo');
            if ($versao !== '' || $resX !== '') {
                $db->table('totens')->where('id', $totem['id'])->update([
                    'versao_app' => $versao !== '' ? $versao : null,
                    'resolucao' => $resX !== '' ? ($resX . 'x' . $resY) : null,
                    'sistema_operacional' => $osTipo !== '' ? ucfirst($osTipo) : null,
                ]);
            }

            $vinculado = false;
            $listaInvalida = false;
            if (!empty($totem['playlist_id'])) {
                $lista = $db->table('playlists')->where('id', $totem['playlist_id'])->get()->getRowArray();
                if (!$lista) {
                    $listaInvalida = true;
                } elseif (!empty($lista['usuario_id']) && !empty($totem['usuario_id'])
                    && (string) $lista['usuario_id'] !== (string) $totem['usuario_id']) {
                    $listaInvalida = true;
                }
                if ($listaInvalida) {
                    $db->table('totens')->where('id', $totem['id'])->update(['playlist_id' => null]);
                    $totem['playlist_id'] = null;
                } else {
                    $vinculado = true;
                }
            }

            // Ativação para o app: tela vinculada ao usuário (mesmo sem playlist
            // ainda) OU com playlist válida. Sem playlist o app mostra
            // "Aguardando lista de reprodução" em vez da tela de código.
            if (isset($totem['vinculado']) && (int) $totem['vinculado'] === 1) {
                $vinculado = true;
            }

            $items = $vinculado ? $this->buildTimelineItems($db, $totem) : [];

            $xml = $this->renderXml($totem, $items, $vinculado);
            return $resp->setBody($xml);
        } catch (\Exception $e) {
            log_message('error', 'Player3.xml: ' . $e->getMessage());
            return $resp->setBody('<?xml version="1.0" encoding="UTF-8"?><player><config codigo="" codigo_curto="" ativacao=""/></player>');
        }
    }

    // ======================================================== GENERATECODE

    public function generatecode($key = null)
    {
        date_default_timezone_set('America/Sao_Paulo');
        $this->deviceKey = $this->cleanKey($key);

        $resp = $this->response->setHeader('Cache-Control', 'no-store')
            ->setContentType('text/xml; charset=utf-8');

        if ($this->deviceKey === '') {
            return $resp->setBody('<?xml version="1.0" encoding="UTF-8"?><response><code></code></response>');
        }

        try {
            $db = \Config\Database::connect();
            $this->ensureSchema($db);

            $totem = $this->findTotem($db, true);
            if (!$totem) {
                $code = $this->createPendingTotem($db);
            } elseif (empty($totem['codigo_curto'])) {
                $code = $this->generateShortCode($db);
                $db->table('totens')->where('id', $totem['id'])->update([
                    'codigo_curto' => $code,
                    'ultima_sincronizacao' => date('Y-m-d H:i:s'),
                ]);
            } else {
                $code = $totem['codigo_curto'];
            }

            return $resp->setBody('<?xml version="1.0" encoding="UTF-8"?><response><code>' . $code . '</code></response>');
        } catch (\Exception $e) {
            log_message('error', 'Player3.generatecode: ' . $e->getMessage());
            return $resp->setBody('<?xml version="1.0" encoding="UTF-8"?><response><code></code></response>');
        }
    }

    // ============================================================ COMANDOS

    /** getonlinecommand2: heartbeat + devolve comando pendente. */
    public function getCommand($key = null)
    {
        date_default_timezone_set('America/Sao_Paulo');
        $this->deviceKey = $this->cleanKey($key);
        $resp = $this->response->setContentType('text/xml; charset=utf-8');

        try {
            $db = \Config\Database::connect();
            $this->ensureSchema($db);
            $totem = $this->findTotem($db, true);

            if (!$totem) {
                return $resp->setBody('<?xml version="1.0" encoding="UTF-8"?><response></response>');
            }

            // Heartbeat: atualiza status da tela no painel
            $statusApp = (string) $this->request->getPost('status');
            $db->table('totens')->where('id', $totem['id'])->update([
                'ultima_sincronizacao' => date('Y-m-d H:i:s'),
                'ultima_informacao' => $statusApp !== '' ? $statusApp : ($totem['ultima_informacao'] ?? null),
                'status' => 'FUNCIONANDO CORRETAMENTE',
            ]);

            $comando = null;
            if (!empty($totem['comando_acao'])) {
                $comando = $this->mapCommand($totem['comando_acao']);
                $db->table('totens')->where('id', $totem['id'])->update([
                    'comando_acao' => null,
                    'comando_id' => null,
                ]);
            }

            if ($comando !== null && $comando !== '') {
                return $resp->setBody('<?xml version="1.0" encoding="UTF-8"?><response><command>' . $comando . '</command></response>');
            }

            return $resp->setBody('<?xml version="1.0" encoding="UTF-8"?><response></response>');
        } catch (\Exception $e) {
            log_message('error', 'Player3.getCommand: ' . $e->getMessage());
            return $resp->setBody('<?xml version="1.0" encoding="UTF-8"?><response></response>');
        }
    }

    /** putonlinecommand2: o app confirma status/comando executado. */
    public function putCommand($key = null)
    {
        date_default_timezone_set('America/Sao_Paulo');
        $this->deviceKey = $this->cleanKey($key);

        try {
            $db = \Config\Database::connect();
            $this->ensureSchema($db);
            $totem = $this->findTotem($db, true);
            if ($totem) {
                $command = (string) $this->request->getPost('command');
                $status = (string) $this->request->getPost('status');
                $update = ['ultima_sincronizacao' => date('Y-m-d H:i:s')];
                if ($command === 'online' && $status !== '') {
                    $update['ultima_informacao'] = $status;
                    $update['status'] = 'FUNCIONANDO CORRETAMENTE';
                }
                $db->table('totens')->where('id', $totem['id'])->update($update);
            }
            return $this->response->setContentType('text/xml; charset=utf-8')
                ->setBody('<?xml version="1.0" encoding="UTF-8"?><response><ok>1</ok></response>');
        } catch (\Exception $e) {
            log_message('error', 'Player3.putCommand: ' . $e->getMessage());
            return $this->response->setContentType('text/xml; charset=utf-8')
                ->setBody('<?xml version="1.0" encoding="UTF-8"?><response></response>');
        }
    }

    /** putonlinelog: guarda os logs do player. "tocando-<tipo>|<titulo>" vira exibição no relatório. */
    public function putLog($key = null)
    {
        date_default_timezone_set('America/Sao_Paulo');
        $this->deviceKey = $this->cleanKey($key);

        try {
            $db = \Config\Database::connect();
            $this->ensureSchema($db);
            $totem = $this->findTotem($db, true);
            $payload = (string) $this->request->getPost('log');
            $command = (string) $this->request->getPost('command');

            if ($totem) {
                $db->table('totens')->where('id', $totem['id'])->update([
                    'ultima_sincronizacao' => date('Y-m-d H:i:s'),
                ]);
                $db->table('player_logs')->insert([
                    'totem_id' => $totem['id'],
                    'device_key' => $this->deviceKey,
                    'log' => substr($payload, 0, 4000),
                    'command' => substr($command, 0, 200),
                ]);

                // Log de exibição: "tocando-video|NOME", "tocando-imagem|NOME", "tocando-widget|NOME"
                if (preg_match('/^tocando-(video|imagem|widget)\|(.+)$/s', $command, $m)) {
                    try {
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
                        $db->table('relatorio_exibicao')->insert([
                            'totem_id' => (int) $totem['id'],
                            'titulo' => substr(trim($m[2]), 0, 500),
                            'tipo_midia' => $m[1],
                            'hora_exibicao' => date('H:i:s'),
                            'data_exibicao' => date('Y-m-d'),
                        ]);
                    } catch (\Throwable $e) {
                        log_message('error', 'Player3.putLog.exibicao: ' . $e->getMessage());
                    }
                }
            }

            return $this->response->setContentType('text/xml; charset=utf-8')
                ->setBody('<?xml version="1.0" encoding="UTF-8"?><response><ok>1</ok></response>');
        } catch (\Exception $e) {
            log_message('error', 'Player3.putLog: ' . $e->getMessage());
            return $this->response->setContentType('text/xml; charset=utf-8')
                ->setBody('<?xml version="1.0" encoding="UTF-8"?><response></response>');
        }
    }

    /** putscreenshot: recebe PNG binário e salva em writable/uploads/screenshots. */
    public function putScreenshot($key = null)
    {
        date_default_timezone_set('America/Sao_Paulo');
        $this->deviceKey = $this->cleanKey($key);

        try {
            $db = \Config\Database::connect();
            $this->ensureSchema($db);
            $totem = $this->findTotem($db, true);

            $bytes = $this->request->getBody();
            if ($bytes && strlen($bytes) > 100) {
                $dir = WRITEPATH . 'uploads/screenshots';
                if (!is_dir($dir)) {
                    @mkdir($dir, 0775, true);
                }
                $file = $dir . '/' . ($this->deviceKey !== '' ? $this->deviceKey : 'desconhecido') . '.png';
                file_put_contents($file, $bytes);
                if ($totem) {
                    $db->table('totens')->where('id', $totem['id'])->update([
                        'screenshot_path' => 'screenshots/' . basename($file),
                        'ultima_sincronizacao' => date('Y-m-d H:i:s'),
                    ]);
                }
            } elseif ($totem) {
                $db->table('totens')->where('id', $totem['id'])->update([
                    'ultima_sincronizacao' => date('Y-m-d H:i:s'),
                ]);
            }

            return $this->response->setContentType('text/xml; charset=utf-8')
                ->setBody('<?xml version="1.0" encoding="UTF-8"?><response><ok>1</ok></response>');
        } catch (\Exception $e) {
            log_message('error', 'Player3.putScreenshot: ' . $e->getMessage());
            return $this->response->setContentType('text/xml; charset=utf-8')
                ->setBody('<?xml version="1.0" encoding="UTF-8"?><response></response>');
        }
    }

    // ============================================================== helpers

    private function cleanKey($key): string
    {
        $key = trim((string) $key);
        if ($key === '' || strlen($key) > 64) {
            return '';
        }
        return $key;
    }

    /**
     * Busca o totem por device_id OU pelo código curto (permite que o painel
     * vincule uma TV digitando o código mostrado na tela).
     * O app envia deviceKey como sufixo de rota e também em query/post.
     */
    private function findTotem($db, bool $touchSync)
    {
        $keys = [$this->deviceKey];
        $qKey = (string) ($this->request->getPost('device_key') ?? $this->request->getGet('device_key'));
        if ($qKey !== '') {
            $keys[] = $qKey;
        }
        $qDev = (string) ($this->request->getPost('device_id') ?? $this->request->getGet('device_id'));
        if ($qDev !== '') {
            $keys[] = $qDev;
        }

        // 1) device_id exato (a chave do app é MD5 hex — comparar sem "normalizar")
        foreach ($keys as $k) {
            $row = $db->table('totens')
                ->where('LOWER(device_id)', strtolower($k))
                ->get()->getRowArray();
            if ($row) {
                if ($touchSync) {
                    $db->table('totens')->where('id', $row['id'])
                        ->update(['ultima_sincronizacao' => date('Y-m-d H:i:s')]);
                }
                return $row;
            }
        }

        // 2) fallback: normalização visual (O/0, I/1, l/1) para códigos digitados à mão
        $norm = static function (string $v): string {
            return strtolower(str_replace(['O', 'o', 'I', 'l'], ['0', '0', '1', '1'], $v));
        };
        $normQuery = 'LOWER(REPLACE(REPLACE(REPLACE(REPLACE(device_id, "O", "0"), "o", "0"), "I", "1"), "l", "1"))';
        foreach ($keys as $k) {
            $row = $db->table('totens')
                ->where($normQuery, $norm($k))
                ->get()->getRowArray();
            if ($row) {
                if ($touchSync) {
                    $db->table('totens')->where('id', $row['id'])
                        ->update(['ultima_sincronizacao' => date('Y-m-d H:i:s')]);
                }
                return $row;
            }
        }

        // 2) código curto (5 letras mostradas na TV)
        foreach ($keys as $k) {
            if (strlen($k) === 5) {
                $row = $db->table('totens')
                    ->where('UPPER(codigo_curto)', strtoupper($k))
                    ->get()->getRowArray();
                if ($row) {
                    if ($touchSync) {
                        $db->table('totens')->where('id', $row['id'])
                            ->update(['ultima_sincronizacao' => date('Y-m-d H:i:s')]);
                    }
                    return $row;
                }
            }
        }

        return null;
    }

    private function generateShortCode($db): string
    {
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        for ($i = 0; $i < 50; $i++) {
            $code = '';
            for ($j = 0; $j < 5; $j++) {
                $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
            }
            $exists = $db->table('totens')->where('codigo_curto', $code)->countAllResults();
            if (!$exists) {
                return $code;
            }
        }
        return substr(strtoupper(md5(uniqid('', true))), 0, 5);
    }

    /** Cria totem pendente vinculado ao admin principal; retorna o código. */
    private function createPendingTotem($db): string
    {
        $code = $this->generateShortCode($db);
        $ownerId = $this->resolveOwnerId($db);
        $db->table('totens')->insert([
            'nome' => 'TV Android ' . $code . ' - ' . date('d/m/Y'),
            'device_id' => $this->deviceKey,
            'codigo_curto' => $code,
            'usuario_id' => $ownerId,
            'status' => 'offline',
            'ultima_sincronizacao' => date('Y-m-d H:i:s'),
        ]);
        return $code;
    }

    /** Usuário que receberá as TVs pendentes: admin mais antigo (fallback: menor id). */
    private function resolveOwnerId($db)
    {
        try {
            $cols = $db->getFieldNames('usuarios') ?: [];
            $hasNivel = in_array('nivel', $cols);
            $builder = $db->table('usuarios')->select('id');
            if ($hasNivel) {
                $builder->where('nivel', 'admin');
            }
            $admin = $builder->orderBy('id', 'ASC')->limit(1)->get()->getRowArray();
            if ($admin) {
                return (int) $admin['id'];
            }
        } catch (\Exception $e) {
            // ignora, usa fallback
        }
        return 1;
    }

    /** Colunas/tabela extras do player3 (lazy migration). */
    private function ensureSchema($db)
    {
        if (self::$schemaChecked) {
            return;
        }
        self::$schemaChecked = true;

        try {
            $cols = $db->getFieldNames('totens');
            if (!in_array('codigo_curto', $cols)) {
                $db->query("ALTER TABLE totens ADD COLUMN codigo_curto VARCHAR(10) DEFAULT NULL");
            }
            if (!in_array('screenshot_path', $cols)) {
                $db->query("ALTER TABLE totens ADD COLUMN screenshot_path VARCHAR(255) DEFAULT NULL");
            }
            if (!in_array('vinculado', $cols)) {
                $db->query("ALTER TABLE totens ADD COLUMN vinculado TINYINT(1) DEFAULT 0");
                // Telas que já possuem playlist eram vinculadas no modelo antigo
                $db->query("UPDATE totens SET vinculado = 1 WHERE playlist_id IS NOT NULL");
            }
        } catch (\Exception $e) {
            // ignora (coluna já existe / sem permissão)
        }

        try {
            $db->query("CREATE TABLE IF NOT EXISTS player_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                totem_id INT DEFAULT NULL,
                device_key VARCHAR(64) DEFAULT NULL,
                log TEXT DEFAULT NULL,
                command VARCHAR(200) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )");
        } catch (\Exception $e) {
            // ignora
        }
    }

    /** Comandos do painel -> comandos aceitos pelo app Android. */
    private function mapCommand(string $panelCommand): string
    {
        $cmd = strtolower(trim($panelCommand));
        $map = [
            'reiniciar' => 'restartapp',
            'reiniciar_app' => 'restartapp',
            'reiniciar_tv' => 'restartapp',
            'reiniciar_totem' => 'restartapp',
            'limpar_cache' => 'clearcache',
            'limpar_dados' => 'restartall',
            'formatar' => 'restartall',
            'capturar_tela' => 'screenshot',
            'atualizar_lista' => 'updatexml',
            'atualizar' => 'updatexml',
        ];
        return $map[$cmd] ?? $cmd;
    }

    /** Monta os itens de timeline a partir da lista vinculada ao totem. */
    private function buildTimelineItems($db, array $totem): array
    {
        $now = date('Y-m-d H:i:s');
        $items = [];

        $hasWcCol = in_array('widget_config', $db->getFieldNames('playlist_itens') ?: []);
        $wcSelect = $hasWcCol ? ', pi.widget_config' : '';

        $itensLista = $db->table('playlist_itens pi')
            ->select("c.*, pi.tempo_exibicao as tempo_exibicao_lista, pi.widget_nome{$wcSelect}, pi.ordem")
            ->join('campanhas c', 'c.id = pi.campanha_id', 'left')
            ->where('pi.playlist_id', $totem['playlist_id'])
            ->orderBy('pi.ordem', 'ASC')
            ->get()->getResultArray();

        $baseUrl = rtrim(base_url(), '/');
        $audioGlobal = !isset($totem['audio_ligado']) || $totem['audio_ligado'] ? '1' : '0';

        // Rotação configurada na tela (totem): padrao|90|180|270
        $rotacao = 0;
        if (isset($totem['rotacao']) && preg_match('/^(90|180|270)$/', (string) $totem['rotacao'])) {
            $rotacao = (int) $totem['rotacao'];
        }

        foreach ($itensLista as $item) {
            // Widget da lista (novo modelo): widget_nome pode vir com query, ex "clima?cidade=Serra&estado=ES"
            $widgetNome = trim((string) ($item['widget_nome'] ?? ''));
            $widgetUrl = null;
            if ($widgetNome !== '') {
                $widgetUrl = $baseUrl . '/widget/' . $widgetNome
                    . (strpos($widgetNome, '?') !== false ? '&' : '?')
                    . 'device_id=' . urlencode($this->deviceKey);
                if (!empty($item['widget_config'])) {
                    $widgetUrl .= '&widget_config=' . urlencode(base64_encode($item['widget_config']));
                }
                $items[] = $this->itemXml('webview', $widgetUrl, (int) ($item['tempo_exibicao_lista'] ?? 15), $audioGlobal, $item, $rotacao);
                continue;
            }

            if (empty($item['id']) || empty($item['arquivo_url'])) {
                continue;
            }
            if (isset($item['ativo']) && !$item['ativo']) {
                continue;
            }

            // Janelas de agendamento
            $ag = isset($item['agendamentos']) && $item['agendamentos'] ? json_decode($item['agendamentos'], true) : null;
            if (is_array($ag) && $ag) {
                $ativo = false;
                foreach ($ag as $j) {
                    $j = (array) $j;
                    $ini = !empty($j['inicio']) ? str_replace('T', ' ', $j['inicio']) : null;
                    $fim = !empty($j['fim']) ? str_replace('T', ' ', $j['fim']) : null;
                    if ((!$ini || $now >= $ini) && (!$fim || $now <= $fim)) {
                        $ativo = true;
                        break;
                    }
                }
                if (!$ativo) {
                    continue;
                }
            } else {
                if (!empty($item['data_inicio']) && $item['data_inicio'] > $now) {
                    continue;
                }
                if (!empty($item['data_fim']) && $item['data_fim'] < $now) {
                    continue;
                }
            }

            $url = $item['arquivo_url'];
            $tipo = strtolower((string) ($item['tipo_midia'] ?? ''));

            // Campanha legada apontando para widget: /widget/noticias?feed=...
            if (strpos($url, '/widget/') === 0) {
                $widgetUrl = $baseUrl . $url
                    . (strpos($url, '?') !== false ? '&' : '?')
                    . 'device_id=' . urlencode($this->deviceKey);
                $tempo = (int) ($item['tempo_exibicao_lista'] ?? $item['tempo_exibicao'] ?? 15);
                if ($tempo <= 0) {
                    $tempo = 15;
                }
                $items[] = $this->itemXml('webview', $widgetUrl, $tempo, $audioGlobal, $item, $rotacao);
                continue;
            }

            if (!preg_match('/^https?:\/\//', $url)) {
                $url = $baseUrl . '/uploads/' . ltrim($url, '/');
            }

            $tempo = (int) ($item['tempo_exibicao_lista'] ?? $item['tempo_exibicao'] ?? 15);
            if ($tempo <= 0) {
                $tempo = 15;
            }

            $ext = strtolower(pathinfo(parse_url($url, PHP_URL_PATH) ?? '', PATHINFO_EXTENSION));
            $isImageExt = in_array($ext, ['png', 'jpg', 'jpeg', 'webp', 'bmp'], true);
            $isGif = $ext === 'gif';
            $isVideoExt = in_array($ext, ['mp4', 'webm', 'mkv', 'mov', 'avi', 'm4v', 'flv', '3gp'], true);
            $isYoutube = (bool) preg_match('/youtube\.com|youtu\.be/i', $url);

            if ($isImageExt || $tipo === 'imagem') {
                $type = $isGif ? 'gif' : 'imagem';
            } elseif ($isGif) {
                $type = 'gif';
            } elseif ($isVideoExt || ($tipo === 'video' && !$isYoutube)) {
                $type = 'video';
            } else {
                // youtube, streaming, html, url, rss, tipo desconhecido -> webview
                $type = 'webview';
            }

            // video roda até o fim (cap 10 min no app); imagem/gif/webview usam o tempo da lista
            $length = $type === 'video' ? 0 : $tempo;
            $items[] = $this->itemXml($type, $url, $length, $audioGlobal, $item, $rotacao);
        }

        return $items;
    }

    private function itemXml(string $type, string $url, int $length, string $audio, array $src, int $rotation = 0): string
    {
        $cat = 'gm';
        $cacheName = $type === 'imagem' || $type === 'gif'
            ? 'i' . substr(md5($url), 0, 10) . '_' . preg_replace('/[^A-Za-z0-9._-]/', '_', basename(parse_url($url, PHP_URL_PATH) ?? 'file'))
            : '';

        return '<item type="' . $type . '"'
            . ' hash="' . htmlspecialchars(substr(md5($url), 0, 12)) . '"'
            . ' name="' . htmlspecialchars((string) ($src['titulo'] ?? 'midia')) . '"'
            . ' cat="' . $cat . '"'
            . ' cachename="' . htmlspecialchars($cacheName) . '"'
            . ' resource="' . htmlspecialchars($url) . '"'
            . ' length="' . $length . '"'
            . ' audio="' . $audio . '"'
            . ' rotation="' . $rotation . '"'
            . ' md5=""'
            . ' />';
    }

    private function renderXml(array $totem, array $items, bool $vinculado): string
    {
        $codigo = $vinculado ? $this->deviceKey : '';
        $codigoCurto = (string) ($totem['codigo_curto'] ?? '');
        if ($codigoCurto === '') {
            $codigoCurto = $this->generateShortCode(\Config\Database::connect());
            \Config\Database::connect()->table('totens')
                ->where('id', $totem['id'])->update(['codigo_curto' => $codigoCurto]);
        }
        $ativacao = $vinculado ? '1' : '';
        $bgColor = '#000000';
        $audio = !isset($totem['audio_ligado']) || $totem['audio_ligado'] ? '1' : '0';
        $freq = 60;
        $orientacao = (isset($totem['rotacao']) && in_array((string) $totem['rotacao'], ['90', '270'], true))
            ? 'vertical' : 'horizontal';

        // Atualização do app cadastrada no painel do administrador
        $updVersao = '';
        $updUrl = '';
        $updDesc = '';
        try {
            $dbUpd = \Config\Database::connect();
            if ($dbUpd->query("SHOW TABLES LIKE 'app_updates'")->getRow()) {
                $upd = $dbUpd->table('app_updates')->where('ativo', 1)->orderBy('id', 'DESC')->get(1, 0)->getRowArray();
                if ($upd) {
                    $updVersao = (string) ($upd['versao'] ?? '');
                    $updUrl = (string) ($upd['arquivo_url'] ?? '');
                    $updDesc = (string) ($upd['descricao'] ?? '');
                }
            }
        } catch (\Exception $e) {
        }

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'
            . '<player>'
            . '<config'
            . ' codigo="' . htmlspecialchars($codigo) . '"'
            . ' codigo_curto="' . htmlspecialchars($codigoCurto) . '"'
            . ' ativacao="' . $ativacao . '"'
            . ' lang="pt-br"'
            . ' bgcolor="' . $bgColor . '"'
            . ' bgcoloropacity="1"'
            . ' textcolor="#FFFFFF"'
            . ' orientacao="' . $orientacao . '"'
            . ' transicoes="fade"'
            . ' contentscalemode="fit"'
            . ' updatexmlfrequencymode="' . $freq . '"'
            . ' audio="' . $audio . '"'
            . ' usarwebview="1"'
            . ' app_atualizacao="' . htmlspecialchars($updVersao) . '"'
            . ' app_atualizacao_url="' . htmlspecialchars($updUrl) . '"'
            . ' app_atualizacao_desc="' . htmlspecialchars($updDesc) . '"'
            . '/>'
            . '<timeline><items>';
        foreach ($items as $itemXml) {
            $xml .= $itemXml;
        }
        $xml .= '</items></timeline></player>';
        return $xml;
    }
}
