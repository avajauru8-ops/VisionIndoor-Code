<?php

namespace App\Controllers;

use CodeIgniter\RESTful\ResourceController;

class Playlists extends ResourceController
{
    public function index()
    {
        try {
            $db = \Config\Database::connect();
            $this->ensureCampanhasCols($db);
            $user_id = $this->request->getHeaderLine('X-User-Id');
            $nivel = $this->request->getHeaderLine('X-User-Nivel');
            
            $builder = $db->table('campanhas');
            
            if ($nivel !== 'admin') {
                $builder->where('usuario_id', $user_id);
            }
            
            $playlists = $builder->get()->getResultArray();
            
            // Formata os campos
            foreach ($playlists as &$p) {
                $p['id'] = (string)$p['id'];
                $p['totem_id'] = $p['totem_id'] ? (string)$p['totem_id'] : null;
                
                // Formatar as datas para o padrão ISO que o JavaScript/React entende nativamente
                if (!empty($p['data_inicio'])) $p['data_inicio'] = str_replace(' ', 'T', $p['data_inicio']);
                if (!empty($p['data_fim'])) $p['data_fim'] = str_replace(' ', 'T', $p['data_fim']);

                $p['etiquetas'] = json_decode($p['etiquetas'] ?? 'null', true) ?: [];
                $p['janelas'] = self::janelasDe($p);
                unset($p['agendamentos']);
                
                $url = $p['arquivo_url'];
                if ($url && !preg_match('/^https?:\/\//', $url)) {
                    if (strpos($url, '/widget/') === 0) {
                        $p['arquivo_url'] = rtrim(base_url(), '/') . $url; // Rota do React Frontend
                    } else {
                        $p['arquivo_url'] = base_url('uploads/' . ltrim($url, '/'));
                    }
                }
            }
            
            return $this->respond($playlists);
        } catch (\Exception $e) {
            return $this->response->setJSON(['error' => 'Erro DB/PHP: ' . $e->getMessage()])->setStatusCode(500);
        }
    }

    /** Garante as colunas novas de agendamento e etiquetas (padrão do projeto: ALTER preguiçoso). */
    private function ensureCampanhasCols($db): void
    {
        try {
            $cols = $db->getFieldNames('campanhas');
            if (!in_array('etiquetas', $cols)) {
                $db->query("ALTER TABLE campanhas ADD COLUMN etiquetas TEXT DEFAULT NULL");
            }
            if (!in_array('agendamentos', $cols)) {
                $db->query("ALTER TABLE campanhas ADD COLUMN agendamentos TEXT DEFAULT NULL");
            }
        } catch (\Throwable $e) {
            // Coluna já existe ou sem permissão; as queries seguintes acusariam
        }
    }

    /** Janelas de agendamento efetivas de um arquivo (novo modelo JSON ou janela única legada). */
    public static function janelasDe(array $row): array
    {
        $ag = json_decode($row['agendamentos'] ?? '[]', true);
        if (is_array($ag) && $ag) {
            $saida = [];
            foreach ($ag as $a) {
                $a = (array)$a;
                $saida[] = [
                    'inicio' => $a['inicio'] ?? null,
                    'fim'    => $a['fim'] ?? null,
                ];
            }
            return $saida;
        }

        $ini = $row['data_inicio'] ?? null;
        $fim = $row['data_fim'] ?? null;
        if (!empty($ini) && $ini <= '1970-01-02 00:00:00') {
            $ini = null;
        }
        if (!empty($fim) && $fim >= '2099-01-01 00:00:00') {
            $fim = null;
        }
        if (!$ini && !$fim) {
            return [];
        }
        return [['inicio' => $ini, 'fim' => $fim]];
    }

