// ============================
// Inisialisasi Peta
// ============================

const map = L.map("map").setView([-3.2, 104.7], 7);

const posisiAwal = [-3.5, 104.7];
const zoomAwal = 7;

const iconNormal = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25,41],
    iconAnchor: [12,41]
});

const iconAktif = L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [35,57],
    iconAnchor: [17,57]
});

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap"
}).addTo(map);

// ============================
// Marker Cluster
// ============================

const markers = L.markerClusterGroup({

    showCoverageOnHover: false,

    zoomToBoundsOnClick: true,

    spiderfyOnMaxZoom: true,

    disableClusteringAtZoom: 18

});

// Tambahkan KE PETA cukup sekali
map.addLayer(markers);

// ============================
// Variabel Global
// ============================

let semuaData = [];
let semuaMarker = [];
let markerAktif = null;

let chartBulanan = null;
let chartPenyebab = null;
let chartUP3 = null;
let chartGI = null;
let tabelGangguan = null;

// ============================
// Warna Dashboard
// ============================

const warnaPLN = {
    biru: "#005BAC",
    biruMuda: "#4DA3FF",
    kuning: "#FFC107",
    hijau: "#28A745",
    merah: "#DC3545",
    abu: "#E9ECEF"
};
// ============================
// UPDATE DASHBOARD
// ============================

function updateDashboard(data){

    tampilKPI(data);

    tampilMarker(data);

    tampilChartBulanan(data);

    tampilChartPenyebab(data);

    tampilChartUP3(data);

    tampilChartGI(data);

    tampilInsight(data);

    tampilTabel(data);
}

// ============================
// Ambil Data JSON
// ============================

fetch("dashboard_data.json")
    .then(res => res.json())
    .then(data => {

        semuaData = data;

        isiFilter(data);

        updateDashboard(data);

    })
    .catch(err => console.error(err));

// ============================
// KPI
// ============================

function tampilKPI(data){

    document.getElementById("totalGangguan").textContent = data.length;

    const sudah = data.filter(item =>
        item["TINDAK LANJUT"] === "SUDAH TINDAK LANJUT"
    ).length;

    const belum = data.filter(item =>
        item["TINDAK LANJUT"] === "BELUM TINDAK LANJUT"
    ).length;

    document.getElementById("sudahTL").textContent = sudah;
    document.getElementById("belumTL").textContent = belum;

    // ============================
    // Total ENS
    // ============================

    const totalENS = data.reduce((total, item) => {

        return total + Number(item["TOTAL ENS"] || 0);

    }, 0);

    document.getElementById("totalENS").textContent =
        `${totalENS.toLocaleString("id-ID", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })} kWh`;

    // ============================
    // Rata-rata Lama Padam
    // ============================

    const totalDetik = data.reduce((total, item) => {

        if (!item.LamaPadam) return total;

        const waktu = item.LamaPadam.split(":");

        if (waktu.length !== 3) return total;

        const jam = parseInt(waktu[0]) || 0;
        const menit = parseInt(waktu[1]) || 0;
        const detik = parseInt(waktu[2]) || 0;

        return total + (jam * 3600) + (menit * 60) + detik;

    }, 0);

    const rataDetik = data.length > 0 ? totalDetik / data.length : 0;

    const jam = Math.floor(rataDetik / 3600);
    const menit = Math.floor((rataDetik % 3600) / 60);
    const detik = Math.floor(rataDetik % 60);

    let teksDurasi = "";

    if (jam > 0) {

        teksDurasi = `${jam} Jam ${menit} Menit`;

    } else if (menit > 0) {

        teksDurasi = `${menit} Menit ${detik} Detik`;

    } else {

        teksDurasi = `${detik} Detik`;

    }

    document.getElementById("rataPadam").textContent = teksDurasi;

}

// ============================
// CHART GANGGUAN BULANAN
// ============================

