const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'inventory.json');
const SUBCATEGORIES_FILE = path.join(__dirname, 'data', 'subcategories.json');
const SUBSUBCATEGORIES_FILE = path.join(__dirname, 'data', 'subsubcategories.json');
const ARCHIVES_FILE = path.join(__dirname, 'data', 'archives.json');
const TRASH_FILE = path.join(__dirname, 'data', 'trash.json');

app.use(cors());
app.use(express.json());

// Serve static files from the parent directory (where index.html, app.html are)
app.use(express.static(path.join(__dirname, '..'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.html') || path.endsWith('.js') || path.endsWith('.css')) {
            res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.set('Pragma', 'no-cache');
            res.set('Expires', '0');
        }
    }
}));

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

function ensureArchivesFile() {
    const dir = path.dirname(ARCHIVES_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(ARCHIVES_FILE)) {
        fs.writeFileSync(ARCHIVES_FILE, JSON.stringify([], null, 2));
    }
}

function readArchives() {
    ensureArchivesFile();
    const data = fs.readFileSync(ARCHIVES_FILE, 'utf8');
    return JSON.parse(data);
}

function writeArchives(archives) {
    ensureArchivesFile();
    fs.writeFileSync(ARCHIVES_FILE, JSON.stringify(archives, null, 2));
}

function ensureTrashFile() {
    const dir = path.dirname(TRASH_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(TRASH_FILE)) {
        fs.writeFileSync(TRASH_FILE, JSON.stringify([], null, 2));
    }
}

function readTrash() {
    ensureTrashFile();
    const data = fs.readFileSync(TRASH_FILE, 'utf8');
    return JSON.parse(data);
}

function writeTrash(trash) {
    ensureTrashFile();
    fs.writeFileSync(TRASH_FILE, JSON.stringify(trash, null, 2));
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

        if (!id || !name || !category) {
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

        if (!name || !category) {
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

// DELETE inventory item by ID (move to trash)
app.delete('/api/inventory/:id', (req, res) => {
    try {
        const { id } = req.params;
        const inventory = readInventory();
        const item = inventory.find(item => item.id === id);

        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        // Remove from inventory
        const updatedInventory = inventory.filter(i => i.id !== id);
        writeInventory(updatedInventory);

        // Move to trash
        const trash = readTrash();
        trash.push({ ...item, deletedAt: new Date().toISOString() });
        writeTrash(trash);

        res.json({ message: 'Item moved to trash', item: { ...item, deletedAt: new Date().toISOString() } });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete inventory item' });
    }
});

// GET trash items
app.get('/api/trash', (req, res) => {
    try {
        const trash = readTrash();
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        res.json(trash);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read trash' });
    }
});

// POST fetch trash (alternative to GET for cache-busting)
app.post('/api/trash/fetch', (req, res) => {
    try {
        const trash = readTrash();
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        res.json(trash);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read trash' });
    }
});

// POST restore item from trash
app.post('/api/trash/restore/:id', (req, res) => {
    try {
        const { id } = req.params;
        const trash = readTrash();
        const itemIndex = trash.findIndex(item => item.id === id);

        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Item not found in trash' });
        }

        const item = trash[itemIndex];
        delete item.deletedAt;

        // Add back to inventory
        const inventory = readInventory();
        inventory.push(item);
        writeInventory(inventory);

        // Remove from trash
        trash.splice(itemIndex, 1);
        writeTrash(trash);

        res.json({ message: 'Item restored successfully', item });
    } catch (error) {
        res.status(500).json({ error: 'Failed to restore item' });
    }
});

// DELETE permanently remove from trash
app.delete('/api/trash/:id', (req, res) => {
    try {
        const { id } = req.params;
        let trash = readTrash();
        const index = trash.findIndex(item => item.id === id);

        if (index === -1) {
            return res.status(404).json({ error: 'Item not found in trash' });
        }

        trash.splice(index, 1);
        writeTrash(trash);
        res.json({ message: 'Item permanently deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete from trash' });
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
        const exists = subcategories.find(s => s.name.toLowerCase() === name.toLowerCase() && s.category.toLowerCase() === category.toLowerCase());
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
        const exists = subsubcategories.find(s => s.name.toLowerCase() === name.toLowerCase() && s.subcategory.toLowerCase() === subcategory.toLowerCase() && s.category.toLowerCase() === category.toLowerCase());
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

// GET all archives (lightweight list)
app.get('/api/archives', (req, res) => {
    try {
        const archives = readArchives();
        const list = archives.map(a => ({ id: a.id, name: a.name, createdAt: a.createdAt }));
        res.json(list);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read archives' });
    }
});

// GET single archive (full data)
app.get('/api/archives/:id', (req, res) => {
    try {
        const archives = readArchives();
        const archive = archives.find(a => a.id === req.params.id);
        if (!archive) {
            return res.status(404).json({ error: 'Archive not found' });
        }
        res.json(archive);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read archive' });
    }
});

// POST create archive: snapshot inventory, leave current inventory untouched
app.post('/api/archives', (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Archive name is required' });
        }

        const inventory = readInventory();

        // Create snapshot
        const archive = {
            id: 'ARCH-' + Date.now(),
            name: name.trim(),
            createdAt: new Date().toISOString(),
            items: JSON.parse(JSON.stringify(inventory)) // deep copy
        };

        // Save archive
        const archives = readArchives();
        archives.push(archive);
        writeArchives(archives);

        // Current inventory is NOT reset — all data (quantities, dates, remarks) is preserved
        // so the Dashboard continues to show the latest data

        res.status(201).json(archive);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create archive' });
    }
});

// PUT update item within an archive
app.put('/api/archives/:archiveId/items/:itemId', (req, res) => {
    try {
        const archives = readArchives();
        const archive = archives.find(a => a.id === req.params.archiveId);
        if (!archive) {
            return res.status(404).json({ error: 'Archive not found' });
        }
        const itemIndex = archive.items.findIndex(i => i.id === req.params.itemId);
        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Item not found in archive' });
        }
        const updatedItem = { ...archive.items[itemIndex], ...req.body };
        archive.items[itemIndex] = updatedItem;
        writeArchives(archives);
        res.json(updatedItem);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update archive item' });
    }
});

// DELETE item from an archive (moves to trash)
app.delete('/api/archives/:archiveId/items/:itemId', (req, res) => {
    try {
        const archives = readArchives();
        const archive = archives.find(a => a.id === req.params.archiveId);
        if (!archive) {
            return res.status(404).json({ error: 'Archive not found' });
        }
        const itemIndex = archive.items.findIndex(i => i.id === req.params.itemId);
        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Item not found in archive' });
        }
        const item = archive.items[itemIndex];

        // Remove from archive
        archive.items.splice(itemIndex, 1);
        writeArchives(archives);

        // Move to trash
        const trash = readTrash();
        trash.push({ ...item, deletedAt: new Date().toISOString(), archiveId: req.params.archiveId, archiveName: archive.name });
        writeTrash(trash);

        res.json({ message: 'Item moved to trash', item: { ...item, deletedAt: new Date().toISOString(), archiveId: req.params.archiveId, archiveName: archive.name } });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete archive item' });
    }
});

// DELETE archive
app.delete('/api/archives/:id', (req, res) => {
    try {
        let archives = readArchives();
        const index = archives.findIndex(a => a.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({ error: 'Archive not found' });
        }
        archives.splice(index, 1);
        writeArchives(archives);
        res.json({ message: 'Archive deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete archive' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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
