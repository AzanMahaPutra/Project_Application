// =================== SIDEBAR ===================
window.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("menuBtn");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  if (menuBtn && sidebar && overlay) {
    function toggleSidebar() {
      // toggle both class variants so it works with different CSS files
      // some pages/styles use .open/.show, others use .active
      sidebar.classList.toggle("open");
      sidebar.classList.toggle("active");
      overlay.classList.toggle("show");
      overlay.classList.toggle("active");
      // toggle visual state on the menu button as well
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

  // Load data
  semuaData = await window.electronAPI.loadData();
  dataTerkini = [...semuaData];

  function tampilkanData(filter, search = "") {
    const existingRows = dataList.querySelectorAll('.data-row');
    existingRows.forEach(row => row.remove());

    const hasil = semuaData.filter((d) => {
      if (!d.nama) return false;
      
      const cocokFilter = filter === "semua" || (d.tipe && d.tipe === filter);
      const namaLower = (d.nama || "").toString().toLowerCase();
      const tipeLower = (d.tipe || "").toString().toLowerCase();
      const searchLower = (search || "").toString().toLowerCase();
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

    hasil.forEach((item, index) => {
      const dataRow = document.createElement('div');
      dataRow.className = 'data-row';
      dataRow.innerHTML = `
        <span>${item.nama || '-'}</span>
        <span>${item.kelas || '12'}</span>
        <span>${item.tipe || '-'}</span>
        <span>${getKeterangan(item)}</span>
        <div style="display: flex; gap: 5px;">
          <button class="btn-detail" data-index="${index}">Detail</button>
          <button class="btn-edit" data-index="${index}" style="background-color: #ffa500;">Edit</button>
          <button class="btn-hapus" data-index="${index}" style="background-color: #ff4444;">Hapus</button>
        </div>
      `;
      dataList.appendChild(dataRow);
    });

    // Event listeners untuk tombol
    document.querySelectorAll(".btn-detail").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = e.target.getAttribute("data-index");
        tampilkanDetail(dataTerkini[index]);
      });
    });

    document.querySelectorAll(".btn-edit").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = e.target.getAttribute("data-index");
        editData(dataTerkini[index], index);
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
    // Simpan data yang akan diedit di localStorage
    localStorage.setItem('editData', JSON.stringify({
      data: item,
      index: index
    }));
    window.location.href = 'tambahData.html?edit=true';
  }

  async function hapusData(index) {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      try {
        const result = await window.electronAPI.deleteData(index);
        alert(result);
        // Reload data
        semuaData = await window.electronAPI.loadData();
        tampilkanData(filterSelect.value, searchInput ? searchInput.value : "");
      } catch (error) {
        console.error('Error deleting data:', error);
        alert('Gagal menghapus data!');
      }
    }
  }

  // Event listeners lainnya tetap sama
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
      console.log('Memuat data acara...');
      semuaAcara = await window.electronAPI.loadAcara();
      console.log('Data acara loaded:', semuaAcara);
      acaraTerkini = [...semuaAcara];
      tampilkanTabelAcara(semuaAcara);
    } catch (err) {
      console.error("Gagal memuat data acara:", err);
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

    // Event listeners untuk tombol
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
      console.log('Updating acara:', dataAcara);
      const result = await window.electronAPI.updateAcara(index, dataAcara);
      alert(result);
      formArea.style.display = "none";
      tableArea.style.display = "block";
      tambahBtn.style.display = "inline-block";
      resetForm();
      loadAcara();
    } catch (err) {
      console.error('Error update acara:', err);
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
        console.error('Error hapus acara:', err);
        alert("Gagal menghapus acara: " + err.message);
      }
    }
  }

  // TAMBAH ACARA BARU
  async function tambahAcaraBaru() {
    const namaAcara = document.getElementById("namaAcara").value.trim();
    const tanggalAcara = document.getElementById("tanggalAcara").value;
    const penanggungJawab = document.getElementById("penanggungJawab").value.trim();
    const lokasi = document.getElementById("lokasi").value.trim();
    const jumlahPeserta = document.getElementById("jumlahPeserta").value;
    const pengeluaran = document.getElementById("pengeluaran").value.trim();

    if (!namaAcara) {
      alert("Nama acara harus diisi!");
      return;
    }
    if (!tanggalAcara) {
      alert("Tanggal acara harus diisi!");
      return;
    }
    if (!penanggungJawab) {
      alert("Penanggung jawab harus diisi!");
      return;
    }
    if (!lokasi) {
      alert("Lokasi acara harus diisi!");
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
      console.log('Menyimpan acara baru:', dataAcara);
      const result = await window.electronAPI.saveAcara(dataAcara);
      alert(result);
      formArea.style.display = "none";
      tableArea.style.display = "block";
      tambahBtn.style.display = "inline-block";
      resetForm();
      loadAcara();
    } catch (err) {
      console.error('Error DETAIL save acara:', err);
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

  // Load data saat pertama kali
  loadAcara();
});

// ==== HALAMAN TENTANG ====
document.addEventListener("DOMContentLoaded", () => {
  const pembuatBtn = document.getElementById("btnPembuat");
  const aplikasiBtn = document.getElementById("btnAplikasi");
  const pembuatBox = document.getElementById("contentPembuat");
  const aplikasiBox = document.getElementById("contentAplikasi");

  // Pastikan hanya berjalan di tentang.html
  if (pembuatBtn && aplikasiBtn) {

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
