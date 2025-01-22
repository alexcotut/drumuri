import "./maplibre-gl.js";

let map, markers = [];

window.addEventListener('load', () => {

    keepAwake();

    map = new maplibregl.Map({
        container: 'map', // container id
        style: 'roadquality.json', // style URL
        center: [25, 46], // starting position [lng, lat]
        zoom: 9 // starting zoom
    });


    //setInterval(getLatest, 60000);
    //getLatest();
});

async function getLatest() {
    console.log('refresh');

    const response = await fetch('api/latest.php', { method: 'get' })
    const result = await response.json();

    console.log(result);

    if (Array.isArray(result)) {
        if (markers.length == 0) {
            result.forEach((r) => {
                let marker = new maplibregl.Marker()
                    .setLngLat([r.lon, r.lat])
                    .setPopup(
                        new maplibregl.Popup({ closeOnClick: false }).setHTML(r.name)
                    )
                    .addTo(map);
                //         if (r.lat == null || r.lon == null) {
                //             marker = L.marker();
                //         } else {
                //             marker = L.marker([r.lat, r.lon]);
                //         }
                markers.push(marker);
                //         marker.addTo(map);
                return;
            });
        }

        result.forEach((r, i) => {
            markers[i].setLngLat([r.lon, r.lat]);
        })

        const mapBounds = map.getBounds();
        if (!mapBounds.contains(markers[markers.length - 1].getLngLat())) {
            map.flyTo({
                center: markers[markers.length - 1].getLngLat()
            });
            console.log('recenter map');
        }

    }


}


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
