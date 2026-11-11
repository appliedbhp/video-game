"use strict";

const canvas = document.querySelector("#world");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const { width, height } = canvas;
const ground = 208;
const trailLength = 3600;
const elevatedPlatforms = [1, 2, 3, 5, 6, 8, 10];

function buildZone(name, shift, trees) {
  const gapShift = shift ? 16 : 0;
  const gaps = [[1056, 1120], [1856, 1920], [2320, 2400], [3024, 3088]]
    .map(([start, end]) => [start + gapShift, end + gapShift]);
  const obstacles = [
    [635 + shift, 176, 48], [1250 + shift, 168, 48],
    [1940 + shift, 174, 64], [2460 + shift, 170, 48], [3220 + shift, 166, 48],
  ];
  const platforms = [
    [710 + shift, 166, 80, "ledge"], [860 + shift, 158, 80, "ledge"],
    [900 + shift, 116, 80, "crumbly"], [955 + shift, 75, 80, "ledge"],
    [1370 + shift, 166, 80, "ledge"], [1510 + shift, 124, 80, "crumbly"],
    [1760 + shift, 82, 80, "ledge"], [2080 + shift, 160, 80, "crumbly"],
    [2220 + shift, 118, 80, "ledge"], [2750 + shift, 151, 80, "ledge"],
    [2920 + shift, 96, 80, "crumbly"], [3100 + shift, 145, 80, "ledge"],
  ];
  const springs = [847, 1715, 2850].map(x => [x + shift, ground - 8, 38]);
  const stars = Array.from({ length: 28 }, (_, i) => {
    const x = 112 + i * 126 + (i % 3 - 1) * 12;
    const obstacle = obstacles.find(([left, , span]) => x >= left - 12 && x <= left + span + 12);
    if (gaps.some(([start, end]) => x >= start && x < end)) return [x, ground - 53];
    return [x, (obstacle?.[1] ?? ground) - 23];
  });
  for (const index of elevatedPlatforms) {
    const [x, y, span] = platforms[index];
    stars.push([x + span / 2, y - 24]);
  }
  return {
    name, gaps, obstacles, platforms, springs, stars, trees, art: trailArt[name],
    width: trailLength, start: [20, ground], exit: [trailLength - 11, ground],
  };
}

function loadAuthoredLevels(folder, pack) {
  const pickup = pack.pickup ?? "sunseed";
  return pack.levels.map(level => ({
    name: `${pack.world} · ${level.name}`,
    folder, pack, layout: level, pickup, art: trailArt[level.name],
    width: level.size[0], start: level.start, exit: level.exit,
    gaps: [],
    springs: level.collision.filter(c => c.kind === "spring").map(c => c.rect),
    obstacles: level.collision.filter(c => c.kind === "solid").map(c => c.rect),
    platforms: level.collision.filter(c => c.kind === "oneWay")
      .map(c => [...c.rect.slice(0, 3), c.behavior ?? "ledge"]),
    stars: level.entities.filter(entity => entity.type === pickup).map(({ x, y }) => [x, y]),
  }));
}

const authoredLevels = Object.entries(authoredWorlds).flatMap(([folder, pack]) => loadAuthoredLevels(folder, pack));
const introductions = [
  ["Tidepool Beach", "shelly"],
  ["Dune Gate", "ace"],
  ["Reedbank Crossing", "olli"],
  ["Moonperch Trail", "barnaby"],
  ["Bramble Ridge", "fargo"],
];
const introCount = introductions.length + 1;
const riverEdge = { left: 992, right: 1136, marker: 1040 };
const fields = buildZone("Stringstar Fields", 34, [75, 234, 537, 691, 915, 1100, 1440, 1720, 1960, 2320, 2660, 3030, 3440]);
const zones = [
  buildZone("Sunnyland", 0, [202, 554, 739, 1041, 1450, 1900, 2170, 2610, 2950, 3390]),
  ...introductions.map(([name, guide]) => ({
    ...authoredLevels.find(zone => zone.layout.name === name), guide,
  })),
  fields,
  ...authoredLevels.filter(zone => !introductions.some(([name]) => zone.layout.name === name)),
];
const fieldsArea = zones.indexOf(fields);
const healthPickups = zones.map(zone => [.31, .69].map((fraction, index) => {
  const target = Math.round(zone.width * fraction);
  for (let distance = 0; distance < zone.width / 3; distance += 16) {
    const x = target + distance;
    if (x >= zone.width - 24) break;
    const floors = zone.obstacles.filter(([left, , span]) => left + 14 <= x && x <= left + span - 14);
    if (!floors.length && (zone.layout || zone.gaps.some(([left, right]) => left - 18 < x && x < right + 18))) continue;
    const y = Math.min(ground, ...floors.map(([, top]) => top)) - 34 - index * 3;
    if (zone.stars.some(([sx, sy]) => Math.hypot(x - sx, y - sy) < 22)) continue;
    return { x, y, taken: false, drift: 0 };
  }
  return null;
}).filter(Boolean));
const guideProgress = {};
const desertShade = new Set();
let beachWave = null;
let nextBeachWave = null;
let acceptanceIndex = 0;
const tidalWaveFrames = [0, 0, 1, 1, 2, 3, 4, 4, 5, 6, 7, 7];
const tidalWaveHeight = [0, 0, 65, 88, 108, 92, 63, 0];
const tidalWaveWidth = 178;
const tidalWaveBase = 249;
const crumble = new Map();
const springBounces = new Map();
const activatedCheckpoints = new Map();
let barnabyLift = null;
const carryTime = 2.8;
let safeX = 70;
let safeY = ground;
const startingDopamine = 60;
const runThreshold = 50;
const rushDuration = 6;
const inputDelay = .1;
let dopamine = startingDopamine;
let rushTime = 0;
const delayedInputs = [];
let delayedMovement = { direction: 0, run: false };
let storm = 0;
let runVelocity = 0;
let bolt = null;
const totalStars = zones.reduce((total, zone) => total + zone.stars.length, 0);
const startingHearts = 3;
const maxHeartSlots = 10;
let hearts = startingHearts;
let heartSlots = startingHearts;
let retryingAnswer = false;
const bobX = 250;
const notebookX = 535;
const hurtDuration = .6;
let hasNotebook = false;
let wisp = null;
let hurtStarted = null;
const firstThought = "I always get things wrong.";
const challenges = {
  0: [
    { x: 900, speed: 92, pull: 5, lead: 88, cooldown: 1.8, linger: 2.6 },
    { x: 1810, speed: 118, pull: 7, lead: 68, cooldown: 1.45, linger: 1.9 },
    { x: 2460, speed: 145, pull: 9, lead: 52, cooldown: 1.1, linger: 1.2 },
    { x: 2980, speed: 172, pull: 11, lead: 36, cooldown: .8, linger: .7 },
  ],
  [fieldsArea]: [
    { x: 370 },
    { x: 1320 },
    { x: 2510 },
  ],
};
const clearedChallenges = Array(zones.length).fill(0);
const advancedBonus = 2;
let defusionDeck = [];
let bonusPoints = 0;
let metBob = false;
let taughtDefusion = false;
let notebookOpenedAt = 0;
const assets = {};
const assetNames = [
  "sunny-sky", "sunny-woods", "sunny-tiles", "sunny-props",
  "fields-sky-0", "fields-sky-1", "fields-sky-2", "fields-tiles", "walk", "run", "jump", "bob-idle", "bob-talk", "scratchy-talk", "notebook/notebook-opening-spritesheet", "notebook/notebook-closed", "thought-cloud", "scratchy-recoil", "trail-star", "food-pickups",
  "beach/surf-shack", "beach/beach-chairs", "beach/tidal-wave-sheet",
  "trail/landmarks", "trail/terrain", "trail/effects", "trail/themed-signs",
  "river/cutaway-flow",
  "platforms/ice", "platforms/trampoline", "platforms/trampoline-bounce", "guides/barnaby-flight",
  "guides/barnaby-carry", "guides/barnaby-flight-sheet", "guides/barnaby-carry-sheet", "landmarks/old-faithful-eruption", "heart-full",
  ...new Set(Object.values(trailArt).filter(art => art.trailBuilding)
    .map(art => `buildings/${art.trailBuilding.sprite}`)),
  ...Object.keys(guides).map(name => `guides/${name}`),
  ...Object.values(trailArt).filter(art => art.props).map(art => `level-art/${art.props}`),
  ...new Set(Object.values(trailArt).flatMap(art =>
    (art.parallax ?? []).map(({ image }) => `backgrounds/${image}`))),
  ...new Set(Object.values(trailArt).flatMap(art =>
    (art.backgroundProps ?? []).map(({ sprite, folder = "scenery" }) => `${folder}/${sprite}`))),
];
const imageSources = assetNames.map(name => [name, `assets/${name}.png`]);
for (const [folder, pack] of Object.entries(authoredWorlds)) {
  for (const { image } of [
    ...pack.backgrounds, pack.tileset, pack.props, pack.sprites,
    ...pack.levels.filter(level => level.background).map(level => ({ image: level.background })),
  ]) {
    const path = `${folder}/${image}`;
    imageSources.push([path, path]);
  }
}
const player = { x: 70, y: ground, vy: 0, direction: 1, grounded: true, motion: 0, jumping: false, airJumpUsed: false, landingTime: 0 };
const keys = new Set();
const pointers = new Map();
const collected = new Set();
const eaten = new Set();
const bursts = [];
const notice = document.querySelector("#notice");
const locationName = document.querySelector("#location");
const demoButton = document.querySelector("#demo");
const demoPicker = document.querySelector("#demo-picker");
const demoLevels = document.querySelector("#demo-levels");
let demoLevel = null;
const count = document.querySelector("#count");
const score = document.querySelector("#score");
const bonusCount = document.querySelector("#bonus-count");
const game = document.querySelector(".game");
const health = document.querySelector("#hearts");
const brainMeter = document.querySelector("#brain-meter");
const brainFill = document.querySelector("#brain-fill");
const brainValue = document.querySelector("#brain-value");
const heartReward = document.querySelector("#heart-reward");
const music = document.querySelector("#music");
const soundToggle = document.querySelector("#sound");
let soundEnabled = true;
let audioContext;
let musicStarted = false;
let currentTrack = "";
const supportsVorbis = Boolean(music.canPlayType('audio/ogg; codecs="vorbis"'));
music.volume = .23;

