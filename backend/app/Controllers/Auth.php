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
                    'exp'   => time() + (24 * 60 * 60) // 24 hours
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
}
