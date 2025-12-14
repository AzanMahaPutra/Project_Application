// =================== GLOBAL NOTIFICATION HELPER ===================
function showNotification(type, content) {
  const dialog = document.createElement('div');
  dialog.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  `;
  
  const closeButton = `<button onclick="this.closest('[data-notification]').remove()" style="
    position: absolute;
    top: 15px;
    right: 15px;
    background: #6c757d;
    color: white;
    border: none;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    cursor: pointer;
    font-size: 16px;
  ">✕</button>`;
  
  const contentDiv = document.createElement('div');
  contentDiv.style.cssText = `
    background: white;
    padding: 30px;
    border-radius: 15px;
    max-width: 500px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    position: relative;
  `;
  contentDiv.innerHTML = closeButton + content;
  
  dialog.setAttribute('data-notification', 'true');
  dialog.appendChild(contentDiv);
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.remove();
  });
  
  document.body.appendChild(dialog);
}

// =================== SIDEBAR ===================
window.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("menuBtn");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  if (menuBtn && sidebar && overlay) {
    function toggleSidebar() {
      sidebar.classList.toggle("open");
      sidebar.classList.toggle("active");
      overlay.classList.toggle("show");
      overlay.classList.toggle("active");
      menuBtn.classList.toggle("active");
    }

    menuBtn.addEventListener("click", toggleSidebar);
    overlay.addEventListener("click", toggleSidebar);
  }
});

// =================== CSV IMPORT HELPERS ===================
function parseCSV(text) {
  const lines = text.split(/\r\n|\n|\r/);
  while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();
  if (lines.length === 0) return [];

  function parseLine(line) {
    const result = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    result.push(cur);
    return result.map(s => s.trim());
  }

  const headers = parseLine(lines.shift()).map(h => h.toLowerCase().trim());
  const rows = [];
  for (const line of lines) {
    if (line.trim() === '') continue;
    const values = parseLine(line);
    const obj = {};
    for (let i = 0; i < headers.length; i++) {
      obj[headers[i]] = values[i] !== undefined ? values[i] : '';
    }
    rows.push(obj);
  }
  return rows;
}

function normalizeHeader(h) {
  return h.replace(/[^a-z0-9]/gi, ' ').toLowerCase().trim();
}

function parseDateString(s) {
  if (!s) return '';
  const str = String(s).trim();
  if (!str) return '';

  const isoMatch = str.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = String(isoMatch[2]).padStart(2, '0');
    const d = String(isoMatch[3]).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) {
    const d = String(dmy[1]).padStart(2, '0');
    const m = String(dmy[2]).padStart(2, '0');
    const y = dmy[3];
    return `${y}-${m}-${d}`;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return '';
}

function mapRowToStudent(row) {
  const get = (names) => {
    for (const n of names) {
      if (row[n] !== undefined && row[n] !== '') return row[n];
    }
    return undefined;
  };

  const mapped = {
    nama: get(['nama', 'name']),
    nisn: get(['nisn']),
    nis: get(['nis']),
    jenisKelamin: get(['jenis kelamin', 'jenis_kelamin', 'gender']),
    kelasSekolah: get(['kelas', 'kelas sekolah', 'class']),
    alamat: get(['alamat', 'address']),
    tipe: get(['rencana', 'rencana setelah lulus']),
    universitasType: get(['tipe universitas', 'tipe_univ', 'tipeuniversitas']),
    universitas: get(['nama universitas', 'nama_univ', 'universitas']),
    jenjang: get(['jenjang']),
    jurusan: get(['jurusan']),
    bidangUsaha: get(['bidang usaha', 'bidang_usaha', 'bidangusaha']),
    usahaDibuat: get(['usaha yang akan dibuat', 'usaha_dibuat']),
    jenisUsaha: get(['jenis usaha', 'jenis_usaha']),
    rencanaMulai: get(['rencana mulai usaha', 'rencana_mulai']),
    alasan: get(['alasan berwirausaha', 'alasan_wirausaha', 'alasan']),
    perusahaan: get(['perusahaan', 'perusahaan yang dituju']),
    keterampilan: get(['keterampilan', 'keterampilan yang dimiliki']),
    jabatan: get(['jabatan', 'jabatan yang diinginkan']),
    bidang: get(['bidang', 'bidang yang diinginkan']),
  };

  Object.keys(mapped).forEach(k => {
    if (mapped[k] === undefined || mapped[k] === '') mapped[k] = '-';
  });

  return mapped;
}

function mapRowToAcara(row) {
  const get = (names) => {
    for (const n of names) {
      if (row[n] !== undefined && row[n] !== '') return row[n];
    }
    return undefined;
  };

  const rawTanggal = get(['tanggal', 'tanggal acara', 'tanggal_acara', 'date']);
  const tanggalIso = parseDateString(rawTanggal);

  const mapped = {
    namaAcara: get(['nama acara', 'nama_acara', 'namaacara', 'name']) || '-',
    tanggalAcara: tanggalIso || '',
    penanggungJawab: get(['penanggung jawab', 'penanggung_jawab', 'penanggungjawab']) || '-',
    lokasi: get(['lokasi', 'location']) || '-',
    jumlahPeserta: get(['jumlah peserta', 'jumlah_peserta', 'jumlahpeserta']) || '0',
    pengeluaran: get(['pengeluaran']) || '0',
  };

  return mapped;
}

