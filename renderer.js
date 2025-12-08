// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  if (window.electronAPI) {
    window.electronAPI.logError?.('Global error: ' + event.error?.message);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  if (window.electronAPI) {
    window.electronAPI.logError?.('Unhandled rejection: ' + event.reason?.message);
  }
});

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
// Small CSV parser (handles quoted fields and double quotes)
function parseCSV(text) {
  const lines = text.split(/\r\n|\n|\r/);
  // remove empty trailing lines
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
          i++; // skip escaped quote
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

// Try to parse common date formats and return ISO date string (YYYY-MM-DD)
function parseDateString(s) {
  if (!s) return '';
  const str = String(s).trim();
  if (!str) return '';

  // ISO-like: 2023-08-30 or 2023/08/30
  const isoMatch = str.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = String(isoMatch[2]).padStart(2, '0');
    const d = String(isoMatch[3]).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Common DMY: 30/08/2023 or 30-08-2023 -> assume day-month-year
  const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) {
    const d = String(dmy[1]).padStart(2, '0');
    const m = String(dmy[2]).padStart(2, '0');
    const y = dmy[3];
    return `${y}-${m}-${d}`;
  }

  // Try Date.parse fallback for other formats (e.g., 'Aug 30, 2023')
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  // Could not parse -> return empty string to avoid invalid dates
  return '';
}

