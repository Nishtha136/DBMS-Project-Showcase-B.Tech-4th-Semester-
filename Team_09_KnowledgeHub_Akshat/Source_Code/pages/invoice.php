<?php
/**
 * invoice.php — Printable / downloadable invoice for a completed order.
 */
require_once dirname(__DIR__) . '/includes/init.php';
require_once dirname(__DIR__) . '/includes/db.php';

if (!isset($_SESSION['customer_id']) || (int) $_SESSION['customer_id'] <= 0) {
    header('Location: ../login.php'); exit;
}

$orderId = (int) ($_GET['order_id'] ?? 0);
if ($orderId <= 0) { header('Location: orders.php'); exit; }

$cid  = (int) $_SESSION['customer_id'];
$role = $_SESSION['role'] ?? 'user';

// Fetch order — customers can only see their own; admins can see any
$orderSql = $role === 'admin'
    ? 'SELECT o.*, c.first_name, c.last_name, c.email, c.phone_number,
              a.full_name AS addr_name, a.phone AS addr_phone, a.address_line, a.city, a.state, a.pincode
       FROM orders o
       JOIN customer c ON o.customer_id = c.customer_id
       LEFT JOIN address a ON o.address_id = a.address_id
       WHERE o.order_id = ?'
    : 'SELECT o.*, c.first_name, c.last_name, c.email, c.phone_number,
              a.full_name AS addr_name, a.phone AS addr_phone, a.address_line, a.city, a.state, a.pincode
       FROM orders o
       JOIN customer c ON o.customer_id = c.customer_id
       LEFT JOIN address a ON o.address_id = a.address_id
       WHERE o.order_id = ? AND o.customer_id = ?';

$stmt = $conn->prepare($orderSql);
if ($role === 'admin') {
    $stmt->bind_param('i', $orderId);
} else {
    $stmt->bind_param('ii', $orderId, $cid);
}
$stmt->execute();
$order = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$order) { $_SESSION['flash'] = 'Order not found.'; header('Location: orders.php'); exit; }

// Fetch order items
$iStmt = $conn->prepare(
    'SELECT od.quantity, od.subtotal, b.title, b.author, b.price
     FROM order_details od
     JOIN book b ON od.book_id = b.book_id
     WHERE od.order_id = ?'
);
$iStmt->bind_param('i', $orderId);
$iStmt->execute();
$items = $iStmt->get_result()->fetch_all(MYSQLI_ASSOC);
$iStmt->close();

// Fetch payment info
$pStmt = $conn->prepare('SELECT payment_method, payment_status, payment_date FROM payment WHERE order_id = ? LIMIT 1');
$pStmt->bind_param('i', $orderId);
$pStmt->execute();
$payment = $pStmt->get_result()->fetch_assoc() ?? [];
$pStmt->close();

