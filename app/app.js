let timestep = 1000 / 60; // minimal update time in ms

const speedMonitor = document.querySelector(".speed");
const heightMonitor = document.querySelector(".height");
const fuelMonitor = document.querySelector(".fuel");
const throttleMonitor = document.querySelector(".throttle");
const btnDetach = document.querySelector(".btnDetach");
const moonSurface = document.querySelector(".surface");
const moonLander = document.querySelector(".lander");
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
    height: 100, //in meters
    velocity: 0, //in m/s
    fuelUsage: 0, // in %/s
    throttle: 0, // in %
    maxImpactSpeed: 2.4 // in m/s
};

eagle.initialHeight = eagle.height;


eagle.moveThrottle = function (deltaY) {
    const throttleChange = this.isFlying ? (deltaY / 10) : 0;
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
        this.isFlying = false;
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
    eagle.detectTouchdown();
};

eagle.render = function () {
    // tu bedzie rendering
    console.log('height ' + Math.round(eagle.height));
    console.log('velocity ' + Math.round(eagle.velocity * 1000) / 1000);
    console.log('fuel ' + Math.round(eagle.fuel));
    console.log('throttle ' + eagle.throttle);
    speedMonitor.innerText = Math.round(eagle.velocity * 100) / 100;
    heightMonitor.innerText = Math.round(eagle.height);
    fuelMonitor.innerText = Math.round(eagle.fuel);
    throttleMonitor.innerText = Math.round(eagle.throttle);

    const landerTransform = -50 + 50 * (1 - (this.height / this.initialHeight));
    moonLander.style.transform = `translateY(${ landerTransform }vh)`;

    const surfaceTransform = 1000 - 1000 * (1 - this.height / this.initialHeight);
    moonSurface.style.transform = `translateY(${ surfaceTransform }vh)`;

    const vievBackgroundPos = this.height;
    view.style.backgroundPositionY = vievBackgroundPos + 'px';

};


// G A M E   L O O P ===================================
let lastFrame = 0;
let delta = 0;

function gameloop(time) {
    delta += time - lastFrame;
    lastFrame = time;

    if (eagle.isFlying) {
        let loopCounter = 0; // infinite loop precaution
        while (delta >= timestep) {
            eagle.update(timestep);
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
        window.requestAnimationFrame(gameloop);
        console.log("hello");
    });

    document.addEventListener('wheel', e => eagle.moveThrottle(-e.deltaY));
});

