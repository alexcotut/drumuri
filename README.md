# drumuri
Road quality map for Romania
## Overview

**drumuri** is a proof-of-concept web app for visualizing and editing road quality on a map of Romania. It uses [MapLibre GL JS](https://maplibre.org) for interactive maps and a custom map style to present quality information.

## Features

- Fast and responsive, with as few requests as possible
- Interactive web map with custom road quality color layers (excellent, good, intermediate, bad, very_bad, horrible, very_horrible, impassible)
- Editable road quality data: Start Edit Mode, modify segments, and save changes
- Local data visualization (no server required for viewing)
- Responsive design for desktop and mobile

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Edge, etc.)
- No backend or compilation required; works as static HTML/CSS/JS

### Run Locally

1. **Download or clone the repository:**
   ```bash
   git clone https://github.com/alexcotut/drumuri.git
   ```
2. **Open the map:**
   - Navigate to `webserver/src/index.html` and open it in your browser.
   - Or, use a local static server:
     ```bash
     cd webserver/src
     python3 -m http.server
     ```
     Then visit [http://localhost:8000](http://localhost:8000).

### File Structure

```
webserver/
  src/
    index.html         # Main app HTML
    js/index2.js       # Main JS code for map & interaction
    css/index.css      # App styling
    roadquality.json   # Map style and road quality configuration
mapdata/               # Coming soon
```

## Data & Customization

- **Road quality classes** are defined in `roadquality.json` and colored on the map via layers.
- Colors and class names can be changed in `roadquality.json`.
- To add more features or custom tiles, modify the sources in `roadquality.json`.

## Editing Functionality

- **Start Edit Mode:** Click "Start Edit Mode" and select road segments to modify their quality.
- **Save:** Persist changes locally (future: add backend for centralized data).
- **Clear:** Discard unsaved changes.

## Contributing

Pull requests and issues are welcome. Suggestions and improvements for usability, interface, and mapping logic are encouraged.

## License

This project is released under the MIT License.

