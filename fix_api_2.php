<?php
$file = 'backend/app/Controllers/Api.php';
$content = file_get_contents($file);

$search = "                  } else {
                      if (!empty(\$c['arquivo_url'])) {
                          \$url = \$c['arquivo_url'];
                      } else {
                          \$url = base_url('uploads/campanhas/' . \$c['arquivo']);
                      }
                  }";

$replace = "                  } else {
                      \$fileName = !empty(\$c['arquivo_url']) ? \$c['arquivo_url'] : \$c['arquivo'];
                      if (preg_match('/^https?:\/\//', \$fileName)) {
                          \$url = \$fileName;
                      } else {
                          \$url = base_url('uploads/' . ltrim(\$fileName, '/'));
                      }
                  }";

$content = str_replace($search, $replace, $content);
file_put_contents($file, $content);
echo "API URLs fixed part 2";