function tampilChartBulanan(data){

    const canvas = document.getElementById("chartBulanan");

    if(!canvas) return;

    // Hitung jumlah gangguan tiap bulan
    const jumlah = Array(12).fill(0);

    data.forEach(item => {

        if(!item.Tanggal) return;

        const tgl = item.Tanggal.split("/");

        // Pastikan format tanggal benar (MM/DD/YYYY)
        if(tgl.length !== 3) return;

        const bulan = Number(tgl[0]);

        if(bulan >= 1 && bulan <= 12){

            jumlah[bulan - 1]++;

        }

    });

    // Nama bulan
    const namaBulan = [
        "Jan","Feb","Mar","Apr","Mei","Jun",
        "Jul","Agu","Sep","Okt","Nov","Des"
    ];

    // Cari bulan terakhir yang memiliki data
    let bulanTerakhir = -1;

    for(let i = 11; i >= 0; i--){

        if(jumlah[i] > 0){

            bulanTerakhir = i;
            break;

        }

    }

    // Kalau tidak ada data
    if(bulanTerakhir === -1){

        bulanTerakhir = 0;

    }

    const labels = namaBulan.slice(0, bulanTerakhir + 1);
    const values = jumlah.slice(0, bulanTerakhir + 1);

    // Update chart jika sudah ada
    if(chartBulanan){

        chartBulanan.data.labels = labels;
        chartBulanan.data.datasets[0].data = values;
        chartBulanan.update();

        return;

    }

    // Buat chart pertama kali
    chartBulanan = new Chart(canvas,{

        type:"bar",

        data:{

            labels: labels,

            datasets:[{

                label:"Jumlah Gangguan",

                data: values,

                backgroundColor:"#005BAC",

                borderRadius:8,

                maxBarThickness:40

            }]

        },

        options:{

            responsive:true,

            maintainAspectRatio:false,

            plugins:{

                legend:{
                    display:false
                }

            },

            scales:{

                y:{

                    beginAtZero:true,

                    ticks:{
                        precision:0
                    }

                }

            }

        }

    });

}

// ============================
// CHART PENYEBAB GANGGUAN
// ============================
function kategoriPenyebab(item){

    const penyebab = (item["Penyebab Padam"] || "").toLowerCase();
    const justifikasi = (item["JUSTIFIKASI TEMUAN GANGGUAN MELALUI APPSHEET"] || "").toLowerCase();

    const teks = penyebab + " " + justifikasi;

    // Layang-layang
    if(teks.includes("layang")){
        return "Layang-layang";
    }

    // Pohon / Vegetasi
    if(
        teks.includes("pohon") ||
        teks.includes("ranting") ||
        teks.includes("dahan") ||
        teks.includes("bambu") ||
        teks.includes("vegetasi")
    ){
        return "Pohon";
    }

    // Binatang
    if(
        teks.includes("tupai") ||
        teks.includes("ular") ||
        teks.includes("burung") ||
        teks.includes("monyet") ||
        teks.includes("hewan") ||
        teks.includes("binatang")
    ){
        return "Binatang";
    }

    // Petir
    if(
        teks.includes("petir") ||
        teks.includes("surja")
    ){
        return "Petir";
    }

    // FCO
    if(
        teks.includes("fco")
    ){
        return "FCO";
    }

    // Jumper
    if(
        teks.includes("jumper")
    ){
        return "Jumper";
    }

    // Isolator
    if(
        teks.includes("isolator")
    ){
        return "Isolator";
    }

    // Lightning Arrester
    if(
        teks.includes("arrester")
    ){
        return "Lightning Arrester";
    }

    // Konduktor
    if(
        teks.includes("konduktor") ||
        teks.includes("kabel")
    ){
        return "Konduktor";
    }

    // Trafo
    if(
        teks.includes("trafo") ||
        teks.includes("transformator")
    ){
        return "Trafo";
    }

    // Cuaca
    if(
        teks.includes("cuaca") ||
        teks.includes("badai") ||
        teks.includes("angin")
    ){
        return "Cuaca";
    }

    // Belum diketahui
    if(
        teks.includes("belum diketahui") ||
        teks.includes("tidak diketahui") ||
        teks.includes("belum ditemukan")
    ){
        return "Belum Diketahui";
    }

    // Sedang ditelusuri
    if(
        teks.includes("sedang ditelusuri")
    ){
        return "Sedang Ditelusuri";
    }

    return "Lainnya";

}

