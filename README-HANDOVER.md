# DPWH Quality Assurance Inventory System
## Inspector Quick Start Guide

---

### What You Need
- 1 computer to act as the **server** (the main PC)
- Other computers just need **Chrome browser**
- All computers must be on the **same office WiFi/LAN**

---

### Step 1: Install Node.js (On Server Computer Only)

1. Open **Chrome** on the server computer
2. Go to: `https://nodejs.org`
3. Click the big **green** button (LTS version)
4. Download and install (just click **Next** repeatedly)
5. Restart the computer

---

### Step 2: Copy the Program

1. Insert the **USB flash drive**
2. Copy the folder `DPWH-QAS-INVENTORY` to the **Desktop**
3. Open the folder

---

### Step 3: Install Auto-Start (One-Time Only)

1. Double-click the file: **`install-autostart.bat`**
2. Wait for the message: "✅ Auto-start installed successfully!"
3. Press any key to close

---

### Step 4: Start the Server (First Time)

1. Double-click the file: **`start-server.vbs`**
2. Nothing will appear — this is normal (it runs silently)

---

### Step 5: Find the Website Link

1. Open **Chrome**
2. Type: `http://localhost:3000`
3. The website should open
4. Look at the **Network** IP shown on screen (example: `192.168.1.100`)
5. **Share this link** with your team:
   ```
   http://192.168.1.100:3000
   ```

---

### Daily Use

| Action | What To Do |
|--------|-----------|
| Turn on in the morning | Just turn on the server computer. The website starts automatically. |
| Use the website | Open Chrome, type the shared link |
| Add materials | Click **+ Add Item**, fill the form, click **Add Material** |
| Print records | Go to **Records** tab, click **🖨️ Print** |
| Turn off after work | Shut down normally. Data is saved automatically. |

---

### Troubleshooting

| Problem | Solution |
|---------|----------|
| Website won't open | Make sure the server computer is turned on |
| "Backend not running" | Double-click `start-server.vbs` again |
| Forgot the link | On server computer, open `http://localhost:3000` |
| Other computer can't connect | Ask IT to allow **port 3000** in Windows Firewall |

---

### Need Help?

Contact the developer who turned over this system.
