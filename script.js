
const startButton = document.getElementById("startButton");
const heroContent = document.querySelector(".hero-content");
const planet = document.querySelector(".planet");

let day = 1;

let resources = {
    power: 100,
    oxygen: 100,
    food: 100,
    water: 100,
    shielding: 70
};

const missions = [
    {
        title: "☀️ Solar Storm Warning!",
        description: "A solar storm is approaching your Moon outpost. Your astronauts need extra protection.",
        choices: [
            {
                text: "Increase radiation protection",
                result: "Your crew is safer, but additional power was consumed.",
                change: { power: -20, shielding: 20 }
            },
            {
                text: "Save electricity",
                result: "You saved electricity, but your crew has less radiation protection.",
                change: { power: 10, shielding: -15 }
            }
        ]
    },
    {
        title: "🫁 Oxygen System Problem!",
        description: "Your oxygen production equipment is using too much electricity.",
        choices: [
            {
                text: "Prioritize oxygen production",
                result: "Oxygen production is restored, but power is consumed.",
                change: { power: -20, oxygen: 20 }
            },
            {
                text: "Reduce non-essential equipment",
                result: "You saved power, but oxygen reserves decreased.",
                change: { power: 10, oxygen: -15 }
            }
        ]
    },
    {
        title: "🌱 Food Supply Challenge!",
        description: "Your astronauts are running low on food. The greenhouse needs electricity.",
        choices: [
            {
                text: "Power the greenhouse",
                result: "Your greenhouse produced food, using some electricity and water.",
                change: { power: -15, food: 20, water: -10 }
            },
            {
                text: "Use stored food",
                result: "Your crew used emergency food supplies.",
                change: { food: -10, power: 5 }
            }
        ]
    },
    {
        title: "💧 Water Recycling Failure!",
        description: "The water recycling system has stopped working properly.",
        choices: [
            {
                text: "Repair the recycling system",
                result: "The system is repaired, but it needs electricity.",
                change: { power: -15, water: 20 }
            },
            {
                text: "Use emergency reserves",
                result: "You preserved electricity but used stored water.",
                change: { water: -15, power: 5 }
            }
        ]
    },
    {
        title: "🔧 Equipment Emergency!",
        description: "A habitat machine has malfunctioned. Your crew needs to make a decision.",
        choices: [
            {
                text: "Repair the equipment",
                result: "The equipment is repaired, but power was used.",
                change: { power: -20, oxygen: 10 }
            },
            {
                text: "Switch to backup systems",
                result: "The backup system works, but it uses additional resources.",
                change: { power: -10, water: -10 }
            }
        ]
    }
];

function showResources() {
    const names = {
        power: "⚡ Power",
        oxygen: "🫁 Oxygen",
        food: "🌱 Food",
        water: "💧 Water",
        shielding: "🛡️ Shielding"
    };

    return Object.keys(resources).map(key => `
        <div class="resource">
            <div class="resource-heading">
                <span>${names[key]}</span>
                <strong>${resources[key]}%</strong>
            </div>
            <div class="resource-bar">
                <div class="resource-fill ${key}"
                     style="width:${resources[key]}%">
                </div>
            </div>
        </div>
    `).join("");
}

function renderGame() {
    heroContent.innerHTML = `
        <p class="eyebrow">MISSION CONTROL • MOON OUTPOST</p>

        <h2 class="game-title">DAY ${day} / 5</h2>

        <p class="description">
            Your crew is depending on your decisions, Commander!
        </p>

        <div class="resource-panel">
            <h3>OUTPOST RESOURCES</h3>
            ${showResources()}
        </div>

        <div class="event-panel">
            <h2>${missions[day - 1].title}</h2>
            <p>${missions[day - 1].description}</p>

            <div class="choices">
                ${missions[day - 1].choices.map((choice, index) => `
                    <button class="choice-button"
                        onclick="makeChoice(${index})">
                        ${choice.text}
                    </button>
                `).join("")}
            </div>
        </div>
    `;
}

function makeChoice(index) {
    const choice = missions[day - 1].choices[index];

    Object.entries(choice.change).forEach(([key, value]) => {
        resources[key] = Math.max(
            0,
            Math.min(100, resources[key] + value)
        );
    });

    if (
        resources.oxygen <= 0 ||
        resources.power <= 0 ||
        resources.water <= 0
    ) {
        showResult(false, choice.result);
        return;
    }

    if (
        resources.food <= 0 ||
        resources.shielding <= 0
    ) {
        showResult(false, choice.result);
        return;
    }

    heroContent.innerHTML = `
        <p class="eyebrow">MISSION UPDATE</p>
        <h2 class="game-title">DECISION RECORDED!</h2>
        <p class="description">${choice.result}</p>
        <button onclick="nextDay()">CONTINUE MISSION 🚀</button>
    `;
}

function nextDay() {
    day++;

    // Daily crew consumption (illustrative game values)
    resources.oxygen = Math.max(0, resources.oxygen - 10);
    resources.food = Math.max(0, resources.food - 8);
    resources.water = Math.max(0, resources.water - 8);
    resources.power = Math.max(0, resources.power - 5);

    if (
        resources.oxygen <= 0 ||
        resources.food <= 0 ||
        resources.water <= 0 ||
        resources.power <= 0 ||
        resources.shielding <= 0
    ) {
        showResult(false, "Your resources were insufficient to support the crew.");
        return;
    }

    if (day > 5) {
        showResult(true, "Your crew successfully completed the five-day Moon mission!");
        return;
    }

    renderGame();
}

function showResult(success, message) {
    heroContent.innerHTML = `
        <p class="eyebrow">MISSION REPORT</p>

        <h1>${success ? "MISSION<br>SUCCESS!" : "MISSION<br>FAILED!"}</h1>

        <p class="description">${message}</p>

        <h2 class="game-title">
            ${success ? "🌕 Excellent work, Commander!" : "🚀 Learn and try again!"}
        </h2>

        <p class="description">
            You completed ${success ? 5 : day} mission days.
        </p>

        <button onclick="restartGame()">PLAY AGAIN</button>
    `;
}

function restartGame() {
    day = 1;

    resources = {
        power: 100,
        oxygen: 100,
        food: 100,
        water: 100,
        shielding: 70
    };

    renderGame();
}

startButton.addEventListener("click", () => {
    if (planet) planet.style.display = "none";
    renderGame();
});
