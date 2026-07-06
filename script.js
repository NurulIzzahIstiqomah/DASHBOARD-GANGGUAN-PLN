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

    spiderfyOnMaxZoom: false,

    disableClusteringAtZoom: 16

});

// Tambahkan KE PETA cukup sekali
map.addLayer(markers);

// ============================
// Variabel Global
// ============================

let semuaData = [];
let semuaMarker = [];
let markerAktif = null;
let tanggalAwal = null;
let tanggalAkhir = null;

let chartBulanan = null;
let chartPenyebab = null;
let chartUP3 = null;
let chartGI = null;
let tabelGangguan = null;

Chart.register(ChartDataLabels);

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
    // Date Range Picker
    // ============================
    $('#btnTanggal').daterangepicker({

        autoUpdateInput: false,

        opens: 'right',

        locale: {

            format: 'DD MMM YYYY',

            applyLabel: 'Terapkan',

            cancelLabel: 'Batal'

        }

    }, function(start, end){

        tanggalAwal = start.toDate();

        tanggalAkhir = end.toDate();

        document.getElementById("tanggalTerpilih").textContent =
            start.format("DD MMM YYYY") + " - " +
            end.format("DD MMM YYYY");

        filterData();

    });

    $('#btnTanggal').on('cancel.daterangepicker', function () {

    tanggalAwal = null;
    tanggalAkhir = null;

    document.getElementById("tanggalTerpilih").textContent = "Semua Periode";

    filterData();

});
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

function formatTanggalIndonesia(tanggal){

    if(!tanggal) return "-";

    const bagian = tanggal.split("/");

    if(bagian.length !== 3) return tanggal;

    const bulan = [
        "Januari","Februari","Maret","April","Mei","Juni",
        "Juli","Agustus","September","Oktober","November","Desember"
    ];

    const hari = parseInt(bagian[1]);
    const namaBulan = bulan[parseInt(bagian[0]) - 1];
    const tahun = bagian[2];

    return `${hari} ${namaBulan} ${tahun}`;

}

// ============================
// CHART GANGGUAN BULANAN
// ============================

