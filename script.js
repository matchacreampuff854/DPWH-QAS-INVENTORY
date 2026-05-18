// DPWH Quality Assurance Inventory Script

let usageChart;
let qualityChart;
let categories = ['Soil Aggregates & Asphalt Aggregates', 'Asphaltic Materials & Asphalt Mixes', 'Test on Concrete'];
let units = ['pc', 'set', 'sack', 'unit', 'bot', 'bag', 'pair'];
const API_BASE = (window.location.port === '5500' || window.location.protocol === 'file:') 
    ? 'http://localhost:3000/api' 
    : '/api';

let completedTasks = [];
let calCurrentDate = new Date();
let calSelectedDate = null;
let inventoryCache = [];
let pendingConfirmAction = null;

document.addEventListener('DOMContentLoaded', async function() {
    loadUnits();
    populateUnitSelect();
    initTabs();
    loadCompletedTasks();
    await checkBackendHealth();
    await syncInventory();

    document.getElementById('calendar-btn').addEventListener('click', toggleCalendarPopup);
    document.getElementById('cal-prev').addEventListener('click', () => changeCalendarMonth(-1));
    document.getElementById('cal-next').addEventListener('click', () => changeCalendarMonth(1));

    document.getElementById('notification-btn').addEventListener('click', toggleNotificationDropdown);

    document.addEventListener('click', function(e) {
        const calPopup = document.getElementById('calendar-popup');
        const calBtn = document.getElementById('calendar-btn');
        if (calPopup && !calPopup.contains(e.target) && !calBtn.contains(e.target)) {
            calPopup.style.display = 'none';
        }
        const notifDropdown = document.getElementById('notification-dropdown');
        const notifBtn = document.getElementById('notification-btn');
        if (notifDropdown && !notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
            notifDropdown.style.display = 'none';
        }
    });

    document.getElementById('add-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addMaterial();
    });

    document.getElementById('search-btn').addEventListener('click', searchInventory);
    document.getElementById('search-bar').addEventListener('input', function() {
        if (this.value === '') {
            loadInventory();
            updateRecentActivity();
        }
    });

    document.getElementById('add-material-btn').addEventListener('click', scrollToAddMaterial);
    document.getElementById('graph-btn').addEventListener('click', scrollToCharts);

    document.getElementById('add-category-btn').addEventListener('click', function(e) {
        e.preventDefault();
        openCategoryModal();
    });

    const removeCategoryBtn = document.getElementById('remove-category-btn');
    if (removeCategoryBtn) {
        removeCategoryBtn.addEventListener('click', function(e) {
            e.preventDefault();
            removeSelectedCategory();
        });
    }

    document.getElementById('add-unit-btn').addEventListener('click', function(e) {
        e.preventDefault();
        openUnitModal();
    });

    const removeUnitBtn = document.getElementById('remove-unit-btn');
    if (removeUnitBtn) {
        removeUnitBtn.addEventListener('click', function(e) {
            e.preventDefault();
            removeSelectedUnit();
        });
    }

    const categoryModalSubmit = document.getElementById('category-modal-submit');
    const categoryModalCancel = document.getElementById('category-modal-cancel');
    const categoryModalClose = document.getElementById('category-modal-close');
    const newCategoryInput = document.getElementById('new-category-input');

    const unitModalSubmit = document.getElementById('unit-modal-submit');
    const unitModalCancel = document.getElementById('unit-modal-cancel');
    const unitModalClose = document.getElementById('unit-modal-close');
    const newUnitInput = document.getElementById('new-unit-input');

    const confirmModalYes = document.getElementById('confirm-modal-yes');
    const confirmModalCancel = document.getElementById('confirm-modal-cancel');
    const confirmModalClose = document.getElementById('confirm-modal-close');

    if (confirmModalYes) {
        confirmModalYes.addEventListener('click', function() {
            if (pendingConfirmAction) {
                pendingConfirmAction();
            }
            closeConfirmModal();
        });
    }
    if (confirmModalCancel) {
        confirmModalCancel.addEventListener('click', closeConfirmModal);
    }
    if (confirmModalClose) {
        confirmModalClose.addEventListener('click', closeConfirmModal);
    }

    if (categoryModalSubmit) {
        categoryModalSubmit.addEventListener('click', submitNewCategory);
    }
    if (categoryModalCancel) {
        categoryModalCancel.addEventListener('click', closeCategoryModal);
    }
    if (categoryModalClose) {
        categoryModalClose.addEventListener('click', closeCategoryModal);
    }
    if (newCategoryInput) {
        newCategoryInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitNewCategory();
            }
        });
    }

    if (unitModalSubmit) {
        unitModalSubmit.addEventListener('click', submitNewUnit);
    }
    if (unitModalCancel) {
        unitModalCancel.addEventListener('click', closeUnitModal);
    }
    if (unitModalClose) {
        unitModalClose.addEventListener('click', closeUnitModal);
    }
    if (newUnitInput) {
        newUnitInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitNewUnit();
            }
        });
    }

    const yearSelect = document.getElementById('records-year');
    if (yearSelect) {
        yearSelect.addEventListener('change', renderRecords);
    }

    const recordsSearch = document.getElementById('records-search');
    if (recordsSearch) {
        recordsSearch.addEventListener('input', renderRecords);
    }

    const recordsCategory = document.getElementById('records-category-filter');
    if (recordsCategory) {
        recordsCategory.addEventListener('change', renderRecords);
    }

    const recordsStatus = document.getElementById('records-status-filter');
    if (recordsStatus) {
        recordsStatus.addEventListener('change', renderRecords);
    }

    document.getElementById('edit-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveEdit();
    });
});

function loadUnits() {
    const saved = localStorage.getItem('dpwh-units');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length) {
                units = parsed;
            }
        } catch (e) {
            console.error('Failed to load units', e);
        }
    }
}

function saveUnits() {
    localStorage.setItem('dpwh-units', JSON.stringify(units));
}

