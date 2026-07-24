/*
==========================================================
DAFTAR ISI

1. Inisialisasi Peta
2. Marker Cluster
3. Variabel Global
4. Warna Dashboard
5. Update Dashboard
6. Load Data
7. KPI
8. Utility Function
9. Chart
10. Quick Insight
11. DataTable
12. Filter
13. Marker
14. Event Listener
15. Reset Filter

==========================================================
*/

// =======================================================
// DASHBOARD MONITORING GANGGUAN DISTRIBUSI PLN UID S2JB
// =======================================================

// =======================================================
// 1. INISIALISASI PETA
// =======================================================

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
// 2. Marker Cluster
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
let chartIndikatorRele;
let chartJenis;
let chartInterval;
let chartUP3 = null;
let chartPenyulang = null;
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

    console.time("TOTAL");

    console.time("KPI");
    tampilKPI(data);
    console.timeEnd("KPI");

    console.time("Marker");
    tampilMarker(data);
    console.timeEnd("Marker");

    console.time("Bulanan");
    tampilChartBulanan(data);
    console.timeEnd("Bulanan");

    console.time("Penyebab");
    tampilChartPenyebab(data);
    console.timeEnd("Penyebab");

    console.time("Indikator Rele");
    tampilChartIndikatorRele(data);
    console.timeEnd("Indikator Rele");

    console.time("Jenis");
    tampilChartJenis(data);
    console.timeEnd("Jenis");

    console.time("Interval");
    tampilChartInterval(data);
    console.timeEnd("Interval");

    console.time("UP3");
    tampilChartUP3(data);
    console.timeEnd("UP3");

    console.time("Penyulang");
    tampilChartPenyulang(data);
    console.timeEnd("Penyulang");

    console.time("Insight");
    tampilInsight(data);
    console.timeEnd("Insight");

    console.time("Tabel");
    tampilTabel(data);
    console.timeEnd("Tabel");

    console.timeEnd("TOTAL");
}

// ============================
// Ambil Data JSON
// ============================

console.time("FETCH");

