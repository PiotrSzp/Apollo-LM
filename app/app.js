var socket = io();

// minimal update time in reps / sec
const reps = 60;
const timestep = 1000 / reps;

// monitors
const throttleMonitor = document.querySelector(".throttle-output");
const fuelLvl = document.querySelector("#fuel-lvl");
const num1000 = document.querySelector("#alt1000");
const num100 = document.querySelector("#alt100");
const num10 = document.querySelector("#alt10");
const num1 = document.querySelector("#alt1");
const num00 = document.querySelector("#alt00");
const veloHub = document.querySelector("#velo-hub");
const veloWarn = document.querySelector("#velo-warn");
const lm_console = document.querySelector("#console");
const negVel = document.querySelector("#negVel");
const lowFuel = document.querySelector("#lowFuel");
const proxy = document.querySelector("#proxy");

// i n p u t s
const btnDetach = document.querySelector(".btnDetach");
const throttleIpt = document.querySelector("#throttle");
const throttleMuffs = document.querySelectorAll(".throttle_circle");
const INFObtn = document.querySelector("#INFObtn");
const RTRYbtn = document.querySelector("#RTRYbtn");
const SENDbtn = document.querySelector("#SENDbtn");


// models
const moonSurface = document.querySelector(".surface");
const moonLander = document.querySelector(".lander");
const csmodule = document.querySelector(".csmodule");
const flame = document.querySelector(".flame");
const view = document.querySelector(".view");
const shadow = document.querySelector("#shadow");

// game object
const eagle = {
    pilot: "Unnamed",
    points: 0,
    isFlying: false,
    g: 1.62, //in m/s^2
    thrust: -2.99, //in m/s^2
    currentAcc: 0,  //in m/s^2
    fuel: 100, //in %
    burnTime: 0, //in seconds
    height: 500, //in meters
    velocity: 0, //in m/s
    fuelUsage: 0, // in %/s
    throttle: 0, // in %
    maxImpactSpeed: 2.4, // in m/s
};

eagle.initialHeight = eagle.height;

eagle.t_burn_min = Math.sqrt(2 * eagle.g / Math.abs(eagle.thrust) * eagle.initialHeight * (Math.abs(eagle.thrust) - eagle.g)) / (Math.abs(eagle.thrust) - eagle.g);

eagle.h_burn_min = eagle.g * eagle.initialHeight / (Math.abs(eagle.thrust))

eagle.burnTime = eagle.t_burn_min * 2;

