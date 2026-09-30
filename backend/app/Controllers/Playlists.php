<?php

namespace App\Controllers;

use CodeIgniter\RESTful\ResourceController;

class Playlists extends ResourceController
{
    public function index()
    {
        try {
            $db = \Config\Database::connect();
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
            
            $tId = !empty($totem_id) ? $totem_id : null;
            $inicio = !empty($data_inicio) ? substr(str_replace('T', ' ', $data_inicio), 0, 19) : '1970-01-01 00:00:00';
            $fim = !empty($data_fim) ? substr(str_replace('T', ' ', $data_fim), 0, 19) : '2099-12-31 23:59:59';
            
            $data = [
                'totem_id' => $tId,
                'titulo' => $titulo ?? '',
                'tipo_midia' => $tipo_midia ?? '',
                'tempo_exibicao' => (int)($tempo_exibicao ?? 0),
                'data_inicio' => $inicio,
                'data_fim' => $fim,
                'ativo' => isset($json->ativo) ? (int)$json->ativo : (int)($this->request->getPost('ativo') ?? 1)
            ];
            
            if ($finalUrl) {
                $data['arquivo_url'] = $finalUrl;
            }
            
            $db->table('campanhas')->where('id', $id)->update($data);
            return $this->respond(['success' => true]);
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
