const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSUKca-fK-EsVZ08iJTAF5y7FtgAepc-S2HYRb6lBvwyxota4hGa-YXSdTNQ9M8Km_X4EVXjuPEHCr1/pub?output=csv";

// ===== Portfolio Data Cache =====
let portfolioCache = null;

// ===== Mobile Menu Toggle =====
function toggleMenu() {
    const navLinks = document.getElementById('navLinks');
    if (navLinks) {
        navLinks.classList.toggle('active');
    }
}

// ===== Proper CSV Parser (handles quoted fields with commas) =====
function parseCSV(text) {
    const rows = [];
    let current = '';
    let inQuotes = false;
    const chars = text.trim();

    const currentRow = [];
    for (let i = 0; i < chars.length; i++) {
        const ch = chars[i];
        if (inQuotes) {
            if (ch === '"' && chars[i + 1] === '"') {
                current += '"';
                i++;
            } else if (ch === '"') {
                inQuotes = false;
            } else {
                current += ch;
            }
        } else {
            if (ch === '"') {
                inQuotes = true;
            } else if (ch === ',') {
                currentRow.push(current.trim());
                current = '';
            } else if (ch === '\n' || (ch === '\r' && chars[i + 1] === '\n')) {
                currentRow.push(current.trim());
                rows.push([...currentRow]);
                currentRow.length = 0;
                current = '';
                if (ch === '\r') i++;
            } else {
                current += ch;
            }
        }
    }
    // Push last field / row
    if (current || currentRow.length > 0) {
        currentRow.push(current.trim());
        rows.push(currentRow);
    }
    return rows;
}

// ===== XSS Sanitization =====
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ===== Google Sheets Fetching Logic =====
async function fetchPortfolio() {
    // Return cache if available
    if (portfolioCache) return portfolioCache;

    try {
        const response = await fetch(GOOGLE_SHEET_URL);
        const csvText = await response.text();
        const rows = parseCSV(csvText);

        if (rows.length === 0) return [];

        const headers = rows[0].map(h => h.replace(/^"|"$/g, '').trim());
        const items = [];

        for (let i = 1; i < rows.length; i++) {
            const values = rows[i];
            const item = {};
            headers.forEach((header, index) => {
                item[header] = values[index] ? values[index].replace(/^"|"$/g, '').trim() : '';
            });
            if (item.title && item.image) {
                items.push(item);
            }
        }
        portfolioCache = items;
        return items;
    } catch (error) {
        console.error('Error loading portfolio:', error);
        return [];
    }
}

// ===== Loading Skeleton =====
function renderSkeletons(container, count = 3) {
    container.innerHTML = Array.from({ length: count }, () => `
        <div class="skeleton-card">
            <div class="skeleton-img"></div>
            <div class="skeleton-text">
                <div class="skeleton-line"></div>
                <div class="skeleton-line"></div>
            </div>
        </div>
    `).join('');
}

// ===== Render Featured Grid (Index Page) =====
async function renderFeatured() {
    const grid = document.getElementById('featuredGrid');
    if (!grid) return;

    renderSkeletons(grid, 3);

    const items = await fetchPortfolio();
    const featured = items.slice(0, 3);

    if (featured.length === 0) {
        grid.innerHTML = '<div class="loading">Connect your Google Sheet to display items.</div>';
        return;
    }

    grid.innerHTML = featured.map((item, i) => `
        <div class="portfolio-card animate-on-scroll delay-${i + 1}" data-img="${escapeHTML(item.image)}">
            <div class="portfolio-img-wrap">
                <img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.title)}" class="portfolio-img" loading="lazy"
                     onerror="this.src='https://placehold.co/600x400/141419/71717a?text=Image+Not+Found'">
            </div>
            <div class="portfolio-overlay">
                <span class="p-category">${escapeHTML(item.categoryDisplay || item.category)}</span>
                <h3 class="p-title">${escapeHTML(item.title)}</h3>
                <p class="p-desc">${escapeHTML(item.description)}</p>
            </div>
        </div>
    `).join('');

    // Re-observe new elements for scroll animation
    grid.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
}