function populateUnitSelect() {
    const select = document.getElementById('item-unit');
    if (!select) return;
    const currentValue = select.value;
    select.innerHTML = '<option value="">Select Unit</option>';
    units.forEach(u => {
        const option = document.createElement('option');
        option.value = u;
        option.textContent = u;
        select.appendChild(option);
    });
    if (currentValue && units.includes(currentValue)) {
        select.value = currentValue;
    }
}

function addNewUnit() {
    openUnitModal();
}

function openUnitModal() {
    const modal = document.getElementById('unit-modal');
    const input = document.getElementById('new-unit-input');
    const error = document.getElementById('modal-unit-error');
    if (!modal || !input || !error) return;
    error.textContent = '';
    input.value = '';
    modal.style.display = 'flex';
    setTimeout(() => input.focus(), 50);
}

function closeUnitModal() {
    const modal = document.getElementById('unit-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function submitNewUnit() {
    const input = document.getElementById('new-unit-input');
    const error = document.getElementById('modal-unit-error');
    if (!input || !error) return;

    const unitName = input.value.trim();
    if (!unitName) {
        error.textContent = 'Please type a unit name.';
        return;
    }

    const normalized = unitName.toLowerCase();
    if (units.includes(normalized)) {
        error.textContent = 'This unit already exists.';
        return;
    }

    units.push(normalized);
    saveUnits();
    addUnitOption(normalized);
    closeUnitModal();
}

function addUnitOption(unitName) {
    const select = document.getElementById('item-unit');
    if (select) {
        const option = document.createElement('option');
        option.value = unitName;
        option.textContent = unitName;
        select.appendChild(option);
        select.value = unitName;
    }
}

function openConfirmModal(title, message, actionLabel, actionCallback) {
    const modal = document.getElementById('confirm-modal');
    const titleElement = document.getElementById('confirm-modal-title');
    const textElement = document.getElementById('confirm-modal-text');
    const yesButton = document.getElementById('confirm-modal-yes');
    if (!modal || !titleElement || !textElement || !yesButton) return;

    titleElement.textContent = title;
    textElement.textContent = message;
    yesButton.textContent = actionLabel || 'Confirm';
    pendingConfirmAction = actionCallback;
    modal.style.display = 'flex';
}

function closeConfirmModal() {
    const modal = document.getElementById('confirm-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    pendingConfirmAction = null;
}

function removeSelectedCategory() {
    const select = document.getElementById('item-category');
    if (!select) return;

    const selectedValue = select.value;
    if (!selectedValue) {
        alert('Please choose a category to remove first.');
        return;
    }

    const inUse = inventoryCache.some(item => item.category === selectedValue);
    if (inUse) {
        alert('Cannot remove this category because it is already used by an inventory item.');
        return;
    }

    openConfirmModal(
        'Remove Category',
        `Remove category "${selectedValue}"?`,
        'Remove',
        function() {
            const optionIndex = Array.from(select.options).findIndex(opt => opt.value === selectedValue);
            if (optionIndex >= 0) {
                select.remove(optionIndex);
            }

            const categoryIndex = categories.indexOf(selectedValue);
            if (categoryIndex >= 0) {
                categories.splice(categoryIndex, 1);
            }

            const editCategorySelect = document.getElementById('edit-item-category');
            if (editCategorySelect) {
                const editOption = Array.from(editCategorySelect.options).find(opt => opt.value === selectedValue);
                if (editOption) {
                    editCategorySelect.remove(editOption.index);
                }
            }

            select.value = '';
        }
    );
}


function removeSelectedUnit() {
    const select = document.getElementById('item-unit');
    if (!select) return;

    const selectedValue = select.value;
    if (!selectedValue) {
        alert('Please choose a unit to remove first.');
        return;
    }

    const inUse = inventoryCache.some(item => item.unit === selectedValue);
    if (inUse) {
        alert('Cannot remove this unit because it is already used by an inventory item.');
        return;
    }

    openConfirmModal(
        'Remove Unit',
        `Remove unit "${selectedValue}"?`,
        'Remove',
        function() {
            const optionIndex = Array.from(select.options).findIndex(opt => opt.value === selectedValue);
            if (optionIndex >= 0) {
                select.remove(optionIndex);
            }

            const unitIndex = units.indexOf(selectedValue);
            if (unitIndex >= 0) {
                units.splice(unitIndex, 1);
                saveUnits();
            }

            select.value = '';
        }
    );
}

function getQuantity(item) {
    return item.quantityPerPhysicalCount || item.status || 'none';
}

function getNextCalibration(item) {
    return item.scheduleDateOfNextCalibration || item.calibrationSchedule || null;
}

function getFrequency(item) {
    return item.frequencyAsPerDO || 'N/A';
}

function getDateLastCalibrated(item) {
    return item.dateLastCalibrated || 'N/A';
}

function loadInventory() {
    const inventory = getInventory();
    const tbody = document.getElementById('inventory-body');
    tbody.innerHTML = '';

    inventory.forEach(item => {
        const row = document.createElement('tr');
        const qty = getQuantity(item);
        const freq = getFrequency(item);
        const lastCal = getDateLastCalibrated(item);
        const nextCal = getNextCalibration(item) || 'N/A';
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${item.unit || 'N/A'}</td>
            <td>${qty}</td>
            <td>${freq}</td>
            <td>${lastCal}</td>
            <td>${nextCal}</td>
            <td>${item.remarks ? '<strong>' + item.remarks.substring(0, 20) + '...</strong>' : 'N/A'}</td>
            <td><button class="delete-btn" onclick="deleteMaterial('${item.id}')">Delete</button></td>
        `;
        tbody.appendChild(row);
    });
}

async function addMaterial() {
    const name = document.getElementById('item-name').value.trim();
    const category = document.getElementById('item-category').value;
    const unit = document.getElementById('item-unit').value;
    const quantityPerPhysicalCount = document.getElementById('item-quantity').value;
    const frequencyAsPerDO = document.getElementById('frequency-do').value.trim();
    const dateLastCalibrated = document.getElementById('date-last-calibrated').value;
    const scheduleDateOfNextCalibration = document.getElementById('schedule-next-calibration').value;
    const remarks = document.getElementById('remarks').value.trim();

    if (!name || !category || !unit || !quantityPerPhysicalCount) {
        alert('Please fill in all required fields');
        return;
    }

    const id = 'EQ-' + Date.now();

    try {
        const res = await fetch(`${API_BASE}/inventory`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, name, category, unit, quantityPerPhysicalCount, frequencyAsPerDO, dateLastCalibrated, scheduleDateOfNextCalibration, remarks })
        });
        if (!res.ok) {
            const err = await res.json();
            alert(err.error || 'Failed to add material. Check that the backend is running (cd Backend && npm start).');
            return;
        }
        document.getElementById('add-form').reset();
        await syncInventory();
    } catch (error) {
        alert('Failed to add material. Backend is not running.\n\nTo fix:\n1. Open Command Prompt\n2. Type: cd Backend && npm start\n3. Then refresh this page.');
        showBackendWarning();
    }
}

async function deleteMaterial(id) {
    if (confirm('Are you sure you want to delete this material?')) {
        try {
            const res = await fetch(`${API_BASE}/inventory/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const err = await res.json();
                alert(err.error || 'Failed to delete material. Check that the backend is running.');
                return;
            }
            await syncInventory();
        } catch (error) {
            alert('Failed to delete material. Backend is not running.\n\nTo fix:\n1. Open Command Prompt\n2. Type: cd Backend && npm start\n3. Then refresh this page.');
            showBackendWarning();
        }
    }
}

function updateDashboard() {
    const inventory = getInventory();
    const total = inventory.length;
    const functioningCount = inventory.filter(item => getQuantity(item) === 'functioning').length;
    const testsPassed = total ? Math.round((functioningCount / total) * 100) : 0;
    const inspections = total ? Math.max(16, Math.round(total * 1.5) + 12) : 0;

    document.getElementById('total-materials').textContent = total;
    document.getElementById('tests-passed').textContent = `${testsPassed}%`;
    document.getElementById('inspections-count').textContent = inspections;
}

function updateRecentActivity() {
    const inventory = getInventory();
    const activityList = document.getElementById('recent-activity');
    activityList.innerHTML = '';

    if (!inventory.length) {
        activityList.innerHTML = '<li class="activity-item">No activity yet. Add a material to populate activity history.</li>';
        return;
    }

    const recentItems = inventory.slice(-4).reverse();
    recentItems.forEach(item => {
        const listItem = document.createElement('li');
        listItem.className = 'activity-item';
        const minutesAgo = 10 + Math.floor(Math.random() * 50);
        listItem.innerHTML = `
            <span><strong>${item.name}</strong> added to inventory.</span>
            <span>${minutesAgo}m ago</span>
        `;
        activityList.appendChild(listItem);
    });
}

function updateCharts() {
    const inventory = getInventory();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
    const usageData = [450, 380, 520, 490, 530];

    if (usageChart) {
        usageChart.destroy();
    }

    const usageCtx = document.getElementById('usage-chart').getContext('2d');
    usageChart = new Chart(usageCtx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Cement',
                    data: usageData,
                    borderColor: '#0f4fa8',
                    backgroundColor: 'rgba(15, 79, 168, 0.12)',
                    tension: 0.35,
                    fill: true,
                    pointRadius: 4,
                    pointBackgroundColor: '#0f4fa8'
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#64748b'
                    },
                    grid: {
                        color: 'rgba(15, 79, 168, 0.08)'
                    }
                },
                x: {
                    ticks: {
                        color: '#64748b'
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });

    const categoriesData = {};
    inventory.forEach(item => {
        if (!categoriesData[item.category]) {
            categoriesData[item.category] = { total: 0, functioning: 0 };
        }
        categoriesData[item.category].total += 1;
        if (getQuantity(item) === 'functioning') {
            categoriesData[item.category].functioning += 1;
        }
    });

    const qualityLabels = Object.keys(categoriesData).length ? Object.keys(categoriesData) : ['Chemicals', 'Asphalt', 'Wood'];
    const qualityValues = qualityLabels.map(label => {
        const data = categoriesData[label];
        return data && data.total ? Math.round((data.functioning / data.total) * 100) : 0;
    });

    if (qualityChart) {
        qualityChart.destroy();
    }

    const qualityCtx = document.getElementById('quality-chart').getContext('2d');
    qualityChart = new Chart(qualityCtx, {
        type: 'bar',
        data: {
            labels: qualityLabels,
            datasets: [
                {
                    label: 'Passed (%)',
                    data: qualityValues,
                    backgroundColor: '#ff6f1f'
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: '#64748b'
                    },
                    grid: {
                        color: 'rgba(15, 79, 168, 0.08)'
                    }
                },
                x: {
                    ticks: {
                        color: '#64748b'
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function checkNotifications() {
    const inventory = getInventory();
    const notifications = [];
    const today = new Date();
    const warningDays = 30;

    inventory.forEach(item => {
        const nextCal = getNextCalibration(item);
        if (nextCal) {
            const calibrationDate = new Date(nextCal);
            const daysUntilCalibration = Math.ceil((calibrationDate - today) / (1000 * 60 * 60 * 24));
            if (daysUntilCalibration <= warningDays && daysUntilCalibration >= 0) {
                notifications.push(`Calibration for ${item.name} scheduled in ${daysUntilCalibration} days`);
            } else if (daysUntilCalibration < 0) {
                notifications.push(`Calibration for ${item.name} is overdue`);
            }
        }
    });

    const notificationBar = document.getElementById('notification-bar');
    const notificationArea = document.getElementById('notification-area');

    if (notificationBar) {
        if (notifications.length > 0) {
            notificationBar.innerHTML = notifications.join(' | ');
            notificationBar.style.display = 'block';
        } else {
            notificationBar.style.display = 'none';
        }
    }

    if (notificationArea) {
        notificationArea.innerHTML = notifications.length > 0
            ? `<strong>⚠️ ${notifications.length} Alert(s)</strong>`
            : '✓ All items up to date';
    }

    renderNotificationList();
}

function getInventory() {
    return inventoryCache;
}

async function checkBackendHealth() {
    try {
        const res = await fetch(`${API_BASE}/health`, { method: 'GET', signal: AbortSignal.timeout(3000) });
        if (!res.ok) throw new Error('Backend unhealthy');
        removeBackendWarning();
    } catch (error) {
        showBackendWarning();
    }
}

function showBackendWarning() {
    let banner = document.getElementById('backend-warning');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'backend-warning';
        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #dc3545;
            color: #fff;
            padding: 14px 24px;
            font-weight: 700;
            z-index: 9999;
            text-align: center;
            font-size: 0.95rem;
        `;
        document.body.appendChild(banner);
    }
    banner.innerHTML = `
        ⚠️ Backend is not running. 
        Open Command Prompt, type: <code style="background:rgba(255,255,255,0.2);padding:2px 6px;border-radius:4px;">cd Backend && npm start</code>
        <button onclick="this.parentElement.remove()" style="margin-left:12px;padding:4px 12px;border:none;border-radius:6px;background:#fff;color:#dc3545;font-weight:700;cursor:pointer;">Dismiss</button>
    `;
}

function removeBackendWarning() {
    const banner = document.getElementById('backend-warning');
    if (banner) banner.remove();
}

async function syncInventory() {
    try {
        const res = await fetch(`${API_BASE}/inventory`);
        if (!res.ok) throw new Error('Failed to fetch inventory');
        inventoryCache = await res.json();
    } catch (error) {
        console.error('Failed to sync inventory', error);
        inventoryCache = [];
    }
    loadInventory();
    updateDashboard();
    updateCharts();
    updateRecentActivity();
    checkNotifications();
    populateYearDropdown();
    renderRecords();
    updateCalendarBadge();
    renderCalendar();
}

function openCategoryModal() {
    const modal = document.getElementById('category-modal');
    const input = document.getElementById('new-category-input');
    const error = document.getElementById('modal-category-error');
    if (!modal || !input || !error) return;
    error.textContent = '';
    input.value = '';
    modal.style.display = 'flex';
    setTimeout(() => input.focus(), 50);
}

function closeCategoryModal() {
    const modal = document.getElementById('category-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function submitNewCategory() {
    const input = document.getElementById('new-category-input');
    const error = document.getElementById('modal-category-error');
    if (!input || !error) return;

    const categoryName = input.value.trim();
    if (!categoryName) {
        error.textContent = 'Please type a category name.';
        return;
    }

    if (categories.includes(categoryName)) {
        error.textContent = 'This category already exists.';
        return;
    }

    categories.push(categoryName);
    addCategoryOption(categoryName);
    closeCategoryModal();
}

function addCategoryOption(categoryName) {
    const select = document.getElementById('item-category');
    if (select) {
        const option = document.createElement('option');
        option.value = categoryName;
        option.textContent = categoryName;
        select.appendChild(option);
        select.value = categoryName;
    }

    const editCategorySelect = document.getElementById('edit-item-category');
    if (editCategorySelect) {
        const option = document.createElement('option');
        option.value = categoryName;
        option.textContent = categoryName;
        editCategorySelect.appendChild(option);
    }
}

function scrollToAddMaterial() {
    const addSection = document.getElementById('add-material');
    const listSection = document.getElementById('inventory-list');
    const inventory = document.querySelector('.inventory-layout');
    const metrics = document.querySelector('.metrics-grid');
    const charts = document.querySelector('.dashboard-grid');
    const records = document.getElementById('records-section');

    if (metrics) metrics.style.display = 'none';
    if (charts) charts.style.display = 'none';
    if (records) {
        records.style.display = 'none';
        records.classList.remove('active');
    }
    if (inventory) inventory.style.display = 'grid';
    if (addSection) addSection.style.display = 'block';
    if (listSection) listSection.style.display = 'none';

    // Update nav tabs
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    const matTab = document.querySelector('.nav-tab[data-tab="materials"]');
    if (matTab) matTab.classList.add('active');

    addSection.scrollIntoView({ behavior: 'smooth' });
}

function scrollToCharts() {
    const chartSection = document.querySelector('.dashboard-grid');
    if (chartSection) {
        chartSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function initTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const target = this.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            switchTab(target);
        });
    });
}

function switchTab(target) {
    const metrics = document.querySelector('.metrics-grid');
    const charts = document.querySelector('.dashboard-grid');
    const inventory = document.querySelector('.inventory-layout');
    const records = document.getElementById('records-section');

    if (target === 'records') {
        if (metrics) metrics.style.display = 'none';
        if (charts) charts.style.display = 'none';
        if (inventory) inventory.style.display = 'none';
        if (records) {
            records.style.display = 'block';
            records.classList.add('active');
            renderRecords();
        }
    } else if (target === 'materials') {
        if (metrics) metrics.style.display = 'none';
        if (charts) charts.style.display = 'none';
        if (inventory) inventory.style.display = 'grid';
        if (records) {
            records.style.display = 'none';
            records.classList.remove('active');
        }
        const addSection = document.getElementById('add-material');
        const listSection = document.getElementById('inventory-list');
        if (addSection) addSection.style.display = 'none';
        if (listSection) listSection.style.display = 'block';
        document.querySelector('.inventory-layout').scrollIntoView({ behavior: 'smooth' });
    } else {
        if (metrics) metrics.style.display = 'grid';
        if (charts) charts.style.display = 'grid';
        if (inventory) inventory.style.display = 'grid';
        if (records) {
            records.style.display = 'none';
            records.classList.remove('active');
        }
        const addSection = document.getElementById('add-material');
        const listSection = document.getElementById('inventory-list');
        if (addSection) addSection.style.display = 'block';
        if (listSection) listSection.style.display = 'block';
    }
}

function populateYearDropdown() {
    const yearSelect = document.getElementById('records-year');
    const categorySelect = document.getElementById('records-category-filter');
    if (!yearSelect || !categorySelect) return;

    const currentYear = new Date().getFullYear();
    const inventory = getInventory();
    const years = new Set();
    const cats = new Set(categories);

    inventory.forEach(item => {
        if (item.createdAt) {
            years.add(new Date(item.createdAt).getFullYear());
        }
        if (item.category) cats.add(item.category);
    });

    for (let y = currentYear; y >= 2020; y--) {
        years.add(y);
    }

    const sortedYears = Array.from(years).sort((a, b) => b - a);
    yearSelect.innerHTML = '<option value="all">All Years</option>';
    sortedYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    });

    const currentCat = categorySelect.value;
    categorySelect.innerHTML = '<option value="all">All Categories</option>';
    Array.from(cats).sort().forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });
    if (currentCat && Array.from(cats).includes(currentCat)) {
        categorySelect.value = currentCat;
    }
}

function renderRecords() {
    const tbody = document.getElementById('records-body');
    const yearSelect = document.getElementById('records-year');
    const searchInput = document.getElementById('records-search');
    const categoryFilter = document.getElementById('records-category-filter');
    const statusFilter = document.getElementById('records-status-filter');
    const countLabel = document.getElementById('records-count');

    if (!tbody) return;

    const selectedYear = yearSelect ? yearSelect.value : 'all';
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedCategory = categoryFilter ? categoryFilter.value : 'all';
    const selectedStatus = statusFilter ? statusFilter.value : 'all';

    let inventory = getInventory();

    // Year filter
    if (selectedYear !== 'all') {
        const yearNum = parseInt(selectedYear);
        inventory = inventory.filter(item => {
            if (!item.createdAt) return false;
            return new Date(item.createdAt).getFullYear() === yearNum;
        });
    }

    // Category filter
    if (selectedCategory !== 'all') {
        inventory = inventory.filter(item => item.category === selectedCategory);
    }

    // Status filter (Quantity per Physical Count)
    if (selectedStatus !== 'all') {
        inventory = inventory.filter(item => getQuantity(item) === selectedStatus);
    }

    // Search filter
    if (query) {
        inventory = inventory.filter(item =>
            item.name.toLowerCase().includes(query) ||
            (item.category && item.category.toLowerCase().includes(query)) ||
            (item.unit && item.unit.toLowerCase().includes(query))
        );
    }

    if (countLabel) {
        countLabel.textContent = `${inventory.length} item${inventory.length !== 1 ? 's' : ''} total`;
    }

    tbody.innerHTML = '';

    if (!inventory.length) {
        tbody.innerHTML = '<tr><td colspan="9" class="no-records">No records found.</td></tr>';
        return;
    }

    // Group by category
    const grouped = {};
    inventory.forEach(item => {
        const cat = item.category || 'Uncategorized';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(item);
    });

    let catNum = 1;
    Object.keys(grouped).sort().forEach(cat => {
        // Category header row
        const catRow = document.createElement('tr');
        catRow.className = 'records-cat-header';
        catRow.innerHTML = `<td colspan="9" class="records-cat-cell">${catNum}. ${cat.toUpperCase()}</td>`;
        tbody.appendChild(catRow);

        grouped[cat].forEach((item, idx) => {
            const row = document.createElement('tr');
            const qty = getQuantity(item);
            const badgeClass = qty === 'functioning' ? 'functioning' : (qty === 'not-functioning' ? 'not-functioning' : '');
            const qtyText = qty === 'functioning' ? 'Functioning' : (qty === 'not-functioning' ? 'Not Functioning' : 'None');
            const freq = getFrequency(item);
            const lastCal = getDateLastCalibrated(item);
            const nextCal = getNextCalibration(item) || 'N/A';

            row.innerHTML = `
                <td><span class="item-num">${catNum}.${idx + 1}</span> <strong>${item.name}</strong></td>
                <td>${item.category}</td>
                <td>${item.unit || 'N/A'}</td>
                <td><span class="status-badge ${badgeClass}">${qtyText}</span></td>
                <td>${freq}</td>
                <td>${lastCal}</td>
                <td>${nextCal}</td>
                <td>${item.remarks || ''}</td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn edit" title="Edit" onclick="openEditModal('${item.id}')">✏️</button>
                        <button class="action-btn delete" title="Delete" onclick="deleteFromRecords('${item.id}')">🗑️</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        catNum++;
    });
}

function openEditModal(id) {
    const inventory = getInventory();
    const item = inventory.find(i => i.id === id);
    if (!item) return;

    document.getElementById('edit-original-id').value = item.id;
    document.getElementById('edit-item-name').value = item.name;
    document.getElementById('edit-item-quantity').value = getQuantity(item);
    document.getElementById('edit-frequency-do').value = item.frequencyAsPerDO || '';
    document.getElementById('edit-date-last-calibrated').value = item.dateLastCalibrated || '';
    document.getElementById('edit-schedule-next-calibration').value = getNextCalibration(item) || '';
    document.getElementById('edit-remarks').value = item.remarks || '';

    const catSelect = document.getElementById('edit-item-category');
    catSelect.innerHTML = '';
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        catSelect.appendChild(opt);
    });
    catSelect.value = item.category;

    const unitSelect = document.getElementById('edit-item-unit');
    unitSelect.innerHTML = '';
    units.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u;
        opt.textContent = u;
        unitSelect.appendChild(opt);
    });
    unitSelect.value = item.unit || 'pc';

    document.getElementById('edit-modal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
}

async function saveEdit() {
    const originalId = document.getElementById('edit-original-id').value;
    const name = document.getElementById('edit-item-name').value.trim();
    const category = document.getElementById('edit-item-category').value;
    const unit = document.getElementById('edit-item-unit').value;
    const quantityPerPhysicalCount = document.getElementById('edit-item-quantity').value;
    const frequencyAsPerDO = document.getElementById('edit-frequency-do').value.trim();
    const dateLastCalibrated = document.getElementById('edit-date-last-calibrated').value;
    const scheduleDateOfNextCalibration = document.getElementById('edit-schedule-next-calibration').value;
    const remarks = document.getElementById('edit-remarks').value.trim();

    if (!name || !category || !unit || !quantityPerPhysicalCount) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/inventory/${originalId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: originalId, name, category, unit, quantityPerPhysicalCount, frequencyAsPerDO, dateLastCalibrated, scheduleDateOfNextCalibration, remarks })
        });
        if (!res.ok) {
            const err = await res.json();
            alert(err.error || 'Failed to update material. Check that the backend is running.');
            return;
        }
        closeEditModal();
        await syncInventory();
    } catch (error) {
        alert('Failed to update material. Backend is not running.\n\nTo fix:\n1. Open Command Prompt\n2. Type: cd Backend && npm start\n3. Then refresh this page.');
        showBackendWarning();
    }
}

