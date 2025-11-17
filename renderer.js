// =================== SIDEBAR ===================
window.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("menuBtn");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  if (menuBtn && sidebar && overlay) {
    function toggleSidebar() {
      sidebar.classList.toggle("active");
      overlay.classList.toggle("active");
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

  // 🟩 Tambahan elemen untuk fitur search
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const resetBtn = document.getElementById("resetBtn");

  if (!filterSelect || !dataList) return; // kalau bukan di halaman ini, skip

  // buka halaman tambah data
  btnTambah.addEventListener("click", () => {
    window.location.href = "tambahData.html";
  });

  // ambil data dari main process
  const data = await window.electronAPI.loadData();

  function tampilkanData(filter, search = "") {
    dataList.innerHTML = "";

    // guard against records that don't have expected fields (e.g. acara entries)
    const hasil = data.filter((d) => {
      const cocokFilter = filter === "semua" || (d.tipe && d.tipe === filter);
      const namaLower = (d.nama || "").toString().toLowerCase();
      const tipeLower = (d.tipe || "").toString().toLowerCase();
      const searchLower = (search || "").toString().toLowerCase();
      const cocokSearch = namaLower.includes(searchLower) || tipeLower.includes(searchLower);
      return cocokFilter && cocokSearch;
    });

    if (hasil.length === 0) {
      dataList.innerHTML = "<p>Tidak ada data ditemukan.</p>";
      return;
    }

    hasil.forEach((item, index) => {
      const div = document.createElement("div");
      div.style.border = "1px solid #ccc";
      div.style.padding = "10px";
      div.style.marginBottom = "10px";
      div.innerHTML = `
        <b>${item.nama}</b><br>
        NISN: ${item.nisn}<br>
        Alamat: ${item.alamat}<br>
        Pilihan: ${item.tipe}<br>
        <button class="btnDetail" data-index="${index}">Detail</button>
      `;
      dataList.appendChild(div);
    });

    document.querySelectorAll(".btnDetail").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = e.target.getAttribute("data-index");
        tampilkanDetail(hasil[index]);
      });
    });
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

  // tombol kembali
  btnKembali.addEventListener("click", () => {
    detailContent.style.display = "none";
    mainContent.style.display = "block";
  });

  // filter
  applyFilter.addEventListener("click", () => {
    tampilkanData(filterSelect.value, searchInput ? searchInput.value : "");
  });

  // 🟩 Tambahan event search
  if (searchBtn && searchInput) {
    searchBtn.addEventListener("click", () => {
      tampilkanData(filterSelect.value, searchInput.value);
    });
  }

  // 🟩 Tambahan tombol reset pencarian
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      searchInput.value = "";
      filterSelect.value = "semua";
      tampilkanData("semua", "");
    });
  }

  // tampilkan semua saat awal
  tampilkanData("semua", "");
});

