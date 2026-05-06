<?php
/**
 * pages/admin_orders.php — Admin Dashboard for Orders
 */
require_once __DIR__ . '/../includes/init.php';
require_once __DIR__ . '/../includes/db.php';

// Auth checks
if (!isset($_SESSION['customer_id']) || (int) $_SESSION['customer_id'] <= 0) {
    $_SESSION['redirect_after_login'] = 'pages/admin_orders.php';
    $_SESSION['flash'] = 'Please log in as admin.';
    $_SESSION['flash_type'] = 'error';
    header('Location: ../login.php');
    exit;
}
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    $_SESSION['flash'] = 'Access denied (admin only).';
    $_SESSION['flash_type'] = 'error';
    header('Location: ../index.php');
    exit;
}

// Handle Status Updates
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'status') {
    $oid = isset($_POST['order_id']) ? (int) $_POST['order_id'] : 0;
    $new = (string) $_POST['new_status'];
    
    if ($oid > 0 && trim($new) !== '') {
        $stmt = $conn->prepare('UPDATE orders SET order_status = ? WHERE order_id = ?');
        $stmt->bind_param('si', $new, $oid);
        if ($stmt->execute()) {
            $_SESSION['flash'] = "Order #$oid updated to $new.";
            $_SESSION['flash_type'] = 'success';
        } else {
            $_SESSION['flash'] = 'Database error updating status.';
            $_SESSION['flash_type'] = 'error';
        }
        $stmt->close();
    }
    header('Location: admin_orders.php');
    exit;
}

// Fetch all orders with details using the exact JOIN requested (plus necessary fields for UI)
$sql = 'SELECT 
            o.order_id, o.order_date, o.total_amount, o.order_status, o.customer_id,
            c.first_name, c.last_name, c.email,
            a.full_name, a.phone, a.address_line, a.city, a.state, a.pincode,
            b.title, b.image, od.quantity, od.subtotal
        FROM orders o
        JOIN customer c ON o.customer_id = c.customer_id
        LEFT JOIN address a ON o.address_id = a.address_id
        JOIN order_details od ON o.order_id = od.order_id
        JOIN book b ON od.book_id = b.book_id
        ORDER BY o.order_date DESC';

$res = $conn->query($sql);
$ordersMap = [];

if ($res) {
    while ($row = $res->fetch_assoc()) {
        $oid = (int) $row['order_id'];
        if (!isset($ordersMap[$oid])) {
            $ordersMap[$oid] = [
                'order_id' => $oid,
                'order_date' => $row['order_date'],
                'total_amount' => $row['total_amount'],
                'order_status' => $row['order_status'],
                'customer_id' => $row['customer_id'],
                'first_name' => $row['first_name'],
                'last_name' => $row['last_name'],
                'email' => $row['email'],
                'full_name' => $row['full_name'],
                'phone' => $row['phone'],
                'address_line' => $row['address_line'],
                'city' => $row['city'],
                'state' => $row['state'],
                'pincode' => $row['pincode'],
                'items' => []
            ];
        }
        $ordersMap[$oid]['items'][] = [
            'title' => $row['title'],
            'image' => $row['image'],
            'qty' => (int) $row['quantity'],
            'price' => (float) $row['subtotal']
        ];
    }
}

$pageTitle = 'Admin — Orders';
$activeNav = 'admin';
require_once __DIR__ . '/../components/navbar.php';
?>

<style>
body { background-color: var(--bg-tertiary); }
.admin-layout {
    display: grid;
    grid-template-columns: 240px 320px 1fr 320px;
    gap: 20px;
    height: calc(100vh - 80px);
    padding: 20px;
    box-sizing: border-box;
}

@media (max-width: 1400px) {
    .admin-layout { grid-template-columns: 200px 300px 1fr 300px; }
}
@media (max-width: 1100px) {
    .admin-layout { grid-template-columns: 240px 1fr; height: auto; }
}
@media (max-width: 768px) {
    .admin-layout { grid-template-columns: 1fr; }
}

.dash-panel {
    background: var(--bg-primary);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.dash-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
    background: var(--bg-primary);
    position: sticky;
    top: 0;
    z-index: 10;
}

.dash-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
}

