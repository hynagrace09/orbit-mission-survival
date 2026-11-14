import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js";

// ==================================================
// ORBIT 2.0 — JUNIOR ASTRONAUT MISSION TRAINER
// Team ORVEXIA
// Mission 01: Become a Lunar Explorer
// ==================================================

// ---------- HTML ELEMENTS ----------

const get = id => document.getElementById(id);

const world = get("world");
const startScreen = get("startScreen");
const startButton = get("startButton");
const messageBox = get("message");

const ui = {
    power: get("power"),
    battery: get("battery"),
    powerFlow: get("powerFlow"),
    oxygen: get("oxygen"),
    water: get("water"),
    food: get("food"),
    shield: get("shield"),
    samples: get("sampleCount"),
    progress: get("progressBar"),
    day: get("day"),
    missionTitle: get("missionTitle"),
    missionText: get("missionText"),
    objective: get("objectiveText"),
    learningTitle: get("learningTitle"),
    learningText: get("learningText"),
    nextMissionButton: get("nextMissionButton"),
    sciencePowerButton: get("sciencePowerButton")
};

// ---------- GAME STATE ----------

const game = {
    started: false,
    completed: false,
    stage: 0,
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
    mission: 1,
    battery: 8,
    batteryCapacity: 24,
    powerTicks: 0,
    scienceEquipmentOn: false,
    lastPowerTick: 0,
    lastSurvivalUpdate: 0
};

// Mission stages:
// 0 = Inspect spacesuit
// 1 = Collect three lunar samples
// 2 = Return safely to habitat
// 3 = Mission complete

// ---------- THREE.JS SCENE ----------

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070b);

const camera = new THREE.PerspectiveCamera(
    65,
    window.innerWidth / window.innerHeight,
    0.1,
    250
);

camera.position.set(0, 5, 10);

let renderer;

try {
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance"
    });
} catch (error) {
    console.error("ORBIT graphics error:", error);
    showMessage("3D graphics could not start. Please try Firefox.");
    throw error;
}

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

world.appendChild(renderer.domElement);

// ---------- LIGHTING ----------

const ambient = new THREE.HemisphereLight(
    0xc2c9d2,
    0x302d29,
    1.0
);
scene.add(ambient);

const sunlight = new THREE.DirectionalLight(
    0xffffff,
    2.2
);

sunlight.position.set(-25, 35, 20);
sunlight.castShadow = true;
sunlight.shadow.mapSize.set(1024, 1024);
sunlight.shadow.camera.left = -45;
sunlight.shadow.camera.right = 45;
sunlight.shadow.camera.top = 45;
sunlight.shadow.camera.bottom = -45;
scene.add(sunlight);

// ---------- STARS ----------

const starPositions = [];

for (let i = 0; i < 900; i++) {
    starPositions.push(
        (Math.random() - 0.5) * 180,
        Math.random() * 85 + 5,
        (Math.random() - 0.5) * 180
    );
}

const starGeometry = new THREE.BufferGeometry();

starGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(starPositions, 3)
);

const stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.12
    })
);

scene.add(stars);

// ---------- LUNAR TERRAIN: NEUTRAL GREY MOON ----------

const groundGeometry = new THREE.PlaneGeometry(
    180, 180, 120, 120
);

const groundPositions = groundGeometry.attributes.position;

for (let i = 0; i < groundPositions.count; i++) {
    const x = groundPositions.getX(i);
    const z = groundPositions.getY(i);

    const height =
        Math.sin(x * 0.12) * 0.22 +
        Math.cos(z * 0.16) * 0.18 +
        Math.sin((x + z) * 0.08) * 0.12;

    groundPositions.setZ(i, height);
}

groundGeometry.computeVertexNormals();

