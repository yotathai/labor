let laborData = [];
let cart = [];

// Semantic Synonyms Mapping
const synonyms = {
    "เทปูน": "เทคอนกรีต",
    "ก่อกำแพง": "ก่ออิฐ",
    "ตีผัง": "ผัง",
    "ทำหลังคา": "กระเบื้อง โครงเหล็ก",
    "ทาสี": "สีน้ำ สีน้ำมัน ทารองพื้น",
    "ฐานราก": "ขุดดิน ถมดิน ทรายรองพื้น คอนกรีตหยาบ ไม้แบบ",
    "เข็ม": "เสาเข็ม ตัดหัวเสาเข็ม",
    "ฉาบปูน": "ฉาบเรียบ",
    "ประปา": "ท่อพีวีซี ก๊อกน้ำ",
    "กระเบื้อง": "ปูพื้น ปูผนัง"
};

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
        // Dynamic API Path: รองรับการเปิดผ่าน Gateway (President_Core) ที่ app.yotathai.com/labor/
        const basePath = window.location.pathname.includes('/labor') ? '/labor/' : './';
        const response = await fetch(basePath + 'labor_data.json');
        laborData = await response.json();
        renderTable(laborData);
    } catch (error) {
        console.error('Error loading data:', error);
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:red;">ไม่สามารถโหลดข้อมูลได้</td></tr>';
    }
}

function checkSmartGuards(item) {
    let guardsHtml = '';
    const name = item.name || '';
    const unit = item.unit || '';
    
    // Unit Guards
    if (unit === 'ลบ.ม.' || unit === 'ตร.ม.') {
        guardsHtml += `<span class="badge info" title="ระวังการคำนวณหน่วยผิดพลาด">🔍 เช็คหน่วย ${unit}</span>`;
    }
    
    // Logic Guards
    if (name.includes('ไม้แบบ')) {
        guardsHtml += `<span class="badge danger" title="ค่าแรงไม้แบบคิดเต็ม 100% เสมอ ไม่มีการลดทอนตามจำนวนชั้นเหมือนค่าวัสดุ">⚠️ ห้ามลดทอนค่าแรงตามชั้น</span>`;
    }
    
    if (name.includes('ขุดดิน')) {
        guardsHtml += `<span class="badge warning" title="อย่าลืมคิดเผื่องานถมดินคืนและค่าขนทิ้ง">💡 อย่าลืม: งานถมดินคืน</span>`;
    }

    if (name.includes('ทาสี') && !name.includes('รองพื้น')) {
        guardsHtml += `<span class="badge warning" title="อย่าลืมคิดค่าแรงทาสีรองพื้น">💡 อย่าลืม: ทาสีรองพื้น</span>`;
    }

    return guardsHtml;
}

