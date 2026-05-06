<?php
/**
 * Shopping cart — Amazon-style rows: image, title, price, [−] qty [+], subtotal, remove.
 */
require_once dirname(__DIR__) . '/includes/init.php';
require_once dirname(__DIR__) . '/includes/db.php';
require_once dirname(__DIR__) . '/includes/cart_service.php';

// Classic POST: remove
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['remove_book'])) {
    $bid = (int) $_POST['remove_book'];
    if ($bid > 0 && isset($_SESSION['cart'][$bid])) {
        unset($_SESSION['cart'][$bid]);
        $_SESSION['flash'] = 'Item removed from cart.';
        $_SESSION['flash_type'] = 'info';
    }
    header('Location: cart.php');
    exit;
}

// Classic POST: update quantities
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_cart'], $_POST['quantities']) && is_array($_POST['quantities'])) {
    foreach ($_POST['quantities'] as $bidStr => $qtyVal) {
        $bid = (int) $bidStr;
        $qty = (int) $qtyVal;
        if ($bid <= 0 || !isset($_SESSION['cart'][$bid])) {
            continue;
        }
        $stmt = $conn->prepare('SELECT stock FROM book WHERE book_id = ?');
        $stmt->bind_param('i', $bid);
        $stmt->execute();
        $r = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        $stock = $r ? (int) $r['stock'] : 0;
        $qty = cart_cap_qty($qty, $stock);
        if ($qty === 0 || $stock <= 0) {
            unset($_SESSION['cart'][$bid]);
        } else {
            $_SESSION['cart'][$bid] = $qty;
        }
    }
    $_SESSION['flash'] = 'Cart updated.';
    $_SESSION['flash_type'] = 'success';
    header('Location: cart.php');
    exit;
}

$loadCartJs = true;
$pageTitle = 'Your Cart';
$activeNav = 'cart';
require_once dirname(__DIR__) . '/components/navbar.php';

$flash = $_SESSION['flash'] ?? '';
$flashType = $_SESSION['flash_type'] ?? 'info';
unset($_SESSION['flash'], $_SESSION['flash_type']);
?>

