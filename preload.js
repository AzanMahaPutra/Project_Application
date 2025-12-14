const { contextBridge, ipcRenderer } = require('electron/renderer');

contextBridge.exposeInMainWorld('electronAPI', {
  // ==================== DATA SISWA ====================
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  loadData: () => ipcRenderer.invoke('load-data'),
  updateData: (index, data) => ipcRenderer.invoke('update-data', index, data),
  deleteData: (index) => ipcRenderer.invoke('delete-data', index),
  
  // ==================== DATA ACARA ====================
  saveAcara: (acara) => ipcRenderer.invoke('save-acara', acara),
  loadAcara: () => ipcRenderer.invoke('load-acara'),
  updateAcara: (index, acara) => ipcRenderer.invoke('update-acara', index, acara),
  deleteAcara: (index) => ipcRenderer.invoke('delete-acara', index),
  
  // ==================== EDIT DOKUMEN ====================
  getAvailableDocuments: () => ipcRenderer.invoke('get-available-documents'),
  extractPlaceholders: (templatePath) => ipcRenderer.invoke('extract-placeholders', templatePath),
  saveDocument: (templatePath, data, outputPath) => ipcRenderer.invoke('save-document', templatePath, data, outputPath),
  checkPdfExists: (pdfPath) => ipcRenderer.invoke('check-pdf-exists', pdfPath),
});