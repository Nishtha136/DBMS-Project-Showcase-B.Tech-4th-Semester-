<?php
/**
 * Customer orders history — with filter, search, and clean card UI
 */
require_once __DIR__ . '/../includes/init.php';
require_once __DIR__ . '/../includes/db.php';

if (!isset($_SESSION['customer_id']) || (int) $_SESSION['customer_id'] <= 0) {
    $_SESSION['flash'] = 'Please log in to view your orders.';
    $_SESSION['flash_type'] = 'info';
    $_SESSION['redirect_after_login'] = 'pages/orders.php';
    header('Location: ../login.php');
    exit;
}

$cid = (int) $_SESSION['customer_id'];

// Filter params
$filterStatus = trim($_GET['status'] ?? '');
$filterDate   = trim($_GET['date']   ?? '');
$searchId     = trim($_GET['search'] ?? '');

// Build query dynamically
$where = ['o.customer_id = ?'];
$types = 'i';
$params = [$cid];

if ($filterStatus !== '') {
    $where[] = 'o.order_status = ?';
    $types .= 's';
    $params[] = $filterStatus;
}
if ($filterDate !== '') {
    $where[] = 'DATE(o.order_date) = ?';
    $types .= 's';
    $params[] = $filterDate;
}
if ($searchId !== '') {
    $where[] = 'o.order_id = ?';
    $types .= 'i';
    $params[] = (int)$searchId;
}

$whereSql = implode(' AND ', $where);
$sql = "SELECT
            o.order_id, o.order_date, o.total_amount, o.order_status,
            b.title, b.image, od.quantity, od.subtotal
        FROM orders o
        JOIN order_details od ON o.order_id = od.order_id
        JOIN book b ON od.book_id = b.book_id
        WHERE $whereSql
        ORDER BY o.order_id DESC";

$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$params);
$stmt->execute();
$res = $stmt->get_result();

$orders = [];
while ($row = $res->fetch_assoc()) {
    $oid = (int) $row['order_id'];
    if (!isset($orders[$oid])) {
        $orders[$oid] = [
            'order_id'     => $oid,
            'order_date'   => $row['order_date'],
            'total_amount' => $row['total_amount'],
            'order_status' => $row['order_status'],
            'items'        => []
        ];
    }
    $orders[$oid]['items'][] = [
        'title'    => $row['title'],
        'image'    => $row['image'],
        'quantity' => $row['quantity'],
        'subtotal' => $row['subtotal']
    ];
}
$stmt->close();

// Fetch distinct statuses for filter dropdown
$statusRes = $conn->prepare('SELECT DISTINCT order_status FROM orders WHERE customer_id = ? ORDER BY order_status');
$statusRes->bind_param('i', $cid);
$statusRes->execute();
$statuses = $statusRes->get_result()->fetch_all(MYSQLI_ASSOC);
$statusRes->close();

$pageTitle = 'My Orders';
$activeNav = 'orders';
require_once __DIR__ . '/../components/navbar.php';

$flash = $_SESSION['flash'] ?? '';
$flashType = $_SESSION['flash_type'] ?? 'info';
unset($_SESSION['flash'], $_SESSION['flash_type']);
?>
<style>
/* ── Orders Page ── */
.orders-page {
    max-width: 1100px;
    margin: 0 auto;
    padding: 2rem 1.5rem 4rem;
}
.orders-head {
    margin-bottom: 1.75rem;
}
.orders-head h1 {
    font-size: 2rem;
    font-weight: 800;
    color: var(--text-primary);
    margin-bottom: 4px;
}
.orders-head p { color: var(--text-secondary); }

