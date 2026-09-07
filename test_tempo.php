<?php
$data = json_encode(['device_id' => '123456']); // using fake or what is there
$options = [
    'http' => [
        'header'  => "Content-type: application/json\r\n",
        'method'  => 'POST',
        'content' => $data,
    ],
];
$context  = stream_context_create($options);
$result = file_get_contents('http://localhost:8080/api.php', false, $context);
print_r(json_decode($result, true));