function tampilChartBulanan(data){

    const canvas = document.getElementById("chartBulanan");

    if(!canvas) return;

    // ============================
    // Hitung jumlah gangguan tiap bulan
    // ============================

    const jumlah = Array(12).fill(0);

    data.forEach(item => {

        if(!item.Tanggal) return;

        const tgl = item.Tanggal.split("/");

        if(tgl.length !== 3) return;

        const bulan = Number(tgl[0]);

        if(bulan >= 1 && bulan <= 12){

            jumlah[bulan - 1]++;

        }

    });

    // ============================
    // Nama Bulan
    // ============================

    const namaBulan = [

        "Jan","Feb","Mar","Apr","Mei","Jun",

        "Jul","Agu","Sep","Okt","Nov","Des"

    ];

    // ============================
    // Ambil bulan terakhir yang memiliki data
    // ============================

    let bulanTerakhir = -1;

    for(let i = 11; i >= 0; i--){

        if(jumlah[i] > 0){

            bulanTerakhir = i;

            break;

        }

    }

    if(bulanTerakhir === -1){

        bulanTerakhir = 0;

    }

    const labels = namaBulan.slice(0, bulanTerakhir + 1);

    const values = jumlah.slice(0, bulanTerakhir + 1);

    // ============================
    // Cari nilai maksimum
    // ============================

    const nilaiMaks = Math.max(...values);

    const warnaTitik = values.map(v =>

        v === nilaiMaks ? "#DC3545" : "#005BAC"

    );

    // ============================
    // Update Chart
    // ============================

    if(chartBulanan){

        chartBulanan.data.labels = labels;

        chartBulanan.data.datasets[0].data = values;

        chartBulanan.data.datasets[0].pointBackgroundColor = warnaTitik;

        chartBulanan.update();

        return;

    }

    // ============================
    // Buat Chart
    // ============================

    chartBulanan = new Chart(canvas,{

        type:"line",

        data:{

            labels:labels,

        datasets:[{

            label:"Jumlah Gangguan",

            data:values,

            borderColor:"#005BAC",

            borderWidth:3,

            tension:0.15,

            fill:false,

            pointRadius:7,

            pointHoverRadius:10,

            pointBackgroundColor:warnaTitik,

            pointBorderColor:"#FFFFFF",

            pointBorderWidth:3,

            pointHoverBorderWidth:4,

            pointHitRadius:15

        }]

        },

        options:{

            responsive:true,

            maintainAspectRatio:false,

            interaction:{

                mode:"index",

                intersect:false

            },

            animation:{

                duration:900,

                easing:"easeOutQuart"

            },

            plugins:{

                legend:{

                    display:false

                },

                tooltip:{

                    backgroundColor:"#1F2937",

                    titleColor:"#FFFFFF",

                    bodyColor:"#FFFFFF",

                    displayColors:false,

                    callbacks:{

                        label:function(context){

                            return context.parsed.y.toLocaleString("id-ID") + " Gangguan";

                        }

                    }

                },

                datalabels:{

                    color:"#374151",

                    anchor:"end",

                    align:"top",

                    font:{

                        size:11,

                        weight:"bold"

                    },

                    formatter:function(value){

                        return value;

                    }

                }

            },

            scales:{

                x:{

                    grid:{

                        display:false

                    },

                    ticks:{

                        color:"#6B7280",

                        font:{

                            size:12,

                            weight:"600"

                        }

                    }

                },

                y:{

                    beginAtZero:true,

                    ticks:{

                        precision:0,

                        color:"#6B7280",

                        callback:function(value){

                            return value.toLocaleString("id-ID");

                        }

                    },

                    grid:{

                        color:"rgba(0,0,0,.08)"

                    }

                }

            }

        },

        plugins:[ChartDataLabels]

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

    const total = data.length;

    if(total === 0){

        document.getElementById("insightText").innerHTML =
        "Tidak terdapat data gangguan yang sesuai dengan filter yang dipilih. Silakan ubah periode atau kriteria filter untuk menampilkan data lainnya.";

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
        .sort((a,b)=>b[1]-a[1])[0];

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
    // Kesimpulan Dinamis
    // ==========================

    let kesimpulan = "";

    if(belum === 0){

        kesimpulan =
        "Seluruh gangguan pada hasil filter telah berhasil ditindaklanjuti sehingga tidak terdapat pekerjaan yang masih memerlukan penanganan lebih lanjut.";

    }
    else if(persen <= 10){

        kesimpulan =
        `Terdapat <b>${belum}</b> gangguan (<b>${persen}%</b>) yang masih berstatus <b>Belum Tindak Lanjut</b>. Meskipun jumlahnya relatif kecil, gangguan tersebut tetap perlu segera ditindaklanjuti untuk menjaga keandalan jaringan distribusi.`;

    }
    else if(persen <= 30){

        kesimpulan =
        `Masih terdapat <b>${belum}</b> gangguan (<b>${persen}%</b>) yang berstatus <b>Belum Tindak Lanjut</b>. Kondisi ini menunjukkan masih terdapat pekerjaan yang perlu diprioritaskan agar proses penanganan gangguan dapat diselesaikan secara optimal.`;

    }
    else{

        kesimpulan =
        `Sebanyak <b>${belum}</b> gangguan (<b>${persen}%</b>) masih berstatus <b>Belum Tindak Lanjut</b>. Persentase tersebut tergolong cukup tinggi sehingga diperlukan percepatan tindak lanjut untuk meningkatkan keandalan sistem distribusi listrik.`;

    }

    // ==========================
    // Filter Aktif
    // ==========================

    const filterUP3 = document.getElementById("filterUP3").value;
    const filterULP = document.getElementById("filterULP").value;
    const filterGI = document.getElementById("filterGI").value;

    let pembuka = "";

    if(tanggalAwal && tanggalAkhir){

        const awal = tanggalAwal.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });

        const akhir = tanggalAkhir.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });

        pembuka =
        `Berdasarkan data gangguan pada periode <b>${awal}</b> hingga <b>${akhir}</b>, terdapat <b>${total.toLocaleString("id-ID")}</b> gangguan pada jaringan distribusi.`;

    }
    else{

        pembuka =
        `Berdasarkan seluruh data gangguan yang tersedia, terdapat <b>${total.toLocaleString("id-ID")}</b> gangguan pada jaringan distribusi.`;

    }

    // ==========================
    // Insight Dinamis
    // ==========================

    let isiInsight = pembuka;

    // Jika tidak memilih UP3
    if(filterUP3 === ""){

        isiInsight += ` Gangguan paling banyak terjadi di <b>${topUP3[0]}</b> sebanyak <b>${topUP3[1]}</b> kejadian.`;

    }
    else{

        isiInsight += ` Analisis dilakukan pada wilayah <b>UP3 ${filterUP3}</b>.`;

    }

    // Jika tidak memilih GI
    if(filterGI === ""){

        isiInsight += ` Gardu Induk dengan jumlah gangguan tertinggi adalah <b>${topGI[0]}</b> sebanyak <b>${topGI[1]}</b> kejadian.`;

    }
    else{

        isiInsight += ` Analisis difokuskan pada <b>Gardu Induk ${filterGI}</b>.`;

    }

    isiInsight += ` Penyebab gangguan yang paling dominan adalah <b>${topPenyebab[0]}</b> dengan <b>${topPenyebab[1]}</b> kejadian.`;

    isiInsight += ` ${kesimpulan}`;

    document.getElementById("insightText").innerHTML = isiInsight;
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
                        <div class="detail-value">${formatTanggalIndonesia(item.Tanggal)}</div>
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
// Tanggal
// ============================
function parseTanggal(teks){

    if(!teks) return null;

    const bagian = teks.split("/");

    return new Date(

        Number(bagian[2]),

        Number(bagian[0]) - 1,

        Number(bagian[1])

    );

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
    const tanggalData = parseTanggal(item.Tanggal);

        let lolosTanggal = true;

        if(tanggalAwal && tanggalAkhir){

            lolosTanggal =
                tanggalData >= tanggalAwal &&
                tanggalData <= tanggalAkhir;

        }

       return(

            lolosTanggal &&

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

    // ============================
    // Reset Filter Tanggal
    // ============================

    tanggalAwal = null;
    tanggalAkhir = null;

    document.getElementById("tanggalTerpilih").textContent = "Semua Periode";

    // Reset tampilan Date Range Picker
    const picker = $('#btnTanggal').data('daterangepicker');

    picker.setStartDate(moment());
    picker.setEndDate(moment());

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