function deleteFromRecords(id) {
    if (confirm('Are you sure you want to delete this material?')) {
        deleteMaterial(id);
    }
}

function printRecords() {
    const yearSelect = document.getElementById('records-year');
    const searchInput = document.getElementById('records-search');
    const categoryFilter = document.getElementById('records-category-filter');
    const statusFilter = document.getElementById('records-status-filter');

    const selectedYear = yearSelect ? yearSelect.value : 'all';
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedCategory = categoryFilter ? categoryFilter.value : 'all';
    const selectedStatus = statusFilter ? statusFilter.value : 'all';

    let inventory = getInventory();

    if (selectedYear !== 'all') {
        const yearNum = parseInt(selectedYear);
        inventory = inventory.filter(item => {
            if (!item.createdAt) return false;
            return new Date(item.createdAt).getFullYear() === yearNum;
        });
    }

    if (selectedCategory !== 'all') {
        inventory = inventory.filter(item => item.category === selectedCategory);
    }

    if (selectedStatus !== 'all') {
        inventory = inventory.filter(item => getQuantity(item) === selectedStatus);
    }

    if (query) {
        inventory = inventory.filter(item =>
            item.id.toLowerCase().includes(query) ||
            item.name.toLowerCase().includes(query) ||
            (item.category && item.category.toLowerCase().includes(query)) ||
            (item.unit && item.unit.toLowerCase().includes(query))
        );
    }

    // Build print HTML inside a hidden iframe for reliable rendering
    const printHTML = buildPrintHTML(inventory);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.top = '0';
    iframe.style.left = '-9999px';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(printHTML);
    doc.close();

    // Wait for iframe to load then print
    setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        // Clean up after print dialog closes
        setTimeout(() => {
            if (iframe.parentNode) {
                document.body.removeChild(iframe);
            }
        }, 1000);
    }, 300);
}