function syncMusic() {
  const track = supportsVorbis
    ? (storm ? "hope-of-rain.ogg" : area === fieldsArea ? "city-lights.ogg" : "trail.ogg")
    : "trail.mp3";
  if (track !== currentTrack) {
    currentTrack = track;
    music.src = `assets/audio/${track}`;
  }
  if (soundEnabled && musicStarted && music.paused) music.play().catch(() => {});
}

function enableAudio() {
  if (!soundEnabled) return;
  const Context = window.AudioContext || window.webkitAudioContext;
  if (Context) audioContext ??= new Context();
  if (audioContext?.state === "suspended") audioContext.resume().catch(() => {});
  musicStarted = true;
  syncMusic();
}

for (const type of ["pointerdown", "keydown"]) {
  window.addEventListener(type, enableAudio, { once: true });
}

const lightningStrike = new Audio("assets/audio/lightning-strike.mp3");
lightningStrike.preload = "auto";

soundToggle.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundToggle.textContent = soundEnabled ? "Sound on" : "Sound off";
  soundToggle.setAttribute("aria-pressed", String(soundEnabled));
  if (soundEnabled) enableAudio();
  else {
    music.pause();
    lightningStrike.pause();
  }
});

const soundEffects = {
  jump: [250, 420, .1, "triangle"],
  spring: [160, 690, .2, "triangle"],
  star: [660, 1100, .15, "sine"],
  heart: [392, 1175, .42, "triangle"],
  fall: [225, 80, .25, "triangle"],
  crack: [95, 45, .17, "triangle"],
  hurt: [190, 85, .2, "triangle"],
  notebook: [350, 540, .19, "sine"],
  water: [560, 250, .23, "sine"],
  answer: [430, 780, .22, "sine"],
};

function sound(name) {
  if (!soundEnabled) return;
  if (name === "strike") {
    lightningStrike.currentTime = 0;
    lightningStrike.play().catch(() => {});
    return;
  }
  if (audioContext?.state !== "running") return;
  const [start, end, duration, type] = soundEffects[name];
  const time = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const envelope = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(start, time);
  oscillator.frequency.exponentialRampToValueAtTime(end, time + duration);
  envelope.gain.setValueAtTime(.085, time);
  envelope.gain.exponentialRampToValueAtTime(.001, time + duration);
  oscillator.connect(envelope).connect(audioContext.destination);
  oscillator.start(time);
  oscillator.stop(time + duration);
}
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
let area = 0;
let ready = false;
let jumpQueued = false;
let dropQueued = false;
let noticeTime = 0;
let lastTime = 0;
let elapsed = 0;
let scene = null;
let lineStarted = 0;
let bobDirection = -1;
const conversation = document.querySelector("#conversation");
const speaker = document.querySelector("#speaker");
const line = document.querySelector("#line");
const next = document.querySelector("#next");
const choices = document.querySelector("#choices");
const portrait = document.querySelector("#portrait");
const notebook = document.querySelector("#notebook");
const notebookCtx = notebook.getContext("2d");
notebookCtx.imageSmoothingEnabled = false;

function drawNotebook() {
  const pose = Math.min(13, Math.floor((elapsed - notebookOpenedAt) * 20));
  notebookCtx.clearRect(0, 0, notebook.width, notebook.height);
  notebookCtx.drawImage(assets["notebook/notebook-opening-spritesheet"],
    pose % 4 * 432, Math.floor(pose / 4) * 304, 432, 304, 0, 0, notebook.width, notebook.height);
}

function closeConversation() {
  if (!scene) return;
  if (scene === "example" || scene === "success") wisp.softenedAt = elapsed;
  scene = null;
  conversation.hidden = true;
  notebook.hidden = true;
  portrait.hidden = true;
  choices.hidden = true;
  clearInput();
  canvas.focus({ preventScroll: true });
}

function showScene(stage, who, words, action) {
  scene = stage;
  speaker.textContent = who;
  line.textContent = words;
  next.textContent = action;
  lineStarted = elapsed;
  conversation.hidden = false;
  notice.textContent = "";
  const answering = stage === "question" || stage === "guide-question";
  choices.hidden = !answering;
  next.hidden = answering;
  if (!next.hidden) next.focus({ preventScroll: true });
}

function spawnWisp(x, y, thought, challenge = null) {
  wisp = { x, y, vx: 0, vy: 0, bornAt: elapsed, nextContact: elapsed + .45, softenedAt: null, thought, challenge };
}

function meetBob() {
  metBob = true;
  clearInput();
  player.direction = player.x <= bobX ? 1 : -1;
  bobDirection = -player.direction;
  player.landingTime = 0;
  player.motion = 0;
  showScene("greeting", "Bob the Badger",
    "Hey, I’m Bob. Thought clouds will follow you along this trail. When one catches you, we’ll practice noticing its words as a thought. First, I’ll show you how in the notebook.", "Say hello");
}

function revealNotebook() {
  sound("notebook");
  notebookOpenedAt = elapsed;
  notebook.hidden = false;
  portrait.hidden = false;
  drawNotebook();
}

function teachDefusion() {
  hasNotebook = true;
  clearInput();
  showScene("lesson", "Scratchy’s notebook",
    "When a thought feels true, try putting “I’m having the thought that” in front of it.", "Try it");
  revealNotebook();
}

function guideExercise(guide) {
  const buttons = guide.answers.map((answer, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = answer;
    button.addEventListener("click", () => {
      if (scene !== "guide-question") return;
      if (index !== guide.correct) {
        line.textContent = `${guide.prompt} ${guide.hint}`;
        return;
      }
      guideProgress[zones[area].guide] = "done";
      sound("answer");
      showScene("guide-done", guide.name, guide.takeaway, "Back to the trail");
    });
    return button;
  });
  clearInput();
  if (zones[area].guide === "olli") sound("water");
  choices.replaceChildren(...buttons);
  showScene("guide-question", `${guide.name} · ${guide.skill}`, guide.prompt, "");
  buttons[0].focus({ preventScroll: true });
}

function canFinishIntroduction(zone) {
  if (area === 0) return taughtDefusion && clearedChallenges[0] === challenges[0].length;
  const guide = guides[zone.guide];
  return guideProgress[zone.guide] === "done" && (!guide.checkpoint || desertShade.has(zone.guide));
}

function showFinish(zone) {
  clearInput();
  const skill = area === 0 ? "Cognitive Defusion" : guides[zone.guide].skill;
  const finished = area === introCount - 1;
  showScene("level-finish", finished ? "Introductions complete" : `Level ${area + 1} complete`,
    finished ? "You’ve met all six guides. The rest of the trail is open to explore."
      : `${skill} practiced. Next stop: ${zones[area + 1].name}.`,
    finished ? "Explore more" : "Next level");
  sound("answer");
}

function updateGuide(zone) {
  if (!zone.guide) return;
  const guide = guides[zone.guide];
  const progress = guideProgress[zone.guide];
  if (!progress && player.x >= guide.meet - 52) {
    guideProgress[zone.guide] = "met";
    clearInput();
    showScene("guide-intro", `${guide.name} · ${guide.skill}`, guide.intro, "Keep going");
  } else if (guide.flying && (progress === "introduced" || progress === "done")) {
    const owl = barnabyPosition(zone, guide);
    if (!player.grounded && Math.abs(player.x - owl.x) < 28 &&
        player.y - 38 < owl.y && player.y > owl.y - 24) {
      barnabyLift = { y: safeY, startedAt: elapsed };
      player.grounded = false;
      player.direction = owl.direction;
      announce("Hold Space to fly · Left and Right to steer", 3);
    }
  } else if (progress === "introduced" && player.x >= guide.practice) {
    guideExercise(guide);
  } else if (progress === "done" && guide.checkpoint && player.x >= guide.checkpoint &&
      player.grounded && !desertShade.has(zone.guide)) {
    desertShade.add(zone.guide);
    sound("star");
    announce("Shade reached. Take the next stretch.");
  }
}

function advanceConversation() {
  switch (scene) {
    case "demo-finish":
      closeConversation();
      openDemoPicker();
      break;
    case "level-finish":
      closeConversation();
      storm = 0;
      bolt = null;
      travel(area + 1);
      break;
    case "guide-intro":
      guideProgress[zones[area].guide] = "introduced";
      closeConversation();
      break;
    case "guide-done":
      closeConversation();
      break;
    case "greeting":
      showScene("whisper", "Bob the Badger · whispering", "You always get things wrong.", "Listen");
      break;
    case "whisper":
      spawnWisp(player.x + 24, 36, firstThought);
      showScene("belief", "Scratchy", "Bob’s right. I always get things wrong.", "Keep walking");
      break;
    case "lesson":
      showScene("example", "Scratchy", `I’m having the thought that ${firstThought} I can carry that thought and still take the next step.`, "Keep exploring");
      break;
    case "example":
      taughtDefusion = true;
      closeConversation();
      break;
    case "recover":
      hearts = heartSlots;
      rushTime = 0;
      restoreFooting(zones[area].start);
      updateHud();
      resumeAfterWrongAnswer();
      announce(activatedCheckpoints.has(area) ? "Back at your checkpoint." : "Back at the start of this level.");
      break;
    case "treat-recover":
      hearts = 1;
      rushTime = 0;
      closeConversation();
      restoreFooting(zones[area].start);
      updateHud();
      announce(activatedCheckpoints.has(area) ? "Back at your checkpoint." : "Back at the start of this level.");
      break;
    case "belief":
    case "success":
      closeConversation();
      break;
  }
}

