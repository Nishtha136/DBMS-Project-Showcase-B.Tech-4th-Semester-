<?php
/**
 * pages/admin_inventory.php — Admin Dashboard for Inventory Management
 */
require_once __DIR__ . '/../includes/init.php';
require_once __DIR__ . '/../includes/db.php';

// Auth checks
if (!isset($_SESSION['customer_id']) || (int) $_SESSION['customer_id'] <= 0) {
    $_SESSION['redirect_after_login'] = 'pages/admin_inventory.php';
    $_SESSION['flash'] = 'Please log in as admin.';
    $_SESSION['flash_type'] = 'error';
    header('Location: ../login.php');
    exit;
}
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    $_SESSION['flash'] = 'Access denied (admin only).';
    $_SESSION['flash_type'] = 'error';
    header('Location: ../index.php');
    exit;
}

// Handle Form Actions (Add, Edit, Delete, Update Stock)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    
    if ($action === 'update_stock') {
        $bid = (int) ($_POST['book_id'] ?? 0);
        $newStock = (int) ($_POST['stock'] ?? 0);
        if ($bid > 0 && $newStock >= 0) {
            $stmt = $conn->prepare('UPDATE book SET stock = ? WHERE book_id = ?');
            $stmt->bind_param('ii', $newStock, $bid);
            if ($stmt->execute()) {
                $_SESSION['flash'] = 'Stock updated successfully.';
                $_SESSION['flash_type'] = 'success';
            } else {
                $_SESSION['flash'] = 'Error updating stock.';
                $_SESSION['flash_type'] = 'error';
            }
            $stmt->close();
        }
    } elseif ($action === 'delete') {
        $bid = (int) ($_POST['book_id'] ?? 0);
        if ($bid > 0) {
            $stmt = $conn->prepare('DELETE FROM book WHERE book_id = ?');
            $stmt->bind_param('i', $bid);
            if ($stmt->execute()) {
                $_SESSION['flash'] = 'Book deleted successfully.';
                $_SESSION['flash_type'] = 'success';
            } else {
                $_SESSION['flash'] = 'Cannot delete book (it may have active orders).';
                $_SESSION['flash_type'] = 'error';
            }
            $stmt->close();
        }
    } elseif ($action === 'save') {
        $bid = (int) ($_POST['book_id'] ?? 0);
        $title = trim($_POST['title'] ?? '');
        $author = trim($_POST['author'] ?? '');
        $price = (float) ($_POST['price'] ?? 0);
        $stock = (int) ($_POST['stock'] ?? 0);
        $image = trim($_POST['image'] ?? '');
        
        if ($title !== '' && $price > 0 && $stock >= 0) {
            if ($bid > 0) {
                // Edit
                $stmt = $conn->prepare('UPDATE book SET title=?, author=?, price=?, stock=?, image=? WHERE book_id=?');
                $stmt->bind_param('ssdisi', $title, $author, $price, $stock, $image, $bid);
                if ($stmt->execute()) {
                    $_SESSION['flash'] = 'Book updated successfully.';
                    $_SESSION['flash_type'] = 'success';
                }
                $stmt->close();
            } else {
                // Add
                $stmt = $conn->prepare('INSERT INTO book (title, author, price, stock, image) VALUES (?, ?, ?, ?, ?)');
                $stmt->bind_param('ssdis', $title, $author, $price, $stock, $image);
                if ($stmt->execute()) {
                    $_SESSION['flash'] = 'Book added successfully.';
                    $_SESSION['flash_type'] = 'success';
                }
                $stmt->close();
            }
        } else {
            $_SESSION['flash'] = 'Invalid form data. Title and price are required.';
            $_SESSION['flash_type'] = 'error';
        }
    }
    header('Location: admin_inventory.php');
    exit;
}

// Fetch all books
$res = $conn->query('SELECT * FROM book ORDER BY book_id DESC');
$books = [];
if ($res) {
    while ($row = $res->fetch_assoc()) {
        $books[] = $row;
    }
}

$pageTitle = 'Admin — Inventory';
$activeNav = 'inventory';
require_once __DIR__ . '/../components/navbar.php';

$flash = $_SESSION['flash'] ?? '';
$flashType = $_SESSION['flash_type'] ?? 'info';
unset($_SESSION['flash'], $_SESSION['flash_type']);
?>

<style>
body { background-color: var(--bg-tertiary); }
.admin-layout {
    display: grid;
    grid-template-columns: 240px 1fr;
    gap: 20px;
    height: calc(100vh - 80px);
    padding: 20px;
    box-sizing: border-box;
}

@media (max-width: 1100px) {
    .admin-layout { grid-template-columns: 1fr; height: auto; }
}

.dash-panel {
    background: var(--bg-primary);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.dash-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
    background: var(--bg-primary);
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.dash-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
}

