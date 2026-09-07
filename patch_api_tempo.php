<?php

$file = 'd:\\visioindoor---php (2)\\backend\\app\\Controllers\\Api.php';
$content = file_get_contents($file);

// Replace the tempo_exibicao logic to force it to use the DB value properly
$search = "'tempo_exibicao' => (int)\$c['tempo_exibicao']";
$replace = "'tempo_exibicao' => (isset(\$c['tempo_exibicao']) && (int)\$c['tempo_exibicao'] > 0) ? (int)\$c['tempo_exibicao'] : (isset(\$totem['tempo_exibicao_padrao']) ? (int)\$totem['tempo_exibicao_padrao'] : 15)";

$content = str_replace($search, $replace, $content);
file_put_contents($file, $content);

echo "Api.php patched for tempo_exibicao!\n";
