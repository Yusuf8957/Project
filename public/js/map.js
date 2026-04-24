function initMap(coords, title, price) {

  const map = L.map('map').setView([coords[1], coords[0]], 14);

  // ✅ WORKING TILE (OpenStreetMap - no API issue)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // custom icon
  const customIcon = L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
    iconSize: [35, 35],
  });

  const marker = L.marker([coords[1], coords[0]], {
    icon: customIcon
  }).addTo(map);

  marker.bindPopup(`
    <div>
      <strong>${title}</strong><br/>
      ₹${price} / night
    </div>
  `).openPopup();
}