/* Sidebar Navigation */
.admin-nav {
    list-style: none;
    padding: 20px;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.admin-nav li a {
    display: block;
    padding: 12px 16px;
    border-radius: 8px;
    color: var(--text-secondary);
    text-decoration: none;
    font-weight: 500;
    transition: all 0.2s;
}
.admin-nav li a:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
}
.admin-nav li a.active {
    background: rgba(255, 106, 0, 0.1);
    color: var(--accent);
    font-weight: 600;
}

/* Inventory Table */
.inv-table {
    width: 100%;
    border-collapse: collapse;
}
.inv-table th {
    text-align: left;
    padding: 12px 16px;
    border-bottom: 2px solid var(--border);
    color: var(--text-secondary);
    font-weight: 600;
    font-size: 0.85rem;
    text-transform: uppercase;
}
.inv-table td {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    vertical-align: middle;
}
.inv-table tr:hover {
    background: var(--bg-tertiary);
}

.stock-input {
    width: 56px;
    padding: 6px;
    border: 1.5px solid var(--border);
    border-radius: 6px;
    text-align: center;
    font-weight: 600;
    font-size: 0.95rem;
}
.stock-input:focus { border-color: var(--accent); outline: none; }
/* Stepper */
.stock-stepper {
    display: flex;
    align-items: center;
    gap: 0;
    border: 1.5px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    width: fit-content;
}
.stock-stepper button {
    width: 32px; height: 34px;
    background: var(--bg-tertiary);
    border: none;
    cursor: pointer;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-secondary);
    transition: background .15s, color .15s;
    display: flex; align-items: center; justify-content: center;
}
.stock-stepper button:hover { background: var(--accent); color: #fff; }
.stock-stepper .sv {
    width: 50px; height: 34px;
    border: none;
    border-left: 1.5px solid var(--border);
    border-right: 1.5px solid var(--border);
    text-align: center;
    font-weight: 700;
    font-size: 0.95rem;
    color: var(--text-primary);
    background: #fff;
    outline: none;
}
/* Sticky thead */
.inv-table thead th {
    position: sticky;
    top: 0;
    background: var(--bg-primary);
    z-index: 5;
    box-shadow: 0 1px 0 var(--border);
}

/* Modal */
.modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}
.modal-overlay.active {
    display: flex;
}
.modal {
    background: var(--bg-primary);
    border-radius: 12px;
    width: 100%;
    max-width: 500px;
    padding: 24px;
    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
}
.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}
.modal-header h2 { margin: 0; font-size: 1.25rem; }
.close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary); }

.form-group { margin-bottom: 16px; }
.form-group label { display: block; margin-bottom: 6px; font-weight: 500; font-size: 0.9rem; }
.form-group input { width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 6px; box-sizing: border-box; }
</style>

<div class="admin-layout fade-in">
    
    <!-- LEFT SIDEBAR: Navigation -->
    <div class="dash-panel">
        <div class="dash-header">
            <div>
                <h2 style="font-size: 1.2rem; margin: 0; color: var(--accent);">Knowledge Hub</h2>
                <p class="muted" style="font-size: 0.85rem; margin-top: 4px;">Admin Portal</p>
            </div>
        </div>
        <ul class="admin-nav">
            <li><a href="admin_orders.php">Orders Dashboard</a></li>
            <li><a href="admin_inventory.php" class="active">Inventory</a></li>
        </ul>
    </div>

    <!-- MAIN INVENTORY -->
    <div class="dash-panel">
        <div class="dash-header">
            <div>
                <h2 style="font-size: 1.1rem; margin: 0;">Inventory Management</h2>
                <p class="muted" style="font-size: 0.85rem; margin-top: 4px;"><?php echo count($books); ?> books in catalog</p>
            </div>
            <button class="btn btn-primary btn-anim" onclick="openModal()">+ Add Book</button>
        </div>
        
        <?php if ($flash !== '') {
            $cls = $flashType === 'error' ? 'alert-error' : ($flashType === 'success' ? 'alert-success' : 'alert-info');
            echo '<div style="padding: 16px 20px;"><div class="alert ' . htmlspecialchars($cls) . '">' . htmlspecialchars($flash) . '</div></div>';
        } ?>

        <div class="dash-content" style="padding: 0;">
            <table class="inv-table">
                <thead>
                    <tr>
                        <th>Image</th>
                        <th>Title & Author</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($books as $b): 
                        $imgRaw = trim((string) $b['image']);
                        $imgSrc = $imgRaw === '' ? '../assets/placeholder.svg' : htmlspecialchars($imgRaw, ENT_QUOTES, 'UTF-8');
                        if ($imgSrc !== '../assets/placeholder.svg' && !preg_match('~^(?:f|ht)tps?://~i', $imgSrc) && strpos($imgSrc, '/') !== 0 && strpos($imgSrc, '../') !== 0) {
                            $imgSrc = '../' . $imgSrc;
                        }
                        $bjson = htmlspecialchars(json_encode($b), ENT_QUOTES, 'UTF-8');
                    ?>
                    <tr>
                        <td><img src="<?php echo $imgSrc; ?>" style="width: 40px; height: 55px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border);" onerror="this.src='../assets/placeholder.svg'"></td>
                        <td>
                            <div style="font-weight: 600; color: var(--text-primary);"><?php echo htmlspecialchars($b['title']); ?></div>
                            <div style="font-size: 0.85rem; color: var(--text-secondary);"><?php echo htmlspecialchars($b['author']); ?></div>
                        </td>
                        <td style="font-weight: 600; color: var(--price);">₹<?php echo number_format((float)$b['price'], 2); ?></td>
                        <td>
                            <form method="post" class="stepper-form" data-bid="<?php echo (int)$b['book_id']; ?>" style="display:flex;align-items:center;gap:10px;">
                                <input type="hidden" name="action" value="update_stock">
                                <input type="hidden" name="book_id" value="<?php echo (int)$b['book_id']; ?>">
                                <div class="stock-stepper">
                                    <button type="button" onclick="stepStock(this,-1)" title="Decrease">&#8722;</button>
                                    <input type="number" name="stock" value="<?php echo (int)$b['stock']; ?>" class="sv" min="0" required>
                                    <button type="button" onclick="stepStock(this,1)" title="Increase">&#43;</button>
                                </div>
                                <button type="submit" class="btn btn-secondary btn-anim" style="padding:6px 12px;font-size:0.8rem;">Update</button>
                            </form>
                        </td>
                        <td>
                            <div style="display: flex; gap: 8px;">
                                <button class="btn btn-secondary btn-anim" style="padding: 6px 12px; font-size: 0.8rem;" onclick="openModal(<?php echo $bjson; ?>)">Edit</button>
                                <form method="post" onsubmit="return confirm('Are you sure you want to delete this book?');">
                                    <input type="hidden" name="action" value="delete">
                                    <input type="hidden" name="book_id" value="<?php echo (int)$b['book_id']; ?>">
                                    <button type="submit" class="btn btn-secondary btn-anim" style="padding: 6px 12px; font-size: 0.8rem; color: var(--danger); border-color: #fecaca; background: #fef2f2;">Delete</button>
                                </form>
                            </div>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            <?php if (count($books) === 0) echo '<div style="padding: 40px; text-align: center; color: var(--text-secondary);">No books found in inventory.</div>'; ?>
        </div>
    </div>
