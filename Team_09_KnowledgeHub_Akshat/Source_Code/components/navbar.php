<?php
// Prevent stale HTML from being shown via browser cache/back button.
if (!headers_sent()) {
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('Expires: 0');
}
if (!isset($pageTitle)) { $pageTitle = 'Bookstore'; }
if (!isset($navSearchQuery)) { $navSearchQuery = isset($_GET['q']) ? (string) $_GET['q'] : ''; }

$cartCount = 0;
if (isset($_SESSION['cart']) && is_array($_SESSION['cart'])) {
    foreach ($_SESSION['cart'] as $q) { $cartCount += (int) $q; }
}
$isLoggedIn = isset($_SESSION['customer_id']) && (int) $_SESSION['customer_id'] > 0;
$role       = isset($_SESSION['role']) ? (string) $_SESSION['role'] : 'user';
$isAdmin    = $isLoggedIn && $role === 'admin';
$userName   = isset($_SESSION['name']) && $_SESSION['name'] !== '' ? $_SESSION['name'] : '';
$firstName  = $userName ? explode(' ', $userName)[0] : '';
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
            <a href="<?php echo $isAdmin ? '../pages/admin_orders.php' : '../pages/home.php'; ?>" class="logo">
                Knowledge <span>Hub</span>
            </a>

            <?php if (!$isAdmin): ?>
            <!-- Search (users only) -->
            <form class="header-search" method="get" action="../pages/category.php" role="search">
                <input type="search" name="q" class="header-search-input"
                       placeholder="Search books, authors..."
                       value="<?php echo htmlspecialchars($navSearchQuery, ENT_QUOTES, 'UTF-8'); ?>"
                       aria-label="Search books">
                <button type="submit" class="header-search-btn">Search</button>
            </form>
            <?php endif; ?>

            <!-- Hamburger (mobile) -->
            <button class="nav-hamburger" id="nav-hamburger" aria-label="Toggle menu" aria-expanded="false">
                <span></span><span></span><span></span>
            </button>

            <!-- Navigation -->
            <nav class="nav" id="main-nav">
                <button class="nav-close" id="nav-close" aria-label="Close menu">✕</button>

                <?php if ($isAdmin): ?>
                    <!-- ─── ADMIN NAV ─── -->
                    <a href="../pages/admin_orders.php" class="nav-link <?php echo ($activeNav ?? '') === 'admin' ? 'active' : ''; ?>">
                        Orders
                    </a>
                    <a href="../pages/admin_inventory.php" class="nav-link <?php echo ($activeNav ?? '') === 'inventory' ? 'active' : ''; ?>">
                        Inventory
                    </a>
                    <div class="nav-divider"></div>
                    <a href="../logout.php" class="nav-link nav-link-danger">Logout</a>

                <?php else: ?>
                    <!-- ─── USER NAV ─── -->
                    <a href="../pages/home.php" class="nav-link <?php echo ($activeNav ?? '') === 'home' ? 'active' : ''; ?>">Home</a>
                    <a href="../pages/category.php" class="nav-link <?php echo ($activeNav ?? '') === 'category' ? 'active' : ''; ?>">Books</a>

                    <?php if ($isLoggedIn): ?>
                    <a href="../pages/cart.php" class="nav-link nav-cart <?php echo ($activeNav ?? '') === 'cart' ? 'active' : ''; ?>">
                        Cart
                        <?php if ($cartCount > 0): ?>
                        <span class="badge js-cart-nav-count"><?php echo (int) $cartCount; ?></span>
                        <?php endif; ?>
                    </a>
                    <?php endif; ?>

                    <?php if (!$isLoggedIn): ?>
                        <a href="../pages/login.php" class="nav-link <?php echo ($activeNav ?? '') === 'login' ? 'active' : ''; ?>">Login</a>
                        <a href="../pages/register.php" class="btn btn-primary" style="padding:8px 18px;font-size:.88rem;">Sign Up</a>
                    <?php else: ?>
                        <!-- User Dropdown -->
                        <div class="nav-dropdown" id="user-dropdown">
                            <button class="nav-dropdown-trigger" aria-haspopup="true" aria-expanded="false" id="dropdown-btn">
                                <span class="nav-avatar"><?php echo htmlspecialchars(strtoupper(substr($firstName ?: 'U', 0, 1))); ?></span>
                                <span class="nav-username"><?php echo htmlspecialchars($firstName ?: 'Account'); ?></span>
                                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" class="dropdown-chevron"><path d="M19 9l-7 7-7-7"/></svg>
                            </button>
                            <div class="nav-dropdown-menu" id="dropdown-menu" role="menu">
                                <div class="dropdown-header">
                                    <div class="dropdown-avatar"><?php echo htmlspecialchars(strtoupper(substr($firstName ?: 'U', 0, 1))); ?></div>
                                    <div>
                                        <div class="dropdown-name"><?php echo htmlspecialchars($userName ?: 'My Account'); ?></div>
                                        <div class="dropdown-role">Customer</div>
                                    </div>
                                </div>
                                <div class="dropdown-divider"></div>
                                <a href="../pages/profile.php" class="dropdown-item <?php echo ($activeNav ?? '') === 'profile' ? 'active' : ''; ?>" role="menuitem">
                                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                    My Profile
                                </a>
                                <a href="../pages/orders.php" class="dropdown-item <?php echo ($activeNav ?? '') === 'orders' ? 'active' : ''; ?>" role="menuitem">
                                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                                    My Orders
                                </a>
                                <a href="../pages/profile.php#addresses" class="dropdown-item" role="menuitem">
                                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                    My Addresses
                                </a>
                                <a href="../pages/wishlist.php" class="dropdown-item <?php echo ($activeNav ?? '') === 'wishlist' ? 'active' : ''; ?>" role="menuitem">
                                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                                    Wishlist
                                </a>
                                <div class="dropdown-divider"></div>
                                <a href="../logout.php" class="dropdown-item dropdown-item-danger" role="menuitem">
                                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                                    Sign Out
                                </a>
                            </div>
                        </div>
                    <?php endif; ?>
                <?php endif; ?>
            </nav>
        </div>
    </header>
    <main class="main-content">

<script>
(function(){
    // Dropdown
    var btn = document.getElementById('dropdown-btn');
    var menu = document.getElementById('dropdown-menu');
    if (btn && menu) {
        btn.addEventListener('click', function(e){
            e.stopPropagation();
            var open = menu.classList.toggle('open');
            btn.setAttribute('aria-expanded', open);
            var chevron = btn.querySelector('.dropdown-chevron');
            if(chevron) chevron.style.transform = open ? 'rotate(180deg)' : '';
        });
        document.addEventListener('click', function(){ menu.classList.remove('open'); btn.setAttribute('aria-expanded','false'); });
        menu.addEventListener('click', function(e){ e.stopPropagation(); });
    }
    // Hamburger
    var ham = document.getElementById('nav-hamburger');
    var nav = document.getElementById('main-nav');
    var close = document.getElementById('nav-close');
    if (ham && nav) {
        ham.addEventListener('click', function(){
            nav.classList.toggle('open');
            ham.setAttribute('aria-expanded', nav.classList.contains('open'));
        });
    }
    if (close && nav) {
        close.addEventListener('click', function(){ nav.classList.remove('open'); });
    }
})();
</script>
