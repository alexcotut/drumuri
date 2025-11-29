import "./maplibre-gl.js";
import { BusyModal } from "./busymodal.js"

const colors = [
    { "state": "very_horrible", "value": "rgba(207, 5, 195, 1)" },
    { "state": "excellent", "value": "rgba(28, 82, 194, 1)" },
    { "state": "good", "value": "rgba(8, 134, 71, 1)" },
    { "state": "intermediate", "value": "rgba(207, 123, 5, 1)" },
    { "state": "bad", "value": "rgba(207, 63, 5, 1)" },
    { "state": "impassible", "value": "#000" },
    { "state": "very_bad", "value": "rgba(207, 63, 5, 1)" },
    { "state": "horrible", "value": "rgba(207, 5, 195, 1)" }
];

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
    if (!wayGeometry) {
        dialog.dismiss();
        alert("Error accessing Overpass API. Please retry later.");
        return;
    }
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
        document.querySelector('#edit-mode-button').textContent = editMode ? 'Close Edit Mode' : 'Start Edit Mode';
        if (!editMode) clearLineFeatures();
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
            `&copy; <a href="https://www.openstreetmap.org/copyright">Openstreetmap</a> contributors`,
            `<a href="https://overpass-api.de">Overpass API</a>`
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
    const color = colors.find((col) => col.state == feature.properties.smoothness) || { value: "#aaa" };
    const e = document.createElement('div');
    e.className = 'list-item';
    e.innerHTML = `<span>${feature.properties.ref}</span>
        <span style="color: ${color.value}">${feature.properties.smoothness === undefined ? '--' : feature.properties.smoothness}</span>`;
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

    let response;
    try {
        response = await fetch(url, {
            method: "POST",
            body: query
        });
        if (!response.ok) return null;
    } catch (e) {
        return null;
    }

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


function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function saveLineFeatures() {
    const dialog = document.createElement('dialog');
    const changesInput = document.querySelector('#edit-box-content');
    const propertiesOnly = customLineFeatures.map((feature, idx) => {
        return { feature: feature.properties, smoothness: changesInput.children[idx].children[2].value };
    });
    const jsonString = JSON.stringify(propertiesOnly, null, 2);

    dialog.innerHTML = `
        <div style="display: flex; flex-direction: column; padding: 20px; min-width: 500px; max-width: 800px; max-height: 80vh;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h2 style="margin: 0; font-size: 1.2em;">Custom Line Features JSON</h2>
                <button id="close-json-modal" style="
                    background: #dc3545;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    padding: 5px 15px;
                    cursor: pointer;
                    font-size: 14px;
                ">Close</button>
            </div>
            <div style="
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 5px;
                padding: 15px;
                overflow: auto;
                flex: 1;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                white-space: pre-wrap;
                word-wrap: break-word;
                max-height: 60vh;
            " id="json-content">${escapeHtml(jsonString)}</div>
            <button id="copy-json-button" style="
                margin-top: 15px;
                background: #28a745;
                color: white;
                border: none;
                border-radius: 5px;
                padding: 10px 20px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
            ">Copy changes to clipboard</button>
        </div>
    `;

    document.body.appendChild(dialog);
    dialog.showModal();

    // Close button handler
    dialog.querySelector('#close-json-modal').addEventListener('click', () => {
        dialog.close();
        document.body.removeChild(dialog);
    });

    // Copy button handler
    dialog.querySelector('#copy-json-button').addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(jsonString);
            const copyButton = dialog.querySelector('#copy-json-button');
            const originalText = copyButton.textContent;
            copyButton.textContent = 'Copied!';
            copyButton.style.background = '#28a745';
            setTimeout(() => {
                copyButton.textContent = originalText;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = jsonString;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                const copyButton = dialog.querySelector('#copy-json-button');
                const originalText = copyButton.textContent;
                copyButton.textContent = 'Copied!';
                setTimeout(() => {
                    copyButton.textContent = originalText;
                }, 2000);
            } catch (fallbackErr) {
                console.error('Fallback copy failed:', fallbackErr);
            }
            document.body.removeChild(textArea);
        }
    });

    // Close on outside click
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            dialog.close();
            document.body.removeChild(dialog);
        }
    });
}

