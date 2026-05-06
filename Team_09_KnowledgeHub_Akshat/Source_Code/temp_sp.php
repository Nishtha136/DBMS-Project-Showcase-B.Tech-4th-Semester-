<?php
require 'includes/init.php';
require 'includes/db.php';
$sql = file_get_contents('sql/update_sp.sql');
$sql = preg_replace('/DELIMITER \$\$/', '', $sql);
$sql = preg_replace('/DELIMITER ;/', '', $sql);
$sql = str_replace('$$', '', $sql);
if ($conn->multi_query($sql)) {
    do {
        if ($res = $conn->store_result()) {
            $res->free();
        }
    } while ($conn->more_results() && $conn->next_result());
    echo 'Success';
} else {
    echo 'Error: ' . $conn->error;
}