// ============================
// TOP PENYEBAB GANGGUAN
// ============================
function tampilChartPenyebab(data){

    const canvas = document.getElementById("chartPenyebab");

    if(!canvas) return;

    const hasil = {};

    data.forEach(item=>{

        const penyebab = kategoriPenyebab(item);

        hasil[penyebab] = (hasil[penyebab] || 0) + 1;

    });

    const urut = Object.entries(hasil)
        .sort((a,b)=>b[1]-a[1]);

    const labels = urut.map(item=>item[0]);
    const values = urut.map(item=>item[1]);

    // Kalau chart sudah ada cukup update
    if(chartPenyebab){

        chartPenyebab.data.labels = labels;
        chartPenyebab.data.datasets[0].data = values;

        chartPenyebab.update();

        return;

    }

    // Kalau belum ada baru buat
    chartPenyebab = new Chart(canvas,{

        type:"bar",

        data:{

            labels:labels,

            datasets:[{

                label:"Jumlah Gangguan",

                data:values,

                backgroundColor:[
                    "#005BAC",
                    "#0A6FD6",
                    "#16A34A",
                    "#F59E0B",
                    "#DC2626",
                    "#7C3AED",
                    "#06B6D4",
                    "#64748B",
                    "#EC4899",
                    "#14B8A6"
                ],

                borderRadius:8,

                maxBarThickness:35

            }]

        },

        options:{

            responsive:true,

            maintainAspectRatio:false,

            plugins:{

                legend:{
                    display:false
                }

            },

            scales:{

                y:{
                    beginAtZero:true
                }

            }

        }

    });

}

// ============================
// TOP 10 UP3
// ============================

function tampilChartUP3(data){

    const canvas = document.getElementById("chartUP3");

    if(!canvas) return;

    const hasil = {};

    data.forEach(item=>{

        const up3 = item.UP3 || "Tidak Diketahui";

        hasil[up3] = (hasil[up3] || 0) + 1;

    });

    const urut = Object.entries(hasil)
        .sort((a,b)=>b[1]-a[1])
        .slice(0,10);

    const labels = urut.map(item=>item[0]);

    const values = urut.map(item=>item[1]);

   if(chartUP3){

    chartUP3.data.labels = labels;
    chartUP3.data.datasets[0].data = values;
    chartUP3.update();

    return;

}

    chartUP3 = new Chart(canvas,{

        type:"bar",

        data:{

            labels:labels,

            datasets:[{

                label:"Jumlah Gangguan",

                data:values,

                backgroundColor:"#005BAC",

                hoverBackgroundColor:"#0A6FD6",

                borderRadius:10,

                borderSkipped:false,

                maxBarThickness:28

            }]

        },

        options:{

            indexAxis:"y",

            responsive:true,

            maintainAspectRatio:false,

            animation:{
                duration:700
            },

            plugins:{

                legend:{
                    display:false
                },

                tooltip:{
                    displayColors:false
                }

            },

            scales:{

                x:{
                    beginAtZero:true,

                    ticks:{
                        precision:0
                    },

                    grid:{
                        color:"#E5E7EB"
                    }

                },

                y:{

                    grid:{
                        display:false
                    },

                    ticks:{

                        font:{
                            size:13,
                            weight:"600"
                        }

                    }

                }

            }

        }

    });

}

// ============================
// TOP 10 GARDU INDUK
// ============================

