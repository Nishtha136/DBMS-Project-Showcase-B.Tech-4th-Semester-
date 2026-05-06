<?php
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
header("Location: pages/product.php?id=" . $id);
exit;
