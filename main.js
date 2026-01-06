// F1-like driving game (UMD) - uses global THREE
if (typeof THREE === 'undefined') {
    console.error('THREE is not loaded.');
    document.body.innerHTML = '<div style="color:#fff;background:#111;padding:20px;display:flex;height:100vh;align-items:center;justify-content:center;">Three.js is not loaded. Open index.html via a web server or check your connection.</div>';
} else {
    // Scene + camera + renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 6, 12);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    // Lights
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    hemi.position.set(0, 50, 0);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(10, 20, 10);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    dir.shadow.camera.near = 0.5;
    dir.shadow.camera.far = 200;
    scene.add(dir);

    // Ground with grass texture
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#2b8c3e';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#1e6b2e';
    for (let i = 0; i < 1000; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const w = Math.random() * 2 + 1;
        const h = Math.random() * 10 + 5;
        ctx.fillRect(x, y, w, h);
    }
    const grassTexture = new THREE.CanvasTexture(canvas);
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(20, 12);
    const groundMat = new THREE.MeshStandardMaterial({ map: grassTexture });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 120), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Create a custom track path with straights and corners
    const trackPath = new THREE.Path();
    trackPath.moveTo(0, 0);
    trackPath.lineTo(100, 0);
    trackPath.arc(100, 20, 20, 0, -Math.PI / 2, false);
    trackPath.lineTo(100, 60);
    trackPath.arc(80, 60, 20, Math.PI / 2, Math.PI, false);
    trackPath.lineTo(0, 60);
    trackPath.arc(0, 40, 20, Math.PI, 3 * Math.PI / 2, false);
    trackPath.lineTo(0, 0);

    const outer = trackPath.getPoints(256);
    const inner = outer.map(p => new THREE.Vector2(p.x * 0.85, p.y * 0.85)).reverse();

    const trackShape = new THREE.Shape(outer);
    trackShape.holes.push(new THREE.Path().setFromPoints(inner));

    const extrudeSettings = { steps: 1, depth: 0.1, bevelEnabled: false };
    const trackGeometry = new THREE.ExtrudeGeometry(trackShape, extrudeSettings);
    const trackMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.1, roughness: 0.9 });
    const trackMesh = new THREE.Mesh(trackGeometry, trackMat);
    trackMesh.rotation.x = -Math.PI / 2;
    trackMesh.position.y = 0.02;
    trackMesh.receiveShadow = true;
    scene.add(trackMesh);

    // Add painted racing line (simple white line centered on track path)
    const centerPoints = outer.map(p => new THREE.Vector2(p.x * 0.92, p.y * 0.92));
    const lineGeom = new THREE.BufferGeometry().setFromPoints(centerPoints.map(p => new THREE.Vector3(p.x, 0.021, p.y)));
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    const racingLine = new THREE.Line(lineGeom, lineMat);
    scene.add(racingLine);

    // Kerbs along inner edge
    const kerbMatA = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const kerbMatB = new THREE.MeshStandardMaterial({ color: 0xffffff });
    for (let i = 0; i < inner.length; i += 6) {
        const p = inner[i];
        const next = inner[(i + 1) % inner.length];
        const kerb = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, 0.9), i % 2 === 0 ? kerbMatA : kerbMatB);
        kerb.position.set(p.x, 0.08, p.y);
        kerb.rotation.y = Math.atan2(next.y - p.y, next.x - p.x);
        kerb.receiveShadow = true;
        kerb.castShadow = false;
        scene.add(kerb);
    }

    // Barriers along outer edge
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.1, roughness: 0.8 });
    for (let i = 0; i < outer.length; i += 10) {
        const p = outer[i];
        const next = outer[(i + 1) % outer.length];
        const barrier = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.5), barrierMat);
        barrier.position.set(p.x, 0.5, p.y);
        barrier.rotation.y = Math.atan2(next.y - p.y, next.x - p.x);
        barrier.castShadow = true;
        barrier.receiveShadow = true;
        scene.add(barrier);
    }

    // Improved F1 car model
    const car = new THREE.Group();

    // Chassis
    const chassisMat = new THREE.MeshStandardMaterial({ color: 0xd32f2f, metalness: 0.2, roughness: 0.4 });
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 3.0), chassisMat);
    chassis.position.y = 0.45;
    chassis.castShadow = true;
    car.add(chassis);

    // Cockpit - small raised section
    const cockpitMat = new THREE.MeshStandardMaterial({ color: 0x0b0b0b });
    const cockpit = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 1.0), cockpitMat);
    cockpit.position.set(0, 0.6, -0.15);
    cockpit.castShadow = true;
    car.add(cockpit);

    // Front wing
    const fwMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const fw = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.3), fwMat);
    fw.position.set(0, 0.25, 1.55);
    fw.castShadow = true;
    car.add(fw);

    // Rear wing
    const rw = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.25), fwMat);
    rw.position.set(0, 0.55, -1.6);
    rw.castShadow = true;
    car.add(rw);

    // Sidepods
    const sidepodMat = new THREE.MeshStandardMaterial({ color: 0xd32f2f, metalness: 0.2, roughness: 0.4 });
    const leftPod = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 1.2), sidepodMat);
    leftPod.position.set(-0.9, 0.4, 0);
    leftPod.castShadow = true;
    car.add(leftPod);
    const rightPod = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 1.2), sidepodMat);
    rightPod.position.set(0.9, 0.4, 0);
    rightPod.castShadow = true;
    car.add(rightPod);

    // Exhaust
    const exhaustMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3), exhaustMat);
    exhaust.position.set(0, 0.3, -1.8);
    exhaust.rotation.z = Math.PI / 2;
    exhaust.castShadow = true;
    car.add(exhaust);

    // Wheels
    function makeWheel() {
        const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.28, 24);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0b0b0b, roughness: 0.6 });
        const w = new THREE.Mesh(wheelGeo, wheelMat);
        w.rotation.z = Math.PI / 2;
        w.castShadow = true;
        w.receiveShadow = true;
        return w;
    }
    // Create wheel groups for front wheels so we can steer (rotate the group) independently from wheel spin
    const flGroup = new THREE.Group();
    const frGroup = new THREE.Group();
    const fl = makeWheel();
    const fr = makeWheel();
    const bl = makeWheel();
    const br = makeWheel();
    // place wheels at origin of their groups and position groups relative to car
    fl.position.set(0, 0, 0);
    fr.position.set(0, 0, 0);
    flGroup.position.set(-0.85, 0.24, 1.05);
    frGroup.position.set(0.85, 0.24, 1.05);
    flGroup.add(fl);
    frGroup.add(fr);
    // rear wheels are fixed to the chassis (no steering group required)
    bl.position.set(-0.85, 0.24, -1.05);
    br.position.set(0.85, 0.24, -1.05);
    car.add(flGroup, frGroup, bl, br);

    // Visual steering state (for smooth interpolation)
    let visualSteer = 0;

    car.position.set(2, 0, 0);
    car.scale.set(1,1,1);
    scene.add(car);

    // Environment: Trees
    const treeMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    for (let i = 0; i < 8; i++) {
        const tree = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 5), treeMat);
        tree.position.set(120 + i * 5, 2.5, 70 - i * 2);
        tree.castShadow = true;
        scene.add(tree);
    }

    // Buildings and structures
    const buildingMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    // Main building
    const building = new THREE.Mesh(new THREE.BoxGeometry(10, 8, 5), buildingMat);
    building.position.set(130, 4, 20);
    building.castShadow = true;
    scene.add(building);
    // Grandstand along the track
    const grandstand = new THREE.Mesh(new THREE.BoxGeometry(50, 5, 3), buildingMat);
    grandstand.position.set(50, 2.5, 75);
    grandstand.castShadow = true;
    scene.add(grandstand);
    // Pit building
    const pitBuilding = new THREE.Mesh(new THREE.BoxGeometry(15, 4, 6), buildingMat);
    pitBuilding.position.set(0, 2, -10);
    pitBuilding.castShadow = true;
    scene.add(pitBuilding);
    // Additional building
    const building2 = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 4), buildingMat);
    building2.position.set(-20, 3, 30);
    building2.castShadow = true;
    scene.add(building2);

    // controls state
    const state = { speed: 0, maxSpeed: 140, accel: 120, brake: 300, steerAngle: 0, maxSteer: Math.PI/4, steeringSpeed: 6.0, heading: Math.PI / 2 };
    function kmhToUnitsPerSec(kmh){ return (kmh/3.6); }
    const input = { forward:false, backward:false, left:false, right:false, reset:false };
    window.addEventListener('keydown', (e)=>{
        if (e.key==='w'||e.key==='W') input.forward=true;
        if (e.key==='s'||e.key==='S') input.backward=true;
        if (e.key==='a'||e.key==='A') input.left=true;
        if (e.key==='d'||e.key==='D') input.right=true;
        if (e.key==='r'||e.key==='R') input.reset=true;
    });
    window.addEventListener('keyup', (e)=>{
        if (e.key==='w'||e.key==='W') input.forward=false;
        if (e.key==='s'||e.key==='S') input.backward=false;
        if (e.key==='a'||e.key==='A') input.left=false;
        if (e.key==='d'||e.key==='D') input.right=false;
        if (e.key==='r'||e.key==='R') input.reset=false;
    });

    // UI
    const speedEl = document.getElementById('speed');
    const lapEl = document.getElementById('lap');
    const timeEl = document.getElementById('time');

    // lap detection
    let lap = 0; let startTime = performance.now();
    let last = performance.now();

    function normalizeAngle(a){ while(a>Math.PI)a-=Math.PI*2; while(a<-Math.PI)a+=Math.PI*2; return a; }

    function update(){
        const now = performance.now(); const dt = (now-last)/1000; last = now;
        if (input.forward) state.speed += state.accel * dt; else if (input.backward) state.speed -= state.brake * dt; else state.speed -= Math.sign(state.speed)*40*dt;
        state.speed = Math.max(Math.min(state.speed, state.maxSpeed), -40);
        const steerDir = (input.left?1:0)-(input.right?1:0);
        // steering input accumulation
        state.steerAngle += steerDir * state.steeringSpeed * dt; state.steerAngle = Math.max(Math.min(state.steerAngle, state.maxSteer), -state.maxSteer);

        // when no steering input, return steering slowly towards center for stability
        if (steerDir === 0) {
            const returnSpeed = 5.5; // degrees per second-ish
            if (Math.abs(state.steerAngle) > 0.001) {
                state.steerAngle -= Math.sign(state.steerAngle) * returnSpeed * dt;
                // clamp crossing
                if (Math.sign(state.steerAngle) !== Math.sign(state.steerAngle - Math.sign(state.steerAngle) * returnSpeed * dt)) {
                    state.steerAngle = 0;
                }
            }
        }

        const velocity = kmhToUnitsPerSec(state.speed);
        // speed-aware turning multiplier: still allow quick turning at low speed, slightly reduce at high speed
        const speedFactor = 1 - Math.min(Math.abs(state.speed) / state.maxSpeed, 1) * 0.25;
        const turningMultiplier = 0.14 * speedFactor; // larger than before to make turning snappier

        state.heading += state.steerAngle * velocity * dt * turningMultiplier;
        car.position.x += Math.sin(state.heading) * velocity * dt;
        car.position.z += Math.cos(state.heading) * velocity * dt;
        car.rotation.y = state.heading;

        // animate front wheel steering (smooth) and wheel spin
        const wheelSpinFactor = 8.0;
        // smooth the visual steering so wheels don't snap: lerp visualSteer -> state.steerAngle
        const steerLerp = 0.22; // visual responsiveness
        visualSteer += (state.steerAngle - visualSteer) * Math.min(1, steerLerp * (1 + Math.abs(state.speed)/state.maxSpeed));
        // Apply visual steering to the front wheel groups (rotate around Y)
        flGroup.rotation.y = visualSteer;
        frGroup.rotation.y = visualSteer;
        // Spin wheels around local X for rolling effect
        const spin = -velocity * dt * wheelSpinFactor;
        fl.rotation.x += spin; fr.rotation.x += spin; bl.rotation.x += spin; br.rotation.x += spin;

        if (input.reset){ car.position.set(2,0,0); state.speed=0; state.heading=Math.PI/2; state.steerAngle=0; lap=0; startTime=performance.now(); }
        // Chase camera positioned behind the car
        // Lower and move the camera slightly closer behind the car for a rear chase view
        const desiredOffset = new THREE.Vector3(0, 2.5, -7).applyAxisAngle(new THREE.Vector3(0,1,0), state.heading);
        const desiredPos = new THREE.Vector3().copy(car.position).add(desiredOffset);
        // Smoothly interpolate the camera to the desired position for less jitter
        camera.position.lerp(desiredPos, 0.12);
        // Look slightly ahead of the car so the driver sees the upcoming track
        const forward = new THREE.Vector3(Math.sin(state.heading), 0, Math.cos(state.heading)).multiplyScalar(2);
        const lookAtPos = new THREE.Vector3().copy(car.position).add(new THREE.Vector3(0, 1.0, 0)).add(forward);
        camera.lookAt(lookAtPos);

        speedEl.innerText = Math.round(state.speed * 3.6);
        const elapsed = (performance.now()-startTime)/1000; timeEl.innerText = elapsed.toFixed(2); lapEl.innerText = lap;
        const distToStart = car.position.distanceTo(new THREE.Vector3(2,0,0));
        if (distToStart < 5 && state.speed > 1) { lap += 1; startTime = performance.now(); }
    }

    function checkOffTrack(){ const x = car.position.x, z = car.position.z; if (x < -10 || x > 120 || z < -10 || z > 80) { state.speed -= Math.sign(state.speed)*50*0.016; } }

    function loop(){ update(); checkOffTrack(); renderer.render(scene, camera); requestAnimationFrame(loop); }
    loop();

    window.addEventListener('resize', ()=>{ camera.aspect = window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });

    console.log('F1 web game (UMD) loaded - improved track & car');
} mainjs
