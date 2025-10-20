// Year
document.getElementById('yr').textContent = new Date().getFullYear();

// Global state
let currentPage = 'home';
let currentCategory = null;
let currentProduct = null;
let appData = null;

// Elements
const categoriesGrid = document.getElementById('categoriesGrid');
const categoryProductsGrid = document.getElementById('categoryProductsGrid');
const breadcrumbs = document.getElementById('breadcrumbs');
const breadcrumbCurrent = document.getElementById('breadcrumb-current');
const modal = document.getElementById('galleryModal');
const mslider = document.getElementById('mslider');
const thumbs = document.getElementById('thumbs');
const modalTitle = document.getElementById('modalTitle');
const closeModal = document.getElementById('closeModal');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const autoBtn = document.getElementById('autoBtn');

// Modal state
let currentIndex = 0;
let currentImages = [];
let autoTimer = null;
let autoPlay = false;

// Page elements
const pages = {
  home: document.getElementById('home-page'),
  category: document.getElementById('category-page'),
  product: document.getElementById('product-page')
};

// Load data and initialize app
async function loadData() {
  try {
    const res = await fetch('assets/data/products.json', { cache: 'no-store' });
    appData = await res.json();
    initializeApp();
  } catch (e) {
    console.error('Failed to load products.json', e);
  }
}

function initializeApp() {
  setupNavigation();
  renderCategories();
  setupCardObservers();
  setupModalHandlers();
}

// Navigation system
function setupNavigation() {
  // Navigation links
  document.querySelectorAll('nav a[data-page]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = e.target.dataset.page;
      navigateTo(page);
    });
  });

  // Breadcrumb navigation
  breadcrumbs.addEventListener('click', (e) => {
    if (e.target.dataset.page) {
      e.preventDefault();
      navigateTo(e.target.dataset.page);
    }
  });
}

function navigateTo(page, categoryId = null, productId = null) {
  // Hide all pages
  Object.values(pages).forEach(pageEl => {
    pageEl.classList.remove('active');
  });

  // Show breadcrumbs for non-home pages
  if (page !== 'home') {
    breadcrumbs.style.display = 'block';
  } else {
    breadcrumbs.style.display = 'none';
  }

  // Navigate to specific page
  switch (page) {
    case 'home':
      currentPage = 'home';
      currentCategory = null;
      currentProduct = null;
      pages.home.classList.add('active');
      breadcrumbCurrent.textContent = 'Home';
      renderCategories();
      break;

    case 'category':
      if (!categoryId) return;
      currentPage = 'category';
      currentCategory = categoryId;
      currentProduct = null;
      pages.category.classList.add('active');
      breadcrumbCurrent.textContent = appData.categories[categoryId].title;
      renderCategoryProducts(categoryId);
      break;

    case 'product':
      if (!productId || !currentCategory) return;
      currentPage = 'product';
      currentProduct = productId;
      pages.product.classList.add('active');
      breadcrumbCurrent.textContent = appData.categories[currentCategory].products[productId].title;
      renderProductDetail(currentCategory, productId);
      break;
  }

  // Update URL without page reload
  const url = page === 'home' ? '#' : `#/${page}${categoryId ? `/${categoryId}` : ''}${productId ? `/${productId}` : ''}`;
  window.history.pushState({ page, categoryId, productId }, '', url);
}

// Handle browser back/forward buttons
window.addEventListener('popstate', (e) => {
  const state = e.state || { page: 'home' };
  navigateTo(state.page, state.categoryId, state.productId);
});

// Render categories on home page
function renderCategories() {
  if (!categoriesGrid || !appData) return;
  
  categoriesGrid.innerHTML = Object.values(appData.categories).map(category => {
    const tagHtml = category.tag ? `<span class="tag">${category.tag}</span>` : '';
    const floatAttr = category.float ? ' data-float="y"' : '';
    const imgSrc = category.cardImage || 'https://via.placeholder.com/400x300?text=Category';
    
    return `
      <div class="card category-card" data-category-id="${category.id}"${floatAttr}>
        ${tagHtml}
        <div class="imgwrap">
          <img src="${imgSrc}" alt="${escapeHtml(category.title)}">
        </div>
        <h3>${escapeHtml(category.title)}</h3>
        <p>${escapeHtml(category.description)}</p>
      </div>
    `;
  }).join('');

  // Attach click handlers
  document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      const categoryId = card.dataset.categoryId;
      window.location.href = `subcategory.html?category=${categoryId}`;
    });
  });

  setupCardObservers();
}

