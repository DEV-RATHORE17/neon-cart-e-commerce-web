// app.js - Main Application Logic

// STATE MANAGEMENT
const state = {
    products: [],
    cart: JSON.parse(localStorage.getItem('cart')) || [],
    currentRoute: window.location.hash || '#/',
    filters: {
        category: 'All',
        search: '',
        sort: 'popular'
    }
};

// INITIALIZATION
async function init() {
    await fetchProducts();
    updateCartBadge();
    window.addEventListener('hashchange', () => {
        state.currentRoute = window.location.hash || '#/';
        render();
    });
    render();
}

async function fetchProducts() {
    try {
        const res = await fetch('data/products.json');
        const data = await res.json();
        state.products = data;
    } catch (e) {
        console.error("Could not load products. If loading via file://, use a local server.", e);
        // Fallback for demo without server if it fails (basic mock)
        state.products = [
            { id: 1, name: "Neon Genesis Headphones", price: 299.99, category: "Audio", rating: 4.8, description: "Premium wireless headphones.", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop" },
            { id: 2, name: "Quantum Smartwatch", price: 199.50, category: "Wearables", rating: 4.5, description: "Next-gen smartwatch.", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop" }
        ];
    }
}

// CART FUNCTIONS
function addToCart(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    
    const existing = state.cart.find(c => c.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        state.cart.push({ ...product, quantity: 1 });
    }
    
    saveCart();
    
    // Animate badge
    const badge = document.getElementById('cartBadge');
    if (badge) {
        badge.style.transform = 'scale(1.5)';
        setTimeout(() => badge.style.transform = 'scale(1)', 200);
    }
}

function removeFromCart(productId) {
    state.cart = state.cart.filter(c => c.id !== productId);
    saveCart();
    render(); // Re-render cart page
}

function updateQuantity(productId, delta) {
    const item = state.cart.find(c => c.id === productId);
    if (!item) return;
    
    item.quantity += delta;
    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        saveCart();
        render();
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(state.cart));
    updateCartBadge();
}

function updateCartBadge() {
    const count = state.cart.reduce((total, item) => total + item.quantity, 0);
    const badge = document.getElementById('cartBadge');
    if (badge) badge.textContent = count;
}

// ROUTING & RENDERING
function render() {
    const app = document.getElementById('app');
    let content = '';

    const route = state.currentRoute;
    if (route === '#/' || route === '') {
        content = renderHome();
    } else if (route === '#/products') {
        content = renderProductsPage();
    } else if (route.startsWith('#/product/')) {
        const id = parseInt(route.split('/')[2]);
        content = renderProductDetail(id);
    } else if (route === '#/cart') {
        content = renderCart();
    } else {
        content = `<h2>404 - Page Not Found</h2>`;
    }

    app.innerHTML = renderNavbar() + `<main class="container">${content}</main>` + renderFooter();
    
    // Attach event listeners after rendering
    attachEventListeners();
}

// UI COMPONENTS (Functions returning HTML strings)
function renderNavbar() {
    const currentPath = state.currentRoute.split('/')[1] || '';
    return `
        <header class="navbar-wrapper">
            <nav class="navbar">
                <a href="#/" class="nav-brand">
                    <span style="color: var(--primary);">●</span> NEON CART
                </a>
                <div class="nav-links">
                    <a href="#/" class="${currentPath === '' ? 'active' : ''}">Home</a>
                    <a href="#/products" class="${currentPath === 'products' ? 'active' : ''}">Shop</a>
                    <a href="#/cart" class="cart-link ${currentPath === 'cart' ? 'active' : ''}">
                        Cart <span class="cart-count" id="cartBadge">0</span>
                    </a>
                </div>
            </nav>
        </header>
    `;
}

function renderFooter() {
    return `
        <footer>
            <div class="container">
                <p>&copy; 2026 Neon Cart. Designed for the Future.</p>
            </div>
        </footer>
    `;
}

function renderProductCard(product) {
    return `
        <div class="product-card" onclick="window.location.hash='#/product/${product.id}'">
            <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy">
            <div class="product-info">
                <span class="category-badge">${product.category}</span>
                <h3 class="product-title">${product.name}</h3>
                <div class="product-bottom">
                    <span class="product-price">$${product.price.toFixed(2)}</span>
                    <button class="btn btn-primary add-to-cart-btn" data-id="${product.id}">Add</button>
                </div>
            </div>
        </div>
    `;
}

// PAGES
function renderHome() {
    const featured = state.products.slice(0, 4);
    
    return `
        <section class="hero">
            <div class="hero-content">
                <h1>Elevate Your <span class="text-gradient">Digital Lifestyle</span></h1>
                <p>Discover the latest in next-gen electronics, cyberpunk aesthetics, and sleek wearables curated for the modern minimalist.</p>
                <a href="#/products" class="btn btn-primary" style="padding: 15px 30px; font-size: 1.1rem;">Shop Collection</a>
            </div>
            <div class="hero-image">
                <img src="assets/hero.png" alt="Futuristic Tech">
            </div>
        </section>
        
        <section>
            <div class="section-header">
                <h2>Featured Equipment</h2>
                <a href="#/products" style="color: var(--secondary); text-decoration: none; font-weight: 600;">View All →</a>
            </div>
            <div class="product-grid">
                ${featured.map(renderProductCard).join('')}
            </div>
        </section>
    `;
}

function renderProductsPage() {
    // Apply filters
    let filtered = state.products;
    
    if (state.filters.search) {
        const q = state.filters.search.toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    
    if (state.filters.category && state.filters.category !== 'All') {
        filtered = filtered.filter(p => p.category === state.filters.category);
    }
    
    // Sort
    if (state.filters.sort === 'price-low') filtered.sort((a,b) => a.price - b.price);
    if (state.filters.sort === 'price-high') filtered.sort((a,b) => b.price - a.price);
    if (state.filters.sort === 'rating') filtered.sort((a,b) => b.rating - a.rating);

    const categories = ['All', ...new Set(state.products.map(p => p.category))];

    return `
        <div class="page-layout">
            <aside class="sidebar">
                <h3>Filters</h3>
                <div class="filter-group">
                    <label>Category</label>
                    <select id="catFilter">
                        ${categories.map(c => `<option value="${c}" ${state.filters.category === c ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group">
                    <label>Sort By</label>
                    <select id="sortFilter">
                        <option value="popular" ${state.filters.sort === 'popular' ? 'selected' : ''}>Most Popular</option>
                        <option value="price-low" ${state.filters.sort === 'price-low' ? 'selected' : ''}>Price: Low to High</option>
                        <option value="price-high" ${state.filters.sort === 'price-high' ? 'selected' : ''}>Price: High to Low</option>
                        <option value="rating" ${state.filters.sort === 'rating' ? 'selected' : ''}>Highest Rated</option>
                    </select>
                </div>
            </aside>
            <div class="main-content">
                <div class="search-bar">
                    <input type="text" id="searchInput" placeholder="Search products..." value="${state.filters.search}">
                </div>
                <div class="product-grid">
                    ${filtered.length > 0 ? filtered.map(renderProductCard).join('') : '<p>No products found matching your criteria.</p>'}
                </div>
            </div>
        </div>
    `;
}

function renderProductDetail(id) {
    const product = state.products.find(p => p.id === id);
    if (!product) return '<h2>Product Not Found</h2>';

    return `
        <div class="product-detail-layout">
            <div>
                <img src="${product.image}" alt="${product.name}" class="detail-img">
            </div>
            <div class="detail-info">
                <span class="category-badge">${product.category}</span>
                <h1>${product.name}</h1>
                <div style="display: flex; gap: 15px; margin-bottom: 20px; align-items: center;">
                    <div style="color: #ffb703;">★ ${product.rating}</div>
                    <div style="color: var(--text-muted);">| Free Shipping</div>
                </div>
                <div class="detail-price">$${product.price.toFixed(2)}</div>
                <p class="detail-desc">${product.description}</p>
                
                <div class="add-to-cart-widget">
                    <button class="btn btn-primary" id="detailAddToCartBtn" data-id="${product.id}" style="font-size: 1.2rem; padding: 15px 40px;">
                        Add to Cart
                    </button>
                    <button class="btn btn-outline" onclick="window.location.hash='#/cart'">View Cart</button>
                </div>
                
                <div style="margin-top: 40px; border-top: 1px solid var(--card-border); padding-top: 20px;">
                    <h3 style="margin-bottom: 15px;">Features</h3>
                    <ul style="list-style-position: inside; color: var(--text-muted); line-height: 1.8;">
                        <li>Next generation technology integration</li>
                        <li>Built with sustainable and premium materials</li>
                        <li>1-year zero-questions global warranty</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
}

function renderCart() {
    if (state.cart.length === 0) {
        return `
            <div class="empty-state">
                <h2>Your space is empty.</h2>
                <p style="color: var(--text-muted); margin-bottom: 30px;">Time to fill your cart with digital artifacts.</p>
                <a href="#/products" class="btn btn-primary">Start Exploring</a>
            </div>
        `;
    }

    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    let cartHtml = `
        <div class="cart-layout">
            <div class="cart-items">
                <h2>Your Cart</h2>
    `;
    
    state.cart.forEach(item => {
        cartHtml += `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-img" onclick="window.location.hash='#/product/${item.id}'" style="cursor: pointer;">
                <div class="cart-item-info">
                    <h3 style="margin-bottom: 5px;">${item.name}</h3>
                    <div style="color: var(--secondary); font-weight: 800; margin-bottom: 10px;">$${item.price.toFixed(2)}</div>
                    
                    <div class="qty-controls">
                        <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                        <button class="btn btn-danger" style="margin-left: auto; padding: 5px 10px; font-size: 0.9rem;" onclick="removeFromCart(${item.id})">Remove</button>
                    </div>
                </div>
            </div>
        `;
    });

    cartHtml += `
            </div>
            <div>
                <div class="cart-summary">
                    <h3 style="margin-bottom: 25px;">Order Summary</h3>
                    <div class="summary-row">
                        <span>Subtotal</span>
                        <span>$${subtotal.toFixed(2)}</span>
                    </div>
                    <div class="summary-row">
                        <span>Estimated Tax</span>
                        <span>$${tax.toFixed(2)}</span>
                    </div>
                    <div class="summary-row">
                        <span>Shipping</span>
                        <span>Free</span>
                    </div>
                    
                    <div class="summary-total">
                        <span>Total</span>
                        <span>$${total.toFixed(2)}</span>
                    </div>
                    
                    <button class="btn btn-primary" style="width: 100%; padding: 15px;" onclick="alert('Checkout integration pending!')">Secure Checkout</button>
                </div>
            </div>
        </div>
    `;

    return cartHtml;
}

// EVENT LISTENERS BINDING
function attachEventListeners() {
    // Make quantities globally accessible for inline onclick
    window.updateQuantity = updateQuantity;
    window.removeFromCart = removeFromCart;
    
    // Add to cart buttons
    const addBtns = document.querySelectorAll('.add-to-cart-btn');
    addBtns.forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation(); // prevent card click
            addToCart(parseInt(btn.dataset.id));
        };
    });

    // Add to cart on detail page
    const detailBtn = document.getElementById('detailAddToCartBtn');
    if (detailBtn) {
        detailBtn.onclick = () => {
            addToCart(parseInt(detailBtn.dataset.id));
        };
    }

    // Filters & Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.oninput = (e) => {
            state.filters.search = e.target.value;
            // Debounce or just render on simple apps
            renderProductsPageContentOnly();
        };
    }

    const catFilter = document.getElementById('catFilter');
    if (catFilter) {
        catFilter.onchange = (e) => {
            state.filters.category = e.target.value;
            render();
        };
    }

    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
        sortFilter.onchange = (e) => {
            state.filters.sort = e.target.value;
            render();
        };
    }
    
    updateCartBadge();
}

// Optimization: update just the grid during typing instead of full layout
function renderProductsPageContentOnly() {
    // Apply filters
    let filtered = state.products;
    
    if (state.filters.search) {
        const q = state.filters.search.toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    
    if (state.filters.category && state.filters.category !== 'All') {
        filtered = filtered.filter(p => p.category === state.filters.category);
    }
    
    if (state.filters.sort === 'price-low') filtered.sort((a,b) => a.price - b.price);
    if (state.filters.sort === 'price-high') filtered.sort((a,b) => b.price - a.price);
    if (state.filters.sort === 'rating') filtered.sort((a,b) => b.rating - a.rating);

    const grid = document.querySelector('.main-content .product-grid');
    if (grid) {
        grid.innerHTML = filtered.length > 0 ? filtered.map(renderProductCard).join('') : '<p>No products found matching your criteria.</p>';
        attachEventListeners(); // Re-bind new buttons
    }
}

// START
init();