const ground = new THREE.Mesh(
    groundGeometry,
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

scene.add(ground);

// ---------- CRATERS ----------

function createCrater(x, z, radius) {
    const depression = new THREE.Mesh(
        new THREE.CylinderGeometry(
            radius,
            radius * 0.82,
            0.35,
            32,
            1,
            true
        ),
        new THREE.MeshStandardMaterial({
            color: 0x46443f,
            side: THREE.DoubleSide,
            roughness: 1
        })
    );

    depression.position.set(x, -0.18, z);
    scene.add(depression);

    const rim = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.18, 8, 32),
        new THREE.MeshStandardMaterial({
            color: 0xaaa49a,
            roughness: 1
        })
    );

    rim.rotation.x = Math.PI / 2;
    rim.position.set(x, 0.03, z);
    scene.add(rim);
}

createCrater(-15, -10, 3.5);
createCrater(17, -15, 4);
createCrater(20, 17, 2.5);
createCrater(-21, 18, 3.5);

// ---------- LUNAR ROCKS ----------

const rockMaterial = new THREE.MeshStandardMaterial({
    color: 0x77736c,
    roughness: 1,
    flatShading: true
});

for (let i = 0; i < 100; i++) {
    const size = 0.25 + Math.random() * 0.65;

    const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(size, 0),
        rockMaterial
    );

    rock.position.set(
        (Math.random() - 0.5) * 75,
        size * 0.45,
        (Math.random() - 0.5) * 75
    );

    rock.rotation.set(
        Math.random(),
        Math.random() * 3,
        Math.random()
    );

    rock.castShadow = true;
    rock.receiveShadow = true;
    scene.add(rock);
}

// ---------- EARTH ----------

const earth = new THREE.Mesh(
    new THREE.SphereGeometry(3.5, 32, 32),
    new THREE.MeshStandardMaterial({
        color: 0x2865a2,
        roughness: 0.9,
        emissive: 0x071629
    })
);

earth.position.set(-28, 22, -65);
scene.add(earth);

// ---------- HABITAT ----------

const habitat = new THREE.Group();

const habitatMaterial = new THREE.MeshStandardMaterial({
    color: 0xb7c0c8,
    metalness: 0.45,
    roughness: 0.6
});

const habitatBody = new THREE.Mesh(
    new THREE.CylinderGeometry(2.1, 2.1, 3.5, 32),
    habitatMaterial
);

habitatBody.position.y = 1.5;
habitatBody.castShadow = true;
habitat.add(habitatBody);

const habitatRoof = new THREE.Mesh(
    new THREE.SphereGeometry(
        2.1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2
    ),
    habitatMaterial
);

habitatRoof.position.y = 3.25;
habitat.add(habitatRoof);

const windowMaterial = new THREE.MeshStandardMaterial({
    color: 0x356d83,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0x102b35
});

const habitatWindow = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.65, 0.12),
    windowMaterial
);

habitatWindow.position.set(0, 2, 2.05);
habitat.add(habitatWindow);

habitat.position.set(0, 0, -8);
scene.add(habitat);

// ---------- SUIT INSPECTION STATION ----------

const suitStation = new THREE.Group();

const stationBase = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 1.4, 0.8),
    new THREE.MeshStandardMaterial({
        color: 0x4b5660,
        metalness: 0.6,
        roughness: 0.6
    })
);

stationBase.position.y = 0.7;
suitStation.add(stationBase);

const stationScreen = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.45, 0.08),
    new THREE.MeshStandardMaterial({
        color: 0x4ba6b5,
        emissive: 0x164b55
    })
);

stationScreen.position.set(0, 1.05, 0.43);
suitStation.add(stationScreen);

suitStation.position.set(3.5, 0, -4);
scene.add(suitStation);

// ---------- ASTRONAUT ----------

const astronaut = new THREE.Group();

const suitMaterial = new THREE.MeshStandardMaterial({
    color: 0xd8dce0,
    roughness: 0.75
});

const darkMaterial = new THREE.MeshStandardMaterial({
    color: 0x303c48,
    roughness: 0.8
});

