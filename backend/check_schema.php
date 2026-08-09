<?php
$db = new SQLite3(__DIR__ . '/writable/visioindoor.sqlite');
$results = $db->query("SELECT name FROM sqlite_master WHERE type='table';");
while ($row = $results->fetchArray()) {
    echo $row['name'] . "\n";
}