// ===== Render Full Portfolio Grid (Portfolio Page) =====
async function renderPortfolio(filter = 'all') {
    const grid = document.getElementById('portfolioGrid');
    if (!grid) return;

    renderSkeletons(grid, 6);

    const allItems = await fetchPortfolio();
    const filtered = filter === 'all' ? allItems : allItems.filter(item => item.category === filter);

    if (filtered.length === 0) {
        grid.innerHTML = '<div class="loading">No portfolio items found.</div>';
        return;
    }

    grid.innerHTML = filtered.map(item => `
        <div class="portfolio-card animate-on-scroll" data-category="${escapeHTML(item.category)}" data-img="${escapeHTML(item.image)}">
            <div class="portfolio-img-wrap">
                <img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.title)}" class="portfolio-img" loading="lazy"
                     onerror="this.src='https://placehold.co/600x400/141419/71717a?text=Image+Not+Found'">
            </div>
            <div class="portfolio-overlay">
                <span class="p-category">${escapeHTML(item.categoryDisplay || item.category)}</span>
                <h3 class="p-title">${escapeHTML(item.title)}</h3>
                <p class="p-desc">${escapeHTML(item.description)}</p>
            </div>
        </div>
    `).join('');

    // Re-observe new elements for scroll animation
    grid.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
}

// ===== Filter Portfolio Buttons =====
function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    if (filterBtns.length === 0) return;

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderPortfolio(btn.getAttribute('data-filter'));
        });
    });
}

// ===== Lightbox Modal (Event Delegation — no duplicate listeners) =====
function initLightbox() {
    const modal = document.getElementById('lightboxModal');
    const modalImg = document.getElementById('modalImage');
    const closeBtn = modal ? modal.querySelector('.modal-close') : null;

    if (!modal || !modalImg) return;

    // Use event delegation on document for portfolio cards
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.portfolio-card');
        if (card) {
            const img = card.querySelector('.portfolio-img');
            if (img) {
                modalImg.src = img.src;
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        }
    });

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
}

// ===== Scroll Animations (Intersection Observer) =====
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// ===== Animated Stat Counters =====
function animateCounters() {
    const statItems = document.querySelectorAll('.stat-item h3');
    statItems.forEach(el => {
        const text = el.textContent.trim();
        const match = text.match(/^(\d+)(.*)$/);
        if (!match) return;

        const target = parseInt(match[1]);
        const suffix = match[2]; // e.g. '%', '+'
        el.textContent = '0' + suffix;

        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    let current = 0;
                    const duration = 1500;
                    const step = target / (duration / 16);

                    const timer = setInterval(() => {
                        current += step;
                        if (current >= target) {
                            current = target;
                            clearInterval(timer);
                        }
                        el.textContent = Math.floor(current) + suffix;
                    }, 16);

                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counterObserver.observe(el);
    });
}

// ===== Scroll-to-Top Button =====
function initScrollTop() {
    const btn = document.getElementById('scrollTopBtn');
    if (!btn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    }, { passive: true });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ===== Navbar Scroll Effect =====
function initNavScroll() {
    const navInner = document.querySelector('.nav-inner');
    if (!navInner) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 60) {
            navInner.classList.add('scrolled');
        } else {
            navInner.classList.remove('scrolled');
        }
    }, { passive: true });
}

// ===== Close mobile menu on outside click =====
function initMobileMenuClose() {
    document.addEventListener('click', (e) => {
        const navLinks = document.getElementById('navLinks');
        const menuBtn = document.querySelector('.mobile-menu-btn');
        if (!navLinks || !menuBtn) return;

        if (!navLinks.contains(e.target) && !menuBtn.contains(e.target)) {
            navLinks.classList.remove('active');
        }
    });
}

// ===== Button Ripple Effect =====
function initRippleEffect() {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn');
        if (!btn) return;

        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
        btn.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
    });
}

// ===== Single DOMContentLoaded — All Initialization =====
document.addEventListener('DOMContentLoaded', () => {
    // Page entrance animation
    document.body.classList.add('page-loaded');

    // Observe all animate-on-scroll elements
    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

    // Close mobile menu on nav link click
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            const navLinks = document.getElementById('navLinks');
            if (navLinks) navLinks.classList.remove('active');
        });
    });

    // Initialize all features
    renderFeatured();
    renderPortfolio();
    setupFilters();
    initLightbox();
    animateCounters();
    initScrollTop();
    initNavScroll();
    initMobileMenuClose();
    initRippleEffect();
});
