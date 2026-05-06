<?php
/**
 * Single book view — details, ratings, wishlist, Add to Cart (stock-capped).
 */
require_once dirname(__DIR__) . '/includes/init.php';
require_once dirname(__DIR__) . '/includes/db.php';
require_once dirname(__DIR__) . '/includes/schema_bookstore.php';
require_once dirname(__DIR__) . '/includes/bookstore_ui.php';

$bookId = isset($_GET['id']) ? (int) $_GET['id'] : 0;

// Review submit (POST)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['submit_review'], $_POST['book_id'])) {
    if (!isset($_SESSION['customer_id']) || (int) $_SESSION['customer_id'] <= 0) {
        $_SESSION['flash'] = 'Please log in to review.';
        $_SESSION['flash_type'] = 'error';
        $_SESSION['redirect_after_login'] = 'pages/product.php?id=' . (int) ($_POST['book_id'] ?? 0);
        header('Location: ../login.php');
        exit;
    }

    $cid = (int) $_SESSION['customer_id'];
    $bid = (int) $_POST['book_id'];
    $rating = (int) ($_POST['rating'] ?? 0);
    $comment = trim((string) ($_POST['comment'] ?? ''));

    if ($bid <= 0 || $rating < 1 || $rating > 5) {
        $_SESSION['flash'] = 'Please select a rating (1–5).';
        $_SESSION['flash_type'] = 'error';
        header('Location: product.php?id=' . $bid);
        exit;
    }

    $t = $conn->query("SHOW TABLES LIKE 'reviews'");
    if (!$t || $t->num_rows === 0) {
        $_SESSION['flash'] = 'Reviews feature is not installed (missing reviews table).';
        $_SESSION['flash_type'] = 'error';
        header('Location: product.php?id=' . $bid);
        exit;
    }

    $stmt = $conn->prepare('SELECT review_id FROM reviews WHERE book_id = ? AND customer_id = ? LIMIT 1');
    $stmt->bind_param('ii', $bid, $cid);
    $stmt->execute();
    $existing = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if ($existing) {
        $_SESSION['flash'] = 'You already reviewed this book.';
        $_SESSION['flash_type'] = 'error';
        header('Location: product.php?id=' . $bid);
        exit;
    }

    $stmt = $conn->prepare('INSERT INTO reviews (book_id, customer_id, rating, comment) VALUES (?, ?, ?, ?)');
    $stmt->bind_param('iiis', $bid, $cid, $rating, $comment);
    $stmt->execute();
    $stmt->close();

    $_SESSION['flash'] = 'Thanks! Your review was submitted.';
    $_SESSION['flash_type'] = 'success';
    header('Location: product.php?id=' . $bid);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_to_cart'], $_POST['book_id'])) {
    $postId = (int) $_POST['book_id'];
    if ($postId > 0) {
        $stmt = $conn->prepare('SELECT stock FROM book WHERE book_id = ?');
        $stmt->bind_param('i', $postId);
        $stmt->execute();
        $res = $stmt->get_result();
        if ($row = $res->fetch_assoc()) {
            $stock = (int) $row['stock'];
            $current = isset($_SESSION['cart'][$postId]) ? (int) $_SESSION['cart'][$postId] : 0;
            if ($stock <= 0) {
                $_SESSION['flash'] = 'This book is out of stock.';
                $_SESSION['flash_type'] = 'error';
            } elseif ($current >= $stock) {
                $_SESSION['flash'] = 'You already have all available copies in your cart (' . $stock . ').';
                $_SESSION['flash_type'] = 'error';
            } else {
                $_SESSION['cart'][$postId] = $current + 1;
                $_SESSION['flash'] = 'Book added to cart.';
                $_SESSION['flash_type'] = 'success';
                $_SESSION['added_book_id'] = $postId;
            }
        }
        $stmt->close();
    }
    header('Location: product.php?id=' . $postId);
    exit;
}

if ($bookId <= 0) {
    $_SESSION['flash'] = 'Invalid book.';
    $_SESSION['flash_type'] = 'error';
    header('Location: home.php');
    exit;
}

