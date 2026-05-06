<?php
function render_book_card(
    array $row,
    string $catalogQs,
    array $wishlistIds,
    bool $isLoggedIn,
    bool $wishTable,
    bool $hasRatingCol
): void {
    $id = (int) $row['book_id'];
    $title = htmlspecialchars($row['title']);
    $author = htmlspecialchars($row['author']);
    $price = (float) $row['price'];
    $stock = (int) $row['stock'];
    $tag = trim((string) ($row['category_name'] ?? ''));
    if ($tag === '') {
        $labels = ['Must read', 'Bestseller', 'Staff pick', 'New arrival'];
        $tag = $labels[$id % count($labels)];
    }
    $tagEsc = htmlspecialchars($tag);
    $imgRaw = trim((string) ($row['image'] ?? ''));
    $imgSrc = $imgRaw === '' ? '../assets/placeholder.svg' : htmlspecialchars($imgRaw, ENT_QUOTES, 'UTF-8');
    
    // Check if the image path is relative and doesn't start with http or / or ../
    if ($imgSrc !== '../assets/placeholder.svg' && !preg_match('~^(?:f|ht)tps?://~i', $imgSrc) && strpos($imgSrc, '/') !== 0 && strpos($imgSrc, '../') !== 0) {
        // Adjust for root-relative assets since we are inside /pages
        $imgSrc = '../' . $imgSrc;
    }

    $detailUrl = '../pages/product.php?id=' . $id;
    $inCart = isset($_SESSION['cart'][$id]) ? (int) $_SESSION['cart'][$id] : 0;
    $effCap = $stock > 0 ? $stock : 0;
    $addDisabled = $stock <= 0 || ($inCart >= $effCap && $effCap > 0);
    $formAction = '../pages/category.php' . ($catalogQs !== '' ? '?' . $catalogQs : '');
    $dbRat = ($hasRatingCol && isset($row['rating_demo'])) ? (float) $row['rating_demo'] : null;
    $ratingVal = bookstore_display_rating($id, $dbRat);
    $onWish = !empty($wishlistIds[$id]);
    ?>
    <article class="book-card">
        <a href="<?php echo htmlspecialchars($detailUrl); ?>" class="book-card-media">
            <img src="<?php echo $imgSrc; ?>" alt="<?php echo $title; ?>" loading="lazy" onerror="this.src='../assets/placeholder.svg'">
        </a>
        <div class="book-card-body">
            <span class="book-tagline"><?php echo $tagEsc; ?></span>
            <a href="<?php echo htmlspecialchars($detailUrl); ?>">
                <h2 class="book-title"><?php echo $title; ?></h2>
            </a>
            <p class="book-author">by <?php echo $author; ?></p>
            <div class="book-rating-row"><?php echo bookstore_stars_html($ratingVal); ?></div>
            
            <p class="book-price">₹<?php echo number_format($price, 2); ?></p>
            
            <div class="book-card-actions">
                <?php if ($addDisabled) { ?>
                    <button type="button" class="btn btn-secondary" disabled><?php echo $stock <= 0 ? 'Out of stock' : 'Max stock'; ?></button>
                <?php } else { ?>
                    <form method="post" action="<?php echo htmlspecialchars($formAction, ENT_QUOTES, 'UTF-8'); ?>" style="flex:1; display:flex;">
                        <input type="hidden" name="book_id" value="<?php echo $id; ?>">
                        <input type="hidden" name="add_book" value="1">
                        <button type="submit" class="btn btn-primary" style="flex:1;">Add to Cart</button>
                    </form>
                <?php } ?>
                
                <?php if ($isLoggedIn && $wishTable) { ?>
                    <form method="post" action="../wishlist_toggle.php" style="flex: 0 0 auto;">
                        <input type="hidden" name="book_id" value="<?php echo $id; ?>">
                        <input type="hidden" name="redirect" value="<?php echo htmlspecialchars('../pages/category.php?' . $catalogQs, ENT_QUOTES, 'UTF-8'); ?>">
                        <button type="submit" class="btn btn-secondary" title="Toggle Wishlist" style="padding: 10px;">
                            <?php echo $onWish ? '♥' : '♡'; ?>
                        </button>
                    </form>
                <?php } ?>
            </div>
        </div>
    </article>
    <?php
}
?>
