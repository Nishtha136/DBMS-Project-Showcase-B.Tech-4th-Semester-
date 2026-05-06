<?php
/**
 * Order confirmation page — smooth entrance animation, checkmark, fade up card.
 */
require_once dirname(__DIR__) . '/includes/init.php';
require_once dirname(__DIR__) . '/includes/db.php';

if (!isset($_SESSION['customer_id']) || (int) $_SESSION['customer_id'] <= 0) {
    header('Location: ../login.php');
    exit;
}

$orderId = isset($_GET['order_id']) ? (int) $_GET['order_id'] : 0;
$customerId = (int) $_SESSION['customer_id'];

if ($orderId <= 0) {
    header('Location: home.php');
    exit;
}

$summary = null;
$stmt = $conn->prepare(
    'SELECT * FROM v_customer_order_summary WHERE order_id = ? AND customer_id = ? LIMIT 1'
);
if ($stmt) {
    $stmt->bind_param('ii', $orderId, $customerId);
    $stmt->execute();
    $summary = $stmt->get_result()->fetch_assoc();
    $stmt->close();
}

if (!$summary) {
    $stmt = $conn->prepare(
        'SELECT o.order_id, o.order_date, o.total_amount, o.customer_id, o.order_status
         FROM orders o WHERE o.order_id = ? AND o.customer_id = ? LIMIT 1'
    );
    if ($stmt) {
        $stmt->bind_param('ii', $orderId, $customerId);
        $stmt->execute();
        $summary = $stmt->get_result()->fetch_assoc();
        $stmt->close();
    }
}

if (!$summary) {
    $_SESSION['flash'] = 'Order not found.';
    $_SESSION['flash_type'] = 'error';
    header('Location: home.php');
    exit;
}

$lines = [];
require_once dirname(__DIR__) . '/includes/schema_bookstore.php';
try {
    $lineSql = bookstore_order_detail_receipt_sql($conn);
    $stmt = $conn->prepare($lineSql);
    if ($stmt) {
        $stmt->bind_param('i', $orderId);
        $stmt->execute();
        $lr = $stmt->get_result();
        while ($row = $lr->fetch_assoc()) {
            $lines[] = $row;
        }
        $stmt->close();
    }
} catch (Throwable $e) {
    $lines = [];
}

$pay = null;
$stmt = $conn->prepare('SELECT * FROM payment WHERE order_id = ? LIMIT 1');
if ($stmt) {
    $stmt->bind_param('i', $orderId);
    $stmt->execute();
    $pay = $stmt->get_result()->fetch_assoc();
    $stmt->close();
}

$pageTitle = 'Payment Successful';
$activeNav = 'home';
require_once dirname(__DIR__) . '/components/navbar.php';
?>

<div class="container mb-4" style="max-width: 800px;">
    <div style="text-align: center; margin-top: 40px; margin-bottom: 30px;">
        <!-- Animated CSS checkmark -->
        <svg class="success-checkmark fade-in" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle class="success-checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
            <path class="success-checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
        </svg>

        <h1 class="fade-in" style="font-size: 2.2rem; margin-bottom: 8px; animation-delay: 0.1s;">Order Complete!</h1>
        <p class="muted" style="font-size: 1.1rem;">Your order #<?php echo (int) $orderId; ?> has been confirmed.</p>
    </div>

    <!-- Fade Up Card -->
    <div class="checkout-card fade-up-card" style="padding: 32px; box-shadow: 0 10px 40px rgba(0,0,0,0.08); position: relative; overflow: hidden;">
        <div style="position: absolute; top: 0; left: 0; right: 0; height: 6px; background: linear-gradient(90deg, var(--accent), #ff914d);"></div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px dashed var(--border);">
            <div>
                <p class="muted" style="margin-bottom: 4px; font-size: 0.9rem;">Date</p>
                <p style="font-weight: 600;"><?php echo htmlspecialchars((string) ($summary['order_date'] ?? '')); ?></p>
            </div>
            <div>
                <p class="muted" style="margin-bottom: 4px; font-size: 0.9rem;">Payment Method</p>
                <p style="font-weight: 600;"><?php echo $pay ? htmlspecialchars((string) $pay['payment_method']) : 'Unknown'; ?></p>
            </div>
            <div>
                <p class="muted" style="margin-bottom: 4px; font-size: 0.9rem;">Order Status</p>
                <p style="font-weight: 600; color: var(--success);"><?php echo htmlspecialchars((string) ($summary['order_status'] ?? 'Placed')); ?></p>
            </div>
            <div>
                <p class="muted" style="margin-bottom: 4px; font-size: 0.9rem;">Total Paid</p>
                <p style="font-weight: 700; font-size: 1.2rem; color: var(--accent);">₹<?php echo number_format((float) ($summary['total_amount'] ?? 0), 2); ?></p>
            </div>
        </div>

        <h3 style="font-size: 1.1rem; margin-bottom: 16px;">Order Details</h3>
        <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px;">
            <?php foreach ($lines as $ln):
                $sub = isset($ln['line_total']) ? (float) $ln['line_total'] : ((float) $ln['unit_price'] * (int) $ln['quantity']);
                ?>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg-tertiary); border-radius: var(--radius-sm);">
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-weight: 500;"><?php echo htmlspecialchars((string) $ln['title']); ?></span>
                        <span class="muted" style="font-size: 0.85rem;">Qty: <?php echo (int) $ln['quantity']; ?> &times; ₹<?php echo number_format((float) $ln['unit_price'], 2); ?></span>
                    </div>
                    <span style="font-weight: 600;">₹<?php echo number_format($sub, 2); ?></span>
                </div>
            <?php endforeach; ?>
        </div>

        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
            <a href="invoice.php?order_id=<?php echo $orderId; ?>" class="btn btn-primary" style="flex:1;min-width:160px;text-align:center;display:flex;align-items:center;justify-content:center;gap:8px;">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                Download Invoice
            </a>
            <a href="orders.php" class="btn btn-secondary" style="flex:1;min-width:160px;text-align:center;">View My Orders</a>
            <a href="home.php" class="btn btn-secondary" style="flex:1;min-width:160px;text-align:center;">Continue Shopping</a>
        </div>
    </div>
</div>

<?php require_once dirname(__DIR__) . '/components/footer.php'; ?>