$stmt = $conn->prepare(
    'SELECT b.*, c.category_name
     FROM book b
     LEFT JOIN category c ON b.category_id = c.category_id
     WHERE b.book_id = ?'
);
$stmt->bind_param('i', $bookId);
$stmt->execute();
$res = $stmt->get_result();
$book = $res->fetch_assoc();
$stmt->close();

if (!$book) {
    $_SESSION['flash'] = 'Book not found.';
    $_SESSION['flash_type'] = 'error';
    header('Location: home.php');
    exit;
}

$isLoggedIn = isset($_SESSION['customer_id']) && (int) $_SESSION['customer_id'] > 0;
$onWish = false;
$wishTable = bookstore_wishlist_table_exists($conn);
if ($isLoggedIn && $wishTable) {
    $cid = (int) $_SESSION['customer_id'];
    $wst = $conn->prepare('SELECT 1 FROM wishlist WHERE customer_id = ? AND book_id = ? LIMIT 1');
    $wst->bind_param('ii', $cid, $bookId);
    $wst->execute();
    $onWish = (bool) $wst->get_result()->fetch_row();
    $wst->close();
}

$pageTitle = $book['title'];
$activeNav = 'category';
require_once dirname(__DIR__) . '/components/navbar.php';
require_once dirname(__DIR__) . '/components/book_card.php';

$flash = $_SESSION['flash'] ?? '';
$flashType = $_SESSION['flash_type'] ?? 'info';
unset($_SESSION['flash'], $_SESSION['flash_type']);

$id = (int) $book['book_id'];
$title = htmlspecialchars($book['title']);
$author = htmlspecialchars($book['author']);
$price = (float) $book['price'];
$desc = trim((string) ($book['description'] ?? ''));
$descHtml = $desc === '' ? '<p class="muted">No description available.</p>' : '<div class="book-detail-desc">' . nl2br(htmlspecialchars($desc)) . '</div>';
$stock = (int) $book['stock'];

$imgRaw = trim((string) ($book['image'] ?? ''));
$imgSrc = $imgRaw === '' ? '../assets/placeholder.svg' : htmlspecialchars($imgRaw, ENT_QUOTES, 'UTF-8');
if ($imgSrc !== '../assets/placeholder.svg' && !preg_match('~^(?:f|ht)tps?://~i', $imgSrc) && strpos($imgSrc, '/') !== 0 && strpos($imgSrc, '../') !== 0) {
    $imgSrc = '../' . $imgSrc;
}

$tagline = trim((string) ($book['category_name'] ?? ''));
if ($tagline === '') {
    $tagline = 'Staff pick';
}

$dbRat = isset($book['rating_demo']) && $book['rating_demo'] !== null ? (float) $book['rating_demo'] : null;
$ratingVal = bookstore_display_rating($id, $dbRat);

$inCart = isset($_SESSION['cart'][$id]) ? (int) $_SESSION['cart'][$id] : 0;
$addDisabled = $stock <= 0 || ($inCart >= $stock && $stock > 0);

$recBooks = [];
if (!empty($book['category_id'])) {
    $catId = (int) $book['category_id'];
    $rst = $conn->prepare(
        'SELECT b.book_id, b.title, b.author, b.price, b.image, b.stock, c.category_name
         FROM book b 
         LEFT JOIN category c ON b.category_id = c.category_id
         WHERE b.category_id = ? AND b.book_id <> ? AND b.stock > 0
         ORDER BY b.book_id DESC LIMIT 4'
    );
    $rst->bind_param('ii', $catId, $id);
    $rst->execute();
    $rr = $rst->get_result();
    while ($rb = $rr->fetch_assoc()) {
        $recBooks[] = $rb;
    }
    $rst->close();
}

