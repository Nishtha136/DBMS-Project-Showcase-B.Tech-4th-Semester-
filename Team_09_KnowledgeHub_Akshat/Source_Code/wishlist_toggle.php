<?php
/**
 * POST: book_id, optional redirect — add/remove wishlist row for logged-in customer.
 */
require_once __DIR__ . '/includes/init.php';
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/schema_bookstore.php';

$redir = (string) ($_POST['redirect'] ?? 'index.php');
if (!preg_match('/^[a-z0-9_.?=&%-]+$/i', $redir)) {
    $redir = 'index.php';
}

if (!isset($_SESSION['customer_id']) || (int) $_SESSION['customer_id'] <= 0) {
    $_SESSION['flash'] = 'Log in to use the wishlist.';
    $_SESSION['flash_type'] = 'error';
    header('Location: login.php');
    exit;
}

if (!bookstore_wishlist_table_exists($conn)) {
    $_SESSION['flash'] = 'Wishlist table not installed. Run sql/upgrade_dbms.sql.';
    $_SESSION['flash_type'] = 'error';
    header('Location: ' . $redir);
    exit;
}

$bookId = (int) ($_POST['book_id'] ?? 0);
$customerId = (int) $_SESSION['customer_id'];

if ($bookId <= 0) {
    header('Location: ' . $redir);
    exit;
}

$chk = $conn->prepare('SELECT wishlist_id FROM wishlist WHERE customer_id = ? AND book_id = ? LIMIT 1');
$chk->bind_param('ii', $customerId, $bookId);
$chk->execute();
$exists = $chk->get_result()->fetch_assoc();
$chk->close();

if ($exists) {
    $del = $conn->prepare('DELETE FROM wishlist WHERE customer_id = ? AND book_id = ?');
    $del->bind_param('ii', $customerId, $bookId);
    $del->execute();
    $del->close();
    $_SESSION['flash'] = 'Removed from wishlist.';
    $_SESSION['flash_type'] = 'info';
} else {
    $ins = $conn->prepare('INSERT INTO wishlist (customer_id, book_id) VALUES (?, ?)');
    $ins->bind_param('ii', $customerId, $bookId);
    if ($ins->execute()) {
        $_SESSION['flash'] = 'Saved to wishlist.';
        $_SESSION['flash_type'] = 'success';
    } else {
        $_SESSION['flash'] = 'Could not add to wishlist.';
        $_SESSION['flash_type'] = 'error';
    }
    $ins->close();
}

header('Location: ' . $redir);
exit;
