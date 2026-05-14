const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'inventory.json');

app.use(cors());
app.use(express.json());

// Serve static files from the parent directory (where index.html, app.html are)
app.use(express.static(path.join(__dirname, '..')));

// Ensure data file exists
function ensureDataFile() {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
    }
}

function readInventory() {
    ensureDataFile();
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
}

function writeInventory(inventory) {
    ensureDataFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(inventory, null, 2));
}

// GET all inventory items
app.get('/api/inventory', (req, res) => {
    try {
        const inventory = readInventory();
        res.json(inventory);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read inventory' });
    }
});

// GET search inventory items
app.get('/api/inventory/search', (req, res) => {
    try {
        const query = (req.query.q || '').toLowerCase();
        const inventory = readInventory();
        const filtered = inventory.filter(item =>
            item.name.toLowerCase().includes(query) ||
            item.category.toLowerCase().includes(query) ||
            (item.unit && item.unit.toLowerCase().includes(query))
        );
        res.json(filtered);
    } catch (error) {
        res.status(500).json({ error: 'Failed to search inventory' });
    }
});

// POST add new inventory item
app.post('/api/inventory', (req, res) => {
    try {
        const { id, name, category, unit, status, maintenanceExpiry, calibrationSchedule, remarks } = req.body;

        if (!id || !name || !category || !unit || !status) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const inventory = readInventory();
        const existingItem = inventory.find(item => item.id === id);
        if (existingItem) {
            return res.status(409).json({ error: 'Item ID already exists' });
        }

        const newItem = {
            id,
            name,
            category,
            unit,
            status,
            maintenanceExpiry: maintenanceExpiry || null,
            calibrationSchedule: calibrationSchedule || null,
            remarks: remarks || null,
            createdAt: new Date().toISOString()
        };

        inventory.push(newItem);
        writeInventory(inventory);
        res.status(201).json(newItem);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add inventory item' });
    }
});

// PUT update inventory item by ID
app.put('/api/inventory/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, unit, status, maintenanceExpiry, calibrationSchedule, remarks } = req.body;

        if (!name || !category || !unit || !status) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const inventory = readInventory();
        const index = inventory.findIndex(item => item.id === id);
        if (index === -1) {
            return res.status(404).json({ error: 'Item not found' });
        }

        inventory[index] = {
            ...inventory[index],
            name,
            category,
            unit,
            status,
            maintenanceExpiry: maintenanceExpiry || null,
            calibrationSchedule: calibrationSchedule || null,
            remarks: remarks || null
        };

        writeInventory(inventory);
        res.json(inventory[index]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update inventory item' });
    }
});

// DELETE inventory item by ID
app.delete('/api/inventory/:id', (req, res) => {
    try {
        const { id } = req.params;
        const inventory = readInventory();
        const updatedInventory = inventory.filter(item => item.id !== id);

        if (updatedInventory.length === inventory.length) {
            return res.status(404).json({ error: 'Item not found' });
        }

        writeInventory(updatedInventory);
        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete inventory item' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..')));

const os = require('os');
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'YOUR-IP';
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`DPWH QAS Inventory running on:`);
    console.log(`  - Local:   http://localhost:${PORT}`);
    console.log(`  - Network: http://${getLocalIP()}:${PORT}`);
    console.log(`Share the Network link with others on the same WiFi/LAN.`);
});
