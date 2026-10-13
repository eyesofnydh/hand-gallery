# Hand Gallery Lab

A standalone, cinematic 3D photography wheel with optional local hand tracking. It is intentionally framework-free so the module can be dropped into an existing photography site with minimal adaptation.

## Run locally

Camera access requires a secure context. Serve the `dist` directory instead of opening the HTML file directly:

```powershell
python -m http.server 4173 --directory dist
```

Then open `http://localhost:4173`.

No install or build step is required. The first hand-tracking session loads MediaPipe Tasks Vision and its hand-landmarker model from their public CDNs.

## Controls

- Open palm: rotate; horizontal hand position controls direction and speed.
- Fist: stop the wheel at its current position.
- Vertical hand movement: adjust the viewing angle.
- Pinch: open the currently selected photograph.
- Mouse/touch drag: rotate and tilt without a camera.
- Arrow keys: rotate and tilt; Enter opens the active image; Escape closes it.

## Architecture

- `gallery.js` owns the 3D wheel and pointer input.
- `hand-tracking.js` owns MediaPipe and webcam lifecycle.
- `gestures.js` converts 21 landmarks into palm, fist, and pinch states.
- `interaction-controller.js` applies gesture stabilization, dead zones, and damping.
- `debug-panel.js` exposes live configuration without rerendering the gallery.
- `config.js` is the single source for tuning values and gallery content.

Use the **Clean view** control or add `data-mode="production"` to the app shell to hide lab diagnostics while preserving the interaction engine.

## Privacy

Video frames are passed directly from the local camera element to MediaPipe in the browser. They are not recorded, stored, or sent to an application backend.

## Notes

Sample photographs are loaded from Unsplash's image CDN. Replace the entries in `dist/js/config.js` with production image URLs and alt text before integrating the module into a portfolio.