/* Sidebar Navigation */
.admin-nav {
    list-style: none;
    padding: 20px;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.admin-nav li a {
    display: block;
    padding: 12px 16px;
    border-radius: 8px;
    color: var(--text-secondary);
    text-decoration: none;
    font-weight: 500;
    transition: all 0.2s;
}
.admin-nav li a:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
}
.admin-nav li a.active {
    background: rgba(255, 106, 0, 0.1);
    color: var(--accent);
    font-weight: 600;
}

/* Order List Item */
.order-list-item {
    padding: 16px;
    border-bottom: 1px solid var(--border);
    cursor: pointer;
    transition: background 0.2s, border-left 0.2s;
    border-left: 3px solid transparent;
}
.order-list-item:hover { background: var(--bg-tertiary); }
.order-list-item.active {
    background: rgba(255, 106, 0, 0.05);
    border-left-color: var(--accent);
}

.status-badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 99px;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
}

/* Timeline */
.timeline {
    position: relative;
    padding-left: 24px;
    margin-top: 16px;
}
.timeline::before {
    content: '';
    position: absolute;
    left: 7px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--border);
}
.timeline-item {
    position: relative;
    margin-bottom: 16px;
}
.timeline-item::before {
    content: '';
    position: absolute;
    left: -22px;
    top: 4px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--bg-primary);
    border: 2px solid var(--border);
}
.timeline-item.done::before {
    background: var(--success);
    border-color: var(--success);
}
.order-address {
    margin-top: 10px;
    padding: 10px;
    background: #f8f8f8;
    border-radius: 8px;
    font-size: 14px;
}
</style>

<div class="admin-layout fade-in">
    
    <!-- LEFT SIDEBAR: Navigation -->
    <div class="dash-panel">
        <div class="dash-header">
            <h2 style="font-size: 1.2rem; margin: 0; color: var(--accent);">Knowledge Hub</h2>
            <p class="muted" style="font-size: 0.85rem; margin-top: 4px;">Admin Portal</p>
        </div>
        <ul class="admin-nav">
            <li><a href="admin_orders.php" class="active">Orders Dashboard</a></li>
            <li><a href="admin_inventory.php">Inventory</a></li>
        </ul>
    </div>

    <!-- ORDER LIST -->
    <div class="dash-panel">
        <div class="dash-header">
            <h2 style="font-size: 1.1rem; margin: 0;">Orders</h2>
            <p class="muted" style="font-size: 0.85rem; margin-top: 4px;">Showing <?php echo count($ordersMap); ?> orders</p>
        </div>
        <div class="dash-content" style="padding: 0;" id="order-list-container">
            <!-- Populated via JS -->
        </div>
    </div>

    <!-- MIDDLE PANEL: Order Details -->
    <div class="dash-panel">
        <div class="dash-header" style="display: flex; justify-content: space-between; align-items: center;">
            <h2 style="font-size: 1.1rem; margin: 0;" id="detail-title">Select an order</h2>
        </div>
        <div class="dash-content" id="detail-content" style="display: none;">
            
            <h3 style="font-size: 1rem; margin-bottom: 16px; color: var(--text-secondary);">PRODUCT DETAILS</h3>
            <div id="detail-items" style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 32px;">
                <!-- Populated via JS -->
            </div>

            <div style="border-top: 1px dashed var(--border); padding-top: 16px; margin-bottom: 32px; display: flex; flex-direction: column; gap: 8px; width: 300px; margin-left: auto;">
                <div style="display: flex; justify-content: space-between; color: var(--text-secondary);">
                    <span>Subtotal:</span>
                    <span id="detail-subtotal">₹0.00</span>
                </div>
                <div style="display: flex; justify-content: space-between; color: var(--text-secondary);">
                    <span>Shipping:</span>
                    <span style="color: var(--success);">Free</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 1.2rem; color: var(--text-primary); margin-top: 8px;">
                    <span>Total:</span>
                    <span id="detail-total">₹0.00</span>
                </div>
            </div>
            
            <h3 style="font-size: 1rem; margin-bottom: 16px; color: var(--text-secondary);">QUICK UPDATE</h3>
            <form method="post" action="admin_orders.php" style="display: flex; gap: 8px;" id="status-form">
                <input type="hidden" name="action" value="status">
                <input type="hidden" name="order_id" id="quick-order-id" value="">
                <select id="quick-status" name="new_status" class="filter-select" style="flex: 1;">
                    <option value="Placed">Placed</option>
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                </select>
                <button type="submit" class="btn btn-primary btn-anim" style="transition: transform 0.2s;">Update Status</button>
            </form>
            <?php
            $flash = $_SESSION['flash'] ?? '';
            $flashType = $_SESSION['flash_type'] ?? 'info';
            unset($_SESSION['flash'], $_SESSION['flash_type']);
            if ($flash !== '') {
                $cls = $flashType === 'error' ? 'alert-error' : ($flashType === 'success' ? 'alert-success' : 'alert-info');
                echo '<div class="alert ' . htmlspecialchars($cls) . '" style="margin-top: 16px; font-size: 0.9rem;">' . htmlspecialchars($flash) . '</div>';
            }
            ?>
        </div>
    </div>

    <!-- RIGHT PANEL: Customer Info -->
    <div class="dash-panel">
        <div class="dash-header">
            <h2 style="font-size: 1.1rem; margin: 0;">Customer Info</h2>
        </div>
        <div class="dash-content" id="customer-info-content" style="display: none;">
            
            <!-- Profile -->
            <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
                <div style="width: 48px; height: 48px; background: var(--bg-tertiary); border-radius: 50%; display: flex; justify-content: center; align-items: center; font-weight: 700; color: var(--accent); font-size: 1.2rem;" id="cust-initials">
                    --
                </div>
                <div>
                    <div style="font-weight: 600; font-size: 1.1rem;" id="cust-name">Name</div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem;" id="cust-email">Email</div>
                </div>
            </div>

            <!-- Delivery Address -->
            <div class="order-address" id="order-address-container" style="margin-bottom: 24px;">
            </div>

            <!-- Timeline -->
            <h3 style="font-size: 1rem; color: var(--text-secondary);">Order History</h3>
            <div class="timeline" id="order-timeline">
                <!-- Populated via JS -->
            </div>

        </div>
    </div>

