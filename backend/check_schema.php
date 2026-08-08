<?php require 'public/index.php'; $db = \Config\Database::connect(); print_r($db->getFieldNames('usuarios')); print_r($db->getFieldNames('configuracoes_admin'));