function askPracticeQuestion() {
  const exercise = wisp.exercise;
  const buttons = exercise.options.map(option => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = option.text;
    button.addEventListener("click", () => {
      if (scene !== "question") return;
      if (option.kind === "sticky") {
        hearts--;
        storm++;
        syncMusic();
        sound("hurt");
        retryingAnswer = true;
        hurtStarted = elapsed;
        updateHud();
        closeConversation();
        return;
      }
      clearedChallenges[area]++;
      const advanced = option.kind === "advanced";
      if (advanced) {
        bonusPoints += advancedBonus;
        updateHud();
      }
      sound(advanced ? "heart" : "answer");
      showScene("success", advanced ? `New technique · +${advancedBonus} bonus points` : "Scratchy",
        option.takeaway, "Back to the trail");
    });
    return button;
  });
  choices.replaceChildren(...buttons);
  showScene("question", "Scratchy’s notebook",
    `“${wisp.thought}” Choose a way to notice this as a thought. A technique you discover earns bonus points.`, "");
  revealNotebook();
  buttons[0].focus({ preventScroll: true });
}

next.addEventListener("click", advanceConversation);

function updateWisp(dt) {
  if (!wisp) return;
  const softened = wisp.softenedAt !== null;
  if (softened && elapsed - wisp.softenedAt > (wisp.challenge?.linger ?? 3)) {
    wisp = null;
    return;
  }
  const dx = player.x - (softened ? player.direction * 34 : 0) - wisp.x;
  const targetY = Math.max(12, player.y - 71);
  const dy = targetY + Math.sin(elapsed * 4) * 5 - wisp.y;
  // A damped pull lets the wisp lag behind and float around its target.
  const drag = Math.exp(-3.5 * dt);
  const pull = wisp.challenge?.pull ?? 7;
  const speed = wisp.challenge?.speed ?? 135;
  wisp.vx = clamp((wisp.vx + dx * pull * dt) * drag, -speed, speed);
  wisp.vy = clamp((wisp.vy + dy * pull * dt) * drag, -110, 110);
  wisp.x += wisp.vx * dt;
  wisp.y += wisp.vy * dt;
  if (wisp.challenge && !softened && elapsed >= wisp.nextContact && Math.abs(player.x - wisp.x) < 18 &&
      Math.abs(targetY - wisp.y) < 17) {
    clearInput();
    player.direction = wisp.x >= player.x ? 1 : -1;
    hurtStarted = elapsed;
    bolt = { x: wisp.x, y: wisp.y + 9, endX: player.x, endY: player.y - 46, until: elapsed + .24 };
    sound("strike");
  }
}

function announce(message, seconds = 3) {
  notice.textContent = message;
  noticeTime = seconds;
}

function updateHud() {
  const label = area < introCount ? `Level ${area + 1} · ${zones[area].name}` : zones[area].name;
  locationName.textContent = demoLevel === null ? label : `Demo · ${label}`;
  game.classList.toggle("night", area === fieldsArea);
  count.textContent = collected.size;
  bonusCount.textContent = bonusPoints;
  score.setAttribute("aria-label", `${collected.size} of ${totalStars} stars collected`);
  const icons = Array.from({ length: heartSlots }, (_, index) => {
    const icon = document.createElement("img");
    icon.src = index < hearts ? "assets/heart-full.png" : "assets/heart-empty.png";
    icon.alt = "";
    return icon;
  });
  health.replaceChildren(...icons);
  health.setAttribute("aria-label", `${hearts} of ${heartSlots} hearts`);
  updateBrainMeter();
}

function effectiveDopamine() {
  return Math.min(100, dopamine + (rushTime > 0 ? 30 : 0));
}

function updateBrainMeter() {
  const amount = Math.floor(effectiveDopamine());
  const rushing = rushTime > 0;
  if (brainMeter.getAttribute("aria-valuenow") === String(amount) &&
      brainMeter.classList.contains("rush") === rushing) return;
  const mode = amount >= runThreshold ? "Run and double jump" : "Jog and single jump";
  const status = rushing ? `${mode}. Treat rush active.` : mode;
  brainMeter.setAttribute("aria-valuenow", amount);
  brainMeter.setAttribute("aria-valuetext", `${amount}%. ${status}`);
  brainMeter.title = status;
  brainMeter.classList.toggle("rush", rushing);
  brainFill.style.width = `${amount}%`;
  brainValue.textContent = `${amount}%`;
}

function celebrateHeart() {
  sound("heart");
  heartReward.getAnimations().forEach(animation => animation.cancel());
  heartReward.animate([
    { opacity: 0, transform: "translate(-50%, 10px) scale(.35)", offset: 0 },
    { opacity: 1, transform: "translate(-50%, -8px) scale(1.28)", offset: .22 },
    { opacity: 1, transform: "translate(-50%, -12px) scale(1)", offset: .55 },
    { opacity: 0, transform: "translate(-50%, -30px) scale(.9)", offset: 1 },
  ], { duration: 1350, easing: "ease-out" });
}

function inGap(zone, x) {
  return zone.gaps.some(([start, end]) => x >= start && x < end);
}

function pressed(code) {
  return keys.has(code) || [...pointers.values()].some(button => button.dataset.key === code);
}

function resetDelayedInput() {
  delayedInputs.length = 0;
  delayedMovement = { direction: 0, run: false };
  jumpQueued = false;
  dropQueued = false;
}

function clearInput() {
  keys.clear();
  for (const button of pointers.values()) button.removeAttribute("aria-pressed");
  pointers.clear();
  runVelocity = 0;
  resetDelayedInput();
}

function restart() {
  if (!ready) return;
  closeConversation();
  clearInput();
  collected.clear();
  eaten.clear();
  for (const pickups of healthPickups) {
    for (const pickup of pickups) Object.assign(pickup, { taken: false, drift: 0 });
  }
  activatedCheckpoints.clear();
  barnabyLift = null;
  crumble.clear();
  springBounces.clear();
  safeX = 70;
  safeY = ground;
  dopamine = startingDopamine;
  rushTime = 0;
  heartReward.getAnimations().forEach(animation => animation.cancel());
  storm = 0;
  bolt = null;
  bursts.length = 0;
  area = 0;
  bobDirection = -1;
  clearedChallenges.fill(0);
  bonusPoints = 0;
  defusionDeck = makeDefusionDeck(Object.values(challenges).reduce((count, wave) => count + wave.length, 0));
  for (const guide of Object.keys(guideProgress)) delete guideProgress[guide];
  desertShade.clear();
  beachWave = null;
  nextBeachWave = null;
  acceptanceIndex = 0;
  metBob = false;
  taughtDefusion = false;
  hasNotebook = false;
  hearts = startingHearts;
  heartSlots = startingHearts;
  retryingAnswer = false;
  wisp = null;
  hurtStarted = null;
  Object.assign(player, { x: 70, y: ground, vy: 0, direction: 1, grounded: true, motion: 0, jumping: false, airJumpUsed: false, landingTime: 0 });
  updateHud();
  announce("Level 1 · Sunnyland", 2);
  syncMusic();
}

const gameKeys = new Set(["ArrowLeft", "ArrowRight", "KeyA", "KeyD", "Space", "ArrowUp", "ArrowDown", "KeyW", "ShiftLeft", "ShiftRight"]);
const jumpKeys = new Set(["Space", "ArrowUp", "KeyW"]);
window.addEventListener("keydown", event => {
  if (!ready || demoPicker.open || event.metaKey || event.ctrlKey || event.altKey) return;
  if (scene) {
    if (event.code === "KeyE" && !event.repeat && !next.hidden) {
      event.preventDefault();
      advanceConversation();
    }
    return;
  }
  if (!gameKeys.has(event.code)) return;
  if (event.code === "Space" && event.target instanceof HTMLButtonElement) return;
  event.preventDefault();
  keys.add(event.code);
  if (jumpKeys.has(event.code) && !event.repeat) jumpQueued = true;
  if (event.code === "ArrowDown" && !event.repeat) dropQueued = true;
});
window.addEventListener("keyup", event => keys.delete(event.code));
window.addEventListener("blur", clearInput);
document.addEventListener("visibilitychange", () => { if (document.hidden) clearInput(); });
document.querySelector("#restart").addEventListener("click", event => {
  if (demoLevel === null) restart();
  else startDemo(demoLevel);
  event.currentTarget.blur();
});

for (const button of document.querySelectorAll("[data-key]")) {
  button.addEventListener("pointerdown", event => {
    if (!ready || demoPicker.open || scene || event.button !== 0) return;
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, button);
    button.setAttribute("aria-pressed", "true");
    if (button.dataset.key === "Space") jumpQueued = true;
    if (button.dataset.key === "ArrowDown") dropQueued = true;
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
    button.addEventListener(type, event => {
      pointers.delete(event.pointerId);
      if (![...pointers.values()].includes(button)) button.removeAttribute("aria-pressed");
    });
  }
  button.addEventListener("click", event => {
    if (!ready || demoPicker.open || scene || event.detail !== 0) return;
    if (button.dataset.key === "Space") jumpQueued = true;
    if (button.dataset.key === "ArrowDown") dropQueued = true;
  });
}

function openDemoPicker() {
  if (!ready || demoPicker.open) return;
  clearInput();
  demoPicker.showModal();
}

function startDemo(index) {
  if (!ready) return;
  demoLevel = index;
  if (demoPicker.open) demoPicker.close();
  restart();
  if (index !== 0) {
    hasNotebook = true;
    taughtDefusion = true;
    travel(index);
  }
  canvas.focus({ preventScroll: true });
}

demoButton.addEventListener("click", openDemoPicker);
document.querySelector("#play-campaign").addEventListener("click", () => {
  demoPicker.close();
  demoLevel = null;
  restart();
  canvas.focus({ preventScroll: true });
});

zones.forEach((zone, index) => {
  const button = document.createElement("button");
  button.type = "button";
  const name = index < introCount ? `${index + 1}. ${zone.name}` : zone.name;
  const label = document.createElement("strong");
  label.textContent = name;
  button.append(label);
  if (index < introCount) {
    const caption = document.createElement("span");
    const guide = guides[zone.guide];
    caption.textContent = index === 0 ? "Bob · Cognitive Defusion" : `${guide.name} · ${guide.skill}`;
    button.append(caption);
  }
  button.addEventListener("click", () => startDemo(index));
  demoLevels.append(button);
});