function tampilChartGI(data){

    const canvas = document.getElementById("chartGI");

    if(!canvas) return;

    const hasil = {};

    data.forEach(item=>{

        const gi = item["Gardu Induk"] || "Tidak Diketahui";

        hasil[gi] = (hasil[gi] || 0) + 1;

    });

    const urut = Object.entries(hasil)
        .sort((a,b)=>b[1]-a[1])
        .slice(0,10);

    const labels = urut.map(item=>item[0]);

    const values = urut.map(item=>item[1]);

    if(chartGI){

    chartGI.data.labels = labels;
    chartGI.data.datasets[0].data = values;
    chartGI.update();

    return;

    }

    chartGI = new Chart(canvas,{

        type:"bar",

        data:{

            labels:labels,

            datasets:[{

                label:"Jumlah Gangguan",

                data:values,

                backgroundColor:"#16A34A",

                hoverBackgroundColor:"#22C55E",

                borderRadius:10,

                borderSkipped:false,

                maxBarThickness:28

            }]

        },

        options:{

            indexAxis:"y",

            responsive:true,

            maintainAspectRatio:false,

            animation:{
                duration:700
            },

            plugins:{

                legend:{
                    display:false
                },

                tooltip:{
                    displayColors:false
                }

            },

            scales:{

                x:{
                    beginAtZero:true,

                    ticks:{
                        precision:0
                    },

                    grid:{
                        color:"#E5E7EB"
                    }

                },

                y:{

                    grid:{
                        display:false
                    },

                    ticks:{

                        font:{
                            size:13,
                            weight:"600"
                        }

                    }

                }

            }

        }

    });

}

// ============================
// QUICK INSIGHT
// ============================

function tampilInsight(data){

    const insight = document.getElementById("insightText");

    if(!insight) return;

    const total = data.length;

    if(total === 0){

        insight.innerHTML =
        "Tidak ada data yang sesuai dengan filter yang dipilih.";

        return;

    }

    // ==========================
    // UP3 Terbanyak
    // ==========================

    const up3 = {};

    data.forEach(item => {

        const nama = item.UP3 || "-";
        up3[nama] = (up3[nama] || 0) + 1;

    });

    const topUP3 = Object.entries(up3)
        .sort((a,b) => b[1]-a[1])[0];

    // ==========================
    // GI Terbanyak
    // ==========================

    const gi = {};

    data.forEach(item => {

        const nama = item["Gardu Induk"] || "-";
        gi[nama] = (gi[nama] || 0) + 1;

    });

    const topGI = Object.entries(gi)
        .sort((a,b)=>b[1]-a[1])[0];

    // ==========================
    // Penyebab Dominan
    // ==========================

    const penyebab = {};

    data.forEach(item => {

        const nama = kategoriPenyebab(item);

        penyebab[nama] = (penyebab[nama] || 0) + 1;

    });

    const topPenyebab = Object.entries(penyebab)
        .sort((a,b)=>b[1]-a[1])[0];

    // ==========================
    // Belum Tindak Lanjut
    // ==========================

    const belum = data.filter(item =>

        item["TINDAK LANJUT"] === "BELUM TINDAK LANJUT"

    ).length;

    const persen = ((belum / total) * 100).toFixed(1);

    // ==========================
    // Tampilkan Insight
    // ==========================

    insight.innerHTML = `
        Berdasarkan filter yang dipilih, terdapat
        <strong>${total.toLocaleString("id-ID")}</strong> gangguan pada jaringan distribusi.
        Gangguan paling banyak terjadi di
        <strong>${topUP3[0]}</strong> sebanyak
        <strong>${topUP3[1]}</strong> kejadian.

        Gardu Induk dengan jumlah gangguan tertinggi adalah
        <strong>${topGI[0]}</strong> sebanyak
        <strong>${topGI[1]}</strong> kejadian.

        Penyebab gangguan yang paling dominan adalah
        <strong>${topPenyebab[0]}</strong> dengan
        <strong>${topPenyebab[1]}</strong> kejadian.

        Dari seluruh gangguan tersebut terdapat
        <strong>${belum}</strong> gangguan
        (<strong>${persen}%</strong>)
        yang masih berstatus
        <strong>Belum Tindak Lanjut</strong>
        sehingga perlu menjadi prioritas penanganan.
    `;

}