fetch("https://script.google.com/macros/s/AKfycby9ZZy7cNQeWWhbquJbuPXT6cEYVO4-CgfShtNvrFR1j78iy7o7TjSV3-FQ3pMcqBXbhA/exec")
    .then(res => res.json())
    .then(data => {

        console.timeEnd("FETCH");

        semuaData = data;
        console.log(Object.keys(data[0]));
        console.log("Jumlah data:", data.length);

        isiFilter(data);
        console.log(data.length);
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
     console.log("KPI data:", data.length);

    document.getElementById("totalGangguan").textContent = data.length;

    const sudah = data.filter(
    item => item["TINDAK LANJUT"] === "SUDAH TINDAK LANJUT"
    ).length;

    const belum = data.filter(
    item => item["TINDAK LANJUT"] === "BELUM TINDAK LANJUT"
    ).length;

    document.getElementById("sudahTL").textContent = sudah;
    document.getElementById("belumTL").textContent = belum;

    // ============================
    // Gangguan <5 dan >5 Menit
    // ============================

    const kurang5 = data.filter(
        item => item["0:05:00"] === "<5"
    ).length;

    const lebih5 = data.filter(
        item => item["0:05:00"] === ">5"
    ).length;

    document.getElementById("kurang5").textContent = kurang5;
    document.getElementById("lebih5").textContent = lebih5;

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

        if (!item["Lama Padam_Final"]) return total;

        const waktu = item["Lama Padam_Final"].split(":");

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
        const el = document.getElementById("rataPadam");

        console.log(el);
        console.log(teksDurasi);

        if (el) {
            el.textContent = teksDurasi;
        }

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

        if(!item["Tanggal Padam"]) return;

        const tgl = item["Tanggal Padam"].split("/");

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

                    color:"#111827",

                    anchor:"end",

                    align:"top",

                    offset:10,

                    clamp:true,

                    clip:false,

                    font:{

                        size:12,

                        weight:"bold"

                    },

                    formatter:function(value){

                        return value.toLocaleString("id-ID");

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

        const penyebab = item["Kelompok Penyebab"] || "Tidak Diketahui";

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

            layout:{
                padding:{
                    top:30
                }

            },

            plugins:{

                legend:{
                    display:false
                },

                datalabels:{

                    color:"#111827",

                    anchor:"end",

                    align:"end",

                    offset:5,

                    font:{
                        size:12,
                        weight:"bold"
                    }

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
// TOP INDIKATOR RELE
// ============================

function tampilChartIndikatorRele(data) {

    const rekap = {};

    data.forEach(item => {
        const indikator = item["Indikator Rele"] || "Tidak Diketahui";
        rekap[indikator] = (rekap[indikator] || 0) + 1;
    });

    const hasil = Object.entries(rekap)
        .sort((a, b) => b[1] - a[1]);

    const labels = hasil.map(item => item[0]);
    const values = hasil.map(item => item[1]);

    if (chartIndikatorRele) chartIndikatorRele.destroy();

    chartIndikatorRele = new Chart(
        document.getElementById("chartIndikatorRele"),
        {
            type: "doughnut",

            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        "#1565C0",
                        "#42A5F5",
                        "#26A69A",
                        "#66BB6A",
                        "#F9A825",
                        "#FB8C00",
                        "#EF5350",
                        "#AB47BC",
                        "#8D6E63",
                        "#78909C"
                    ],
                    borderColor: "#FFFFFF",
                    borderWidth: 2,
                    hoverOffset: 12
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "55%",

                plugins: {

                    legend: {
                        position: "bottom",
                        labels: {
                            boxWidth: 15,
                            boxHeight: 15,
                            padding: 18,
                            font: {
                                size: 12,
                                weight: "600"
                            }
                        }
                    },

                    datalabels: {
                        color: "#f4faff",
                        anchor: "center",
                        align: "center",

                        font: {
                            size: 14,
                            weight: "bold"
                        },

                        formatter: (value) => value >= 50 ? value : ""
                    }

                }
            }
        }
    );

}

// ============================
// DISTRIBUSI JENIS GANGGUAN
// ============================

function tampilChartJenis(data) {

    const canvas = document.getElementById("chartJenis");

    if (!canvas) return;

    const hasil = {};

    data.forEach(item => {

        const jenis = item["Jenis"] || "Tidak Diketahui";

        hasil[jenis] = (hasil[jenis] || 0) + 1;

    });

    const urut = Object.entries(hasil)
        .sort((a, b) => b[1] - a[1]);

    const labels = urut.map(item => item[0]);
    const values = urut.map(item => item[1]);

    if (chartJenis) {

        chartJenis.data.labels = labels;
        chartJenis.data.datasets[0].data = values;
        chartJenis.update();

        return;

    }

    chartJenis = new Chart(canvas, {

        type: "doughnut",

        data: {

            labels: labels,

            datasets: [{

                data: values,

                backgroundColor: [
                    "#005BAC",
                    "#1E88E5",
                    "#26A69A",
                    "#43A047",
                    "#F9A825",
                    "#FB8C00",
                    "#E53935",
                    "#8E24AA",
                    "#6D4C41",
                    "#546E7A"
                ],

                borderColor: "#FFFFFF",
                borderWidth: 2,
                hoverOffset: 8

            }]

        },

        options: {

            responsive: true,
            maintainAspectRatio: false,
            cutout: "55%",

            plugins: {

                legend: {

                    position: "bottom",

                    labels: {

                        boxWidth: 15,
                        boxHeight: 15,
                        padding: 15,

                        font: {
                            size: 12,
                            weight: "bold"
                        }

                    }

                },

                tooltip: {

                    callbacks: {

                        label: function(context) {

                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const persen = ((context.raw / total) * 100).toFixed(1);

                            return `${context.label}: ${context.raw} (${persen}%)`;

                        }

                    }

                },

                datalabels: {

                    color: "#FFFFFF",

                    font: {
                        size: 13,
                        weight: "bold"
                    },

                    formatter: function(value, context) {

                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const persen = (value / total) * 100;

                        return persen >= 1 ? value : "";

                    }

                }

            }

        },

        plugins: [ChartDataLabels]

    });

}

// ============================
// DISTRIBUSI INTERVAL JAM
// ============================

function tampilChartInterval(data) {
    console.log(data[0]);
    console.log(Object.keys(data[0]));
    console.log(JSON.stringify(data[0], null, 2));

    const canvas = document.getElementById("chartIntervalJam");

    if (!canvas) return;

    const hasil = {};

    data.forEach(item => {

        const interval = String(item["INTERVAL"] || "")
            .trim();

        const kategori =
            interval === ""
                ? "Tidak Diketahui"
                : interval;

        hasil[kategori] = (hasil[kategori] || 0) + 1;

    });

    const labels = Object.keys(hasil);
    const values = Object.values(hasil);

    if (chartInterval) {
        chartInterval.destroy();
    }

    chartInterval = new Chart(canvas, {

        type: "doughnut",

        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    "#005BAC",
                    "#1E88E5",
                    "#26A69A",
                    "#43A047",
                    "#F9A825",
                    "#FB8C00",
                    "#E53935",
                    "#8E24AA"
                ],
                borderWidth: 2,
                borderColor: "#fff"
            }]
        },

        options: {

            responsive: true,
            maintainAspectRatio: false,
            cutout: "55%",

            plugins: {

                legend: {
                    position: "bottom"
                },

                tooltip: {
                    callbacks: {
                        label(context) {

                            const total = context.dataset.data.reduce((a,b)=>a+b,0);

                            const persen =
                                (context.raw / total * 100).toFixed(1);

                            return `${context.label}: ${context.raw} (${persen}%)`;

                        }
                    }
                },

                datalabels: {

                    color:"#fff",

                    formatter(value,context){

                        const total=context.dataset.data.reduce((a,b)=>a+b,0);

                        const persen=value/total*100;

                        return persen>=3 ? value : "";

                    },

                    font:{
                        size:13,
                        weight:"bold"
                    }

                }

            }

        },

        plugins:[ChartDataLabels]

    });

}

