<?php
/**
 * update_cart.php — AJAX endpoint for Cart operations
 */
require_once __DIR__ . '/includes/init.php';
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/cart_service.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid method']);
    exit;
}

$action = $_POST['action'] ?? '';
$bid = isset($_POST['book_id']) ? (int) $_POST['book_id'] : 0;

if ($bid <= 0 || !in_array($action, ['increase', 'decrease', 'remove'], true)) {
    echo json_encode(['success' => false, 'error' => 'Invalid data']);
    exit;
}

if (!isset($_SESSION['cart'])) {
    $_SESSION['cart'] = [];
}

$currentQty = isset($_SESSION['cart'][$bid]) ? (int) $_SESSION['cart'][$bid] : 0;

if ($action === 'remove') {
    unset($_SESSION['cart'][$bid]);
} else {
    // Check stock
    $stmt = $conn->prepare('SELECT stock, price FROM book WHERE book_id = ?');
    $stmt->bind_param('i', $bid);
    $stmt->execute();
    $r = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$r) {
        echo json_encode(['success' => false, 'error' => 'Book not found']);
        exit;
    }

    $stock = (int) $r['stock'];
    $price = (float) $r['price'];

    if ($action === 'increase') {
        $newQty = $currentQty + 1;
    } else {
        $newQty = max(0, $currentQty - 1);
    }

    $finalQty = cart_cap_qty($newQty, $stock);

    if ($finalQty <= 0) {
        unset($_SESSION['cart'][$bid]);
        $finalQty = 0;
    } else {
        $_SESSION['cart'][$bid] = $finalQty;
    }
}

// Calculate grand total and item subtotal to send back
$grand = 0.0;
$ids = array_keys($_SESSION['cart']);
if (count($ids) > 0) {
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $types = str_repeat('i', count($ids));
    $stmt = $conn->prepare("SELECT book_id, price FROM book WHERE book_id IN ($placeholders)");
    $stmt->bind_param($types, ...$ids);
    $stmt->execute();
    $res = $stmt->get_result();
    
    while ($row = $res->fetch_assoc()) {
        $id = (int) $row['book_id'];
        $grand += ((float) $row['price']) * $_SESSION['cart'][$id];
    }
    $stmt->close();
}

echo json_encode([
    'success' => true,
    'new_qty' => $finalQty ?? 0,
    'item_subtotal' => isset($price, $finalQty) ? $price * $finalQty : 0,
    'grand_total' => $grand,
    'cart_count' => array_sum($_SESSION['cart'])
]);
exit;