// ==========================
// FUNGSI TAMBAH DATA (BARU)
// ==========================
window.addEventListener("DOMContentLoaded", () => {
  const form1 = document.getElementById("form1");
  if (!form1) return; // kalau bukan halaman tambahData.html, stop biar gak error

  const form2 = document.getElementById("form2");
  const kuliahForm = document.getElementById("kuliahForm");
  const wirausahaForm = document.getElementById("wirausahaForm");
  const kerjaForm = document.getElementById("kerjaForm");

  let dataSiswa = {};

  // Tombol "Selanjutnya"
  const next1Btn = document.getElementById("next1");
  next1Btn.addEventListener("click", () => {
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

  // Pilihan Rencana (Kuliah / Wirausaha / Kerja)
  document.querySelectorAll(".pilihan").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.getAttribute("data-type");
      form2.style.display = "none";

      if (type === "kuliah") kuliahForm.style.display = "block";
      if (type === "wirausaha") wirausahaForm.style.display = "block";
      if (type === "kerja") kerjaForm.style.display = "block";

      dataSiswa.tipe = type; // simpan tipe pilihan
    });
  });

  // =======================
  // FORM KULIAH
  // =======================
  const submitKuliah = document.getElementById("submitKuliah");
  if (submitKuliah) {
    submitKuliah.addEventListener("click", async () => {
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

  // =======================
  // FORM WIRAUSAHA
  // =======================
  const submitWirausaha = document.getElementById("submitWirausaha");
  if (submitWirausaha) {
    submitWirausaha.addEventListener("click", async () => {
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

  // =======================
  // FORM KERJA
  // =======================
  const submitKerja = document.getElementById("submitKerja");
  if (submitKerja) {
    submitKerja.addEventListener("click", async () => {
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

  // =======================
  // FUNGSI SIMPAN DATA
  // =======================
  async function simpanData(data) {
    try {
      const result = await window.electronAPI.saveData(data);
      alert(result);
      location.href = "cariData.html"; // langsung ke halaman data
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan data!");
    }
  }
});

// ==========================
// LAPORAN ACARA
// ==========================
window.addEventListener("DOMContentLoaded", async () => {
  const tambahBtn = document.getElementById("tambahBtn");
  const formArea = document.getElementById("formArea");
  const tableArea = document.getElementById("tableArea");
  const searchInput = document.getElementById("searchInput");
  const submitAcara = document.getElementById("submitAcara");
  const cancelBtn = document.getElementById("cancelBtn");

  if (!tambahBtn || !tableArea) return; // kalau bukan halaman laporanAcara, skip

  let semuaAcara = [];

  // ======= FUNGSI LOAD DATA =======
  async function loadAcara() {
    try {
      semuaAcara = await window.electronAPI.loadData();
      tampilkanTabel(semuaAcara);
    } catch (err) {
      console.error("Gagal memuat data:", err);
    }
  }

  // ======= FUNGSI TAMPILKAN TABEL =======
  function tampilkanTabel(data) {
    tableArea.innerHTML = "";
    if (data.length === 0) {
      tableArea.innerHTML = '<p>Tidak ada laporan acara.</p>';
      return;
    }

    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.style.marginTop = "15px";

    // Header
    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr style="background-color:#f2f2f2; border-bottom:2px solid #444;">
        <th style="border:1px solid #ccc; padding:10px;">No</th>
        <th style="border:1px solid #ccc; padding:10px;">Nama Acara</th>
        <th style="border:1px solid #ccc; padding:10px;">Tanggal</th>
        <th style="border:1px solid #ccc; padding:10px;">Penanggung Jawab</th>
        <th style="border:1px solid #ccc; padding:10px;">Lokasi</th>
        <th style="border:1px solid #ccc; padding:10px;">Jumlah Peserta</th>
        <th style="border:1px solid #ccc; padding:10px;">Pengeluaran</th>
      </tr>
    `;
    table.appendChild(thead);

    // Body
    const tbody = document.createElement("tbody");
    data.forEach((item, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="border:1px solid #ddd; padding:10px;">${index + 1}</td>
        <td style="border:1px solid #ddd; padding:10px;">${item.namaAcara || "-"}</td>
        <td style="border:1px solid #ddd; padding:10px;">${item.tanggalAcara || "-"}</td>
        <td style="border:1px solid #ddd; padding:10px;">${item.penanggungJawab || "-"}</td>
        <td style="border:1px solid #ddd; padding:10px;">${item.lokasi || "-"}</td>
        <td style="border:1px solid #ddd; padding:10px;">${item.jumlahPeserta || "-"}</td>
        <td style="border:1px solid #ddd; padding:10px;">Rp ${item.pengeluaran || "0"}</td>
      `;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    tableArea.appendChild(table);
  }

  // ======= EVENT TOMBOL TAMBAH =======
  tambahBtn.addEventListener("click", () => {
    formArea.style.display = "block";
    tableArea.style.display = "none";
    tambahBtn.style.display = "none";
  });

  // ======= EVENT BATAL =======
  cancelBtn.addEventListener("click", () => {
    formArea.style.display = "none";
    tableArea.style.display = "block";
    tambahBtn.style.display = "inline-block";
    resetForm();
  });

  // ======= EVENT SELESAI / SUBMIT =======
  submitAcara.addEventListener("click", async () => {
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
      jumlahPeserta,
      pengeluaran,
    };

    try {
      await window.electronAPI.saveData(dataAcara);
      alert("Acara berhasil ditambahkan!");
      formArea.style.display = "none";
      tableArea.style.display = "block";
      tambahBtn.style.display = "inline-block";
      resetForm();
      loadAcara();
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan acara!");
    }
  });

  // ======= EVENT SEARCH =======
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const keyword = e.target.value.toLowerCase();
      const filtered = semuaAcara.filter(
        (item) =>
          (item.namaAcara || "").toLowerCase().includes(keyword) ||
          (item.penanggungJawab || "").toLowerCase().includes(keyword) ||
          (item.lokasi || "").toLowerCase().includes(keyword)
      );
      tampilkanTabel(filtered);
    });
  }

  // ======= RESET FORM =======
  function resetForm() {
    document.getElementById("namaAcara").value = "";
    document.getElementById("tanggalAcara").value = "";
    document.getElementById("penanggungJawab").value = "";
    document.getElementById("lokasi").value = "";
    document.getElementById("jumlahPeserta").value = "";
    document.getElementById("pengeluaran").value = "";
  }

  // ======= MULAI =======
  loadAcara();
});

window.addEventListener("DOMContentLoaded", async () => {
  const tambahBtn = document.getElementById("tambahBtn");
  const formArea = document.getElementById("formArea");
  const tableArea = document.getElementById("tableArea");
  const searchInput = document.getElementById("searchInput");
  const submitAcara = document.getElementById("submitAcara");
  const cancelBtn = document.getElementById("cancelBtn");

  if (!tambahBtn || !tableArea) return; // kalau bukan halaman laporanAcara, skip

  let semuaAcara = [];

  // ======= FUNGSI LOAD DATA =======
  async function loadAcara() {
    try {
      semuaAcara = await window.electronAPI.loadData();
      tampilkanTabel(semuaAcara);
    } catch (err) {
      console.error("Gagal memuat data:", err);
    }
  }

  // ======= FUNGSI TAMPILKAN TABEL =======
  function tampilkanTabel(data) {
    tableArea.innerHTML = "";
    if (data.length === 0) {
      tableArea.innerHTML = '<p>Tidak ada laporan acara.</p>';
      return;
    }

    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.style.marginTop = "15px";

    // Header
    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr style="background-color:#f2f2f2; border-bottom:2px solid #444;">
        <th style="border:1px solid #ccc; padding:10px;">No</th>
        <th style="border:1px solid #ccc; padding:10px;">Nama Acara</th>
        <th style="border:1px solid #ccc; padding:10px;">Tanggal</th>
        <th style="border:1px solid #ccc; padding:10px;">Penanggung Jawab</th>
        <th style="border:1px solid #ccc; padding:10px;">Lokasi</th>
        <th style="border:1px solid #ccc; padding:10px;">Jumlah Peserta</th>
        <th style="border:1px solid #ccc; padding:10px;">Pengeluaran</th>
      </tr>
    `;
    table.appendChild(thead);

    // Body
    const tbody = document.createElement("tbody");
    data.forEach((item, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="border:1px solid #ddd; padding:10px;">${index + 1}</td>
        <td style="border:1px solid #ddd; padding:10px;">${item.namaAcara || "-"}</td>
        <td style="border:1px solid #ddd; padding:10px;">${item.tanggalAcara || "-"}</td>
        <td style="border:1px solid #ddd; padding:10px;">${item.penanggungJawab || "-"}</td>
        <td style="border:1px solid #ddd; padding:10px;">${item.lokasi || "-"}</td>
        <td style="border:1px solid #ddd; padding:10px;">${item.jumlahPeserta || "-"}</td>
        <td style="border:1px solid #ddd; padding:10px;">Rp ${item.pengeluaran || "0"}</td>
      `;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    tableArea.appendChild(table);
  }

  // ======= EVENT TOMBOL TAMBAH =======
  tambahBtn.addEventListener("click", () => {
    formArea.style.display = "block";
    tableArea.style.display = "none";
    tambahBtn.style.display = "none";
  });

  // ======= EVENT BATAL =======
  cancelBtn.addEventListener("click", () => {
    formArea.style.display = "none";
    tableArea.style.display = "block";
    tambahBtn.style.display = "inline-block";
    resetForm();
  });

  // ======= EVENT SELESAI / SUBMIT =======
  submitAcara.addEventListener("click", async () => {
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
      jumlahPeserta,
      pengeluaran,
    };

    try {
      await window.electronAPI.saveData(dataAcara);
      alert("Acara berhasil ditambahkan!");
      formArea.style.display = "none";
      tableArea.style.display = "block";
      tambahBtn.style.display = "inline-block";
      resetForm();
      loadAcara();
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan acara!");
    }
  });

  // ======= EVENT SEARCH =======
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const keyword = e.target.value.toLowerCase();
      const filtered = semuaAcara.filter(
        (item) =>
          (item.namaAcara || "").toLowerCase().includes(keyword) ||
          (item.penanggungJawab || "").toLowerCase().includes(keyword) ||
          (item.lokasi || "").toLowerCase().includes(keyword)
      );
      tampilkanTabel(filtered);
    });
  }

  // ======= RESET FORM =======
  function resetForm() {
    document.getElementById("namaAcara").value = "";
    document.getElementById("tanggalAcara").value = "";
    document.getElementById("penanggungJawab").value = "";
    document.getElementById("lokasi").value = "";
    document.getElementById("jumlahPeserta").value = "";
    document.getElementById("pengeluaran").value = "";
  }

  // ======= MULAI =======
  loadAcara();
});