function mapRowToStudent(row) {
  // row keys are lowercase header texts
  const get = (names) => {
    for (const n of names) {
      if (row[n] !== undefined && row[n] !== '') return row[n];
    }
    return undefined;
  };

  // common header variants
  const mapped = {
    nama: get(['nama', 'name']),
    nisn: get(['nisn']),
    jurusanSekolah: get(['jurusan sekolah', 'jurusan_sekolah', 'jurusan', 'major']),
    kelasSekolah: get(['kelas', 'kelas sekolah', 'class']),
    alamat: get(['alamat', 'address']),
    tipe: get(['rencana', 'rencana setelah lulus', 'rencana']),
    universitasType: get(['tipe universitas', 'tipe-univ', 'tipe_univ', 'tipeuniversitas']),
    universitas: get(['nama universitas', 'nama-univ', 'universitas', 'namauniversitas']),
    jenjang: get(['jenjang']),
    jurusan: get(['jurusan']),
    bidangUsaha: get(['bidang usaha', 'bidang-usaha', 'bidangusaha']),
    usahaDibuat: get(['usaha yang akan dibuat', 'usaha-dibuat', 'usahadibuat']),
    jenisUsaha: get(['jenis usaha', 'jenis-usaha']),
    rencanaMulai: get(['rencana mulai usaha', 'rencana-mulai']),
    alasan: get(['alasan berwirausaha', 'alasan-wirausaha', 'alasan pekerjaan', 'alasan-kerja', 'alasan']),
    perusahaan: get(['perusahaan', 'perusahaan yang dituju']),
    keterampilan: get(['keterampilan', 'keterampilan yang dimiliki']),
    jabatan: get(['jabatan', 'jabatan yang diinginkan']),
    bidang: get(['bidang', 'bidang yang diinginkan']),
  };

  // fallback defaults
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
    // Use ISO date (YYYY-MM-DD) or empty string if not parseable
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
  const filterJurusan = document.getElementById("filterJurusan");
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

  semuaData = await window.electronAPI.loadData();
  dataTerkini = [...semuaData];

  function tampilkanData(filter, search = "", jurusanFilter = "semua", kelasFilter = "semua") {

    const existingRows = dataList.querySelectorAll('.data-row');
    existingRows.forEach(row => row.remove());

    const hasil = semuaData
      .map((d, originalIndex) => ({ ...d, originalIndex }))
      .filter((d) => {
        if (!d.nama) return false;

        const cocokFilter = filter === "semua" || (d.tipe && d.tipe === filter);
        const cocokJurusan = jurusanFilter === "semua" || ((d.jurusanSekolah || d.jurusan || '').toString().toLowerCase() === jurusanFilter.toString().toLowerCase());
        const cocokKelas = kelasFilter === "semua" || ((d.kelasSekolah || d.kelas || '').toString() === kelasFilter.toString());
        const namaLower = (d.nama || "").toLowerCase();
        const tipeLower = (d.tipe || "").toLowerCase();
        const searchLower = (search || "").toLowerCase();
        const cocokSearch = namaLower.includes(searchLower) || tipeLower.includes(searchLower);

        return cocokFilter && cocokSearch && cocokJurusan && cocokKelas;
      });

    dataTerkini = hasil;

    if (hasil.length === 0) {
      const noDataRow = document.createElement('div');
      noDataRow.className = 'data-row';
      noDataRow.innerHTML = `
        <span colspan="6" style="grid-column: 1 / -1; text-align: center; padding: 20px;">
          Tidak ada data ditemukan.
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
        <span>${(item.jurusanSekolah || '-') + ' / ' + (item.kelasSekolah || '-')}</span>
        <span>${item.tipe || '-'}</span>
        <span>${getKeterangan(item)}</span>
        <div style="display: flex; gap: 7px; border-radius: 20px;">
          <button class="btn-detail" data-index="${item.originalIndex}">Detail</button>
          <button class="btn-edit" data-index="${item.originalIndex}" style="background-color: #ffa500;">Edit</button>
          <button class="btn-hapus" data-index="${item.originalIndex}" style="background-color: #ff4444;">Hapus</button>
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
      <p><b>Nama Lengkap:</b> ${item.nama}</p>
      <p><b>NISN:</b> ${item.nisn}</p>
      <p><b>Jurusan Sekolah:</b> ${item.jurusanSekolah || item.jurusan || '-'}</p>
      <p><b>Kelas:</b> ${item.kelasSekolah || item.kelas || '-'}</p>
      <p><b>Alamat:</b> ${item.alamat}</p>
    `;

    if (item.tipe === "kuliah") {
      html += `
        <p><b>Universitas Pilihan:</b> ${item.universitas}</p>
        <p><b>Jurusan:</b> ${item.jurusan}</p>
        <p><b>Jenjang:</b> ${item.jenjang}</p>
      `;
    } else if (item.tipe === "wirausaha") {
      html += `
        <p><b>Bidang Usaha:</b> ${item.bidangUsaha}</p>
        <p><b>Usaha yang Akan Dibuat:</b> ${item.usahaDibuat}</p>
        <p><b>Jenis Usaha:</b> ${item.jenisUsaha}</p>
        <p><b>Rencana Mulai Usaha:</b> ${item.rencanaMulai}</p>
        <p><b>Alasan:</b> ${item.alasan}</p>
      `;
    } else if (item.tipe === "kerja") {
      html += `
        <p><b>Perusahaan:</b> ${item.perusahaan}</p>
        <p><b>Keterampilan:</b> ${item.keterampilan}</p>
        <p><b>Jabatan:</b> ${item.jabatan}</p>
        <p><b>Bidang:</b> ${item.bidang}</p>
        <p><b>Alasan:</b> ${item.alasan}</p>
      `;
    }

    detailContainer.innerHTML = html;
  }

  function editData(item, index) {
    // Setup editForm dengan data
    const editForm = document.getElementById("editForm");
    const editRencana = document.getElementById("editRencana");
    const btnCancelEdit = document.getElementById("btnCancelEdit");
    const btnUpdate = document.getElementById("btnUpdate");
    
    if (!editForm) return;

    // Isi data dasar
    document.getElementById("editNama").value = item.nama || '';
    document.getElementById("editNisn").value = item.nisn || '';
    document.getElementById("editAlamat").value = item.alamat || '';
    editRencana.value = item.tipe || 'kuliah';

    // Sembunyikan mainContent, tampilkan editForm
    mainContent.style.display = "none";
    editForm.style.display = "block";

    // Tampilkan field sesuai rencana
    tampilkanFieldEdit(item.tipe);
    isiFieldEdit(item);

    // Event listener untuk perubahan rencana
    editRencana.addEventListener("change", (e) => {
      tampilkanFieldEdit(e.target.value);
    });

    // Tombol kembali
    btnCancelEdit.onclick = () => {
      editForm.style.display = "none";
      mainContent.style.display = "block";
    };

    // Tombol update
    btnUpdate.onclick = async () => {
      const rencana = editRencana.value;
      const updatedData = {
        nama: document.getElementById("editNama").value.trim(),
        nisn: document.getElementById("editNisn").value.trim(),
        alamat: document.getElementById("editAlamat").value.trim(),
        tipe: rencana,
      };

      // preserve jurusan/kelas sekolah if present on original item
      updatedData.jurusanSekolah = item.jurusanSekolah || item.jurusanSekolah === '' ? (item.jurusanSekolah || '-') : (item.jurusanSekolah || '-');
      updatedData.kelasSekolah = item.kelasSekolah || item.kelasSekolah === '' ? (item.kelasSekolah || '-') : (item.kelas || '-');

      if (!updatedData.nama || !updatedData.nisn || !updatedData.alamat) {
        alert("Semua field wajib diisi!");
        return;
      }

      // Tambah data spesifik sesuai tipe
      if (rencana === "kuliah") {
        updatedData.universitasType = document.getElementById("editUnivType").value;
        updatedData.universitas = document.getElementById("editUnivName").value;
        updatedData.jurusan = document.getElementById("editJurusan").value;
        updatedData.jenjang = document.getElementById("editJenjang").value;
      } else if (rencana === "wirausaha") {
        updatedData.bidangUsaha = document.getElementById("editBidangUsaha").value;
        updatedData.usahaDibuat = document.getElementById("editUsahaDibuat").value;
        updatedData.jenisUsaha = document.getElementById("editJenisUsaha").value;
        updatedData.rencanaMulai = document.getElementById("editRencanaMulai").value;
        updatedData.alasan = document.getElementById("editAlasanWirausaha").value;
      } else if (rencana === "kerja") {
        updatedData.perusahaan = document.getElementById("editPerusahaan").value;
        updatedData.keterampilan = document.getElementById("editKeterampilan").value;
        updatedData.jabatan = document.getElementById("editJabatan").value;
        updatedData.bidang = document.getElementById("editBidang").value;
        updatedData.alasan = document.getElementById("editAlasanKerja").value;
      }

      try {
        const result = await window.electronAPI.updateData(index, updatedData);
        alert(result || 'Data berhasil diupdate!');
        editForm.style.display = "none";
        mainContent.style.display = "block";
        semuaData = await window.electronAPI.loadData();
        tampilkanData(filterSelect.value, searchInput ? searchInput.value : "", filterJurusan ? filterJurusan.value : 'semua', filterKelas ? filterKelas.value : 'semua');
      } catch (error) {
        alert('Gagal mengupdate data: ' + (error.message || 'Unknown error'));
      }
    };
  }

  function tampilkanFieldEdit(rencana) {
    const kuliahFields = document.getElementById("editKuliahFields");
    const wirausahaFields = document.getElementById("editWirausahaFields");
    const kerjaFields = document.getElementById("editKerjaFields");

    kuliahFields.style.display = "none";
    wirausahaFields.style.display = "none";
    kerjaFields.style.display = "none";

    if (rencana === "kuliah") {
      kuliahFields.style.display = "block";
    } else if (rencana === "wirausaha") {
      wirausahaFields.style.display = "block";
    } else if (rencana === "kerja") {
      kerjaFields.style.display = "block";
    }
  }

  function isiFieldEdit(item) {
    if (item.tipe === "kuliah") {
      document.getElementById("editUnivType").value = item.universitasType || 'negeri';
      document.getElementById("editUnivName").value = item.universitas || '';
      document.getElementById("editJurusan").value = item.jurusan || '';
      document.getElementById("editJenjang").value = item.jenjang || '';
    } else if (item.tipe === "wirausaha") {
      document.getElementById("editBidangUsaha").value = item.bidangUsaha || '';
      document.getElementById("editUsahaDibuat").value = item.usahaDibuat || '';
      document.getElementById("editJenisUsaha").value = item.jenisUsaha || '';
      document.getElementById("editRencanaMulai").value = item.rencanaMulai || '';
      document.getElementById("editAlasanWirausaha").value = item.alasan || '';
    } else if (item.tipe === "kerja") {
      document.getElementById("editPerusahaan").value = item.perusahaan || '';
      document.getElementById("editKeterampilan").value = item.keterampilan || '';
      document.getElementById("editJabatan").value = item.jabatan || '';
      document.getElementById("editBidang").value = item.bidang || '';
      document.getElementById("editAlasanKerja").value = item.alasan || '';
    }
  }

  async function Data(index) {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      try {
        const result = await window.electronAPI.deleteData(index);
        alert(result || 'Data berhasil dihapus!');
        // Reload semua data dari server
        semuaData = await window.electronAPI.loadData();
        // Re-render dengan filter dan search yang sama
        const currentFilter = filterSelect.value;
        const currentSearch = searchInput ? searchInput.value : "";
        const currentJurusan = filterJurusan ? filterJurusan.value : 'semua';
        const currentKelas = filterKelas ? filterKelas.value : 'semua';
        tampilkanData(currentFilter, currentSearch, currentJurusan, currentKelas);
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

  applyFilter.addEventListener("click", () => {
    tampilkanData(filterSelect.value, searchInput ? searchInput.value : "", filterJurusan ? filterJurusan.value : 'semua', filterKelas ? filterKelas.value : 'semua');
  });

  if (searchBtn && searchInput) {
    searchBtn.addEventListener("click", () => {
      tampilkanData(filterSelect.value, searchInput.value, filterJurusan ? filterJurusan.value : 'semua', filterKelas ? filterKelas.value : 'semua');
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      searchInput.value = "";
      filterSelect.value = "semua";
      if (filterJurusan) filterJurusan.value = 'semua';
      if (filterKelas) filterKelas.value = 'semua';
      tampilkanData("semua", "", 'semua', 'semua');
    });

    // Export ke Excel
    const btnExport = document.getElementById("btnExport");
    if (btnExport) {
      btnExport.addEventListener("click", () => {
        exportToExcel(semuaData);
      });
    }
  }

  // Fungsi Export ke Excel
  function exportToExcel(data) {
    // Header kolom
    const headers = [
      "No",
      "Nama",
      "NISN",
      "Jurusan Sekolah",
      "Kelas",
      "Alamat",
      "Rencana",
      "Tipe Universitas",
      "Nama Universitas",
      "Jenjang",
      "Jurusan",
      "Bidang Usaha",
      "Usaha yang Akan Dibuat",
      "Jenis Usaha",
      "Rencana Mulai Usaha",
      "Alasan Berwirausaha",
      "Perusahaan yang Dituju",
      "Keterampilan yang Dimiliki",
      "Jabatan yang Diinginkan",
      "Bidang yang Diinginkan",
      "Alasan Pekerjaan"
    ];

    // Buat array data untuk Excel
    const csvContent = [];
    csvContent.push(headers.join(","));

    data.forEach((item, index) => {
      const row = [
        index + 1,
        item.nama || "-",
        item.nisn || "-",
        // include school major and class
        item.jurusanSekolah || item.jurusan || "-",
        item.kelasSekolah || item.kelas || "-",
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

    // Buat Blob dan download
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
          const rows = parseCSV(text); // array of { header: value }
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
          tampilkanData(filterSelect.value, searchInput ? searchInput.value : "", filterJurusan ? filterJurusan.value : 'semua', filterKelas ? filterKelas.value : 'semua');
        } catch (err) {
          console.error(err);
          alert('Terjadi kesalahan saat memproses file CSV');
        }
      };
      reader.readAsText(file, 'utf-8');
      // reset input so same file can be chosen again
      importFileSiswa.value = '';
    });
  }

  tampilkanData("semua", "", 'semua', 'semua');
});


// ==========================
// LAPORAN ACARA (FIXED VERSION)
// ==========================
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

// ===============================================================
// ===================  KODE EDIT WORD DIMASUKKAN DI SINI  ========
// ===============================================================

const viewer = document.getElementById('viewer');
const editor = document.getElementById('editor');
const templateSelect = document.getElementById('templateSelect');
const exportBtn = document.getElementById('exportBtn');

let currentDocBase64 = null;
let currentBinary = null;
let currentZip = null;

// Fungsi ambil placeholder {{nama}}
function extractPlaceholders(text) {
  const regex = /{{(.*?)}}/g;
  const found = [...text.matchAll(regex)].map(m => m[1].trim());
  return [...new Set(found)];
}

// Jika halaman editWord.html punya elemen-elemen ini, jalankan
if (templateSelect && viewer && editor) {

  templateSelect.addEventListener('change', async () => {
    const type = templateSelect.value;
    
    if (!type) {
      viewer.innerHTML = '<p style="color: #999; text-align: center; padding: 30px;">📄 Pilih template untuk melihat isinya</p>';
      editor.innerHTML = '';
      viewer.style.display = 'none';
      editor.style.display = 'none';
      return;
    }

    try {
      // Show loading state
      viewer.innerHTML = '<p style="color: #0061c1; text-align: center; padding: 30px;"><strong>⏳ Loading template...</strong></p>';
      editor.innerHTML = '<p style="color: #0061c1; text-align: center; padding: 30px;"><strong>⏳ Memproses...</strong></p>';
      viewer.style.display = 'block';
      editor.style.display = 'block';

      // Ambil file template docx dalam bentuk base64
      const result = await window.electronAPI.loadTemplate(type);
      
      // Check if result is error
      if (result && result.error) {
        throw new Error(result.error);
      }
      
      if (!result) {
        throw new Error('Tidak ada response dari server');
      }

      currentDocBase64 = result;
      
      // Convert base64 ke ArrayBuffer untuk JSZip 3.0
      let arrayBuffer;
      try {
        const binaryString = atob(result);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        arrayBuffer = bytes.buffer;
      } catch (e) {
        throw new Error('Format file tidak valid (decode error): ' + e.message);
      }
      
      currentBinary = arrayBuffer;

      // Extract XML dari zip menggunakan JSZip 3.0 yang benar
      let zip;
      try {
        // Gunakan JSZip langsung (bukan PizZip) untuk JSZip 3.0
        if (typeof JSZip === 'undefined') {
          throw new Error('JSZip library tidak tersedia');
        }
        zip = new JSZip();
        zip = await zip.loadAsync(arrayBuffer);
        currentZip = zip;
      } catch (e) {
        throw new Error('Gagal membuka file Word: ' + e.message);
      }

      let xml;
      try {
        const xmlFile = zip.file("word/document.xml");
        if (!xmlFile) {
          throw new Error('File word/document.xml tidak ditemukan dalam dokumen');
        }
        xml = await xmlFile.async("text");
      } catch (e) {
        throw new Error('Gagal membaca isi dokumen: ' + e.message);
      }

      // Render dokumen ke viewer menggunakan docx-preview
      try {
        viewer.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">⏳ Rendering dokumen...</p>';
        
        let previewRendered = false;
        
        // Coba load docx-preview dari CDN
        try {
          const module = await import('https://cdn.jsdelivr.net/npm/docx-preview@0.3.7/build/index.js');
          if (module && module.renderAsync) {
            const blob = new Blob([new Uint8Array(arrayBuffer)], { 
              type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
            });
            
            viewer.innerHTML = '';
            await module.renderAsync(blob, viewer);
            
            viewer.style.backgroundColor = 'white';
            viewer.style.padding = '30px';
            viewer.style.overflowY = 'auto';
            viewer.style.borderRadius = '8px';
            
            previewRendered = true;
          }
        } catch (cdnError) {
          console.warn('CDN docx-preview failed:', cdnError.message);
        }
        
        // Jika CDN gagal, tampilkan ekstrak teks dari dokumen
        if (!previewRendered) {
          // Extract teks dari XML dokumen
          const textContent = xml
            .replace(/<[^>]+>/g, ' ')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/\s+/g, ' ')
            .trim();
          
          const displayText = textContent.substring(0, 2000);
          
          viewer.innerHTML = `<div style="padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <div style="color: #666; font-size: 12px; margin-bottom: 15px; padding: 10px; background: #e7f3ff; border-left: 3px solid #0061c1; border-radius: 4px;">
              📄 <strong>Konten Dokumen Word:</strong><br>
              <small>Preview dokumen ditampilkan dalam format teks. Dokumen asli memiliki formatting lengkap.</small>
            </div>
            <pre style="white-space: pre-wrap; word-wrap: break-word; font-size: 13px; line-height: 1.6; color: #333; font-family: 'Segoe UI', 'Poppins', sans-serif; margin: 0;">${displayText}</pre>
          </div>`;
          
          viewer.style.backgroundColor = 'white';
          viewer.style.padding = '20px';
          viewer.style.overflowY = 'auto';
          viewer.style.borderRadius = '8px';
        }
        
      } catch (e) {
        console.error('Viewer rendering failed:', e);
        viewer.innerHTML = `<div style="padding: 20px; color: #d9534f; background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; text-align: center;">
          <strong style="font-size: 16px;">⚠️ Gagal Membaca Dokumen</strong><br>
          <small style="display: block; margin-top: 10px; color: #666;">${e.message}</small>
        </div>`;
      }

      // Ambil semua placeholder
      const keys = extractPlaceholders(xml);

      if (keys.length === 0) {
        editor.innerHTML = '<p style="color: #d9534f; text-align: center; padding: 20px;"><strong>⚠️ Tidak ada placeholder ditemukan</strong><br><small>Format yang benar: {{namaVariabel}}</small></p>';
        exportBtn.style.display = 'none';
        return;
      }

      editor.innerHTML = '';
      exportBtn.style.display = 'block';

      // Fungsi untuk update preview real-time
      async function updatePreviewRealTime() {
        try {
          const zip2 = new JSZip();
          await zip2.loadAsync(arrayBuffer);
          let xml2 = await (await zip2.file("word/document.xml")).async("text");

          // Replace semua placeholder dengan nilai dari form
          keys.forEach(k => {
            const safeId = `pl-${k.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
            const inputEl = document.getElementById(safeId);
            const value = inputEl ? inputEl.value : '';
            
            // Replace dengan berbagai format
            xml2 = xml2.replaceAll(`{{${k}}}`, value);
            xml2 = xml2.replaceAll(`{{ ${k} }}`, value);
            xml2 = xml2.replaceAll(`{{${k.toUpperCase()}}}`, value);
          });

          zip2.file("word/document.xml", xml2);
          const previewBlob = await zip2.generateAsync({ type: 'blob' });

          // Render preview dokumen dengan full formatting
          let previewRendered = false;
          
          try {
            const module = await import('https://cdn.jsdelivr.net/npm/docx-preview@0.3.7/build/index.js');
            if (module && module.renderAsync) {
              viewer.innerHTML = '';
              await module.renderAsync(previewBlob, viewer);
              viewer.style.backgroundColor = 'white';
              viewer.style.padding = '30px';
              viewer.style.overflowY = 'auto';
              viewer.style.borderRadius = '8px';
              previewRendered = true;
            }
          } catch (cdnError) {
            console.warn('CDN preview update failed:', cdnError.message);
          }
          
          // Fallback ke teks jika docx-preview gagal
          if (!previewRendered) {
            const textContent = xml2
              .replace(/<[^>]+>/g, ' ')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&amp;/g, '&')
              .replace(/\s+/g, ' ')
              .trim();
            
            const displayText = textContent.substring(0, 2000);
            
            viewer.innerHTML = `<div style="padding: 20px; background: #f8f9fa; border-radius: 8px;">
              <div style="color: #666; font-size: 12px; margin-bottom: 15px; padding: 10px; background: #e7f3ff; border-left: 3px solid #0061c1; border-radius: 4px;">
                📄 <strong>Hasil Edit (Pratinjau Teks):</strong>
              </div>
              <pre style="white-space: pre-wrap; word-wrap: break-word; font-size: 13px; line-height: 1.6; color: #333; font-family: 'Segoe UI', 'Poppins', sans-serif; margin: 0;">${displayText}</pre>
            </div>`;
            
            viewer.style.backgroundColor = 'white';
            viewer.style.padding = '20px';
            viewer.style.overflowY = 'auto';
            viewer.style.borderRadius = '8px';
          }
        } catch (e) {
          console.error('Preview update error:', e);
        }
      }

      // Buat input untuk semua placeholder
      keys.forEach(k => {
        const row = document.createElement('div');
        row.style.marginBottom = '15px';
        
        // Tentukan tipe input berdasarkan nama placeholder
        const isLongField = k.toLowerCase().includes('deskripsi') || 
                           k.toLowerCase().includes('keterangan') ||
                           k.toLowerCase().includes('isi') ||
                           k.toLowerCase().includes('catatan') ||
                           k.length > 25;
        
        let inputHtml;
        if (isLongField) {
          inputHtml = `
            <label style="display: block; font-weight: 600; margin-bottom: 6px; color: #0061c1; font-size: 14px;">${k}:</label>
            <textarea id="pl-${k.replace(/[^a-zA-Z0-9_-]/g, '_')}" placeholder="Isi nilai untuk ${k}" style="width: 100%; padding: 10px; border: 1px solid #bcd3ff; border-radius: 6px; font-size: 13px; min-height: 80px; font-family: 'Poppins', sans-serif; resize: vertical;"></textarea>
          `;
        } else {
          inputHtml = `
            <label style="display: block; font-weight: 600; margin-bottom: 6px; color: #0061c1; font-size: 14px;">${k}:</label>
            <input type="text" id="pl-${k.replace(/[^a-zA-Z0-9_-]/g, '_')}" placeholder="Isi nilai untuk ${k}" style="width: 100%; padding: 10px; border: 1px solid #bcd3ff; border-radius: 6px; font-size: 13px; font-family: 'Poppins', sans-serif;" />
          `;
        }
        
        row.innerHTML = inputHtml;
        editor.appendChild(row);

        // Tambah event listener untuk update preview real-time saat input berubah
        const inputEl = editor.querySelector(`#pl-${k.replace(/[^a-zA-Z0-9_-]/g, '_')}`);
        if (inputEl) {
          inputEl.addEventListener('input', () => {
            // Debounce: tunggu 500ms setelah user berhenti mengetik
            clearTimeout(inputEl.debounceTimer);
            inputEl.debounceTimer = setTimeout(updatePreviewRealTime, 500);
          });
        }
      });

      // Tombol export
      exportBtn.onclick = async () => {
        try {
          exportBtn.disabled = true;
          exportBtn.textContent = '⏳ Menyimpan...';
          
          // Load ulang zip untuk edit
          const zip2 = new JSZip();
          await zip2.loadAsync(arrayBuffer);
          let xml2 = await (await zip2.file("word/document.xml")).async("text");

          // Replace semua placeholder
          keys.forEach(k => {
            const safeId = `pl-${k.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
            const inputEl = document.getElementById(safeId);
            const value = inputEl ? inputEl.value : '';
            
            // Replace dengan berbagai format
            xml2 = xml2.replaceAll(`{{${k}}}`, value);
            xml2 = xml2.replaceAll(`{{ ${k} }}`, value);
            xml2 = xml2.replaceAll(`{{${k.toUpperCase()}}}`, value);
          });

          zip2.file("word/document.xml", xml2);
          const out = await zip2.generateAsync({ type: 'base64' });

          const result = await window.electronAPI.exportTemplate({
            base64: out,
            filename: `edited_${Date.now()}.docx`
          });

          if (result.success) {
            alert('✅ ' + result.message);
            // Reset form dan preview
            keys.forEach(k => {
              const safeId = `pl-${k.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
              const inputEl = document.getElementById(safeId);
              if (inputEl) inputEl.value = '';
            });
            // Update preview kembali ke original
            await updatePreviewRealTime();
          } else {
            alert('❌ ' + (result.error || 'Gagal menyimpan file'));
          }
          
          exportBtn.textContent = '💾 Simpan Hasil Edit';
          exportBtn.disabled = false;
        } catch (error) {
          alert('❌ Error saat export: ' + error.message);
          console.error('Export error:', error);
          exportBtn.textContent = '💾 Simpan Hasil Edit';
          exportBtn.disabled = false;
        }
      };

    } catch (error) {
      console.error('Error loading template:', error);
      viewer.innerHTML = `<p style="color: #d9534f; padding: 20px;"><strong>❌ Error:</strong> ${error.message}</p>`;
      editor.innerHTML = '';
      exportBtn.style.display = 'none';
    }
  });

}