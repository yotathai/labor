let laborData = [];
let cart = [];

// DOM Elements
const searchInput = document.getElementById('searchInput');
const tableBody = document.getElementById('tableBody');
const noResults = document.getElementById('noResults');
const cartToggle = document.getElementById('cartToggle');
const cartPanel = document.getElementById('cartPanel');
const closeCart = document.getElementById('closeCart');
const overlay = document.getElementById('overlay');
const cartCount = document.getElementById('cartCount');
const cartTableBody = document.getElementById('cartTableBody');
const cartTotal = document.getElementById('cartTotal');
const exportBtn = document.getElementById('exportBtn');

// Load Data
async function loadData() {
    try {
        const response = await fetch('labor_data.json');
        laborData = await response.json();
        renderTable(laborData);
    } catch (error) {
        console.error('Error loading data:', error);
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:red;">ไม่สามารถโหลดข้อมูลได้ โปรดตรวจสอบไฟล์ labor_data.json</td></tr>';
    }
}

// Render Table
function renderTable(data) {
    tableBody.innerHTML = '';
    
    if (data.length === 0) {
        noResults.classList.remove('hidden');
        return;
    }
    
    noResults.classList.add('hidden');
    
    // Limit to first 100 items for performance unless searched specifically
    const displayData = data.slice(0, 150);
    
    displayData.forEach((item, index) => {
        const tr = document.createElement('tr');
        
        // Format price
        const priceStr = item.price.toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        
        tr.innerHTML = `
            <td>${item.id || '-'}</td>
            <td>
                <div style="font-weight: 500;">${item.name}</div>
                <div style="font-size: 12px; color: var(--text-secondary);">${item.category} ${item.subcategory ? '> '+item.subcategory : ''}</div>
            </td>
            <td>${item.unit}</td>
            <td style="color: var(--primary-color); font-weight: 600;">${priceStr}</td>
            <td style="font-size: 12px;">${item.note || '-'}</td>
            <td>
                <button class="btn-add" onclick="addToCart(${index}, '${escapeQuotes(item.name)}', ${item.price}, '${item.unit}')">+ เลือก</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function escapeQuotes(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// Search
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        renderTable(laborData);
        return;
    }
    
    const filteredData = laborData.filter(item => {
        return (item.name && item.name.toLowerCase().includes(searchTerm)) ||
               (item.category && item.category.toLowerCase().includes(searchTerm)) ||
               (item.subcategory && item.subcategory.toLowerCase().includes(searchTerm)) ||
               (item.id && item.id.toLowerCase().includes(searchTerm));
    });
    
    renderTable(filteredData);
});

// Cart Functions
window.addToCart = function(index, name, price, unit) {
    // Check if already in cart
    const existing = cart.find(item => item.name === name);
    if (!existing) {
        cart.push({
            name: name,
            price: price,
            unit: unit,
            qty: 1
        });
        updateCartUI();
        
        // Visual feedback
        cartToggle.style.transform = 'scale(1.1)';
        setTimeout(() => {
            cartToggle.style.transform = 'scale(1)';
        }, 200);
    }
};

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    updateCartUI();
};

window.updateQty = function(index, newQty) {
    const qty = parseFloat(newQty);
    if (!isNaN(qty) && qty >= 0) {
        cart[index].qty = qty;
        updateCartUI();
    }
};

function updateCartUI() {
    cartCount.textContent = cart.length;
    cartTableBody.innerHTML = '';
    
    let total = 0;
    
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div style="font-weight: 500; font-size: 14px;">${item.name}</div>
                <div style="font-size: 12px; color: var(--text-secondary);">@ ${item.price.toLocaleString('th-TH', {minimumFractionDigits: 2})} บาท/${item.unit}</div>
            </td>
            <td>
                <input type="number" class="qty-input" value="${item.qty}" min="0" step="any" onchange="updateQty(${index}, this.value)">
            </td>
            <td>${item.unit}</td>
            <td style="font-weight: 600;">${itemTotal.toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
            <td>
                <button class="btn-remove" onclick="removeFromCart(${index})">×</button>
            </td>
        `;
        cartTableBody.appendChild(tr);
    });
    
    cartTotal.textContent = total.toLocaleString('th-TH', {minimumFractionDigits: 2}) + ' บาท';
}

// UI Interactions
function openCart() {
    cartPanel.classList.add('open');
    overlay.classList.add('show');
}

function closeCartPanel() {
    cartPanel.classList.remove('open');
    overlay.classList.remove('show');
}

cartToggle.addEventListener('click', openCart);
closeCart.addEventListener('click', closeCartPanel);
overlay.addEventListener('click', closeCartPanel);

exportBtn.addEventListener('click', () => {
    window.print();
});

// Initialize
loadData();
