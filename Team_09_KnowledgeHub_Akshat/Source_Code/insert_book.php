<?php
/**
 * Admin-style book insert — prepared statements + basic validation (no SQL injection).
 * For coursework: protect this URL in production (e.g. HTTP auth or admin role).
 */
require_once __DIR__ . '/includes/db.php';

$errors = [];
$okMsg = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $title = trim((string) ($_POST['title'] ?? ''));
    $author = trim((string) ($_POST['author'] ?? ''));
    $description = trim((string) ($_POST['description'] ?? ''));
    $price = isset($_POST['price']) ? (float) $_POST['price'] : 0.0;
    $stock = isset($_POST['stock']) ? (int) $_POST['stock'] : 0;
    $categoryId = isset($_POST['category_id']) ? (int) $_POST['category_id'] : 0;

    if ($title === '' || mb_strlen($title) > 255) {
        $errors[] = 'Title is required (max 255 characters).';
    }
    if ($author === '' || mb_strlen($author) > 180) {
        $errors[] = 'Author is required (max 180 characters).';
    }
    if ($price < 0 || $price > 999999.99) {
        $errors[] = 'Price must be between 0 and 999999.99.';
    }
    if ($stock < 0 || $stock > 999999) {
        $errors[] = 'Stock must be a non-negative integer.';
    }

    if ($errors === []) {
        if ($categoryId > 0) {
            $stmt = $conn->prepare(
                'INSERT INTO book (title, author, description, price, stock, category_id)
                 VALUES (?, ?, ?, ?, ?, ?)'
            );
            $stmt->bind_param(str_repeat('s', 3) . 'd' . str_repeat('i', 2), $title, $author, $description, $price, $stock, $categoryId);
        } else {
            $stmt = $conn->prepare(
                'INSERT INTO book (title, author, description, price, stock)
                 VALUES (?, ?, ?, ?, ?)'
            );
            $stmt->bind_param('sssdi', $title, $author, $description, $price, $stock);
        }
        if ($stmt->execute()) {
            $okMsg = 'Book added successfully. ID: ' . (int) $conn->insert_id;
        } else {
            $errors[] = 'Database error: ' . $stmt->error;
        }
        $stmt->close();
    }
}

$cats = $conn->query('SELECT category_id, category_name FROM category ORDER BY category_name');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Add book — Bookstore</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
<div class="container" style="max-width:560px;margin:2rem auto;">
    <h1>Add book</h1>
    <?php foreach ($errors as $e) { ?>
        <div class="alert alert-error"><?php echo htmlspecialchars($e); ?></div>
    <?php } ?>
    <?php if ($okMsg !== '') { ?>
        <div class="alert alert-success"><?php echo htmlspecialchars($okMsg); ?></div>
    <?php } ?>
    <form method="post" class="checkout-card" action="insert_book.php">
        <div class="form-group">
            <label>Title</label>
            <input class="text-input" type="text" name="title" required maxlength="255"
                   value="<?php echo htmlspecialchars($_POST['title'] ?? ''); ?>">
        </div>
        <div class="form-group">
            <label>Author</label>
            <input class="text-input" type="text" name="author" required maxlength="180"
                   value="<?php echo htmlspecialchars($_POST['author'] ?? ''); ?>">
        </div>
        <div class="form-group">
            <label>Description</label>
            <textarea class="text-input" name="description" rows="4"><?php echo htmlspecialchars($_POST['description'] ?? ''); ?></textarea>
        </div>
        <div class="form-group">
            <label>Price</label>
            <input class="text-input" type="number" name="price" step="0.01" min="0" required
                   value="<?php echo htmlspecialchars($_POST['price'] ?? '0'); ?>">
        </div>
        <div class="form-group">
            <label>Stock</label>
            <input class="text-input" type="number" name="stock" min="0" required
                   value="<?php echo htmlspecialchars($_POST['stock'] ?? '0'); ?>">
        </div>
        <div class="form-group">
            <label>Category</label>
            <select class="filter-select" name="category_id" style="width:100%;">
                <option value="0">— None —</option>
                <?php
                if ($cats) {
                    while ($c = $cats->fetch_assoc()) {
                        $sel = isset($_POST['category_id']) && (int) $_POST['category_id'] === (int) $c['category_id'] ? ' selected' : '';
                        echo '<option value="' . (int) $c['category_id'] . '"' . $sel . '>' . htmlspecialchars($c['category_name']) . '</option>';
                    }
                }
                ?>
            </select>
        </div>
        <button type="submit" class="btn btn-primary">Save book</button>
        <a href="index.php" class="btn btn-secondary">Back to shop</a>
    </form>
</div>
</body>
</html>
