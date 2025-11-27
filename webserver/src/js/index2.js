import "./maplibre-gl.js";
import  {BusyModal} from "./busymodal.js"

let map;
let infoBox;
let editMode = false;
let editBoxContent = document.querySelector('#edit-box-content');
const customLineFeatures = [];

function customLinesCollection() {
    return {
        type: 'FeatureCollection',
        features: customLineFeatures
    };
}

async function addLineFeature(feature) {
    if (!feature || feature.type !== 'Feature') return;
    if (customLineFeatures.find(f => f.properties.way === feature.properties.way) !== undefined) return;
    customLineFeatures.push(feature);
    
    const dialog = new BusyModal();
    const wayGeometry = await getWayGeometryFromOverpass(feature.properties.way);
    feature.geometry = wayGeometry;
    dialog.dismiss();

    // Create a new div for the custom line feature entry
    const lineDiv = document.createElement('div');
    lineDiv.className = 'edit-box-line-entry';

    // Show the 'ref' value
    const refSpan = document.createElement('span');
    refSpan.textContent = feature.properties?.ref ? feature.properties.ref + ' ' : '';
    refSpan.className = 'edit-box-line-entry-ref';
    lineDiv.appendChild(refSpan);
    // Show the 'way' value
    const waySpan = document.createElement('span');
    waySpan.textContent = feature.properties?.way ?? 'unknown';
    waySpan.className = 'edit-box-line-entry-way';
    lineDiv.appendChild(waySpan);

    // Create a select element with the road quality options
    const select = document.createElement('select');
    ['excellent', 'good', 'intermediate', 'bad', 'horrible', 'impassible'].forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        select.appendChild(option);
    });
    select.value = feature.properties?.smoothness;
    lineDiv.appendChild(select);

    editBoxContent.appendChild(lineDiv);


    const source = map?.getSource('custom-lines');
    if (source) source.setData(customLinesCollection());
}

function clearLineFeatures() {
    editBoxContent.innerHTML = '';
    customLineFeatures.length = 0;
    const source = map?.getSource('custom-lines');
    if (source) source.setData(customLinesCollection());
}

window.addEventListener('load', () => {

    document.querySelector('#edit-mode-button').addEventListener('click', () => {
        editMode = !editMode;
        document.querySelector('#edit-box-hideable').style.display = editMode ? 'block' : 'none';
        document.querySelector('#edit-mode-button').textContent = editMode ? 'Edit Mode' : 'View Mode';
    });

    document.querySelector('#clear-button').addEventListener('click', () => {
        clearLineFeatures();
    });

    document.querySelector('#save-button').addEventListener('click', () => {
        saveLineFeatures();
    });

    map = new maplibregl.Map({
        container: 'map', // container id
        style: 'roadquality.json', // style URL
        center: [25, 46], // starting position [lng, lat]
        zoom: 9, // starting zoom
        attributionControl: false
    });

    map.addControl(new maplibregl.AttributionControl({
        compact: true,
        customAttribution: [
            `<a href="https://maplibre.org/">MapLibre</a>`,
            `&copy; <a href="https://www.openstreetmap.org/copyright">Openstreetmap</a> contributors`
        ]
    }));

    map.addControl(new maplibregl.NavigationControl(), 'top-right')

    map.on('load', () => {
        map.addSource('custom-lines', {
            type: 'geojson',
            data: customLinesCollection()
        });

        map.addLayer({
            id: 'custom-lines-layer',
            type: 'line',
            source: 'custom-lines',
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-blur': 0.4,
                'line-color': '#ff6600',
                'line-width': [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    9, 2,
                    13, 15
                ]
            }
        });
    });

    map.on('click', mapClick);

    infoBox = document.querySelector('#info-box');

    window.addLineFeature = addLineFeature;
    window.clearLineFeatures = clearLineFeatures;
});


function mapClick(e) {
    const features = map.queryRenderedFeatures([
        [e.point.x - 3, e.point.y - 3],
        [e.point.x + 3, e.point.y + 3]
    ], 
    { 
        layers: [
            'tunnel_motorway_inner',
            'highway_minor',
            'highway_major_inner',
            "highway_motorway_inner"
        ] 
    });


    infoBox.innerHTML = '';
    features.forEach(f => {
        const item = createListItem(f);
        if (item !== null) infoBox.appendChild(item);
    });
    if (editMode && features.length == 1) addLineFeature(features[0]);
    
}

function createListItem(feature) {
    if (feature.properties.ref === undefined) return null;
    const e = document.createElement('div');
    e.className = 'list-item';
    e.innerHTML = `<span>${feature.properties.ref}</span>
        <span>${feature.properties.smoothness === undefined ? '--' : feature.properties.smoothness}</span>`;
    return e;
}

async function getWayGeometryFromOverpass(wayId) {
  const query = `
    [out:json];
    way(${wayId});
    (._;>;);
    out geom;
  `;

  const url = "https://overpass-api.de/api/interpreter";

  const response = await fetch(url, {
    method: "POST",
    body: query
  });

  const json = await response.json();

  // Geometry is directly in json.elements
  const way = json.elements.find(el => el.type === "way");

  return wayToGeoJSON(way.geometry); 
}

function wayToGeoJSON(way) {
  return {
    type: "LineString",
    coordinates: way.map(p => [p.lon, p.lat])
  };
}




