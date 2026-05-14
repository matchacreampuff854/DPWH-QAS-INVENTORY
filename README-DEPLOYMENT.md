# DPWH QAS Inventory - Deployment Guide

## For the Inspector / End User

This is a **private office inventory system** that runs on one computer (the "server") and can be accessed by everyone on the same office WiFi/LAN.

---

## Setup (One-Time Only)

### Step 1: Install Node.js
1. Go to https://nodejs.org
2. Download the **LTS** version (the big green button)
3. Install it with default settings (just click Next, Next, Next...)

### Step 2: Install the Server
1. Open this project folder
2. Double-click **`install-autostart.bat`**
3. A black window will appear and say "✅ Auto-start installed successfully!"
4. Press any key to close

### Step 3: Start the Server (First Time)
1. Double-click **`start-server.vbs`**
2. The server starts silently in the background (no window will show)

### Step 4: Find Your Link
1. Open Chrome
2. Go to `http://localhost:3000`
3. If it works, look for the **Network** link shown on the screen or in the console
4. **Share that Network link** with your team (e.g., `http://192.168.1.100:3000`)

---

## Daily Use

- **Turn on the server computer** → The website starts automatically
- **Everyone opens Chrome** → Type the shared Network link
- **Add/Edit/Delete items** → All data is shared instantly
- **Turn off after work** → Data is saved automatically

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Website won't open | Make sure the server computer is on and Node.js is installed |
| "Backend not running" | Double-click `start-server.vbs` again |
| Forgot the link | On the server computer, open `http://localhost:3000` |
| Need to change server computer | Run `install-autostart.bat` on the new computer |

---

## For Developers

### Start Server Manually
```bash
cd Backend
npm start
```

### Development Mode (with Live Server)
```bash
cd Backend
npm start
```
Then open the frontend separately with your Live Server on port 5500.

### Install Dependencies
```bash
cd Backend
npm install
```