// Render Table
function renderTable(data) {
    tableBody.innerHTML = '';
    if (data.length === 0) {
        noResults.classList.remove('hidden');
        return;
    }
    noResults.classList.add('hidden');
    
    const displayData = data.slice(0, 150);
    
    displayData.forEach((item, index) => {
        const tr = document.createElement('tr');
        const priceStr = item.price.toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        const guards = checkSmartGuards(item);
        
        tr.innerHTML = `
            <td>${item.id || '-'}</td>
            <td>
                <div style="font-weight: 500;">${item.name}</div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">${item.category} ${item.subcategory ? '> '+item.subcategory : ''}</div>
                <div>${guards}</div>
            </td>
            <td>${item.unit}</td>
            <td style="color: var(--primary-color); font-weight: 600;">${priceStr}</td>
            <td style="font-size: 12px;">${item.note || '-'}</td>
            <td>
                <button class="btn-add" onclick="addToCart('${escapeQuotes(item.id)}', '${escapeQuotes(item.name)}', ${item.price}, '${item.unit}')">+ เลือก</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function escapeQuotes(str) {
    if(!str) return '';
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// Search
searchInput.addEventListener('input', (e) => {
    let searchTerm = e.target.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        renderTable(laborData);
        return;
    }
    
    // Expand search term using synonyms
    let searchTokens = [searchTerm];
    for (const [key, value] of Object.entries(synonyms)) {
        if (key.includes(searchTerm) || searchTerm.includes(key)) {
            searchTokens = searchTokens.concat(value.split(' '));
        }
    }
    
    const filteredData = laborData.filter(item => {
        const textToSearch = ((item.name||'') + ' ' + (item.category||'') + ' ' + (item.subcategory||'') + ' ' + (item.id||'')).toLowerCase();
        // Return true if any of the search tokens are found
        return searchTokens.some(token => textToSearch.includes(token));
    });
    
    renderTable(filteredData);
});

// Cart Functions
window.addToCart = function(id, name, price, unit) {
    const existing = cart.find(item => item.name === name);
    if (!existing) {
        cart.push({ id, name, price, unit, qty: 1 });
        updateCartUI();
        cartToggle.style.transform = 'scale(1.1)';
        setTimeout(() => cartToggle.style.transform = 'scale(1)', 200);
        checkSmartRecommendations();
    }
};

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    updateCartUI();
    checkSmartRecommendations();
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

function checkSmartRecommendations() {
    // Basic smart checklist: if they have X but not Y, suggest Y
    let recommendations = [];
    const hasItem = (keyword) => cart.some(c => c.name.includes(keyword));
    
    if (hasItem('ขุดดิน') && !hasItem('ถมดิน')) {
        recommendations.push("งานถมดินคืน");
    }
    if (hasItem('ไม้แบบ') && !hasItem('เทคอนกรีต') && !hasItem('เทปูน')) {
        recommendations.push("งานเทคอนกรีต");
    }
    
    // We could display this in the UI, for now we will just log or we can add a small UI element.
    const recDiv = document.getElementById('recommendationsDiv');
    if (!recDiv) {
        const div = document.createElement('div');
        div.id = 'recommendationsDiv';
        div.style = 'padding: 15px; background: rgba(59, 130, 246, 0.1); border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 13px; color: #60a5fa;';
        document.getElementById('cartBody').prepend(div);
    }
    const currentRecDiv = document.getElementById('recommendationsDiv');
    if (recommendations.length > 0) {
        currentRecDiv.innerHTML = '<strong><i class="fas fa-lightbulb"></i> ระบบแนะนำเพิ่มเติม:</strong> คุณอาจจะลืมเพิ่ม ' + recommendations.map(r => `<span style="background:rgba(59, 130, 246, 0.2); padding:2px 8px; border-radius:6px; margin-left:4px; color:#93c5fd;">${r}</span>`).join('');
        currentRecDiv.style.display = 'block';
    } else {
        currentRecDiv.style.display = 'none';
    }
}

// UI Interactions
cartToggle.addEventListener('click', () => {
    cartPanel.classList.add('open');
    overlay.classList.add('show');
});

closeCart.addEventListener('click', () => {
    cartPanel.classList.remove('open');
    overlay.classList.remove('show');
});
overlay.addEventListener('click', () => {
    cartPanel.classList.remove('open');
    overlay.classList.remove('show');
});

// Export to Excel using SheetJS
exportBtn.addEventListener('click', () => {
    if (cart.length === 0) {
        alert("ยังไม่มีรายการในตารางรวบรวม");
        return;
    }
    
    const exportData = cart.map((item, idx) => ({
        "ลำดับ": idx + 1,
        "รหัส": item.id || '',
        "รายการ": item.name,
        "ปริมาณ": item.qty,
        "หน่วย": item.unit,
        "ค่าแรง/หน่วย (บาท)": item.price,
        "รวมค่าแรง (บาท)": item.price * item.qty
    }));
    
    // Add Total Row
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    exportData.push({
        "ลำดับ": "",
        "รหัส": "",
        "รายการ": "รวมค่าแรงทั้งหมด",
        "ปริมาณ": "",
        "หน่วย": "",
        "ค่าแรง/หน่วย (บาท)": "",
        "รวมค่าแรง (บาท)": total
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "บัญชีค่าแรง");
    
    // Auto-adjust column widths
    const wscols = [
        {wch: 8},  // ลำดับ
        {wch: 10}, // รหัส
        {wch: 50}, // รายการ
        {wch: 10}, // ปริมาณ
        {wch: 10}, // หน่วย
        {wch: 20}, // ค่าแรง/หน่วย
        {wch: 20}  // รวมค่าแรง
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, "Labor_Cost_Yotathai.xlsx");
});

// Export as JSON for integration
const exportJsonBtn = document.getElementById('exportJsonBtn');
if (exportJsonBtn) {
    exportJsonBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert("ยังไม่มีรายการในตารางรวบรวม");
            return;
        }
        
        const jsonData = JSON.stringify(cart, null, 2);
        navigator.clipboard.writeText(jsonData).then(() => {
            const originalText = exportJsonBtn.innerHTML;
            exportJsonBtn.innerHTML = '<i class="fas fa-check"></i> คัดลอกสำเร็จ!';
            exportJsonBtn.style.background = 'rgba(16, 185, 129, 0.2)';
            
            setTimeout(() => {
                exportJsonBtn.innerHTML = originalText;
                exportJsonBtn.style.background = 'rgba(147, 197, 253, 0.2)';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert("ไม่สามารถคัดลอกข้อมูลได้");
        });
    });
}

// Initialize
loadData();
