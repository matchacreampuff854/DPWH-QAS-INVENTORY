// DPWH Quality Assurance Inventory Script

let usageChart;
let qualityChart;
let categories = ['Chemicals', 'Soil Agg & Concrete & Asph Alt', 'Asphalt', 'Wood', 'Other'];
let units = ['pc', 'set', 'sack', 'unit', 'bot', 'bag', 'pair'];

document.addEventListener('DOMContentLoaded', function() {
    loadUnits();
    populateUnitSelect();
    loadInventory();
    updateDashboard();
    updateCharts();
    updateRecentActivity();
    checkNotifications();
    initTabs();
    populateYearDropdown();
    renderRecords();

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
    document.getElementById('calendar-btn').addEventListener('click', toggleCalendarView);
    document.getElementById('graph-btn').addEventListener('click', scrollToCharts);

    document.getElementById('add-category-btn').addEventListener('click', function(e) {
        e.preventDefault();
        addNewCategory();
    });

    document.getElementById('add-unit-btn').addEventListener('click', function(e) {
        e.preventDefault();
        addNewUnit();
    });

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
    try {
        const unitName = prompt('Enter new unit of measure:') || '';
        if (unitName && unitName.trim() !== '') {
            const normalized = unitName.trim().toLowerCase();
            if (!units.includes(normalized)) {
                units.push(normalized);
                saveUnits();
                populateUnitSelect();
                document.getElementById('item-unit').value = normalized;
            } else {
                alert('This unit already exists.');
            }
        }
    } catch (e) {
        console.log('Could not add unit. Please try again.');
    }
}

function loadInventory() {
    const inventory = getInventory();
    const tbody = document.getElementById('inventory-body');
    tbody.innerHTML = '';

    inventory.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.id}</td>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${item.unit || item.quantity || 'N/A'}</td>
            <td>${item.status}</td>
            <td>${item.maintenanceExpiry || 'N/A'}</td>
            <td>${item.calibrationSchedule || 'N/A'}</td>
            <td>${item.remarks ? '<strong>' + item.remarks.substring(0, 20) + '...</strong>' : 'N/A'}</td>
            <td><button class="delete-btn" onclick="deleteMaterial('${item.id}')">Delete</button></td>
        `;
        tbody.appendChild(row);
    });
}

function addMaterial() {
    const id = document.getElementById('item-id').value.trim();
    const name = document.getElementById('item-name').value.trim();
    const category = document.getElementById('item-category').value;
    const unit = document.getElementById('item-unit').value;
    const status = document.getElementById('item-status').value;
    const maintenanceExpiry = document.getElementById('maintenance-expiry').value;
    const calibrationSchedule = document.getElementById('calibration-schedule').value;
    const remarks = document.getElementById('remarks').value.trim();

    if (!id || !name || !category || !unit || !status) {
        alert('Please fill in all required fields');
        return;
    }

    const inventory = getInventory();
    const existingItem = inventory.find(item => item.id === id);
    if (existingItem) {
        alert('Item ID already exists');
        return;
    }

    inventory.push({ id, name, category, unit, status, maintenanceExpiry, calibrationSchedule, remarks, createdAt: new Date().toISOString() });
    saveInventory(inventory);
    loadInventory();
    updateDashboard();
    updateCharts();
    updateRecentActivity();
    checkNotifications();
    populateYearDropdown();
    renderRecords();
    document.getElementById('add-form').reset();
}

function deleteMaterial(id) {
    if (confirm('Are you sure you want to delete this material?')) {
        const inventory = getInventory();
        const updatedInventory = inventory.filter(item => item.id !== id);
        saveInventory(updatedInventory);
        loadInventory();
        updateDashboard();
        updateCharts();
        updateRecentActivity();
        checkNotifications();
        populateYearDropdown();
        renderRecords();
    }
}

function updateDashboard() {
    const inventory = getInventory();
    const total = inventory.length;
    const functioningCount = inventory.filter(item => item.status === 'functioning').length;
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
        if (item.status === 'functioning') {
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
        if (item.maintenanceExpiry) {
            const expiryDate = new Date(item.maintenanceExpiry);
            const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
            if (daysUntilExpiry <= warningDays && daysUntilExpiry >= 0) {
                notifications.push(`Maintenance for ${item.name} (ID: ${item.id}) expires in ${daysUntilExpiry} days`);
            } else if (daysUntilExpiry < 0) {
                notifications.push(`Maintenance for ${item.name} (ID: ${item.id}) has expired`);
            }
        }

        if (item.calibrationSchedule) {
            const calibrationDate = new Date(item.calibrationSchedule);
            const daysUntilCalibration = Math.ceil((calibrationDate - today) / (1000 * 60 * 60 * 24));
            if (daysUntilCalibration <= warningDays && daysUntilCalibration >= 0) {
                notifications.push(`Calibration for ${item.name} (ID: ${item.id}) scheduled in ${daysUntilCalibration} days`);
            } else if (daysUntilCalibration < 0) {
                notifications.push(`Calibration for ${item.name} (ID: ${item.id}) is overdue`);
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
}

function getInventory() {
    const inventory = localStorage.getItem('dpwh-inventory');
    return inventory ? JSON.parse(inventory) : [];
}

function saveInventory(inventory) {
    localStorage.setItem('dpwh-inventory', JSON.stringify(inventory));
}

function addNewCategory() {
    try {
        const categoryName = prompt('Enter new category name:') || '';
        if (categoryName && categoryName.trim() !== '') {
            if (!categories.includes(categoryName)) {
                categories.push(categoryName);
                const select = document.getElementById('item-category');
                const option = document.createElement('option');
                option.value = categoryName;
                option.textContent = categoryName;
                select.appendChild(option);
            } else {
                alert('This category already exists.');
            }
        }
    } catch (e) {
        console.log('Could not add category. Please try again.');
    }
}

function scrollToAddMaterial() {
    document.getElementById('add-material').scrollIntoView({ behavior: 'smooth' });
}

function toggleCalendarView() {
    alert('Calendar view is coming soon!');
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
        document.querySelector('.inventory-layout').scrollIntoView({ behavior: 'smooth' });
    } else {
        if (metrics) metrics.style.display = 'grid';
        if (charts) charts.style.display = 'grid';
        if (inventory) inventory.style.display = 'grid';
        if (records) {
            records.style.display = 'none';
            records.classList.remove('active');
        }
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

    // Status filter
    if (selectedStatus !== 'all') {
        inventory = inventory.filter(item => item.status === selectedStatus);
    }

    // Search filter
    if (query) {
        inventory = inventory.filter(item =>
            item.id.toLowerCase().includes(query) ||
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
        tbody.innerHTML = '<tr><td colspan="8" class="no-records">No records found.</td></tr>';
        return;
    }

    inventory.forEach(item => {
        const row = document.createElement('tr');
        const badgeClass = item.status === 'functioning' ? 'functioning' : 'not-functioning';
        const statusText = item.status === 'functioning' ? 'Functioning' : 'Not Functioning';
        const today = new Date();
        let calStatus = item.calibrationSchedule || 'N/A';
        if (item.calibrationSchedule) {
            const calDate = new Date(item.calibrationSchedule);
            const days = Math.ceil((calDate - today) / (1000 * 60 * 60 * 24));
            if (days < 0) {
                calStatus = `<span style="color:#dc3545;font-weight:700">Overdue ${Math.abs(days)}d</span>`;
            }
        }

        row.innerHTML = `
            <td><strong>${item.name}</strong></td>
            <td>${item.id}</td>
            <td>${item.category}</td>
            <td>${item.unit || item.quantity || 'N/A'}</td>
            <td><span class="status-badge ${badgeClass}">${statusText}</span></td>
            <td>${item.maintenanceExpiry || 'N/A'}</td>
            <td>${calStatus}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn edit" title="Edit" onclick="openEditModal('${item.id}')">✏️</button>
                    <button class="action-btn delete" title="Delete" onclick="deleteFromRecords('${item.id}')">🗑️</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function openEditModal(id) {
    const inventory = getInventory();
    const item = inventory.find(i => i.id === id);
    if (!item) return;

    document.getElementById('edit-original-id').value = item.id;
    document.getElementById('edit-item-id').value = item.id;
    document.getElementById('edit-item-name').value = item.name;
    document.getElementById('edit-item-status').value = item.status;
    document.getElementById('edit-maintenance-expiry').value = item.maintenanceExpiry || '';
    document.getElementById('edit-calibration-schedule').value = item.calibrationSchedule || '';
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

function saveEdit() {
    const originalId = document.getElementById('edit-original-id').value;
    const id = document.getElementById('edit-item-id').value.trim();
    const name = document.getElementById('edit-item-name').value.trim();
    const category = document.getElementById('edit-item-category').value;
    const unit = document.getElementById('edit-item-unit').value;
    const status = document.getElementById('edit-item-status').value;
    const maintenanceExpiry = document.getElementById('edit-maintenance-expiry').value;
    const calibrationSchedule = document.getElementById('edit-calibration-schedule').value;
    const remarks = document.getElementById('edit-remarks').value.trim();

    if (!id || !name || !category || !unit || !status) {
        alert('Please fill in all required fields');
        return;
    }

    let inventory = getInventory();
    const index = inventory.findIndex(item => item.id === originalId);
    if (index === -1) {
        alert('Item not found');
        return;
    }

    if (id !== originalId && inventory.some(item => item.id === id)) {
        alert('Item ID already exists');
        return;
    }

    inventory[index] = {
        ...inventory[index],
        id,
        name,
        category,
        unit,
        status,
        maintenanceExpiry,
        calibrationSchedule,
        remarks
    };

    saveInventory(inventory);
    loadInventory();
    updateDashboard();
    updateCharts();
    updateRecentActivity();
    checkNotifications();
    populateYearDropdown();
    renderRecords();
    closeEditModal();
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
        inventory = inventory.filter(item => item.status === selectedStatus);
    }

    if (query) {
        inventory = inventory.filter(item =>
            item.id.toLowerCase().includes(query) ||
            item.name.toLowerCase().includes(query) ||
            (item.category && item.category.toLowerCase().includes(query)) ||
            (item.unit && item.unit.toLowerCase().includes(query))
        );
    }

    const tbody = document.getElementById('print-body');
    tbody.innerHTML = '';

    if (!inventory.length) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;">No records to print.</td></tr>';
        window.print();
        return;
    }

    // Group by category
    const grouped = {};
    inventory.forEach(item => {
        const cat = item.category || 'Uncategorized';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(item);
    });

    Object.keys(grouped).sort().forEach(cat => {
        // Category header row
        const catRow = document.createElement('tr');
        catRow.innerHTML = `<td colspan="9" class="category-header">${cat.toUpperCase()}</td>`;
        tbody.appendChild(catRow);

        grouped[cat].forEach((item, idx) => {
            const row = document.createElement('tr');
            const functioning = item.status === 'functioning' ? (item.unit || '1') : '';
            const notFunctioning = item.status === 'not-functioning' ? (item.unit || '1') : '';

            row.innerHTML = `
                <td>${idx + 1}. ${item.name}</td>
                <td>${item.unit || ''}</td>
                <td>${functioning}</td>
                <td>${notFunctioning}</td>
                <td></td>
                <td></td>
                <td></td>
                <td>${item.calibrationSchedule || ''}</td>
                <td>${item.remarks || ''}</td>
            `;
            tbody.appendChild(row);
        });
    });

    window.print();
}

function searchInventory() {
    const query = document.getElementById('search-bar').value.toLowerCase();
    const inventory = getInventory();
    const filteredInventory = inventory.filter(item =>
        item.id.toLowerCase().includes(query) ||
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
        row.innerHTML = `
            <td>${item.id}</td>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${item.unit || item.quantity || 'N/A'}</td>
            <td>${item.status}</td>
            <td>${item.maintenanceExpiry || 'N/A'}</td>
            <td>${item.calibrationSchedule || 'N/A'}</td>
            <td>${item.remarks ? '<strong>' + item.remarks.substring(0, 20) + '...</strong>' : 'N/A'}</td>
            <td><button class="delete-btn" onclick="deleteMaterial('${item.id}')">Delete</button></td>
        `;
        tbody.appendChild(row);
    });
}
