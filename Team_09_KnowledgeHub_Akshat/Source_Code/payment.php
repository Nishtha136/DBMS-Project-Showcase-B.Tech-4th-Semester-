<?php
/**
 * payment.php — View all recorded payments
 */
require_once __DIR__ . '/includes/init.php';
require_once __DIR__ . '/includes/db.php';

$isLoggedIn = isset($_SESSION['customer_id']) && (int) $_SESSION['customer_id'] > 0;
if (!$isLoggedIn) {
    $_SESSION['flash'] = 'Please log in to view payments.';
    $_SESSION['flash_type'] = 'info';
    header('Location: login.php');
    exit;
}

$isAdmin = isset($_SESSION['role']) && $_SESSION['role'] === 'admin';
$cid = (int) $_SESSION['customer_id'];

// If admin, show all. If user, show only their payments.
if ($isAdmin) {
    $sql = 'SELECT p.payment_method, p.amount, p.payment_status, p.payment_date, o.order_id 
            FROM payment p 
            JOIN orders o ON p.order_id = o.order_id 
            ORDER BY p.payment_date DESC';
    $stmt = $conn->prepare($sql);
} else {
    $sql = 'SELECT p.payment_method, p.amount, p.payment_status, p.payment_date, o.order_id 
            FROM payment p 
            JOIN orders o ON p.order_id = o.order_id 
            WHERE o.customer_id = ? 
            ORDER BY p.payment_date DESC';
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('i', $cid);
}

$stmt->execute();
$res = $stmt->get_result();
$payments = [];
while ($row = $res->fetch_assoc()) {
    $payments[] = $row;
}
$stmt->close();

$pageTitle = 'Payments';
$activeNav = 'payments';
require_once __DIR__ . '/components/navbar.php';

$flash = $_SESSION['flash'] ?? '';
$flashType = $_SESSION['flash_type'] ?? 'info';
unset($_SESSION['flash'], $_SESSION['flash_type']);
?>

<div class="container mb-4">
    <?php if ($flash !== '') {
        $cls = $flashType === 'error' ? 'alert-error' : ($flashType === 'success' ? 'alert-success' : 'alert-info');
        echo '<div class="alert ' . htmlspecialchars($cls) . '" style="margin-top: 1rem;">' . htmlspecialchars($flash) . '</div>';
    } ?>

    <div class="page-head" style="margin-top: 1.5rem;">
        <h1 style="font-size: 2rem; margin-bottom: 0.5rem;"><?php echo $isAdmin ? 'All Payments' : 'My Payments'; ?></h1>
        <p class="muted">Review the payment history for your orders.</p>
    </div>

    <?php if (count($payments) === 0) { ?>
        <div class="empty-state" style="background: var(--bg-primary); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 60px 20px;">
            <svg style="width: 64px; height: 64px; margin: 0 auto 16px; color: var(--border);" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
            <h3 style="margin-bottom: 8px;">No payments found</h3>
            <p style="margin-bottom: 24px; color: var(--text-secondary);">No payment records are available at the moment.</p>
        </div>
    <?php } else { ?>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">
            <?php foreach ($payments as $p):
                $st = (string) $p['payment_status'];
                $stColor = 'var(--text-secondary)';
                $stBg = 'var(--bg-tertiary)';
                if (strtolower($st) === 'completed' || strtolower($st) === 'paid') {
                    $stColor = 'var(--success)';
                    $stBg = '#d1fae5';
                } elseif (strtolower($st) === 'failed') {
                    $stColor = 'var(--danger)';
                    $stBg = '#fee2e2';
                }
            ?>
                <div class="checkout-card" style="margin: 0; padding: 20px; display: flex; flex-direction: column; justify-content: space-between;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                        <div>
                            <div style="color: var(--text-secondary); font-size: 0.9rem;">Order #<?php echo (int) $p['order_id']; ?></div>
                            <div style="font-weight: 600; font-size: 1.1rem; color: var(--text-primary); margin-top: 4px;"><?php echo htmlspecialchars($p['payment_method']); ?></div>
                        </div>
                        <span style="display: inline-block; padding: 4px 12px; border-radius: 99px; font-size: 0.85rem; font-weight: 600; color: <?php echo $stColor; ?>; background: <?php echo $stBg; ?>;">
                            <?php echo htmlspecialchars($st); ?>
                        </span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                        <div style="color: var(--text-secondary); font-size: 0.85rem;">
                            <?php echo htmlspecialchars(date('F j, Y, g:i a', strtotime($p['payment_date']))); ?>
                        </div>
                        <div style="font-weight: 700; font-size: 1.2rem; color: var(--accent);">
                            ₹<?php echo number_format((float) $p['amount'], 2); ?>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    <?php } ?>
</div>

<?php require_once __DIR__ . '/components/footer.php'; ?>