// =================== CARI DATA ===================
window.addEventListener("DOMContentLoaded", async () => {
  const filterSelect = document.getElementById("filterSelect");
  const filterKelas = document.getElementById("filterKelas");
  const applyFilter = document.getElementById("applyFilter");
  const dataList = document.getElementById("dataList");
  const detailContent = document.getElementById("detailContent");
  const mainContent = document.getElementById("mainContent");
  const detailContainer = document.getElementById("detailContainer");
  const btnKembali = document.getElementById("btnKembali");
  const btnTambah = document.getElementById("btnTambah");
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const resetBtn = document.getElementById("resetBtn");

  if (!filterSelect || !dataList) return;

  let semuaData = [];
  let dataTerkini = [];

  btnTambah.addEventListener("click", () => {
    window.location.href = "tambahData.html";
  });

  // Load data
  semuaData = await window.electronAPI.loadData();
  
  // Set filter kelas default ke "XII - RPL 1" saat halaman dimuat
  if (filterKelas) {
    filterKelas.value = "XII - RPL 1";
  }
  
  // Tampilkan data dengan filter default secara OTOMATIS
  tampilkanData("semua", "", "XII - RPL 1");

  function tampilkanData(filter, search = "", kelasFilter = "XII - RPL 1") {
    console.log(`🔍 Filter: ${filter}, Kelas: "${kelasFilter}", Search: "${search}"`);
    
    // Hanya tampilkan data yang memiliki NAMA (data lengkap)
    const dataLengkap = semuaData.filter(item => item.nama && item.nama.trim() !== '');
    console.log(`📊 Total data lengkap: ${dataLengkap.length} dari ${semuaData.length}`);
    
    // Clear existing rows
    const existingRows = dataList.querySelectorAll('.data-row');
    existingRows.forEach(row => row.remove());

    const hasil = dataLengkap
      .map((d, originalIndex) => ({ ...d, originalIndex }))
      .filter((d) => {
        if (!d.nama) return false;

        const cocokFilter = filter === "semua" || (d.tipe && d.tipe === filter);
        
        console.log(`🔍 Siswa: "${d.nama}" | Kelas: "${d.kelasSekolah}" | Filter: "${kelasFilter}"`);
        
        // Perbaikan: Gunakan trim() dan cek apakah kelasSekolah ada
        const kelasSiswa = d.kelasSekolah ? d.kelasSekolah.trim() : '';
        const cocokKelas = kelasFilter === "semua" || kelasSiswa === kelasFilter;
        
        const namaLower = (d.nama || "").toLowerCase();
        const tipeLower = (d.tipe || "").toLowerCase();
        const searchLower = (search || "").toLowerCase();
        const cocokSearch = namaLower.includes(searchLower) || tipeLower.includes(searchLower);

        const cocok = cocokFilter && cocokSearch && cocokKelas;
        
        if (cocok) {
          console.log(`✅ "${d.nama}" LULUS filter: Kelas "${kelasSiswa}" cocok dengan "${kelasFilter}"`);
        }
        
        return cocok;
      });

    console.log(`✅ Ditemukan ${hasil.length} siswa untuk filter kelas "${kelasFilter}"`);
    
    dataTerkini = hasil;

    if (hasil.length === 0) {
      const noDataRow = document.createElement('div');
      noDataRow.className = 'data-row';
      noDataRow.innerHTML = `
        <span colspan="6" style="grid-column: 1 / -1; text-align: center; padding: 20px;">
          Tidak ada data ditemukan untuk kelas "${kelasFilter}".
        </span>
      `;
      dataList.appendChild(noDataRow);
      return;
    }

    hasil.forEach((item) => {
      const dataRow = document.createElement('div');
      dataRow.className = 'data-row';
      dataRow.innerHTML = `
        <span>${item.nama || '-'}</span>
        <span>${item.kelasSekolah || '-'}</span> <!-- Tampilkan kelas lengkap -->
        <span>${item.tipe || '-'}</span>
        <span>${getKeterangan(item)}</span>
        <div style="display: flex; border-radius: 20px;">
          <button class="btn-detail y" data-index="${item.originalIndex}">Detail</button>
          <button class="btn-edit y" data-index="${item.originalIndex}" style="background-color: #ffa500;">Edit</button>
          <button class="btn-hapus y" data-index="${item.originalIndex}" style="background-color: #ff4444;">Hapus</button>
        </div>
      `;
      dataList.appendChild(dataRow);
    });

    document.querySelectorAll(".btn-detail").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = e.target.getAttribute("data-index");
        tampilkanDetail(semuaData[index]);
      });
    });

    document.querySelectorAll(".btn-edit").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = e.target.getAttribute("data-index");
        editData(semuaData[index], index);
      });
    });

    document.querySelectorAll(".btn-hapus").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = e.target.getAttribute("data-index");
        hapusData(index);
      });
    });
  }

  function getKeterangan(item) {
    if (item.tipe === "kuliah") {
      return `${item.universitas || '-'} - ${item.jurusan || '-'}`;
    } else if (item.tipe === "wirausaha") {
      return `${item.bidangUsaha || '-'} - ${item.usahaDibuat || '-'}`;
    } else if (item.tipe === "kerja") {
      return `${item.perusahaan || '-'} - ${item.jabatan || '-'}`;
    }
    return '-';
  }

  function tampilkanDetail(item) {
    mainContent.style.display = "none";
    detailContent.style.display = "block";

    let html = `
      <div class="detail-section">
        <h3>👤 Data Diri</h3>
        <p><b>Nama Lengkap:</b> ${item.nama}</p>
        <p><b>NISN:</b> ${item.nisn}</p>
        <p><b>NIS:</b> ${item.nis || '-'}</p>
        <p><b>Jenis Kelamin:</b> ${item.jenisKelamin || '-'}</p>
        <p><b>Kelas:</b> ${item.kelasSekolah || '-'}</p>
        <p><b>Alamat:</b> ${item.alamat || '-'}</p>
      </div>
    `;

    if (item.tipe === "kuliah") {
      html += `
        <div class="detail-section">
          <h3>🎓 Data Kuliah</h3>
          <p><b>Jenis Universitas:</b> ${item.universitasType}</p>
          <p><b>Nama Universitas:</b> ${item.universitas}</p>
          <p><b>Jurusan:</b> ${item.jurusan}</p>
          <p><b>Jenjang:</b> ${item.jenjang}</p>
        </div>
      `;
    } else if (item.tipe === "wirausaha") {
      html += `
        <div class="detail-section">
          <h3>💼 Data Wirausaha</h3>
          <p><b>Bidang Usaha:</b> ${item.bidangUsaha}</p>
          <p><b>Usaha yang Akan Dibuat:</b> ${item.usahaDibuat}</p>
          <p><b>Jenis Usaha:</b> ${item.jenisUsaha}</p>
          <p><b>Rencana Mulai Usaha:</b> ${item.rencanaMulai}</p>
          <p><b>Alasan Berwirausaha:</b> ${item.alasan}</p>
        </div>
      `;
    } else if (item.tipe === "kerja") {
      html += `
        <div class="detail-section">
          <h3>💻 Data Kerja</h3>
          <p><b>Perusahaan:</b> ${item.perusahaan}</p>
          <p><b>Keterampilan:</b> ${item.keterampilan}</p>
          <p><b>Jabatan:</b> ${item.jabatan}</p>
          <p><b>Bidang:</b> ${item.bidang}</p>
          <p><b>Alasan Pekerjaan:</b> ${item.alasan}</p>
        </div>
      `;
    }

    detailContainer.innerHTML = html;
  }

