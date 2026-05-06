    </main>
    <footer class="site-footer">
        <div class="container">
            <p class="footer-text">Knowledge Hub Bookstore — Premium UI Demo</p>
        </div>
    </footer>

    <!-- Mobile Nav Overlay -->
    <div class="nav-overlay" id="nav-overlay"></div>

    <script>
    // Wire mobile nav overlay
    (function(){
        var overlay = document.getElementById('nav-overlay');
        var nav     = document.getElementById('main-nav');
        var ham     = document.getElementById('nav-hamburger');
        if (!overlay || !nav) return;
        overlay.addEventListener('click', function(){
            nav.classList.remove('open');
            overlay.classList.remove('show');
            if (ham) ham.setAttribute('aria-expanded','false');
        });
        // Patch hamburger to also show overlay
        var origHam = document.getElementById('nav-hamburger');
        if (origHam) {
            origHam.addEventListener('click', function(){
                overlay.classList.toggle('show', nav.classList.contains('open'));
            });
        }
        // Close on nav-close
        var nc = document.getElementById('nav-close');
        if (nc) nc.addEventListener('click', function(){ overlay.classList.remove('show'); });
    })();

    // Global: add .btn-loading on form submit buttons
    document.querySelectorAll('form').forEach(function(f){
        f.addEventListener('submit', function(){
            var btn = f.querySelector('[type="submit"]');
            if (btn && !btn.dataset.noLoad) {
                setTimeout(function(){ btn.classList.add('btn-loading'); btn.disabled = true; }, 0);
            }
        });
    });
    </script>

    <?php if (isset($_SESSION['added_book_id']) && (int)$_SESSION['added_book_id'] > 0) { 
        $addedBookId = (int)$_SESSION['added_book_id'];
        unset($_SESSION['added_book_id']);
        
        // Fetch book info
        $modStmt = $conn->prepare('SELECT title, image, price, category_id FROM book WHERE book_id = ?');
        $modStmt->bind_param('i', $addedBookId);
        $modStmt->execute();
        $addedBook = $modStmt->get_result()->fetch_assoc();
        $modStmt->close();
        
        if ($addedBook) {
            $abTitle = htmlspecialchars($addedBook['title']);
            $abPrice = (float)$addedBook['price'];
            $abImg = trim((string)$addedBook['image']) ?: '../assets/placeholder.svg';
            if ($abImg !== '../assets/placeholder.svg' && !preg_match('~^(?:f|ht)tps?://~i', $abImg) && strpos($abImg, '/') !== 0 && strpos($abImg, '../') !== 0) {
                $abImg = '../' . $abImg;
            }
            
            // Fetch suggestions
            $sugBooks = [];
            $catId = (int)$addedBook['category_id'];
            $sugStmt = $conn->prepare('SELECT book_id, title, price, image FROM book WHERE category_id = ? AND book_id != ? AND stock > 0 ORDER BY book_id DESC LIMIT 2');
            $sugStmt->bind_param('ii', $catId, $addedBookId);
            $sugStmt->execute();
            $sugRes = $sugStmt->get_result();
            while($sb = $sugRes->fetch_assoc()) {
                $sugBooks[] = $sb;
            }
            $sugStmt->close();
    ?>
    <div class="modal-overlay active" id="cartModal">
        <div class="cart-modal">
            <button class="modal-close" onclick="document.getElementById('cartModal').classList.remove('active');">&times;</button>
            <div class="modal-header">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                Added to your cart
            </div>
            
            <div class="modal-content">
                <div>
                    <div style="display: flex; gap: 16px; margin-bottom: 24px;">
                        <img src="<?php echo htmlspecialchars($abImg); ?>" alt="" style="width: 80px; height: 120px; object-fit: cover; border-radius: var(--radius-sm);">
                        <div>
                            <h4 style="margin-bottom: 8px; font-size: 1.1rem;"><?php echo $abTitle; ?></h4>
                            <p style="font-weight: 700; color: var(--price); margin-bottom: 16px;">₹<?php echo number_format($abPrice, 2); ?></p>
                        </div>
                    </div>
                    <div style="display: flex; gap: 12px; flex-direction: column;">
                        <a href="../pages/cart.php" class="btn btn-primary" style="width: 100%;">View Cart & Checkout</a>
                        <button onclick="document.getElementById('cartModal').classList.remove('active');" class="btn btn-secondary" style="width: 100%;">Continue Shopping</button>
                    </div>
                </div>
                
                <?php if (count($sugBooks) > 0) { ?>
                <div style="border-left: 1px solid var(--border); padding-left: var(--space-4);">
                    <h4 style="margin-bottom: 16px; font-size: 1rem; color: var(--text-secondary);">You might also like</h4>
                    <div style="display: flex; flex-direction: column; gap: 16px;">
                        <?php foreach($sugBooks as $sb) { 
                            $sbImg = trim((string)$sb['image']) ?: '../assets/placeholder.svg';
                            if ($sbImg !== '../assets/placeholder.svg' && !preg_match('~^(?:f|ht)tps?://~i', $sbImg) && strpos($sbImg, '/') !== 0 && strpos($sbImg, '../') !== 0) {
                                $sbImg = '../' . $sbImg;
                            }
                        ?>
                        <div style="display: flex; gap: 12px;">
                            <img src="<?php echo htmlspecialchars($sbImg); ?>" alt="" style="width: 60px; height: 90px; object-fit: cover; border-radius: var(--radius-sm);">
                            <div>
                                <a href="../pages/product.php?id=<?php echo $sb['book_id']; ?>" style="font-size: 0.95rem; font-weight: 600; color: var(--text-primary); display: block; margin-bottom: 4px;"><?php echo htmlspecialchars($sb['title']); ?></a>
                                <p style="color: var(--price); font-weight: 700; font-size: 0.9rem;">₹<?php echo number_format((float)$sb['price'], 2); ?></p>
                            </div>
                        </div>
                        <?php } ?>
                    </div>
                </div>
                <?php } ?>
            </div>
        </div>
    </div>
    <?php } } ?>

    <script src="../js/main.js"></script>
    <script src="../assets/js/animations.js"></script>
