import * as THREE from
"https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

// ==========================================
// ORBIT - BEYOND EARTH
// TEAM ORVEXIA
// 3D LUNAR EXPLORATION SIMULATOR
// ==========================================

const world = document.getElementById("world");
const startScreen = document.getElementById("startScreen");
const startButton = document.getElementById("startButton");
const messageBox = document.getElementById("message");

const ui = {
    power: document.getElementById("power"),
    oxygen: document.getElementById("oxygen"),
    water: document.getElementById("water"),
    food: document.getElementById("food"),
    shield: document.getElementById("shield"),
    samples: document.getElementById("sampleCount"),
    progress: document.getElementById("progressBar"),
    day: document.getElementById("day"),
    battery: document.getElementById("battery"),
    powerFlow: document.getElementById("powerFlow"),
    missionTitle: document.getElementById("missionTitle"),
    missionText: document.getElementById("missionText"),
    objectiveText: document.getElementById("objectiveText"),
    nextMissionButton: document.getElementById("nextMissionButton"),
    sciencePowerButton: document.getElementById("sciencePowerButton"),
    learningTitle: document.getElementById("learningTitle"),
    learningText: document.getElementById("learningText")
};

// ==========================================
// GAME STATE
// ==========================================

const game = {
    started: false,
    day: 1,
    samples: 0,
    maxSamples: 3,
    vehicle: "astronaut",

    resources: {
        power: 100,
        oxygen: 100,
        water: 100,
        food: 100,
        shield: 70
    },

    solarBuilt: false,
    greenhouseBuilt: false,
    lastSurvivalUpdate: 0,

    // Mission campaign
    currentMission: 1,
    mission01Completed: false,
    mission02Completed: false,

    // Mission 02 energy simulation
    battery: 8,
    batteryCapacity: 24,
    solarArrayCount: 0,
    sunlight: 1,
    powerGeneration: 0,
    powerConsumption: 0,
    missionTime: 0,
    missionDuration: 180,
    scienceEquipmentOn: false,
    powerFailure: false,
    lastPowerTick: 0
};

// ==========================================
// THREE.JS SCENE
// ==========================================

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x030711);
scene.fog = new THREE.Fog(0x030711, 35, 100);

const camera = new THREE.PerspectiveCamera(
    65,
    window.innerWidth / window.innerHeight,
    0.1,
    300
);

camera.position.set(0, 5, 10);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

world.appendChild(renderer.domElement);

// ==========================================
// LIGHTING
// ==========================================

const ambient = new THREE.HemisphereLight(
    0xd5d9df,
    0x303030,
    0.9
);

scene.add(ambient);

const sunlight = new THREE.DirectionalLight(
    0xffffff,
    2.0
);

sunlight.position.set(-20, 30, 15);
sunlight.castShadow = true;

sunlight.shadow.mapSize.set(2048, 2048);

sunlight.shadow.camera.left = -40;
sunlight.shadow.camera.right = 40;
sunlight.shadow.camera.top = 40;
sunlight.shadow.camera.bottom = -40;

scene.add(sunlight);

// ==========================================
// STARS
// ==========================================

const starGeometry = new THREE.BufferGeometry();
const starPositions = [];

for (let i = 0; i < 1200; i++) {
    starPositions.push(
        (Math.random() - 0.5) * 180,
        Math.random() * 90 + 5,
        (Math.random() - 0.5) * 180
    );
}

starGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(starPositions, 3)
);

const stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.16
    })
);

scene.add(stars);

// ==========================================
// MOON TERRAIN
// ==========================================

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(180, 180, 100, 100),
    new THREE.MeshStandardMaterial({
        color: 0x969696,
        roughness: 1,
        metalness: 0,
        flatShading: true
    })
);

ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.25;
ground.receiveShadow = true;

const groundPositions =
    ground.geometry.attributes.position;

for (let i = 0; i < groundPositions.count; i++) {
    const x = groundPositions.getX(i);
    const y = groundPositions.getY(i);

    const variation =
        Math.sin(x * 0.15) * 0.12 +
        Math.cos(y * 0.18) * 0.12;

    groundPositions.setZ(i, variation);
}

ground.geometry.computeVertexNormals();

scene.add(ground);

// ==========================================
// MOON CRATERS
// ==========================================

