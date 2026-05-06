<?php
// Prevent stale HTML (e.g., stock) from being shown via browser cache/back button.
// Safe for dynamic pages; static assets (CSS/JS/images) are unaffected.
if (!headers_sent()) {
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Cache-Control: post-check=0, pre-check=0', false);
    header('Pragma: no-cache');
    header('Expires: 0');
}
if (!isset($pageTitle)) {
    $pageTitle = 'Bookstore';
}
if (!isset($navSearchQuery)) {
    $navSearchQuery = isset($_GET['q']) ? (string) $_GET['q'] : '';
}
$cartCount = 0;
if (isset($_SESSION['cart']) && is_array($_SESSION['cart'])) {
    foreach ($_SESSION['cart'] as $q) {
        $cartCount += (int) $q;
    }
}
$isLoggedIn = isset($_SESSION['customer_id']) && (int) $_SESSION['customer_id'] > 0;
$role = isset($_SESSION['role']) ? (string) $_SESSION['role'] : 'user';
$isAdmin = $isLoggedIn && $role === 'admin';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($pageTitle); ?> — Knowledge Hub Books</title>
    <link rel="stylesheet" href="../css/style.css">
    <link rel="stylesheet" href="../assets/css/payment.css">
</head>
<body>
    <header class="site-header">
        <div class="container header-inner">
            <a href="index.php" class="logo">Knowledge Hub</a>
            <form class="header-search" method="get" action="index.php" role="search">
                <input type="search" name="q" class="header-search-input" placeholder="Search title or author…"
                       value="<?php echo htmlspecialchars($navSearchQuery, ENT_QUOTES, 'UTF-8'); ?>"
                       aria-label="Search books">
                <button type="submit" class="header-search-btn">Search</button>
            </form>
            <nav class="nav">
                <a href="index.php" class="nav-link<?php echo ($activeNav ?? '') === 'home' ? ' active' : ''; ?>">Home</a>
                <a href="cart.php" class="nav-link<?php echo ($activeNav ?? '') === 'cart' ? ' active' : ''; ?>">Cart
                    <?php if ($cartCount > 0) { ?>
                        <span class="badge js-cart-nav-count"><?php echo (int) $cartCount; ?></span>
                    <?php } ?>
                </a>
                <?php if ($isLoggedIn) { ?>
                    <a href="orders.php" class="nav-link<?php echo ($activeNav ?? '') === 'orders' ? ' active' : ''; ?>">Orders</a>
                    <a href="wishlist.php" class="nav-link<?php echo ($activeNav ?? '') === 'wishlist' ? ' active' : ''; ?>">Wishlist</a>
                    <?php if ($isAdmin) { ?>
                        <a href="admin_orders.php" class="nav-link<?php echo ($activeNav ?? '') === 'admin' ? ' active' : ''; ?>">Admin</a>
                        <a href="admin_reports.php" class="nav-link">Reports</a>
                    <?php } ?>
                <?php } ?>
                <?php if (!$isLoggedIn) { ?>
                    <a href="login.php" class="nav-link<?php echo ($activeNav ?? '') === 'login' ? ' active' : ''; ?>">Login / Register</a>
                <?php } else { ?>
                    <a href="logout.php" class="nav-link<?php echo ($activeNav ?? '') === 'logout' ? ' active' : ''; ?>">Logout</a>
                <?php } ?>
            </nav>
        </div>
    </header>
    <main class="main-content">