function buildPrintHTML(inventory) {
    let rowsHTML = '';

    if (!inventory.length) {
        rowsHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;">No records to print.</td></tr>';
    } else {
        // Group by category
        const grouped = {};
        inventory.forEach(item => {
            const cat = item.category || 'Uncategorized';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(item);
        });

        Object.keys(grouped).sort().forEach(cat => {
            rowsHTML += `<tr><td colspan="9" class="category-header">${cat.toUpperCase()}</td></tr>`;
            grouped[cat].forEach((item, idx) => {
                const qty = getQuantity(item);
                const functioning = qty === 'functioning' ? (item.unit || '1') : '';
                const notFunctioning = qty === 'not-functioning' ? (item.unit || '1') : '';
                const noneVal = qty === 'none' ? (item.unit || '1') : '';
                const freq = item.frequencyAsPerDO || '';
                const lastCal = item.dateLastCalibrated || '';
                const nextCal = getNextCalibration(item) || '';

                rowsHTML += `
                    <tr>
                        <td>${idx + 1}. ${escapeHtml(item.name)}</td>
                        <td>${escapeHtml(item.unit || '')}</td>
                        <td>${escapeHtml(functioning)}</td>
                        <td>${escapeHtml(notFunctioning)}</td>
                        <td>${escapeHtml(noneVal)}</td>
                        <td>${escapeHtml(freq)}</td>
                        <td>${escapeHtml(lastCal)}</td>
                        <td>${escapeHtml(nextCal)}</td>
                        <td>${escapeHtml(item.remarks || '')}</td>
                    </tr>
                `;
            });
        });
    }

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Checklist Print</title>
<style>
@page { size: A4 portrait; margin: 12mm; }
body { font-family: Georgia, serif; font-size: 10pt; margin: 0; padding: 0; background: #fff; }
.form-header { margin-bottom: 14px; }
.form-header h1 { text-align: center; font-size: 13pt; font-weight: 700; text-transform: uppercase; margin: 0 0 10px; letter-spacing: 0.5px; }
.form-meta { font-size: 9pt; border-bottom: 1.5px solid #333; padding-bottom: 8px; margin-bottom: 10px; }
.form-meta p { margin: 2px 0; }
.print-checklist { width: 100%; border-collapse: collapse; font-size: 8pt; table-layout: fixed; }
.print-checklist thead th { border: 1.5px solid #000; padding: 4px 3px; text-align: center; vertical-align: middle; font-weight: 700; background: #f5f5f5; line-height: 1.2; }
.print-checklist tbody td { border: 1px solid #000; padding: 3px 4px; vertical-align: middle; text-align: center; word-wrap: break-word; }
.print-checklist tbody td:first-child { text-align: left; font-weight: 600; }
.print-checklist .category-header { background: #d5d5d5; font-weight: 700; text-align: left; padding: 4px 5px; border: 1px solid #000; font-size: 8.5pt; }
.print-checklist thead tr:first-child th:nth-child(1) { width: 22%; }
.print-checklist thead tr:first-child th:nth-child(2) { width: 8%; }
.print-checklist thead tr:first-child th:nth-child(3) { width: 24%; }
.print-checklist thead tr:first-child th:nth-child(4) { width: 26%; }
.print-checklist thead tr:first-child th:nth-child(5) { width: 20%; }
</style>
</head>
<body>
<div class="form-header">
    <h1>CHECKLIST OF LABORATORY EQUIPMENT/ APPARATUS</h1>
    <div class="form-meta">
        <p><strong>Office (RO/ DEO):</strong> <u>DEPARTMENT OF PUBLIC WORKS AND HIGHWAYS BULACAN FIRST DISTRICT ENGINEERING OFFICE</u></p>
        <p><strong>Head of Office (RD/ DE):</strong> <u>KENNETH EDWARD FERNANDO - OIC - District Engineer</u></p>
        <p><strong>Head of Unit: (Chief, QAHD/ QAS):</strong> <u>FERDINAND VERGARA JR. - Chief, Q.A.S</u></p>
        <p><strong>Current Star Rating:</strong> <u>STAR II</u></p>
    </div>
</div>
<table class="print-checklist">
    <thead>
        <tr>
            <th rowspan="2">APPARATUS/ EQUIPMENT</th>
            <th rowspan="2">Unit of<br>Measure</th>
            <th colspan="3">Quantity per Physical Count</th>
            <th colspan="3">Calibration</th>
            <th rowspan="2">Remarks</th>
        </tr>
        <tr>
            <th>Functioning</th>
            <th>Not Functioning</th>
            <th>None</th>
            <th>Frequency as per<br>D.O. 184 S 2022</th>
            <th>Date Last<br>Calibrated</th>
            <th>Schedule Date of<br>Next Calibration</th>
        </tr>
    </thead>
    <tbody>
        ${rowsHTML}
    </tbody>
</table>
</body>
</html>`;
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function loadCompletedTasks() {
    const saved = localStorage.getItem('dpwh-completed-tasks');
    if (saved) {
        try {
            completedTasks = JSON.parse(saved);
            if (!Array.isArray(completedTasks)) completedTasks = [];
        } catch (e) {
            completedTasks = [];
        }
    }
}

function saveCompletedTasks() {
    localStorage.setItem('dpwh-completed-tasks', JSON.stringify(completedTasks));
}

function isTaskCompleted(itemId, type, dateStr) {
    return completedTasks.some(t => t.itemId === itemId && t.type === type && t.date === dateStr);
}

function toggleTaskCompletion(itemId, type, dateStr) {
    const idx = completedTasks.findIndex(t => t.itemId === itemId && t.type === type && t.date === dateStr);
    if (idx >= 0) {
        completedTasks.splice(idx, 1);
    } else {
        completedTasks.push({ itemId, type, date: dateStr });
    }
    saveCompletedTasks();
    updateCalendarBadge();
    renderCalendar();
    renderCalendarTasks(calSelectedDate ? calSelectedDate.getFullYear() : calCurrentDate.getFullYear(), calSelectedDate ? calSelectedDate.getMonth() : calCurrentDate.getMonth(), calSelectedDate ? calSelectedDate.getDate() : null);
    renderNotificationList();
}

function getPendingTasks() {
    const inventory = getInventory();
    const tasks = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    inventory.forEach(item => {
        const nextCal = getNextCalibration(item);
        if (nextCal) {
            const d = new Date(nextCal);
            d.setHours(0, 0, 0, 0);
            const dateStr = nextCal;
            if (!isTaskCompleted(item.id, 'calibration', dateStr)) {
                tasks.push({ itemId: item.id, name: item.name, type: 'calibration', date: d, dateStr, label: 'Calibration due' });
            }
        }
    });

    return tasks;
}

function updateCalendarBadge() {
    const badge = document.getElementById('calendar-badge');
    if (!badge) return;
    const pendingTasks = getPendingTasks();
    const currentYear = calCurrentDate.getFullYear();
    const currentMonth = calCurrentDate.getMonth();
    const count = pendingTasks.filter(t => t.date.getFullYear() === currentYear && t.date.getMonth() === currentMonth).length;
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
}

function toggleCalendarPopup() {
    const popup = document.getElementById('calendar-popup');
    if (!popup) return;
    popup.style.display = popup.style.display === 'block' ? 'none' : 'block';
    if (popup.style.display === 'block') {
        renderCalendar();
    }
}

function changeCalendarMonth(delta) {
    calCurrentDate.setMonth(calCurrentDate.getMonth() + delta);
    renderCalendar();
}

function renderCalendar() {
    const grid = document.getElementById('cal-grid');
    const label = document.getElementById('cal-month-year');
    if (!grid || !label) return;

    const year = calCurrentDate.getFullYear();
    const month = calCurrentDate.getMonth();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    label.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDaysInMonth = new Date(year, month, 0).getDate();

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let html = '';
    dayLabels.forEach(d => {
        html += `<div class="cal-day-label">${d}</div>`;
    });

    const pendingTasks = getPendingTasks();
    const hasTaskOnDay = (y, m, day) => {
        return pendingTasks.some(t => t.date.getFullYear() === y && t.date.getMonth() === m && t.date.getDate() === day);
    };

    // Previous month filler
    for (let i = firstDay - 1; i >= 0; i--) {
        html += `<div class="cal-day other-month">${prevDaysInMonth - i}</div>`;
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const taskClass = hasTaskOnDay(year, month, day) ? 'has-tasks' : '';
        const selectedClass = (calSelectedDate && calSelectedDate.getFullYear() === year && calSelectedDate.getMonth() === month && calSelectedDate.getDate() === day) ? 'selected' : '';
        html += `<div class="cal-day ${taskClass} ${selectedClass}" onclick="selectCalendarDay(${year}, ${month}, ${day})">${day}</div>`;
    }

    // Next month filler
    const totalCells = firstDay + daysInMonth;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
        html += `<div class="cal-day other-month">${i}</div>`;
    }

    grid.innerHTML = html;
    updateCalendarBadge();
}

function selectCalendarDay(year, month, day) {
    calSelectedDate = new Date(year, month, day);
    renderCalendar();
    renderCalendarTasks(year, month, day);
}

function renderCalendarTasks(year, month, day) {
    const container = document.getElementById('cal-tasks');
    if (!container) return;

    if (!day) {
        container.innerHTML = '<p class="cal-no-tasks">Select a date to view tasks.</p>';
        return;
    }

    const inventory = getInventory();
    const tasks = [];

    inventory.forEach(item => {
        const nextCal = getNextCalibration(item);
        if (nextCal) {
            const d = new Date(nextCal);
            if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
                const done = isTaskCompleted(item.id, 'calibration', nextCal);
                tasks.push({ item, type: 'calibration', dateStr: nextCal, label: 'Calibration due', done });
            }
        }
    });

    if (!tasks.length) {
        container.innerHTML = '<p class="cal-no-tasks">No tasks for this date.</p>';
        return;
    }

    container.innerHTML = `<h4 style="margin:0 0 10px;font-size:0.9rem;color:var(--blue)">${month + 1}/${day}/${year}</h4>`;
    tasks.forEach(task => {
        const div = document.createElement('div');
        div.className = `cal-task-item ${task.done ? 'completed' : ''}`;
        div.innerHTML = `
            <input type="checkbox" ${task.done ? 'checked' : ''} onchange="toggleTaskCompletion('${task.item.id}', '${task.type}', '${task.dateStr}')">
            <label><strong>${task.item.name}</strong><br><small>${task.label}</small></label>
        `;
        container.appendChild(div);
    });
}

function toggleNotificationDropdown() {
    const dropdown = document.getElementById('notification-dropdown');
    if (!dropdown) return;
    const isHidden = dropdown.style.display === 'none' || dropdown.style.display === '';
    dropdown.style.display = isHidden ? 'block' : 'none';
    if (isHidden) {
        renderNotificationList();
    }
}

function getWeeklyTasks() {
    const inventory = getInventory();
    const tasks = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);
    weekEnd.setHours(23, 59, 59, 999);

    inventory.forEach(item => {
        const nextCal = getNextCalibration(item);
        if (nextCal) {
            const d = new Date(nextCal);
            d.setHours(0, 0, 0, 0);
            if (d <= weekEnd) {
                const done = isTaskCompleted(item.id, 'calibration', nextCal);
                const daysLeft = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
                tasks.push({ item, type: 'calibration', dateStr: nextCal, label: 'Calibration', done, daysLeft, date: d });
            }
        }
    });

    return tasks.sort((a, b) => a.date - b.date);
}

function renderNotificationList() {
    const container = document.getElementById('notification-list');
    const weekRange = document.getElementById('notification-week-range');
    if (!container) return;

    const tasks = getWeeklyTasks();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 6);

    if (weekRange) {
        const opts = { month: 'short', day: 'numeric' };
        weekRange.textContent = `${today.toLocaleDateString('en-US', opts)} - ${weekEnd.toLocaleDateString('en-US', opts)}`;
    }

    if (!tasks.length) {
        container.innerHTML = '<p class="notification-empty">No tasks for this week.</p>';
        updateNotificationBadge(0);
        return;
    }

    const pending = tasks.filter(t => !t.done).length;
    updateNotificationBadge(pending);

    // Group by type
    const maintenanceTasks = tasks.filter(t => t.type === 'maintenance');
    const calibrationTasks = tasks.filter(t => t.type === 'calibration');

    container.innerHTML = '';

    if (maintenanceTasks.length) {
        const group = document.createElement('div');
        group.className = 'notification-group';
        group.innerHTML = `<p class="notification-group-title">Maintenance (${maintenanceTasks.filter(t => !t.done).length} pending)</p>`;
        maintenanceTasks.forEach(task => {
            const div = document.createElement('div');
            div.className = `notification-item ${task.done ? 'completed' : ''}`;
            const daysText = task.daysLeft < 0 ? `Overdue ${Math.abs(task.daysLeft)} day(s)` : task.daysLeft === 0 ? 'Due today' : `Due in ${task.daysLeft} day(s)`;
            div.innerHTML = `
                <input type="checkbox" ${task.done ? 'checked' : ''} onchange="toggleTaskCompletion('${task.item.id}', '${task.type}', '${task.dateStr}')">
                <label><strong>${task.item.name}</strong><span class="notif-meta">${task.item.id} &bull; ${daysText}</span></label>
            `;
            group.appendChild(div);
        });
        container.appendChild(group);
    }

    if (calibrationTasks.length) {
        const group = document.createElement('div');
        group.className = 'notification-group';
        group.innerHTML = `<p class="notification-group-title">Calibration (${calibrationTasks.filter(t => !t.done).length} pending)</p>`;
        calibrationTasks.forEach(task => {
            const div = document.createElement('div');
            div.className = `notification-item ${task.done ? 'completed' : ''}`;
            const daysText = task.daysLeft < 0 ? `Overdue ${Math.abs(task.daysLeft)} day(s)` : task.daysLeft === 0 ? 'Due today' : `Due in ${task.daysLeft} day(s)`;
            div.innerHTML = `
                <input type="checkbox" ${task.done ? 'checked' : ''} onchange="toggleTaskCompletion('${task.item.id}', '${task.type}', '${task.dateStr}')">
                <label><strong>${task.item.name}</strong><span class="notif-meta">${task.item.id} &bull; ${daysText}</span></label>
            `;
            group.appendChild(div);
        });
        container.appendChild(group);
    }
}

function updateNotificationBadge(count) {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
}

function searchInventory() {
    const query = document.getElementById('search-bar').value.toLowerCase();
    const inventory = getInventory();
    const filteredInventory = inventory.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );

    const tbody = document.getElementById('inventory-body');
    tbody.innerHTML = '';

    if (!filteredInventory.length) {
        tbody.innerHTML = '<tr><td colspan="9">No matching materials found.</td></tr>';
        return;
    }

    filteredInventory.forEach(item => {
        const row = document.createElement('tr');
        const qty = getQuantity(item);
        const freq = getFrequency(item);
        const lastCal = getDateLastCalibrated(item);
        const nextCal = getNextCalibration(item) || 'N/A';
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${item.unit || 'N/A'}</td>
            <td>${qty}</td>
            <td>${freq}</td>
            <td>${lastCal}</td>
            <td>${nextCal}</td>
            <td>${item.remarks ? '<strong>' + item.remarks.substring(0, 20) + '...</strong>' : 'N/A'}</td>
            <td><button class="delete-btn" onclick="deleteMaterial('${item.id}')">Delete</button></td>
        `;
        tbody.appendChild(row);
    });
}
