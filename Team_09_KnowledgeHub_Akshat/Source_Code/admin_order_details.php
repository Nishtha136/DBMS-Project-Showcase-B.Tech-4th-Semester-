<?php
/**
 * admin_order_details.php — Admin: view a single order + lines and update status.
 */
require_once __DIR__ . '/includes/init.php';
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/schema_bookstore.php';

if (!isset($_SESSION['customer_id']) || (int) $_SESSION['customer_id'] <= 0) {
    $_SESSION['redirect_after_login'] = 'admin_orders.php';
    $_SESSION['flash'] = 'Please log in as admin.';
    $_SESSION['flash_type'] = 'error';
    header('Location: login.php');
    exit;
}
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    $_SESSION['flash'] = 'Access denied (admin only).';
    $_SESSION['flash_type'] = 'error';
    header('Location: index.php');
    exit;
}

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

$orderId = isset($_GET['order_id']) ? (int) $_GET['order_id'] : 0;
if ($orderId <= 0) {
    header('Location: admin_orders.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['new_status'])) {
    $new = (string) $_POST['new_status'];
    $allowed = ['Pending', 'Paid', 'Completed', 'Failed'];
    if (in_array($new, $allowed, true)) {
        $stmt = $conn->prepare('UPDATE orders SET order_status = ? WHERE order_id = ?');
        $stmt->bind_param('si', $new, $orderId);
        $stmt->execute();
        $stmt->close();
        $_SESSION['flash'] = 'Order updated.';
        $_SESSION['flash_type'] = 'success';
        header('Location: admin_order_details.php?order_id=' . $orderId);
        exit;
    }
}

$order = null;
$stmt = $conn->prepare('SELECT order_id, customer_id, order_date, total_amount, order_status FROM orders WHERE order_id = ? LIMIT 1');
$stmt->bind_param('i', $orderId);
$stmt->execute();
$order = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$order) {
    $_SESSION['flash'] = 'Order not found.';
    $_SESSION['flash_type'] = 'error';
    header('Location: admin_orders.php');
    exit;
}

$lines = [];
try {
    $lineSql = bookstore_order_detail_receipt_sql($conn);
    $stmt = $conn->prepare($lineSql);
    if ($stmt) {
        $stmt->bind_param('i', $orderId);
        $stmt->execute();
        $res = $stmt->get_result();
        while ($row = $res->fetch_assoc()) {
            $lines[] = $row;
        }
        $stmt->close();
    }
} catch (Throwable $e) {
    $lines = [];
}

$pageTitle = 'Admin — Order #' . (int) $orderId;
$activeNav = 'admin';
require_once __DIR__ . '/includes/header.php';

$flash = $_SESSION['flash'] ?? '';
$flashType = $_SESSION['flash_type'] ?? 'info';
unset($_SESSION['flash'], $_SESSION['flash_type']);
?>

<div class="container order-success-page">
    <div class="page-head">
        <h1>Order #<?php echo (int) $orderId; ?></h1>
        <p class="muted">Customer: <?php echo (int) $order['customer_id']; ?> · Date: <?php echo htmlspecialchars((string) $order['order_date']); ?></p>
    </div>

    <?php if ($flash !== '') {
        $cls = $flashType === 'error' ? 'alert-error' : ($flashType === 'success' ? 'alert-success' : 'alert-info');
        ?>
        <div class="alert <?php echo htmlspecialchars($cls); ?>">
            <?php echo htmlspecialchars($flash); ?>
        </div>
    <?php } ?>

    <div class="checkout-card">
        <p><strong>Status:</strong> <?php echo htmlspecialchars((string) ($order['order_status'] ?? '')); ?></p>
        <p><strong>Total:</strong> ₹<?php echo number_format((float) ($order['total_amount'] ?? 0), 2); ?></p>

        <form method="post" action="admin_order_details.php?order_id=<?php echo (int) $orderId; ?>" style="margin-top:1rem;">
            <label class="filter-label">Update status</label>
            <select name="new_status" class="filter-select" style="width:auto; display:inline-block;">
                <?php
                $cur = (string) ($order['order_status'] ?? '');
                foreach (['Pending', 'Paid', 'Completed', 'Failed'] as $st) {
                    $sel = ($st === $cur) ? ' selected' : '';
                    echo '<option value="' . htmlspecialchars($st) . '"' . $sel . '>' . htmlspecialchars($st) . '</option>';
                }
                ?>
            </select>
            <button type="submit" class="btn btn-primary">Save</button>
            <a href="admin_orders.php" class="btn btn-secondary">Back</a>
        </form>
    </div>

    <div class="checkout-card" style="margin-top:1rem;">
        <h2>Items</h2>
        <table class="receipt-table">
            <thead>
            <tr><th>Book</th><th>Qty</th><th>Unit</th><th>Subtotal</th></tr>
            </thead>
            <tbody>
            <?php foreach ($lines as $ln):
                $qty = (int) $ln['quantity'];
                $unit = (float) $ln['unit_price'];
                $sub = isset($ln['line_total']) ? (float) $ln['line_total'] : ($unit * $qty);
                ?>
                <tr>
                    <td><?php echo htmlspecialchars((string) $ln['title']); ?></td>
                    <td><?php echo $qty; ?></td>
                    <td>₹<?php echo number_format($unit, 2); ?></td>
                    <td>₹<?php echo number_format($sub, 2); ?></td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>

