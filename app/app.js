let timestep = 1000 / 200; // minimal update time in ms

// monitors
// const speedMonitor = document.querySelector(".speed");
// const heightMonitor = document.querySelector(".height");
// const fuelMonitor = document.querySelector(".fuel");
const throttleMonitor = document.querySelector(".throttle-output");
const fuelLvl = document.querySelector("#fuel-lvl");
const num1000 = document.querySelector("#alt1000");
const num100 = document.querySelector("#alt100");
const num10 = document.querySelector("#alt10");
const num1 = document.querySelector("#alt1");
const num00 = document.querySelector("#alt00");
const veloHub = document.querySelector("#velo-hub");
const veloWarn = document.querySelector("#velo-warn");

// i n p u t s
const btnDetach = document.querySelector(".btnDetach");
const throttleIpt = document.querySelector("#throttle");
const throttleMuffs = document.querySelectorAll(".throttle_circle");

// models
const moonSurface = document.querySelector(".surface");
const moonLander = document.querySelector(".lander");
const flame = document.querySelector(".flame");
const view = document.querySelector(".view");


// const btnPower = document.querySelector(".power");
// const bar = document.querySelector(".bar");

const eagle = {
    isFlying: false,
    g: 1.62, //in m/s^2
    thrust: -2.99, //in m/s^2
    currentAcc: 0,  //in m/s^2
    fuel: 100, //in %
    burnTime: 60, //in seconds
    height: 1000, //in meters
    velocity: 0, //in m/s
    fuelUsage: 0, // in %/s
    throttle: 0, // in %
    maxImpactSpeed: 2.4 // in m/s
};

eagle.initialHeight = eagle.height;


eagle.moveThrottle = function (deltaY) {
    const throttleChange = this.isFlying ? (deltaY) : 0;
    const newThrottle = this.throttle + throttleChange;
    if (newThrottle > 100) {
        this.throttle = 100;
    } else if (newThrottle < 0) {
        this.throttle = 0;
    } else {
        this.throttle = Math.round(newThrottle);
    }

};

eagle.detectTouchdown = function () {
    if (this.height <= 0) {
        const contactVel = this.velocity;
        this.velocity = 0;
        this.height = 0;
        this.throttle = 0;
        this.isFlying = false;
        eagle.render();
        alert('Touch down. Contact speed = ' + contactVel);
    }
};

eagle.update = function (deltatime) {
    let seconds = deltatime / 1000;
    eagle.height = (eagle.height >= eagle.velocity * seconds) ? (eagle.height - eagle.velocity * seconds) : 0;
    eagle.velocity += eagle.currentAcc * seconds;
    eagle.fuel = (eagle.fuel >= eagle.fuelUsage * seconds) ? (eagle.fuel - eagle.fuelUsage * seconds) : 0;
    eagle.thrust = eagle.fuel > 0 ? eagle.thrust : 0;
    eagle.currentAcc = eagle.g + eagle.thrust * eagle.throttle / 100;
    eagle.fuelUsage = 100 / eagle.burnTime * eagle.throttle / 100;
    // eagle.detectTouchdown();
};

eagle.render = function () {
    throttleMonitor.innerText = Math.round(eagle.throttle);

    throttleIpt.value = this.throttle;

    const landerTransform = -50 + 50 * (1 - (this.height / this.initialHeight));
    moonLander.style.transform = `translateY(${ landerTransform }vh)`;

    const surfaceTransform = 1000 - 1000 * (1 - this.height / this.initialHeight);
    moonSurface.style.transform = `translateY(${ surfaceTransform }vh)`;

    const vievBackgroundPos = this.height;
    view.style.backgroundPositionY = vievBackgroundPos + 'px';

    flame.style.transform = this.fuel > 0 ? `scale(${ eagle.throttle / 100 })` : `scale(${ 0 })`;

    throttleMuffs.forEach(el => {
        el.style.transform = `translateY(${ 5 - this.throttle / 10 }px)`
    });

    fuelLvl.style.transform = `translateY(${ 250 - 248 * this.fuel / 100 }px)`;

    num1000.style.transform = `translateY(${ -400 + this.height % 10000 * 40 / 1000 }px)`;

    num100.style.transform = `translateY(${ -400 + this.height % 1000 * 40 / 100 }px)`;

    num10.style.transform = `translateY(${ -400 + this.height % 100 * 40 / 10 }px)`;

    num1.style.transform = `translateY(${ -400 + this.height % 10 * 40 }px)`;

    num00.style.transform = `translateY(${ -400 + this.height % 1 * 40 / 0.1 }px)`;

    this.velocity > this.maxImpactSpeed ? veloWarn.classList.add('warn-active') : veloWarn.classList.remove('warn-active');

    let velSqrt = this.velocity >= 0 ? Math.sqrt(this.velocity) : -Math.sqrt(-this.velocity);
    veloHub.style.transform = `translate(50%, 50%) rotate(${-45 + velSqrt * 30}deg)`


};


// G A M E   L O O P ===================================
let lastFrame = 0;
let delta = 0;
let isFirstRun = true;

function gameloop(time) {
    delta += time - lastFrame;
    lastFrame = time;

    if (isFirstRun) {
        delta = 0;
        isFirstRun = false;
    }

    if (eagle.isFlying) {
        let loopCounter = 0; // infinite loop precaution
        while (delta >= timestep) {
            eagle.update(timestep);
            eagle.detectTouchdown();
            delta -= timestep;
            loopCounter++;
            if (loopCounter > 500) {
                delta = 0;
                break;
            }
        }

        eagle.render();

        window.requestAnimationFrame(gameloop);
    }
}


document.addEventListener("DOMContentLoaded", function () {
// ============ event listeners
    btnDetach.addEventListener('click', function () {
        eagle.isFlying = true;
        throttleIpt.disabled = false;
        window.requestAnimationFrame(gameloop);
        // gameloop(0);
        // window.requestAnimationFrame((x) => console.log(x));
    });

    throttleIpt.addEventListener('input', e => eagle.moveThrottle(-eagle.throttle + Number(e.target.value)));

    document.addEventListener('wheel', e => eagle.moveThrottle(-e.deltaY / 10));

    // eagle.render();
});