function editData(item, index) {
  console.log('✏️ Mengedit data:', item, 'index:', index);
  
  const editForm = document.getElementById("editForm");
  const editRencana = document.getElementById("editRencana");
  const btnCancelEdit = document.getElementById("btnCancelEdit");
  const btnUpdate = document.getElementById("btnUpdate");
  
  if (!editForm) {
    console.error('❌ Form edit tidak ditemukan!');
    return;
  }

  // Data dasar
  document.getElementById("editNama").value = item.nama || '';
  document.getElementById("editNisn").value = item.nisn || '';
  document.getElementById("editNis").value = item.nis || '';
  document.getElementById("editAlamat").value = item.alamat || '';
  
  // Jenis Kelamin
  const editJenisKelamin = document.getElementById("editJenisKelamin");
  if (editJenisKelamin) {
    editJenisKelamin.value = item.jenisKelamin || 'Laki-laki';
  }
  
  // Kelas Sekolah
  const editKelasSelect = document.getElementById("editKelas");
  if (editKelasSelect) {
    editKelasSelect.value = item.kelasSekolah || '';
  }
  
  // Rencana
  editRencana.value = item.tipe || 'kuliah';

  // Sembunyikan main content, tampilkan form edit
  mainContent.style.display = "none";
  editForm.style.display = "block";

  // Tampilkan field sesuai rencana
  tampilkanFieldEdit(item.tipe);
  
  // Isi field sesuai tipe
  isiFieldEdit(item);

  // Event listener untuk perubahan rencana
  editRencana.addEventListener("change", (e) => {
    tampilkanFieldEdit(e.target.value);
  });

  // Tombol Cancel
  btnCancelEdit.onclick = () => {
    editForm.style.display = "none";
    mainContent.style.display = "block";
  };

  // Tombol Update
  btnUpdate.onclick = async () => {
    const rencana = editRencana.value;
    
    // Validasi data wajib
    if (!document.getElementById("editNama").value.trim() || 
        !document.getElementById("editNisn").value.trim()) {
      alert("Nama dan NISN wajib diisi!");
      return;
    }

    const updatedData = {
      nama: document.getElementById("editNama").value.trim(),
      nisn: document.getElementById("editNisn").value.trim(),
      nis: document.getElementById("editNis").value.trim() || '00000',
      jenisKelamin: editJenisKelamin ? editJenisKelamin.value : 'Laki-laki',
      kelasSekolah: editKelasSelect ? editKelasSelect.value : '',
      alamat: document.getElementById("editAlamat").value.trim() || '-',
      tipe: rencana,
    };

    // Isi field sesuai tipe rencana
    if (rencana === "kuliah") {
      updatedData.universitasType = document.getElementById("editUnivType").value;
      updatedData.universitas = document.getElementById("editUnivName").value.trim();
      updatedData.jurusan = document.getElementById("editJurusan").value.trim();
      updatedData.jenjang = document.getElementById("editJenjang").value.trim();
      
      // Set field lain sebagai "-"
      updatedData.bidangUsaha = "-";
      updatedData.usahaDibuat = "-";
      updatedData.jenisUsaha = "-";
      updatedData.rencanaMulai = "-";
      updatedData.alasan = "-";
      updatedData.perusahaan = "-";
      updatedData.keterampilan = "-";
      updatedData.jabatan = "-";
      updatedData.bidang = "-";
      
    } else if (rencana === "wirausaha") {
      updatedData.bidangUsaha = document.getElementById("editBidangUsaha").value.trim();
      updatedData.usahaDibuat = document.getElementById("editUsahaDibuat").value.trim();
      updatedData.jenisUsaha = document.getElementById("editJenisUsaha").value.trim();
      updatedData.rencanaMulai = document.getElementById("editRencanaMulai").value.trim();
      updatedData.alasan = document.getElementById("editAlasanWirausaha").value.trim();
      
      // Set field lain sebagai "-"
      updatedData.universitasType = "-";
      updatedData.universitas = "-";
      updatedData.jurusan = "-";
      updatedData.jenjang = "-";
      updatedData.perusahaan = "-";
      updatedData.keterampilan = "-";
      updatedData.jabatan = "-";
      updatedData.bidang = "-";
      
    } else if (rencana === "kerja") {
      updatedData.perusahaan = document.getElementById("editPerusahaan").value.trim();
      updatedData.keterampilan = document.getElementById("editKeterampilan").value.trim();
      updatedData.jabatan = document.getElementById("editJabatan").value.trim();
      updatedData.bidang = document.getElementById("editBidang").value.trim();
      updatedData.alasan = document.getElementById("editAlasanKerja").value.trim();
      
      // Set field lain sebagai "-"
      updatedData.universitasType = "-";
      updatedData.universitas = "-";
      updatedData.jurusan = "-";
      updatedData.jenjang = "-";
      updatedData.bidangUsaha = "-";
      updatedData.usahaDibuat = "-";
      updatedData.jenisUsaha = "-";
      updatedData.rencanaMulai = "-";
    }

    try {
      console.log('💾 Mengupdate data:', updatedData);
      
      const result = await window.electronAPI.updateData(index, updatedData);
      
      alert(result || 'Data berhasil diupdate!');
      
      // Refresh data
      editForm.style.display = "none";
      mainContent.style.display = "block";
      semuaData = await window.electronAPI.loadData();
      
      // Terapkan filter yang sama
      tampilkanData(
        filterSelect.value, 
        searchInput ? searchInput.value : "", 
        filterKelas.value
      );
      
    } catch (error) {
      console.error('❌ Error update:', error);
      alert('Gagal mengupdate data: ' + (error.message || 'Unknown error'));
    }
  };
}

  async function hapusData(index) {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      try {
        const result = await window.electronAPI.deleteData(index);
        alert(result || 'Data berhasil dihapus!');
        semuaData = await window.electronAPI.loadData();
        tampilkanData(filterSelect.value, searchInput ? searchInput.value : "", filterKelas.value);
      } catch (error) {
        console.error('Error detail:', error);
        alert('Gagal menghapus data: ' + (error.message || 'Unknown error'));
      }
    }
  }

  btnKembali.addEventListener("click", () => {
    detailContent.style.display = "none";
    mainContent.style.display = "block";
  });

  // Event listener untuk applyFilter (opsional - bisa dihapus jika mau otomatis)
  if (applyFilter) {
    applyFilter.addEventListener("click", () => {
      tampilkanData(filterSelect.value, searchInput ? searchInput.value : "", filterKelas.value);
    });
  }

  // Event listener untuk perubahan filter (otomatis saat dropdown berubah)
  if (filterSelect) {
    filterSelect.addEventListener("change", () => {
      tampilkanData(filterSelect.value, searchInput ? searchInput.value : "", filterKelas.value);
    });
  }

  if (filterKelas) {
    filterKelas.addEventListener("change", () => {
      console.log(`🔄 Filter kelas berubah ke: "${filterKelas.value}"`);
      tampilkanData(filterSelect.value, searchInput ? searchInput.value : "", filterKelas.value);
    });
  }

  if (searchBtn && searchInput) {
    searchBtn.addEventListener("click", () => {
      tampilkanData(filterSelect.value, searchInput.value, filterKelas.value);
    });
  }

  // Juga tambahkan event listener untuk Enter pada search input
  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        tampilkanData(filterSelect.value, searchInput.value, filterKelas.value);
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      searchInput.value = "";
      filterSelect.value = "semua";
      filterKelas.value = "XII - RPL 1"; // Reset ke default "XII - RPL 1"
      tampilkanData("semua", "", "XII - RPL 1");
    });
  }

  // Export ke Excel
  const btnExport = document.getElementById("btnExport");
  if (btnExport) {
    btnExport.addEventListener("click", () => {
      exportToExcel(semuaData);
    });
  }

  function exportToExcel(data) {
    // FILTER: Hanya ambil data yang memiliki NAMA (data lengkap)
    const dataLengkap = data.filter(item => 
      item.nama && item.nisn && item.kelasSekolah
    );
    
    console.log(`📊 Mengeksport ${dataLengkap.length} dari ${data.length} data`);
    
    const headers = [
      "No", "Nama", "NISN", "NIS", "Jenis Kelamin", "Kelas", "Alamat", "Rencana",
      "Tipe Universitas", "Nama Universitas", "Jenjang", "Jurusan",
      "Bidang Usaha", "Usaha yang Akan Dibuat", "Jenis Usaha", "Rencana Mulai Usaha", "Alasan Berwirausaha",
      "Perusahaan", "Keterampilan", "Jabatan", "Bidang", "Alasan Pekerjaan"
    ];

    const csvContent = [];
    csvContent.push(headers.join(","));

    dataLengkap.forEach((item, index) => {
      const row = [
        index + 1,
        item.nama || "-",
        item.nisn || "-",
        item.nis || "-",
        item.jenisKelamin || "-",
        item.kelasSekolah || "-",
        item.alamat || "-",
        item.tipe || "-",
        item.universitasType || "-",
        item.universitas || "-",
        item.jenjang || "-",
        item.jurusan || "-",
        item.bidangUsaha || "-",
        item.usahaDibuat || "-",
        item.jenisUsaha || "-",
        item.rencanaMulai || "-",
        item.alasan || "-",
        item.perusahaan || "-",
        item.keterampilan || "-",
        item.jabatan || "-",
        item.bidang || "-",
        item.alasan || "-"
      ];
      csvContent.push(row.map(cell => `"${cell}"`).join(","));
    });

    const csvData = csvContent.join("\n");
    const blob = new Blob(["\ufeff" + csvData], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Data_Siswa_${new Date().getTime()}.csv`);
    link.click();
  }

  // Import CSV (Siswa)
  const btnImport = document.getElementById("btnImport");
  const importFileSiswa = document.getElementById("importFileSiswa");
  if (btnImport && importFileSiswa) {
    btnImport.addEventListener("click", () => importFileSiswa.click());
    importFileSiswa.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const text = evt.target.result;
          const rows = parseCSV(text);
          if (!rows.length) return alert('File CSV kosong atau tidak valid');

          let saved = 0;
          let failed = 0;
          for (const r of rows) {
            const student = mapRowToStudent(r);
            try {
              await window.electronAPI.saveData(student);
              saved++;
            } catch (err) {
              console.error('Gagal menyimpan baris:', r, err);
              failed++;
            }
          }
          alert(`Import selesai. Berhasil: ${saved}, Gagal: ${failed}`);
          semuaData = await window.electronAPI.loadData();
          tampilkanData(filterSelect.value, searchInput ? searchInput.value : "", filterKelas.value);
        } catch (err) {
          console.error(err);
          alert('Terjadi kesalahan saat memproses file CSV');
        }
      };
      reader.readAsText(file, 'utf-8');
      importFileSiswa.value = '';
    });
  }
});

// =================== LAPORAN ACARA ===================
window.addEventListener("DOMContentLoaded", async () => {
  const tambahBtn = document.getElementById("tambahBtn");
  const formArea = document.getElementById("formArea");
  const tableArea = document.getElementById("tableArea");
  const searchInput = document.getElementById("searchInput");
  const submitAcara = document.getElementById("submitAcara");
  const cancelBtn = document.getElementById("cancelBtn");
  const dataListAcara = document.getElementById("dataListAcara");

  if (!tambahBtn || !tableArea) return;

  let semuaAcara = [];
  let acaraTerkini = [];

  async function loadAcara() {
    try {
      semuaAcara = await window.electronAPI.loadAcara();
      acaraTerkini = [...semuaAcara];
      tampilkanTabelAcara(semuaAcara);
    } catch (err) {
      alert("Gagal memuat data acara: " + err.message);
    }
  }

  function tampilkanTabelAcara(data) {
    dataListAcara.innerHTML = "";
    acaraTerkini = data;

    if (data.length === 0) {
      const noDataRow = document.createElement('div');
      noDataRow.className = 'data-row';
      noDataRow.innerHTML = `
        <span style="grid-column: 1 / -1; text-align: center; padding: 20px;">
          Tidak ada laporan acara.
        </span>
      `;
      dataListAcara.appendChild(noDataRow);
      return;
    }

    data.forEach((acara, index) => {
      const dataRow = document.createElement('div');
      dataRow.className = 'data-row';
      dataRow.innerHTML = `
        <span>${acara.namaAcara || '-'}</span>
        <span>${formatTanggal(acara.tanggalAcara) || '-'}</span>
        <span>${acara.penanggungJawab || '-'}</span>
        <span>${acara.lokasi || '-'}</span>
        <span>${acara.jumlahPeserta || '0'}</span>
        <span>Rp ${formatAngka(acara.pengeluaran) || '0'}</span>
        <div class="btn-action">
          <button class="btn-edit-acara" data-index="${index}">Edit</button>
          <button class="btn-hapus-acara" data-index="${index}">Hapus</button>
        </div>
      `;
      dataListAcara.appendChild(dataRow);
    });

    document.querySelectorAll(".btn-edit-acara").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = e.target.getAttribute("data-index");
        editAcara(acaraTerkini[index], index);
      });
    });

    document.querySelectorAll(".btn-hapus-acara").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = e.target.getAttribute("data-index");
        hapusAcara(index);
      });
    });
  }

  function formatTanggal(tanggal) {
    if (!tanggal) return '-';
    return new Date(tanggal).toLocaleDateString('id-ID');
  }

  function formatAngka(angka) {
    if (!angka || angka === '0') return '0';
    return parseInt(angka).toLocaleString('id-ID');
  }

  function editAcara(acara, index) {
    document.getElementById("namaAcara").value = acara.namaAcara || '';
    document.getElementById("tanggalAcara").value = acara.tanggalAcara || '';
    document.getElementById("penanggungJawab").value = acara.penanggungJawab || '';
    document.getElementById("lokasi").value = acara.lokasi || '';
    document.getElementById("jumlahPeserta").value = acara.jumlahPeserta || '';
    document.getElementById("pengeluaran").value = acara.pengeluaran || '';

    submitAcara.textContent = 'Update Acara';
    submitAcara.onclick = async () => {
      await updateAcara(index);
    };

    formArea.style.display = "block";
    tableArea.style.display = "none";
    tambahBtn.style.display = "none";
  }

  async function updateAcara(index) {
    const namaAcara = document.getElementById("namaAcara").value.trim();
    const tanggalAcara = document.getElementById("tanggalAcara").value;
    const penanggungJawab = document.getElementById("penanggungJawab").value.trim();
    const lokasi = document.getElementById("lokasi").value.trim();
    const jumlahPeserta = document.getElementById("jumlahPeserta").value;
    const pengeluaran = document.getElementById("pengeluaran").value.trim();

    if (!namaAcara || !tanggalAcara || !penanggungJawab || !lokasi) {
      alert("Harap isi semua field yang diperlukan!");
      return;
    }

    const dataAcara = {
      namaAcara,
      tanggalAcara,
      penanggungJawab,
      lokasi,
      jumlahPeserta: jumlahPeserta || "0",
      pengeluaran: pengeluaran || "0",
    };

    try {
      const result = await window.electronAPI.updateAcara(index, dataAcara);
      alert(result);
      formArea.style.display = "none";
      tableArea.style.display = "block";
      tambahBtn.style.display = "inline-block";
      resetForm();
      loadAcara();
    } catch (err) {
      alert("Gagal mengupdate acara: " + err.message);
    }
  }

  async function hapusAcara(index) {
    if (confirm('Apakah Anda yakin ingin menghapus acara ini?')) {
      try {
        const result = await window.electronAPI.deleteAcara(index);
        alert(result);
        loadAcara();
      } catch (err) {
        alert("Gagal menghapus acara: " + err.message);
      }
    }
  }

  async function tambahAcaraBaru() {
    const namaAcara = document.getElementById("namaAcara").value.trim();
    const tanggalAcara = document.getElementById("tanggalAcara").value;
    const penanggungJawab = document.getElementById("penanggungJawab").value.trim();
    const lokasi = document.getElementById("lokasi").value.trim();
    const jumlahPeserta = document.getElementById("jumlahPeserta").value;
    const pengeluaran = document.getElementById("pengeluaran").value.trim();

    if (!namaAcara) return alert("Nama acara harus diisi!");
    if (!tanggalAcara) return alert("Tanggal acara harus diisi!");
    if (!penanggungJawab) return alert("Penanggung jawab harus diisi!");
    if (!lokasi) return alert("Lokasi acara harus diisi!");

    const dataAcara = {
      namaAcara,
      tanggalAcara,
      penanggungJawab,
      lokasi,
      jumlahPeserta: jumlahPeserta || "0",
      pengeluaran: pengeluaran || "0",
    };

    try {
      const result = await window.electronAPI.saveAcara(dataAcara);
      alert(result);
      formArea.style.display = "none";
      tableArea.style.display = "block";
      tambahBtn.style.display = "inline-block";
      resetForm();
      loadAcara();
    } catch (err) {
      alert("Gagal menyimpan acara: " + err.message);
    }
  }

  tambahBtn.addEventListener("click", () => {
    resetForm();
    submitAcara.textContent = 'Selesai';
    submitAcara.onclick = tambahAcaraBaru;
    formArea.style.display = "block";
    tableArea.style.display = "none";
    tambahBtn.style.display = "none";
  });

  cancelBtn.addEventListener("click", () => {
    formArea.style.display = "none";
    tableArea.style.display = "block";
    tambahBtn.style.display = "inline-block";
    resetForm();
  });

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const keyword = e.target.value.toLowerCase();
      const filtered = semuaAcara.filter(
        (acara) =>
          (acara.namaAcara || "").toLowerCase().includes(keyword) ||
          (acara.penanggungJawab || "").toLowerCase().includes(keyword) ||
          (acara.lokasi || "").toLowerCase().includes(keyword)
      );
      tampilkanTabelAcara(filtered);
    });
  }

  // Export ke Excel
  const btnExportAcara = document.getElementById("btnExportAcara");
  if (btnExportAcara) {
    btnExportAcara.addEventListener("click", () => {
      exportAcaraToExcel(semuaAcara);
    });
  }

  // Import CSV (Acara)
  const btnImportAcara = document.getElementById('btnImportAcara');
  const importFileAcara = document.getElementById('importFileAcara');
  if (btnImportAcara && importFileAcara) {
    btnImportAcara.addEventListener('click', () => importFileAcara.click());
    importFileAcara.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const text = evt.target.result;
          const rows = parseCSV(text);
          if (!rows.length) return alert('File CSV kosong atau tidak valid');

          let saved = 0;
          let failed = 0;
          for (const r of rows) {
            const acara = mapRowToAcara(r);
            try {
              await window.electronAPI.saveAcara(acara);
              saved++;
            } catch (err) {
              console.error('Gagal menyimpan acara:', r, err);
              failed++;
            }
          }
          alert(`Import acara selesai. Berhasil: ${saved}, Gagal: ${failed}`);
          loadAcara();
        } catch (err) {
          console.error(err);
          alert('Terjadi kesalahan saat memproses file CSV acara');
        }
      };
      reader.readAsText(file, 'utf-8');
      importFileAcara.value = '';
    });
  }

  function resetForm() {
    document.getElementById("namaAcara").value = "";
    document.getElementById("tanggalAcara").value = "";
    document.getElementById("penanggungJawab").value = "";
    document.getElementById("lokasi").value = "";
    document.getElementById("jumlahPeserta").value = "";
    document.getElementById("pengeluaran").value = "";
    submitAcara.textContent = 'Selesai';
    submitAcara.onclick = tambahAcaraBaru;
  }

  // Fungsi Export Acara ke Excel
  function exportAcaraToExcel(data) {
    const headers = [
      "No",
      "Nama Acara",
      "Tanggal",
      "Penanggung Jawab",
      "Lokasi",
      "Jumlah Peserta",
      "Pengeluaran"
    ];

    const csvContent = [];
    csvContent.push(headers.join(","));

    data.forEach((acara, index) => {
      const tanggalFormat = acara.tanggalAcara ? new Date(acara.tanggalAcara).toLocaleDateString('id-ID') : "-";
      const row = [
        index + 1,
        acara.namaAcara || "-",
        tanggalFormat,
        acara.penanggungJawab || "-",
        acara.lokasi || "-",
        acara.jumlahPeserta || "0",
        acara.pengeluaran || "0"
      ];
      csvContent.push(row.map(cell => `"${cell}"`).join(","));
    });

    const csvData = csvContent.join("\n");
    const blob = new Blob(["\ufeff" + csvData], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Acara_${new Date().getTime()}.csv`);
    link.click();
  }

  loadAcara();
});

