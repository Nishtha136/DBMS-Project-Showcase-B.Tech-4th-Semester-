<?php
require 'includes/init.php';
require 'includes/db.php';
$queries = [
    "CREATE INDEX idx_orders_customer ON orders (customer_id)",
    "CREATE INDEX idx_od_book ON order_details (book_id)",
    "CREATE INDEX idx_address_customer ON address (customer_id)"
];
foreach ($queries as $q) {
    if (!$conn->query($q)) {
        echo "Error on '$q': " . $conn->error . "\n";
    } else {
        echo "Success: $q\n";
    }
}
echo "Done.\n";
