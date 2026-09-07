<?php
$conn = new mysqli('localhost', 'root', '', 'visioindoor');
$res = $conn->query("SELECT * FROM playlist_itens WHERE widget_nome IS NOT NULL LIMIT 5");
while($row = $res->fetch_assoc()) print_r($row);
