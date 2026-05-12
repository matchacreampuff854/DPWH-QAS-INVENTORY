// DPWH Quality Assurance Inventory Script

let chart;

document.addEventListener('DOMContentLoaded', function() {
    loadInventory();
    updateChart();
    checkNotifications();

    // Add material form submission
    document.getElementById('add-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addMaterial();
    });

    // Search functionality
    document.getElementById('search-btn').addEventListener('click', searchInventory);
    document.getElementById('search-bar').addEventListener('input', function() {
        if (this.value === '') {
            loadInventory();
        }
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

    inventory.push({ id, name, category, quantity: parseInt(quantity), status, maintenanceExpiry, calibrationSchedule });
    saveInventory(inventory);
    loadInventory();
    updateChart();
    checkNotifications();
    document.getElementById('add-form').reset();
}

function deleteMaterial(id) {
    if (confirm('Are you sure you want to delete this material?')) {
        const inventory = getInventory();
        const updatedInventory = inventory.filter(item => item.id !== id);
        saveInventory(updatedInventory);
        loadInventory();
        updateChart();
        checkNotifications();
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
            <td><button class="delete-btn" onclick="deleteMaterial('${item.id}')">Delete</button></td>
        `;
        tbody.appendChild(row);
    });
}

function updateChart() {
    if (chart) {
        chart.destroy();
    }

    const inventory = getInventory();
    const categories = {};

    inventory.forEach(item => {
        if (!categories[item.category]) {
            categories[item.category] = { total: 0, functioning: 0 };
        }
        categories[item.category].total++;
        if (item.status === 'functioning') {
            categories[item.category].functioning++;
        }
    });

    const labels = Object.keys(categories);
    const data = labels.map(cat => {
        const total = categories[cat].total;
        const functioning = categories[cat].functioning;
        return total > 0 ? (functioning / total) * 100 : 0;
    });

    const ctx = document.getElementById('category-chart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Functioning Percentage (%)',
                data: data,
                backgroundColor: '#ff6600', // Orange
                borderColor: '#007bff', // Blue
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
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
    if (notifications.length > 0) {
        notificationBar.innerHTML = notifications.join(' | ');
        notificationBar.style.display = 'block';
    } else {
        notificationBar.style.display = 'none';
    }
}

function getInventory() {
    const inventory = localStorage.getItem('dpwh-inventory');
    return inventory ? JSON.parse(inventory) : [];
}

function saveInventory(inventory) {
    localStorage.setItem('dpwh-inventory', JSON.stringify(inventory));
}