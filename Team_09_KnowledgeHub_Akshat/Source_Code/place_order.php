<?php
/**
 * place_order.php — Order placement: stored procedure when available, else mysqli transactions.
 *
 * Procedure path: CALL sp_place_order (atomic inserts + stock + payment).
 * PHP path: START TRANSACTION / COMMIT / ROLLBACK, SELECT ... FOR UPDATE, guarded stock UPDATE.
 */
require_once __DIR__ . '/includes/init.php';
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/schema_bookstore.php';
require_once __DIR__ . '/includes/cart_service.php';

// Make mysqli throw exceptions so we reliably rollback on any DB error.
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: cart.php');
    exit;
}

if (empty($_SESSION['cart'])) {
    $_SESSION['flash'] = 'Your cart is empty.';
    $_SESSION['flash_type'] = 'error';
    header('Location: cart.php');
    exit;
}

if (!isset($_SESSION['customer_id']) || (int) $_SESSION['customer_id'] <= 0) {
    $_SESSION['flash'] = 'Please log in to place an order.';
    $_SESSION['flash_type'] = 'error';
    $_SESSION['redirect_after_login'] = 'checkout.php';
    header('Location: login.php');
    exit;
}

$methodRaw = $_POST['payment_method'] ?? '';
$allowed = ['COD', 'UPI', 'Card'];
if (!in_array($methodRaw, $allowed, true)) {
    $_SESSION['flash'] = 'Invalid payment method.';
    $_SESSION['flash_type'] = 'error';
    header('Location: checkout.php');
    exit;
}

// Resolve address_id: prefer POST, fallback to session
$addressId = (int)($_POST['address_id'] ?? $_SESSION['selected_address_id'] ?? 0);
if ($addressId > 0) {
    unset($_SESSION['checkout_address_id']);
} else {
    // No address selected — reject and send back to checkout
    $_SESSION['flash'] = 'Please select a delivery address before placing your order.';
    $_SESSION['flash_type'] = 'error';
    header('Location: pages/checkout.php');
    exit;
}

$customerId = (int) $_SESSION['customer_id'];
$books = cart_load_books_by_ids($conn, $_SESSION['cart']);
$lines = cart_build_order_lines($_SESSION['cart'], $books);

if ($lines === []) {
    $_SESSION['flash'] = 'No valid items to order (check stock).';
    $_SESSION['flash_type'] = 'error';
    header('Location: cart.php');
    exit;
}

$grandTotal = cart_order_grand_total($lines);
if ($grandTotal <= 0) {
    $_SESSION['flash'] = 'Order total is invalid.';
    $_SESSION['flash_type'] = 'error';
    header('Location: checkout.php');
    exit;
}

// Reduce deadlock risk by locking books in a stable order.
usort($lines, static fn ($a, $b) => ((int) $a['book_id']) <=> ((int) $b['book_id']));

    $summary = cart_checkout_summary($conn, $_SESSION['cart']);
    $gstAmount = $summary['gst'];
    $deliveryFee = $summary['delivery'];

    if (bookstore_routine_exists($conn, 'sp_place_order')) {
        try {
            $json = cart_lines_to_sp_json($lines);
            $conn->query('SET @p_oid = 0, @p_err = NULL');
            $stmtSp = $conn->prepare('CALL sp_place_order(?, ?, ?, ?, ?, ?, @p_oid, @p_err)');
            if (!$stmtSp) {
                throw new Exception($conn->error);
            }
            // Bind: customer_id (i), payment_method (s), lines_json (s), address_id (i), gst (d), delivery (d)
            $stmtSp->bind_param('issidd', $customerId, $methodRaw, $json, $addressId, $gstAmount, $deliveryFee);
            $stmtSp->execute();
            while ($conn->more_results()) {
                $conn->next_result();
                if ($flush = $conn->store_result()) {
                    $flush->free();
                }
            }
            $stmtSp->close();


        $outRes = $conn->query('SELECT @p_oid AS oid, @p_err AS errmsg');
        if (!$outRes) {
            throw new Exception('Could not read procedure output.');
        }
        $spRow = $outRes->fetch_assoc();
        $outRes->free();
        $spOrderId = (int) ($spRow['oid'] ?? 0);
        $spErr = isset($spRow['errmsg']) ? trim((string) $spRow['errmsg']) : '';
        if ($spOrderId > 0 && $spErr === '') {
            $_SESSION['cart'] = [];
            error_log('[order] placed via sp_place_order customer_id=' . $customerId . ' order_id=' . $spOrderId);
            header('Location: order_success.php?order_id=' . $spOrderId);
            exit;
        }
        $_SESSION['flash'] = $spErr !== '' ? $spErr : 'Could not place order via database procedure.';
        $_SESSION['flash_type'] = 'error';
        header('Location: checkout.php');
        exit;
    } catch (Throwable $e) {
        $_SESSION['flash'] = 'Order failed: ' . $e->getMessage();
        $_SESSION['flash_type'] = 'error';
        error_log('[order] sp_place_order error customer_id=' . $customerId . ' err=' . $e->getMessage());
        header('Location: checkout.php');
        exit;
    }
}

