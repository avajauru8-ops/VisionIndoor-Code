<?php
$conn = new mysqli('localhost', 'root', '', 'visioindoor');
if ($conn->connect_error) die("Connection failed");
$res = $conn->query("SELECT tempo_exibicao_padrao FROM totens LIMIT 1");
if ($res) print_r($res->fetch_assoc());