// ============================
// TABEL DATA GANGGUAN
// ============================
function tampilTabel(data){

    // Pertama kali buat DataTable
    if(!tabelGangguan){

        tabelGangguan = $("#tabelGangguan").DataTable({

            pageLength:10,

            lengthMenu:[10,25,50,100],

            responsive:true,

            destroy:false,

            order:[],

            autoWidth:false,

            language:{

                search:"🔍 Cari :",

                lengthMenu:"Tampilkan _MENU_ data",

                info:"Menampilkan _START_ - _END_ dari _TOTAL_ data",

                zeroRecords:"Data tidak ditemukan",

                paginate:{
                    previous:"←",
                    next:"→"
                }

            }

        });

    }

    // Kosongkan isi tabel
    tabelGangguan.clear();

    // Tambahkan data baru
    data.forEach((item,index)=>{

        const badge =
            item["TINDAK LANJUT"]==="SUDAH TINDAK LANJUT"

            ? `<span class="badge bg-success">Sudah</span>`

            : `<span class="badge bg-warning text-dark">Belum</span>`;

        tabelGangguan.row.add([

            index+1,

            item.Tanggal || "-",

            item.Penyulang || "-",

            item.UP3 || "-",

            item.ULP || "-",

            item["Gardu Induk"] || "-",

            badge

        ]);

    });

    tabelGangguan.draw(false);

}

function koordinatValid(lat, lng){

    return (
        !isNaN(lat) &&
        !isNaN(lng) &&
        lat >= -6 &&
        lat <= 1 &&
        lng >= 100 &&
        lng <= 107
    );

}

// ============================
// ISI FILTER
// ============================

function isiFilter(data){

    const filterUP3 = document.getElementById("filterUP3");
    const filterULP = document.getElementById("filterULP");
    const filterGI = document.getElementById("filterGI");
    const filterTL = document.getElementById("filterTL");

    filterUP3.innerHTML = '<option value="">Semua UP3</option>';
    filterULP.innerHTML = '<option value="">Semua ULP</option>';
    filterGI.innerHTML = '<option value="">Semua Gardu Induk</option>';
    filterTL.innerHTML = '<option value="">Semua Tindak Lanjut</option>';

    // =====================
    // UP3
    // =====================

    [...new Set(data.map(item=>item.UP3).filter(Boolean))]
    .sort()
    .forEach(item=>{

        filterUP3.innerHTML +=
        `<option value="${item}">${item}</option>`;

    });

    // =====================
    // ULP
    // =====================

    [...new Set(data.map(item=>item.ULP).filter(Boolean))]
    .sort()
    .forEach(item=>{

        filterULP.innerHTML +=
        `<option value="${item}">${item}</option>`;

    });

    // =====================
    // GI
    // =====================

    [...new Set(data.map(item=>item["Gardu Induk"]).filter(Boolean))]
    .sort()
    .forEach(item=>{

        filterGI.innerHTML +=
        `<option value="${item}">${item}</option>`;

    });

    // =====================
    // Tindak Lanjut
    // =====================

    [...new Set(data.map(item=>item["TINDAK LANJUT"]).filter(Boolean))]
    .sort()
    .forEach(item=>{

        filterTL.innerHTML +=
        `<option value="${item}">${item}</option>`;

    });

}

// ============================
// FILTER ULP BERDASARKAN UP3
// ============================

