const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

console.log('🚀 main.js loaded');

function createWindow() {
  console.log('🪟 Creating window...');
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

  console.log('📄 Loading index.html...');
  win.loadFile('index.html');
  
  // Open DevTools for debugging
  win.webContents.openDevTools();
  
  console.log('✅ Window loaded');
}

app.whenReady().then(() => {
  console.log('✅ app ready, creating window');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

if (process.platform === 'win32') {
  const libreOfficePaths = [
    'C:\\Program Files\\LibreOffice\\program\\',
    'C:\\Program Files (x86)\\LibreOffice\\program\\'
  ];
  
  for (const librePath of libreOfficePaths) {
    if (fs.existsSync(librePath)) {
      process.env.PATH = `${librePath};${process.env.PATH}`;
      break;
    }
  }
}

// ============================================================
// IPC Handlers
// ============================================================
const dataPath = path.join(__dirname, 'data.json');
const dataAcaraPath = path.join(__dirname, 'dataAcara.json');

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

ipcMain.handle('save-all-data', async (event, allData) => {
  try {
    ensureDataFiles();
    
    // Validasi: Pastikan setiap data memiliki nama dan tidak duplikat
    const uniqueData = [];
    const seenNames = new Set();
    const seenNisn = new Set();
    
    for (const item of allData) {
      if (!item.nama || !item.nisn) continue; // Skip data tidak valid
      
      // Hanya ambil data yang memiliki nama lengkap (bukan partial)
      if (!item.tipe || item.tipe === undefined) continue;
      
      // Cegah duplikat berdasarkan nama atau NISN
      if (!seenNames.has(item.nama) && !seenNisn.has(item.nisn)) {
        seenNames.add(item.nama);
        seenNisn.add(item.nisn);
        uniqueData.push(item);
      }
    }
    
    fs.writeFileSync(dataPath, JSON.stringify(uniqueData, null, 2));
    return `Data berhasil disimpan! (${uniqueData.length} records)`;
  } catch (error) {
    throw new Error('Gagal menyimpan semua data: ' + error.message);
  }
});

// ============================= DATA SISWA KELAS XII =============================
const dataXiiPath = path.join(__dirname, 'dataxii.json');

// Handler untuk load data siswa kelas XII
ipcMain.handle('load-data-xii', async () => {
  try {
    console.log('📂 Loading dataxii.json from:', dataXiiPath);
    
    if (!fs.existsSync(dataXiiPath)) {
      console.error('❌ File dataxii.json tidak ditemukan!');
      return [];
    }
    
    const data = JSON.parse(fs.readFileSync(dataXiiPath, 'utf8') || '[]');
    console.log(`✅ Loaded ${data.length} siswa from dataxii.json`);
    
    // Tampilkan contoh data pertama untuk debug
    if (data.length > 0) {
      console.log('📋 Contoh data pertama:', {
        nama: data[0].nama,
        kelasSekolah: data[0].kelasSekolah,
        nisn: data[0].nisn
      });
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error loading data XII:', error);
    return [];
  }
});

// Handler untuk mendapatkan siswa berdasarkan kelas
ipcMain.handle('get-siswa-by-kelas', async (event, kelas) => {
  try {
    console.log(`🔍 Mencari siswa di kelas: "${kelas}"`);
    
    if (!fs.existsSync(dataXiiPath)) {
      console.error('❌ File dataxii.json tidak ditemukan!');
      return [];
    }
    
    const fileContent = fs.readFileSync(dataXiiPath, 'utf8');
    const data = JSON.parse(fileContent || '[]');
    console.log(`📊 Total data di dataxii.json: ${data.length}`);
    
    // Filter berdasarkan kelasSekolah - CASE INSENSITIVE
    const filtered = data.filter(siswa => {
      if (!siswa.kelasSekolah) {
        console.log(`⚠️ Siswa ${siswa.nama} tidak punya kelasSekolah`);
        return false;
      }
      
      // Normalisasi: hilangkan spasi ekstra, ubah ke lowercase
      const kelasSiswa = siswa.kelasSekolah.trim().toLowerCase();
      const kelasDicari = kelas.trim().toLowerCase();
      
      return kelasSiswa === kelasDicari;
    });
    
    console.log(`✅ Ditemukan ${filtered.length} siswa di kelas "${kelas}"`);
    
    if (filtered.length > 0) {
      console.log('📋 3 siswa pertama:');
      filtered.slice(0, 3).forEach(siswa => {
        console.log(`   - ${siswa.nama} (${siswa.kelasSekolah})`);
      });
    }
    
    // Return dengan format yang DIPERLUKAN oleh form
    return filtered.map(siswa => {
      return {
        nama: siswa.nama || "",
        nisn: siswa.nisn || "",
        nis: siswa.nis || "00000",
        jenisKelamin: siswa.jenisKelamin || "Laki-laki",
        kelasSekolah: siswa.kelasSekolah,
        alamat: siswa.alamat || "-"
      };
    });
    
  } catch (error) {
    console.error('❌ Error getting siswa by kelas:', error);
    console.error('Stack:', error.stack);
    return [];
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

// ==================== EDIT DOKUMEN HANDLERS ====================
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

ipcMain.handle('get-available-documents', async () => {
  try {
    const templatesDir = path.join(__dirname, 'Templates');
    const viewDir = path.join(__dirname, 'View');

    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }
    if (!fs.existsSync(viewDir)) {
      fs.mkdirSync(viewDir, { recursive: true });
    }

    const files = fs.readdirSync(templatesDir)
      .filter(file => file.toLowerCase().endsWith('.docx'));

    const documents = [];

    files.forEach(file => {
      const baseName = path.basename(file, '.docx');
      const docxPath = path.join(templatesDir, file);
      const pdfPath = path.join(viewDir, `${baseName}.pdf`);
      const hasPdf = fs.existsSync(pdfPath);

      const displayName = baseName
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .trim();

      documents.push({
        filename: file,
        displayName,
        docxPath,
        pdfPath,
        hasPdf,
        baseName
      });
    });

    return documents;

  } catch (error) {
    console.error('Error getting available documents:', error);
    return [];
  }
});

// Handler untuk mengekstrak placeholders dari DOCX (REAL IMPLEMENTATION)
ipcMain.handle('extract-placeholders', async (event, templatePath) => {
  try {
    console.log('🔍 Extracting placeholders from:', templatePath);
    
    if (!fs.existsSync(templatePath)) {
      console.error('❌ Template file not found:', templatePath);
      throw new Error('Template file not found: ' + templatePath);
    }
    
    try {
      // Baca file DOCX sebagai buffer
      const content = fs.readFileSync(templatePath);
      
      // Parse dengan PizZip
      const PizZip = require('pizzip');
      const zip = new PizZip(content);
      
      // Ambil document.xml
      const documentXml = zip.files['word/document.xml'].asText();
      
      console.log('📄 Raw XML length:', documentXml.length);
      
      // Parse XML untuk mendapatkan semua teks
      const placeholders = [];
      
      // Cari semua placeholder dalam format {{...}}
      // Pattern untuk mencocokkan placeholder di dalam XML
      // Perhatikan bahwa di XML, placeholder bisa dipisah oleh tag
      const placeholderPattern = /\{\{[^{}]*\}\}/g;
      
      // Cari di seluruh XML
      let matches = documentXml.match(placeholderPattern);
      
      if (matches && matches.length > 0) {
        // Bersihkan placeholder
        matches.forEach(match => {
          // Hapus {{ dan }}
          let placeholder = match.replace(/\{\{/g, '').replace(/\}\}/g, '').trim();
          
          // Hapus tag XML jika ada
          placeholder = placeholder.replace(/<[^>]+>/g, '');
          
          // Hapus entity references
          placeholder = placeholder.replace(/&[a-z]+;/g, '');
          
          if (placeholder && placeholder.length > 0 && !placeholders.includes(placeholder)) {
            placeholders.push(placeholder);
          }
        });
      }
      
      // Jika tidak ditemukan dengan regex langsung, coba dengan pendekatan lain
      if (placeholders.length === 0) {
        console.log('⚠️ No placeholders found with direct regex, trying alternative method...');
        
        // Ekstrak semua teks dari XML
        let cleanText = documentXml
          // Hapus komentar
          .replace(/<!--[\s\S]*?-->/g, '')
          // Ambil hanya konten dalam tag <w:t>
          .match(/<w:t[^>]*>([^<]+)<\/w:t>/g)
          ?.map(tag => tag.replace(/<[^>]+>/g, ''))
          ?.join('') || '';
        
        // Cari placeholder di teks yang sudah dibersihkan
        const cleanMatches = cleanText.match(/\{\{[^{}]*\}\}/g);
        
        if (cleanMatches && cleanMatches.length > 0) {
          cleanMatches.forEach(match => {
            let placeholder = match.replace(/\{\{/g, '').replace(/\}\}/g, '').trim();
            if (placeholder && !placeholders.includes(placeholder)) {
              placeholders.push(placeholder);
            }
          });
        }
      }
      
      console.log(`✅ Found ${placeholders.length} placeholders:`, placeholders);
      
      // Debug: Tampilkan beberapa contoh teks dari XML
      if (placeholders.length === 0) {
        console.log('⚠️ Debug - sampling XML content:');
        console.log(documentXml.substring(0, 1000));
        
        // Coba metode ketiga: baca file secara manual untuk debugging
        try {
          const AdmZip = require('adm-zip');
          const zip2 = new AdmZip(templatePath);
          const entries = zip2.getEntries();
          
          const documentEntry = entries.find(entry => entry.entryName === 'word/document.xml');
          if (documentEntry) {
            const xmlText = documentEntry.getData().toString('utf8');
            
            // Simpan XML untuk inspeksi manual
            const debugPath = path.join(__dirname, 'debug_document.xml');
            fs.writeFileSync(debugPath, xmlText);
            console.log(`📝 Debug XML saved to: ${debugPath}`);
            
            // Cari secara manual
            const lines = xmlText.split('\n');
            for (let i = 0; i < Math.min(100, lines.length); i++) {
              if (lines[i].includes('{{') || lines[i].includes('}}')) {
                console.log(`Line ${i}: ${lines[i].substring(0, 200)}`);
              }
            }
          }
        } catch (debugError) {
          console.log('Debug error:', debugError.message);
        }
      }
      
      return placeholders;
      
    } catch (error) {
      console.error('❌ Error in extract-placeholders:', error);
      
      // Fallback: buat file debug untuk analisis
      try {
        const content = fs.readFileSync(templatePath, 'utf8', { encoding: 'binary' });
        const debugPath = path.join(__dirname, 'template_debug.txt');
        fs.writeFileSync(debugPath, content.substring(0, 5000));
        console.log(`📝 Debug template saved to: ${debugPath}`);
      } catch (e) {
        console.error('Cannot save debug file:', e);
      }
      
      // Return placeholder umum sebagai fallback
      return ['Nama', 'Tanggal', 'Lokasi'];
    }
    
  } catch (error) {
    console.error('❌ Error in extract-placeholders:', error);
    // Tetap return default placeholders agar tidak crash
    return ['Nama', 'Tanggal', 'Lokasi'];
  }
});

const { dialog } = require('electron');

ipcMain.handle('save-document', async (event, templatePath, data, outputPath) => {
  try {
    const content = fs.readFileSync(templatePath, 'binary');

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // ⬇️ JANGAN PERNAH di luar handler
    doc.render(data);

    const buf = doc.getZip().generate({ type: 'nodebuffer' });
    fs.writeFileSync(outputPath, buf);

    return true;

  } catch (error) {
    console.error("❌ DOCX ERROR");

    if (error.properties?.errors) {
      error.properties.errors.forEach((e, i) => {
        console.error(`Error ${i + 1}:`, e.properties.explanation);
      });
    }

    // ❌ JANGAN throw Error di level file
    throw new Error("TemplateError: Data tidak sesuai dengan placeholder");
  }
});


// =====================
// CHECK PDF EXISTS
// =====================
ipcMain.handle('check-pdf-exists', async (event, pdfPath) => {
  try {
    if (!pdfPath) return false;
    return fs.existsSync(pdfPath);
  } catch (err) {
    console.error('check-pdf-exists error:', err);
    return false;
  }
});