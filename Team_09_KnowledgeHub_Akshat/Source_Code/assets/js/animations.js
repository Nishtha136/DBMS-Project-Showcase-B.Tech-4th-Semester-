/**
 * UI Microinteractions and Animations
 */
document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Add to Cart Microinteraction ---
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        // Find if this is an add to cart form
        const btn = form.querySelector('button[name="add_to_cart"], button[name="add_book"]');
        if (btn) {
            btn.classList.add('btn-anim-scale');
            form.addEventListener('submit', (e) => {
                // Prevent immediate submission to show animation
                e.preventDefault();
                
                // Store original text and width to prevent jitter
                const origText = btn.innerHTML;
                const origWidth = btn.offsetWidth;
                btn.style.width = origWidth + 'px';
                
                // Animate
                btn.classList.add('is-adding');
                btn.innerHTML = '<span style="display:flex;align-items:center;justify-content:center;gap:6px;"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"></path></svg> Added!</span>';
                
                // Submit after delay
                setTimeout(() => {
                    // Create hidden input since we prevented default button click
                    const hiddenInput = document.createElement('input');
                    hiddenInput.type = 'hidden';
                    hiddenInput.name = btn.name;
                    hiddenInput.value = btn.value;
                    form.appendChild(hiddenInput);
                    form.submit();
                }, 600);
            });
        }
    });

    // --- 2. Credit Card Input Formatting (Visual Only) ---
    const ccInput = document.getElementById('cc-number');
    const ccPreview = document.getElementById('preview-cc-number');
    if (ccInput) {
        ccInput.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, '');
            let formatted = val.match(/.{1,4}/g)?.join(' ') || '';
            e.target.value = formatted.substring(0, 19);
            
            if (ccPreview) {
                ccPreview.textContent = formatted || '•••• •••• •••• ••••';
            }
        });
    }

    const expInput = document.getElementById('cc-exp');
    const expPreview = document.getElementById('preview-cc-exp');
    if (expInput) {
        expInput.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, '');
            if (val.length > 2) {
                val = val.substring(0,2) + ' / ' + val.substring(2,4);
            }
            e.target.value = val;
            
            if (expPreview) {
                expPreview.textContent = val || 'MM/YY';
            }
        });
    }

    const nameInput = document.getElementById('cc-name');
    const namePreview = document.getElementById('preview-cc-name');
    if (nameInput) {
        nameInput.addEventListener('input', (e) => {
            if (namePreview) {
                namePreview.textContent = e.target.value || 'YOUR NAME';
            }
        });
    }
});