const helmetMaterial = new THREE.MeshStandardMaterial({
    color: 0x263d4c,
    metalness: 0.8,
    roughness: 0.18
});

const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.48, 24, 24),
    helmetMaterial
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

function createLimb(x, y, length, material) {
    const limb = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, length, 0.28),
        material
    );

    limb.position.set(x, y, 0);
    astronaut.add(limb);

    return limb;
}

const leftArm = createLimb(-0.58, 1.45, 0.9, suitMaterial);
const rightArm = createLimb(0.58, 1.45, 0.9, suitMaterial);
const leftLeg = createLimb(-0.23, 0.52, 0.85, darkMaterial);
const rightLeg = createLimb(0.23, 0.52, 0.85, darkMaterial);

astronaut.position.set(0, 0, 2);

astronaut.traverse(object => {
    if (object.isMesh) object.castShadow = true;
});

scene.add(astronaut);

// ---------- LOAD REAL 3D ASTRONAUT AND HABITAT ----------

const gltfLoader = new GLTFLoader();

function loadRealModel(path, target, targetHeight, modelName) {
    gltfLoader.load(
        path,

        (gltf) => {
            const model = gltf.scene;

            // Measure the original model.
            const box = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            const center = new THREE.Vector3();

            box.getSize(size);
            box.getCenter(center);

            if (size.y <= 0) {
                console.error(modelName + " has invalid dimensions.");
                return;
            }

            // Resize it to fit the game.
            const scale = targetHeight / size.y;
            model.scale.setScalar(scale);

            // Center it and place its feet on the ground.
            model.position.set(
                -center.x * scale,
                -box.min.y * scale,
                -center.z * scale
            );

            // Enable shadows.
            model.traverse((object) => {
                if (object.isMesh) {
                    object.castShadow = true;
                    object.receiveShadow = true;
                }
            });

            // Hide the simple placeholder model.
            target.children.forEach((child) => {
                child.visible = false;
            });

            // Add the real model.
            target.add(model);

            console.info(modelName + " loaded successfully.");
            showMessage(modelName + " 3D model loaded!");
        },

        undefined,

        (error) => {
            console.error("Could not load " + modelName, error);
            showMessage(
                modelName + " model failed to load. Using fallback model."
            );
        }
    );
}

// Load the astronaut model.
loadRealModel(
    "./assets/models/Astronaut.glb",
    astronaut,
    2.8,
    "Astronaut"
);

// Load the lunar habitat model.
loadRealModel(
    "./assets/models/Habitat%20Demonstration%20Unit%20(part%201).glb",
    habitat,
    5.0,
    "Lunar Habitat"
);

// ---------- ROVER ----------

const rover = new THREE.Group();

const roverBody = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.8, 2.5),
    new THREE.MeshStandardMaterial({
        color: 0xb8a477,
        metalness: 0.5,
        roughness: 0.65
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

// ---------- SCIENCE SAMPLES ----------

const samples = [];

function createSample(x, z) {
    const sample = new THREE.Group();

    const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.42, 0),
        new THREE.MeshStandardMaterial({
            color: 0x99938a,
            roughness: 1
        })
    );

    rock.position.y = 0.35;
    sample.add(rock);

    const marker = new THREE.Mesh(
        new THREE.TorusGeometry(0.55, 0.035, 6, 24),
        new THREE.MeshBasicMaterial({
            color: 0x79d9ee
        })
    );

    marker.rotation.x = Math.PI / 2;
    marker.position.y = 0.12;
    sample.add(marker);

    sample.position.set(x, 0, z);
    sample.visible = false;

    scene.add(sample);
    samples.push(sample);
}

createSample(-9, 3);
createSample(12, 5);
createSample(8, -17);

// ---------- SOLAR ARRAY ----------

const solarPanels = [];

