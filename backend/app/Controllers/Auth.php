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
                    'exp'   => time() + (30 * 24 * 60 * 60) // 30 dias
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
            
            // Tenta decodificar normalmente
            try {
                $decoded = JWT::decode($oldToken, new Key($key, 'HS256'));
            } catch (\Firebase\JWT\ExpiredException $e) {
                // Token expirado - decodifica manualmente para obter os dados do usuario
                $parts = explode('.', $oldToken);
                if (count($parts) === 3) {
                    $payloadData = json_decode(base64_decode(strtr($parts[1], '-_', '+/')));
                    if ($payloadData && isset($payloadData->id) && isset($payloadData->email)) {
                        // Verifica a assinatura manualmente
                        $expectedSig = hash_hmac('sha256', $parts[0] . '.' . $parts[1], $key, true);
                        $expectedSigB64 = strtr(rtrim(base64_encode($expectedSig), '='), '+/', '-_');
                        
                        if (hash_equals($expectedSigB64, $parts[2])) {
                            $decoded = $payloadData;
                        }
                    }
                }
                
                if (!$decoded) {
                    return $this->response->setJSON(['error' => 'Token expirado e invalido. Faça login novamente.'])->setStatusCode(401);
                }
            } catch (\Exception $e) {
                return $this->response->setJSON(['error' => 'Token invalido. Faça login novamente.'])->setStatusCode(401);
            }
            
            // Gera novo token
            $payload = [
                'id'    => $decoded->id,
                'email' => $decoded->email,
                'nivel' => $decoded->nivel,
                'nome'  => $decoded->nome,
                'iat'   => time(),
                'exp'   => time() + (30 * 24 * 60 * 60) // 30 dias
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
