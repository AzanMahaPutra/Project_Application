const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

console.log('main.js loaded');

function createWindow() {
  console.log('Creating window...');
  const win = new BrowserWindow({
    width: 1300,
    height: 800,
    minWidth: 1100,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  console.log('Loading index.html...');
  win.loadFile('index.html');
  console.log('Window loaded');
}

app.whenReady().then(() => {
  console.log('app ready, creating window');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

ipcMain.on('renderer-error', (event, error) => {
  console.error('Renderer Error:', error);
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

// ============================= DATA SISWA =============================
ipcMain.handle('save-data', async (event, newData) => {
  try {
    ensureDataFiles();
    let existingData = [];

    const content = fs.readFileSync(dataPath, 'utf8');
    existingData = content ? JSON.parse(content) : [];

    existingData.push(newData);
    fs.writeFileSync(dataPath, JSON.stringify(existingData, null, 2));
    return 'Data berhasil disimpan!';
  } catch (error) {
    throw new Error('Gagal menyimpan data: ' + error.message);
  }
});

ipcMain.handle('load-data', async () => {
  try {
    ensureDataFiles();
    const file = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(file || '[]');
  } catch (error) {
    return [];
  }
});

ipcMain.handle('update-data', async (event, index, updatedData) => {
  try {
    ensureDataFiles();
    let existingData = JSON.parse(fs.readFileSync(dataPath, 'utf8') || '[]');

    if (index >= 0 && index < existingData.length) {
      existingData[index] = { ...existingData[index], ...updatedData };
      fs.writeFileSync(dataPath, JSON.stringify(existingData, null, 2));
      return 'Data berhasil diupdate!';
    } else {
      throw new Error('Index tidak valid');
    }
  } catch (error) {
    throw new Error('Gagal mengupdate data: ' + error.message);
  }
});

ipcMain.handle('delete-data', async (event, index) => {
  try {
    ensureDataFiles();
    let existingData = JSON.parse(fs.readFileSync(dataPath, 'utf8') || '[]');

    if (index >= 0 && index < existingData.length) {
      existingData.splice(index, 1);
      fs.writeFileSync(dataPath, JSON.stringify(existingData, null, 2));
      return 'Data berhasil dihapus!';
    } else {
      throw new Error('Index tidak valid');
    }
  } catch (error) {
    throw new Error('Gagal menghapus data: ' + error.message);
  }
});

// ============================= DATA ACARA =============================
ipcMain.handle('save-acara', async (event, newAcara) => {
  try {
    ensureDataFiles();

    let existingAcara = JSON.parse(fs.readFileSync(dataAcaraPath, 'utf8') || '[]');

    if (!newAcara.namaAcara || !newAcara.tanggalAcara) {
      throw new Error('Nama acara dan tanggal harus diisi');
    }

    existingAcara.push(newAcara);
    fs.writeFileSync(dataAcaraPath, JSON.stringify(existingAcara, null, 2));

    return 'Acara berhasil disimpan!';
  } catch (error) {
    throw new Error('Gagal menyimpan acara: ' + error.message);
  }
});

ipcMain.handle('load-acara', async () => {
  try {
    ensureDataFiles();
    const file = fs.readFileSync(dataAcaraPath, 'utf8');
    return JSON.parse(file || '[]');
  } catch (error) {
    return [];
  }
});

ipcMain.handle('update-acara', async (event, index, updatedAcara) => {
  try {
    ensureDataFiles();
    let existingAcara = JSON.parse(fs.readFileSync(dataAcaraPath, 'utf8') || '[]');

    if (index >= 0 && index < existingAcara.length) {
      existingAcara[index] = { ...existingAcara[index], ...updatedAcara };
      fs.writeFileSync(dataAcaraPath, JSON.stringify(existingAcara, null, 2));
      return 'Acara berhasil diupdate!';
    } else {
      throw new Error('Index tidak valid');
    }
  } catch (error) {
    throw new Error('Gagal mengupdate acara: ' + error.message);
  }
});

ipcMain.handle('delete-acara', async (event, index) => {
  try {
    ensureDataFiles();
    let existingAcara = JSON.parse(fs.readFileSync(dataAcaraPath, 'utf8') || '[]');

    if (index >= 0 && index < existingAcara.length) {
      existingAcara.splice(index, 1);
      fs.writeFileSync(dataAcaraPath, JSON.stringify(existingAcara, null, 2));
      return 'Acara berhasil dihapus!';
    } else {
      throw new Error('Index tidak valid');
    }
  } catch (error) {
    throw new Error('Gagal menghapus acara: ' + error.message);
  }
});

// ============================================================
// ============== HANDLER BARU UNTUK EDIT WORD ===============
// ============================================================

// folder template Word
const templateFolder = path.join(__dirname, "templates");

// Load isi file Word (kirim sebagai buffer base64)
ipcMain.handle("load-word-template", async (event, filename) => {
  try {
    const filePath = path.join(templateFolder, filename);

    if (!fs.existsSync(filePath)) {
      throw new Error("Template tidak ditemukan");
    }

    const fileBuffer = fs.readFileSync(filePath);
    return fileBuffer.toString("base64");
  } catch (error) {
    return { error: error.message };
  }
});

// Export Word baru
ipcMain.handle("export-word", async (event, outputName, bufferBase64) => {
  try {
    const outputPath = path.join(__dirname, "export", outputName);

    // buat folder export kalau belum ada
    if (!fs.existsSync(path.join(__dirname, "export"))) {
      fs.mkdirSync(path.join(__dirname, "export"));
    }

    const data = Buffer.from(bufferBase64, "base64");
    fs.writeFileSync(outputPath, data);

    return "Berhasil mengekspor file!";
  } catch (error) {
    return { error: error.message };
  }
});

// ============================================================
// TEMPLATE WORD HANDLERS
// ============================================================

// Mapping template types ke file paths
const templateMap = {
  'berita': 'Template/Berita Acara STC 1.docx',
  'honor': 'Template/DAFTAR HONORARIUM NARSUM.docx',
  'notulen': 'Template/Notulensi_Pengenalan_Strategi_Berkarir_Perbankan_Syariah_dan_Job_Matching.docx',
  'pesanan': 'Template/SURAT PESANAN BARANG.docx'
};

// Load template dari file docx
ipcMain.handle('load-template', async (event, type) => {
  try {
    const filePath = templateMap[type];
    if (!filePath) {
      throw new Error(`Template type '${type}' tidak valid`);
    }

    const fullPath = path.join(__dirname, filePath);
    
    // Check file exists
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File template tidak ditemukan: ${fullPath}`);
    }

    // Read file and convert to base64
    const fileContent = fs.readFileSync(fullPath);
    const base64 = fileContent.toString('base64');
    
    return base64;
  } catch (error) {
    console.error('Error loading template:', error);
    return { error: error.message };
  }
});

// Export/Save template hasil editing
ipcMain.handle('export-template', async (event, data) => {
  try {
    const { base64, filename } = data;
    
    if (!base64 || !filename) {
      throw new Error('base64 dan filename diperlukan');
    }

    const exportDir = path.join(__dirname, "export");
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const outputPath = path.join(exportDir, filename);
    const buffer = Buffer.from(base64, 'base64');
    fs.writeFileSync(outputPath, buffer);

    return { success: true, message: `File berhasil disimpan ke ${outputPath}` };
  } catch (error) {
    console.error('Error exporting template:', error);
    return { success: false, error: error.message };
  }
});
