const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'inventory.json');
const SUBCATEGORIES_FILE = path.join(__dirname, 'data', 'subcategories.json');
const SUBSUBCATEGORIES_FILE = path.join(__dirname, 'data', 'subsubcategories.json');

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

function ensureSubcategoriesFile() {
    const dir = path.dirname(SUBCATEGORIES_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(SUBCATEGORIES_FILE)) {
        fs.writeFileSync(SUBCATEGORIES_FILE, JSON.stringify([], null, 2));
    }
}

function readSubcategories() {
    ensureSubcategoriesFile();
    const data = fs.readFileSync(SUBCATEGORIES_FILE, 'utf8');
    return JSON.parse(data);
}

function writeSubcategories(subcategories) {
    ensureSubcategoriesFile();
    fs.writeFileSync(SUBCATEGORIES_FILE, JSON.stringify(subcategories, null, 2));
}

function ensureSubsubcategoriesFile() {
    const dir = path.dirname(SUBSUBCATEGORIES_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(SUBSUBCATEGORIES_FILE)) {
        fs.writeFileSync(SUBSUBCATEGORIES_FILE, JSON.stringify([], null, 2));
    }
}

function readSubsubcategories() {
    ensureSubsubcategoriesFile();
    const data = fs.readFileSync(SUBSUBCATEGORIES_FILE, 'utf8');
    return JSON.parse(data);
}

