function initMap(coords, title, price) {

  const lat = coords[1];
  const lng = coords[0];

  // 🗺️ Map initialize
  const map = L.map('map').setView([lat, lng], 14);

  // 🌍 Tile layer (OpenStreetMap)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // 📍 Custom marker icon
  const customIcon = L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
    iconSize: [35, 35],
  });

  // 📌 Marker add
  const marker = L.marker([lat, lng], {
    icon: customIcon
  }).addTo(map);

  // 💬 Popup content
  marker.bindPopup(`
    <div style="text-align:center;">
      <strong>${title}</strong><br/>
      ₹${price} / night <br/><br/>
      <button onclick="openGoogleMaps(${lat}, ${lng})"
        style="
          background:#fe424d;
          color:white;
          border:none;
          padding:6px 10px;
          border-radius:5px;
          cursor:pointer;
        ">
        Open in Google Maps
      </button>
    </div>
  `).openPopup();

  // 🔥 Marker click → Google Maps
  marker.on("click", function () {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
  });

}

// 🌍 Separate function (for button click)
function openGoogleMaps(lat, lng) {
  window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
}