$reviewsEnabled = false;
$avgRating = null;
$reviewCount = 0;
$reviews = [];
$t = $conn->query("SHOW TABLES LIKE 'reviews'");
if ($t && $t->num_rows > 0) {
    $reviewsEnabled = true;
    $stmt = $conn->prepare('SELECT AVG(rating) AS avg_rating, COUNT(*) AS cnt FROM reviews WHERE book_id = ?');
    $stmt->bind_param('i', $bookId);
    $stmt->execute();
    $r = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if ($r) {
        $reviewCount = (int) ($r['cnt'] ?? 0);
        $avgRating = $r['avg_rating'] !== null ? round((float) $r['avg_rating'], 1) : null;
    }

    $stmt = $conn->prepare('SELECT rating, comment, created_at, customer_id FROM reviews WHERE book_id = ? ORDER BY review_id DESC');
    $stmt->bind_param('i', $bookId);
    $stmt->execute();
    $rr = $stmt->get_result();
    while ($rw = $rr->fetch_assoc()) {
        $reviews[] = $rw;
    }
    $stmt->close();
}
?>

<div class="container mb-4">
    <?php if ($flash !== '') {
        $cls = $flashType === 'error' ? 'alert-error' : ($flashType === 'success' ? 'alert-success' : 'alert-info');
        echo '<div class="alert ' . htmlspecialchars($cls) . '">' . htmlspecialchars($flash) . '</div>';
    } ?>

    <div class="breadcrumb mt-4">
        <a href="category.php">&larr; Back to books</a> / <?php echo htmlspecialchars($tagline); ?>
    </div>

    <article class="book-detail">
        <div class="book-detail-cover">
            <img src="<?php echo $imgSrc; ?>" alt="<?php echo $title; ?>" loading="lazy">
        </div>
        
        <div class="book-detail-main">
            <h1 class="book-detail-title"><?php echo $title; ?></h1>
            <p class="book-detail-author">by <?php echo $author; ?></p>
            
            <div class="book-rating-row" style="margin-bottom: 16px; font-size: 1.1rem;">
                <?php echo bookstore_stars_html($ratingVal); ?>
                <?php if ($reviewsEnabled && $reviewCount > 0) { ?>
                    <span style="color: var(--text-secondary); font-size: 0.9rem; margin-left: 8px;">(<?php echo $reviewCount; ?> reviews)</span>
                <?php } ?>
            </div>
            
            <p class="book-detail-price">₹<?php echo number_format($price, 2); ?></p>
            
            <?php echo $descHtml; ?>
            
            <div style="margin-bottom: 24px;">
                <p style="color: var(--text-secondary); font-size: 0.95rem; margin-bottom: 4px;">
                    <strong>Availability:</strong> 
                    <span style="color: <?php echo $stock > 0 ? 'var(--success)' : 'var(--danger)'; ?>;">
                        <?php echo $stock > 0 ? 'In stock (' . $stock . ' available)' : 'Out of stock'; ?>
                    </span>
                </p>
                <?php if ($inCart > 0) { ?>
                    <p style="color: var(--accent); font-size: 0.95rem;">
                        <strong>In your cart:</strong> <?php echo $inCart; ?>
                    </p>
                <?php } ?>
                <?php if (!empty($book['published_date'])) { ?>
                    <p style="color: var(--text-secondary); font-size: 0.95rem;">
                        <strong>Published:</strong> <?php echo htmlspecialchars((string) $book['published_date']); ?>
                    </p>
                <?php } ?>
            </div>
            
            <div class="book-detail-actions-row">
                <?php if ($addDisabled) { ?>
                    <button type="button" class="btn btn-secondary book-detail-btn" disabled>
                        <?php echo $stock <= 0 ? 'Out of Stock' : 'Max Stock Reached'; ?>
                    </button>
                <?php } else { ?>
                    <form method="post" action="product.php" style="flex:1;">
                        <input type="hidden" name="book_id" value="<?php echo $id; ?>">
                        <button type="submit" name="add_to_cart" value="1" class="btn btn-primary book-detail-btn" style="width:100%;">Add to Cart</button>
                    </form>
                <?php } ?>
                
                <?php if ($isLoggedIn && $wishTable) { ?>
                    <form method="post" action="../wishlist_toggle.php">
                        <input type="hidden" name="book_id" value="<?php echo $id; ?>">
                        <input type="hidden" name="redirect" value="<?php echo htmlspecialchars('../pages/product.php?id=' . $id, ENT_QUOTES, 'UTF-8'); ?>">
                        <button type="submit" class="btn btn-secondary book-detail-btn" title="Wishlist">
                            <?php echo $onWish ? '♥ Saved' : '♡ Save'; ?>
                        </button>
                    </form>
                <?php } ?>
            </div>
        </div>
    </article>

    <?php if (count($recBooks) > 0) { ?>
        <section class="mt-4 mb-4">
            <h2 class="sidebar-title">Similar Books</h2>
            <div class="book-grid">
                <?php 
                // Need empty wishlist ids for rendering if we didn't fetch them for recommendations
                // Wait, we can reuse the global $wishlistIds if we fetch them. Let's just pass empty array or fetch them.
                $recWishlistIds = [];
                if ($isLoggedIn && $wishTable) {
                    $wid = (int) $_SESSION['customer_id'];
                    $wst = $conn->prepare('SELECT book_id FROM wishlist WHERE customer_id = ?');
                    $wst->bind_param('i', $wid);
                    $wst->execute();
                    $wr = $wst->get_result();
                    while ($w = $wr->fetch_assoc()) {
                        $recWishlistIds[(int) $w['book_id']] = true;
                    }
                    $wst->close();
                }

                foreach ($recBooks as $rb) {
                    render_book_card($rb, '', $recWishlistIds, $isLoggedIn, $wishTable, true);
                }
                ?>
            </div>
        </section>
    <?php } ?>

    <?php if ($reviewsEnabled) { ?>
        <section class="checkout-card mt-4" style="max-width: 800px; margin-left: 0;">
            <h2 style="margin-bottom: 16px;">Customer Reviews</h2>

            <?php if (isset($_SESSION['customer_id']) && (int) $_SESSION['customer_id'] > 0) { ?>
                <div style="background: var(--bg-tertiary); padding: 16px; border-radius: var(--radius-sm); margin-bottom: 24px;">
                    <form method="post" action="product.php?id=<?php echo (int) $bookId; ?>">
                        <input type="hidden" name="book_id" value="<?php echo (int) $bookId; ?>">
                        <h4 style="margin-bottom: 12px;">Write a Review</h4>
                        <div class="form-group">
                            <label>Rating</label>
                            <select name="rating" class="filter-select" required style="width:200px;">
                                <option value="">Select a rating...</option>
                                <option value="5">5 - Excellent</option>
                                <option value="4">4 - Good</option>
                                <option value="3">3 - Average</option>
                                <option value="2">2 - Poor</option>
                                <option value="1">1 - Bad</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Comment</label>
                            <textarea name="comment" class="text-input" rows="3" placeholder="Tell others what you thought about this book..."></textarea>
                        </div>
                        <button type="submit" name="submit_review" value="1" class="btn btn-primary">Submit Review</button>
                    </form>
                </div>
            <?php } else { ?>
                <div style="background: var(--bg-tertiary); padding: 16px; border-radius: var(--radius-sm); margin-bottom: 24px;">
                    <p style="margin: 0;">Please <a href="../login.php" style="font-weight: 600;">log in</a> to write a review.</p>
                </div>
            <?php } ?>

            <?php if (count($reviews) === 0) { ?>
                <p class="muted">No reviews yet. Be the first to review this book!</p>
            <?php } else { ?>
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    <?php foreach ($reviews as $rv):
                        $r = (int) ($rv['rating'] ?? 0);
                        $c = trim((string) ($rv['comment'] ?? ''));
                        $dt = (string) ($rv['created_at'] ?? '');
                        ?>
                        <div style="border-bottom: 1px solid var(--border); padding-bottom: 16px;">
                            <div class="book-rating-row" style="margin-bottom: 8px;"><?php echo bookstore_stars_html((float) $r); ?></div>
                            <?php if ($c !== '') { ?>
                                <p style="margin-bottom: 8px; font-size: 0.95rem; line-height: 1.5;"><?php echo nl2br(htmlspecialchars($c)); ?></p>
                            <?php } ?>
                            <span class="muted" style="font-size: 0.8rem;">Posted on <?php echo htmlspecialchars(date('F j, Y', strtotime($dt))); ?></span>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php } ?>
        </section>
    <?php } ?>
</div>

<?php require_once dirname(__DIR__) . '/components/footer.php'; ?>