function writeSubsubcategories(subsubcategories) {
    ensureSubsubcategoriesFile();
    fs.writeFileSync(SUBSUBCATEGORIES_FILE, JSON.stringify(subsubcategories, null, 2));
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
        const { id, name, category, subcategory, subSubcategory, unit, quantityPerPhysicalCount, frequencyAsPerDO, dateLastCalibrated, scheduleDateOfNextCalibration, remarks } = req.body;

        if (!id || !name || !category || !unit || !quantityPerPhysicalCount) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const inventory = readInventory();
        const existingItem = inventory.find(item => item.id === id);
        if (existingItem) {
            return res.status(409).json({ error: 'Item ID already exists' });
        }

        const duplicateName = inventory.find(item => item.name && item.name.trim().toLowerCase() === name.trim().toLowerCase());
        if (duplicateName) {
            return res.status(409).json({ error: `An item named "${duplicateName.name}" already exists in the inventory.` });
        }

        const newItem = {
            id,
            name,
            category,
            subcategory: subcategory || null,
            subSubcategory: subSubcategory || null,
            unit,
            quantityPerPhysicalCount,
            frequencyAsPerDO: frequencyAsPerDO || null,
            dateLastCalibrated: dateLastCalibrated || null,
            scheduleDateOfNextCalibration: scheduleDateOfNextCalibration || null,
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
        const { name, category, subcategory, subSubcategory, unit, quantityPerPhysicalCount, frequencyAsPerDO, dateLastCalibrated, scheduleDateOfNextCalibration, remarks } = req.body;

        if (!name || !category || !unit || !quantityPerPhysicalCount) {
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
            subcategory: subcategory || null,
            subSubcategory: subSubcategory || null,
            unit,
            quantityPerPhysicalCount,
            frequencyAsPerDO: frequencyAsPerDO || null,
            dateLastCalibrated: dateLastCalibrated || null,
            scheduleDateOfNextCalibration: scheduleDateOfNextCalibration || null,
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

// GET all subcategories
app.get('/api/subcategories', (req, res) => {
    try {
        const subcategories = readSubcategories();
        res.json(subcategories);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read subcategories' });
    }
});

// POST add subcategory
app.post('/api/subcategories', (req, res) => {
    try {
        const { name, category } = req.body;
        if (!name || !category) {
            return res.status(400).json({ error: 'Name and category are required' });
        }
        const subcategories = readSubcategories();
        const exists = subcategories.find(s => s.name === name && s.category === category);
        if (exists) {
            return res.status(409).json({ error: 'Subcategory already exists' });
        }
        subcategories.push({ name, category });
        writeSubcategories(subcategories);
        res.status(201).json({ name, category });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add subcategory' });
    }
});

// PUT rename subcategory
app.put('/api/subcategories', (req, res) => {
    try {
        const { oldName, newName, category } = req.body;
        if (!oldName || !newName || !category) {
            return res.status(400).json({ error: 'oldName, newName, and category are required' });
        }
        let subcategories = readSubcategories();
        const idx = subcategories.findIndex(s => s.name === oldName && s.category === category);
        if (idx === -1) {
            return res.status(404).json({ error: 'Subcategory not found' });
        }
        subcategories[idx].name = newName;
        writeSubcategories(subcategories);

        // Also update all items that reference this subcategory
        let inventory = readInventory();
        inventory = inventory.map(item => {
            if (item.subcategory === oldName && item.category === category) {
                return { ...item, subcategory: newName };
            }
            return item;
        });
        writeInventory(inventory);

        res.json({ message: 'Subcategory updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update subcategory' });
    }
});

// DELETE subcategory
app.delete('/api/subcategories', (req, res) => {
    try {
        const { name, category } = req.body;
        if (!name || !category) {
            return res.status(400).json({ error: 'Name and category are required' });
        }
        let subcategories = readSubcategories();
        const beforeLen = subcategories.length;
        subcategories = subcategories.filter(s => !(s.name === name && s.category === category));
        if (subcategories.length === beforeLen) {
            return res.status(404).json({ error: 'Subcategory not found' });
        }
        writeSubcategories(subcategories);

        // Clear subcategory from all items that reference it
        let inventory = readInventory();
        inventory = inventory.map(item => {
            if (item.subcategory === name && item.category === category) {
                return { ...item, subcategory: null };
            }
            return item;
        });
        writeInventory(inventory);

        res.json({ message: 'Subcategory deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete subcategory' });
    }
});

// GET all sub-subcategories
app.get('/api/subsubcategories', (req, res) => {
    try {
        const subsubcategories = readSubsubcategories();
        res.json(subsubcategories);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read sub-subcategories' });
    }
});

// POST add sub-subcategory
app.post('/api/subsubcategories', (req, res) => {
    try {
        const { name, subcategory, category } = req.body;
        if (!name || !subcategory || !category) {
            return res.status(400).json({ error: 'Name, subcategory, and category are required' });
        }
        const subsubcategories = readSubsubcategories();
        const exists = subsubcategories.find(s => s.name === name && s.subcategory === subcategory && s.category === category);
        if (exists) {
            return res.status(409).json({ error: 'Sub-subcategory already exists' });
        }
        subsubcategories.push({ name, subcategory, category });
        writeSubsubcategories(subsubcategories);
        res.status(201).json({ name, subcategory, category });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add sub-subcategory' });
    }
});

// PUT rename sub-subcategory
app.put('/api/subsubcategories', (req, res) => {
    try {
        const { oldName, newName, subcategory, category } = req.body;
        if (!oldName || !newName || !subcategory || !category) {
            return res.status(400).json({ error: 'oldName, newName, subcategory, and category are required' });
        }
        let subsubcategories = readSubsubcategories();
        const idx = subsubcategories.findIndex(s => s.name === oldName && s.subcategory === subcategory && s.category === category);
        if (idx === -1) {
            return res.status(404).json({ error: 'Sub-subcategory not found' });
        }
        subsubcategories[idx].name = newName;
        writeSubsubcategories(subsubcategories);

        let inventory = readInventory();
        inventory = inventory.map(item => {
            if (item.subSubcategory === oldName && item.subcategory === subcategory && item.category === category) {
                return { ...item, subSubcategory: newName };
            }
            return item;
        });
        writeInventory(inventory);

        res.json({ message: 'Sub-subcategory updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update sub-subcategory' });
    }
});

// DELETE sub-subcategory
app.delete('/api/subsubcategories', (req, res) => {
    try {
        const { name, subcategory, category } = req.body;
        if (!name || !subcategory || !category) {
            return res.status(400).json({ error: 'Name, subcategory, and category are required' });
        }
        let subsubcategories = readSubsubcategories();
        const beforeLen = subsubcategories.length;
        subsubcategories = subsubcategories.filter(s => !(s.name === name && s.subcategory === subcategory && s.category === category));
        if (subsubcategories.length === beforeLen) {
            return res.status(404).json({ error: 'Sub-subcategory not found' });
        }
        writeSubsubcategories(subsubcategories);

        let inventory = readInventory();
        inventory = inventory.map(item => {
            if (item.subSubcategory === name && item.subcategory === subcategory && item.category === category) {
                return { ...item, subSubcategory: null };
            }
            return item;
        });
        writeInventory(inventory);

        res.json({ message: 'Sub-subcategory deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete sub-subcategory' });
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
