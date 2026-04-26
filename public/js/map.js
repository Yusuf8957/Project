function initMap(coords, title, price) {

  const lat = coords[1];
  const lng = coords[0];

  // Initialize map
  const map = L.map('map').setView([lat, lng], 14);

  // Add OpenStreetMap tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Custom listing marker icon
  const customIcon = L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
    iconSize: [35, 35],
  });

  // Add listing marker to map
  const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

  // Bind popup with Get Directions button
  marker.bindPopup(`
    <div style="text-align:center;">
      <strong>${title}</strong><br/>
      ₹${price} / night <br/><br/>
      <button onclick="getRouteToListing(${lat}, ${lng})"
        style="
          background:#fe424d;
          color:white;
          border:none;
          padding:6px 12px;
          border-radius:5px;
          cursor:pointer;
          font-weight:600;
        ">
        🗺️ Get Directions
      </button>
    </div>
  `).openPopup();

  // Store map and listing coords globally for later use
  window._listingMap = map;
  window._listingLat = lat;
  window._listingLng = lng;
  window._routeLayer = null;
  window._userMarker = null;
}

// Draw route from user's current location to listing
function getRouteToListing(destLat, destLng) {

  // Check if geolocation is supported
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  // Get user's current location
  navigator.geolocation.getCurrentPosition(
    function (position) {
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;

      const map = window._listingMap;

      // Remove previous route and user marker if they exist
      if (window._routeLayer) {
        map.removeLayer(window._routeLayer);
      }
      if (window._userMarker) {
        map.removeLayer(window._userMarker);
      }

      // Custom icon for user's location
      const userIcon = L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/447/447031.png",
        iconSize: [35, 35],
      });

      // Add user marker to map
      window._userMarker = L.marker([userLat, userLng], { icon: userIcon })
        .addTo(map)
        .bindPopup("📍 Your Location")
        .openPopup();

      // Fetch route from OSRM (free routing, no API key needed)
      const url = `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${destLng},${destLat}?overview=full&geometries=geojson`;

      fetch(url)
        .then(res => res.json())
        .then(data => {
          if (!data.routes || data.routes.length === 0) {
            alert("Route not found.");
            return;
          }

          const route = data.routes[0];

          // Convert distance to km
          const distance = (route.distance / 1000).toFixed(1);

          // Convert duration to hours and minutes
          const duration = Math.round(route.duration / 60);
          const hours = Math.floor(duration / 60);
          const minutes = duration % 60;
          const timeStr = hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`;

          // Draw route line on map
          window._routeLayer = L.geoJSON(route.geometry, {
            style: {
              color: "#fe424d",
              weight: 5,
              opacity: 0.8,
            }
          }).addTo(map);

          // Fit map view to show full route
          map.fitBounds(window._routeLayer.getBounds(), { padding: [30, 30] });

          // Find midpoint of route to show info popup
          const midIndex = Math.floor(route.geometry.coordinates.length / 2);
          const midPoint = route.geometry.coordinates[midIndex];

          // Show route info popup at midpoint
          L.popup()
            .setLatLng([midPoint[1], midPoint[0]])
            .setContent(`
              <div style="text-align:center; font-family:sans-serif;">
                <div style="font-size:1.1rem; font-weight:700; color:#fe424d;">🚗 Route Info</div>
                <div style="margin-top:6px;">📏 Distance: <strong>${distance} km</strong></div>
                <div>⏱️ Travel Time: <strong>${timeStr}</strong></div>
                <div style="margin-top:8px;">
                  <a href="https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${destLat},${destLng}&travelmode=driving"
                    target="_blank"
                    style="
                      background:#fe424d;
                      color:white;
                      padding:5px 12px;
                      border-radius:5px;
                      text-decoration:none;
                      font-weight:600;
                      font-size:0.85rem;
                    ">
                    🚀 Start Navigation
                  </a>
                </div>
              </div>
            `)
            .openOn(map);
        })
        .catch(() => {
          alert("Failed to fetch route. Please try again.");
        });
    },
    function () {
      alert("Unable to get your location. Please allow location access.");
    }
  );
}

// Open listing location in Google Maps
function openGoogleMaps(lat, lng) {
  window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
}