function travel(destination, backwards = false) {
  barnabyLift = null;
  area = destination;
  beachWave = null;
  nextBeachWave = null;
  const zone = zones[area];
  const [x, y] = backwards ? zone.exit : zone.start;
  safeX = backwards ? x - 24 : x;
  safeY = y;
  player.x = safeX;
  player.y = safeY;
  runVelocity = 0;
  resetDelayedInput();
  player.vy = 0;
  player.grounded = true;
  player.jumping = false;
  player.airJumpUsed = false;
  player.landingTime = 0;
  bursts.length = 0;
  wisp = null;
  updateHud();
  announce(zones[area].name, 2);
  syncMusic();
}

function resumeAfterWrongAnswer() {
  closeConversation();
  const { thought, challenge, exercise } = wisp;
  const lead = challenge.lead ?? 76;
  spawnWisp(player.x - player.direction * lead, Math.max(12, player.y - 92), thought, challenge);
  wisp.exercise = exercise;
  wisp.nextContact = elapsed + (challenge.cooldown ?? 1.35);
  announce("The storm is getting stronger. Keep going and try again.", 2);
}

function restoreFooting(fallback) {
  const checkpoint = zones[area].art.checkpoint;
  const [x, y] = activatedCheckpoints.has(area) ? [checkpoint.x, checkpoint.y] : fallback;
  clearInput();
  safeX = x;
  safeY = y;
  bolt = null;
  Object.assign(player, { x, y, vy: 0, grounded: true, jumping: false, airJumpUsed: false, landingTime: 0, motion: 0 });
}

function activateCheckpoint(zone, previousX) {
  if (activatedCheckpoints.has(area)) return;
  const { x, y } = zone.art.checkpoint;
  const passed = previousX < x && player.x >= x && player.y <= y + 4;
  const nearby = player.grounded && Math.abs(player.x - x) <= 20 && Math.abs(player.y - y) <= 16;
  if (!passed && !nearby) return;
  activatedCheckpoints.set(area, elapsed);
  sound("answer");
  announce("Checkpoint lit · You’ll return here.");
}

function readMovement() {
  const input = {
    direction: Number(pressed("ArrowRight") || pressed("KeyD")) - Number(pressed("ArrowLeft") || pressed("KeyA")),
    run: pressed("ShiftLeft") || pressed("ShiftRight"),
    jump: jumpQueued,
    drop: dropQueued,
  };
  jumpQueued = false;
  dropQueued = false;
  if (rushTime <= 0) {
    for (const pending of delayedInputs) {
      input.jump ||= pending.jump;
      input.drop ||= pending.drop;
    }
    delayedInputs.length = 0;
    return input;
  }
  delayedInputs.push({ ...input, at: elapsed + inputDelay });
  let jump = false;
  let drop = false;
  while (delayedInputs[0]?.at <= elapsed) {
    delayedMovement = delayedInputs.shift();
    jump ||= delayedMovement.jump;
    drop ||= delayedMovement.drop;
  }
  return { ...delayedMovement, jump, drop };
}

function collectFood(zone) {
  for (const [index, [type, x, y]] of zone.art.food.entries()) {
    const id = `${area}:${index}`;
    if (eaten.has(id) || Math.abs(player.x - x) > 15 || Math.abs(player.y - 24 - y) > 15) continue;
    eaten.add(id);
    if (type < 4) {
      dopamine = Math.min(100, dopamine + 20);
      sound("star");
      announce("Produce · +20 brain power", 2);
    } else {
      rushTime = rushDuration;
      hearts--;
      sound("hurt");
      announce("Treat rush · delayed controls · −1 heart", 2.5);
      if (hearts === 0) showScene("treat-recover", "Scratchy", "I need a moment to catch my breath.", "Keep going");
    }
    updateHud();
    if (scene) break;
  }
}

function landingSurface(zone, previousY) {
  let floor = zone.layout || inGap(zone, player.x) || previousY > ground ? Infinity : ground;
  let surface = null;
  for (const ledge of [...zone.platforms, ...zone.obstacles, ...zone.springs]) {
    const [x, y, span] = ledge;
    if (crumble.get(ledge)?.breaksAt <= elapsed) continue;
    if (player.x + 5 > x && player.x - 5 < x + span && previousY <= y && y < floor) {
      floor = y;
      surface = ledge;
    }
  }
  return { floor, surface };
}

function update(dt) {
  if (demoPicker.open) return { moving: false, running: false };
  elapsed += dt;
  if (barnabyLift) {
    const zone = zones[area];
    const { startedAt } = barnabyLift;
    const flying = pressed("Space");
    if (flying) barnabyLift.controlled = true;
    const descending = !flying && (barnabyLift.controlled || elapsed - startedAt >= carryTime);
    const steer = Number(pressed("ArrowRight") || pressed("KeyD")) -
      Number(pressed("ArrowLeft") || pressed("KeyA"));
    if (steer) {
      player.x = clamp(player.x + steer * 145 * dt, 70, zone.width - 70);
      player.direction = steer;
    }
    if (descending) {
      const { floor } = landingSurface(zone, player.y);
      // Hover at ground height above gaps until the player steers over a surface.
      player.y = Math.min(floor, Math.max(player.y, Math.min(ground, player.y + 130 * dt)));
      if (player.y === floor) {
        barnabyLift = null;
        clearInput();
        Object.assign(player, { grounded: true, vy: 0, jumping: false, airJumpUsed: false });
        if (guideProgress.barnaby === "introduced") guideExercise(guides.barnaby);
      }
    } else {
      player.y = Math.min(player.y, Math.max(flying ? 126 : barnabyLift.y - 40, player.y - 110 * dt));
    }
    return { moving: false, running: false };
  }
  if (scene) {
    if (scene === "belief") updateWisp(dt);
    return { moving: false, running: false };
  }
  if (hurtStarted !== null) {
    if (elapsed - hurtStarted >= hurtDuration) {
      hurtStarted = null;
      if (hearts === 0) {
        showScene("recover", "Scratchy", "Take a breath, then try the same thought again.", "Catch your breath");
      } else if (retryingAnswer) {
        resumeAfterWrongAnswer();
      } else {
        askPracticeQuestion();
      }
      retryingAnswer = false;
    }
    return { moving: false, running: false };
  }
  if (noticeTime > 0 && (noticeTime -= dt) <= 0) notice.textContent = "";
  rushTime = Math.max(0, rushTime - dt);
  const { direction, run, jump, drop } = readMovement();
  const powered = effectiveDopamine() >= runThreshold;
  const running = powered && run;
  const wading = zones[area].guide === "olli" && player.grounded && player.x >= riverEdge.left && player.x <= riverEdge.right;
  const targetSpeed = direction * (running ? 167 : 112) * (rushTime > 0 ? 1.1 : 1) * (wading ? .72 : 1);
  const traction = 8 * (1 - Math.exp(-storm / 5));
  if (traction > 0 && player.grounded) {
    const response = (direction ? 950 : 800) / (1 + traction * .85);
    runVelocity += clamp(targetSpeed - runVelocity, -response * dt, response * dt);
  } else if (traction > 0 && !direction) {
    runVelocity *= Math.exp(-2 * dt);
  } else {
    runVelocity = targetSpeed;
  }
  if (direction) player.direction = direction;
  const previousX = player.x;
  let nextX = previousX + runVelocity * dt;
  for (const [x, y, span] of zones[area].obstacles) {
    if (player.y <= y) continue;
    if (player.x <= x - 6 && nextX > x - 6) nextX = x - 6;
    if (player.x >= x + span + 6 && nextX < x + span + 6) nextX = x + span + 6;
  }
  const moving = Math.abs(nextX - player.x) > .05;
  if (!moving && direction) runVelocity = 0;
  player.x = nextX;
  player.motion = moving ? player.motion + dt * (running ? 31 : 25) : 0;
  if (player.x >= zones[area].exit[0] && (demoLevel !== null || area < zones.length - 1)) {
    const current = zones[area];
    if (demoLevel !== null && (area >= introCount || canFinishIntroduction(current))) {
      clearInput();
      showScene("demo-finish", "Demo complete", "Choose another landscape or replay this one from the Demo menu.", "Choose a level");
      return { moving: false, running: false };
    }
    if (area >= introCount) {
      travel(area + 1);
      return { moving: false, running: false };
    }
    if (canFinishIntroduction(current)) {
      showFinish(current);
      return { moving: false, running: false };
    }
    if (!notice.textContent) {
      announce(area === 0 && !taughtDefusion ? "Find the notebook before leaving Sunnyland."
        : area === 0 ? "Finish practicing with the clouds."
        : current.guide === "shelly" ? "Practice acceptance when a wave reaches you."
        : "Finish the guide’s practice before leaving.");
    }
  } else if (player.x < 11 && area >= introCount && demoLevel === null) {
    travel(area - 1, true);
    return { moving: false, running: false };
  }
  const zone = zones[area];
  player.x = clamp(player.x, 11, zone.width - 11);
  if (moving) dopamine = Math.max(0, dopamine - .8 * dt);
  updateBrainMeter();

  const dropping = drop && player.grounded &&
    zone.platforms.some(([x, y, span]) => player.y === y && player.x + 5 > x && player.x - 5 < x + span);
  if (dropping) {
    player.y += 2;
    player.vy = 45;
    player.grounded = false;
    player.landingTime = 0;
  }
  if (jump && !dropping && (player.grounded || (powered && !player.airJumpUsed))) {
    player.airJumpUsed = !player.grounded;
    player.vy = -299;
    sound("jump");
    player.grounded = false;
    player.jumping = true;
    player.landingTime = 0;
  }
  const previousY = player.y;
  player.vy += 760 * dt;
  player.y += player.vy * dt;
  player.grounded = false;
  if (player.vy >= 0) {
    const { floor, surface } = landingSurface(zone, previousY);
    if (player.y >= floor) {
      player.y = floor;
      if (zone.springs.includes(surface)) {
        player.vy = -515;
        player.jumping = true;
        player.airJumpUsed = false;
        player.landingTime = 0;
        springBounces.set(surface, elapsed);
        sound("spring");
      } else {
        player.vy = 0;
        player.grounded = true;
        if (player.jumping) player.landingTime = .15;
        player.jumping = false;
        player.airJumpUsed = false;
        if (surface?.[3] === "crumbly" && !crumble.has(surface)) {
          crumble.set(surface, { breaksAt: elapsed + .65, restoresAt: elapsed + 4.2 });
          sound("crack");
        }
      }
    }
  }
  for (const [ledge, timer] of crumble) {
    if (elapsed >= timer.restoresAt) crumble.delete(ledge);
  }
  player.landingTime = Math.max(0, player.landingTime - dt);
  if (player.grounded && (zone.layout
      ? zone.obstacles.some(([x, y, span]) => y === player.y && player.x > x + 10 && player.x < x + span - 10)
      : player.y === ground && !zone.gaps.some(([start, end]) => player.x > start - 24 && player.x < end + 24))) {
    safeX = player.x;
    safeY = player.y;
  }
  if (player.y > height + 45) {
    restoreFooting([safeX, safeY]);
    if (wisp) {
      wisp.x = safeX - player.direction * 72;
      wisp.y = Math.max(12, safeY - 110);
      wisp.vx = 0;
      wisp.vy = 0;
      wisp.nextContact = elapsed + 1;
    }
    sound("fall");
    announce(activatedCheckpoints.has(area) ? "Back at your checkpoint." : "Try jumping before the edge.", 2);
    return { moving: false, running: false };
  }

  activateCheckpoint(zone, previousX);
  collectFood(zone);
  if (scene) return { moving: false, running: false };
  if (hearts < heartSlots) {
    for (const pickup of healthPickups[area]) {
      if (pickup.taken) continue;
      const step = player.x - previousX;
      const ahead = (pickup.x - player.x) * Math.sign(step);
      if (!pickup.drift && ahead > 0 && ahead < 28 &&
          Math.abs(player.y - 24 - pickup.y) <= 20) {
        pickup.drift = Math.sign(step) * 4;
      }
      const [x, y] = healthPickupPosition(pickup);
      if (Math.abs(player.x - x) > 16 || Math.abs(player.y - 24 - y) > 20) continue;
      pickup.taken = true;
      hearts++;
      sound("heart");
      updateHud();
      announce("Heart restored", 1.5);
      if (hearts === heartSlots) break;
    }
  }
  zone.stars.forEach(([x, y], index) => {
    const id = `${area}:${index}`;
    if (collected.has(id) || Math.abs(player.x - x) > 18 || Math.abs(player.y - 24 - y) > 25) return;
    collected.add(id);
    sound("star");
    bursts.push({ x, y, at: elapsed });
    if (collected.size % 10 === 0 && heartSlots < maxHeartSlots) {
      heartSlots++;
      hearts++;
      celebrateHeart();
      announce(heartSlots === maxHeartSlots ? "Ten heart slots!" : "New heart slot!");
    }
    updateHud();
  });
  while (bursts.length && elapsed - bursts[0].at > .55) bursts.shift();
  if (area === 0 && !metBob && Math.abs(player.x - bobX) <= 54) {
    meetBob();
    return { moving: false, running: false };
  }
  if (area === 0 && !hasNotebook && Math.abs(player.x - notebookX) <= 16 && player.y >= ground - 22) {
    teachDefusion();
    return { moving: false, running: false };
  }
  updateGuide(zone);
  if (!scene) updateBeachWave(zone);
  if (scene) return { moving: false, running: false };
  const challenge = challenges[area]?.[clearedChallenges[area]];
  if (taughtDefusion && !wisp && challenge && player.x >= challenge.x) {
    const x = area === 0 ? player.x - challenge.lead : player.x + 42;
    const index = clearedChallenges[area] + (area === fieldsArea ? challenges[0].length : 0);
    const exercise = defusionDeck[index];
    spawnWisp(x, Math.max(15, player.y - 100), exercise.thought, challenge);
    wisp.exercise = exercise;
    if (area === 0) announce(`Cloud ${clearedChallenges[0] + 1} of ${challenges[0].length}`, 1.8);
  }
  updateWisp(dt);
  return { moving, running };
}