// Render products in a category
function renderCategoryProducts(categoryId) {
  if (!categoryProductsGrid || !appData) return;
  
  const category = appData.categories[categoryId];
  if (!category) return;

  document.getElementById('category-title').textContent = category.title;
  
  categoryProductsGrid.innerHTML = Object.values(category.products).map(product => {
    const tagHtml = product.tag ? `<span class="tag">${product.tag}</span>` : '';
    const floatAttr = product.float ? ' data-float="y"' : '';
    const imgSrc = product.cardImage || (product.images && product.images[0]) || 'https://via.placeholder.com/400x300?text=Product';
    
    return `
      <div class="card product-card" data-product-id="${product.id}"${floatAttr}>
        ${tagHtml}
        <div class="imgwrap">
          <img src="${imgSrc}" alt="${escapeHtml(product.title)}">
        </div>
        <h3>${escapeHtml(product.title)}</h3>
        <p>${escapeHtml(product.description)}</p>
      </div>
    `;
  }).join('');

  // Attach click handlers
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', () => {
      const productId = card.dataset.productId;
      window.location.href = `product.html?category=${categoryId}&product=${productId}`;
    });
  });

  setupCardObservers();
}

// Render product detail page
function renderProductDetail(categoryId, productId) {
  const product = appData.categories[categoryId].products[productId];
  if (!product) return;

  // Update product info
  document.getElementById('product-title').textContent = product.title;
  document.getElementById('product-price').textContent = product.price;
  document.getElementById('product-description').textContent = product.description;

  // Update main image
  const mainImage = document.getElementById('product-main-image');
  mainImage.src = product.images[0] || 'https://via.placeholder.com/600x600?text=Product+Image';
  mainImage.alt = product.title;

  // Update thumbnails
  const thumbnails = document.getElementById('product-thumbnails');
  thumbnails.innerHTML = product.images.map((src, index) => `
    <img src="${src}" alt="${product.title} ${index + 1}" 
         onclick="changeMainImage('${src}')" 
         class="thumbnail ${index === 0 ? 'active' : ''}">
  `).join('');

  // Update sizes
  const sizeButtons = document.getElementById('size-buttons');
  sizeButtons.innerHTML = product.sizes.map(size => `
    <button class="size-btn" onclick="selectSize('${size}')">${size}</button>
  `).join('');

  // Update colors
  const colorButtons = document.getElementById('color-buttons');
  colorButtons.innerHTML = product.colors.map(color => `
    <button class="color-btn" style="background-color: ${getColorValue(color)}" 
            onclick="selectColor('${color}')" title="${color}"></button>
  `).join('');

  // Update features
  const featuresList = document.getElementById('product-features-list');
  featuresList.innerHTML = product.features.map(feature => `
    <li style="color:var(--muted);margin-bottom:4px;">• ${escapeHtml(feature)}</li>
  `).join('');
}

// Product detail helpers
function changeMainImage(src) {
  document.getElementById('product-main-image').src = src;
  document.querySelectorAll('.thumbnail').forEach(thumb => thumb.classList.remove('active'));
  event.target.classList.add('active');
}

function selectSize(size) {
  document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('selected'));
  event.target.classList.add('selected');
}

function selectColor(color) {
  document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('selected'));
  event.target.classList.add('selected');
}

function getColorValue(color) {
  const colorMap = {
    'White': '#ffffff',
    'Black': '#000000',
    'Navy': '#001f3f',
    'Red': '#ff0000',
    'Gray': '#808080',
    'Green': '#008000',
    'Khaki': '#f0e68c',
    'Beige': '#f5f5dc',
    'Light Blue': '#add8e6'
  };
  return colorMap[color] || '#cccccc';
}