<?php if (!empty($loadCartJs)) { ?>
    <script src="../js/cart.js"></script>
    <?php } ?>

<!-- ── Toast Notification System ── -->
<style>
.toast-wrap{position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:10px;pointer-events:none}
.toast{display:flex;align-items:center;gap:12px;padding:14px 18px;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.15);font-size:.88rem;font-weight:500;min-width:280px;max-width:340px;pointer-events:all;animation:toastIn .3s ease;background:#fff;border:1px solid var(--border)}
.toast.success{border-left:4px solid #10b981}
.toast.error{border-left:4px solid #ef4444}
.toast.info{border-left:4px solid var(--accent)}
.toast-icon{width:20px;height:20px;flex-shrink:0}
.toast.success .toast-icon{color:#10b981}
.toast.error .toast-icon{color:#ef4444}
.toast.info .toast-icon{color:var(--accent)}
.toast.hide{animation:toastOut .3s ease forwards}
@keyframes toastIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}
@keyframes toastOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(40px)}}
</style>
<div class="toast-wrap" id="toast-wrap"></div>
<?php
$toastFlash = $_SESSION['toast_flash'] ?? '';
$toastType  = $_SESSION['toast_type']  ?? 'info';
unset($_SESSION['toast_flash'], $_SESSION['toast_type']);
if ($toastFlash !== '') {
    echo '<script>document.addEventListener("DOMContentLoaded",function(){showToast(' . json_encode($toastFlash) . ',' . json_encode($toastType) . ')});</script>';
}
?>
<script>
function showToast(msg, type) {
    type = type || 'info';
    var icons = {
        success: '<svg class="toast-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
        error:   '<svg class="toast-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
        info:    '<svg class="toast-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
    };
    var t = document.createElement('div');
    t.className = 'toast ' + type;
    t.innerHTML = (icons[type]||icons.info) + '<span>' + msg + '</span>';
    document.getElementById('toast-wrap').appendChild(t);
    setTimeout(function(){ t.classList.add('hide'); setTimeout(function(){ t.remove(); }, 350); }, 3500);
}
// Expose globally for inline use
window.showToast = showToast;
</script>
</body>
</html>
