<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

class AuthFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        $header = $request->getHeaderLine('Authorization');
        
        if (empty($header) || !preg_match('/Bearer\s(\S+)/', $header, $matches)) {
            return \Config\Services::response()
                ->setJSON(['error' => 'Token não fornecido'])
                ->setStatusCode(ResponseInterface::HTTP_UNAUTHORIZED);
        }

        $token = $matches[1];
        
        try {
            $key = env('JWT_SECRET') ?: 'visioindoor_jwt_secret_key_fallback_32_bytes';
            $decoded = JWT::decode($token, new Key($key, 'HS256'));
            
            if (!empty($arguments) && in_array('admin', $arguments)) {
                if (!isset($decoded->nivel) || $decoded->nivel !== 'admin') {
                    return \Config\Services::response()
                        ->setJSON(['error' => 'Acesso negado. Somente administradores.'])
                        ->setStatusCode(ResponseInterface::HTTP_FORBIDDEN);
                }
            }
            
            // Set decoded user info in request headers or as a custom property
            $request->setHeader('X-User-Id', $decoded->id);
            $request->setHeader('X-User-Email', $decoded->email);
            $request->setHeader('X-User-Nivel', $decoded->nivel);
        } catch (\Firebase\JWT\ExpiredException $e) {
            return \Config\Services::response()
                ->setJSON(['error' => 'Token expirado. Por favor, faça login novamente.'])
                ->setStatusCode(ResponseInterface::HTTP_UNAUTHORIZED);
        } catch (\Firebase\JWT\SignatureInvalidException $e) {
            return \Config\Services::response()
                ->setJSON(['error' => 'Token inválido. Assinatura incorreta.'])
                ->setStatusCode(ResponseInterface::HTTP_UNAUTHORIZED);
        } catch (\Firebase\JWT\InvalidTokenException $e) {
            return \Config\Services::response()
                ->setJSON(['error' => 'Token inválido. Formato incorreto.'])
                ->setStatusCode(ResponseInterface::HTTP_UNAUTHORIZED);
        } catch (Exception $e) {
            return \Config\Services::response()
                ->setJSON(['error' => 'Token inválido. Faça login novamente.'])
                ->setStatusCode(ResponseInterface::HTTP_UNAUTHORIZED);
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
    }
}
