const { contextBridge, ipcRenderer } = require('electron/renderer');

contextBridge.exposeInMainWorld('electronAPI', {
  // Data siswa
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  loadData: () => ipcRenderer.invoke('load-data'),
  updateData: (index, data) => ipcRenderer.invoke('update-data', index, data),
  deleteData: (index) => ipcRenderer.invoke('delete-data', index),
  
  // Data acara
  saveAcara: (acara) => ipcRenderer.invoke('save-acara', acara),
  loadAcara: () => ipcRenderer.invoke('load-acara'),
  updateAcara: (index, acara) => ipcRenderer.invoke('update-acara', index, acara),
  deleteAcara: (index) => ipcRenderer.invoke('delete-acara', index),

  // Template Word
  loadTemplate: (type) => ipcRenderer.invoke('load-template', type),
  exportTemplate: (data) => ipcRenderer.invoke('export-template', data)
});