function createSolarPanel(x, z) {
    const panel = new THREE.Group();

    const support = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.15, 1.5, 10),
        habitatMaterial
    );

    support.position.y = 0.7;
    panel.add(support);

    const surface = new THREE.Mesh(
        new THREE.BoxGeometry(4, 0.12, 2.2),
        new THREE.MeshStandardMaterial({
            color: 0x173d62,
            metalness: 0.65,
            roughness: 0.35
        })
    );

    surface.position.y = 1.5;
    panel.add(surface);

    panel.position.set(x, 0, z);
    scene.add(panel);
    solarPanels.push(panel);
}

createSolarPanel(-5, -8);
createSolarPanel(5, -8);

// ---------- GREENHOUSE ----------

function createGreenhouse(x, z) {
    const house = new THREE.Group();

    const shell = new THREE.Mesh(
        new THREE.BoxGeometry(4, 2.5, 4),
        new THREE.MeshPhysicalMaterial({
            color: 0x8ab5bb,
            transparent: true,
            opacity: 0.28,
            roughness: 0.2,
            metalness: 0.1
        })
    );

    shell.position.y = 1.3;
    house.add(shell);

    const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x9da8aa,
        metalness: 0.7,
        roughness: 0.4
    });

    for (const xPos of [-2, 2]) {
        for (const zPos of [-2, 2]) {
            const frame = new THREE.Mesh(
                new THREE.CylinderGeometry(0.07, 0.07, 2.6, 8),
                frameMaterial
            );

            frame.position.set(xPos, 1.3, zPos);
            house.add(frame);
        }
    }

    const light = new THREE.PointLight(0x8ad6b1, 4, 8);
    light.position.y = 2;
    house.add(light);

    house.position.set(x, 0, z);
    scene.add(house);

    return house;
}

// ---------- INPUT ----------

const keys = {};

window.addEventListener("keydown", event => {
    const key = event.key.toLowerCase();

    keys[key] = true;

    if (key === "e" && !event.repeat) {
        interact();
    }

    if (key === "r" && !event.repeat) {
        switchVehicle();
    }
});

window.addEventListener("keyup", event => {
    keys[event.key.toLowerCase()] = false;
});

// ---------- CAMERA ----------

let cameraAngle = 0;
let cameraDistance = 9;
let cameraHeight = 5;
let dragging = false;
let lastMouseX = 0;

renderer.domElement.addEventListener("pointerdown", event => {
    dragging = true;
    lastMouseX = event.clientX;
    renderer.domElement.setPointerCapture(event.pointerId);
});

renderer.domElement.addEventListener("pointerup", () => {
    dragging = false;
});

renderer.domElement.addEventListener("pointercancel", () => {
    dragging = false;
});

