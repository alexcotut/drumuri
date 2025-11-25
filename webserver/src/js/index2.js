import "./maplibre-gl.js";

let map;
let infoBox;

window.addEventListener('load', () => {

    // keepAwake();

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

    map.on('click', mapClick);

    infoBox = document.querySelector('#info-box');
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
    
}

function createListItem(feature) {
    if (feature.properties.ref === undefined) return null;
    const e = document.createElement('div');
    e.className = 'list-item';
    e.innerHTML = `<span>${feature.properties.ref}</span>
        <span>${feature.properties.smoothness === undefined ? '--' : feature.properties.smoothness}</span>`;
    console.log(feature.properties.way);
    return e;
}
