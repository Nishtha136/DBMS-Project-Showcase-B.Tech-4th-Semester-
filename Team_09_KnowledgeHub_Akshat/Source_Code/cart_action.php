<?php
require_once __DIR__ . '/includes/init.php';
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/cart_service.php';

// Force clean output buffer
if (ob_get_level()) ob_clean();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['ok' => false, 'error' => 'POST only']);
    exit;
}

$action = $_POST['action'] ?? '';
$bookId = (int) ($_POST['book_id'] ?? 0);

if (!isset($_SESSION['cart']) || !is_array($_SESSION['cart'])) {
    $_SESSION['cart'] = [];
}

if ($action === 'refresh') {
    $snap = cart_snapshot_for_json($conn, $_SESSION['cart']);
    echo json_encode(['ok' => true, 'total' => $snap['total'], 'subtotal' => $snap['subtotal'], 'gst' => $snap['gst'], 'delivery' => $snap['delivery'], 'count' => $snap['count'], 'items' => $snap['items']]);
    exit;
}

if ($bookId <= 0 && $action !== 'refresh') {
    echo json_encode(['ok' => false, 'error' => 'Invalid book']);
    exit;
}

if ($action === 'remove') {
    unset($_SESSION['cart'][$bookId]);
    $snap = cart_snapshot_for_json($conn, $_SESSION['cart']);
    echo json_encode(['ok' => true, 'total' => $snap['total'], 'subtotal' => $snap['subtotal'], 'gst' => $snap['gst'], 'delivery' => $snap['delivery'], 'count' => $snap['count'], 'items' => $snap['items']]);
    exit;
}

$stmt = $conn->prepare('SELECT stock FROM book WHERE book_id = ?');
$stmt->bind_param('i', $bookId);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
$stmt->close();
$stock = $row ? (int) $row['stock'] : 0;

$current = isset($_SESSION['cart'][$bookId]) ? (int) $_SESSION['cart'][$bookId] : 0;

if ($action === 'increment') {
    if ($stock <= 0) {
        echo json_encode(['ok' => false, 'error' => 'Out of stock']);
        exit;
    }
    if ($current >= $stock) {
        echo json_encode(['ok' => false, 'error' => 'Maximum available stock reached']);
        exit;
    }
    $_SESSION['cart'][$bookId] = $current + 1;
}

if ($action === 'decrement') {
    if ($current <= 1) {
        unset($_SESSION['cart'][$bookId]);
    } else {
        $_SESSION['cart'][$bookId] = $current - 1;
    }
}

if ($action === 'set_qty') {
    $q = (int) ($_POST['qty'] ?? 0);
    $q = max(0, min($q, $stock));
    if ($q === 0 || $stock <= 0) {
        unset($_SESSION['cart'][$bookId]);
    } else {
        $_SESSION['cart'][$bookId] = $q;
    }
}

$snap = cart_snapshot_for_json($conn, $_SESSION['cart']);
    echo json_encode(['ok' => true, 'total' => $snap['total'], 'subtotal' => $snap['subtotal'], 'gst' => $snap['gst'], 'delivery' => $snap['delivery'], 'count' => $snap['count'], 'items' => $snap['items']]);
