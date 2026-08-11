<?php
$db = new SQLite3(__DIR__ . '/writable/visioindoor.sqlite');
$res = $db->query("PRAGMA table_info(totens)");
while ($row = $res->fetchArray()) {
    echo $row['name'] . "\n";
}
