const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'inventory.json');

app.use(cors());
app.use(express.json());

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
        console.error('GET /api/inventory error:', error);
        res.status(500).json({ error: 'Failed to read inventory' });
    }
});

// GET search inventory items
app.get('/api/inventory/search', (req, res) => {
    try {
        const query = (req.query.q || '').toLowerCase();
        const inventory = readInventory();
        const filtered = inventory.filter(item => {
            const id = (item.id || '').toLowerCase();
            const name = (item.name || '').toLowerCase();
            const category = (item.category || '').toLowerCase();
            const unit = (item.unit || '').toLowerCase();
            return id.includes(query) || name.includes(query) || category.includes(query) || unit.includes(query);
        });
        res.json(filtered);
    } catch (error) {
        console.error('GET /api/inventory/search error:', error);
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
        console.error('POST /api/inventory error:', error);
        res.status(500).json({ error: 'Failed to add inventory item' });
    }
});

// PUT update inventory item by original ID
app.put('/api/inventory/:originalId', (req, res) => {
    try {
        const { originalId } = req.params;
        const { id, name, category, unit, status, maintenanceExpiry, calibrationSchedule, remarks } = req.body;

        if (!id || !name || !category || !unit || !status) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const inventory = readInventory();
        const index = inventory.findIndex(item => item.id === originalId);
        if (index === -1) {
            return res.status(404).json({ error: 'Item not found' });
        }

        if (id !== originalId && inventory.some(item => item.id === id)) {
            return res.status(409).json({ error: 'Item ID already exists' });
        }

        inventory[index] = {
            ...inventory[index],
            id,
            name,
            category,
            unit,
            status,
            maintenanceExpiry: maintenanceExpiry || null,
            calibrationSchedule: calibrationSchedule || null,
            remarks: remarks || null,
            updatedAt: new Date().toISOString()
        };

        writeInventory(inventory);
        res.json(inventory[index]);
    } catch (error) {
        console.error('PUT /api/inventory/:originalId error:', error);
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
        console.error('DELETE /api/inventory/:id error:', error);
        res.status(500).json({ error: 'Failed to delete inventory item' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..')));

const server = app.listen(PORT, () => {
    console.log(`DPWH QAS Inventory backend running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please stop the other process or set a different PORT.`);
    } else {
        console.error('Server error:', err);
    }
    process.exit(1);
});
