# 3D F1 Racing Game (Browser)

This is a lightweight Formula 1-like driving demo that runs in the browser without Node.js.
It uses Three.js via CDN and is designed to run in Google Chrome.

Files:
- `index.html` – game page (loads `src/main.js` as a module).
- `src/main.js` – game logic using Three.js.

How to run:
1. Open `index.html` directly in Google Chrome (File > Open File...).
2. Alternatively, serve the folder with a simple static server (optional):

```bash
# Python 3
python3 -m http.server 8000
# Then visit http://localhost:8000 in Chrome
```

Controls:
- W: accelerate
- S: brake
- A/D: steer
- R: reset

Notes:
- This is a demo with a procedurally generated oval-ish track. It is not a full destructible or physics-accurate F1 simulator.
- For better performance and features, consider adding optimized models (GLTF), audio, and physics (ammo.js/cannon.js).

Contributing:
Replace placeholder car and track with real assets (GLTF) and implement full physics for more realistic handling.

Tuning:
- The car handling parameters were tuned for a more arcade-y, responsive feel. Edit `src/main.js` to change:
	- `state.maxSpeed` (km/h) — top speed
	- `state.accel` (km/h per second) — acceleration
	- `state.brake` — braking strength
	- `state.maxSteer` — maximum steering angle
	- `state.steeringSpeed` — how quickly the steering reaches the angle

These were increased from conservative defaults to make the car faster and turn more sharply.
