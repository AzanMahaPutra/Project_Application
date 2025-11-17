const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs'); // Tambahan agar bisa simpan file

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // ✅ ini harus preload.js
      contextIsolation: true, // menjaga keamanan (preload tetap bisa pakai ipc)
      nodeIntegration: false, // keamanan tambahan
    },
  });

  // Muat file utama HTML
  win.loadFile('index.html');

  // (Opsional) Buka DevTools untuk debugging
  // win.webContents.openDevTools();
}

// Jalankan saat aplikasi siap
app.whenReady().then(() => {
  createWindow();

  // Untuk macOS: buka jendela baru kalau semua tertutup
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Tutup aplikasi kecuali di macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});


// ============================================================
// Tambahan: IPC untuk menyimpan data ke data.json
// ============================================================
const dataPath = path.join(__dirname, 'data.json');

ipcMain.handle('save-data', async (event, newData) => {
  let existingData = [];
  if (fs.existsSync(dataPath)) {
    const content = fs.readFileSync(dataPath, 'utf8');
    existingData = content ? JSON.parse(content) : [];
  }

  existingData.push(newData);
  fs.writeFileSync(dataPath, JSON.stringify(existingData, null, 2));

  return 'Data berhasil disimpan!';
});

ipcMain.handle('load-data', async () => {
  try {
    const file = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(file || '[]');
  } catch {
    return [];
  }
});