function layer(name, camera, speed, y, w, h) {
  const scroll = Math.floor(camera * speed);
  const firstTile = Math.floor(scroll / w);
  for (let tile = firstTile; tile * w - scroll < width; tile++) {
    const x = tile * w - scroll;
    const mirrored = tile % 2 !== 0;
    // Matching edges meet when every other copy faces the opposite direction.
    ctx.save();
    ctx.translate(x + (mirrored ? w : 0), y);
    ctx.scale(mirrored ? -1 : 1, 1);
    ctx.drawImage(assets[name], 0, 0, w, h);
    ctx.restore();
  }
}

function tile(id, x, y) {
  const image = assets[area ? "fields-tiles" : "sunny-tiles"];
  const columns = image.width / 16;
  ctx.drawImage(image, id % columns * 16, Math.floor(id / columns) * 16, 16, 16, x, y, 16, 16);
}

function prop(name, sx, sy, sw, sh, x, y) {
  ctx.drawImage(assets[name], sx, sy, sw, sh, x, y, sw, sh);
}

function drawLevelScenery(zone, camera) {
  for (const object of zone.art.backgroundProps ?? []) drawAnchoredScenery(object, object.folder ?? "scenery", camera);
  if (zone.art.trailBuilding) drawAnchoredScenery(zone.art.trailBuilding, "buildings", camera);
  for (const [type, x, y] of zone.art.scenery ?? []) {
    if (x < camera - 56 || x > camera + width + 56) continue;
    const [sx, sy, sw, sh] = zone.art.rects[type];
    prop(`level-art/${zone.art.props}`, sx, sy, sw, sh, x - sw / 2, y - sh);
  }
}

function drawAnchoredScenery({ sprite, source, x, y, height: drawHeight }, folder, camera) {
  if (sprite === "old-faithful") {
    const age = elapsed % 7;
    source = trailAnimations.geyser[age < 3.4 ? 0 : age < 4.1 ? 1 : age < 5.7 ? 2 : 3];
    sprite = "old-faithful-eruption";
  }
  const [sx, sy, sw, sh] = source;
  const zoneWidth = zones[area].width;
  const drawWidth = Math.min(zoneWidth, Math.round(drawHeight * sw / sh));
  const left = clamp(Math.round(x - drawWidth / 2), 0, zoneWidth - drawWidth);
  if (left + drawWidth < camera || left > camera + width) return;
  ctx.drawImage(assets[`${folder}/${sprite}`], sx, sy, sw, sh, left, y - drawHeight, drawWidth, drawHeight);
}

function drawTrailProp(name, x, base) {
  const [sx, sy, sw, sh] = trailLandmarks[name];
  prop("trail/landmarks", sx, sy, sw, sh, Math.round(x - sw / 2), base - sh);
}

function drawCheckpoint(zone, camera) {
  const { x, y } = zone.art.checkpoint;
  if (x < camera - 72 || x > camera + width + 72) return;
  const activatedAt = activatedCheckpoints.get(area);
  const age = activatedAt === undefined ? Infinity : elapsed - activatedAt;
  const lift = age < .45 ? Math.round(Math.sin(age / .45 * Math.PI) * 4) : 0;
  drawTrailSign("halfway", x, y, 43 + lift);
  if (activatedAt !== undefined) {
    const spread = Math.min(1, age / .35);
    for (let star = 0; star < 3; star++) {
      const angle = age * 3.8 + star * Math.PI * 2 / 3;
      const depth = Math.sin(angle);
      const size = Math.round(9 + depth * 2);
      const left = Math.round(x + Math.cos(angle) * 22 * spread - size / 2);
      const top = Math.round(y - 55 - lift + depth * 6 * spread - size / 2);
      ctx.drawImage(assets["trail-star"], left, top, size, size);
    }
  }
}

function drawTrailSign(kind, x, base, drawHeight = 43) {
  const column = { halfway: 0, next: 1, back: 2, end: 3, finish: 4 }[kind];
  const zone = zones[area];
  const drawWidth = 62;
  const left = clamp(Math.round(x - drawWidth / 2), 0, zone.width - drawWidth);
  const row = zone.art.signStyle ?? zone.art.checkpoint.style;
  ctx.drawImage(assets["trail/themed-signs"], column * 64, row * 44,
    64, 44, left, base - drawHeight, drawWidth, drawHeight);
}

function drawTrailEffect(row, x, y, frame) {
  prop("trail/effects", frame % 6 * 32, row * 32, 32, 32, Math.round(x - 16), Math.round(y - 16));
}

function drawFood(zone, camera) {
  for (const [index, [type, x, y]] of zone.art.food.entries()) {
    if (eaten.has(`${area}:${index}`) || x < camera - 16 || x > camera + width + 16) continue;
    const bob = Math.round(Math.sin(elapsed * 5 + index) * 2);
    prop("food-pickups", type * 16, 0, 16, 16, x - 8, y + bob - 8);
  }
}

function drawBackground(camera, zone) {
  if (zone.art.parallax) {
    for (const background of zone.art.parallax) {
      const image = assets[`backgrounds/${background.image}`];
      const tileWidth = Math.round(image.width * height / image.height);
      ctx.globalAlpha = background.opacity ?? 1;
      layer(`backgrounds/${background.image}`, camera, background.scrollFactor, 0, tileWidth, height);
    }
    ctx.globalAlpha = 1;
    return;
  }
  if (zone.layout) {
    const backgrounds = zone.layout.background
      ? [{ image: zone.layout.background, scrollFactor: .12, fit: zone.layout.backgroundFit }]
      : zone.pack.backgrounds;
    for (const background of backgrounds) {
      const path = `${zone.folder}/${background.image}`;
      const image = assets[path];
      if (background.fit === "cover" || background.repeatX === false) {
        const drawWidth = Math.ceil(Math.max(width, height * image.width / image.height));
        const drawHeight = Math.ceil(drawWidth * image.height / image.width);
        layer(path, camera, background.scrollFactor || .12, height - drawHeight, drawWidth, drawHeight);
      } else {
        layer(path, camera, background.scrollFactor, 0, image.width, height);
      }
    }
  } else if (area === 0) {
    layer("sunny-sky", camera, .13, 0, 480, 250);
    layer("sunny-woods", camera, .33, 118, 176, 368);
  } else {
    layer("fields-sky-0", camera, .08, 0, 400, 250);
    layer("fields-sky-1", camera, .23, 0, 400, 250);
    layer("fields-sky-2", camera, .45, 0, 400, 250);
  }
}

