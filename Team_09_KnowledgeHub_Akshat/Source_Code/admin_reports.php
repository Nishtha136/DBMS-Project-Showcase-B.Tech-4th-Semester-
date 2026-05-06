<?php
/**
 * Admin DBMS demo — GROUP BY / HAVING, aggregates, subquery vs procedure, views.
 */
require_once __DIR__ . '/includes/init.php';
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/schema_bookstore.php';

if (!isset($_SESSION['customer_id']) || (int) $_SESSION['customer_id'] <= 0) {
    $_SESSION['redirect_after_login'] = 'admin_reports.php';
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

$topCustomers = [];
$sqlTop = "SELECT c.customer_id,
       CONCAT(TRIM(c.first_name), ' ', TRIM(c.last_name)) AS customer_name,
       c.email,
       COUNT(o.order_id) AS orders_placed,
       COALESCE(SUM(o.total_amount), 0) AS total_spent,
       ROUND(COALESCE(AVG(o.total_amount), 0), 2) AS avg_order_value
FROM customer c
INNER JOIN orders o ON o.customer_id = c.customer_id
GROUP BY c.customer_id, c.first_name, c.last_name, c.email
HAVING total_spent > 0 AND (orders_placed >= 2 OR total_spent >= 500)
ORDER BY total_spent DESC
LIMIT 30";
$res = $conn->query($sqlTop);
if ($res) {
    while ($row = $res->fetch_assoc()) {
        $topCustomers[] = $row;
    }
    $res->free();
}

$aboveAvgInline = [];
$sqlBooks = 'SELECT book_id, title, author, price, stock
FROM book
WHERE price > (SELECT AVG(price) FROM book)
ORDER BY price DESC
LIMIT 50';
$res2 = $conn->query($sqlBooks);
if ($res2) {
    while ($row = $res2->fetch_assoc()) {
        $aboveAvgInline[] = $row;
    }
    $res2->free();
}

$aboveAvgProc = [];
if (bookstore_routine_exists($conn, 'sp_report_above_average_books')) {
    try {
        if ($conn->multi_query('CALL sp_report_above_average_books()')) {
            do {
                if ($pr = $conn->store_result()) {
                    while ($row = $pr->fetch_assoc()) {
                        $aboveAvgProc[] = $row;
                    }
                    $pr->free();
                }
            } while ($conn->more_results() && $conn->next_result());
        }
    } catch (Throwable $e) {
        $aboveAvgProc = [];
    }
}

$categoryView = [];
$vRes = $conn->query('SELECT * FROM v_category_inventory ORDER BY category_name');
if ($vRes) {
    while ($row = $vRes->fetch_assoc()) {
        $categoryView[] = $row;
    }
    $vRes->free();
}

$pageTitle = 'Admin — DB reports';
$activeNav = 'admin';
require_once __DIR__ . '/includes/header.php';
?>

<div class="container">
    <div class="page-head">
        <h1>Admin: DBMS report queries</h1>
        <p class="muted">Examples for coursework: aggregates, GROUP BY + HAVING, subqueries, views, and a stored procedure.</p>
        <p><a href="admin_orders.php" class="btn btn-secondary">Back to orders</a></p>
    </div>

    <section class="checkout-card" style="margin-bottom:1.25rem;">
        <h2>Top customers (GROUP BY + HAVING)</h2>
        <p class="muted small">Customers with at least two orders <em>or</em> lifetime spend ≥ ₹500. Uses <code>COUNT</code>, <code>SUM</code>, <code>AVG</code>, <code>GROUP BY</code>, <code>HAVING</code>.</p>
        <?php if ($topCustomers === []) { ?>
            <p class="muted">No rows match yet (place more orders to see data).</p>
        <?php } else { ?>
            <div style="overflow-x:auto;">
                <table class="receipt-table">
                    <thead>
                    <tr>
                        <th>Customer</th>
                        <th>Email</th>
                        <th>Orders</th>
                        <th>Total spent</th>
                        <th>Avg order</th>
                    </tr>
                    </thead>
                    <tbody>
                    <?php foreach ($topCustomers as $r) { ?>
                        <tr>
                            <td><?php echo htmlspecialchars((string) $r['customer_name']); ?> (#<?php echo (int) $r['customer_id']; ?>)</td>
                            <td><?php echo htmlspecialchars((string) $r['email']); ?></td>
                            <td><?php echo (int) $r['orders_placed']; ?></td>
                            <td>₹<?php echo number_format((float) $r['total_spent'], 2); ?></td>
                            <td>₹<?php echo number_format((float) $r['avg_order_value'], 2); ?></td>
                        </tr>
                    <?php } ?>
                    </tbody>
                </table>
            </div>
        <?php } ?>
    </section>

    <section class="checkout-card" style="margin-bottom:1.25rem;">
        <h2>Books above average price (subquery in WHERE)</h2>
        <p class="muted small">Single <code>SELECT</code> with a scalar subquery <code>(SELECT AVG(price) FROM book)</code>.</p>
        <?php if ($aboveAvgInline === []) { ?>
            <p class="muted">No books or empty catalog.</p>
        <?php } else { ?>
            <div style="overflow-x:auto;">
                <table class="receipt-table">
                    <thead>
                    <tr><th>Title</th><th>Author</th><th>Price</th><th>Stock</th></tr>
                    </thead>
                    <tbody>
                    <?php foreach (array_slice($aboveAvgInline, 0, 20) as $r) { ?>
                        <tr>
                            <td><?php echo htmlspecialchars((string) $r['title']); ?></td>
                            <td><?php echo htmlspecialchars((string) $r['author']); ?></td>
                            <td>₹<?php echo number_format((float) $r['price'], 2); ?></td>
                            <td><?php echo (int) $r['stock']; ?></td>
                        </tr>
                    <?php } ?>
                    </tbody>
                </table>
            </div>
        <?php } ?>
    </section>

    <section class="checkout-card" style="margin-bottom:1.25rem;">
        <h2>Same idea via stored procedure</h2>
        <p class="muted small"><code>CALL sp_report_above_average_books()</code> (after <code>sql/upgrade_dbms.sql</code>). Compares to the inline subquery above.</p>
        <?php if (!bookstore_routine_exists($conn, 'sp_report_above_average_books')) { ?>
            <p class="muted">Procedure not installed.</p>
        <?php } elseif ($aboveAvgProc === []) { ?>
            <p class="muted">No rows returned (all prices at or below average).</p>
        <?php } else { ?>
            <div style="overflow-x:auto;">
                <table class="receipt-table">
                    <thead>
                    <tr><th>Title</th><th>Price</th><th>Catalog avg</th></tr>
                    </thead>
                    <tbody>
                    <?php foreach (array_slice($aboveAvgProc, 0, 15) as $r) { ?>
                        <tr>
                            <td><?php echo htmlspecialchars((string) $r['title']); ?></td>
                            <td>₹<?php echo number_format((float) $r['price'], 2); ?></td>
                            <td>₹<?php echo number_format((float) ($r['catalog_avg_price'] ?? 0), 2); ?></td>
                        </tr>
                    <?php } ?>
                    </tbody>
                </table>
            </div>
        <?php } ?>
    </section>

    <section class="checkout-card">
        <h2>Category inventory (VIEW)</h2>
        <p class="muted small">Reads <code>v_category_inventory</code> (join + <code>GROUP BY</code> inside the view definition).</p>
        <?php if ($categoryView === []) { ?>
            <p class="muted">View missing or no categories — run <code>sql/upgrade_dbms.sql</code>.</p>
        <?php } else { ?>
            <div style="overflow-x:auto;">
                <table class="receipt-table">
                    <thead>
                    <tr>
                        <th>Category</th>
                        <th>Titles</th>
                        <th>Units in stock</th>
                        <th>Avg list price</th>
                    </tr>
                    </thead>
                    <tbody>
                    <?php foreach ($categoryView as $r) { ?>
                        <tr>
                            <td><?php echo htmlspecialchars((string) $r['category_name']); ?></td>
                            <td><?php echo (int) $r['title_count']; ?></td>
                            <td><?php echo (int) $r['units_in_stock']; ?></td>
                            <td>₹<?php echo number_format((float) $r['avg_list_price'], 2); ?></td>
                        </tr>
                    <?php } ?>
                    </tbody>
                </table>
            </div>
        <?php } ?>
    </section>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
