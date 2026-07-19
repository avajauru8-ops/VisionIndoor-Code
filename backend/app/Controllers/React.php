<?php

namespace App\Controllers;

class React extends BaseController
{
    public function index()
    {
        // Define o caminho para o index.html compilado pelo React
        $path = ROOTPATH . 'public/index.html';
        
        if (file_exists($path)) {
            $html = file_get_contents($path);
            return $this->response->setBody($html)->setContentType('text/html');
        }
        
        return $this->response->setBody('<h1>App React não encontrado.</h1><p>Por favor, rode o comando <code>npm run build</code> para gerar a pasta public.</p>')->setContentType('text/html');
    }
}