function createCrater(x, z, radius) {

    const crater = new THREE.Mesh(
        new THREE.CylinderGeometry(
            radius,
            radius * 0.85,
            0.25,
            32
        ),
        new THREE.MeshStandardMaterial({
            color: 0x626262,
            roughness: 1
        })
    );

    crater.position.set(x, -0.12, z);
    scene.add(crater);

    const rim = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.16, 8, 32),
        new THREE.MeshStandardMaterial({
            color: 0xb0b0b0,
            roughness: 1
        })
    );

    rim.rotation.x = Math.PI / 2;
    rim.position.set(x, 0.02, z);

    scene.add(rim);
}

createCrater(-13, -8, 3);
createCrater(16, -14, 4);
createCrater(19, 15, 2.5);
createCrater(-20, 17, 3.5);

// ==========================================
// LUNAR ROCKS
// ==========================================

const rockMaterial = new THREE.MeshStandardMaterial({
    color: 0x777777,
    roughness: 1
});

for (let i = 0; i < 100; i++) {

    const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(
            0.3 + Math.random() * 0.9,
            0
        ),
        rockMaterial
    );

    rock.position.set(
        (Math.random() - 0.5) * 75,
        0.1,
        (Math.random() - 0.5) * 75
    );

    rock.rotation.set(
        Math.random(),
        Math.random() * 3,
        Math.random()
    );

    rock.castShadow = true;
    scene.add(rock);
}

// ==========================================
// EARTH IN THE SKY
// ==========================================

const earth = new THREE.Mesh(
    new THREE.SphereGeometry(4, 48, 48),
    new THREE.MeshStandardMaterial({
        color: 0x2674cb,
        roughness: 0.8,
        emissive: 0x061a40
    })
);

earth.position.set(-28, 22, -65);
scene.add(earth);

const earthGlow = new THREE.PointLight(
    0x397bff,
    25,
    35
);

earthGlow.position.copy(earth.position);
scene.add(earthGlow);

// ==========================================
// HABITAT
// ==========================================

const habitat = new THREE.Group();

const habitatMaterial = new THREE.MeshStandardMaterial({
    color: 0xc6d2dd,
    metalness: 0.55,
    roughness: 0.45
});

const mainHabitat = new THREE.Mesh(
    new THREE.CylinderGeometry(2.1, 2.1, 3.5, 32),
    habitatMaterial
);

mainHabitat.position.y = 1.5;
mainHabitat.castShadow = true;
mainHabitat.receiveShadow = true;

habitat.add(mainHabitat);

const roof = new THREE.Mesh(
    new THREE.SphereGeometry(
        2.1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2
    ),
    habitatMaterial
);

roof.position.y = 3.25;
habitat.add(roof);

const windowMaterial = new THREE.MeshStandardMaterial({
    color: 0x47caff,
    emissive: 0x1477bb,
    emissiveIntensity: 1.5
});

const windowMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.65, 0.12),
    windowMaterial
);

windowMesh.position.set(0, 2, 2.05);
habitat.add(windowMesh);

habitat.position.set(0, 0, -8);
scene.add(habitat);

// ==========================================
// SOLAR PANELS
// ==========================================

const solarPanels = [];

function createSolarPanel(x, z) {

    const panel = new THREE.Group();

    const support = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.15, 1.5, 12),
        habitatMaterial
    );

    support.position.y = 0.7;
    panel.add(support);

    const surface = new THREE.Mesh(
        new THREE.BoxGeometry(4, 0.12, 2.2),
        new THREE.MeshStandardMaterial({
            color: 0x12477d,
            metalness: 0.6,
            roughness: 0.25,
            emissive: 0x061a45
        })
    );

    surface.position.y = 1.5;
    panel.add(surface);

    const lines = new THREE.GridHelper(
        4,
        8,
        0x64bfff,
        0x64bfff
    );

    lines.rotation.x = Math.PI / 2;
    lines.position.y = 1.57;

    panel.add(lines);

    panel.position.set(x, 0, z);

    scene.add(panel);
    solarPanels.push(panel);
}

createSolarPanel(-5, -8);
createSolarPanel(5, -8);

// ==========================================
// GREENHOUSE
// ==========================================

