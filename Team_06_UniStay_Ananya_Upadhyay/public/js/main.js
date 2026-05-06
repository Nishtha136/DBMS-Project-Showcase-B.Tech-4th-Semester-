// runs once the page is ready — initializes all UI features
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    injectToastContainer();
    injectModalMarkup();
    consumeFlashMessages();
    initTableSearch();
    initConfirmForms();
    initDashboardAnimations();
});

// read saved theme from localStorage and apply it; wire up any toggle buttons
function initTheme() {
    const savedTheme = localStorage.getItem('unistay-theme') || 'light';
    applyTheme(savedTheme);

    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
        updateThemeButtonLabel(btn, savedTheme);
        btn.addEventListener('click', () => {
            const current = document.body.classList.contains('theme-dark') ? 'dark' : 'light';
            const next = current === 'dark' ? 'light' : 'dark';
            applyTheme(next);
            localStorage.setItem('unistay-theme', next);  // remember preference for next visit
            document.querySelectorAll('[data-theme-toggle]').forEach((toggle) => {
                updateThemeButtonLabel(toggle, next);
            });
        });
    });
}

// add or remove the dark class on the body
function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('theme-dark');
    } else {
        document.body.classList.remove('theme-dark');
    }
}

// swap the icon inside the toggle button to match the current theme
function updateThemeButtonLabel(btn, theme) {
    btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    btn.innerHTML = theme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
}

// create the toast container div and attach it to the body once
function injectToastContainer() {
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
}

// build the modal HTML once and inject it at the bottom of the body
// it stays hidden until showModal() is called
function injectModalMarkup() {
    const modalMarkup = `
        <div class="modal-backdrop" id="custom-modal">
            <div class="modal-content">
                <div class="modal-icon" id="modal-icon">?</div>
                <h3 class="modal-title" id="modal-title">Confirm Action</h3>
                <p class="modal-desc" id="modal-desc">Are you sure you want to proceed?</p>
                <div class="modal-actions">
                    <button class="btn btn-outline" id="modal-cancel">Cancel</button>
                    <button class="btn btn-primary" id="modal-confirm">Confirm</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalMarkup);
}

// check if the URL has ?error= or ?success= params (set by server after a redirect)
// show them as toasts, then clean the URL so refreshing doesn't re-trigger them
function consumeFlashMessages() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('error')) {
        showToast(urlParams.get('error'), 'error');
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (urlParams.has('success')) {
        showToast(urlParams.get('success'), 'success');
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// filter table rows as the user types in any .search-input field
function initTableSearch() {
    const searchInputs = document.querySelectorAll('.search-input');
    searchInputs.forEach((input) => {
        input.addEventListener('input', function () {
            const searchTerm = this.value.toLowerCase();
            const section = this.closest('.section-card');
            const table = section ? section.querySelector('.data-table') : null;
            if (!table) return;

            // hide rows that don't match, show the ones that do
            const rows = table.querySelectorAll('tbody tr');
            rows.forEach((row) => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    });
}

// intercept any form with class confirm-action and show a modal before submitting
// prevents accidental approvals or rejections
function initConfirmForms() {
    const confirmForms = document.querySelectorAll('form.confirm-action');
    confirmForms.forEach((form) => {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const title = this.dataset.title || 'Confirm Action';
            const desc = this.dataset.desc || 'Are you sure you want to proceed?';
            const type = this.dataset.type || 'primary';

            showModal(title, desc, type, () => {
                this.submit();  // only submit if user clicked Confirm in the modal
            });
        });
    });
}

// animate dashboard cards in as they scroll into view
function initDashboardAnimations() {
    const animatedBlocks = document.querySelectorAll('.stat-card, .section-card, .allocation-banner');
    if (!animatedBlocks.length) return;

    // stagger the delay so cards don't all appear at once
    animatedBlocks.forEach((el, i) => {
        el.classList.add('ui-reveal');
        el.style.transitionDelay = `${Math.min(i * 0.06, 0.4)}s`;
    });

    // use IntersectionObserver to trigger animation only when element enters the viewport
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.12 });

    animatedBlocks.forEach((el) => observer.observe(el));
}

// show a small toast notification at the bottom of the screen
window.showToast = function (message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span style="font-size: 1.2rem;">${type === 'success' ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-triangle-exclamation"></i>'}</span>
        <span>${message}</span>
    `;
    container.appendChild(toast);

    // start the fade-out after 3 seconds, then remove the element after the animation
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// show the confirmation modal with a custom title, description, and action type
window.showModal = function (title, desc, type, onConfirm) {
    const modal = document.getElementById('custom-modal');
    const titleEl = document.getElementById('modal-title');
    const descEl = document.getElementById('modal-desc');
    const iconEl = document.getElementById('modal-icon');
    const confirmBtn = document.getElementById('modal-confirm');
    const cancelBtn = document.getElementById('modal-cancel');

    titleEl.textContent = title;
    descEl.textContent = desc;

    // use red styling for destructive actions (reject/delete), blue for normal confirmations
    if (type === 'danger') {
        iconEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
        iconEl.style.color = 'var(--danger)';
        iconEl.style.background = '#fee2e2';
        confirmBtn.className = 'btn btn-danger';
    } else {
        iconEl.innerHTML = '<i class="fa-solid fa-check"></i>';
        iconEl.style.color = 'var(--primary)';
        iconEl.style.background = '#e8eef5';
        confirmBtn.className = 'btn btn-primary';
    }

    modal.classList.add('active');

    // clean up event listeners after the modal closes to avoid stacking handlers
    const cleanup = () => {
        modal.classList.remove('active');
        confirmBtn.onclick = null;
        cancelBtn.onclick = null;
    };

    cancelBtn.onclick = cleanup;
    confirmBtn.onclick = () => {
        cleanup();
        onConfirm();  // run the original form submit
    };
}