function drawSnowfall(camera) {
  for (let i = 0; i < 44; i++) {
    const x = ((i * 83 + Math.sin(elapsed * .5 + i) * 9 - camera * (.1 + i % 3 * .04)) % width + width) % width;
    const y = (i * 37 + elapsed * (8 + i % 9)) % (height - 12);
    ctx.fillStyle = i % 3 === 0 ? "#eff7f0" : "#c8dce1b0";
    ctx.fillRect(Math.round(x), Math.round(y), i % 7 === 0 ? 2 : 1, 1);
  }
}

function scheduleBeachWave() {
  beachWave = null;
  nextBeachWave = elapsed + 3 + Math.random() * 5;
}

function beachWavePose() {
  if (!beachWave) return null;
  const age = elapsed - beachWave.startedAt;
  const frame = tidalWaveFrames[Math.floor(age * 8)];
  if (frame === undefined) return null;
  return { frame, age, x: beachWave.x + beachWave.direction * age * 145 };
}

function updateBeachWave(zone) {
  if (zone.guide !== "shelly" || !["introduced", "done"].includes(guideProgress.shelly)) return;
  if (!beachWave) {
    if (nextBeachWave === null) scheduleBeachWave();
    if (elapsed < nextBeachWave) return;
    const direction = Math.random() < .5 ? -1 : 1;
    beachWave = { x: player.x - direction * (125 + Math.random() * 42), direction, startedAt: elapsed };
  }
  const pose = beachWavePose();
  if (!pose) {
    scheduleBeachWave();
    return;
  }
  const height = tidalWaveHeight[pose.frame];
  const sweptX = pose.x + beachWave.direction * 17;
  if (!height || Math.abs(player.x - sweptX) > 62 || player.y < tidalWaveBase - height ||
      player.y - 42 > tidalWaveBase) return;
  scheduleBeachWave();
  const exercise = acceptanceIndex % (acceptanceQuestions.length + 1);
  acceptanceIndex++;
  sound("water");
  guideExercise(exercise === 0 ? guides.shelly : { ...guides.shelly, ...acceptanceQuestions[exercise - 1] });
}

function drawTidalWave(camera) {
  const pose = beachWavePose();
  if (!pose) return;
  const image = assets["beach/tidal-wave-sheet"];
  const sx = Math.floor(pose.frame % 4 * image.width / 4) + 16;
  const sy = Math.floor(Math.floor(pose.frame / 4) * image.height / 2) + 82;
  ctx.save();
  ctx.translate(Math.round(pose.x - camera), tidalWaveBase);
  ctx.scale(beachWave.direction, 1);
  ctx.globalAlpha = Math.min(1, pose.age * 8, (tidalWaveFrames.length / 8 - pose.age) * 7);
  ctx.drawImage(image, sx, sy, 416, 304, -tidalWaveWidth / 2, -130, tidalWaveWidth, 130);
  ctx.restore();
}

function drawSurfShack(zone, x, y, chairs) {
  const shack = assets["beach/surf-shack"];
  ctx.drawImage(shack, Math.round(x - shack.width / 2), y - shack.height + 3);
  if (!chairs) return;
  const seats = assets["beach/beach-chairs"];
  const seatX = x + 72;
  const floor = zone.obstacles.find(([left, top, span]) =>
    seatX - 24 >= left && seatX + 27 <= left + span && top === y);
  if (floor) ctx.drawImage(seats, seatX - 30, y - seats.height + 3);
}

function drawAuthoredTerrain(zone, camera) {
  const tiles = assets[`${zone.folder}/${zone.pack.tileset.image}`];
  const columns = zone.pack.tileset.columns;
  let shackIndex = 0;
  for (const object of zone.layout.props) {
    if (zone.art.backgroundProps?.some(({ x }) => x === object.x)) continue;
    if (zone.guide === "shelly" && object.type === "hut") {
      drawSurfShack(zone, object.x, object.y, shackIndex++ % 2 === 0);
      continue;
    }
    const [sx, sy, sw, sh] = zone.pack.props.rects[object.type];
    const inset = zone.pack.props.groundInset?.[object.type] ?? 0;
    const left = clamp(Math.round(object.x - sw / 2), 0, zone.width - sw);
    prop(`${zone.folder}/${zone.pack.props.image}`, sx, sy, sw, sh, left, object.y - sh + inset);
  }
  const firstColumn = Math.floor(camera / 16);
  const lastColumn = Math.min(zone.width / 16, Math.ceil((camera + width) / 16));
  const markedPlatforms = zone.pack.visiblePlatforms === true || zone.guide === "barnaby";
  for (const grid of [zone.layout.terrain, zone.layout.decor]) {
    for (let row = 0; row < grid.length; row++) {
      for (let col = firstColumn; col < lastColumn; col++) {
        const id = grid[row][col];
        if (id < 0) continue;
        if (markedPlatforms && grid === zone.layout.terrain &&
            zone.platforms.some(([x, y, span]) => row * 16 === y && col * 16 >= x && col * 16 < x + span)) continue;
        const sx = id % columns * 16;
        const sy = Math.floor(id / columns) * 16;
        ctx.drawImage(tiles, sx, sy, 16, 16, col * 16, row * 16, 16, 16);
        if (grid === zone.layout.terrain && row === grid.length - 1) {
          for (let y = zone.layout.size[1]; y < height; y += 16) {
            ctx.drawImage(tiles, sx, sy, 16, 16, col * 16, y, 16, 16);
          }
        }
      }
    }
  }
  if (markedPlatforms) {
    for (const ledge of zone.platforms) {
      const [x, y, span, kind] = ledge;
      if (x + span < camera || x > camera + width) continue;
      const timer = crumble.get(ledge);
      if (timer?.breaksAt <= elapsed) {
        const age = elapsed - timer.breaksAt;
        if (age < .42) {
          ctx.fillStyle = zone.guide === "barnaby" ? "#b4e9ff" : "#cb9b81";
          for (let n = 3; n < span; n += 9) ctx.fillRect(x + n, y + Math.round(age * (32 + n)), 3, 3);
        }
        continue;
      }
      const shake = timer ? Math.round(Math.sin(elapsed * 55)) : 0;
      const id = kind === "crumbly" ? 6 : 5;
      for (let offset = 0; offset < span; offset += 16) {
        if (zone.guide === "barnaby") {
          const iceTile = kind === "crumbly" ? 3 : offset === 0 ? 0 : offset + 16 >= span ? 2 : 1;
          const tileWidth = Math.min(16, span - offset);
          prop("platforms/ice", iceTile * 16, 0, tileWidth, 16, x + offset + shake, y);
        } else {
          prop("trail/terrain", id * 16, 0, 16, 16, x + offset + shake, y);
        }
      }
    }
    for (const [x, y, span] of zone.guide === "barnaby" ? [] : zone.obstacles) {
      if (x + span < camera || x > camera + width) continue;
      for (let offset = 16; offset < span - 16; offset += 48) {
        prop("trail/terrain", 64, 0, 16, 11, x + offset, y);
      }
    }
  }
  for (const entity of zone.layout.entities) {
    if (entity.x < camera - 16 || entity.x > camera + width + 16) continue;
    if (entity.type !== zone.pickup) drawWorldSprite(zone, entity.type, entity.x, entity.y, entity.x);
  }
}

function drawWorldSprite(zone, type, x, y, phase) {
  const animation = zone.pack.sprites.animations[type];
  const [ax, ay] = animation.anchor;
  const frame = Math.floor(elapsed * animation.fps + phase) % animation.frames.length;
  prop(`${zone.folder}/${zone.pack.sprites.image}`, ...animation.frames[frame], Math.round(x - ax), Math.round(y - ay));
}

function drawLessonLandmarks(zone, camera, moving) {
  for (const [name, x, y] of zone.art.trailProps ?? []) {
    if (x + 50 >= camera && x - 50 <= camera + width) drawTrailProp(name, x, y);
  }
  if (zone.guide === "shelly") {
    const beachFloor = zone.obstacles.filter(([, y]) => y === ground);
    for (const [index, [x, y, span]] of beachFloor.entries()) {
      const next = beachFloor[index + 1];
      if (!next || next[0] + 16 < camera || x + span - 16 > camera + width) continue;
      prop("trail/terrain", 0, 0, 16, 16, x + span - 16, y);
      prop("trail/terrain", 0, 0, 16, 16, next[0], y);
      drawTrailEffect(1, (x + span + next[0]) / 2, y - 12, Math.floor(elapsed * 7) + index);
    }
  }
  if (zone.guide === "ace") {
    const x = guides.ace.checkpoint;
    if (x + 45 < camera || x - 45 > camera + width) return;
    drawTrailProp("shelter", x, ground);
    if (desertShade.has(zone.guide)) drawTrailEffect(0, x, ground - 55, Math.floor(elapsed * 6));
    sign(x, "SHADE");
  }
  if (zone.guide === "fargo") {
    const repaired = guideProgress.fargo === "done";
    if (camera < 790 && camera + width > 680) {
      prop("trail/terrain", 112, 0, 16, 16, 723, ground);
      drawTrailProp(repaired ? "fence-fixed" : "fence-broken", 732, ground);
    }
  }
  if (zone.guide !== "olli") return;
  const { left, right, marker } = riverEdge;
  if (right + 45 < camera || left - 45 > camera + width) return;
  const frame = Math.floor(elapsed * 8) % 8;
  prop("river/cutaway-flow", frame * 176, 0, 176, 64, left - 16, 186);
  if (moving && player.grounded && player.x >= left && player.x <= right) {
    drawTrailEffect(1, player.x - player.direction * 11, player.y - 12, Math.floor(elapsed * 11));
  }
  sign(left - 8, "RIVER EDGE", ground);
}

