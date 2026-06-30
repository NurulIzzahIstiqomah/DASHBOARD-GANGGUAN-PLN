// ============================
// Inisialisasi Peta
// ============================

const map = L.map("map").setView([-3.2, 104.7], 7);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap"
}).addTo(map);

const markers = L.markerClusterGroup();

let semuaData = [];


// ============================
// Ambil Data JSON
// ============================

fetch("dashboard_data.json")
    .then(response => response.json())
    .then(data => {

        semuaData = data;

        isiFilter(data);

        tampilKPI(data);

        tampilMarker(data);

    })
    .catch(error => console.error(error));


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

    const totalENS = data.reduce((total,item)=>{

        return total + Number(item["TOTAL ENS"] || 0);

    },0);

    document.getElementById("sudahTL").textContent = sudah;

    document.getElementById("belumTL").textContent = belum;

    document.getElementById("totalENS").textContent =
        totalENS.toLocaleString("id-ID");

}

// ============================
// ISI FILTER
// ============================

function isiFilter(data){

    const filterUP3 = document.getElementById("filterUP3");
    const filterULP = document.getElementById("filterULP");
    const filterStatus = document.getElementById("filterStatus");

    const daftarUP3 = [...new Set(data.map(item => item.UP3).filter(Boolean))].sort();
    const daftarULP = [...new Set(data.map(item => item.ULP).filter(Boolean))].sort();
    const daftarStatus = [...new Set(data.map(item => item["TINDAK LANJUT"]).filter(Boolean))].sort();

    daftarUP3.forEach(item => {
        filterUP3.innerHTML += `<option value="${item}">${item}</option>`;
    });

    daftarULP.forEach(item => {
        filterULP.innerHTML += `<option value="${item}">${item}</option>`;
    });

    daftarStatus.forEach(item => {
        filterStatus.innerHTML += `<option value="${item}">${item}</option>`;
    });

}


// ============================
// Marker
// ============================

function tampilMarker(data){

    // Hapus marker lama
    markers.clearLayers();

    data.forEach(item => {

        // Ambil koordinat
        const lat = parseFloat(item.Latitude);
        const lng = parseFloat(item.Longitude);

        // Lewati jika koordinat kosong / bukan angka / di luar wilayah S2JB
        if (
            isNaN(lat) || isNaN(lng) ||
            lat < -6 || lat > -1 ||
            lng < 102 || lng > 106
        ){
            return;
        }

        // Buat marker
        const marker = L.marker([lat, lng]);

        // Klik marker
        marker.on("click", () => {

            const statusClass =
                item["TINDAK LANJUT"] === "SUDAH TINDAK LANJUT"
                ? "sudah"
                : "belum";

            document.getElementById("detail").innerHTML = `

                <div class="detail-card">

                    <div class="detail-title">
                        ${item.Penyulang}
                    </div>

                    <div class="status ${statusClass}">
                        ${item["TINDAK LANJUT"]}
                    </div>

                    <img
                        class="detail-photo"
                        src="${item.FOTO1}"
                        onclick="lihatFoto('${item.FOTO1}')"
                        style="cursor:pointer"
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
                        <div class="detail-value">
                            ${item["Penyebab Padam"] || "-"}
                        </div>
                    </div>

                    <div class="detail-item">
                        <div class="detail-label">📝 Justifikasi</div>
                        <div class="detail-value">
                            ${item["JUSTIFIKASI TEMUAN GANGGUAN MELALUI APPSHEET"] || "-"}
                        </div>
                    </div>

                </div>

            `;

            // Zoom ke lokasi
            map.flyTo([lat, lng], 13);

        });

        // Tambahkan marker ke cluster
        markers.addLayer(marker);

    });

    // Tambahkan cluster ke peta
    map.addLayer(markers);

}

document.getElementById("filterUP3")
.addEventListener("change", filterData);

document.getElementById("filterULP")
.addEventListener("change", filterData);

document.getElementById("filterStatus")
.addEventListener("change", filterData);

function filterData(){

    const up3 = document.getElementById("filterUP3").value;
    const ulp = document.getElementById("filterULP").value;
    const status = document.getElementById("filterStatus").value;

    const hasil = semuaData.filter(item=>{

        return (

            (up3==="" || item.UP3===up3)

            &&

            (ulp==="" || item.ULP===ulp)

            &&

            (status==="" || item["TINDAK LANJUT"]===status)

        );

    });

    tampilKPI(hasil);

    tampilMarker(hasil);

}

function lihatFoto(url){

    document.getElementById("fotoBesar").src = url;

    const modal = new bootstrap.Modal(
        document.getElementById("fotoModal")
    );

    modal.show();

}