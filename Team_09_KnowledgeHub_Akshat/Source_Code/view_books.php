<?php
include 'db.php';

$result = $conn->query("SELECT * FROM book");

echo "<h1>Books List</h1>";

while($row = $result->fetch_assoc()) {
    echo "Title: " . $row['title'] . " | Author: " . $row['author'] . "<br>";
}
?>