function isiFilterULP(){

    const up3 =
    document.getElementById("filterUP3").value;

    const filterULP =
    document.getElementById("filterULP");

    filterULP.innerHTML =
    '<option value="">Semua ULP</option>';

    const dataFilter = semuaData.filter(item=>{

        return up3==="" || item.UP3===up3;

    });

    const daftarULP =
    [...new Set(

        dataFilter
        .map(item=>item.ULP)
        .filter(Boolean)

    )].sort();

    daftarULP.forEach(ulp=>{

        filterULP.innerHTML +=

        `<option value="${ulp}">${ulp}</option>`;

    });

}

function isiFilterGI(){

    const up3 = document.getElementById("filterUP3").value;
    const ulp = document.getElementById("filterULP").value;

    const filterGI = document.getElementById("filterGI");

    filterGI.innerHTML =
    '<option value="">Semua Gardu Induk</option>';

    let data = semuaData;

    if(up3 !== ""){

        data = data.filter(item => item.UP3 === up3);

    }

    if(ulp !== ""){

        data = data.filter(item => item.ULP === ulp);

    }

    const daftarGI = [...new Set(
        data.map(item => item["Gardu Induk"]).filter(Boolean)
    )].sort();

    daftarGI.forEach(gi=>{

        filterGI.innerHTML +=
        `<option value="${gi}">${gi}</option>`;

    });

}

// ============================
// Marker
// ============================
function tampilMarker(data){

    markers.clearLayers();

    markerAktif = null;

    data.forEach(item => {

        const lat = parseFloat(item.Latitude);
        const lng = parseFloat(item.Longitude);

        if(
            isNaN(lat) || isNaN(lng) ||
            lat < -6 || lat > -1 ||
            lng < 102 || lng > 106
        ){
            return;
        }

        const marker = L.marker([lat, lng], {
            icon: iconNormal
        });

        marker.bindTooltip(
            `<b>${item.Penyulang}</b><br>${item.UP3} - ${item.ULP}`,
            {
                direction: "top",
                offset: [0, -15]
            }
        );

        marker.on("click", function(){

            // Kembalikan marker sebelumnya
            if(markerAktif){

                markerAktif.setIcon(iconNormal);

            }

            // Marker aktif menjadi merah
            marker.setIcon(iconAktif);

            markerAktif = marker;

            // Zoom
            map.flyTo([lat, lng], Math.max(map.getZoom(), 15), {
                animate: true,
                duration: 0.6
            });

            const statusClass =
                item["TINDAK LANJUT"] === "SUDAH TINDAK LANJUT"
                ? "sudah"
                : "belum";

            document.getElementById("detail").innerHTML = `

                <div class="detail-card">

                    <div class="detail-title">${item.Penyulang}</div>

                    <div class="status ${statusClass}">
                        ${item["TINDAK LANJUT"]}
                    </div>

                    <img
                        class="detail-photo"
                        src="${item.FOTO1}"
                        onclick="lihatFoto('${item.FOTO1}')"
                        onerror="this.style.display='none'">

                    <div class="detail-item">
                        <div class="detail-label">🏢 Gardu Induk</div>
                        <div class="detail-value">${item["Gardu Induk"]}</div>
                    </div>

                    <div class="detail-item">
                        <div class="detail-label">⚡ UP3</div>
                        <div class="detail-value">${item.UP3}</div>
                    </div>

                    <div class="detail-item">
                        <div class="detail-label">📍 ULP</div>
                        <div class="detail-value">${item.ULP}</div>
                    </div>

                    <div class="detail-item">
                        <div class="detail-label">📅 Tanggal</div>
                        <div class="detail-value">${item.Tanggal}</div>
                    </div>

                    <div class="detail-item">
                        <div class="detail-label">⏱ Lama Padam</div>
                        <div class="detail-value">${item.LamaPadam || "-"}</div>
                    </div>

                    <div class="detail-item">
                        <div class="detail-label">⚠ Penyebab</div>
                        <div class="detail-value">${item["Penyebab Padam"] || "-"}</div>
                    </div>

                    <div class="detail-item">
                        <div class="detail-label">📝 Justifikasi</div>
                        <div class="detail-value">${item["JUSTIFIKASI TEMUAN GANGGUAN MELALUI APPSHEET"] || "-"}</div>
                    </div>

                </div>

            `;

        });

        markers.addLayer(marker);

    });

}

