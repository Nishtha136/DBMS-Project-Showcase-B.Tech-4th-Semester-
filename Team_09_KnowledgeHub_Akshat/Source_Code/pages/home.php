<?php
/**
 * Home Page — Hero section, recommendations, new arrivals.
 */
require_once dirname(__DIR__) . '/includes/init.php';
require_once dirname(__DIR__) . '/includes/db.php';
require_once dirname(__DIR__) . '/includes/schema_bookstore.php';
require_once dirname(__DIR__) . '/includes/cart_service.php';
require_once dirname(__DIR__) . '/includes/bookstore_ui.php';

$pageTitle = 'Home';
$activeNav = 'home';
require_once dirname(__DIR__) . '/components/navbar.php';
require_once dirname(__DIR__) . '/components/book_card.php';

// Fetch recommended/new books
$recBooks = [];
$rst = $conn->prepare(
    'SELECT b.book_id, b.title, b.author, b.price, b.stock, b.image, c.category_name
     FROM book b LEFT JOIN category c ON b.category_id = c.category_id
     WHERE b.stock > 0 ORDER BY b.book_id DESC LIMIT 8'
);
if ($rst) {
    $rst->execute();
    $rr = $rst->get_result();
    while ($rb = $rr->fetch_assoc()) {
        $recBooks[] = $rb;
    }
    $rst->close();
}

$isLoggedIn = isset($_SESSION['customer_id']) && (int) $_SESSION['customer_id'] > 0;
$wishlistIds = [];
$wishTable = bookstore_wishlist_table_exists($conn);
if ($isLoggedIn && $wishTable) {
    $wid = (int) $_SESSION['customer_id'];
    $wst = $conn->prepare('SELECT book_id FROM wishlist WHERE customer_id = ?');
    $wst->bind_param('i', $wid);
    $wst->execute();
    $wr = $wst->get_result();
    while ($w = $wr->fetch_assoc()) {
        $wishlistIds[(int) $w['book_id']] = true;
    }
    $wst->close();
}

// Flash messages
$flash = $_SESSION['flash'] ?? '';
$flashType = $_SESSION['flash_type'] ?? 'info';
unset($_SESSION['flash'], $_SESSION['flash_type']);
?>

<div class="container">
    <?php if ($flash !== '') {
        $cls = $flashType === 'error' ? 'alert-error' : ($flashType === 'success' ? 'alert-success' : 'alert-info');
        echo '<div class="alert ' . htmlspecialchars($cls) . '">' . htmlspecialchars($flash) . '</div>';
    } ?>

    <section class="hero-section">
        <h1>Discover Your Next Great Read</h1>
        <p>Explore thousands of books across all genres. Find bestsellers, new releases, and hidden gems with our curated collections.</p>
        <a href="category.php" class="btn btn-primary" style="padding: 12px 24px; font-size: 1.1rem;">Shop All Books</a>
    </section>

    <section class="mb-4">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <h2>New Arrivals</h2>
            <a href="category.php" style="font-weight: 600;">View All &rarr;</a>
        </div>
        
        <div class="book-grid">
            <?php
            if (count($recBooks) > 0) {
                foreach ($recBooks as $row) {
                    render_book_card(
                        $row,
                        '',
                        $wishlistIds,
                        $isLoggedIn,
                        $wishTable,
                        true // hasRatingCol
                    );
                }
            } else {
                echo '<p class="muted">No books available at the moment.</p>';
            }
            ?>
        </div>
    </section>
</div>

<?php require_once dirname(__DIR__) . '/components/footer.php'; ?>