/* Filter Bar */
.filter-bar {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 14px 18px;
    margin-bottom: 1.75rem;
}
.filter-bar input,
.filter-bar select {
    height: 38px;
    padding: 0 12px;
    border: 1.5px solid var(--border);
    border-radius: 8px;
    font-size: 0.9rem;
    color: var(--text-primary);
    background: var(--bg-secondary);
    outline: none;
    transition: border .2s;
}
.filter-bar input:focus,
.filter-bar select:focus { border-color: var(--accent); }
.filter-bar input[type="text"] { min-width: 160px; }
.filter-bar input[type="date"] { min-width: 150px; }
.filter-bar select { min-width: 140px; }
.filter-bar .btn-filter {
    height: 38px;
    padding: 0 18px;
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background .2s;
}
.filter-bar .btn-filter:hover { background: #e05e00; }
.filter-bar .btn-reset {
    height: 38px;
    padding: 0 16px;
    background: none;
    border: 1.5px solid var(--border);
    border-radius: 8px;
    font-size: 0.9rem;
    color: var(--text-secondary);
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    transition: border .2s, color .2s;
}
.filter-bar .btn-reset:hover { border-color: var(--accent); color: var(--accent); }

/* Order Cards */
.orders-list { display: flex; flex-direction: column; gap: 20px; }
.order-card {
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.order-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.09);
}
.order-card-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 24px;
    border-bottom: 1px solid var(--border);
    background: var(--bg-secondary);
}
.order-card-head .oid {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 3px;
}
.order-card-head .odate {
    font-size: 0.85rem;
    color: var(--text-secondary);
}
.order-card-head .oright {
    text-align: right;
}
.order-card-head .ototal {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--price);
    margin-bottom: 6px;
}
.status-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .5px;
}
.status-paid, .status-delivered, .status-completed {
    color: #059669; background: #d1fae5;
}
.status-pending, .status-placed, .status-processing {
    color: #d97706; background: #fef3c7;
}
.status-cancelled, .status-failed {
    color: var(--danger); background: #fee2e2;
}

/* Order Items */
.order-items { padding: 0 24px; }
.order-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 0;
    border-bottom: 1px solid var(--border);
}
.order-item:last-child { border-bottom: none; }
.order-item img {
    width: 52px; height: 70px;
    object-fit: cover;
    border-radius: 6px;
    border: 1px solid var(--border);
    flex-shrink: 0;
}
.order-item-info { flex: 1; }
.order-item-info .ititle {
    font-weight: 600;
    font-size: 0.97rem;
    margin-bottom: 3px;
    color: var(--text-primary);
}
.order-item-info .iqty {
    font-size: 0.82rem;
    color: var(--text-secondary);
}
.order-item-price {
    font-weight: 700;
    font-size: 0.97rem;
    color: var(--text-primary);
    white-space: nowrap;
}