// ============================
// FILTER DATA
// ============================ 
function filterData(){

    const up3 = document.getElementById("filterUP3").value;
    const ulp = document.getElementById("filterULP").value;
    const gi = document.getElementById("filterGI").value;
    const tl = document.getElementById("filterTL").value;

    const hasil = semuaData.filter(item => {

        return (

            (up3 === "" || item.UP3 === up3) &&

            (ulp === "" || item.ULP === ulp) &&

            (gi === "" || item["Gardu Induk"] === gi) &&

            (tl === "" || item["TINDAK LANJUT"] === tl)

        );

    });

    updateDashboard(hasil);

    zoomKeFilter(hasil);
}

// ============================
// Zoom ke area yang sesuai filter 
// ============================
function zoomKeFilter(data){

    if(data.length === 0) return;

    const up3 = document.getElementById("filterUP3").value;
    const ulp = document.getElementById("filterULP").value;
    const gi  = document.getElementById("filterGI").value;

    const group = [];

    data.forEach(item => {

        const lat = parseFloat(item.Latitude);
        const lng = parseFloat(item.Longitude);

        if(
            !isNaN(lat) &&
            !isNaN(lng) &&
            lat >= -6 &&
            lat <= 1 &&
            lng >= 100 &&
            lng <= 107
        ){
            group.push(L.latLng(lat, lng));
        }

    });

    if(group.length === 0) return;

    // Kalau hanya satu marker
    if(group.length === 1){

        map.flyTo(group[0], 17, {
            animate: true,
            duration: 0.8
        });

        return;

    }

    let maxZoom = zoomAwal;

    if(up3 !== ""){

        maxZoom = 10;

    }

    if(ulp !== ""){

        maxZoom = 12;

    }

    if(gi !== ""){

        maxZoom = 15;

    }

    map.fitBounds(L.latLngBounds(group),{

        padding:[60,60],

        maxZoom:maxZoom,

        animate:true

    });

}

// ============================
// Lihat Foto
// ============================

function lihatFoto(src){

    document.getElementById("fotoBesar").src = src;

    const modal = new bootstrap.Modal(
        document.getElementById("fotoModal")
    );

    modal.show();

}

// ============================
// EVENT FILTER
// ============================

document.getElementById("filterUP3").addEventListener("change", () => {

    isiFilterULP();
    isiFilterGI();
    filterData();

});

document.getElementById("filterULP").addEventListener("change", () => {

    isiFilterGI();
    filterData();

});

document.getElementById("filterGI").addEventListener("change", () => {

    filterData();

});

document.getElementById("filterTL").addEventListener("change", () => {

    filterData();

});

// ============================
// RESET FILTER
// ============================

document.getElementById("resetFilter").addEventListener("click", function(){

    // Reset semua dropdown
    document.getElementById("filterUP3").selectedIndex = 0;
    document.getElementById("filterULP").selectedIndex = 0;
    document.getElementById("filterGI").selectedIndex = 0;
    document.getElementById("filterTL").selectedIndex = 0;

    // Isi ulang dropdown agar ULP & GI kembali lengkap
    isiFilter(semuaData);

    // Kosongkan panel detail
    document.getElementById("detail").innerHTML = `
        <div class="detail-empty">
            <i class="bi bi-geo-alt"></i>
            <p>Belum Ada Data Dipilih</p>
            <small>Klik salah satu marker pada peta untuk menampilkan informasi gangguan.</small>
        </div>
    `;

    // Tampilkan seluruh dashboard
    updateDashboard(semuaData);

    // Kembalikan peta ke posisi awal
    map.flyTo(posisiAwal, zoomAwal, {
        animate: true,
        duration: 1
    });

});