    private static function normalizaDataHora($v): string
    {
        $v = trim((string)$v);
        if ($v === '') {
            return '';
        }
        $v = str_replace('T', ' ', $v);
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $v)) {
            $v .= ' 00:00:00';
        } elseif (preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/', $v)) {
            $v .= ':00';
        }
        return substr($v, 0, 19);
    }

    /** Converte URL absoluta do próprio domínio de volta para o caminho armazenado. */
    private function normalizaUrlArmazenada(string $url): string
    {
        $base = rtrim(base_url(), '/');
        if ($base !== '' && str_starts_with($url, $base . '/uploads/')) {
            return substr($url, strlen($base . '/uploads/'));
        }
        if ($base !== '' && str_starts_with($url, $base . '/widget/')) {
            return substr($url, strlen($base));
        }
        return $url;
    }

    private function formatarUrl(?string $url): ?string
    {
        if (!$url) {
            return $url;
        }
        if (preg_match('/^https?:\/\//', $url)) {
            return $url;
        }
        if (strpos($url, '/widget/') === 0) {
            return rtrim(base_url(), '/') . $url;
        }
        return base_url('uploads/' . ltrim($url, '/'));
    }

    // GET /api/playlists/:id — detalhe do arquivo + onde ele está sendo veiculado
    public function show($id = null)
    {
        try {
            $db = \Config\Database::connect();
            $this->ensureCampanhasCols($db);
            $user_id = $this->request->getHeaderLine('X-User-Id');
            $nivel = $this->request->getHeaderLine('X-User-Nivel');

            $arquivo = $db->table('campanhas')->where('id', $id)->get()->getRowArray();
            if (!$arquivo) {
                return $this->response->setJSON(['error' => 'Arquivo não encontrado'])->setStatusCode(404);
            }
            if ($nivel !== 'admin' && $arquivo['usuario_id'] != $user_id) {
                return $this->response->setJSON(['error' => 'Acesso negado'])->setStatusCode(403);
            }

            $arquivo['id'] = (string)$arquivo['id'];
            $arquivo['arquivo_url'] = $this->formatarUrl($arquivo['arquivo_url']);
            $arquivo['etiquetas'] = json_decode($arquivo['etiquetas'] ?? 'null', true) ?: [];
            $arquivo['janelas'] = self::janelasDe($arquivo);
            unset($arquivo['agendamentos']);

            // Tamanho em disco e resolução (apenas arquivos locais)
            $arquivo['size_bytes'] = null;
            $arquivo['largura'] = null;
            $arquivo['altura'] = null;
            $arquivo['data_envio'] = null;

            $caminho = $arquivo['arquivo_url'] ?? '';
            $caminhoRelativo = $caminho && !preg_match('/^https?:\/\//', $caminho) && strpos($caminho, '/widget/') !== 0
                ? ROOTPATH . 'public/uploads/' . ltrim($caminho, '/')
                : null;

            if ($caminhoRelativo && is_file($caminhoRelativo)) {
                $arquivo['size_bytes'] = (int)filesize($caminhoRelativo);
                if (($arquivo['tipo_midia'] ?? '') === 'imagem') {
                    $info = @getimagesize($caminhoRelativo);
                    if ($info) {
                        $arquivo['largura'] = (int)$info[0];
                        $arquivo['altura'] = (int)$info[1];
                    }
                }
            }

            $cols = $db->getFieldNames('campanhas');
            $colData = in_array('created_at', $cols) ? 'created_at' : (in_array('criado_em', $cols) ? 'criado_em' : null);
            if ($colData && !empty($arquivo[$colData])) {
                $arquivo['data_envio'] = $arquivo[$colData];
            }

            // Onde o arquivo está veiculado: listas que o contêm + TVs de cada lista
            $listas = $db->table('playlists p')
                ->select('p.id, p.nome')
                ->distinct()
                ->join('playlist_itens pi', 'pi.playlist_id = p.id', 'inner')
                ->where('pi.campanha_id', $id)
                ->orderBy('p.nome', 'ASC')
                ->get()
                ->getResultArray();

            $totalTv = 0;
            foreach ($listas as &$lista) {
                $totensBuilder = $db->table('totens')
                    ->select('id, nome')
                    ->where('playlist_id', $lista['id'])
                    ->orderBy('nome', 'ASC');
                if ($nivel !== 'admin') {
                    $totensBuilder->where('usuario_id', $user_id);
                }
                $lista['totens'] = $totensBuilder->get()->getResultArray();
                foreach ($lista['totens'] as &$t) {
                    $t['id'] = (string)$t['id'];
                }
                unset($t);
                $totalTv += count($lista['totens']);
                $lista['id'] = (string)$lista['id'];
                unset($lista['usuario_id']);
            }
            unset($lista);

            return $this->response->setJSON([
                'arquivo'     => $arquivo,
                'listas'      => array_values($listas),
                'total_listas' => count($listas),
                'total_tv'    => $totalTv,
            ]);
        } catch (\Throwable $e) {
            return $this->response->setJSON(['error' => 'Erro DB/PHP: ' . $e->getMessage()])->setStatusCode(500);
        }
    }

    // GET /api/playlists/:id/estatisticas — exibições do arquivo (relatorio_exibicao)
    public function estatisticas($id = null)
    {
        try {
            $db = \Config\Database::connect();
            $user_id = $this->request->getHeaderLine('X-User-Id');
            $nivel = $this->request->getHeaderLine('X-User-Nivel');

            $arquivo = $db->table('campanhas')->where('id', $id)->get()->getRowArray();
            if (!$arquivo) {
                return $this->response->setJSON(['error' => 'Arquivo não encontrado'])->setStatusCode(404);
            }
            if ($nivel !== 'admin' && $arquivo['usuario_id'] != $user_id) {
                return $this->response->setJSON(['error' => 'Acesso negado'])->setStatusCode(403);
            }

            // Garante a tabela de log (padrão do projeto)
            $temLog = false;
            foreach ($db->listTables() as $t) {
                if ($t === 'relatorio_exibicao') {
                    $temLog = true;
                    break;
                }
            }
            if (!$temLog) {
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

            $dataInicio = $this->request->getGet('data_inicio') ?: date('Y-m-d', strtotime('-3 days'));
            $dataFim = $this->request->getGet('data_fim') ?: date('Y-m-d');
            $totemId = $this->request->getGet('totem_id');
            $listaId = $this->request->getGet('lista_id');

            $aplicaFiltros = function ($builder) use ($id, $arquivo, $dataInicio, $dataFim, $totemId, $listaId) {
                $builder->where('r.data_exibicao >=', $dataInicio);
                $builder->where('r.data_exibicao <=', $dataFim);
                $builder->groupStart();
                $builder->where('r.campanha_id', $id);
                if (!empty($arquivo['titulo'])) {
                    $builder->orWhere('r.titulo', $arquivo['titulo']);
                }
                $builder->groupEnd();
                if ($totemId !== null && $totemId !== '') {
                    $builder->where('r.totem_id', $totemId);
                }
                if ($listaId !== null && $listaId !== '') {
                    $builder->where('r.playlist_id', $listaId);
                }
            };

            $totalBuilder = $db->table('relatorio_exibicao r');
            $totalBuilder->select('COUNT(*) AS total', false);
            $aplicaFiltros($totalBuilder);
            $total = (int)($totalBuilder->get()->getRowArray()['total'] ?? 0);

            $porDiaB = $db->table('relatorio_exibicao r');
            $porDiaB->select('r.data_exibicao, COUNT(*) AS exibicoes', false);
            $aplicaFiltros($porDiaB);
            $porDia = $porDiaB->groupBy('r.data_exibicao')->orderBy('r.data_exibicao', 'ASC')->get()->getResultArray();

            $porTelaB = $db->table('relatorio_exibicao r');
            $porTelaB->select('r.totem_id, t.nome, COUNT(*) AS exibicoes', false);
            $porTelaB->join('totens t', 't.id = r.totem_id', 'left');
            $aplicaFiltros($porTelaB);
            $porTela = $porTelaB->groupBy('r.totem_id, t.nome')->orderBy('exibicoes', 'DESC')->get()->getResultArray();

            $porListaB = $db->table('relatorio_exibicao r');
            $porListaB->select('r.playlist_id, r.playlist_nome, COUNT(*) AS exibicoes', false);
            $aplicaFiltros($porListaB);
            $porLista = $porListaB->groupBy('r.playlist_id, r.playlist_nome')->orderBy('exibicoes', 'DESC')->get()->getResultArray();

            return $this->response->setJSON([
                'total'    => $total,
                'por_dia'  => $porDia,
                'por_tela' => $porTela,
                'por_lista' => $porLista,
                'periodo'  => ['data_inicio' => $dataInicio, 'data_fim' => $dataFim],
            ]);
        } catch (\Throwable $e) {
            return $this->response->setJSON(['error' => 'Erro DB/PHP: ' . $e->getMessage()])->setStatusCode(500);
        }
    }

    private function handleFileUpload($file, $allowedExtensions)
    {
        if (!$file->isValid() || $file->hasMoved()) {
            return null;
        }

        // Usa a extensão original do arquivo. getExtension() adivinha pelo MIME e
        // devolve .bin/.mpeg/.qt para vários vídeos, o que bloqueava o upload.
        $clientExt  = strtolower($file->getClientExtension());
        $guessedExt = strtolower($file->guessExtension());

        if ($clientExt !== '' && in_array('.' . $clientExt, $allowedExtensions, true)) {
            $ext = '.' . $clientExt;
        } elseif ($guessedExt !== '' && in_array('.' . $guessedExt, $allowedExtensions, true)) {
            $ext = '.' . $guessedExt;
        } else {
            throw new \RuntimeException('Tipo de arquivo não permitido: ' . ($clientExt !== '' ? '.' . $clientExt : '(sem extensão)'));
        }

        $baseName = preg_replace('/[^a-zA-Z0-9_-]+/', '_', pathinfo($file->getName(), PATHINFO_FILENAME)) ?: 'arquivo';
        $newName  = time() . '_' . $baseName . $ext;

        $file->move(ROOTPATH . 'public/uploads', $newName);

        $this->optimizeFile(ROOTPATH . 'public/uploads/' . $newName, $ext);

        return $newName;
    }

    private function uploadErrorMessage($file): string
    {
        $maxUpload = ini_get('upload_max_filesize') ?: 'desconhecido';
        $maxPost   = ini_get('post_max_size') ?: 'desconhecido';

        return match ($file->getError()) {
            UPLOAD_ERR_INI_SIZE   => "O arquivo excede o limite do servidor (upload_max_filesize = $maxUpload).",
            UPLOAD_ERR_FORM_SIZE  => 'O arquivo excede o limite permitido no formulário.',
            UPLOAD_ERR_PARTIAL    => 'O arquivo foi enviado incompleto. Tente novamente.',
            UPLOAD_ERR_NO_TMP_DIR => 'Falha no servidor: diretório temporário ausente.',
            UPLOAD_ERR_CANT_WRITE => 'Falha no servidor: não foi possível gravar o arquivo.',
            UPLOAD_ERR_EXTENSION  => 'Upload interrompido por uma extensão do servidor.',
            UPLOAD_ERR_NO_FILE    => 'Nenhum arquivo foi enviado.',
            default               => 'Erro no arquivo: ' . $file->getErrorString(),
        };
    }

    private function optimizeFile($path, $ext)
    {
        $imageExts = ['.jpg', '.jpeg', '.png', '.webp'];
        
        if (in_array(strtolower($ext), $imageExts)) {
            $this->optimizeImage($path, $ext);
        } elseif (strtolower($ext) === '.mp4') {
            $this->optimizeVideo($path);
        }
    }

    private function optimizeImage($path, $ext)
    {
        if (!function_exists('imagecreatefromjpeg') && !function_exists('imagecreatefrompng')) {
            return;
        }

        $maxWidth = 1920;
        $maxHeight = 1080;

        $info = @getimagesize($path);
        if (!$info) return;

        $origWidth = $info[0];
        $origHeight = $info[1];
        $mime = $info['mime'];

        if ($origWidth <= $maxWidth && $origHeight <= $maxHeight) {
            return;
        }

        $ratio = min($maxWidth / $origWidth, $maxHeight / $origHeight);
        $newWidth = (int)round($origWidth * $ratio);
        $newHeight = (int)round($origHeight * $ratio);

        $src = match($mime) {
            'image/jpeg' => @imagecreatefromjpeg($path),
            'image/png' => @imagecreatefrompng($path),
            'image/webp' => @imagecreatefromwebp($path),
            default => null,
        };

        if (!$src) return;

        $dst = imagecreatetruecolor($newWidth, $newHeight);
        imagecopyresampled($dst, $src, 0, 0, 0, 0, $newWidth, $newHeight, $origWidth, $origHeight);

        $extLower = strtolower($ext);
        if ($extLower === '.jpg' || $extLower === '.jpeg') {
            imagejpeg($dst, $path, 82);
        } elseif ($extLower === '.png') {
            imagepng($dst, $path, 7);
        } elseif ($extLower === '.webp') {
            if (function_exists('imagewebp')) {
                imagewebp($dst, $path, 82);
            }
        }

        imagedestroy($src);
        imagedestroy($dst);
    }

    private function optimizeVideo($path)
    {
        if (!file_exists($path)) {
            return;
        }

        // Otimização é opcional. Em hospedagem compartilhada shell_exec/exec podem
        // estar desabilitados e uma Error aqui derrubava todo upload de vídeo.
        if (!function_exists('shell_exec') || !function_exists('exec')) {
            return;
        }

        try {
            $ffmpeg = trim((string) @shell_exec('which ffmpeg 2>/dev/null || where ffmpeg 2>nul'));
            if (empty($ffmpeg)) {
                return;
            }

            $tmpPath = $path . '.tmp.mp4';
            $cmd = sprintf(
                'ffmpeg -y -nostdin -i %s -c:v libx264 -crf 28 -preset fast -vf %s -c:a aac -b:a 96k -movflags +faststart %s 2>&1',
                escapeshellarg($path),
                escapeshellarg('scale=min(1280\,iw):min(720\,ih):force_original_aspect_ratio=decrease'),
                escapeshellarg($tmpPath)
            );

            @shell_exec($cmd);

            if (file_exists($tmpPath) && filesize($tmpPath) > 0) {
                if (filesize($tmpPath) < filesize($path)) {
                    rename($tmpPath, $path);
                } else {
                    unlink($tmpPath);
                }
            } elseif (file_exists($tmpPath)) {
                unlink($tmpPath);
            }
        } catch (\Throwable $e) {
            // Ignora: o arquivo já está salvo, só a otimização falhou.
        }
    }

    public function create()
    {
        try {
            $db = \Config\Database::connect();
            $user_id = $this->request->getHeaderLine('X-User-Id');
            
            $isJson = strpos($this->request->getHeaderLine('Content-Type'), 'application/json') !== false;
            $json = $isJson ? $this->request->getJSON() : null;
            
            $titulo = $json->titulo ?? $this->request->getPost('titulo');
            $tipo_midia = $json->tipo_midia ?? $this->request->getPost('tipo_midia');
            $tempo_exibicao = $json->tempo_exibicao ?? $this->request->getPost('tempo_exibicao');
            $data_inicio = $json->data_inicio ?? $this->request->getPost('data_inicio');
            $data_fim = $json->data_fim ?? $this->request->getPost('data_fim');
            $url = $json->url ?? $this->request->getPost('url');
            $totem_id = $json->totem_id ?? $this->request->getPost('totem_id');
            $arquivo_url = $json->arquivo_url ?? $this->request->getPost('arquivo_url');
            
            $finalUrl = $arquivo_url ?: $url ?: '';
            
            $file = $this->request->getFile('arquivo');
            if ($file && $file->isValid()) {
                $finalUrl = $this->handleFileUpload($file, ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.mp4', '.webm', '.avi', '.mov', '.flv', '.3gp', '.m4v', '.mkv', '.mpg', '.rm', '.rmvb', '.vob', '.wmv']);
            } else if ($file && !$file->isValid() && $file->getError() !== UPLOAD_ERR_NO_FILE) {
                return $this->response->setJSON(['error' => $this->uploadErrorMessage($file)])->setStatusCode(400);
            }
            
            if (empty($finalUrl)) {
                if (str_contains($this->request->getHeaderLine('Content-Type'), 'multipart/form-data') && empty($_FILES)) {
                    $maxPost = ini_get('post_max_size') ?: 'desconhecido';
                    return $this->response->setJSON(['error' => "O envio excede o limite do servidor (post_max_size = $maxPost)."])->setStatusCode(413);
                }
                return $this->response->setJSON(['error' => 'Você precisa enviar um arquivo de mídia ou uma URL.'])->setStatusCode(400);
            }
            
            $tId = !empty($totem_id) ? $totem_id : null;
            $inicio = !empty($data_inicio) ? substr(str_replace('T', ' ', $data_inicio), 0, 19) : '1970-01-01 00:00:00';
            $fim = !empty($data_fim) ? substr(str_replace('T', ' ', $data_fim), 0, 19) : '2099-12-31 23:59:59';
            
            $data = [
                'usuario_id' => $user_id,
                'totem_id' => $tId,
                'titulo' => $titulo ?? '',
                'tipo_midia' => $tipo_midia ?? '',
                'tempo_exibicao' => (int)($tempo_exibicao ?? 0),
                'data_inicio' => $inicio,
                'data_fim' => $fim,
                'arquivo_url' => $finalUrl,
                'ativo' => 1
            ];
            
            $db->table('campanhas')->insert($data);
            return $this->respondCreated(['message' => 'Mídia adicionada', 'id' => (string)$db->insertID()]);
        } catch (\Throwable $e) {
            $status = str_starts_with($e->getMessage(), 'Tipo de arquivo não permitido') ? 400 : 500;
            $prefix = $status === 400 ? '' : 'Erro DB/PHP: ';
            return $this->response->setJSON(['error' => $prefix . $e->getMessage()])->setStatusCode($status);
        }
    }

    public function update($id = null)
    {
        try {
            $db = \Config\Database::connect();
            $this->ensureCampanhasCols($db);

            $user_id = $this->request->getHeaderLine('X-User-Id');
            $nivel = $this->request->getHeaderLine('X-User-Nivel');

            $existente = $db->table('campanhas')->where('id', $id)->get()->getRowArray();
            if (!$existente) {
                return $this->response->setJSON(['error' => 'Arquivo não encontrado'])->setStatusCode(404);
            }
            if ($nivel !== 'admin' && $existente['usuario_id'] != $user_id) {
                return $this->response->setJSON(['error' => 'Acesso negado'])->setStatusCode(403);
            }

            $isJson = strpos($this->request->getHeaderLine('Content-Type'), 'application/json') !== false;
            $json = $isJson ? $this->request->getJSON() : null;

            // Atualização parcial: apenas os campos enviados são alterados
            $data = [];

            $titulo = $json->titulo ?? $this->request->getPost('titulo');
            if ($titulo !== null && $titulo !== '') {
                $data['titulo'] = $titulo;
            }

            $tipo_midia = $json->tipo_midia ?? $this->request->getPost('tipo_midia');
            if ($tipo_midia !== null && $tipo_midia !== '') {
                $data['tipo_midia'] = $tipo_midia;
            }

            $tempo_exibicao = $json->tempo_exibicao ?? $this->request->getPost('tempo_exibicao');
            if ($tempo_exibicao !== null && $tempo_exibicao !== '') {
                $data['tempo_exibicao'] = (int)$tempo_exibicao;
            }

            $data_inicio = $json->data_inicio ?? $this->request->getPost('data_inicio');
            if ($data_inicio !== null && $data_inicio !== '') {
                $data['data_inicio'] = substr(str_replace('T', ' ', $data_inicio), 0, 19);
            }

            $data_fim = $json->data_fim ?? $this->request->getPost('data_fim');
            if ($data_fim !== null && $data_fim !== '') {
                $data['data_fim'] = substr(str_replace('T', ' ', $data_fim), 0, 19);
            }

            $totemEnviado = $isJson ? property_exists($json, 'totem_id') : (array_key_exists('totem_id', $_POST));
            if ($totemEnviado) {
                $totem_id = $json->totem_id ?? $this->request->getPost('totem_id');
                $data['totem_id'] = !empty($totem_id) ? $totem_id : null;
            }

            $ativo = $json->ativo ?? $this->request->getPost('ativo');
            if ($ativo !== null && $ativo !== '') {
                $data['ativo'] = (int)$ativo;
            }

            // Substituição de arquivo (upload multipart ou URL)
            $file = $this->request->getFile('arquivo');
            if ($file && $file->isValid()) {
                $ext = strtolower($file->getClientExtension());
                $finalUrl = $this->handleFileUpload($file, ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.mp4', '.webm', '.avi', '.mov', '.flv', '.3gp', '.m4v', '.mkv', '.mpg', '.rm', '.rmvb', '.vob', '.wmv']);
                if ($finalUrl) {
                    $data['arquivo_url'] = $finalUrl;
                    if (!$tipo_midia) {
                        $data['tipo_midia'] = in_array('.' . $ext, ['.png', '.jpg', '.jpeg', '.webp', '.gif']) ? 'imagem' : 'video';
                    }
                }
            } else if ($file && !$file->isValid() && $file->getError() !== UPLOAD_ERR_NO_FILE) {
                return $this->response->setJSON(['error' => $this->uploadErrorMessage($file)])->setStatusCode(400);
            }

            $arquivo_url = $json->arquivo_url ?? $this->request->getPost('arquivo_url');
            $url = $json->url ?? $this->request->getPost('url');
            if (empty($data['arquivo_url'])) {
                $finalUrl = $arquivo_url ?: $url ?: '';
                if (is_string($finalUrl) && $finalUrl !== '') {
                    $data['arquivo_url'] = $this->normalizaUrlArmazenada($finalUrl);
                }
            }

            // Etiquetas / pastas
            $etiquetas = $json->etiquetas ?? $this->request->getPost('etiquetas');
            if ($etiquetas !== null) {
                $lista = is_array($etiquetas) ? $etiquetas : json_decode((string)$etiquetas, true);
                if (!is_array($lista)) {
                    $lista = preg_split('/[,;\n]+/', (string)$etiquetas) ?: [];
                }
                $lista = array_values(array_unique(array_filter(array_map('trim', $lista), static fn($t) => $t !== '')));
                $data['etiquetas'] = $lista ? json_encode($lista, JSON_UNESCAPED_UNICODE) : null;
            }

            // Agendamentos (janelas de exibição do arquivo)
            $agendamentos = $json->agendamentos ?? $this->request->getPost('agendamentos');
            if ($agendamentos !== null) {
                $janelas = is_array($agendamentos) ? $agendamentos : json_decode((string)$agendamentos, true);
                $normalizadas = [];
                if (is_array($janelas)) {
                    foreach ($janelas as $j) {
                        $j = (array)$j;
                        $inicio = self::normalizaDataHora($j['inicio'] ?? '');
                        $fim = self::normalizaDataHora($j['fim'] ?? '');
                        if ($inicio === '' && $fim === '') {
                            continue;
                        }
                        $normalizadas[] = [
                            'inicio' => $inicio !== '' ? $inicio : null,
                            'fim'    => $fim !== '' ? $fim : null,
                        ];
                    }
                }
                $data['agendamentos'] = $normalizadas ? json_encode($normalizadas, JSON_UNESCAPED_UNICODE) : null;

                // Mantém a janela única legada (data_inicio/data_fim) coerente com a primeira janela
                if ($normalizadas) {
                    $primeira = $normalizadas[0];
                    $data['data_inicio'] = $primeira['inicio'] ?? '1970-01-01 00:00:00';
                    $data['data_fim'] = $primeira['fim'] ?? '2099-12-31 23:59:59';
                } else {
                    $data['data_inicio'] = '1970-01-01 00:00:00';
                    $data['data_fim'] = '2099-12-31 23:59:59';
                }
            }

            if ($data) {
                $db->table('campanhas')->where('id', $id)->update($data);
            }
            return $this->response->setJSON(['success' => true]);
        } catch (\Throwable $e) {
            $status = str_starts_with($e->getMessage(), 'Tipo de arquivo não permitido') ? 400 : 500;
            $prefix = $status === 400 ? '' : 'Erro DB/PHP: ';
            return $this->response->setJSON(['error' => $prefix . $e->getMessage()])->setStatusCode($status);
        }
    }

    public function delete($id = null)
    {
        try {
            $db = \Config\Database::connect();
            $db->table('campanhas')->where('id', $id)->delete();
            return $this->respondDeleted(['success' => true]);
        } catch (\Exception $e) {
            return $this->response->setJSON(['error' => 'Erro DB/PHP: ' . $e->getMessage()])->setStatusCode(500);
        }
    }
}
