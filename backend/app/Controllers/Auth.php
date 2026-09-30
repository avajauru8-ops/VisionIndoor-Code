<?php

namespace App\Controllers;

use CodeIgniter\RESTful\ResourceController;
use Firebase\JWT\JWT;
use Exception;

class Auth extends ResourceController
{
    public function login()
    {
        try {
            $db = \Config\Database::connect();
            
            // Handle JSON payload
            $json = $this->request->getJSON();
            $email = $json->email ?? '';
            $senha = $json->senha ?? '';
            
            if (empty($email) || empty($senha)) {
                return $this->response->setJSON(['error' => 'Email e senha são obrigatórios'])->setStatusCode(400);
            }
            
            $builder = $db->table('usuarios');
            $user = $builder->where('email', $email)->limit(1)->get()->getRowArray();
            
            if ($user && password_verify($senha, $user['senha'])) {
                $key = env('JWT_SECRET') ?: 'visioindoor_jwt_secret_key_fallback_32_bytes';
                $payload = [
                    'id'    => (string)$user['id'],
                    'email' => $user['email'],
                    'nivel' => $user['nivel'],
                    'nome'  => $user['nome'],
                    'iat'   => time(),
                    'exp'   => time() + USER_SESSION_TTL // 2 horas
                ];
                
                $token = JWT::encode($payload, $key, 'HS256');
                
                return $this->response->setJSON([
                    'token' => $token,
                    'user'  => [
                        'id'    => (string)$user['id'],
                        'email' => $user['email'],
                        'nome'  => $user['nome'],
                        'nivel' => $user['nivel']
                    ]
                ]);
            }
            
            // Simulate delay against brute force
            sleep(1);
            
            return $this->response->setJSON(['error' => 'Credenciais inválidas'])->setStatusCode(401);
        } catch (\Exception $e) {
            return $this->response->setJSON([
                'error' => 'Erro DB/PHP: ' . $e->getMessage()
            ])->setStatusCode(500);
        }
    }

    public function me()
    {
        $userId = $this->request->getHeaderLine('X-User-Id');
        if (empty($userId)) {
            return $this->response->setJSON(['error' => 'Não autenticado'])->setStatusCode(401);
        }

        $db = \Config\Database::connect();
        $user = $db->table('usuarios')->where('id', $userId)->get()->getRowArray();

        if (!$user) {
            return $this->response->setJSON(['error' => 'Usuário não encontrado'])->setStatusCode(404);
        }

        unset($user['senha']);
        $user['id'] = (string)$user['id'];
        $user['cpf'] = $user['cpf'] ?? '';
        $user['status_licenca'] = $user['status_licenca'] ?? 'ativa';
        $user['validade_licenca'] = $user['validade_licenca'] ?? '2099-12-31 23:59:59';
        $user['plano'] = $user['plano'] ?? 'gratis';
        $user['limite_tvs'] = $user['limite_tvs'] ?? 1;

        return $this->response->setJSON($user);
    }

    public function refresh()
    {
        try {
            $header = $this->request->getHeaderLine('Authorization');
            
            if (empty($header) || !preg_match('/Bearer\s(\S+)/', $header, $matches)) {
                return $this->response->setJSON(['error' => 'Token não fornecido'])->setStatusCode(401);
            }

            $oldToken = $matches[1];
            $key = env('JWT_SECRET') ?: 'visioindoor_jwt_secret_key_fallback_32_bytes';
            
            $decoded = null;
            
            // Token expirado ou emitido com validade antiga (30 dias) não é renovado
            try {
                $decoded = JWT::decode($oldToken, new Key($key, 'HS256'));
            } catch (\Firebase\JWT\ExpiredException $e) {
                return $this->response->setJSON(['error' => 'Token expirado. Faça login novamente.'])->setStatusCode(401);
            } catch (\Exception $e) {
                return $this->response->setJSON(['error' => 'Token invalido. Faça login novamente.'])->setStatusCode(401);
            }
            
            if (isset($decoded->iat) && (time() - $decoded->iat) > USER_SESSION_TTL) {
                return $this->response->setJSON(['error' => 'Token expirado. Faça login novamente.'])->setStatusCode(401);
            }
            
            // Gera novo token
            $payload = [
                'id'    => $decoded->id,
                'email' => $decoded->email,
                'nivel' => $decoded->nivel,
                'nome'  => $decoded->nome,
                'iat'   => time(),
                'exp'   => time() + USER_SESSION_TTL // 2 horas
            ];
            
            $newToken = JWT::encode($payload, $key, 'HS256');
            
            return $this->response->setJSON([
                'token' => $newToken,
                'user'  => [
                    'id'    => $decoded->id,
                    'email' => $decoded->email,
                    'nome'  => $decoded->nome,
                    'nivel' => $decoded->nivel
                ]
            ]);
        } catch (\Exception $e) {
            return $this->response->setJSON([
                'error' => 'Erro ao renovar token: ' . $e->getMessage()
            ])->setStatusCode(500);
        }
    }
}
