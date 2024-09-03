// Initialize the map centered on Kenya
var map = L.map('map').setView([-1.286389, 36.817223], 6);  // Coordinates for Nairobi, Kenya, with a zoom level of 6

// Add the default OpenStreetMap tiles
var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Add an alternate basemap layer (e.g., satellite view)
var satellite = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
});

// Layers control to switch between basemaps
var baseLayers = {
    "Default Map": osm,
    "Satellite View": satellite
};

// Add layers control to the map
L.control.layers(baseLayers).addTo(map);

var geojsonLayer;
var labelsLayer = L.layerGroup().addTo(map); // Layer to hold the labels for all counties

// Function to get color based on the Total value (using shades of blue and white for 0)
function getColor(d) {
    return d > 9 ? '#08306b' :  // Dark blue
           d > 6 ? '#08519c' :  // Medium-dark blue
           d > 3 ? '#3182bd' :  // Medium blue
           d > 1 ? '#6baed6' :  // Light blue
           d > 0 ? '#c6dbef' :  // Very light blue
                   '#ffffff';   // White for 0
}

// Function to style each feature
function style(feature) {
    return {
        fillColor: getColor(feature.properties.Total),
        weight: 1, // Set the border lines to be thinner (not bold)
        opacity: 1,
        color: 'black', // Set solid black borders for the counties
        fillOpacity: 0.7
    };
}

// List of companies from the image provided
var companies = [
    "AMREF", "Africa Resoure Centre", "Afya Ugavi", "Afya Uwazi", "Boresha Jamii USAID",
    "CHAI", "CIHEB", "CIPS", "CMMB", "FIND", "Fahari ya Jamii", "Fred Hollows",
    "HJFMRI", "Hellen Keller International", "IPAS", "IQVIA", "IRDO", "JHPIEGO", "JTP",
    "Jacaranda BMGF", "Jamii Tekelezi CHAK", "LVCT", "Lwala Community", "MSF", "MSH",
    "Nuru ya Mtoto", "Nutrition International", "PATH", "PS Kenya", "Think Well",
    "UNFPA", "UNICEF", "USAID Ampath uzima", "USAID DUMISHA AFYA", "USAID Nawiri",
    "USAID Tujenge Jamii UTJ program", "USP PQM", "Vision Impact", "WHO", "WRP",
    "Waltered program", "Xetova Microvision", "inSupply"
];

// Function to populate the dropdown menu
function populateDropdown() {
    var select = document.getElementById('company-select');
    companies.forEach(function(company) {
        var option = document.createElement('option');
        option.value = company;
        option.text = company;
        select.add(option);
    });
}

// Load the GeoJSON data and add it to the map
fetch('counties.geojson')
    .then(response => response.json())
    .then(data => {
        geojsonLayer = L.geoJSON(data, {
            style: style,
            onEachFeature: function (feature, layer) {
                // Bind a popup to each feature showing the Entities attribute
                layer.bindPopup(
                    `<strong>County:</strong> ${feature.properties.County}<br>
                     <strong>Total Partners:</strong> ${feature.properties.Total}<br>
                     <strong>Partners:</strong> ${feature.properties.Entities || 'No data available'}`
                );
// Add a plain text label to each county
                var countyName = feature.properties && feature.properties.County ? feature.properties.County : 'Unknown County';
                var label = L.divIcon({
                    className: 'county-label',
                    html: `<b>${countyName}</b>`,
                    iconSize: null, // Automatically size the label
                    iconAnchor: [0, 0] // Position the label correctly
                });
                L.marker(layer.getBounds().getCenter(), { icon: label }).addTo(labelsLayer);
            }
        }).addTo(map);
               

        // Populate the dropdown with company names
        populateDropdown();
    })
    .catch(error => console.error('Error loading GeoJSON:', error));

// Function to update the map based on the selected company
function updateMap(selectedCompany) {
    geojsonLayer.eachLayer(function (layer) {
        var feature = layer.feature;
        var entities = feature.properties && feature.properties.Entities ? feature.properties.Entities : ''; // Ensure 'Entities' exists

        if (entities) {
            // Check if the selected company is in the list of companies for this county
            var companyList = entities.split(',').map(function(company) {
                return company.trim().toLowerCase();
            });

            // Highlight the county if it contains the selected company
            if (companyList.includes(selectedCompany.toLowerCase())) {
                layer.setStyle({
                    color: 'black',
                    fillColor: 'yellow',
                    fillOpacity: 0.7
                });
            } else {
                // Reset the style for counties that don't match the selected company
                layer.setStyle(style(feature));
            }
        } else {
            // Reset the style for counties that don't have the 'Entities' property
            layer.setStyle(style(feature));
        }
    });
}
// Add a legend to the map
var legend = L.control({position: 'bottomleft'});

legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'legend'),
        grades = [0, 1, 3, 6, 9],
        labels = [];

    div.style.padding = '10px';
    div.style.fontSize = '14px';
    div.style.lineHeight = '20px';
    div.style.width = '180px'; // Increase the width of the legend box

    div.innerHTML = '<h4>HPT Supply Number of Partners</h4>';

    // Add the "No Partners" label specifically
    div.innerHTML +=
        '<i style="background:' + getColor(0) + '; width: 24px; height: 24px; display: inline-block; margin-right: 10px; border: 1px solid #000;"></i> No Partners<br>';

    // Loop through the remaining intervals and generate a label with a colored square for each interval
    for (var i = 1; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getColor(grades[i] + 1) + '; width: 24px; height: 24px; display: inline-block; margin-right: 10px; border: 1px solid #000;"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '&ndash;12');
    }

    return div;
};

legend.addTo(map);
// Add event listener for the dropdown menu
document.getElementById('company-select').addEventListener('change', function (e) {
    var selectedCompany = e.target.value;
    if (selectedCompany) {
        updateMap(selectedCompany); // Update the map based on the selected company
    } else {
        geojsonLayer.eachLayer(function (layer) {
            layer.setStyle(style(layer.feature)); // Reset to original style
        });
    }
});