function createGreenhouse(x, z) {

    const house = new THREE.Group();

    const base = new THREE.Mesh(
        new THREE.BoxGeometry(4, 2.5, 4),
        new THREE.MeshStandardMaterial({
            color: 0x1c6674,
            transparent: true,
            opacity: 0.8,
            roughness: 0.2
        })
    );

    base.position.y = 1.3;
    house.add(base);

    const light = new THREE.PointLight(
        0x55ffb2,
        12,
        9
    );

    light.position.y = 2;
    house.add(light);

    house.position.set(x, 0, z);
    scene.add(house);

    return house;
}
// ==========================================
// ASTRONAUT
// ==========================================

const astronaut = new THREE.Group();

const suitMaterial = new THREE.MeshStandardMaterial({
    color: 0xe4e9ef,
    roughness: 0.6
});

const darkMaterial = new THREE.MeshStandardMaterial({
    color: 0x26394e
});

const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.48, 24, 24),
    new THREE.MeshStandardMaterial({
        color: 0x172d45,
        metalness: 0.7,
        roughness: 0.2
    })
);

helmet.position.y = 2.45;
astronaut.add(helmet);

const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 1.1, 0.55),
    suitMaterial
);

body.position.y = 1.45;
astronaut.add(body);

const backpack = new THREE.Mesh(
    new THREE.BoxGeometry(0.65, 0.9, 0.35),
    darkMaterial
);

backpack.position.set(0, 1.5, -0.4);
astronaut.add(backpack);

function addLimb(x, y, length, material) {

    const limb = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, length, 0.28),
        material
    );

    limb.position.set(x, y, 0);
    astronaut.add(limb);

    return limb;
}

const leftArm = addLimb(-0.58, 1.45, 0.9, suitMaterial);
const rightArm = addLimb(0.58, 1.45, 0.9, suitMaterial);

const leftLeg = addLimb(-0.23, 0.52, 0.85, darkMaterial);
const rightLeg = addLimb(0.23, 0.52, 0.85, darkMaterial);

astronaut.position.set(0, 0, 2);

astronaut.traverse(object => {
    if (object.isMesh) object.castShadow = true;
});

scene.add(astronaut);

// ==========================================
// ROVER
// ==========================================

const rover = new THREE.Group();

const roverBody = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.8, 2.5),
    new THREE.MeshStandardMaterial({
        color: 0xd8a84f,
        metalness: 0.45,
        roughness: 0.6
    })
);

roverBody.position.y = 0.9;
rover.add(roverBody);

const wheels = [];

for (const x of [-1, 1]) {

    for (const z of [-0.8, 0.8]) {

        const wheel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.42, 0.42, 0.3, 20),
            darkMaterial
        );

        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, 0.42, z);

        rover.add(wheel);
        wheels.push(wheel);
    }
}

rover.position.set(6, 0, 2);
rover.visible = false;

scene.add(rover);

// ==========================================
// COLLECTIBLE SCIENCE SAMPLES
// ==========================================

const samples = [];

function createSample(x, z) {

    const sample = new THREE.Group();

    const crystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.55),
        new THREE.MeshStandardMaterial({
            color: 0x64e4ff,
            emissive: 0x1687c5,
            emissiveIntensity: 1.5,
            metalness: 0.4,
            roughness: 0.2
        })
    );

    crystal.position.y = 0.7;
    sample.add(crystal);

    const glow = new THREE.PointLight(
        0x4bdcff,
        4,
        4
    );

    glow.position.y = 0.8;
    sample.add(glow);

    sample.position.set(x, 0, z);
    scene.add(sample);

    samples.push(sample);
}

createSample(-9, 3);
createSample(12, 5);
createSample(8, -17);
createSample(-17, -5);
createSample(19, 1);

// ==========================================
// MOVEMENT
// ==========================================

const keys = {};

window.addEventListener("keydown", event => {

    keys[event.key.toLowerCase()] = true;

    if (event.key.toLowerCase() === "e") {
        collectSample();
    }

    if (event.key.toLowerCase() === "r") {
        switchVehicle();
    }
});

window.addEventListener("keyup", event => {
    keys[event.key.toLowerCase()] = false;
});

// ==========================================
// CAMERA CONTROL
// ==========================================

let cameraAngle = 0;
let cameraDistance = 9;
let cameraHeight = 5;

