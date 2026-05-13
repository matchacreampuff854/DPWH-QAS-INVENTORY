// DPWH Quality Assurance Inventory Script

let chart;
let usageChart;
let qualityChart;
let categories = ['Chemicals', 'Soil Agg & Concrete & Asph Alt', 'Asphalt', 'Wood', 'Other'];

document.addEventListener('DOMContentLoaded', function() {
    loadInventory();
    updateDashboard();
    updateCharts();
    updateRecentActivity();

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
});

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
            <td>${item.quantity}</td>
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
    const id = document.getElementById('item-id').value;
    const name = document.getElementById('item-name').value;
    const category = document.getElementById('item-category').value;
    const quantity = document.getElementById('item-quantity').value;
    const status = document.getElementById('item-status').value;
    const maintenanceExpiry = document.getElementById('maintenance-expiry').value;
    const calibrationSchedule = document.getElementById('calibration-schedule').value;
    const remarks = document.getElementById('remarks').value;

    if (!id || !name || !category || !quantity || !status) {
        alert('Please fill in all required fields');
        return;
    }

    const inventory = getInventory();
    const existingItem = inventory.find(item => item.id === id);
    if (existingItem) {
        alert('Item ID already exists');
        return;
    }

    inventory.push({ id, name, category, quantity: parseInt(quantity), status, maintenanceExpiry, calibrationSchedule, remarks });
    saveInventory(inventory);
    loadInventory();
    updateDashboard();
    updateCharts();
    updateRecentActivity();
    checkNotifications();
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
    const warningDays = 30; // Notify 30 days in advance

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
        notificationArea.innerHTML = notifications.length > 0 ? `<strong>⚠️ ${notifications.length} Alert(s)</strong>` : '✓ All items up to date';
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
            <td>${item.quantity}</td>
            <td>${item.status}</td>
            <td>${item.maintenanceExpiry || 'N/A'}</td>
            <td>${item.calibrationSchedule || 'N/A'}</td>
            <td>${item.remarks ? '<strong>' + item.remarks.substring(0, 20) + '...</strong>' : 'N/A'}</td>
            <td><button class="delete-btn" onclick="deleteMaterial('${item.id}')">Delete</button></td>
        `;
        tbody.appendChild(row);
    });
}

function showHistory() {
    const historySection = document.getElementById('history-section');
    if (!historySection) {
        return;
    }

    const shouldShow = historySection.style.display === 'none';
    historySection.style.display = shouldShow ? 'block' : 'none';

    if (shouldShow) {
        historySection.scrollIntoView({ behavior: 'smooth' });
        setActiveTab('history-btn');
    } else {
        setActiveTab('dashboard-tab');
    }
}

function setActiveTab(tabId) {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        tab.classList.toggle('active', tab.id === tabId);
    });

    const historySection = document.getElementById('history-section');
    if (historySection) {
        historySection.style.display = tabId === 'history-btn' ? 'block' : 'none';
    }
}

function checkNotifications() {
    const inventory = getInventory();
    const notifications = [];
    const today = new Date();
    const warningDays = 30; // Notify 30 days in advance

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
    if (notifications.length > 0) {
        notificationBar.innerHTML = notifications.join(' | ');
        notificationBar.style.display = 'block';
        // Also update the toolbar notification area
        document.getElementById('notification-area').innerHTML = '<strong>⚠️ ' + notifications.length + ' Alert(s)</strong>';
    } else {
        notificationBar.style.display = 'none';
        document.getElementById('notification-area').innerHTML = '✓ All items up to date';
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
    // Create a simple input dialog since prompt() may not be available
    try {
        const categoryName = prompt('Enter new category name:') || '';
        
        if (categoryName && categoryName.trim() !== '') {
            if (!categories.includes(categoryName)) {
                categories.push(categoryName);
                // Add to select dropdown
                const select = document.getElementById('item-category');
                const option = document.createElement('option');
                option.value = categoryName;
                option.textContent = categoryName;
                select.appendChild(option);
                console.log('Category "' + categoryName + '" added successfully!');
            } else {
                console.log('This category already exists.');
            }
        }
    } catch(e) {
        console.log('Could not add category. Please try again.');
    }
}

function scrollToAddMaterial() {
    document.getElementById('add-material').scrollIntoView({ behavior: 'smooth' });
}

function toggleCalendarView() {
    alert('Calendar view is coming soon!');
}

function toggleGraphView() {
    const analyticsSection = document.getElementById('analytics');
    if (analyticsSection.style.display === 'none') {
        analyticsSection.style.display = 'block';
        analyticsSection.scrollIntoView({ behavior: 'smooth' });
    } else {
        analyticsSection.style.display = 'none';
    }
}