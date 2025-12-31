const {
  Engine,
  Render,
  Runner,
  Bodies,
  World,
  Body,
  Events,
  Sleeping,
} = Matter;

import { FRUITS } from "./fruits.js";

// 1) 엔진/렌더 설정
const engine = Engine.create();
engine.world.gravity.y = 2.5; // 중력 명시적으로 설정

const render = Render.create({
  engine,
  element: document.body,
  options: {
    wireframes: false,
    background: "#F7F4C8",
    width: 620,
    height: 850,
  },
});

const world = engine.world;

// 2) 벽/바닥/탑라인 생성
const ground = Bodies.rectangle(310, 820, 620, 60, {
  isStatic: true,
  render: { fillStyle: "#E6B143" },
});
const leftWall = Bodies.rectangle(15, 395, 30, 790, {
  isStatic: true,
  render: { fillStyle: "#E6B143" },
});
const rightWall = Bodies.rectangle(605, 395, 30, 790, {
  isStatic: true,
  render: { fillStyle: "#E6B143" },
});
const topLine = Bodies.rectangle(310, 150, 620, 2, {
  isStatic: true,
  isSensor: true,
  label: "topLine",
  render: { fillStyle: "#E6B143" },
});

World.add(world, [ground, leftWall, rightWall, topLine]);

Render.run(render);

const runner = Runner.create();
Runner.run(runner, engine);


// 3) 상태 변수
let currentBody = null;
let currentFruit = null;
let interval = null;
let disableAction = false;

// 4) 과일 하나 생성
function addCurrentFruit() {
  const randomFruit = getRandomFruit();

  const body = Bodies.circle(300, 50, randomFruit.radius, {
    label: randomFruit.label,
    isSleeping: true,          // 잠자는 상태로 생성
    render: {
      fillStyle: randomFruit.color,
      sprite: { texture: `public/${randomFruit.label}.png` },
    },
    restitution: 0.2,
  });

  currentBody = body;
  currentFruit = randomFruit;

  World.add(world, body);
}

// 5) 랜덤 과일 선택 (연속 중복 방지)
function getRandomFruit() {
  const randomIndex = Math.floor(Math.random() * 5); // 0~4
  const fruit = FRUITS[randomIndex];

  if (currentFruit && currentFruit.label === fruit.label) {
    return getRandomFruit();
  }

  return fruit;
}

// 6) 키보드 입력
window.onkeydown = (event) => {
  if (disableAction) return;

  switch (event.code) {
    case "ArrowLeft":
      if (interval || !currentBody) return;
      interval = setInterval(() => {
        if (!currentBody) return;
        if (currentBody.position.x - 20 > 30) {
          Body.setPosition(currentBody, {
            x: currentBody.position.x - 1,
            y: currentBody.position.y,
          });
        }
      }, 5);
      break;

    case "ArrowRight":
      if (interval || !currentBody) return;
      interval = setInterval(() => {
        if (!currentBody) return;
        if (currentBody.position.x + 20 < 590) {
          Body.setPosition(currentBody, {
            x: currentBody.position.x + 1,
            y: currentBody.position.y,
          });
        }
      }, 5);
      break;

    case "Space":
      if (!currentBody) return;


      if (interval) {
        clearInterval(interval);
        interval = null;
      }


      
      disableAction = true;

      // 고정된 과일을 떨어지게 전환
      Sleeping.set(currentBody, false);

      // 이 과일은 이제 "떨어지는 중" → 조작 대상에서 제거
      currentBody = null;

      setTimeout(() => {
        addCurrentFruit(); // 새 과일 생성
        disableAction = false;
      }, 1000);
      break;
  }
};

window.onkeyup = (event) => {
  switch (event.code) {
    case "ArrowLeft":
    case "ArrowRight":
      clearInterval(interval);
      interval = null;
  }
};

// 7) 충돌 처리 (같은 과일 합쳐지기 & Game Over)
Events.on(engine, "collisionStart", (event) => {
  event.pairs.forEach((collision) => {
    // 같은 과일끼리 충돌 → 업그레이드
    if (collision.bodyA.label === collision.bodyB.label) {
      World.remove(world, [collision.bodyA, collision.bodyB]);

      const index = FRUITS.findIndex(
        (fruit) => fruit.label === collision.bodyA.label
      );

      if (index === FRUITS.length - 1) return; // 마지막 과일이면 업그레이드 없음

      const newFruit = FRUITS[index + 1];
      const body = Bodies.circle(
        collision.collision.supports[0].x,
        collision.collision.supports[0].y,
        newFruit.radius,
        {
          render: {
            fillStyle: newFruit.color,
            sprite: { texture: `public/${newFruit.label}.png` },
          },
          label: newFruit.label,
        }
      );
      World.add(world, body);
    }

    // 탑라인에 닿으면 Game Over
    if (
      (collision.bodyA.label === "topLine" ||
        collision.bodyB.label === "topLine") &&
      !disableAction
    ) {
      alert("Game over");
    }
  });
});

// 8) 첫 과일 생성
addCurrentFruit();
