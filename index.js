// module aliases
const Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite;

//  elements
const coFrictionInput = document.getElementById('friction');
const angleInput = document.getElementById('angle');
const resetInput = document.getElementById('reset');
const gravityInput = document.getElementById('gravity');
const timeOutput = document.getElementById('time');
const speedOutput = document.getElementById('speed');
const accelerationOutput = document.getElementById('acceleration');
const frictionOutput = document.getElementById('frictionEx');
const netAccelerationOutput = document.getElementById('netAcc');
const calculatedOutput = document.getElementById('calculated');
const actualOutput = document.getElementById('actual');

// create an engine and turn off built in gravity
const engine = Engine.create(document.getElementById('matterJS'), {
    height: 600,
    width: 1000
});
engine.gravity.y = 0;

// create a renderer
var render = Render.create({
    element: document.getElementById('matterJS'),
    engine: engine,
    options: {
        width: 1000,
        height: 600
    }
});

//  simulation parameters
let angle = 45;
let gravityAcceleration = 20;
let coFriction = 0.6;

//  calculated values
let height = 500;
let width = 500;
let centerOfMass = getCenterOfMass(height, width);
let blockStartLocation = { x: 50, y: 100 + (Math.abs(50 * Math.tan(degreesToRadians(45)))) - (10 / Math.sin(degreesToRadians(45))) };
const mouseConstraint = Matter.MouseConstraint.create(
    engine, { element: document.body }
);

//  set initial values to inputs
coFrictionInput.value = coFriction * 100;
angleInput.value = angle;
gravityInput.value = gravityAcceleration;

// create plane, block and ground
let plane = Bodies.fromVertices(centerOfMass.x, 600 - centerOfMass.y, [{ x: 0, y: 0 }, { x: width, y: 0 }, { x: 0, y: -height }], { isStatic: true, friction: 0, label: 'plane' });
const block = Bodies.rectangle(blockStartLocation.x, blockStartLocation.y, 80, 20, { angle: degreesToRadians(angle), friction: 0, mass: 0, label: 'block' });
//const ground = Bodies.rectangle(500, 610, 1000, 60, { isStatic: true, label: 'ground' });

updateText();

//  add event listener to listen for a change in angle
angleInput.addEventListener('change', (event) => {

    //  calculate new triangle
    angle = angleInput.value;
    width = Math.abs(height / Math.tan(degreesToRadians(angle)));
    centerOfMass = getCenterOfMass(height, width);
    plane = Bodies.fromVertices(centerOfMass.x, 600 - centerOfMass.y, [{ x: 0, y: 0 }, { x: width, y: 0 }, { x: 0, y: -height }], { isStatic: true });

    resetWorld();
    updateText();
});

//  add event listener for change in friction
coFrictionInput.addEventListener('change', (event) => {
    coFriction = coFrictionInput.value / 100;

    resetWorld();
    updateText()
});

//  add event listener for reset button
resetInput.addEventListener('click', (event) => {
    resetWorld();
    updateText()
});

// add event listener for gravity slider
gravityInput.addEventListener('change', (event) => {
    gravityAcceleration = gravityInput.value;
    resetWorld();
    updateText();
})

// add all of the bodies to the world
Composite.add(engine.world, [plane, block]);

// run the renderer
Render.run(render);

// create runner
const runner = Runner.create();

// run the engine
Runner.run(runner, engine);

let startTime = Date.now();
let topSpeed = 0;

Matter.Events.on(engine, 'beforeUpdate', (data) => {
    const blockVelocity = Matter.Body.getVelocity(block);
    const deltaTime = (Date.now() - startTime) / 1000;
    if (!Matter.Collision.collides(block, plane)) {
        //  gravity
        const yVel = blockVelocity.y + (gravityAcceleration) * deltaTime;
        Matter.Body.setVelocity(block, { x: 0, y: yVel });
    }
    else {
        //  on the plane
        if (Math.abs(blockVelocity.x) < 0.0001 || Math.abs(blockVelocity.y) < 0.0001 || blockVelocity.x < 0) {
            Matter.Body.setVelocity(block, { x: 0, y: 0 });
        } else {
            const acceleration = gravityAcceleration * Math.sin(degreesToRadians(angle));
            const frictionAcc = coFriction * gravityAcceleration * Math.cos(degreesToRadians(angle));
            const netAcceleration = acceleration - frictionAcc;
            if (Matter.Body.getSpeed(block) > topSpeed) {
                topSpeed = Matter.Body.getSpeed(block);
                speedOutput.innerText = `Speed: ${roundToDecimal(topSpeed,3)}m/s`;
                timeOutput.innerText = `Time: ${deltaTime}s`;
                accelerationOutput.innerHTML = `F<sub>g</sub> || to plane : mgsin(${angle}) = (1)(${roundToDecimal(gravityAcceleration,2)})sin(${angle})) = ${roundToDecimal(acceleration,2)}N`;
                frictionOutput.innerHTML = `F<sub>f</sub> : μmgcos(${angle}) = (${coFriction})(1)(${roundToDecimal(gravityAcceleration,2)})cos(${angle})) = ${roundToDecimal(frictionAcc,2)}N`;
                netAccelerationOutput.innerHTML = `F<sub>net</sub> = F<sub>g</sub>|| - F<sub>f</sub> = ${roundToDecimal(acceleration,2)} - ${roundToDecimal(frictionAcc,2)} = ${roundToDecimal(netAcceleration,2)}N`;
                calculatedOutput.innerHTML = `Δt = (V<sub>2</sub> - V<sub>1</sub>)/a = (${roundToDecimal(topSpeed,2)} - 0)/${roundToDecimal(netAcceleration,2)} = ${roundToDecimal(topSpeed/netAcceleration,3)}s`;
            }
            if (netAcceleration > 0) {
                const xAcc = netAcceleration * Math.cos(degreesToRadians(angle));
                const xVel = 0 + xAcc * deltaTime;
                const yAcc = netAcceleration * Math.sin(degreesToRadians(angle));
                const yVel = 0 + yAcc * deltaTime;
                Matter.Body.setVelocity(block, { x: Math.abs(xVel), y: Math.abs(yVel) });
            }
        }
    }

});

function resetWorld() {
    //  clear world
    Matter.World.clear(engine.world);
    // redraw shapes
    blockStartLocation = { x: 50, y: 100 + (50 * Math.tan(degreesToRadians(angle))) - (10 / Math.cos(degreesToRadians(angle))) - 1 };
    Matter.Body.setPosition(block, blockStartLocation)
    Matter.Body.setAngle(block, degreesToRadians(angle));
    Matter.Body.setAngularSpeed(block, 0);
    Composite.add(engine.world, [plane, block]);
    Render.run(render);
    Runner.run(render, engine);
    Matter.Body.setSpeed(block, 0);
    measured = false;
    startTime = Date.now();
    topSpeed = 0;
}

function updateText() {
    document.getElementById('angleNum').innerHTML = `${angle} <sup>o</sup>`;
    document.getElementById('frictionNum').innerText = `${coFriction}`;
    document.getElementById('gravityNum').innerHTML = `${gravityAcceleration} m/s<sup>2</sup>`;
}