eagle.info1 = `"Huston, this is Apollo 11 spacecraft. We are approaching the Moon surface. Altitude: ${ eagle.height } m, vertical velocity: ${ eagle.velocity } m/s. Lunar module fuel level: 100%.`;
eagle.info2 = `Estimated main engine burn time at 100% power:  ${ Math.round(eagle.t_burn_min * 2) } seconds. According to calculations this is 2 times more than required minimum, so we should have a good safety margin."`;
eagle.hustonResp1 = `"Apollo 11, this is Huston. Everything looks good. You can begin the descent procedure. Remember 2 things:`;
eagle.hustonResp2 = `Number 1: max touchdown speed is 2.4 m/s.`;
eagle.hustonResp3 = `Number 2: with engine on 0% you will accelerate towards ground!"`;
eagle.nixon = 'PRESIDENT NIXON: "Fate has ordained that the man who went to the moon to explore in peace will stay on the moon to rest in peace.\n' +
    '\n' +
    'Brave man know that there is no hope for the recovery. But also knows that there is hope for mankind in this sacrifice.\n' +
    '\n' +
    'That man is laying down life in mankind\'s most noble goal: the search for truth and understanding.\n' +
    '\n' +
    'It will be mourned by families and friends; it will be mourned by their nation; it will be mourned by the people of the world; it will be mourned by a Mother Earth that dared send her sons into the unknown.\n' +
    '\n' +
    'In this exploration, we stirred the people of the world to feel as one; in this sacrifice, we bind more tightly the brotherhood of man.\n' +
    '\n' +
    'In ancient days, men looked at stars and saw their heroes in the constellations. In modern times, we do much the same, but our heroes are epic men of flesh and blood.\n' +
    '\n' +
    'Others will follow and surely find their way home. Man\'s search will not be denied. But these man was the first, and will remain the foremost in our hearts.\n' +
    '\n' +
    'For every human being who looks up at the moon in the nights to come will know that there is some corner of another world that is forever mankind."';


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
        let str = '';
        if (contactVel > this.maxImpactSpeed) {
            clrlog();
            eagle.points = 0;
            str = 'Crash. Contact speed = ' + contactVel.toFixed(2) + ' m/s';
            log('--- MISSION STATUS ---', str, `Mission assessment: ${ eagle.points } PTS`, '----------------------', eagle.nixon);
        } else {
            eagle.points = Math.round(666 * (1 - (contactVel / this.maxImpactSpeed)) + 334 * (eagle.fuel * eagle.fuel / 2500));
            str = 'Soft touchdown. Contact speed = ' + contactVel.toFixed(2) + ' m/s. ';
            log('--- MISSION STATUS ---', str, `Mission assessment: ${ eagle.points } PTS`, '----------------------', 'Transmission start...', '...', '"Houston, Tranquility Base here."', '...', '"The Eagle has landed."', '...', 'RECEIVING TRANSMISSION...', '...', '"Roger, Tranquility. We copy you on the ground. You got a bunch of guys about to turn blue. We are breathing again. Thanks a lot."', '...',  '...', '--- MISSION PROMPT ---', `To broadcast your score (${eagle.points} PTS), press "send" button on a console`);
        }
        throttleIpt.disabled = true;
        return true;
    }
};

eagle.update = function (deltatime) {
    let seconds = deltatime / 1000;
    eagle.height = (eagle.height >= eagle.velocity * seconds) ? (eagle.height - eagle.velocity * seconds) : 0;
    if (eagle.detectTouchdown()) {
        return
    }

    eagle.velocity += eagle.currentAcc * seconds;
    eagle.fuel = (eagle.fuel >= eagle.fuelUsage * seconds) ? (eagle.fuel - eagle.fuelUsage * seconds) : 0;
    eagle.thrust = eagle.fuel > 0 ? eagle.thrust : 0;
    eagle.currentAcc = eagle.g + eagle.thrust * eagle.throttle / 100;
    eagle.fuelUsage = 100 / eagle.burnTime * eagle.throttle / 100;
};

eagle.render = function () {
    throttleMonitor.innerText = Math.round(eagle.throttle).toString().padStart(2, '0') + '%';

    throttleIpt.value = this.throttle;

    const landerTransform = this.height < 30 ? -this.height * 10 : -300;
    moonLander.style.transform = `translateY(${ landerTransform }px)`;

    csmodule.style.transform = `translateY(${ (-this.initialHeight + this.height) * 10 }px)`;

    const surfaceTransform = this.height < 30 ? 0 : this.height * 10 - 300;
    moonSurface.style.transform = `translateY(${ surfaceTransform }px)`;

    shadow.style.opacity = this.height < 50 ? 1 - this.height / 50 : 0;

    const viewBackgroundPos = this.height > 30 ? this.height * 5 : 150;
    view.style.backgroundPositionY = viewBackgroundPos + 'px';

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

    this.velocity < 0 ? negVel.classList.add('alarm-active') : negVel.classList.remove('alarm-active');

    this.fuel < 25 ? lowFuel.classList.add('alarm-active') : lowFuel.classList.remove('alarm-active');

    this.height < 100 ? proxy.classList.add('alarm-active') : proxy.classList.remove('alarm-active');

    let velSqrt = this.velocity >= 0 ? Math.sqrt(this.velocity) : -Math.sqrt(-this.velocity);

    veloHub.style.transform = `translate(50%, 50%) rotate(${ -45 + velSqrt * 30 }deg)`;
};

