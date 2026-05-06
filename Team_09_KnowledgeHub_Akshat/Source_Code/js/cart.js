/**
 * Cart page: +/- quantity via fetch; updates line subtotals and order summary.
 */
(function () {
    'use strict';

    function money(n) {
        return '₹' + Number(n).toFixed(2);
    }

    var isFetching = false;

    function postCart(payload) {
        if (isFetching) return Promise.reject('locked');
        isFetching = true;
        
        return fetch('/knowledge_hub/cart_action.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(payload),
        }).then(function (r) {
            isFetching = false;
            return r.json();
        }).catch(function(e) {
            isFetching = false;
            throw e;
        });
    }

    function updateDom(data) {
        if (!data.ok) {
            return;
        }
        
        // Update Nav Count
        var countBadge = document.querySelector('.js-cart-nav-count');
        if (countBadge) {
            countBadge.textContent = data.count;
            if (data.count === 0) countBadge.remove();
        }

        // Update Summary
        var subtotalEl = document.querySelector('.js-cart-subtotal');
        if (subtotalEl && data.subtotal !== undefined) subtotalEl.textContent = money(data.subtotal);
        
        var gstEl = document.querySelector('.js-cart-gst');
        if (gstEl && data.gst !== undefined) gstEl.textContent = money(data.gst);
        
        var deliveryEl = document.querySelector('.js-cart-delivery');
        if (deliveryEl && data.delivery !== undefined) {
            deliveryEl.innerHTML = data.delivery > 0 ? money(data.delivery) : '<span style="color:var(--success);font-weight:600;">Free</span>';
        }
        
        var totalEls = document.querySelectorAll('.js-cart-grand-total');
        totalEls.forEach(function(el) {
            el.textContent = money(data.total);
        });

        // Update Line Items
        data.items.forEach(function (item) {
            var row = document.querySelector('.cart-item[data-book-id="' + item.book_id + '"]');
            if (!row) return;
            
            var qtyEl = row.querySelector('.js-line-qty');
            var subEl = row.querySelector('.js-line-subtotal');
            if (qtyEl) qtyEl.textContent = String(item.qty);
            if (subEl) subEl.textContent = money(item.subtotal);
        });
    }

    document.addEventListener('click', function (e) {
        var btn = e.target.closest('.js-qty-plus, .js-qty-minus');
        if (!btn) return;
        
        e.preventDefault();
        
        if (isFetching) return;
        
        var row = btn.closest('.cart-item');
        if (!row) return;
        
        var id = row.getAttribute('data-book-id');
        var action = btn.classList.contains('js-qty-plus') ? 'increment' : 'decrement';
        
        // Disable button visual
        btn.style.opacity = '0.5';
        btn.style.pointerEvents = 'none';

        postCart({ action: action, book_id: id })
            .then(function (data) {
                btn.style.opacity = '1';
                btn.style.pointerEvents = 'auto';

                if (!data.ok && data.error) {
                    alert(data.error);
                    return;
                }
                if (data.count === 0) {
                    window.location.reload();
                    return;
                }
                
                // If the item was decremented to 0, remove row
                var itemStillExists = data.items.some(function(i) { return String(i.book_id) === String(id); });
                if (!itemStillExists && action === 'decrement') {
                    row.remove();
                }
                
                updateDom(data);
            })
            .catch(function (err) {
                btn.style.opacity = '1';
                btn.style.pointerEvents = 'auto';
                if (err !== 'locked') alert('Network error — try again.');
            });
    });

    document.addEventListener('submit', function (e) {
        var form = e.target.closest('.js-cart-remove-form');
        if (!form) return;
        
        e.preventDefault();
        
        if (isFetching) return;

        var id = form.getAttribute('data-book-id');
        postCart({ action: 'remove', book_id: id })
            .then(function (data) {
                if (data.ok && data.count === 0) {
                    window.location.reload();
                    return;
                }
                if (data.ok) {
                    var row = document.querySelector('.cart-item[data-book-id="' + id + '"]');
                    if (row) {
                        row.remove();
                    }
                    updateDom(data);
                }
            })
            .catch(function (err) {
                if (err !== 'locked') form.submit();
            });
    });
})();
