import "./maplibre-gl.js";

let map;

window.addEventListener('load', () => {

    keepAwake();

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

});



async function keepAwake() {
    let wakeLock = null;

    try {
        wakeLock = await navigator.wakeLock.request("screen");
        console.log("Wake Lock is active!");
    } catch (err) {
        // The Wake Lock request has failed - usually system related, such as battery.
        console.log(`${err.name}, ${err.message}`);
    }

}
