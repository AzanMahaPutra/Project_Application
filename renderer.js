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


// =================== CARI DATA ===================
window.addEventListener("DOMContentLoaded", async () => {
  const filterSelect = document.getElementById("filterSelect");
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

  function tampilkanData(filter, search = "") {

    const existingRows = dataList.querySelectorAll('.data-row');
    existingRows.forEach(row => row.remove());

    const hasil = semuaData
      .map((d, originalIndex) => ({ ...d, originalIndex }))
      .filter((d) => {
        if (!d.nama) return false;

        const cocokFilter = filter === "semua" || (d.tipe && d.tipe === filter);
        const namaLower = (d.nama || "").toLowerCase();
        const tipeLower = (d.tipe || "").toLowerCase();
        const searchLower = (search || "").toLowerCase();
        const cocokSearch = namaLower.includes(searchLower) || tipeLower.includes(searchLower);

        return cocokFilter && cocokSearch;
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
        <span>${item.kelas || '12'}</span>
        <span>${item.tipe || '-'}</span>
        <span>${getKeterangan(item)}</span>
        <div style="display: flex; gap: 5px;">
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
        tampilkanData(filterSelect.value, searchInput ? searchInput.value : "");
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

  async function hapusData(index) {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      try {
        const result = await window.electronAPI.deleteData(index);
        alert(result || 'Data berhasil dihapus!');
        // Reload semua data dari server
        semuaData = await window.electronAPI.loadData();
        // Re-render dengan filter dan search yang sama
        const currentFilter = filterSelect.value;
        const currentSearch = searchInput ? searchInput.value : "";
        tampilkanData(currentFilter, currentSearch);
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
    tampilkanData(filterSelect.value, searchInput ? searchInput.value : "");
  });

  if (searchBtn && searchInput) {
    searchBtn.addEventListener("click", () => {
      tampilkanData(filterSelect.value, searchInput.value);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      searchInput.value = "";
      filterSelect.value = "semua";
      tampilkanData("semua", "");
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
        item.alamat || "-",
        item.tipe || "-",
        item["tipe-univ"] || "-",
        item["nama-univ"] || "-",
        item.jenjang || "-",
        item.jurusan || "-",
        item["bidang-usaha"] || "-",
        item["usaha-dibuat"] || "-",
        item["jenis-usaha"] || "-",
        item["rencana-mulai"] || "-",
        item["alasan-wirausaha"] || "-",
        item.perusahaan || "-",
        item.keterampilan || "-",
        item.jabatan || "-",
        item.bidang || "-",
        item["alasan-kerja"] || "-"
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

  tampilkanData("semua", "");
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

    dataSiswa = { nama, nisn, alamat };
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
