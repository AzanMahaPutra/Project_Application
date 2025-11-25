const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1300, // Lebarkan lagi
    height: 800,
    minWidth: 1100,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ============================================================
// IPC Handlers
// ============================================================
const dataPath = path.join(__dirname, 'data.json');
const dataAcaraPath = path.join(__dirname, 'dataAcara.json');

// Pastikan file database ada
function ensureDataFiles() {
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, '[]');
  }
  if (!fs.existsSync(dataAcaraPath)) {
    fs.writeFileSync(dataAcaraPath, '[]');
  }
}

// Handler untuk data siswa
ipcMain.handle('save-data', async (event, newData) => {
  try {
    ensureDataFiles();
    let existingData = [];
    
    const content = fs.readFileSync(dataPath, 'utf8');
    existingData = content ? JSON.parse(content) : [];

    existingData.push(newData);
    fs.writeFileSync(dataPath, JSON.stringify(existingData, null, 2));
    console.log('Data berhasil disimpan:', newData);
    return 'Data berhasil disimpan!';
  } catch (error) {
    console.error('Error saving data:', error);
    throw new Error('Gagal menyimpan data: ' + error.message);
  }
});

ipcMain.handle('load-data', async () => {
  try {
    ensureDataFiles();
    const file = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(file || '[]');
  } catch (error) {
    console.error('Error loading data:', error);
    return [];
  }
});

// Handler untuk data acara - PERBAIKAN BESAR DI SINI
ipcMain.handle('save-acara', async (event, newAcara) => {
  try {
    console.log('Menerima data acara:', newAcara);
    ensureDataFiles();
    
    let existingAcara = [];
    const content = fs.readFileSync(dataAcaraPath, 'utf8');
    console.log('Content file:', content);
    
    existingAcara = content ? JSON.parse(content) : [];
    console.log('Existing acara:', existingAcara);

    // Validasi data
    if (!newAcara.namaAcara || !newAcara.tanggalAcara) {
      throw new Error('Nama acara dan tanggal harus diisi');
    }

    existingAcara.push(newAcara);
    fs.writeFileSync(dataAcaraPath, JSON.stringify(existingAcara, null, 2));
    
    console.log('Acara berhasil disimpan ke:', dataAcaraPath);
    console.log('Total acara sekarang:', existingAcara.length);
    
    return 'Acara berhasil disimpan!';
  } catch (error) {
    console.error('Error DETAIL saving acara:', error);
    console.error('Stack:', error.stack);
    throw new Error('Gagal menyimpan acara: ' + error.message);
  }
});

ipcMain.handle('load-acara', async () => {
  try {
    ensureDataFiles();
    const file = fs.readFileSync(dataAcaraPath, 'utf8');
    const data = JSON.parse(file || '[]');
    console.log('Loaded acara:', data.length, 'items');
    return data;
  } catch (error) {
    console.error('Error loading acara:', error);
    return [];
  }
});

// Handler untuk edit data acara
ipcMain.handle('update-acara', async (event, index, updatedAcara) => {
  try {
    ensureDataFiles();
    let existingAcara = [];
    const content = fs.readFileSync(dataAcaraPath, 'utf8');
    existingAcara = content ? JSON.parse(content) : [];

    if (index >= 0 && index < existingAcara.length) {
      existingAcara[index] = { ...existingAcara[index], ...updatedAcara };
      fs.writeFileSync(dataAcaraPath, JSON.stringify(existingAcara, null, 2));
      return 'Acara berhasil diupdate!';
    } else {
      throw new Error('Index tidak valid');
    }
  } catch (error) {
    console.error('Error updating acara:', error);
    throw new Error('Gagal mengupdate acara: ' + error.message);
  }
});

// Handler untuk hapus data acara
ipcMain.handle('delete-acara', async (event, index) => {
  try {
    ensureDataFiles();
    let existingAcara = [];
    const content = fs.readFileSync(dataAcaraPath, 'utf8');
    existingAcara = content ? JSON.parse(content) : [];

    if (index >= 0 && index < existingAcara.length) {
      existingAcara.splice(index, 1);
      fs.writeFileSync(dataAcaraPath, JSON.stringify(existingAcara, null, 2));
      return 'Acara berhasil dihapus!';
    } else {
      throw new Error('Index tidak valid');
    }
  } catch (error) {
    console.error('Error deleting acara:', error);
    throw new Error('Gagal menghapus acara: ' + error.message);
  }
});