let dragging = false;
let lastMouseX = 0;

renderer.domElement.addEventListener("pointerdown", event => {

    dragging = true;
    lastMouseX = event.clientX;
});

window.addEventListener("pointerup", () => {
    dragging = false;
});

window.addEventListener("pointermove", event => {

    if (!dragging || !game.started) return;

    cameraAngle -= (event.clientX - lastMouseX) * 0.005;

    lastMouseX = event.clientX;
});

renderer.domElement.addEventListener("wheel", event => {

    cameraDistance = THREE.MathUtils.clamp(
        cameraDistance + event.deltaY * 0.01,
        5,
        18
    );
});

// ==========================================
// COLLECT SAMPLES - MISSION 01
// ==========================================

function collectSample() {

    if (!game.started || game.currentMission !== 1 || game.mission01Completed) return;

    const player = game.vehicle === "astronaut"
        ? astronaut
        : rover;

    let nearest = null;
    let nearestDistance = 2.5;

    samples.forEach(sample => {

        if (!sample.visible) return;

        const distance = player.position.distanceTo(
            sample.position
        );

        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearest = sample;
        }
    });

    if (!nearest) {
        showMessage("No sample nearby. Explore the Moon!");
        return;
    }

    nearest.visible = false;
    game.samples++;

    ui.samples.textContent =
        `Samples collected: ${game.samples} / 3`;

    ui.progress.style.width =
        `${Math.min(100, game.samples / 3 * 100)}%`;

    if (game.samples >= 3) {

        game.mission01Completed = true;
        ui.missionTitle.textContent = "Mission 01 complete!";
        ui.missionText.textContent =
            "You collected the required lunar samples. Your next assignment is ready.";
        ui.objectiveText.textContent = "Mission complete — Mission 02 unlocked.";
        ui.nextMissionButton.hidden = false;
        ui.learningTitle.textContent = "Science objectives achieved";
        ui.learningText.textContent =
            "Lunar samples help scientists study the Moon's geology and history. Prepare to build a reliable power system.";
        showMessage("Excellent! Mission 01 complete. Mission 02 is unlocked.");

    } else {

        showMessage("Scientific sample collected!");
    }
}

// ==========================================
// SWITCH VEHICLE
// ==========================================

function switchVehicle() {

    if (!game.started) return;

    if (game.vehicle === "astronaut") {

        game.vehicle = "rover";

        rover.position.copy(astronaut.position);

        rover.visible = true;
        astronaut.visible = false;

        showMessage("Rover activated!");

    } else {

        game.vehicle = "astronaut";

        astronaut.position.copy(rover.position);

        rover.visible = false;
        astronaut.visible = true;

        showMessage("Astronaut control activated!");
    }
}

// ==========================================
// BASE CONSTRUCTION
// ==========================================

document.getElementById("buildSolar").addEventListener(
    "click",
    () => {

        if (game.currentMission === 2) {
            deployMission02SolarArray();
            return;
        }

        if (game.solarBuilt) {
            showMessage("Solar panel already constructed!");
            return;
        }

        if (game.resources.power < 20) {
            showMessage("Not enough power to construct!");
            return;
        }

        game.resources.power -= 20;
        game.solarBuilt = true;

        createSolarPanel(-8, -13);

        updateResources();

        showMessage("Solar panel constructed!");
    }
);

document.getElementById("buildGreenhouse").addEventListener(
    "click",
    () => {

        if (game.greenhouseBuilt) {
            showMessage("Greenhouse already constructed!");
            return;
        }

        if (game.resources.power < 30) {
            showMessage("Not enough power to construct!");
            return;
        }

        game.resources.power -= 30;
        game.greenhouseBuilt = true;

        createGreenhouse(7, -13);

        updateResources();

        showMessage("Greenhouse constructed!");
    }
);

document.getElementById("restButton").addEventListener(
    "click",
    () => {

        const player = game.vehicle === "astronaut"
            ? astronaut
            : rover;

        const distance = player.position.distanceTo(
            habitat.position
        );

        if (distance > 7) {
            showMessage("Return to the habitat first!");
            return;
        }

        game.resources.oxygen = Math.min(
            100,
            game.resources.oxygen + 15
        );

        game.resources.water = Math.min(
            100,
            game.resources.water + 15
        );

        game.resources.food = Math.min(
            100,
            game.resources.food + 15
        );

        updateResources();

        showMessage("Crew rested and supplies replenished!");
    }
);
// ==========================================
// MISSION CAMPAIGN + MISSION 02 POWER SYSTEM
// ==========================================