// ==========================
// FUNGSI TAMBAH DATA (SISWA)
// ==========================
window.addEventListener("DOMContentLoaded", () => {
  const form1 = document.getElementById("form1");
  if (!form1) return;

  const form2 = document.getElementById("form2");
  const kuliahForm = document.getElementById("kuliahForm");
  const wirausahaForm = document.getElementById("wirausahaForm");
  const kerjaForm = document.getElementById("kerjaForm");
  const next1Btn = document.getElementById("next1");

  if (!next1Btn) {
    console.error("Tombol next1 tidak ditemukan!");
    return;
  }

  let dataSiswa = {};
  let isEditMode = false;
  let editIndex = -1;

  // CEK MODE EDIT
  const editDataStorage = localStorage.getItem('editData');
  if (editDataStorage) {
    isEditMode = true;
    const { data, index } = JSON.parse(editDataStorage);
    editIndex = index;
    dataSiswa = { ...data };

    // ISI FORM1 DENGAN DATA LAMA
    document.getElementById("nama").value = data.nama || '';
    document.getElementById("nisn").value = data.nisn || '';
    document.getElementById("alamat").value = data.alamat || '';
    // prefill new school jurusan/kelas selectors if present
    const jurusanEl = document.getElementById('jurusanSekolah');
    const kelasEl = document.getElementById('kelasSekolah');
    if (jurusanEl) jurusanEl.value = data.jurusanSekolah || jurusanEl.value || 'RPL';
    if (kelasEl) kelasEl.value = data.kelasSekolah || kelasEl.value || '1';

    // LANGSUNG KE FORM2
    form1.style.display = "none";
    form2.style.display = "block";
    handleFormType(data.tipe);

    localStorage.removeItem('editData');
  }

  function handleFormType(type) {
    if (type === "kuliah") {
      form2.style.display = "none";
      kuliahForm.style.display = "block";
      document.getElementById("univType").value = dataSiswa.universitasType || 'negeri';
      document.getElementById("univName").value = dataSiswa.universitas || '';
      document.getElementById("jurusan").value = dataSiswa.jurusan || '';
      document.getElementById("jenjang").value = dataSiswa.jenjang || '';
    } else if (type === "wirausaha") {
      form2.style.display = "none";
      wirausahaForm.style.display = "block";
      document.getElementById("bidangUsaha").value = dataSiswa.bidangUsaha || '';
      document.getElementById("usahaDibuat").value = dataSiswa.usahaDibuat || '';
      document.getElementById("jenisUsaha").value = dataSiswa.jenisUsaha || '';
      document.getElementById("rencanaMulai").value = dataSiswa.rencanaMulai || '';
      document.getElementById("alasanWirausaha").value = dataSiswa.alasan || '';
    } else if (type === "kerja") {
      form2.style.display = "none";
      kerjaForm.style.display = "block";
      document.getElementById("perusahaan").value = dataSiswa.perusahaan || '';
      document.getElementById("keterampilan").value = dataSiswa.keterampilan || '';
      document.getElementById("jabatan").value = dataSiswa.jabatan || '';
      document.getElementById("bidang").value = dataSiswa.bidang || '';
      document.getElementById("alasanKerja").value = dataSiswa.alasan || '';
    }
  }

  // TOMBOL SELANJUTNYA
  next1Btn.addEventListener("click", (e) => {
    e.preventDefault();
    const nama = document.getElementById("nama").value.trim();
    const nisn = document.getElementById("nisn").value.trim();
    const alamat = document.getElementById("alamat").value.trim();

    if (!nama || !nisn || !alamat) {
      alert("Semua field wajib diisi!");
      return;
    }

    // include jurusanSekolah and kelasSekolah from selectors
    const jurusanSekolah = document.getElementById('jurusanSekolah') ? document.getElementById('jurusanSekolah').value : '-';
    const kelasSekolah = document.getElementById('kelasSekolah') ? document.getElementById('kelasSekolah').value : '-';

    dataSiswa = { nama, nisn, alamat, jurusanSekolah, kelasSekolah };
    form1.style.display = "none";
    form2.style.display = "block";
  });

  // PILIHAN RENCANA
  document.querySelectorAll(".pilihan").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const type = btn.getAttribute("data-type");
      form2.style.display = "none";
      dataSiswa.tipe = type;
      handleFormType(type);
    });
  });

  // FORM KULIAH
  const submitKuliah = document.getElementById("submitKuliah");
  if (submitKuliah) {
    submitKuliah.addEventListener("click", async (e) => {
      e.preventDefault();
      const data = {
        ...dataSiswa,
        universitasType: document.getElementById("univType").value,
        universitas: document.getElementById("univName").value,
        jurusan: document.getElementById("jurusan").value,
        jenjang: document.getElementById("jenjang").value,
      };
      await simpanData(data);
    });
  }

  // FORM WIRAUSAHA
  const submitWirausaha = document.getElementById("submitWirausaha");
  if (submitWirausaha) {
    submitWirausaha.addEventListener("click", async (e) => {
      e.preventDefault();
      const data = {
        ...dataSiswa,
        bidangUsaha: document.getElementById("bidangUsaha").value,
        usahaDibuat: document.getElementById("usahaDibuat").value,
        jenisUsaha: document.getElementById("jenisUsaha").value,
        rencanaMulai: document.getElementById("rencanaMulai").value,
        alasan: document.getElementById("alasanWirausaha").value,
      };
      await simpanData(data);
    });
  }

  // FORM KERJA
  const submitKerja = document.getElementById("submitKerja");
  if (submitKerja) {
    submitKerja.addEventListener("click", async (e) => {
      e.preventDefault();
      const data = {
        ...dataSiswa,
        perusahaan: document.getElementById("perusahaan").value,
        keterampilan: document.getElementById("keterampilan").value,
        jabatan: document.getElementById("jabatan").value,
        bidang: document.getElementById("bidang").value,
        alasan: document.getElementById("alasanKerja").value,
      };
      await simpanData(data);
    });
  }

  // FUNGSI SIMPAN DATA
  async function simpanData(data) {
    try {
      if (isEditMode) {
        const result = await window.electronAPI.updateData(editIndex, data);
        alert(result || "Data berhasil diupdate!");
      } else {
        const result = await window.electronAPI.saveData(data);
        alert(result || "Data berhasil disimpan!");
      }
      location.href = "cariData.html";
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan data!");
    }
  }
});

