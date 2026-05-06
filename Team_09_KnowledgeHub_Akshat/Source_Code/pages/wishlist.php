<?php
/**
 * Wishlist page — requires wishlist table + login.
 */
require_once __DIR__ . '/../includes/init.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/schema_bookstore.php';

if (!isset($_SESSION['customer_id']) || (int) $_SESSION['customer_id'] <= 0) {
    $_SESSION['redirect_after_login'] = 'pages/wishlist.php';
    header('Location: login.php');
    exit;
}

if (!bookstore_wishlist_table_exists($conn)) {
    $_SESSION['flash'] = 'Wishlist not available. Import sql/upgrade_dbms.sql.';
    $_SESSION['flash_type'] = 'error';
    header('Location: home.php');
    exit;
}

$customerId = (int) $_SESSION['customer_id'];

$stmt = $conn->prepare(
    'SELECT b.*
     FROM wishlist w
     JOIN book b ON w.book_id = b.book_id
     WHERE w.customer_id = ?'
);
$stmt->bind_param('i', $customerId);
$stmt->execute();
$res = $stmt->get_result();
$items = [];
while ($row = $res->fetch_assoc()) {
    $items[] = $row;
}
$stmt->close();

$pageTitle = 'Wishlist';
$activeNav = 'wishlist';
require_once __DIR__ . '/../components/navbar.php';

$flash = $_SESSION['flash'] ?? '';
$flashType = $_SESSION['flash_type'] ?? 'info';
unset($_SESSION['flash'], $_SESSION['flash_type']);
?>

<div class="container mb-4 fade-in">
    <?php if ($flash !== '') {
        $cls = $flashType === 'error' ? 'alert-error' : ($flashType === 'success' ? 'alert-success' : 'alert-info');
        echo '<div class="alert ' . htmlspecialchars($cls) . '" style="margin-top: 1rem;">' . htmlspecialchars($flash) . '</div>';
    } ?>

    <div class="page-head" style="margin-top: 1.5rem;">
        <h1 style="font-size: 2rem; margin-bottom: 0.5rem;">Your Wishlist</h1>
        <p class="muted">Books you saved for later.</p>
    </div>

    <?php if ($items === []) { ?>
        <div class="empty-state" style="background: var(--bg-primary); border: 1px solid var(--border); border-radius: 12px; padding: 60px 20px; text-align: center;">
            <svg style="width: 64px; height: 64px; margin: 0 auto 16px; color: var(--border);" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
            <h3 style="margin-bottom: 8px;">Your wishlist is empty</h3>
            <p style="margin-bottom: 24px; color: var(--text-secondary);">Browse the catalog and tap “Wishlist” on a book.</p>
            <a href="category.php" class="btn btn-primary">Browse Books</a>
        </div>
    <?php } else { ?>
        <div class="book-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px;">
            <?php foreach ($items as $row):
                $id = (int) $row['book_id'];
                $imgRaw = trim((string) ($row['image'] ?? ''));
                $imgSrc = $imgRaw === '' ? '../assets/placeholder.svg' : htmlspecialchars($imgRaw, ENT_QUOTES, 'UTF-8');
                if ($imgSrc !== '../assets/placeholder.svg' && !preg_match('~^(?:f|ht)tps?://~i', $imgSrc) && strpos($imgSrc, '/') !== 0 && strpos($imgSrc, '../') !== 0) {
                    $imgSrc = '../' . $imgSrc;
                }
                ?>
                <article class="book-card" style="background: var(--bg-primary); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; transition: transform 0.2s, box-shadow 0.2s;">
                    <a href="product.php?id=<?php echo $id; ?>" style="display: block; width: 100%; height: 320px; background: var(--bg-tertiary); overflow: hidden; position: relative;">
                        <img src="<?php echo $imgSrc; ?>" alt="" loading="lazy" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='../assets/placeholder.svg'">
                    </a>
                    <div style="padding: 16px; display: flex; flex-direction: column; flex: 1; gap: 8px;">
                        <div>
                            <span class="book-tagline" style="display: inline-block; background: var(--accent-light); padding: 4px 8px; border-radius: 4px; margin-bottom: 8px; font-size: 0.75rem; font-weight: 600; color: var(--accent);"><?php echo htmlspecialchars($row['category'] ?? 'Book'); ?></span>
                        </div>
                        <a href="product.php?id=<?php echo $id; ?>" style="text-decoration: none; color: var(--text-primary);">
                            <h2 style="font-size: 1.1rem; font-weight: 600; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;"><?php echo htmlspecialchars($row['title']); ?></h2>
                        </a>
                        <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 0;">by <?php echo htmlspecialchars($row['author']); ?></p>
                        
                        <div class="book-rating-row" style="margin-top: 4px; color: var(--warning); font-size: 0.9rem;">
                            ★★★★☆ <span class="muted" style="font-size: 0.8rem;">(4.2)</span>
                        </div>

                        <p style="font-weight: 700; color: var(--price); font-size: 1.25rem; margin: auto 0 0;">₹<?php echo number_format((float) $row['price'], 2); ?></p>
                        
                        <div style="display: flex; gap: 8px; margin-top: 16px;">
                            <form method="post" action="../wishlist_toggle.php" style="flex: 1;">
                                <input type="hidden" name="book_id" value="<?php echo $id; ?>">
                                <input type="hidden" name="redirect" value="pages/wishlist.php">
                                <button type="submit" class="btn btn-secondary btn-anim" style="width: 100%; padding: 8px; font-size: 0.9rem; color: var(--danger); border-color: #fecaca; background: #fff;">Remove</button>
                            </form>
                            <form method="post" action="../cart_add.php" style="flex: 1;">
                                <input type="hidden" name="book_id" value="<?php echo $id; ?>">
                                <button type="submit" class="btn btn-primary btn-anim" style="width: 100%; padding: 8px; font-size: 0.9rem; background: var(--accent); color: white;">To Cart</button>
                            </form>
                        </div>
                    </div>
                </article>
            <?php endforeach; ?>
        </div>
    <?php } ?>
</div>

<style>
.book-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0,0,0,0.08);
}
</style>

<script>
document.querySelectorAll('.btn-anim').forEach(btn => {
    btn.addEventListener('mousedown', () => btn.style.transform = 'scale(0.96)');
    btn.addEventListener('mouseup', () => btn.style.transform = 'scale(1)');
    btn.addEventListener('mouseleave', () => btn.style.transform = 'scale(1)');
});
</script>

<?php require_once __DIR__ . '/../components/footer.php'; ?>