ui.nextMissionButton.addEventListener("click", startMission02);

ui.sciencePowerButton.addEventListener("click", () => {
    if (game.currentMission !== 2 || game.mission02Completed || game.powerFailure) return;

    game.scienceEquipmentOn = !game.scienceEquipmentOn;

    ui.sciencePowerButton.textContent = game.scienceEquipmentOn
        ? "Science Equipment: ON"
        : "Science Equipment: OFF";

    showMessage(game.scienceEquipmentOn
        ? "Science equipment activated. Power consumption increased."
        : "Science equipment switched off. Power consumption reduced.");

    updateMission02Display();
});

function startMission02() {

    if (!game.mission01Completed || game.currentMission !== 1) return;

    game.currentMission = 2;
    game.battery = 8;
    game.solarArrayCount = 0;
    game.sunlight = 1;
    game.powerGeneration = 0;
    game.powerConsumption = 0.018;
    game.missionTime = 0;
    game.powerFailure = false;
    game.mission02Completed = false;
    game.scienceEquipmentOn = false;
    game.lastPowerTick = performance.now();

    ui.nextMissionButton.hidden = true;
    ui.sciencePowerButton.hidden = false;
    ui.sciencePowerButton.textContent = "Science Equipment: OFF";

    document.getElementById("buildSolar").textContent =
        "Deploy Solar Array (2 kWh)";

    document.querySelector(".location").textContent =
        "LUNAR SURFACE · MISSION 02";

    ui.missionTitle.textContent = "Powering the Outpost";

    ui.missionText.textContent =
        "Deploy functional solar arrays and keep the habitat powered for 180 simulated minutes.";

    ui.objectiveText.textContent =
        "Objective: Deploy at least 2 solar arrays and maintain battery power until the timer ends.";

    ui.samples.textContent = "Mission time: 0 / 180 minutes";
    ui.progress.style.width = "0%";

    ui.learningTitle.textContent = "How lunar power works";

    ui.learningText.textContent =
        "Solar arrays convert sunlight into electricity. Batteries store energy so the habitat can use it when sunlight is weaker.";

    showMessage("Mission 02 started! Deploy at least two functional solar arrays.");

    updateMission02Display();
}

// ==========================================
// DEPLOY SOLAR ARRAY
// ==========================================

function deployMission02SolarArray() {

    if (game.mission02Completed || game.powerFailure) {
        showMessage("This mission is no longer accepting construction orders.");
        return;
    }

    if (game.solarArrayCount >= 4) {
        showMessage("Maximum solar array limit reached.");
        return;
    }

    const deploymentCost = 2;

    if (game.battery < deploymentCost) {
        showMessage("Insufficient battery energy. Reduce consumption or wait for power.");
        return;
    }

    game.battery -= deploymentCost;
    game.solarArrayCount++;

    const positions = [
        [-10, -15],
        [-4, -18],
        [4, -18],
        [10, -15]
    ];

    const [x, z] = positions[game.solarArrayCount - 1];

    createSolarPanel(x, z);

    showMessage(
        `Solar array ${game.solarArrayCount} deployed. Battery used: 2 kWh.`
    );

    updateMission02Display();
}

// ==========================================
// UPDATE POWER DASHBOARD
// ==========================================

function updateMission02Display() {

    if (game.currentMission !== 2) return;

    const batteryPercent =
        game.battery / game.batteryCapacity * 100;

    ui.power.textContent = `${Math.round(batteryPercent)}%`;

    ui.battery.textContent =
        `${game.battery.toFixed(1)} / ${game.batteryCapacity} kWh`;

    ui.powerFlow.textContent =
        `GEN ${game.powerGeneration.toFixed(3)} / LOAD ${game.powerConsumption.toFixed(3)} kWh/min`;

    ui.day.textContent = "02";

    if (ui.power) {
        ui.power.style.color =
            batteryPercent <= 20 ? "#ff7777" : "#e9f5fa";
    }
}