</div>

<!-- Add / Edit Modal -->
<div class="modal-overlay" id="book-modal">
    <div class="modal slide-in">
        <div class="modal-header">
            <h2 id="modal-title">Add New Book</h2>
            <button class="close-btn" onclick="closeModal()">&times;</button>
        </div>
        <form method="post" action="admin_inventory.php">
            <input type="hidden" name="action" value="save">
            <input type="hidden" name="book_id" id="form-id" value="0">
            
            <div class="form-group">
                <label>Title *</label>
                <input type="text" name="title" id="form-title" required>
            </div>
            <div class="form-group">
                <label>Author</label>
                <input type="text" name="author" id="form-author">
            </div>
            <div style="display: flex; gap: 16px;">
                <div class="form-group" style="flex: 1;">
                    <label>Price (₹) *</label>
                    <input type="number" step="0.01" name="price" id="form-price" required min="0.01">
                </div>
                <div class="form-group" style="flex: 1;">
                    <label>Stock *</label>
                    <input type="number" name="stock" id="form-stock" required min="0">
                </div>
            </div>
            <div class="form-group">
                <label>Image URL or Path</label>
                <input type="text" name="image" id="form-image" placeholder="assets/book.jpg">
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary btn-anim">Save Book</button>
            </div>
        </form>
    </div>
</div>

<script>
function openModal(book = null) {
    document.getElementById('book-modal').classList.add('active');
    if (book) {
        document.getElementById('modal-title').innerText = 'Edit Book';
        document.getElementById('form-id').value = book.book_id;
        document.getElementById('form-title').value = book.title;
        document.getElementById('form-author').value = book.author;
        document.getElementById('form-price').value = parseFloat(book.price).toFixed(2);
        document.getElementById('form-stock').value = book.stock;
        document.getElementById('form-image').value = book.image;
    } else {
        document.getElementById('modal-title').innerText = 'Add New Book';
        document.getElementById('form-id').value = '0';
        document.getElementById('form-title').value = '';
        document.getElementById('form-author').value = '';
        document.getElementById('form-price').value = '';
        document.getElementById('form-stock').value = '0';
        document.getElementById('form-image').value = '';
    }
}

function closeModal() {
    document.getElementById('book-modal').classList.remove('active');
}

// Stepper [-] [+]
function stepStock(btn, delta) {
    const inp = btn.closest('.stock-stepper').querySelector('.sv');
    const cur = parseInt(inp.value) || 0;
    inp.value = Math.max(0, cur + delta);
}

document.querySelectorAll('.btn-anim').forEach(btn => {
    btn.addEventListener('mousedown', () => btn.style.transform = 'scale(0.96)');
    btn.addEventListener('mouseup',   () => btn.style.transform = 'scale(1)');
    btn.addEventListener('mouseleave',() => btn.style.transform = 'scale(1)');
});
</script>

<?php require_once __DIR__ . '/../components/footer.php'; ?>