</div>

<script>
const orders = <?php echo json_encode(array_values($ordersMap)); ?>;
let activeOrderId = null;

function getStatusStyle(status) {
    const s = status ? status.toLowerCase() : '';
    if (s === 'completed' || s === 'paid' || s === 'shipped' || s === 'delivered') return { color: 'var(--success)', bg: '#d1fae5' };
    if (s === 'pending' || s === 'placed' || s === 'processing') return { color: '#d97706', bg: '#fef3c7' };
    if (s === 'failed' || s === 'cancelled') return { color: 'var(--danger)', bg: '#fee2e2' };
    return { color: 'var(--text-secondary)', bg: 'var(--bg-tertiary)' };
}

function formatMoney(n) {
    return '₹' + parseFloat(n).toFixed(2);
}

function resolveImage(raw) {
    if (!raw || raw.trim() === '') return '../assets/placeholder.svg';
    if (raw.startsWith('http')) return raw;
    if (raw.startsWith('../')) return raw;
    if (raw.startsWith('/')) return '..' + raw;
    return '../' + raw;
}

function renderOrderList() {
    const container = document.getElementById('order-list-container');
    container.innerHTML = '';
    
    orders.forEach(o => {
        const style = getStatusStyle(o.order_status);
        const qty = o.items.reduce((sum, item) => sum + item.qty, 0);
        
        const div = document.createElement('div');
        div.className = 'order-list-item' + (o.order_id === activeOrderId ? ' active' : '');
        div.onclick = () => selectOrder(o.order_id);
        
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-weight: 600;">Order #${o.order_id}</span>
                <span class="status-badge" style="color: ${style.color}; background: ${style.bg};">${o.order_status || 'Placed'}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                <div style="width: 28px; height: 28px; background: var(--bg-tertiary); border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 0.75rem; font-weight: bold;">
                    ${o.first_name.charAt(0)}${o.last_name.charAt(0)}
                </div>
                <div>
                    <div style="font-size: 0.9rem;">${o.first_name} ${o.last_name}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">${o.order_date}</div>
                </div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                <span class="muted">Items: ${qty}</span>
                <span style="font-weight: 600; color: var(--accent);">${formatMoney(o.total_amount)}</span>
            </div>
        `;
        container.appendChild(div);
    });
}

function selectOrder(id) {
    activeOrderId = id;
    renderOrderList(); // update active class
    
    const order = orders.find(o => o.order_id === id);
    if (!order) return;
    
    // Show panels
    document.getElementById('detail-content').style.display = 'block';
    document.getElementById('customer-info-content').style.display = 'block';
    
    // Detail Panel
    document.getElementById('detail-title').innerText = 'Order #' + order.order_id;
    document.getElementById('quick-status').value = order.order_status || 'Placed';
    document.getElementById('quick-order-id').value = order.order_id;
    
    const itemsContainer = document.getElementById('detail-items');
    itemsContainer.innerHTML = `
        <table style="width:100%;border-collapse:collapse;font-size:.88rem;">
            <thead>
                <tr style="background:var(--bg-tertiary);border-bottom:2px solid var(--border);">
                    <th style="padding:10px 12px;text-align:left;font-weight:600;color:var(--text-secondary);text-transform:uppercase;font-size:.75rem;letter-spacing:.5px">Book</th>
                    <th style="padding:10px 12px;text-align:center;font-weight:600;color:var(--text-secondary);text-transform:uppercase;font-size:.75rem;letter-spacing:.5px">Qty</th>
                    <th style="padding:10px 12px;text-align:right;font-weight:600;color:var(--text-secondary);text-transform:uppercase;font-size:.75rem;letter-spacing:.5px">Unit Price</th>
                    <th style="padding:10px 12px;text-align:right;font-weight:600;color:var(--text-secondary);text-transform:uppercase;font-size:.75rem;letter-spacing:.5px">Subtotal</th>
                </tr>
            </thead>
            <tbody>
                ${order.items.map(it => `
                    <tr style="border-bottom:1px solid var(--border);">
                        <td style="padding:12px;display:flex;align-items:center;gap:10px;">
                            <img src="${resolveImage(it.image)}" style="width:40px;height:54px;object-fit:cover;border-radius:4px;box-shadow:0 2px 6px rgba(0,0,0,.1);flex-shrink:0;">
                            <div style="font-weight:500;line-height:1.4;">${it.title}</div>
                        </td>
                        <td style="padding:12px;text-align:center;">
                            <span style="background:var(--bg-tertiary);padding:2px 10px;border-radius:999px;font-weight:600;">${it.qty}</span>
                        </td>
                        <td style="padding:12px;text-align:right;color:var(--text-secondary);">${formatMoney(it.price)}</td>
                        <td style="padding:12px;text-align:right;font-weight:600;color:var(--accent);">${formatMoney(it.price * it.qty)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
    
    document.getElementById('detail-subtotal').innerText = formatMoney(order.total_amount);
    document.getElementById('detail-total').innerText = formatMoney(order.total_amount);
    
    // Customer Info Panel
    document.getElementById('cust-initials').innerText = order.first_name.charAt(0) + order.last_name.charAt(0);
    document.getElementById('cust-name').innerText = order.first_name + ' ' + order.last_name;
    document.getElementById('cust-email').innerText = order.email;
    
    // Address Info Panel
    const addressContainer = document.getElementById('order-address-container');
    if (!order.address_line) {
        addressContainer.innerHTML = "<span style='color:red;'>No address found</span>";
    } else {
        const esc = s => (s||'').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        addressContainer.innerHTML = `
            <strong>Delivery Address:</strong><br>
            ${esc(order.full_name)}<br>
            ${esc(order.address_line)}<br>
            ${esc(order.city)}, ${esc(order.state)} - ${esc(order.pincode)}<br>
            📞 ${esc(order.phone)}
        `;
    }
    
    // Timeline
    const tContainer = document.getElementById('order-timeline');
    const stUpper = (order.order_status || '').toUpperCase();
    const isCompleted = stUpper === 'COMPLETED' || stUpper === 'SHIPPED' || stUpper === 'DELIVERED';
    tContainer.innerHTML = `
        <div class="timeline-item done">
            <div style="font-weight: 500; font-size: 0.95rem;">Order Placed</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">${order.order_date}</div>
        </div>
        <div class="timeline-item ${isCompleted ? 'done' : ''}">
            <div style="font-weight: 500; font-size: 0.95rem;">Order ${order.order_status}</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">${isCompleted ? 'Fulfilled' : 'Pending Action'}</div>
        </div>
    `;
}

// Initial render
renderOrderList();
if (orders.length > 0) {
    selectOrder(orders[0].order_id);
}

// Animation snippet
document.querySelectorAll('.btn-anim').forEach(btn => {
    btn.addEventListener('mousedown', () => btn.style.transform = 'scale(0.98)');
    btn.addEventListener('mouseup', () => btn.style.transform = 'scale(1)');
    btn.addEventListener('mouseleave', () => btn.style.transform = 'scale(1)');
});
</script>

<?php require_once __DIR__ . '/../components/footer.php'; ?>