// ==========================================
// MISSION 02 ENERGY SIMULATION
// ==========================================

function updateMission02() {

    if (
        game.currentMission !== 2 ||
        game.mission02Completed ||
        game.powerFailure
    ) return;

    // One real second represents one simplified simulated mission minute.
    game.missionTime++;

    // Repeating sunlight availability cycle.
    game.sunlight =
        0.6 + 0.4 * Math.sin(game.missionTime / 24);

    // Each solar array generates up to 0.045 kWh per simulated minute.
    game.powerGeneration =
        game.solarArrayCount * 0.045 * game.sunlight;

    // Habitat load plus optional science equipment load.
    game.powerConsumption =
        0.018 + (game.scienceEquipmentOn ? 0.012 : 0);

    // Battery gains energy from generation and loses energy to consumption.
    game.battery = THREE.MathUtils.clamp(
        game.battery +
        game.powerGeneration -
        game.powerConsumption,
        0,
        game.batteryCapacity
    );

    const progress = Math.min(
        100,
        game.missionTime / game.missionDuration * 100
    );

    ui.progress.style.width = `${progress}%`;

    ui.samples.textContent =
        `Mission time: ${game.missionTime} / ${game.missionDuration} minutes`;

    ui.objectiveText.textContent =
        `Solar arrays: ${game.solarArrayCount}/2 minimum · Sunlight: ${Math.round(game.sunlight * 100)}% · Time remaining: ${game.missionDuration - game.missionTime} min`;

    updateMission02Display();

    // Check for power failure.
    if (
        game.battery <= 0.001 &&
        game.powerGeneration < game.powerConsumption
    ) {

        game.powerFailure = true;

        ui.missionTitle.textContent = "Power failure";

        ui.missionText.textContent =
            "The battery is empty and generation cannot meet the habitat load. Mission 02 failed.";

        ui.learningTitle.textContent = "Energy balance matters";

        ui.learningText.textContent =
            "A lunar outpost needs enough generation and stored energy to cover its electrical demand.";

        showMessage("POWER FAILURE — The habitat has lost its energy supply.");

        return;
    }

    // Check mission completion.
    if (game.missionTime >= game.missionDuration) {

        if (game.solarArrayCount >= 2 && game.battery > 0) {

            game.mission02Completed = true;

            ui.missionTitle.textContent = "Mission 02 complete!";

            ui.missionText.textContent =
                "You maintained the outpost's power supply for the full mission duration.";

            ui.objectiveText.textContent =
                "Power system stable. Mission objectives achieved.";

            ui.learningTitle.textContent = "Engineering achievement";

            ui.learningText.textContent =
                "Your solar arrays generated electricity, while the battery balanced energy supply and demand.";

            showMessage("Mission 02 complete! The lunar outpost stayed powered.");

        } else {

            game.powerFailure = true;

            ui.missionTitle.textContent = "Mission objectives incomplete";

            ui.missionText.textContent =
                "The timer ended, but at least two solar arrays and a positive battery reserve were required.";

            showMessage("Mission ended. Deploy at least two arrays next attempt.");
        }
    }
}

// ==========================================
// RESOURCE SYSTEM
// ==========================================

function updateResources() {

    Object.keys(game.resources).forEach(key => {

        if (ui[key]) {
            ui[key].textContent =
                Math.round(game.resources[key]);
        }
    });

    if (game.currentMission === 1) {
        ui.battery.textContent = "8 / 24 kWh";
        ui.powerFlow.textContent = "STANDBY";
    }
}

function survivalUpdate() {

    if (
        !game.started ||
        game.currentMission !== 1 ||
        game.mission01Completed
    ) return;

    game.resources.oxygen -= 1;
    game.resources.water -= 0.5;
    game.resources.food -= 0.4;

    if (game.solarBuilt) {

        game.resources.power = Math.min(
            100,
            game.resources.power + 2
        );

    } else {

        game.resources.power -= 0.5;
    }

    Object.keys(game.resources).forEach(key => {

        game.resources[key] = THREE.MathUtils.clamp(
            game.resources[key],
            0,
            100
        );
    });

    updateResources();

    const critical = Object.entries(game.resources)
        .some(([key, value]) => value <= 0);

    if (critical) {
        showMessage("WARNING! A resource has reached zero!");
    }

    game.day++;

    ui.day.textContent =
        String(game.day).padStart(2, "0");
}