function drawFlightCell(asset, frame, anchorX, anchorY, size, y) {
  const cell = 512;
  ctx.drawImage(assets[asset], frame % 3 * cell, Math.floor(frame / 3) * cell, cell, cell,
    -Math.round(anchorX * size / cell), y - Math.round(anchorY * size / cell), size, size);
}

const carryGrip = [[232, 235], [211, 235], [216, 233], [230, 221], [220, 218], [223, 209]];
const flightCycle = [0, 1, 2, 3, 4, 5, 2, 1];

function drawBarnabyFlight(y) {
  const frame = flightCycle[Math.floor(elapsed * 10) % flightCycle.length];
  drawFlightCell("guides/barnaby-flight-sheet", frame, 203, 375, 114, y);
}

function barnabyPosition(zone, guide) {
  const introduced = ["introduced", "done"].includes(guideProgress[zone.guide]);
  return {
    x: Math.round(clamp((introduced ? guide.practice : guide.meet) +
      Math.sin(elapsed * 1.6) * (introduced ? 27 : 55), 60, zone.width - 60)),
    y: Math.round((introduced ? clamp(safeY - 67, 92, 144) : 111) + Math.sin(elapsed * 2.2) * 7),
    direction: Math.cos(elapsed * 1.6) > 0 ? 1 : -1,
  };
}

function drawGuide(zone) {
  if (!zone.guide) return;
  const guide = guides[zone.guide];
  if (guide.flying && barnabyLift) {
    ctx.save();
    ctx.translate(Math.round(player.x), Math.round(player.y));
    ctx.scale(player.direction, 1);
    const frame = flightCycle[Math.floor((elapsed - barnabyLift.startedAt) * 10) % flightCycle.length];
    const [gripX, gripY] = carryGrip[frame];
    drawFlightCell("guides/barnaby-carry-sheet", frame, gripX, gripY, 112, -49);
    ctx.restore();
    return;
  }
  const owl = guide.flying ? barnabyPosition(zone, guide) : null;
  const x = owl?.x ?? guide.meet;
  const base = zone.layout
    ? zone.obstacles.find(([left, , span]) => x >= left && x < left + span)?.[1] ?? ground
    : ground;
  const y = owl?.y ?? base;
  const frame = Math.floor(elapsed * (guide.flying ? 10 : 8)) % guide.frames;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(guide.flying ? owl.direction : (player.x < x ? -1 : 1), 1);
  if (guide.flying) {
    drawBarnabyFlight(0);
  } else {
    const name = `guides/${zone.guide}`;
    const foot = spriteFeet[name]?.[frame] ?? 70;
    const top = 1 - Math.ceil((foot - 1) * .8);
    ctx.drawImage(assets[name], frame % 8 * 80, Math.floor(frame / 8) * 80, 80, 80, -32, top, 64, 64);
  }
  ctx.restore();
  ctx.font = '700 11px "Silkscreen", monospace';
  ctx.textAlign = "center";
  ctx.fillStyle = "#19261f";
  const labelWidth = Math.ceil(ctx.measureText(guide.name).width) + 10;
  ctx.fillRect(x - labelWidth / 2, y - 67, labelWidth, 13);
  ctx.fillStyle = "#ffe2a6";
  ctx.fillText(guide.name, x, y - 57);
}

function drawTerrain(zone, camera) {
  for (const [index, tree] of (zone.trees ?? []).entries()) {
    if (inGap(zone, tree)) continue;
    if (zone.art.backgroundProps?.some(({ x }) => x === tree)) continue;
    if (area === 0) {
      prop("sunny-props", 119, 32, 108, 96, tree - 54, ground - 96);
    } else if (index % 2 === 0) {
      prop("fields-tiles", 177, 10, 105, 133, tree - 52, ground - 133);
    } else {
      prop("fields-tiles", 4, 82, 53, 61, tree - 26, ground - 61);
    }
  }
  if (area === 0) prop("sunny-props", 315, 17, 93, 111, 25, ground - 111);


  const firstTile = Math.floor(camera / 16);
  for (let column = firstTile; column <= firstTile + Math.ceil(width / 16); column++) {
    const x = column * 16;
    if (inGap(zone, x)) continue;
    ctx.fillStyle = area ? "#051d26" : "#63394a";
    ctx.fillRect(x, ground, 16, height - ground);
    if (area === 0) {
      tile(column % 7 === 0 ? 365 : 28, x, ground);
      if (column % 4 === 2) tile(128, x, ground + 16);
      if (column % 9 === 5 || column % 9 === 6) tile(column % 2 ? 176 : 178, x, ground - 16);
    } else {
      tile([162, 163, 164, 165, 166][column % 5], x, ground);
      if (column % 3 === 1) tile(182 + column % 7, x, ground + 16);
      if (column % 8 === 5) tile(73, x, ground - 16);
      if (column % 11 === 8) tile(94, x, ground - 16);
    }
  }
  for (const ledge of zone.platforms) {
    const [x, y, span, kind] = ledge;
    if (x + span < camera || x > camera + width) continue;
    const timer = crumble.get(ledge);
    if (timer?.breaksAt <= elapsed) {
      const fall = elapsed - timer.breaksAt;
      if (fall < .45) {
        ctx.fillStyle = "#ad8067";
        for (let i = 0; i < 8; i++) ctx.fillRect(x + i * 10, y + Math.round(fall * (30 + i * 11)), 5, 4);
      }
      continue;
    }
    const shake = timer ? Math.round(Math.sin(elapsed * 55)) : 0;
    for (let step = 0; step < span; step += 16) {
      const edge = step === 0 ? 0 : step + 16 === span ? 2 : 1;
      tile((area ? [77, 79, 81] : [34, 35, 36])[edge], x + step + shake, y);
    }
    if (kind === "crumbly") {
      ctx.fillStyle = "#c99c80";
      for (let step = 5; step < span; step += 13) {
        ctx.fillRect(x + step + shake, y + 1, 2, 3);
        ctx.fillRect(x + step + shake + 2, y + 3, 2, 3);
      }
    }
  }
  for (const [x, y, span] of zone.obstacles) {
    if (x + span < camera || x > camera + width) continue;
    ctx.fillStyle = "#3d2c36";
    ctx.fillRect(x, y, span, ground - y);
    ctx.fillStyle = "#71504d";
    ctx.fillRect(x + 2, y + 2, span - 4, ground - y - 3);
    ctx.fillStyle = "#ad7860";
    ctx.fillRect(x + 2, y + 1, span - 4, 3);
    for (let step = 0; step < span; step += 16) {
      tile(area ? 185 : 128, x + step, y + 7);
      tile(area ? 186 : 128, x + step, ground - 16);
    }
  }
  for (const [start, end] of zone.gaps) {
    if (end < camera || start > camera + width) continue;
    ctx.fillStyle = area ? "#26413f" : "#9d624d";
    ctx.fillRect(start - 3, ground + 2, 3, height - ground);
    ctx.fillRect(end, ground + 2, 3, height - ground);
  }
  if (storm) {
    ctx.fillStyle = "#a0bedb66";
    for (let x = Math.floor(camera / 48) * 48; x < camera + width; x += 48) {
      if (inGap(zone, x + 3) || inGap(zone, x + 29)) continue;
      ctx.fillRect(x + 3, ground + 4, 22 + x % 5, 2);
      ctx.fillRect(x + 7, ground + 6, 9, 1);
    }
  }
}

function drawSprings(zone, camera) {
  for (const spring of zone.springs) {
    const [x, y, span] = spring;
    if (x + span < camera || x > camera + width) continue;
    const age = elapsed - (springBounces.get(spring) ?? -Infinity);
    const bouncing = age < .34;
    const frame = age < .08 ? 1 : age < .19 ? 2 : 3;
    const source = bouncing ? trailAnimations.trampolineBounce[frame] : trailAnimations.trampoline;
    const image = assets[bouncing ? "platforms/trampoline-bounce" : "platforms/trampoline"];
    const drawHeight = ground - y + (bouncing ? 9 : 4);
    ctx.drawImage(image, ...source, x - 2, ground + 1 - drawHeight, span + 4, drawHeight);
  }
}

function sign(x, label, base = ground) {
  ctx.font = '700 11px "Silkscreen", monospace';
  const span = Math.ceil(ctx.measureText(label).width) + 12;
  x = clamp(x, span / 2, zones[area].width - span / 2);
  ctx.fillStyle = "#533a32";
  ctx.fillRect(x - 2, base - 29, 4, 29);
  ctx.fillStyle = "#2a2828";
  ctx.fillRect(x - span / 2, base - 33, span, 17);
  ctx.strokeStyle = "#cb9e66";
  ctx.strokeRect(x - span / 2 + .5, base - 32.5, span - 1, 16);
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffe2a6";
  ctx.fillText(label, x, base - 21);
}

function healthPickupPosition({ x, y, drift }) {
  return [x + drift, y + Math.sin(elapsed * 4 + x) * 3];
}

function drawHealthPickups(camera) {
  for (const pickup of healthPickups[area]) {
    if (pickup.taken || pickup.x + 24 < camera || pickup.x - 24 > camera + width) continue;
    const [x, y] = healthPickupPosition(pickup).map(Math.round);
    ctx.fillStyle = "#fd829b30";
    ctx.fillRect(x - 10, y - 8, 20, 16);
    ctx.drawImage(assets["heart-full"], x - 7, y - 7, 14, 14);
  }
}

function drawStars(zone) {
  zone.stars.forEach(([x, y], index) => {
    if (collected.has(`${area}:${index}`)) return;
    const floatY = Math.round(y + Math.sin(elapsed * 4 + index) * 3);
    ctx.drawImage(assets["trail-star"], x - 8, floatY - 8);
  });
  for (const { x, y, at } of bursts) {
    const age = (elapsed - at) / .55;
    ctx.globalAlpha = 1 - age;
    ctx.fillStyle = "#fff1aa";
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4;
      ctx.fillRect(Math.round(x + Math.cos(angle) * age * 28), Math.round(y + Math.sin(angle) * age * 28), 2, 2);
    }
    ctx.globalAlpha = 1;
  }
}

