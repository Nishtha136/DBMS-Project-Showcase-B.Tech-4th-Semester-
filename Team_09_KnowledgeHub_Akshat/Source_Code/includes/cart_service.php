<?php
/**
 * Shared cart / checkout calculations — quantities capped by stock only (no fixed max per title).
 */

/**
 * Load book rows for all IDs in the cart (prepared IN clause).
 *
 * @param array<int,int|string> $cart session cart book_id => qty
 * @return array<int, array<string,mixed>> keyed by book_id
 */
function cart_load_books_by_ids(mysqli $conn, array $cart): array
{
    $ids = array_map('intval', array_keys($cart));
    $ids = array_values(array_filter($ids, static fn ($id) => $id > 0));
    if ($ids === []) {
        return [];
    }
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
    return $books;
}

/** Requested quantity limited by available stock. */
function cart_cap_qty(int $requestedQty, int $stock): int
{
    if ($stock <= 0 || $requestedQty <= 0) {
        return 0;
    }
    return min($requestedQty, $stock);
}

/**
 * Build validated lines for checkout / order placement.
 *
 * @return array<int, array{book_id:int,qty:int,unit_price:float,subtotal:float}>
 */
function cart_build_order_lines(array $cart, array $booksById): array
{
    $lines = [];
    foreach ($cart as $bid => $qty) {
        $bid = (int) $bid;
        $qty = (int) $qty;
        if ($bid <= 0 || $qty <= 0 || !isset($booksById[$bid])) {
            continue;
        }
        $stock = (int) $booksById[$bid]['stock'];
        $q = cart_cap_qty($qty, $stock);
        if ($q <= 0) {
            continue;
        }
        $unit = (float) $booksById[$bid]['price'];
        $lines[] = [
            'book_id' => $bid,
            'qty' => $q,
            'unit_price' => $unit,
            'subtotal' => round($unit * $q, 2),
        ];
    }
    return $lines;
}

function cart_order_grand_total(array $lines): float
{
    $t = 0.0;
    foreach ($lines as $l) {
        $t += $l['subtotal'];
    }
    return round($t, 2);
}

/**
 * JSON payload for sp_place_order (MySQL): array of {book_id, qty}.
 *
 * @param array<int, array{book_id:int,qty:int}> $lines
 */
function cart_lines_to_sp_json(array $lines): string
{
    $payload = [];
    foreach ($lines as $l) {
        $payload[] = [
            'book_id' => (int) $l['book_id'],
            'qty' => (int) $l['qty'],
        ];
    }
    return json_encode($payload, JSON_THROW_ON_ERROR);
}

/**
 * Checkout summary: same lines + grand total (for checkout.php display).
 *
 * @return array{lines: array, subtotal: float, gst: float, delivery: float, grand: float}
 */
function cart_checkout_summary(mysqli $conn, array $cart): array
{
    $books = cart_load_books_by_ids($conn, $cart);
    $lines = cart_build_order_lines($cart, $books);
    $subtotal = cart_order_grand_total($lines);
    
    $gst = round($subtotal * 0.18, 2);
    $delivery = $subtotal >= 1000 ? 0.00 : 50.00;
    if ($subtotal == 0) {
        $delivery = 0.00;
    }
    $grand = round($subtotal + $gst + $delivery, 2);

    return [
        'lines'    => $lines,
        'subtotal' => $subtotal,
        'gst'      => $gst,
        'delivery' => $delivery,
        'grand'    => $grand,
    ];
}

/**
 * Payload for cart_action.php JSON (totals + per-line display).
 *
 * @return array{subtotal: float, gst: float, delivery: float, total: float, count: int, items: array<int, array<string,mixed>>}
 */
function cart_snapshot_for_json(mysqli $conn, array $cart): array
{
    if (empty($cart)) {
        return ['subtotal' => 0.0, 'gst' => 0.0, 'delivery' => 0.0, 'total' => 0.0, 'count' => 0, 'items' => []];
    }
    $books = cart_load_books_by_ids($conn, $cart);
    $lines = cart_build_order_lines($cart, $books);
    
    $subtotal = cart_order_grand_total($lines);
    $gst = round($subtotal * 0.18, 2);
    $delivery = $subtotal >= 1000 ? 0.00 : 50.00;
    if ($subtotal == 0) {
        $delivery = 0.00;
    }
    $total = round($subtotal + $gst + $delivery, 2);
    
    $count = 0;
    $items = [];
    foreach ($lines as $l) {
        $bid = $l['book_id'];
        $count += $l['qty'];
        $b = $books[$bid];
        $img = trim((string) ($b['image'] ?? ''));
        $items[] = [
            'book_id' => $bid,
            'title' => $b['title'],
            'qty' => $l['qty'],
            'price' => $l['unit_price'],
            'subtotal' => $l['subtotal'],
            'image' => $img === '' ? 'assets/placeholder.svg' : $img,
            'max_qty' => (int) $b['stock'],
        ];
    }
    return ['subtotal' => $subtotal, 'gst' => $gst, 'delivery' => $delivery, 'total' => $total, 'count' => $count, 'items' => $items];
}
