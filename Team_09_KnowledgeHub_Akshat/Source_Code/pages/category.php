<?php
/**
 * Category Page — search (token AND), price range, filters, sort, grid view.
 */
require_once dirname(__DIR__) . '/includes/init.php';
require_once dirname(__DIR__) . '/includes/db.php';
require_once dirname(__DIR__) . '/includes/schema_bookstore.php';
require_once dirname(__DIR__) . '/includes/cart_service.php';
require_once dirname(__DIR__) . '/includes/bookstore_ui.php';

$catalogKeys = ['q', 'category_id', 'author', 'pub_year', 'sort', 'price_min', 'price_max'];
$catalogQuery = array_intersect_key($_GET, array_flip($catalogKeys));
$_SESSION['catalog_query'] = $catalogQuery;
$catalogQs = http_build_query($catalogQuery);

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

// --- Add to cart (POST)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_book'], $_POST['book_id'])) {
    $bookId = (int) $_POST['book_id'];
    if ($bookId > 0) {
        $stmt = $conn->prepare('SELECT stock FROM book WHERE book_id = ?');
        $stmt->bind_param('i', $bookId);
        $stmt->execute();
        $res = $stmt->get_result();
        if ($row = $res->fetch_assoc()) {
            $stock = (int) $row['stock'];
            $current = isset($_SESSION['cart'][$bookId]) ? (int) $_SESSION['cart'][$bookId] : 0;
            if ($stock <= 0) {
                $_SESSION['flash'] = 'This book is out of stock.';
                $_SESSION['flash_type'] = 'error';
            } elseif ($current >= $stock) {
                $_SESSION['flash'] = 'You already have the maximum available for this title (' . $stock . ').';
                $_SESSION['flash_type'] = 'error';
            } else {
                $_SESSION['cart'][$bookId] = $current + 1;
                $_SESSION['flash'] = 'Added to cart.';
                $_SESSION['flash_type'] = 'success';
                $_SESSION['added_book_id'] = $bookId;
            }
        }
        $stmt->close();
    }
    $back = 'category.php' . ($catalogQs !== '' ? '?' . $catalogQs : '');
    header('Location: ' . $back);
    exit;
}

$q = trim((string) ($_GET['q'] ?? ''));
$categoryId = isset($_GET['category_id']) ? (int) $_GET['category_id'] : 0;
$authorFilter = trim((string) ($_GET['author'] ?? ''));
$pubYear = isset($_GET['pub_year']) ? (int) $_GET['pub_year'] : 0;
$sortKey = $_GET['sort'] ?? 'name_az';
$priceMin = isset($_GET['price_min']) && $_GET['price_min'] !== '' ? (float) $_GET['price_min'] : null;
$priceMax = isset($_GET['price_max']) && $_GET['price_max'] !== '' ? (float) $_GET['price_max'] : null;

$sortMap = [
    'price_low' => 'b.price ASC',
    'price_high' => 'b.price DESC',
    'name_az' => 'b.title ASC',
    'name_za' => 'b.title DESC',
];
$orderSql = $sortMap[$sortKey] ?? $sortMap['name_az'];

$bookCols = bookstore_table_columns($conn, 'book');
$yearCol = bookstore_book_year_column($bookCols);
$hasRatingCol = in_array('rating_demo', $bookCols, true);

$where = ['1=1'];
$params = [];
$types = '';

if ($q !== '') {
    $tokens = preg_split('/\s+/u', $q, -1, PREG_SPLIT_NO_EMPTY);
    foreach ($tokens as $tok) {
        $like = '%' . $tok . '%';
        $where[] = '(b.title LIKE ? OR b.author LIKE ? OR b.description LIKE ?)';
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
        $types .= 'sss';
    }
}

if ($categoryId > 0) {
    $where[] = 'b.category_id = ?';
    $params[] = $categoryId;
    $types .= 'i';
}

if ($authorFilter !== '') {
    $where[] = 'b.author = ?';
    $params[] = $authorFilter;
    $types .= 's';
}

if ($pubYear > 0 && $yearCol !== null) {
    if ($yearCol === 'year_published') {
        $where[] = 'b.year_published = ?';
    } else {
        $safeCol = preg_replace('/[^a-zA-Z0-9_]/', '', $yearCol);
        $where[] = 'YEAR(b.`' . $safeCol . '`) = ?';
    }
    $params[] = $pubYear;
    $types .= 'i';
}