$subtotal    = (float)($order['total_amount'] ?? 0);
$gst         = (float)($order['gst_amount']   ?? 0);
$delivery    = (float)($order['delivery_fee'] ?? 0);
$grandTotal  = $subtotal;
// Recalculate subtotal from items if gst available
if ($gst > 0) {
    $subtotalCalc = 0;
    foreach ($items as $it) { $subtotalCalc += (float)$it['subtotal']; }
    $subtotal = $subtotalCalc;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Invoice #<?= $orderId ?> | Knowledge Hub</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:#f3f4f6;color:#111827;padding:24px}
.invoice-wrap{max-width:800px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.08);overflow:hidden}
/* Top bar */
.inv-header{background:linear-gradient(135deg,#ff6a00,#ff8f3f);padding:32px 40px;color:#fff;display:flex;justify-content:space-between;align-items:flex-start}
.inv-logo{font-size:1.6rem;font-weight:800;letter-spacing:-0.5px}
.inv-logo span{opacity:.8;font-weight:400}
.inv-badge{background:rgba(255,255,255,.2);padding:6px 16px;border-radius:99px;font-size:.8rem;font-weight:600;backdrop-filter:blur(4px)}
.inv-id{font-size:1rem;margin-top:6px;opacity:.85}
/* Body */
.inv-body{padding:36px 40px}
.inv-meta{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:32px}
.meta-block h4{font-size:.72rem;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;margin-bottom:8px}
.meta-block p{font-size:.9rem;line-height:1.65;color:#374151}
.meta-block strong{color:#111;font-size:.95rem}
/* Table */
.inv-table{width:100%;border-collapse:collapse;margin-bottom:24px}
.inv-table thead tr{background:#f9fafb;border-bottom:2px solid #f3f4f6}
.inv-table th{padding:12px 14px;font-size:.78rem;text-transform:uppercase;letter-spacing:.5px;color:#6b7280;text-align:left;font-weight:600}
.inv-table td{padding:14px 14px;font-size:.9rem;border-bottom:1px solid #f3f4f6;vertical-align:top}
.inv-table tbody tr:last-child td{border-bottom:none}
.inv-table .book-title{font-weight:600;color:#111;margin-bottom:2px}
.inv-table .book-author{font-size:.78rem;color:#9ca3af}
.text-right{text-align:right}
/* Totals */
.totals-wrap{display:flex;justify-content:flex-end}
.totals-box{width:280px}
.tot-row{display:flex;justify-content:space-between;font-size:.88rem;padding:7px 0;color:#4b5563}
.tot-row.grand{border-top:2px solid #111;margin-top:8px;padding-top:12px;font-weight:700;font-size:1.05rem;color:#111}
.tot-row.grand span:last-child{color:#ff6a00;font-size:1.15rem}
/* Footer */
.inv-footer{background:#f9fafb;padding:20px 40px;border-top:1px solid #f3f4f6;display:flex;justify-content:space-between;align-items:center}
.inv-footer p{font-size:.8rem;color:#9ca3af}
.inv-status{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:99px;font-size:.78rem;font-weight:600}
.inv-status.paid{background:#d1fae5;color:#065f46}
.inv-status.pending{background:#fef3c7;color:#92400e}
/* Print / Actions */
.actions{display:flex;gap:12px;justify-content:center;padding:24px;border-top:1px solid #f3f4f6}
.btn-print{display:inline-flex;align-items:center;gap:8px;padding:12px 28px;background:#ff6a00;color:#fff;border:none;border-radius:8px;font-size:.95rem;font-weight:600;cursor:pointer;text-decoration:none;transition:background .2s}
.btn-print:hover{background:#e05e00}
.btn-back{display:inline-flex;align-items:center;gap:8px;padding:12px 24px;border:1.5px solid #e5e7eb;background:#fff;color:#374151;border-radius:8px;font-size:.95rem;font-weight:500;cursor:pointer;text-decoration:none;transition:all .2s}
.btn-back:hover{border-color:#ff6a00;color:#ff6a00}
@media print {
    body{background:#fff;padding:0}
    .actions{display:none}
    .inv-wrap{box-shadow:none;border-radius:0}
}
</style>
</head>
<body>

<div class="invoice-wrap">
  <!-- Header -->
  <div class="inv-header">
    <div>
      <div class="inv-logo">Knowledge <span>Hub</span></div>
      <div class="inv-id">Invoice #<?= str_pad($orderId, 6, '0', STR_PAD_LEFT) ?></div>
    </div>
    <div style="text-align:right">
      <div class="inv-badge">TAX INVOICE</div>
      <div style="margin-top:10px;font-size:.85rem;opacity:.85">
        Date: <?= date('d M Y', strtotime($order['order_date'])) ?>
      </div>
    </div>
  </div>

  <!-- Meta -->
  <div class="inv-body">
    <div class="inv-meta">
      <!-- Bill To -->
      <div class="meta-block">
        <h4>Bill To</h4>
        <p>
          <strong><?= htmlspecialchars($order['first_name'] . ' ' . $order['last_name']) ?></strong><br>
          <?= htmlspecialchars($order['email']) ?><br>
          <?= htmlspecialchars($order['phone_number'] ?? '') ?>
        </p>
      </div>
      <!-- Ship To -->
      <div class="meta-block">
        <h4>Ship To</h4>
        <?php if ($order['addr_name']): ?>
        <p>
          <strong><?= htmlspecialchars($order['addr_name']) ?></strong><br>
          <?= htmlspecialchars($order['address_line']) ?><br>
          <?= htmlspecialchars($order['city']) ?>, <?= htmlspecialchars($order['state']) ?> — <?= htmlspecialchars($order['pincode']) ?><br>
          📞 <?= htmlspecialchars($order['addr_phone']) ?>
        </p>
        <?php else: ?>
        <p style="color:#9ca3af;font-style:italic">No address recorded</p>
        <?php endif; ?>
      </div>
      <!-- Order Info -->
      <div class="meta-block">
        <h4>Order Details</h4>
        <p>
          Order ID: <strong>#<?= str_pad($orderId, 6, '0', STR_PAD_LEFT) ?></strong><br>
          Status: <strong><?= htmlspecialchars($order['order_status'] ?? 'Placed') ?></strong><br>
          Date: <strong><?= date('d M Y, h:i A', strtotime($order['order_date'])) ?></strong>
        </p>
      </div>
      <!-- Payment Info -->
      <div class="meta-block">
        <h4>Payment</h4>
        <p>
          Method: <strong><?= htmlspecialchars($payment['payment_method'] ?? ($order['order_status'] === 'Paid' ? 'Card' : 'COD')) ?></strong><br>
          Status:
          <span class="inv-status <?= strtolower($payment['payment_status'] ?? '') === 'completed' || strtolower($order['order_status'] ?? '') === 'paid' ? 'paid' : 'pending' ?>">
            <?= htmlspecialchars($payment['payment_status'] ?? $order['order_status'] ?? 'Pending') ?>
          </span>
        </p>
      </div>
    </div>

    <!-- Items Table -->
    <table class="inv-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Book</th>
          <th class="text-right">Unit Price</th>
          <th class="text-right">Qty</th>
          <th class="text-right">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($items as $i => $it): ?>
        <tr>
          <td style="color:#9ca3af"><?= $i + 1 ?></td>
          <td>
            <div class="book-title"><?= htmlspecialchars($it['title']) ?></div>
            <div class="book-author">by <?= htmlspecialchars($it['author']) ?></div>
          </td>
          <td class="text-right">₹<?= number_format((float)$it['price'], 2) ?></td>
          <td class="text-right"><?= (int)$it['quantity'] ?></td>
          <td class="text-right" style="font-weight:600">₹<?= number_format((float)$it['subtotal'], 2) ?></td>
        </tr>
        <?php endforeach; ?>
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals-wrap">
      <div class="totals-box">
        <div class="tot-row"><span>Subtotal</span><span>₹<?= number_format($subtotal, 2) ?></span></div>
        <div class="tot-row"><span>GST (18%)</span><span>₹<?= number_format($gst, 2) ?></span></div>
        <div class="tot-row">
          <span>Delivery</span>
          <span><?= $delivery == 0 ? 'FREE' : '₹' . number_format($delivery, 2) ?></span>
        </div>
        <div class="tot-row grand">
          <span>Grand Total</span>
          <span>₹<?= number_format((float)$order['total_amount'], 2) ?></span>
        </div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="inv-footer">
    <p>Thank you for shopping with Knowledge Hub! 📚</p>
    <p>This is a computer-generated invoice. No signature required.</p>
  </div>

  <!-- Actions -->
  <div class="actions">
    <a href="orders.php" class="btn-back">
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>
      Back to Orders
    </a>
    <button class="btn-print" onclick="window.print()">
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
      Download / Print Invoice
    </button>
  </div>
</div>

</body>
</html>