renderer.domElement.addEventListener("pointermove", event => {
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

// ---------- MISSION INTERACTION ----------

function setLearning(title, text) {
    ui.learningTitle.textContent = title;
    ui.learningText.textContent = text;
}

function updateMission(progress, objective) {
    ui.progress.style.width = `${progress}%`;
    ui.objective.textContent = objective;
}

function startMission() {
    game.started = true;
    startScreen.style.display = "none";

    updateOrientationHint();

    game.lastSurvivalUpdate = performance.now();

    samples.forEach(sample => {
        sample.visible = true;
    });

    setLearning(
        "Your spacesuit is your lifeline",
        "The spacesuit provides pressure, oxygen, temperature control and protection. The Moon has almost no atmosphere, so astronauts cannot survive outside without it."
    );

    ui.missionTitle.textContent = "Mission 01: Suit Inspection";
    ui.missionText.textContent =
        "Inspect your spacesuit and life-support equipment before leaving the habitat.";

    updateMission(0, "Objective: Inspect the suit station.");

    showMessage(
        "Commander, inspect your spacesuit. Move near the equipment and press E."
    );
}
function interact() {
    if (!game.started || game.completed) return;

    const player = game.vehicle === "astronaut"
        ? astronaut
        : rover;

    if (game.stage === 0) {
        const distance = player.position.distanceTo(
            suitStation.position
        );

        if (distance > 3.5) {
            showMessage("Move closer to the suit inspection station.");
            return;
        }

        game.stage = 1;

        ui.missionTitle.textContent = "Mission 01: Lunar Exploration";
        ui.missionText.textContent =
            "Your suit inspection is complete. Explore the marked locations and collect three lunar samples.";

        updateMission(0, "Objective: Collect three scientific samples.");

        setLearning(
            "Why do astronauts wear spacesuits?",
            "A spacesuit is a personal spacecraft. It maintains pressure, supplies breathable oxygen and protects the astronaut from extreme temperatures and the vacuum of space."
        );

        showMessage("Suit inspection complete! Begin lunar exploration.");
        return;
    }

    if (game.stage === 1) {
        collectSample(player);
        return;
    }

    if (game.stage === 2) {
        const distance = player.position.distanceTo(
            habitat.position
        );

        if (distance > 5) {
            showMessage("Return to the habitat before ending the mission.");
            return;
        }

        completeMission();
    }
}

// ---------- SAMPLE COLLECTION ----------

function collectSample(player) {
    let nearest = null;
    let nearestDistance = 2.5;

    samples.forEach(sample => {
        if (!sample.visible) return;

        const distance = player.position.distanceTo(
            sample.position
        );

        if (distance < nearestDistance) {
            nearest = sample;
            nearestDistance = distance;
        }
    });

    if (!nearest) {
        showMessage("No sample nearby. Explore the marked locations.");
        return;
    }

    nearest.visible = false;
    game.samples++;

    const progress = game.samples / game.maxSamples * 100;

    updateMission(
        progress,
        `Objective: Collect lunar samples (${game.samples}/3).`
    );

    ui.samples.textContent =
        `Samples collected: ${game.samples} / 3`;

    setLearning(
        "Lunar geology",
        "Moon rocks provide evidence about the Moon's formation and geological history. Scientists study their minerals, age and composition to understand how the Moon evolved."
    );

    showMessage("Scientific sample collected!");

    if (game.samples >= game.maxSamples) {
        game.stage = 2;

        ui.missionTitle.textContent = "Mission 01: Return to Base";
        ui.missionText.textContent =
            "You have collected all three samples. Return safely to the lunar habitat.";

        updateMission(
            85,
            "Objective: Return to the habitat and press E."
        );

        setLearning(
            "Why must astronauts return safely?",
            "Astronauts have limited oxygen, battery power and mission time. Returning to their habitat allows them to recharge equipment, review samples and prepare for their next activity."
        );

        showMessage("All samples collected! Return to your habitat.");
    }
}

// ---------- MISSION COMPLETION ----------

function completeMission() {
    game.stage = 3;
    game.completed = true;

    ui.missionTitle.textContent = "Mission 01 Complete!";
    ui.missionText.textContent =
        "You inspected your spacesuit, collected three lunar samples and returned safely to base.";

    ui.samples.textContent = "Mission completed!";
    updateMission(100, "All mission objectives completed.");

    setLearning(
        "What have you learned?",
        "You learned why astronauts need spacesuits, how they explore the lunar surface, why scientists collect Moon rocks and why returning safely to the habitat matters."
    );

    ui.nextMissionButton.hidden = false;
    ui.nextMissionButton.textContent = "START MISSION 02";
    showMessage("Congratulations, Commander! Mission 01 completed.");
}

function startMissionTwo() {
    game.mission = 2;
    game.started = true;
    game.completed = false;
    game.stage = 4;
    game.solarBuilt = false;
    game.battery = 8;
    game.powerTicks = 0;
    game.scienceEquipmentOn = false;
    game.lastPowerTick = performance.now();
    ui.nextMissionButton.hidden = true;
    ui.sciencePowerButton.hidden = false;
    ui.sciencePowerButton.textContent = "Science Equipment: OFF";
    const locationLabel = document.querySelector(".location");
    if (locationLabel) locationLabel.textContent = "LUNAR SURFACE · MISSION 02";
    ui.missionTitle.textContent = "Mission 02: Powering the Outpost";
    ui.missionText.textContent = "Deploy one additional solar array and keep the habitat powered through six simulated lunar operating hours.";
    ui.samples.textContent = "Power mission: 0 / 6 hours";
    updateMission(0, "Objective: Deploy an additional solar array.");
    setLearning(
        "How a lunar power system works",
        "Solar arrays convert sunlight into electricity. Batteries store energy so essential habitat systems can continue operating when sunlight is reduced."
    );
    updatePowerDisplay();
    showMessage("Mission 02 begins. Deploy another solar array, then manage the outpost's energy.");
}

ui.nextMissionButton.addEventListener("click", startMissionTwo);

function updatePowerDisplay() {
    if (!ui.battery || !ui.powerFlow) return;
    ui.battery.textContent = `${game.battery.toFixed(1)} / ${game.batteryCapacity} kWh`;
    ui.powerFlow.textContent = game.mission === 2
        ? `${game.solarBuilt ? "ARRAY ONLINE" : "LOW GENERATION"}`
        : "STANDBY";
    ui.power.textContent = Math.round(game.battery / game.batteryCapacity * 100);
}

function powerMissionTick() {
    if (game.mission !== 2 || game.completed || !game.started) return;

    const sunlightCycle = [0.18, 0.38, 0.72, 1.0, 0.82, 0.28];
    const sunlight = sunlightCycle[game.powerTicks % sunlightCycle.length];
    const arrayCount = solarPanels.length;
    const generation = arrayCount * 1.15 * sunlight;
    const baseLoad = 1.25;
    const scienceLoad = game.scienceEquipmentOn ? 0.8 : 0;
    const demand = baseLoad + scienceLoad;
    const netEnergy = generation - demand;

    game.battery = THREE.MathUtils.clamp(
        game.battery + netEnergy,
        0,
        game.batteryCapacity
    );
    game.resources.power = game.battery / game.batteryCapacity * 100;
    game.powerTicks++;

    updateResources();
    updatePowerDisplay();

    const progress = Math.min(100, game.powerTicks / 6 * 100);
    ui.samples.textContent = `Power mission: ${Math.min(game.powerTicks, 6)} / 6 hours`;
    updateMission(
        progress,
        `Hour ${game.powerTicks}/6 · Sunlight ${(sunlight * 100).toFixed(0)}% · Generation ${generation.toFixed(1)} kW · Demand ${demand.toFixed(1)} kW`
    );

    setLearning(
        netEnergy >= 0 ? "Energy surplus" : "Battery supplying the habitat",
        netEnergy >= 0
            ? "The solar arrays are producing more electricity than the habitat is using. The extra energy is stored in the battery."
            : "The habitat needs more electricity than the arrays are producing. The battery supplies the difference, so stored energy decreases."
    );

    if (game.battery <= 0) {
        showMessage("POWER FAILURE: The battery is empty. Turn off science equipment and try again.");
        game.powerTicks = Math.max(0, game.powerTicks - 1);
        return;
    }
     
    if (game.powerTicks >= 6) {
        if (solarPanels.length >= 3 && game.battery >= 4) {
            game.completed = true;
            ui.missionTitle.textContent = "Mission 02 Complete!";
            ui.missionText.textContent = "You deployed an additional solar array and maintained stored energy through six simulated operating hours.";
            ui.samples.textContent = "Mission completed!";
            updateMission(100, "All power-system objectives completed.");
            setLearning(
                "What have you learned?",
                "Solar arrays generate electricity when illuminated. Batteries store energy for periods of lower sunlight. Engineers must balance generation, storage and equipment demand."
            );
            ui.nextMissionButton.hidden = true;
            showMessage("Excellent work, Commander! The outpost power system remained operational.");
        } else {
            showMessage("Power hours complete, but the reserve is too low. Improve your energy strategy and try again.");
            game.powerTicks = 0;
            game.battery = Math.max(4, game.battery);
        }
    }
}

// ---------- VEHICLE SWITCHING ----------

function switchVehicle() {
    if (!game.started || game.completed) return;

    if (game.vehicle === "astronaut") {
        game.vehicle = "rover";
        rover.position.copy(astronaut.position);
        rover.visible = true;
        astronaut.visible = false;
        showMessage("Rover activated.");
    } else {
        game.vehicle = "astronaut";
        astronaut.position.copy(rover.position);
        rover.visible = false;
        astronaut.visible = true;
        showMessage("Astronaut control activated.");
    }
}

// ---------- BASE SYSTEMS ----------

get("buildSolar").addEventListener("click", () => {
    if (!game.started) return;

    if (game.solarBuilt) {
        showMessage("The additional solar array is already deployed.");
        return;
    }

    if (game.mission === 2) {
        if (game.battery < 5.5) {
            showMessage("Battery reserve too low to deploy the additional array.");
            return;
        }
        game.battery -= 2.5;
    } else {
        if (game.resources.power < 20) {
            showMessage("Insufficient stored power.");
            return;
        }
        game.resources.power -= 20;
    }

    game.solarBuilt = true;

    createSolarPanel(-8, -13);
    updateResources();

    setLearning(
        "How solar power works",
        "Solar panels convert sunlight into electrical energy. A lunar outpost can store some of this energy in batteries for later use."
    );

    if (game.mission === 2) {
        showMessage("Additional solar array deployed. Generation capacity increased.");
        updatePowerDisplay();
        updateMission(0, "Array deployed. Maintain battery reserve through six operating hours.");
    } else {
        showMessage("Solar array deployed. Power generation enabled.");
    }
});

get("buildGreenhouse").addEventListener("click", () => {
    if (!game.started) return;

    if (game.greenhouseBuilt) {
        showMessage("Greenhouse already constructed.");
        return;
    }

    if (game.resources.power < 30) {
        showMessage("Insufficient stored power.");
        return;
    }

    game.resources.power -= 30;
    game.greenhouseBuilt = true;

    createGreenhouse(7, -13);
    updateResources();

    setLearning(
        "Growing food in space",
        "A pressurised greenhouse could use controlled water, light, nutrients and temperature to grow plants. It would require energy and careful maintenance."
    );

    showMessage("Greenhouse constructed. Food production system ready for future missions.");
});

ui.sciencePowerButton.addEventListener("click", () => {
    if (game.mission !== 2 || game.completed) return;
    game.scienceEquipmentOn = !game.scienceEquipmentOn;
    ui.sciencePowerButton.textContent = `Science Equipment: ${game.scienceEquipmentOn ? "ON" : "OFF"}`;
    showMessage(game.scienceEquipmentOn
        ? "Science equipment online. Energy demand has increased."
        : "Science equipment switched off. Energy demand reduced.");
});

get("restButton").addEventListener("click", () => {
    if (!game.started) return;

    const player = game.vehicle === "astronaut"
        ? astronaut
        : rover;

    const distance = player.position.distanceTo(
        habitat.position
    );

    if (distance > 7) {
        showMessage("Return to the habitat first.");
        return;
    }

    game.resources.oxygen = Math.min(
        100, game.resources.oxygen + 10
    );

    game.resources.water = Math.min(
        100, game.resources.water + 10
    );

    game.resources.food = Math.min(
        100, game.resources.food + 10
    );

    updateResources();

    setLearning(
        "Life inside a lunar habitat",
        "A pressurised habitat protects astronauts from the vacuum and harsh conditions outside. Life-support equipment manages air, water and temperature."
    );

    showMessage("Habitat supplies checked. Crew rest period simulated.");
});

// ---------- RESOURCE SYSTEM ----------

function updateResources() {
    if (game.mission === 2) {
        game.resources.power = game.battery / game.batteryCapacity * 100;
    }
    Object.keys(game.resources).forEach(key => {
        ui[key].textContent =
            Math.round(game.resources[key]);
    });
}

function survivalUpdate() {
    if (!game.started || game.completed) return;

    game.resources.oxygen -= 0.5;
    game.resources.water -= 0.25;
    game.resources.food -= 0.15;

    if (game.solarBuilt) {
        game.resources.power = Math.min(
            100,
            game.resources.power + 2
        );
    } else {
        game.resources.power -= 0.2;
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
        showMessage("Resource warning! Return to the habitat and review supplies.");
    }

    game.day++;
    ui.day.textContent =
        String(game.day).padStart(2, "0");
}

// ---------- MESSAGES ----------

let messageTimeout;

function showMessage(message) {
    messageBox.textContent = message;
    messageBox.style.display = "block";

    clearTimeout(messageTimeout);

    messageTimeout = setTimeout(() => {
        messageBox.style.display = "none";
    }, 3500);
}

// ---------- START ----------

startButton.addEventListener("click", startMission);

// ---------- GAME LOOP ----------

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.elapsedTime;

    stars.rotation.y += delta * 0.002;

    if (game.started && !game.completed) {
        const player = game.vehicle === "astronaut"
            ? astronaut
            : rover;

        let forward = 0;
        let sideways = 0;

        if (keys.w || keys.arrowup) forward += 1;
        if (keys.s || keys.arrowdown) forward -= 1;
        if (keys.a || keys.arrowleft) sideways -= 1;
        if (keys.d || keys.arrowright) sideways += 1;

        const moving = forward !== 0 || sideways !== 0;

        if (moving) {
            const direction = new THREE.Vector3(
                sideways, 0, -forward
            );

            direction.normalize();

            direction.applyAxisAngle(
                new THREE.Vector3(0, 1, 0),
                cameraAngle
            );

            const speed = game.vehicle === "rover" ? 7 : 3.5;

            player.position.addScaledVector(
                direction,
                delta * speed
            );

            player.position.x = THREE.MathUtils.clamp(
                player.position.x, -45, 45
            );

            player.position.z = THREE.MathUtils.clamp(
                player.position.z, -45, 45
            );

            player.rotation.y = Math.atan2(
                direction.x,
                direction.z
            );

            if (game.vehicle === "astronaut") {
                leftArm.rotation.x = Math.sin(elapsed * 4) * 0.15;
                rightArm.rotation.x = -Math.sin(elapsed * 4) * 0.15;
                leftLeg.rotation.x = -Math.sin(elapsed * 4) * 0.18;
                rightLeg.rotation.x = Math.sin(elapsed * 4) * 0.18;
            } else {
                wheels.forEach(wheel => {
                    wheel.rotation.x += delta * 4;
                });
            }
        }

        if (
            game.mission === 2 &&
            performance.now() - game.lastPowerTick > 8000
        ) {
            powerMissionTick();
            game.lastPowerTick = performance.now();
        }

        if (
            game.mission === 1 &&
            performance.now() - game.lastSurvivalUpdate > 30000
        ) {
            survivalUpdate();
            game.lastSurvivalUpdate = performance.now();
        }

        const target = player.position.clone();

        const offset = new THREE.Vector3(
            Math.sin(cameraAngle) * cameraDistance,
            cameraHeight,
            Math.cos(cameraAngle) * cameraDistance
        );

        camera.position.lerp(
            target.clone().add(offset),
            0.08
        );

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

// ---------- RESIZE ----------

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 1.5)
    );
});

updateResources();
updatePowerDisplay();