try {
    // IMPORTANT: transaction characteristics must be set BEFORE the transaction starts.
    // (Fixes: "Transaction characteristics can't be changed while a transaction is in progress")
    $conn->query("SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED");

    // Transaction boundaries (ACID)
    $conn->begin_transaction();

    // Detect correct order_details price column (price/unit_price/subtotal) without schema changes.
    [$priceCol, $priceMode] = bookstore_order_detail_price_target($conn);


    // Insert order as pending first (payment simulation happens inside this transaction).
    $orderCols = bookstore_table_columns($conn, 'orders');
    $hasOrderStatus = in_array('order_status', $orderCols, true);

    if ($hasOrderStatus) {
        $stmtOrder = $conn->prepare('INSERT INTO orders (customer_id, order_date, total_amount, gst_amount, delivery_fee, order_status, address_id) VALUES (?, NOW(), ?, ?, ?, ?, ?)');
        if (!$stmtOrder) throw new Exception($conn->error);
        $status = 'Placed';
        $addrParam = $addressId > 0 ? $addressId : null;
        $stmtOrder->bind_param('idddsi', $customerId, $grandTotal, $gstAmount, $deliveryFee, $status, $addrParam);
    } else {
        $stmtOrder = $conn->prepare('INSERT INTO orders (customer_id, order_date, total_amount, gst_amount, delivery_fee, address_id) VALUES (?, NOW(), ?, ?, ?, ?)');
        if (!$stmtOrder) throw new Exception($conn->error);
        $addrParam = $addressId > 0 ? $addressId : null;
        $stmtOrder->bind_param('idddi', $customerId, $grandTotal, $gstAmount, $deliveryFee, $addrParam);
    }

    if (!$stmtOrder->execute()) throw new Exception($stmtOrder->error);
    $orderId = (int) $conn->insert_id;
    $stmtOrder->close();

    // Savepoint for stock + order lines
    $conn->query('SAVEPOINT after_order');

    // Prepared statements reused per line
    $stmtLock = $conn->prepare('SELECT stock FROM book WHERE book_id = ? FOR UPDATE');
    $stmtUpd = $conn->prepare('UPDATE book SET stock = stock - ? WHERE book_id = ? AND stock >= ?');
    $stmtIns = $conn->prepare("INSERT INTO order_details (order_id, book_id, quantity, subtotal) VALUES (?, ?, ?, ?)");

    if (!$stmtLock || !$stmtUpd || !$stmtIns) {
        throw new Exception($conn->error);
    }

    foreach ($lines as $line) {
        $bookId = (int) $line['book_id'];
        $qty = (int) $line['qty'];
        $unit = (float) $line['unit_price'];

        // 1) Lock row and read current stock (prevents race conditions)
        $stmtLock->bind_param('i', $bookId);
        if (!$stmtLock->execute()) {
            throw new Exception($stmtLock->error);
        }
        $row = $stmtLock->get_result()->fetch_assoc();
        if (!$row) {
            throw new Exception('Book not found (id=' . $bookId . ').');
        }
        $stockNow = (int) $row['stock'];
        if ($stockNow < $qty) {
            throw new Exception('Insufficient stock for book id ' . $bookId . ' (have ' . $stockNow . ', need ' . $qty . ').');
        }

        // 2) Insert order line
        $bindPrice = $unit * $qty;
        $stmtIns->bind_param('iiid', $orderId, $bookId, $qty, $bindPrice);
        if (!$stmtIns->execute()) {
            throw new Exception($stmtIns->error);
        }

        // 3) Guarded stock decrement (prevents negative stock even if logic changes)
        $stmtUpd->bind_param('iii', $qty, $bookId, $qty);
        if (!$stmtUpd->execute()) {
            throw new Exception($stmtUpd->error);
        }
        if ($stmtUpd->affected_rows !== 1) {
            throw new Exception('Stock update failed for book id ' . $bookId . ' (concurrent update).');
        }
    }

    $stmtLock->close();
    $stmtUpd->close();
    $stmtIns->close();

    // Explicit Payment insert
    $stmtPay = $conn->prepare('INSERT INTO payment (order_id, payment_method, amount, payment_status, payment_date) VALUES (?, ?, ?, ?, NOW())');
    if (!$stmtPay) {
        throw new Exception($conn->error);
    }
    $payStatus = 'Completed';
    $stmtPay->bind_param('isds', $orderId, $methodRaw, $grandTotal, $payStatus);
    if (!$stmtPay->execute()) {
        throw new Exception($stmtPay->error);
    }
    $stmtPay->close();

    if ($hasOrderStatus) {
        $stPaid = $conn->prepare('UPDATE orders SET order_status = ? WHERE order_id = ?');
        $paid = 'Paid';
        $stPaid->bind_param('si', $paid, $orderId);
        $stPaid->execute();
        $stPaid->close();
    }

    $conn->commit();

    // Bonus: clear cart and redirect
    $_SESSION['cart'] = [];
    error_log('[order] placed via php_tx customer_id=' . $customerId . ' order_id=' . $orderId);
    header('Location: pages/order_success.php?order_id=' . $orderId);
    exit;
} catch (Throwable $e) {
    if ($conn->errno === 0) {
        // no-op: keep static analyzers happy
    }
    // Rollback only if a transaction is active.
    // (With mysqli_report strict mode, errors throw; this keeps rollback safe.)
    $conn->rollback();
    $_SESSION['flash'] = 'Order failed: ' . $e->getMessage();
    $_SESSION['flash_type'] = 'error';
    error_log('[order] failed customer_id=' . $customerId . ' err=' . $e->getMessage());
    header('Location: checkout.php');
    exit;
}