/* Action row */
.order-card-foot {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 24px;
    border-top: 1px solid var(--border);
    flex-wrap: wrap;
}
.btn-invoice {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 18px;
    background: var(--accent);
    color: #fff;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    text-decoration: none;
    transition: background .2s;
}
.btn-invoice:hover { background: #e05e00; }
.order-status-tag {
    display: inline-flex;
    align-items: center;
    padding: 8px 16px;
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    gap: 6px;
}

@media (max-width: 600px) {
    .orders-page { padding: 1.5rem 1rem 3rem; }
    .filter-bar { flex-direction: column; align-items: stretch; }
    .filter-bar input, .filter-bar select, .filter-bar .btn-filter, .filter-bar .btn-reset {
        width: 100%;
    }
    .order-card-head { flex-direction: column; align-items: flex-start; gap: 10px; }
    .order-card-head .oright { text-align: left; }
}
</style>

<div class="orders-page fade-in">

    <?php if ($flash !== '') {
        $cls = $flashType === 'error' ? 'alert-error' : ($flashType === 'success' ? 'alert-success' : 'alert-info');
        echo '<div class="alert ' . htmlspecialchars($cls) . '" style="margin-bottom:1.25rem;">' . htmlspecialchars($flash) . '</div>';
    } ?>

    <div class="orders-head">
        <h1>My Orders</h1>
        <p>View your past orders and their current status.</p>
    </div>

    <!-- Filter Bar -->
    <form method="GET" class="filter-bar">
        <input type="text" name="search" placeholder="Order # / ID" value="<?= htmlspecialchars($searchId) ?>">
        <select name="status">
            <option value="">All Statuses</option>
            <?php foreach ($statuses as $s): ?>
                <option value="<?= htmlspecialchars($s['order_status']) ?>"
                    <?= $filterStatus === $s['order_status'] ? 'selected' : '' ?>>
                    <?= htmlspecialchars($s['order_status']) ?>
                </option>
            <?php endforeach; ?>
        </select>
        <input type="date" name="date" value="<?= htmlspecialchars($filterDate) ?>">
        <button type="submit" class="btn-filter">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" style="margin-right:5px"><path d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>
            Filter
        </button>
        <a href="orders.php" class="btn-reset">Reset</a>
    </form>

    <?php if (count($orders) === 0): ?>
        <div style="background:var(--bg-primary);border:1px solid var(--border);border-radius:14px;padding:60px 20px;text-align:center;">
            <svg style="width:56px;height:56px;margin:0 auto 16px;color:var(--border);display:block;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
            <h3 style="margin-bottom:8px;">No orders found</h3>
            <p style="color:var(--text-secondary);margin-bottom:20px;"><?= ($filterStatus || $filterDate || $searchId) ? 'No orders match your filter. ' : 'You haven\'t placed any orders yet. ' ?></p>
            <?php if ($filterStatus || $filterDate || $searchId): ?>
                <a href="orders.php" class="btn btn-primary">Clear Filters</a>
            <?php else: ?>
                <a href="../pages/home.php" class="btn btn-primary">Browse Books</a>
            <?php endif; ?>
        </div>
    <?php else: ?>
        <div class="orders-list">
            <?php foreach ($orders as $oid => $o):
                $dt    = $o['order_date'];
                $tot   = (float) $o['total_amount'];
                $st    = $o['order_status'];
                $stKey = strtolower($st);
                // Determine badge class
                if (in_array($stKey, ['paid','delivered','completed'])) $badgeClass = 'status-paid';
                elseif (in_array($stKey, ['pending','placed','processing'])) $badgeClass = 'status-pending';
                elseif (in_array($stKey, ['cancelled','failed'])) $badgeClass = 'status-cancelled';
                else $badgeClass = '';
            ?>
            <div class="order-card">
                <!-- Header -->
                <div class="order-card-head">
                    <div>
                        <div class="oid">Order #<?= $oid ?></div>
                        <div class="odate">Placed on <?= date('d M Y, g:i a', strtotime($dt)) ?></div>
                    </div>
                    <div class="oright">
                        <div class="ototal">&#8377;<?= number_format($tot, 2) ?></div>
                        <span class="status-badge <?= $badgeClass ?>"><?= htmlspecialchars($st) ?></span>
                    </div>
                </div>

                <!-- Items -->
                <div class="order-items">
                    <?php foreach ($o['items'] as $it):
                        $imgRaw = trim((string) $it['image']);
                        $imgSrc = $imgRaw === '' ? '../assets/placeholder.svg' : htmlspecialchars($imgRaw, ENT_QUOTES, 'UTF-8');
                        if ($imgSrc !== '../assets/placeholder.svg' && !preg_match('~^(?:f|ht)tps?://~i', $imgSrc) && strpos($imgSrc, '/') !== 0 && strpos($imgSrc, '../') !== 0) {
                            $imgSrc = '../' . $imgSrc;
                        }
                    ?>
                    <div class="order-item">
                        <img src="<?= $imgSrc ?>" alt="" onerror="this.src='../assets/placeholder.svg'">
                        <div class="order-item-info">
                            <div class="ititle"><?= htmlspecialchars($it['title']) ?></div>
                            <div class="iqty">Qty: <?= (int)$it['quantity'] ?></div>
                        </div>
                        <div class="order-item-price">&#8377;<?= number_format((float)$it['subtotal'], 2) ?></div>
                    </div>
                    <?php endforeach; ?>
                </div>

                <!-- Footer actions -->
                <div class="order-card-foot">
                    <a href="invoice.php?order_id=<?= $oid ?>" class="btn-invoice">
                        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                        View Invoice
                    </a>
                    <span class="order-status-tag">
                        <?= htmlspecialchars($st) ?> &nbsp;&middot;&nbsp; <?= date('d M Y', strtotime($dt)) ?>
                    </span>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>
</div>

<?php require_once __DIR__ . '/../components/footer.php'; ?>
