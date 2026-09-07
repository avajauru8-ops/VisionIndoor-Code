<?php
// quick db query script
$dbHost = 'localhost';
$dbUser = 'root';
$dbPass = '';
$dbName = 'visioindoor';

$conn = new mysqli($dbHost, $dbUser, $dbPass, $dbName);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$sql = "SELECT id, arquivo, arquivo_url, tipo_midia FROM campanhas LIMIT 5";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        print_r($row);
    }
} else {
    echo "0 results";
}
$conn->close();