// ============================
// TOP 10 UP3
// ============================

function tampilChartUP3(data){

    const canvas = document.getElementById("chartUP3");

    if(!canvas) return;

    const hasil = data.reduce((obj, item) => {

        const up3 = item.UP3 || "Tidak Diketahui";

        obj[up3] = (obj[up3] || 0) + 1;

        return obj;

    }, {});

    const urut = Object.entries(hasil)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

    const labels = urut.map(item => item[0]);
    const values = urut.map(item => item[1]);

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
// TOP 10 PENYULANG
// ============================

function tampilChartPenyulang(data){

    const canvas = document.getElementById("chartPenyulang");

    if(!canvas) return;

    const hasil = {};

    data.forEach(item=>{

        const penyulang = item.Penyulang || "Tidak Diketahui";

        hasil[penyulang] = (hasil[penyulang] || 0) + 1;

    });

    const urut = Object.entries(hasil)
        .sort((a,b)=>b[1]-a[1])
        .slice(0,10);

    const labels = urut.map(item=>item[0]);
    const values = urut.map(item=>item[1]);

    if(chartPenyulang){

        chartPenyulang.data.labels = labels;
        chartPenyulang.data.datasets[0].data = values;
        chartPenyulang.update();

        return;

    }

    chartPenyulang = new Chart(canvas,{

        type:"bar",

        data:{

            labels:labels,

            datasets:[{

                label:"Jumlah Gangguan",

                data:values,

                backgroundColor:"#F59E0B",

                hoverBackgroundColor:"#FBBF24",

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
                            size:12,
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
    // Penyulang Terbanyak
    // ==========================

    const penyulang = {};

    data.forEach(item => {

        const nama = item["Penyulang"] || "-";

        penyulang[nama] = (penyulang[nama] || 0) + 1;

    });

    const topPenyulang = Object.entries(penyulang)
        .sort((a,b)=>b[1]-a[1])[0];

    // ==========================
    // Penyebab Dominan
    // ==========================

    const penyebab = {};

    data.forEach(item => {

        const nama =  item["Kelompok Penyebab"] || "Tidak Diketahui";

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
    const filterPenyulang = document.getElementById("filterPenyulang").value;
    const filterKelompok = document.getElementById("filterKelompok").value;
    const filterTL = document.getElementById("filterTL").value;

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

    // Jika tidak memilih Penyulang
    if(filterPenyulang === ""){

        isiInsight += ` Penyulang dengan jumlah gangguan tertinggi adalah <b>${topPenyulang[0]}</b> sebanyak <b>${topPenyulang[1]}</b> kejadian.`;

    }
    else{

        isiInsight += ` Analisis difokuskan pada <b>Penyulang ${filterPenyulang}</b>.`;

    }

    isiInsight += ` Penyebab gangguan yang paling dominan adalah <b>${topPenyebab[0]}</b> dengan <b>${topPenyebab[1]}</b> kejadian.`;

    isiInsight += ` ${kesimpulan}`;

    document.getElementById("insightText").innerHTML = isiInsight;
}

// ============================
// TABEL DATA GANGGUAN
// ============================
function tampilTabel(data){

    // Pertama kali membuat DataTable
    if (!tabelGangguan){

        tabelGangguan = $("#tabelGangguan").DataTable({

            pageLength: 10,

            lengthMenu: [10,25,50,100],

            responsive: true,

            destroy: false,

            order: [],

            autoWidth: false,

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

    // Siapkan seluruh data sekaligus
    const rows = data.map((item, index) => {

        const badge =
            item["TINDAK LANJUT"] === "SUDAH TINDAK LANJUT"
            ? `<span class="badge bg-success">Sudah</span>`
            : `<span class="badge bg-warning text-dark">Belum</span>`;

        return [

            index + 1,

            item["Tanggal Padam"] || "-",

            item.Penyulang || "-",

            item.UP3 || "-",

            item.ULP || "-",

            item["Gardu Induk"] || "-",

            badge

        ];

    });

    // Tambahkan seluruh data sekaligus
    tabelGangguan.rows.add(rows);

    // Render tabel sekali saja
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
    const filterPenyulang = document.getElementById("filterPenyulang");
    const filterKelompok = document.getElementById("filterKelompok");
    const filterTL = document.getElementById("filterTL");

    filterUP3.innerHTML = '<option value="">Semua UP3</option>';
    filterULP.innerHTML = '<option value="">Semua ULP</option>';
    filterGI.innerHTML = '<option value="">Semua Gardu Induk</option>';
    filterPenyulang.innerHTML ='<option value="">Semua Penyulang</option>';
    filterKelompok.innerHTML = '<option value="">Semua Kelompok</option>';
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
    // Penyulang
    // =====================

    [...new Set(data.map(item => item.Penyulang).filter(Boolean))]
    .sort()
    .forEach(item=>{

        filterPenyulang.innerHTML +=
        `<option value="${item}">${item}</option>`;

    });

    // =====================
    // Kelompok Penyebab
    // =====================

    [...new Set(data.map(item => item["Kelompok Penyebab"]).filter(Boolean))]
    .sort()
    .forEach(item => {

        filterKelompok.innerHTML +=
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
// FILTER PENYULANG BERDASARKAN
// UP3 + ULP + GI
// ============================

function isiFilterPenyulang(){

    const up3 = document.getElementById("filterUP3").value;
    const ulp = document.getElementById("filterULP").value;
    const gi = document.getElementById("filterGI").value;

    const filterPenyulang =
    document.getElementById("filterPenyulang");

    filterPenyulang.innerHTML =
    '<option value="">Semua Penyulang</option>';

    let data = semuaData;

    if(up3 !== ""){

        data = data.filter(item => item.UP3 === up3);

    }

    if(ulp !== ""){

        data = data.filter(item => item.ULP === ulp);

    }

    if(gi !== ""){

        data = data.filter(item => item["Gardu Induk"] === gi);

    }

    const daftar =
    [...new Set(

        data
        .map(item => item.Penyulang)
        .filter(Boolean)

    )].sort();

    daftar.forEach(item=>{

        filterPenyulang.innerHTML +=
        `<option value="${item}">${item}</option>`;

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

                    <div class="status ${statusClass}">
                        ${item["TINDAK LANJUT"]}
                    </div>

                    <div class="detail-item">
                        <div class="detail-label">📷 Foto Sebelum</div>

                        <img
                            class="detail-photo"
                            src="${item.FOTO1}"
                            onclick="lihatFoto('${item.FOTO1}')"
                            onerror="this.style.display='none'">
                    </div>

                    <div class="detail-item">
                        <div class="detail-label">📷 Foto Sesudah</div>

                        ${
                            item.FOTO2
                                ? `<img
                                        class="detail-photo"
                                        src="${item.FOTO2}"
                                        onclick="lihatFoto('${item.FOTO2}')"
                                        onerror="this.style.display='none'">`
                                : `<div class="detail-value">Belum tersedia</div>`
                        }
                    </div>

                    <div class="detail-item">
                        <div class="detail-label">🔌 Penyulang</div>
                        <div class="detail-value">${item.Penyulang || "-"}</div>
                    </div>

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
                        <div class="detail-value">${formatTanggalIndonesia(item["Tanggal Padam"])}</div>
                    </div>

                    <div class="detail-item">
                        <div class="detail-label">⏱ Lama Padam</div>
                        <div class="detail-value">${item["Lama Padam_Final"] || "-"}</div>
                    </div>

                    <div class="detail-item">
                        <div class="detail-label">⚠ Penyebab</div>
                        <div class="detail-value">${item["Kelompok Penyebab"] || "-"}</div>
                    </div>

                    <div class="detail-item">
                        <div class="detail-label">📝 Justifikasi</div>
                        <div class="detail-value">${item["JUSTIFIKASI TEMUAN GANGGUAN MELALUI APPSHEET"] || "-"}</div>
                    </div>

                    <div class="detail-item">
                    <div class="detail-label">📍 Koordinat</div>
                    <div class="detail-value">
                        <a
                            href="https://www.google.com/maps?q=${item.Latitude},${item.Longitude}"
                            target="_blank"
                            style="text-decoration:none;color:#0d6efd;font-weight:500;">
                            ${item.Latitude}, ${item.Longitude}
                        </a>
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
    const penyulang = document.getElementById("filterPenyulang").value;
    const kelompok = document.getElementById("filterKelompok").value;
    const tl = document.getElementById("filterTL").value;

    const hasil = semuaData.filter(item => {
    const tanggalData = parseTanggal(item["Tanggal Padam"]);

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

            (penyulang === "" || item.Penyulang === penyulang) &&

            (kelompok === "" || item["Kelompok Penyebab"]=== kelompok) &&

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
    isiFilterPenyulang();
    filterData();

});

document.getElementById("filterULP").addEventListener("change", () => {

    isiFilterGI();
    isiFilterPenyulang();
    filterData();

});

document.getElementById("filterGI").addEventListener("change", () => {

    isiFilterPenyulang();
    filterData();

});

document.getElementById("filterPenyulang").addEventListener("change", () => {

    filterData();

});

document.getElementById("filterKelompok").addEventListener("change", () => {

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
    document.getElementById("filterPenyulang").selectedIndex = 0;
    document.getElementById("filterKelompok").selectedIndex = 0;

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