// =================== HALAMAN TENTANG (FIXED) ===================
document.addEventListener("DOMContentLoaded", () => {
  const pembuatBtn = document.getElementById("btnPembuat");
  const aplikasiBtn = document.getElementById("btnAplikasi");

  const pembuatBox = document.getElementById("contentPembuat");   // ← FIXED
  const aplikasiBox = document.getElementById("contentAplikasi"); // ← FIXED

  if (pembuatBtn && aplikasiBtn && pembuatBox && aplikasiBox) {

    pembuatBtn.addEventListener("click", () => {
      pembuatBox.style.display = "block";
      aplikasiBox.style.display = "none";
    });

    aplikasiBtn.addEventListener("click", () => {
      aplikasiBox.style.display = "block";
      pembuatBox.style.display = "none";
    });
  }
});

// =================== EDIT FORM HANDLERS ===================
window.addEventListener("DOMContentLoaded", () => {
  const editForm = document.getElementById("editForm");
  const editRencana = document.getElementById("editRencana");
  const editKuliahFields = document.getElementById("editKuliahFields");
  const editWirausahaFields = document.getElementById("editWirausahaFields");
  const editKerjaFields = document.getElementById("editKerjaFields");
  const btnUpdate = document.getElementById("btnUpdate");
  const btnCancelEdit = document.getElementById("btnCancelEdit");

  if (editRencana) {
    editRencana.addEventListener("change", () => {
      const selected = editRencana.value;
      editKuliahFields.style.display = selected === "kuliah" ? "block" : "none";
      editWirausahaFields.style.display = selected === "wirausaha" ? "block" : "none";
      editKerjaFields.style.display = selected === "kerja" ? "block" : "none";
    });
  }

  if (btnUpdate) {
    btnUpdate.addEventListener("click", () => {
      const updatedData = {
        nama: document.getElementById("editNama").value,
        nisn: document.getElementById("editNisn").value,
        nis: document.getElementById("editNis").value,
        jenisKelamin: document.getElementById("editJenisKelamin").value,
        kelasSekolah: document.getElementById("editKelas").value,
        alamat: document.getElementById("editAlamat").value,
        tipe: editRencana.value,
        universitasType: document.getElementById("editUnivType")?.value || "",
        universitas: document.getElementById("editUnivName")?.value || "",
        jenjang: document.getElementById("editJenjang")?.value || "",
        jurusan: document.getElementById("editJurusan")?.value || "",
        bidangUsaha: document.getElementById("editBidangUsaha")?.value || "",
        usahaDibuat: document.getElementById("editUsahaDibuat")?.value || "",
        jenisUsaha: document.getElementById("editJenisUsaha")?.value || "",
        rencanaMulai: document.getElementById("editRencanaMulai")?.value || "",
        perusahaan: document.getElementById("editPerusahaan")?.value || "",
        keterampilan: document.getElementById("editKeterampilan")?.value || "",
        jabatan: document.getElementById("editJabatan")?.value || "",
        bidang: document.getElementById("editBidang")?.value || "",
      };

      console.log("Data yang diperbarui:", updatedData);
      showNotification("success", "Data berhasil diperbarui!");
      editForm.style.display = "none";
      mainContent.style.display = "block";
    });
  }

  if (btnCancelEdit) {
    btnCancelEdit.addEventListener("click", () => {
      editForm.style.display = "none";
      mainContent.style.display = "block";
    });
  }
});