<div class="container mb-4">
    <?php if ($flash !== '') {
        $cls = $flashType === 'error' ? 'alert-error' : ($flashType === 'success' ? 'alert-success' : 'alert-info');
        echo '<div class="alert ' . htmlspecialchars($cls) . '" style="margin-top: 1rem;">' . htmlspecialchars($flash) . '</div>';
    } ?>

    <div class="page-head" style="margin-top: 1.5rem;">
        <h1 style="font-size: 2rem; margin-bottom: 0.5rem;">Shopping Cart</h1>
        <p class="muted">Review your items and proceed to checkout.</p>
    </div>

    <?php
    if (empty($_SESSION['cart'])) {
        ?>
        <div class="empty-state" style="background: var(--bg-primary); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 60px 20px;">
            <svg style="width: 64px; height: 64px; margin: 0 auto 16px; color: var(--border);" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            <h3 style="margin-bottom: 8px;">Your cart is empty</h3>
            <p style="margin-bottom: 24px; color: var(--text-secondary);">Looks like you haven't added any books yet.</p>
            <a href="category.php" class="btn btn-primary">Start Shopping</a>
        </div>
        <?php
        require_once dirname(__DIR__) . '/components/footer.php';
        exit;
    }

    $ids = array_keys($_SESSION['cart']);
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $types = str_repeat('i', count($ids));

    $stmt = $conn->prepare("SELECT book_id, title, price, stock, image FROM book WHERE book_id IN ($placeholders)");
    $stmt->bind_param($types, ...$ids);
    $stmt->execute();
    $res = $stmt->get_result();

    $books = [];
    while ($row = $res->fetch_assoc()) {
        $books[(int) $row['book_id']] = $row;
    }
    $stmt->close();

    $grand = 0.0;
    $cartRows = 0;
    ?>

    <div class="cart-layout">
        <div class="cart-items-panel">
            <h2 style="font-size: 1.25rem; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border);">Items in your cart</h2>
            
            <div class="cart-items" id="cart-items">
                <?php foreach ($_SESSION['cart'] as $bid => $qty):
                    $bid = (int) $bid;
                    $qty = (int) $qty;
                    if (!isset($books[$bid])) {
                        continue;
                    }
                    $b = $books[$bid];
                    $title = htmlspecialchars($b['title']);
                    $price = (float) $b['price'];
                    $stock = (int) $b['stock'];
                    $cap = max(0, $stock);
                    $useQty = min($qty, $cap);
                    if ($useQty <= 0) {
                        continue;
                    }
                    $sub = $price * $useQty;
                    $grand += $sub;
                    $cartRows++;
                    $imgRaw = trim((string) ($b['image'] ?? ''));
                    $imgSrc = $imgRaw === '' ? '../assets/placeholder.svg' : htmlspecialchars($imgRaw, ENT_QUOTES, 'UTF-8');
                    if ($imgSrc !== '../assets/placeholder.svg' && !preg_match('~^(?:f|ht)tps?://~i', $imgSrc) && strpos($imgSrc, '/') !== 0 && strpos($imgSrc, '../') !== 0) {
                        $imgSrc = '../' . $imgSrc;
                    }
                    ?>
                    <div class="cart-item" data-book-id="<?php echo $bid; ?>">
                        <a href="product.php?id=<?php echo $bid; ?>" class="cart-item-thumb">
                            <img src="<?php echo $imgSrc; ?>" alt="" loading="lazy">
                        </a>
                        <div class="cart-item-info">
                            <a href="product.php?id=<?php echo $bid; ?>" class="cart-item-title"><?php echo $title; ?></a>
                            <p class="cart-item-meta">₹<?php echo number_format($price, 2); ?> each &bull; <?php echo $stock > 0 ? 'In Stock' : 'Out of Stock'; ?></p>
                        </div>
                        <div class="cart-item-qty">
                            <button type="button" class="qty-btn js-qty-minus" aria-label="Decrease quantity">−</button>
                            <span class="qty-val js-line-qty" id="qty-<?php echo $bid; ?>"><?php echo $useQty; ?></span>
                            <button type="button" class="qty-btn js-qty-plus" aria-label="Increase quantity">+</button>
                        </div>
                        <div class="cart-item-subtotal js-line-subtotal" id="sub-<?php echo $bid; ?>" style="color: var(--text-primary);">₹<?php echo number_format($sub, 2); ?></div>
                        <form method="post" action="cart.php" class="cart-item-remove js-cart-remove-form" data-book-id="<?php echo $bid; ?>">
                            <button type="submit" class="btn btn-danger" style="padding: 6px 12px; font-size: 0.85rem;">Remove</button>
                        </form>
                    </div>
                <?php endforeach; ?>
            </div>

            <?php if ($cartRows === 0) { ?>
                <div class="empty-state">
                    <p>No items available (check stock).</p>
                    <p><a href="category.php" style="font-weight: 600;">&larr; Back to books</a></p>
                </div>
            <?php } else { ?>
                <noscript>
                    <form method="post" action="cart.php" style="margin-top: 16px; padding: 16px; background: var(--bg-tertiary); border-radius: var(--radius-sm);">
                        <p class="muted" style="margin-bottom: 12px; font-size: 0.9rem;">JavaScript is disabled. Adjust quantities below and click Update.</p>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <?php foreach ($_SESSION['cart'] as $bid => $qty):
                            $bid = (int) $bid;
                            if (!isset($books[$bid])) continue;
                            $cap = max(0, (int) $books[$bid]['stock']);
                            $useQty = min((int) $qty, $cap);
                            if ($useQty <= 0) continue;
                            ?>
                            <div style="display: flex; align-items: center; gap: 4px;">
                                <label style="font-size: 0.8rem;">ID:<?php echo $bid; ?></label>
                                <input type="number" name="quantities[<?php echo $bid; ?>]" min="0" max="<?php echo $cap; ?>" value="<?php echo $useQty; ?>" class="text-input" style="width: 70px; padding: 4px;">
                            </div>
                        <?php endforeach; ?>
                        </div>
                        <button type="submit" name="update_cart" value="1" class="btn btn-secondary mt-4">Update Cart</button>
                    </form>
                </noscript>
                <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border);">
                    <a href="category.php" class="btn btn-secondary">&larr; Continue Shopping</a>
                </div>
            <?php } ?>
        </div>

        <?php if ($cartRows > 0) { 
            $gst = round($grand * 0.18, 2);
            $delivery = $grand >= 1000 ? 0.00 : 50.00;
            $finalTotal = round($grand + $gst + $delivery, 2);
        ?>
        <aside class="cart-summary">
            <h2 style="font-size: 1.25rem; margin-bottom: 24px;">Order Summary</h2>
            
            <div class="summary-row">
                <span>Subtotal (<?php echo $cartRows; ?> items)</span>
                <span class="js-cart-subtotal">₹<?php echo number_format($grand, 2); ?></span>
            </div>
            
            <div class="summary-row">
                <span>GST (18%)</span>
                <span class="js-cart-gst">₹<?php echo number_format($gst, 2); ?></span>
            </div>

            <div class="summary-row">
                <span>Delivery</span>
                <span class="js-cart-delivery"><?php echo $delivery > 0 ? '₹' . number_format($delivery, 2) : '<span style="color:var(--success);font-weight:600;">Free</span>'; ?></span>
            </div>
            
            <div class="summary-row total" style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed var(--border);">
                <span>Final Total</span>
                <span class="js-cart-grand-total" style="color: var(--accent); font-weight: 700; font-size: 1.2rem;">₹<?php echo number_format($finalTotal, 2); ?></span>
            </div>
            
            <a href="checkout.php" class="btn btn-primary cart-checkout-btn" style="width: 100%; margin-top: 24px;">Proceed to Checkout</a>
            
            <div style="margin-top: 16px; text-align: center;">
                <svg style="width: 20px; height: 20px; color: var(--success); vertical-align: middle;" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                <span style="font-size: 0.85rem; color: var(--text-secondary); margin-left: 4px; vertical-align: middle;">Secure Checkout</span>
            </div>
        </aside>
        <?php } ?>
    </div>
</div>

<?php require_once dirname(__DIR__) . '/components/footer.php'; ?>