// Modal system (for image gallery)
function setupModalHandlers() {
  // Modal controls
  prevBtn.addEventListener('click', () => {
    const toShow = document.querySelectorAll('.mslide');
    if (!toShow.length) return;
    gotoSlide((currentIndex - 1 + toShow.length) % toShow.length);
  });

  nextBtn.addEventListener('click', () => {
    const toShow = document.querySelectorAll('.mslide');
    if (!toShow.length) return;
    gotoSlide((currentIndex + 1) % toShow.length);
  });

  autoBtn.addEventListener('click', () => {
    autoPlay = !autoPlay;
    autoBtn.textContent = autoPlay ? 'Stop ⏸' : 'Auto ▶';
    if (autoPlay) {
      autoTimer = setInterval(() => { nextBtn.click(); }, 2200);
    } else {
      clearInterval(autoTimer);
    }
  });

  closeModal.addEventListener('click', closeModalHandler);

  // Close modal on outside click or ESC
  modal.addEventListener('click', (e) => { 
    if (e.target === modal) closeModalHandler(); 
  });
  
  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') closeModalHandler();
    if (e.key === 'ArrowLeft') prevBtn.click();
    if (e.key === 'ArrowRight') nextBtn.click();
  });
}

function openModal(title, images) {
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
  modalTitle.textContent = title;

  // Clear
  mslider.innerHTML = '';
  thumbs.innerHTML = '';

  // Add slides and thumbs
  images.forEach((src, index) => {
    const slide = document.createElement('div');
    slide.className = `mslide ${index === 0 ? 'active' : ''}`;
    slide.innerHTML = `<img src="${src}" alt="${title} image ${index + 1}">`;
    mslider.appendChild(slide);

    const thumb = document.createElement('img');
    thumb.src = src;
    thumb.alt = `${title} thumb ${index + 1}`;
    thumb.className = `quick-in ${index === 0 ? 'sel' : ''}`;
    thumb.onclick = () => gotoSlide(index);
    thumbs.appendChild(thumb);
  });

  currentIndex = 0;
  autoPlay = false;
  autoBtn.textContent = 'Auto ▶';
  clearInterval(autoTimer);
}

function gotoSlide(i) {
  const slides = document.querySelectorAll('.mslide');
  const timgs = document.querySelectorAll('.thumbs img');
  if (slides.length === 0) return;
  slides.forEach((s, idx) => s.classList.toggle('active', idx === i));
  timgs.forEach((t, idx) => t.classList.toggle('sel', idx === i));
  currentIndex = i;
}

function closeModalHandler() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
  autoPlay = false;
  clearInterval(autoTimer);
  autoBtn.textContent = 'Auto ▶';
}

// Card animations
function setupCardObservers(){
  const cards = document.querySelectorAll('.card');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, {threshold: 0.12});
  cards.forEach(c => io.observe(c));
}

function escapeHtml(str){
  return String(str).replace(/[&<>"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]));
}

// Add click handler to product images for modal gallery
document.addEventListener('click', (e) => {
  if (e.target.matches('.main-image img, .thumbnail')) {
    const product = appData.categories[currentCategory].products[currentProduct];
    if (product && product.images) {
      openModal(product.title, product.images);
    }
  }
});

// Theme management
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

// Cart functionality
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartCountElement = document.getElementById('cartCount');
  if (cartCountElement) {
    cartCountElement.textContent = totalItems;
  }
}

function viewCart() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  if (cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }
  
  let message = 'Hi! Here are the items in my cart:\n\n';
  cart.forEach((item, index) => {
    message += `${index + 1}. ${item.title}\n   Size: ${item.size}\n   Color: ${item.color}\n   Quantity: ${item.quantity}\n\n`;
  });
  message += 'Please provide pricing and proceed with the order.';
  
  const whatsappUrl = `https://wa.me/923291430316?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
}

// Initialize theme and app
initializeTheme();
updateCartCount();
loadData();