// =================== TAMBAH DATA HANDLERS ===================
window.addEventListener("DOMContentLoaded", () => {
  const pilihKelas = document.getElementById("pilihKelas");
  const pilihSiswa = document.getElementById("pilihSiswa");

  if (pilihKelas && pilihSiswa) {
    pilihKelas.addEventListener("change", async () => {
      const kelas = pilihKelas.value;

      if (kelas) {
        pilihSiswa.disabled = false;
        pilihSiswa.innerHTML = "<option value=''>-- Memuat data siswa --</option>";

        try {
          // Simulasi pengambilan data siswa berdasarkan kelas
          const siswaData = await window.electronAPI.getSiswaByKelas(kelas);

          pilihSiswa.innerHTML = siswaData
            .map((siswa) => `<option value="${siswa.nis}">${siswa.nama}</option>`)
            .join("");
        } catch (error) {
          console.error("Gagal memuat data siswa:", error);
          pilihSiswa.innerHTML = "<option value=''>-- Gagal memuat data siswa --</option>";
        }
      } else {
        pilihSiswa.disabled = true;
        pilihSiswa.innerHTML = "<option value=''>-- Pilih Kelas terlebih dahulu --</option>";
      }
    });
  }
});

// =====================
// EDIT WORD (FINAL FIX)
// =====================
window.addEventListener('DOMContentLoaded', async () => {
  const templateSelect = document.getElementById('templateSelect');
  const btnGenerate = document.getElementById('btnGenerate');
  const previewPdf = document.getElementById('previewPdf');
  const previewPlaceholder = document.getElementById('previewPlaceholder');
  const pdfError = document.getElementById('pdfError');
  const placeholdersContainer = document.getElementById('placeholdersContainer');
  const noPlaceholders = document.getElementById('noPlaceholders');

  if (!templateSelect) return;

  let selectedDocxPath = null;

  console.log('🚀 editWord initialized');

  // ===== LOAD TEMPLATES =====
  try {
    const documents = await window.electronAPI.getAvailableDocuments();

    templateSelect.innerHTML = '<option value="">📋 Pilih Template...</option>';

    if (!documents.length) {
      templateSelect.innerHTML += '<option value="">(Tidak ada template)</option>';
      return;
    }

    // Filter hanya yang memiliki PDF
    documents
      .filter(doc => doc.hasPdf)
      .forEach(doc => {
        const option = document.createElement('option');
        option.value = doc.docxPath; // DOCX tetap sebagai value
        option.textContent = `📄 ${doc.displayName}`;
        option.dataset.pdf = doc.pdfPath;
        option.dataset.base = doc.baseName;
        templateSelect.appendChild(option);
      });

  } catch (err) {
    console.error('❌ Gagal load template:', err);
  }

  // ===== TEMPLATE CHANGE =====
  templateSelect.addEventListener('change', async (e) => {
    const docxPath = e.target.value;
    if (!docxPath) return;

    selectedDocxPath = docxPath;

    // Gunakan PDF path dari dataset atau buat default
    const selectedOption = e.target.selectedOptions[0];
    const pdfPath = selectedOption.dataset.pdf || 
                    docxPath.replace('Templates', 'View').replace('.docx', '.pdf');

    await loadPdfPreview(pdfPath);
    await loadPlaceholdersFromDocx(docxPath);
  });

  // ===== PDF PREVIEW =====
  async function loadPdfPreview(pdfPath) {
    previewPdf.style.display = 'none';
    previewPlaceholder.style.display = 'none';
    pdfError.style.display = 'none';

    const exists = await window.electronAPI.checkPdfExists(pdfPath);

    if (!exists) {
      pdfError.style.display = 'block';
      return;
    }

    previewPdf.src = `${pdfPath}#toolbar=0&navpanes=0&scrollbar=0`;
    previewPdf.style.display = 'block';
  }

  // ===== LOAD PLACEHOLDERS =====
  async function loadPlaceholdersFromDocx(docxPath) {
    placeholdersContainer.innerHTML = '';
    noPlaceholders.style.display = 'none';

    const placeholders = await window.electronAPI.extractPlaceholders(docxPath);

    if (!placeholders || placeholders.length === 0) {
      noPlaceholders.style.display = 'block';
      return;
    }

    placeholders.forEach(ph => {
      const wrap = document.createElement('div');
      wrap.className = 'placeholder-form';

      const label = document.createElement('label');
      label.textContent = ph;

      const input = document.createElement('input');
      input.type = 'text';
      input.dataset.placeholder = ph;

      wrap.appendChild(label);
      wrap.appendChild(input);
      placeholdersContainer.appendChild(wrap);
    });
  }

  // ===== EXPORT =====
  btnGenerate.addEventListener('click', async () => {
    if (!selectedDocxPath) {
      alert('Pilih template terlebih dahulu');
      return;
    }

    const data = {};
    document.querySelectorAll('[data-placeholder]').forEach(el => {
      data[el.dataset.placeholder] = el.value || '';
    });

    await window.electronAPI.saveDocument(selectedDocxPath, data);
  });
});