if ($priceMin !== null && $priceMin >= 0) {
    $where[] = 'b.price >= ?';
    $params[] = $priceMin;
    $types .= 'd';
}

if ($priceMax !== null && $priceMax >= 0) {
    $where[] = 'b.price <= ?';
    $params[] = $priceMax;
    $types .= 'd';
}

$selectCols = 'b.book_id, b.title, b.author, b.description, b.price, b.stock, b.image, b.category_id';
if ($hasRatingCol) {
    $selectCols .= ', b.rating_demo';
}

$sql = "SELECT {$selectCols}, c.category_name
        FROM book b
        LEFT JOIN category c ON b.category_id = c.category_id
        WHERE " . implode(' AND ', $where) . '
        ORDER BY ' . $orderSql;

$stmt = $conn->prepare($sql);
if (!$stmt) {
    $result = false;
} else {
    if ($types !== '') {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();
}

$authorList = [];
$authorsRes = $conn->query('SELECT DISTINCT author FROM book ORDER BY author ASC');
if ($authorsRes) {
    while ($ar = $authorsRes->fetch_assoc()) {
        $authorList[] = $ar['author'];
    }
}

$qsNoCategory = $catalogQuery;
unset($qsNoCategory['category_id']);
$allBooksHref = 'category.php' . (!empty($qsNoCategory) ? '?' . http_build_query($qsNoCategory) : '');

$years = [];
if ($yearCol !== null && $yearCol !== 'year_published') {
    $yc = str_replace('`', '', $yearCol);
    $ySql = "SELECT DISTINCT YEAR(`{$yc}`) AS y FROM book WHERE `{$yc}` IS NOT NULL ORDER BY y DESC";
    $yr = $conn->query($ySql);
    if ($yr) {
        while ($rw = $yr->fetch_assoc()) {
            if ($rw['y'] !== null) {
                $years[] = (int) $rw['y'];
            }
        }
    }
} elseif ($yearCol === 'year_published') {
    $yr = $conn->query('SELECT DISTINCT year_published AS y FROM book WHERE year_published IS NOT NULL ORDER BY y DESC');
    if ($yr) {
        while ($rw = $yr->fetch_assoc()) {
            $years[] = (int) $rw['y'];
        }
    }
}

$categories = $conn->query('SELECT category_id, category_name FROM category ORDER BY category_name ASC');

$pageTitle = 'Browse Books';
$activeNav = 'category';
$navSearchQuery = $q;
require_once dirname(__DIR__) . '/components/navbar.php';
require_once dirname(__DIR__) . '/components/book_card.php';

$flash = $_SESSION['flash'] ?? '';
$flashType = $_SESSION['flash_type'] ?? 'info';
unset($_SESSION['flash'], $_SESSION['flash_type']);
?>

<div class="container mb-4">
    <?php if ($flash !== '') {
        $cls = $flashType === 'error' ? 'alert-error' : ($flashType === 'success' ? 'alert-success' : 'alert-info');
        echo '<div class="alert ' . htmlspecialchars($cls) . '">' . htmlspecialchars($flash) . '</div>';
    } ?>

    <div class="page-head" style="margin-top: 1rem;">
        <h1 style="font-size: 2rem; margin-bottom: 0.5rem;"><?php echo $q ? 'Search Results for "'.htmlspecialchars($q).'"' : 'All Books'; ?></h1>
        <p class="muted">Find your next favorite read using the filters below.</p>
    </div>

    <div class="catalog-layout">
        <aside class="catalog-sidebar">
            <h2 class="sidebar-title">Categories</h2>
            <ul class="category-list">
                <li><a href="<?php echo htmlspecialchars($allBooksHref); ?>" class="<?php echo $categoryId === 0 ? 'is-active' : ''; ?>">All Categories</a></li>
                <?php
                if ($categories) {
                    while ($cat = $categories->fetch_assoc()) {
                        $cid = (int) $cat['category_id'];
                        $qs = array_merge($catalogQuery, ['category_id' => $cid]);
                        $href = 'category.php?' . http_build_query($qs);
                        ?>
                        <li><a href="<?php echo htmlspecialchars($href); ?>" class="<?php echo $categoryId === $cid ? 'is-active' : ''; ?>"><?php echo htmlspecialchars($cat['category_name']); ?></a></li>
                        <?php
                    }
                }
                ?>
            </ul>

            <h2 class="sidebar-title mt-4">Filters</h2>
            <form class="filter-form" method="get" action="category.php">
                <?php if ($q !== '') { ?>
                    <input type="hidden" name="q" value="<?php echo htmlspecialchars($q); ?>">
                <?php } ?>
                <?php if ($categoryId > 0) { ?>
                    <input type="hidden" name="category_id" value="<?php echo $categoryId; ?>">
                <?php } ?>

                <div class="form-group" style="margin-bottom: 12px;">
                    <label class="filter-label">Author</label>
                    <select name="author" class="filter-select">
                        <option value="">All authors</option>
                        <?php
                        foreach ($authorList as $a) {
                            $sel = ($authorFilter === $a) ? ' selected' : '';
                            echo '<option value="' . htmlspecialchars($a) . '"' . $sel . '>' . htmlspecialchars($a) . '</option>';
                        }
                        ?>
                    </select>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
                    <div>
                        <label class="filter-label">Min (₹)</label>
                        <input type="number" name="price_min" class="text-input" step="0.01" min="0" placeholder="0"
                               value="<?php echo $priceMin !== null ? htmlspecialchars((string) $priceMin) : ''; ?>">
                    </div>
                    <div>
                        <label class="filter-label">Max (₹)</label>
                        <input type="number" name="price_max" class="text-input" step="0.01" min="0" placeholder="Any"
                               value="<?php echo $priceMax !== null ? htmlspecialchars((string) $priceMax) : ''; ?>">
                    </div>
                </div>

                <?php if (count($years) > 0) { ?>
                    <div class="form-group" style="margin-bottom: 12px;">
                        <label class="filter-label">Year</label>
                        <select name="pub_year" class="filter-select">
                            <option value="0">Any year</option>
                            <?php foreach ($years as $y) {
                                $sel = ($pubYear === $y) ? ' selected' : '';
                                echo '<option value="' . (int) $y . '"' . $sel . '>' . (int) $y . '</option>';
                            } ?>
                        </select>
                    </div>
                <?php } ?>

                <div class="form-group" style="margin-bottom: 16px;">
                    <label class="filter-label">Sort by</label>
                    <select name="sort" class="filter-select">
                        <option value="name_az"<?php echo $sortKey === 'name_az' ? ' selected' : ''; ?>>Name (A–Z)</option>
                        <option value="name_za"<?php echo $sortKey === 'name_za' ? ' selected' : ''; ?>>Name (Z–A)</option>
                        <option value="price_low"<?php echo $sortKey === 'price_low' ? ' selected' : ''; ?>>Price (low → high)</option>
                        <option value="price_high"<?php echo $sortKey === 'price_high' ? ' selected' : ''; ?>>Price (high → low)</option>
                    </select>
                </div>

                <button type="submit" class="btn btn-primary" style="width: 100%;">Apply filters</button>
                <?php if(!empty($catalogQuery) && (!isset($catalogQuery['category_id']) || count($catalogQuery) > 1)) { ?>
                    <a href="category.php" class="btn btn-secondary text-center" style="width: 100%; display: block; margin-top: 8px;">Clear all</a>
                <?php } ?>
            </form>
        </aside>

        <div class="catalog-main">
            <?php
            if (!$result) {
                echo '<div class="alert alert-error">Could not load books: ' . htmlspecialchars($conn->error) . '</div>';
            } elseif ($result->num_rows === 0) {
                echo '<div class="empty-state">
                        <h3 style="margin-bottom: 8px;">No books found</h3>
                        <p style="margin-bottom: 16px;">We couldn\'t find any books matching your filters.</p>
                        <a href="category.php" class="btn btn-secondary">Clear all filters</a>
                      </div>';
            } else {
                echo '<div class="book-grid">';
                while ($row = $result->fetch_assoc()) {
                    render_book_card(
                        $row,
                        $catalogQs,
                        $wishlistIds,
                        $isLoggedIn,
                        $wishTable,
                        $hasRatingCol
                    );
                }
                echo '</div>';
            }
            ?>
        </div>
    </div>
</div>

<?php require_once dirname(__DIR__) . '/components/footer.php'; ?>