function drawBob() {
  const speaking = scene === "greeting" || scene === "whisper";
  const frame = Math.floor(speaking ? (elapsed - lineStarted) * 20 : elapsed * 12) % 25;
  ctx.save();
  ctx.translate(bobX, ground);
  ctx.scale(bobDirection, 1);
  const name = speaking ? "bob-talk" : "bob-idle";
  const top = 1 - Math.ceil((spriteFeet[name][frame] - 1) * .8);
  ctx.drawImage(assets[name],
    frame % 8 * 80, Math.floor(frame / 8) * 80, 80, 80, -32, top, 64, 64);
  ctx.restore();
  ctx.font = '700 11px "Silkscreen", monospace';
  ctx.textAlign = "center";
  ctx.fillStyle = "#19261f";
  ctx.fillRect(bobX - 15, ground - 65, 30, 13);
  ctx.fillStyle = "#ffe2a6";
  ctx.fillText("BOB", bobX, ground - 55);
}

function drawPlayer({ moving, running }) {
  let action = moving ? (running ? "run" : "walk") : "jump";
  let frame = Math.floor(player.motion) % (action === "walk" ? 23 : 25);
  let columns = moving ? 8 : 5;
  if (hurtStarted !== null) {
    action = "scratchy-recoil";
    columns = 8;
    frame = Math.min(24, Math.floor((elapsed - hurtStarted) * 25 / hurtDuration));
  } else if (scene === "belief" || scene === "example" || scene === "success") {
    action = "scratchy-talk";
    columns = 5;
    const tick = Math.floor((elapsed - lineStarted) * 18);
    // Play the opening gesture once, then cycle through the speaking poses.
    frame = tick < 8 ? tick : 24 - Math.abs((tick - 8) % 32 - 16);
  } else if (!player.grounded || player.landingTime > 0) {
    action = "jump";
    columns = 5;
    if (player.grounded) frame = 12 + Math.floor((.15 - player.landingTime) * 20);
    else if (player.jumping) frame = 6 + clamp(Math.floor((player.vy + 299) / 92), 0, 5);
    else frame = 11;
  }
  ctx.fillStyle = "#0d141a64";
  const zone = zones[area];
  const shadowY = zone.layout
    ? zone.obstacles.find(([x, y, span]) => player.x >= x && player.x < x + span && player.y <= y)?.[1]
    : inGap(zone, player.x) ? undefined : ground;
  if (shadowY !== undefined || player.grounded) {
    ctx.beginPath();
    ctx.ellipse(Math.round(player.x), (player.grounded ? player.y : shadowY) + 3, player.grounded ? 13 : 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.save();
  ctx.translate(Math.round(player.x), Math.round(player.y));
  ctx.scale(player.direction, 1);
  const nativeFoot = spriteFeet[action][frame] ?? 70;
  const top = player.grounded ? 1 - Math.ceil((nativeFoot - 1) * 74 / 80) : -65;
  ctx.drawImage(assets[action], frame % columns * 80, Math.floor(frame / columns) * 80, 80, 80, -37, top, 74, 74);
  ctx.restore();
}

function drawStrikeAftermath() {
  if (!bolt) return;
  const age = elapsed - (bolt.until - .24);
  if (age < 0 || age >= 1.2) return;
  ctx.save();
  for (let i = 0; i < 6; i++) {
    const rise = age - .06 * i;
    if (rise < 0 || rise >= .85) continue;
    const size = Math.round(4 + rise * 12);
    const x = Math.round(bolt.endX + (i % 3 - 1) * 8 + Math.sin(i + rise * 5) * 7);
    const y = Math.round(bolt.endY + 12 - rise * 46);
    ctx.globalAlpha = .65 * (1 - rise / .85);
    ctx.fillStyle = "#747481";
    ctx.fillRect(x - size / 2, y, size, size - 2);
    ctx.fillStyle = "#a1a0aa";
    ctx.fillRect(x - size / 2 + 2, y - 2, size - 3, 3);
  }
  if (age < .48) {
    const tick = Math.floor(age * 26);
    ctx.globalAlpha = 1 - age / .48;
    for (const side of [-1, 1]) {
      const x = bolt.endX + side * 8;
      const y = bolt.endY + (tick % 4) * 7;
      ctx.beginPath();
      ctx.moveTo(x, y - 10);
      ctx.bezierCurveTo(x + side * (20 + tick % 5), y - 8,
        x - side * 13, y + 3, x + side * 11, y + 10);
      ctx.strokeStyle = "#e7b86699";
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.strokeStyle = "#fff4bd";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawLightning() {
  if (!bolt || elapsed >= bolt.until) return;
  const { x, y, endX, endY } = bolt;
  const span = endY - y;
  ctx.save();
  ctx.globalAlpha = clamp((bolt.until - elapsed) / .1, 0, 1);
  ctx.beginPath();
  ctx.moveTo(Math.round(x), Math.round(y));
  ctx.lineTo(Math.round(x + 8), Math.round(y + span * .33));
  ctx.lineTo(Math.round(endX - 7), Math.round(y + span * .65));
  ctx.lineTo(Math.round(endX), Math.round(endY));
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#e7b86699";
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#fff4bd";
  ctx.stroke();
  ctx.restore();
}

function drawSnow() {
  if (zones[area].guide !== "barnaby") return;
  for (let i = 0; i < 34; i++) {
    const x = Math.floor((i * 79 + elapsed * (7 + i % 6)) % width);
    const y = Math.floor((i * 41 + elapsed * (12 + i % 13)) % height);
    ctx.fillStyle = i % 3 ? "#c8dfe7b3" : "#eef6ecd9";
    ctx.fillRect(x, y, i % 4 === 0 ? 2 : 1, 1);
  }
}

function drawRain() {
  if (!storm) return;
  const drops = 26 + 115 * (1 - Math.exp(-storm * .37));
  ctx.fillStyle = "#adcbe59c";
  for (let i = 0; i < drops; i++) {
    const x = Math.floor((i * 67 + elapsed * (22 + i % 11)) % width);
    const y = Math.floor((i * 53 + elapsed * (110 + i % 43)) % height);
    ctx.fillRect(x, y, 1, 5);
    ctx.fillRect(x + 1, y - 3, 1, 3);
  }
}

function frame(time) {
  const dt = Math.min((time - (lastTime || time)) / 1000, 1 / 30);
  lastTime = time;
  const movement = update(dt);
  const zone = zones[area];
  const camera = Math.round(clamp(player.x - width * .42, 0, zone.width - width));
  drawBackground(camera, zone);
  if (zone.guide === "shelly") drawTidalWave(camera);
  if (storm) {
    ctx.fillStyle = `rgba(11, 19, 38, ${.66 * (1 - Math.exp(-storm * .38))})`;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.save();
  ctx.translate(-camera, 0);
  ctx.beginPath();
  ctx.rect(0, 0, zone.width, height);
  ctx.clip();
  drawLevelScenery(zone, camera);
  if (zone.layout) drawAuthoredTerrain(zone, camera);
  else drawTerrain(zone, camera);
  drawSprings(zone, camera);
  drawLessonLandmarks(zone, camera, movement.moving);
  drawCheckpoint(zone, camera);
  if (area >= introCount && demoLevel === null) drawTrailSign("back", zone.start[0] + 54, zone.start[1]);
  const exitSign = demoLevel !== null || area < introCount ? "finish" : area === zones.length - 1 ? "end" : "next";
  drawTrailSign(exitSign, zone.exit[0] - 40, zone.exit[1]);
  drawGuide(zone);
  drawStars(zone);
  drawHealthPickups(camera);
  drawFood(zone, camera);
  if (area === 0) drawBob();
  if (area === 0 && !hasNotebook) {
    const bob = Math.round(Math.sin(elapsed * 4) * 2);
    ctx.drawImage(assets["notebook/notebook-closed"], 212, 52, 184, 236,
      notebookX - 9, ground - 30 + bob, 18, 23);
  }
  if (wisp) {
    if (wisp.softenedAt !== null) {
      const linger = wisp.challenge?.linger ?? 3;
      ctx.globalAlpha = .55 * clamp((linger - (elapsed - wisp.softenedAt)) / .7, 0, 1);
    }
    const x = Math.round(wisp.x);
    const y = Math.round(wisp.y);
    if (wisp.challenge && wisp.softenedAt === null && elapsed - wisp.bornAt < .8) {
      drawTrailEffect(0, x, y - 26, Math.floor((elapsed - wisp.bornAt) * 9));
    }
    ctx.drawImage(assets["thought-cloud"], x - 22, y - 14);
    ctx.fillStyle = "#9baab5";
    for (let i = 0; i < 6; i++) {
      const dropY = y + 13 + Math.floor((elapsed * 34 + i * 7) % 19);
      const dropX = x - 14 + i * 5;
      ctx.fillRect(dropX, dropY, 1, 3);
    }
    ctx.globalAlpha = 1;
  }
  if (!barnabyLift) drawPlayer(movement);
  if (zone.guide === "olli") {
    const frame = Math.floor(elapsed * 8) % 8;
    ctx.globalAlpha = .34;
    ctx.drawImage(assets["river/cutaway-flow"], frame * 176 + 16, 12, 144, 34,
      riverEdge.left, 198, 144, 34);
    ctx.globalAlpha = 1;
    ctx.drawImage(assets["river/cutaway-flow"], frame * 176 + 16, 8, 144, 10,
      riverEdge.left, 194, 144, 10);
  }
  drawStrikeAftermath();
  drawLightning();
  ctx.restore();
  drawRain();
  if (zone.guide === "barnaby") drawSnowfall(camera);
  drawSnow();
  if (!notebook.hidden) drawNotebook();
  requestAnimationFrame(frame);
}

const optionalAnimations = new Set(["guides/barnaby-carry", "landmarks/old-faithful-eruption"]);

Promise.all(imageSources.map(([name, source]) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => { assets[name] = image; resolve(); };
  image.onerror = () => {
    if (optionalAnimations.has(name)) resolve();
    else reject(new Error(`Could not load ${source}`));
  };
  image.src = source;
}))).then(() => {
  ready = true;
  restart();
  requestAnimationFrame(frame);
}, error => {
  console.error(error);
  announce(`${error.message}. Make sure the file is downloaded locally, then reload the game.`);
});