// ==========================================
// MESSAGES
// ==========================================

let messageTimeout;

function showMessage(message) {

    messageBox.textContent = message;
    messageBox.style.display = "block";

    clearTimeout(messageTimeout);

    messageTimeout = setTimeout(() => {
        messageBox.style.display = "none";
    }, 3000);
}

// ==========================================
// START GAME
// ==========================================

startButton.addEventListener("click", () => {

    game.started = true;
    startScreen.style.display = "none";

    showMessage(
        "Welcome Commander! Explore the lunar surface. Press E near a sample to collect it."
    );

    game.lastSurvivalUpdate = performance.now();
});

// ==========================================
// GAME LOOP
// ==========================================

const clock = new THREE.Clock();

function animate() {

    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.elapsedTime;

    samples.forEach((sample, index) => {

        if (!sample.visible) return;

        sample.rotation.y += delta;

        sample.position.y =
            0.15 + Math.sin(elapsed * 2 + index) * 0.15;
    });

    stars.rotation.y += delta * 0.003;

    if (game.started) {

        const player = game.vehicle === "astronaut"
            ? astronaut
            : rover;

        let forward = 0;
        let sideways = 0;

        if (keys.w || keys.arrowup) forward += 1;
        if (keys.s || keys.arrowdown) forward -= 1;
        if (keys.a || keys.arrowleft) sideways -= 1;
        if (keys.d || keys.arrowright) sideways += 1;

        const moving =
            forward !== 0 || sideways !== 0;

        if (moving) {

            const direction = new THREE.Vector3(
                sideways,
                0,
                -forward
            );

            direction.normalize();

            direction.applyAxisAngle(
                new THREE.Vector3(0, 1, 0),
                cameraAngle
            );

            player.position.addScaledVector(
                direction,
                delta * 5
            );

            player.position.x = THREE.MathUtils.clamp(
                player.position.x,
                -45,
                45
            );

            player.position.z = THREE.MathUtils.clamp(
                player.position.z,
                -45,
                45
            );

            player.rotation.y = Math.atan2(
                direction.x,
                direction.z
            );

            if (game.vehicle === "astronaut") {

                leftArm.rotation.x =
                    Math.sin(elapsed * 9) * 0.25;

                rightArm.rotation.x =
                    -Math.sin(elapsed * 9) * 0.25;

                leftLeg.rotation.x =
                    -Math.sin(elapsed * 9) * 0.25;

                rightLeg.rotation.x =
                    Math.sin(elapsed * 9) * 0.25;

            } else {

                wheels.forEach(wheel => {
                    wheel.rotation.x += delta * 5;
                });
            }
        }

        // Mission 02 energy updates once every real second.
        if (
            game.currentMission === 2 &&
            performance.now() - game.lastPowerTick >= 1000
        ) {

            updateMission02();
            game.lastPowerTick = performance.now();
        }

        // Mission 01 survival updates.
        if (
            game.currentMission === 1 &&
            !game.mission01Completed &&
            performance.now() - game.lastSurvivalUpdate > 30000
        ) {

            survivalUpdate();

            game.lastSurvivalUpdate = performance.now();
        }

        const target = player.position.clone();

        const cameraOffset = new THREE.Vector3(
            Math.sin(cameraAngle) * cameraDistance,
            cameraHeight,
            Math.cos(cameraAngle) * cameraDistance
        );

        const desiredCamera =
            target.clone().add(cameraOffset);

        camera.position.lerp(desiredCamera, 0.08);

        camera.lookAt(
            target.x,
            target.y + 1,
            target.z
        );

    } else {

        camera.position.set(
            Math.sin(elapsed * 0.12) * 12,
            7,
            13
        );

        camera.lookAt(0, 1, 0);
    }

    renderer.render(scene, camera);
}

animate();

// ==========================================
// RESPONSIVE SCREEN
// ==========================================

window.addEventListener("resize", () => {

    camera.aspect =
        window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );
});

updateResources();

// Initial mission interface state.
ui.battery.textContent = "8 / 24 kWh";
ui.powerFlow.textContent = "STANDBY";
ui.nextMissionButton.hidden = true;
ui.sciencePowerButton.hidden = true;