eagle.reset = function () {
    eagle.isFlying = false;
    eagle.g = 1.62;
    eagle.thrust = -2.99;
    eagle.currentAcc = 0;
    eagle.fuel = 100;
    eagle.burnTime = eagle.t_burn_min * 2;
    eagle.height = eagle.initialHeight;
    eagle.velocity = 0;
    eagle.fuelUsage = 0;
    eagle.throttle = 0;
    clrlog();
    eagle.render();

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
            // eagle.detectTouchdown();
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


// C O N S O L E
let smallTouts = [];
let bigTouts = [];
let startTout;

function log(...params) {
    const letterDelay = 50;
    let acc = 0;
    let delays = params.map(e => {
        let toReturn = acc;
        acc += e.length;
        return toReturn;
    });

    params.forEach((str, idx) => {
        smallTouts.push(window.setTimeout(() => {
            let p = document.createElement('P');
            lm_console.appendChild(p);
            const strLeng = str.length;
            for (let i = 0; i < strLeng; i++) {
                bigTouts.push(window.setTimeout(() => {
                    p.innerHTML += (str[i] !== " ") ? str[i] : " "
                }, letterDelay * i))
            }
        }, letterDelay * delays[idx]))
    });
}

function clrlog() {

    smallTouts.forEach(clearTimeout);
    bigTouts.forEach(clearTimeout);
    lm_console.innerHTML = '';
}


document.addEventListener("DOMContentLoaded", function () {
// ============ event listeners


    btnDetach.addEventListener('click', function () {
        this.disabled = true;
        smallTouts.forEach(clearTimeout);
        bigTouts.forEach(clearTimeout);
        clrlog();
        log('t minus 5 seconds', 'Commencing detachment procedure...', 'All systems green.');
        startTout = window.setTimeout(() => {
            log('Detachment from Command Service Module complete.', 'Descending...');
            eagle.isFlying = true;
            throttleIpt.disabled = false;
            window.requestAnimationFrame(gameloop);
        }, 5000)

    });

    RTRYbtn.addEventListener('click', () => {
        eagle.isFlying = false;
        eagle.points = 0;
        isFirstRun = true;
        clearTimeout(startTout);
        clrlog();
        eagle.reset();
        btnDetach.disabled = false;
        log("RECIVING TRANSMISSION...", '...', '"Apollo, Huston. We are getting a strange deja vu feeling. Everything ok?"')
    });

    INFObtn.addEventListener('click', () => {
        clrlog();
        log('-- MISSION BRIEFING --', 'Mission objective is to land softly on the moon.', 'Maximum safe landing speed is 2.4 m/s.', `You are now ${eagle.height} m above the surface. You have double the amount of fuel necessary to land from this height with zero speed if executed perfectly.`, 'You can control the speed by adjusting engine thrust with mouse wheel or by moving a throttle handle,', 'Watch out not to run out of fuel.','With perfect landing (speed = 0, remaining fuel = 50) you will score 1000 mission points.', '66% of points are awarded for speed, 34% for fuel efficiency,', 'Points are awarded proportionally to given parameter squared.', '----------------------',)
    });


    SENDbtn.addEventListener('click', e => {
        e.preventDefault();
        eagle.pilot = window.prompt('Podaj nick');
        socket.emit('score_submit', eagle.pilot, eagle.points);

    });


    throttleIpt.addEventListener('input', e => eagle.moveThrottle(-eagle.throttle + Number(e.target.value)));

    document.addEventListener('wheel', e => eagle.moveThrottle(-e.deltaY / 10));


    eagle.render();

    log('Transmission start...', eagle.info1, eagle.info2, '...', 'RECIVING TRANSMISION...', '...', eagle.hustonResp1, eagle.hustonResp2, eagle.hustonResp3, '...', 'Transmission start...', '...', 'Roger that, Huston.');


});

socket.on('score_emit', function(scores){
    // $('#messages').append($('<li>').text(msg));
    console.clear();
    scores.sort((a,b) => b.score - a.score);
    let best10 = scores.slice(0, 10);
    console.log("-- TOP 10 PILOTS --");
    best10.forEach(el => {
        console.log("Pilot: ", el.pilot, "||  Score: ", el.score);
    })
});