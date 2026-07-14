(() => {
  if (window.__DOM_MOWER__) {
    window.__DOM_MOWER__.stop();
    return;
  }

  const TARGET_SELECTOR = "h1,h2,h3,h4,h5,h6,p,li,a,button,img,pre,blockquote,input,label,select,textarea,svg,span,strong,em,small,hr";
  const CONTAINER_SELECTOR = "div,section,article,aside,header,footer,nav,main,form,figure,table";
  const MAX_ENEMIES = 120;
  const TAU = Math.PI * 2;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const randomBetween = (min, max) => min + Math.random() * (max - min);

  const host = document.createElement("div");
  host.id = "dom-mower-root";
  host.style.cssText = "position:fixed;inset:0;z-index:2147483647;pointer-events:none;";
  const shadow = host.attachShadow({ mode: "closed" });
  shadow.innerHTML = `
    <style>
      :host { all: initial; }
      * { box-sizing: border-box; }
      #stage { position: fixed; inset: 0; font-family: ui-rounded, system-ui, sans-serif; color: #fff; }
      canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: auto; }
      #hud { position: absolute; top: 16px; left: 16px; right: 16px; display: flex; align-items: flex-start; justify-content: space-between; pointer-events: none; }
      .panel { padding: 10px 13px; border: 1px solid rgba(255,255,255,.2); border-radius: 14px; background: rgba(9,12,22,.82); box-shadow: 0 8px 30px rgba(0,0,0,.28); backdrop-filter: blur(10px); }
      .brand { font-weight: 900; letter-spacing: .08em; color: #a7ff5b; }
      .stats { display: flex; gap: 14px; margin-top: 6px; font-size: 13px; color: #d8dfeb; }
      #health, #xp { width: 220px; height: 8px; margin-top: 8px; overflow: hidden; border-radius: 99px; background: rgba(255,255,255,.13); }
      #health > i, #xp > i { display: block; height: 100%; width: 100%; border-radius: inherit; background: linear-gradient(90deg,#ff4d67,#ff9c5a); transition: width .15s; }
      #xp > i { background: linear-gradient(90deg,#58d9ff,#a7ff5b); }
      #tip { position: absolute; left: 50%; bottom: 108px; transform: translateX(-50%); padding: 8px 12px; border-radius: 99px; background: rgba(9,12,22,.76); font-size: 12px; color: #d8dfeb; pointer-events: none; }
      #skillbar { position: absolute; left: 50%; bottom: 18px; display: flex; align-items: stretch; gap: 8px; transform: translateX(-50%); pointer-events: auto; }
      .skill { position: relative; width: 118px; min-height: 76px; overflow: hidden; border: 1px solid rgba(255,255,255,.18); background: rgba(13,18,30,.92); text-align: left; }
      .skill:hover { border-color: #a7ff5b; }
      .skill kbd { display: block; margin-bottom: 3px; color: #a7ff5b; font: 800 11px ui-monospace,monospace; }
      .skill strong { display: block; font-size: 15px; }
      .skill span { display: block; margin-top: 5px; color: #aeb9cc; font-size: 11px; font-weight: 600; }
      .skill.cooling { opacity: .62; }
      #clipboard { min-width: 92px; padding: 11px 13px; border: 1px solid rgba(255,255,255,.18); border-radius: 10px; background: rgba(13,18,30,.92); color: #aeb9cc; font-size: 11px; }
      #clipboard b { display: block; margin-top: 6px; color: #ff70c7; font-size: 24px; }
      #active-rules { display: block; width: 150px; margin-top: 5px; overflow: hidden; color: #a7ff5b; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
      #toast { position: absolute; left: 50%; top: 24%; opacity: 0; transform: translate(-50%,-8px); padding: 10px 16px; border: 1px solid rgba(167,255,91,.35); border-radius: 99px; background: rgba(9,12,22,.92); color: #fff; font-size: 14px; font-weight: 800; transition: .18s ease; pointer-events: none; }
      #toast.show { opacity: 1; transform: translate(-50%,0); }
      button { appearance: none; border: 0; border-radius: 10px; padding: 9px 12px; color: #fff; background: rgba(255,255,255,.12); font: 700 13px system-ui,sans-serif; cursor: pointer; pointer-events: auto; }
      button:hover { background: rgba(255,255,255,.2); }
      #overlay { position: absolute; inset: 0; display: none; align-items: center; justify-content: center; padding: 24px; background: rgba(5,8,15,.62); pointer-events: auto; }
      #overlay.show { display: flex; }
      .card { width: min(650px, 92vw); padding: 26px; border: 1px solid rgba(255,255,255,.2); border-radius: 24px; background: #111725; box-shadow: 0 30px 90px rgba(0,0,0,.55); text-align: center; }
      .card h2 { margin: 0 0 8px; font-size: 30px; }
      .card p { margin: 0 0 20px; color: #aeb9cc; }
      #choices { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
      .choice { min-height: 145px; padding: 18px 14px; border: 1px solid rgba(255,255,255,.13); background: #1b2435; text-align: left; }
      .choice:hover { border-color: #a7ff5b; background: #232f42; transform: translateY(-2px); }
      .choice strong { display: block; margin-bottom: 8px; color: #a7ff5b; font-size: 16px; }
      .choice span { color: #c8d1df; font-weight: 500; line-height: 1.45; }
      .actions { display: flex; justify-content: center; gap: 10px; }
      .primary { color: #101509; background: #a7ff5b; }
      .primary:hover { background: #c2ff8d; }
      @media (max-width: 620px) { #choices { grid-template-columns: 1fr; } .choice { min-height: 0; } }
    </style>
    <div id="stage">
      <canvas></canvas>
      <div id="hud">
        <div class="panel">
          <div class="brand">DOM MOWER</div>
          <div class="stats"><span>关卡 <b id="stage-number">1</b></span><span>等级 <b id="level">1</b></span><span>得分 <b id="score">0</b></span><span>剩余 <b id="left">0</b></span></div>
          <div id="health"><i></i></div>
          <div id="xp"><i></i></div>
        </div>
        <button id="exit">退出游戏</button>
      </div>
      <div id="tip">WASD / 方向键移动 · 浏览器命令主动施放 · 敌人仍会被基础攻击自动锁定</div>
      <div id="skillbar">
        <button class="skill" data-skill="find"><kbd>1 / ⌘F</kbd><strong>查找</strong><span>就绪</span></button>
        <button class="skill" data-skill="cut"><kbd>2 / ⌘X</kbd><strong>剪切</strong><span>就绪</span></button>
        <button class="skill" data-skill="paste"><kbd>3 / ⌘V</kbd><strong>粘贴</strong><span>需要剪贴板</span></button>
        <div id="clipboard">剪贴板<b>0</b><span id="active-rules">规则：基础</span></div>
      </div>
      <div id="toast"></div>
      <div id="overlay"><div class="card"><h2 id="overlay-title"></h2><p id="overlay-copy"></p><div id="choices"></div><div class="actions" id="actions"></div></div></div>
    </div>
  `;
  document.documentElement.appendChild(host);
  document.documentElement.classList.add("dom-mower-active");

  const canvas = shadow.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  const overlay = shadow.querySelector("#overlay");
  const overlayTitle = shadow.querySelector("#overlay-title");
  const overlayCopy = shadow.querySelector("#overlay-copy");
  const choicesNode = shadow.querySelector("#choices");
  const actionsNode = shadow.querySelector("#actions");
  const levelNode = shadow.querySelector("#level");
  const stageNumberNode = shadow.querySelector("#stage-number");
  const scoreNode = shadow.querySelector("#score");
  const leftNode = shadow.querySelector("#left");
  const healthBar = shadow.querySelector("#health i");
  const xpBar = shadow.querySelector("#xp i");
  const clipboardNode = shadow.querySelector("#clipboard b");
  const activeRulesNode = shadow.querySelector("#active-rules");
  const toastNode = shadow.querySelector("#toast");
  const skillButtons = [...shadow.querySelectorAll(".skill")];

  let width = innerWidth;
  let height = innerHeight;
  let dpr = Math.min(devicePixelRatio || 1, 2);
  let animationFrame = 0;
  let lastTime = performance.now();
  let active = true;
  let paused = false;
  let ended = false;
  let stageNumber = 1;
  let score = 0;
  let clearedCount = 0;
  let combo = 0;
  let comboTimer = 0;
  let level = 1;
  let xp = 0;
  let xpNeeded = 42;
  let bulletCooldown = 0;
  let elapsed = 0;
  let rescanDelay = 0;
  let skillHudTimer = 0;
  let toastTimer = 0;
  let nextStageTimer = 0;
  let mouseTarget = null;
  let enemies = [];
  let bullets = [];
  let enemyBullets = [];
  let particles = [];
  let orbs = [];
  let flashes = [];
  let chains = [];
  let clipboard = [];
  const keys = new Set();
  const touchedElements = new Set();
  const initialScrollX = scrollX;
  const initialScrollY = scrollY;
  const rules = { link: false, image: false, child: false, adjacent: false, sameClass: false, nth: false, wildcard: false, important: false };
  const skills = {
    find: { cooldown: 7, remaining: 0 },
    cut: { cooldown: 5, remaining: 0 },
    paste: { cooldown: 2, remaining: 0 },
  };

  const player = {
    x: width / 2,
    y: height / 2,
    radius: 16,
    speed: 250,
    hp: 100,
    maxHp: 100,
    damage: 22,
    attackInterval: 0.28,
    projectileCount: 1,
    bladeDamage: 28,
    bladeRadius: 70,
    bladeCount: 3,
    magnet: 115,
  };

  const enemyStyle = {
    text: { color: "#57d7ff", label: "文字" },
    link: { color: "#ffd34e", label: "链接" },
    button: { color: "#ff6c87", label: "按钮" },
    image: { color: "#b58cff", label: "图片" },
    heading: { color: "#ff8c4b", label: "标题" },
    control: { color: "#ff70c7", label: "控件" },
    container: { color: "#7b8cff", label: "面板" },
  };

  function resizeCanvas() {
    width = innerWidth;
    height = innerHeight;
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    player.x = clamp(player.x, player.radius, width - player.radius);
    player.y = clamp(player.y, player.radius, height - player.radius);
  }

  function classify(element) {
    const tag = element.tagName;
    if (/^H[1-6]$/.test(tag)) return "heading";
    if (tag === "IMG" || tag === "SVG") return "image";
    if (tag === "BUTTON") return "button";
    if (tag === "A") return "link";
    if (["INPUT", "LABEL", "SELECT", "TEXTAREA"].includes(tag)) return "control";
    return "text";
  }

  function isVisible({ element, rect }) {
    if (rect.width < 18 || rect.height < 10 || rect.bottom <= 0 || rect.top >= height || rect.right <= 0 || rect.left >= width) return false;
    const style = getComputedStyle(element);
    return style.visibility !== "hidden" && style.display !== "none" && Number(style.opacity) > 0.05;
  }

  function hasPaintedSurface(element) {
    const style = getComputedStyle(element);
    const background = style.backgroundColor.replaceAll(" ", "");
    const transparentBackground = background === "transparent" || background === "rgba(0,0,0,0)";
    const hasBorder = [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth].some((value) => parseFloat(value) > 0);
    return !transparentBackground || style.backgroundImage !== "none" || style.boxShadow !== "none" || hasBorder;
  }

  function createEnemy({ element, rect, forcedType }, index) {
    const type = forcedType || classify(element);
    const areaPower = Math.sqrt(Math.min(rect.width * rect.height, 120000));
    const baseHp = type === "container" ? 110 : type === "image" ? 78 : type === "heading" ? 64 : type === "button" || type === "control" ? 48 : type === "link" ? 28 : 34;
    const hpScale = type === "container" ? 0.32 : type === "image" ? 0.24 : 0.09;
    const hp = Math.round(baseHp + areaPower * hpScale);
    element.classList.add("dom-mower-target");
    touchedElements.add(element);
    return {
      id: index,
      element,
      type,
      x: clamp(rect.left, 0, width),
      y: clamp(rect.top, 0, height),
      w: clamp(rect.width, 18, width),
      h: clamp(rect.height, 12, height),
      hp,
      maxHp: hp,
      dead: false,
      flash: 0,
      shootTimer: randomBetween(1.2, 3.2),
      drift: Math.random() * TAU,
    };
  }

  function scanEnemies() {
    const semanticCandidates = [...document.querySelectorAll(TARGET_SELECTOR)]
      .map((element) => ({ element, rect: element.getBoundingClientRect() }))
      .filter(isVisible)
      .filter(({ element }) => {
        const parent = element.parentElement?.closest(TARGET_SELECTOR);
        return !parent || parent.tagName === "BODY";
      });

    const paintedContainers = [...document.querySelectorAll(CONTAINER_SELECTOR)]
      .map((element) => ({ element, rect: element.getBoundingClientRect(), forcedType: "container" }))
      .filter(isVisible)
      .filter(({ element, rect }) => rect.width * rect.height >= 5000 && hasPaintedSurface(element))
      .filter(({ element }) => !semanticCandidates.some((candidate) => element.contains(candidate.element)))
      .sort((a, b) => a.rect.width * a.rect.height - b.rect.width * b.rect.height);

    const selectedContainers = [];
    for (const candidate of paintedContainers) {
      if (selectedContainers.some((selected) => candidate.element.contains(selected.element))) continue;
      selectedContainers.push(candidate);
    }

    return [...semanticCandidates, ...selectedContainers]
      .slice(0, MAX_ENEMIES)
      .map(createEnemy);
  }

  function centerOf(enemy) {
    return { x: enemy.x + enemy.w / 2, y: enemy.y + enemy.h / 2 };
  }

  function nearestEnemyObject() {
    let nearest = null;
    let nearestDistance = Infinity;
    for (const enemy of enemies) {
      if (enemy.dead) continue;
      const center = centerOf(enemy);
      const currentDistance = distance(player, center);
      if (currentDistance < nearestDistance) {
        nearest = enemy;
        nearestDistance = currentDistance;
      }
    }
    return nearest;
  }

  function nearestEnemy() {
    const enemy = nearestEnemyObject();
    return enemy ? centerOf(enemy) : null;
  }

  function fireBullets() {
    const target = nearestEnemy();
    if (!target) return;
    const baseAngle = Math.atan2(target.y - player.y, target.x - player.x);
    for (let index = 0; index < player.projectileCount; index += 1) {
      const spread = (index - (player.projectileCount - 1) / 2) * 0.16;
      const angle = baseAngle + spread;
      bullets.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * 780,
        vy: Math.sin(angle) * 780,
        radius: 5,
        damage: player.damage,
        life: 1.7,
        pierce: 2,
        hits: new Set(),
        color: "#e9ff68",
      });
    }
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toastNode.textContent = message;
    toastNode.classList.add("show");
    toastTimer = setTimeout(() => toastNode.classList.remove("show"), 1100);
  }

  function updateSkillHud() {
    clipboardNode.textContent = clipboard.length;
    const activeRules = Object.entries(rules).filter(([, enabled]) => enabled).map(([name]) => ruleLabels[name]);
    activeRulesNode.textContent = `规则：${activeRules.length > 0 ? activeRules.join(" ") : "基础"}`;
    for (const button of skillButtons) {
      const name = button.dataset.skill;
      const skill = skills[name];
      const status = button.querySelector("span");
      const unavailable = name === "paste" && clipboard.length === 0;
      button.classList.toggle("cooling", skill.remaining > 0 || unavailable);
      status.textContent = skill.remaining > 0 ? `${skill.remaining.toFixed(1)} 秒` : unavailable ? "需要剪贴板" : "就绪";
    }
  }

  function findTargets(primary) {
    const alive = enemies.filter((enemy) => !enemy.dead);
    const selected = new Set(alive.filter((enemy) => enemy.type === primary.type));

    if (rules.link) alive.filter((enemy) => enemy.type === "link").forEach((enemy) => selected.add(enemy));
    if (rules.image) alive.filter((enemy) => enemy.type === "image").forEach((enemy) => selected.add(enemy));
    if (rules.child) alive.filter((enemy) => enemy.element.parentElement === primary.element.parentElement).forEach((enemy) => selected.add(enemy));
    if (rules.sameClass) {
      const classes = [...primary.element.classList].filter((name) => !name.startsWith("dom-mower-"));
      if (classes.length > 0) {
        alive.filter((enemy) => classes.some((name) => enemy.element.classList.contains(name))).forEach((enemy) => selected.add(enemy));
      }
    }
    if (rules.wildcard) alive.forEach((enemy) => selected.add(enemy));
    return [...selected].slice(0, rules.wildcard ? 24 : 16);
  }

  function useFind() {
    if (skills.find.remaining > 0) return;
    const primary = nearestEnemyObject();
    if (!primary) return;
    const targets = findTargets(primary);
    let previous = { x: player.x, y: player.y };
    targets.forEach((enemy, index) => {
      const center = centerOf(enemy);
      chains.push({ from: previous, to: center, life: 0.32, color: "#57d7ff" });
      previous = center;
      let damage = 44 * (rules.wildcard ? 0.68 : 1);
      if (rules.nth && index % 2 === 1) damage *= 2;
      if (rules.important && (enemy.type === "image" || enemy.type === "container")) damage *= 1.8;
      hitEnemy(enemy, damage, center.x, center.y);
    });
    skills.find.remaining = skills.find.cooldown;
    showToast(`查找：锁定 ${targets.length} 个${enemyStyle[primary.type].label}元素`);
    updateSkillHud();
  }

  function useCut() {
    if (skills.cut.remaining > 0) return;
    const radius = player.bladeRadius * 1.9;
    const targets = enemies.filter((enemy) => !enemy.dead && distance(player, centerOf(enemy)) <= radius + Math.max(enemy.w, enemy.h) / 2);
    if (targets.length === 0) {
      showToast("靠近网页元素后再剪切");
      return;
    }
    flashes.push({ x: player.x, y: player.y, radius: 12, maxRadius: radius, life: 0.38 });
    targets.slice(0, 12).forEach((enemy, index) => {
      clipboard.push(enemy.type);
      if (clipboard.length > 18) clipboard.shift();
      const executeThreshold = rules.important ? 0.65 : 0.4;
      let damage = enemy.type === "text" || enemy.type === "link" || enemy.hp / enemy.maxHp <= executeThreshold ? enemy.hp : 68;
      if (rules.nth && index % 2 === 1) damage *= 1.6;
      hitEnemy(enemy, damage, centerOf(enemy).x, centerOf(enemy).y);
    });
    skills.cut.remaining = skills.cut.cooldown;
    showToast(`剪切：剪贴板收录 ${Math.min(targets.length, 12)} 个元素`);
    updateSkillHud();
  }

  function usePaste() {
    if (skills.paste.remaining > 0) return;
    if (clipboard.length === 0) {
      showToast("剪贴板是空的，先使用剪切");
      return;
    }
    const targets = enemies.filter((enemy) => !enemy.dead);
    if (targets.length === 0) return;
    const fragments = clipboard.splice(0, 12);
    fragments.forEach((type, index) => {
      const target = centerOf(targets[index % targets.length]);
      const angle = Math.atan2(target.y - player.y, target.x - player.x) + (index - (fragments.length - 1) / 2) * 0.035;
      const heavy = type === "image" || type === "container";
      const rapid = type === "button" || type === "control";
      bullets.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * 720,
        vy: Math.sin(angle) * 720,
        radius: heavy ? 9 : 6,
        damage: (heavy ? 58 : rapid ? 38 : 30) * (rules.important ? 1.25 : 1),
        splash: heavy ? 100 : 0,
        life: 2,
        pierce: rapid ? 3 : heavy ? 1 : 2,
        hits: new Set(),
        color: enemyStyle[type].color,
      });
    });
    skills.paste.remaining = skills.paste.cooldown;
    showToast(`粘贴：释放 ${fragments.length} 个网页碎片`);
    updateSkillHud();
  }

  function useSkill(name) {
    if (paused || ended) return;
    if (name === "find") useFind();
    if (name === "cut") useCut();
    if (name === "paste") usePaste();
  }

  function hitEnemy(enemy, damage, hitX, hitY) {
    if (enemy.dead) return;
    enemy.hp -= damage;
    enemy.flash = 0.12;
    enemy.element.classList.remove("dom-mower-hit");
    void enemy.element.offsetWidth;
    enemy.element.classList.add("dom-mower-hit");
    setTimeout(() => enemy.element?.classList.remove("dom-mower-hit"), 130);

    for (let i = 0; i < 4; i += 1) {
      particles.push({ x: hitX, y: hitY, vx: randomBetween(-90, 90), vy: randomBetween(-110, 40), life: 0.45, color: enemyStyle[enemy.type].color, size: randomBetween(2, 5) });
    }
    if (enemy.hp <= 0) destroyEnemy(enemy);
  }

  function destroyEnemy(enemy) {
    enemy.dead = true;
    enemy.element.classList.add("dom-mower-destroyed");
    clearedCount += 1;
    combo += 1;
    comboTimer = 2.2;
    const reward = Math.round(8 + enemy.maxHp / 7);
    score += reward * Math.max(1, Math.min(combo, 10));
    const center = centerOf(enemy);
    const orbCount = enemy.type === "image" || enemy.type === "heading" || enemy.type === "container" ? 5 : 2;
    for (let i = 0; i < orbCount; i += 1) {
      orbs.push({ x: center.x + randomBetween(-20, 20), y: center.y + randomBetween(-20, 20), vx: randomBetween(-45, 45), vy: randomBetween(-80, -20), value: 7, radius: 5 });
    }
    for (let i = 0; i < 16; i += 1) {
      particles.push({ x: center.x, y: center.y, vx: randomBetween(-180, 180), vy: randomBetween(-200, 120), life: randomBetween(0.45, 0.9), color: enemyStyle[enemy.type].color, size: randomBetween(3, 8) });
    }
    if (rules.adjacent) {
      const sibling = enemy.element.nextElementSibling;
      const adjacent = sibling && enemies.find((candidate) => !candidate.dead && (candidate.element === sibling || sibling.contains(candidate.element) || candidate.element.contains(sibling)));
      if (adjacent) {
        const adjacentCenter = centerOf(adjacent);
        chains.push({ from: center, to: adjacentCenter, life: 0.28, color: "#ffd34e" });
        hitEnemy(adjacent, 36, adjacentCenter.x, adjacentCenter.y);
      }
    }
    updateHud();
    if (enemies.every((item) => item.dead)) rescanDelay = 0.25;
  }

  function rescanAfterClear() {
    const nextEnemies = scanEnemies();
    if (nextEnemies.length === 0) {
      if (hasNextStage()) showNextStage();
      else endGame(true);
      return;
    }
    enemies = nextEnemies;
    bullets = [];
    updateHud();
  }

  function hasNextStage() {
    const scroller = document.scrollingElement || document.documentElement;
    return scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop > 24;
  }

  function showNextStage() {
    paused = true;
    bullets = [];
    enemyBullets = [];
    overlayTitle.textContent = `第 ${stageNumber} 关已清理`;
    overlayCopy.textContent = `已累计清理 ${clearedCount} 个网页元素。继续向下推进一屏。`;
    choicesNode.innerHTML = "";
    actionsNode.innerHTML = "";

    const next = document.createElement("button");
    next.className = "primary";
    next.textContent = "下一关";
    next.addEventListener("click", startNextStage, { once: true });
    const exit = document.createElement("button");
    exit.textContent = "退出并恢复网页";
    exit.addEventListener("click", stop);
    actionsNode.append(next, exit);
    overlay.classList.add("show");
  }

  function startNextStage() {
    const scroller = document.scrollingElement || document.documentElement;
    const maxScrollTop = scroller.scrollHeight - scroller.clientHeight;
    const nextScrollTop = Math.min(maxScrollTop, scroller.scrollTop + height * 0.78);
    if (nextScrollTop - scroller.scrollTop < 24) {
      endGame(true);
      return;
    }

    stageNumber += 1;
    stageNumberNode.textContent = stageNumber;
    overlay.classList.remove("show");
    mouseTarget = null;
    flashes = [];
    chains = [];
    window.scrollTo({ top: nextScrollTop, left: initialScrollX, behavior: "smooth" });

    clearTimeout(nextStageTimer);
    nextStageTimer = setTimeout(() => {
      if (!active) return;
      enemies = scanEnemies();
      rescanDelay = 0;
      lastTime = performance.now();
      updateHud();
      if (enemies.length === 0) {
        if (hasNextStage()) showNextStage();
        else endGame(true);
        return;
      }
      paused = false;
      showToast(`第 ${stageNumber} 关：发现 ${enemies.length} 个元素`);
    }, 600);
  }

  function collectXp(value) {
    xp += value;
    if (xp >= xpNeeded && !ended) {
      xp -= xpNeeded;
      level += 1;
      xpNeeded = Math.round(xpNeeded * 1.28);
      showUpgrade();
    }
    updateHud();
  }

  const ruleLabels = { link: "a", image: "img", child: ">", adjacent: "+", sameClass: ".class", nth: ":nth", wildcard: "*", important: "!important" };
  const ruleUpgrades = [
    { id: "link", title: "链接选择器  a", copy: "查找会额外锁定当前画面中的全部链接。" },
    { id: "image", title: "图片选择器  img", copy: "查找会额外锁定图片，粘贴图片碎片造成范围爆炸。" },
    { id: "child", title: "子代选择器  >", copy: "查找一个元素时，同时锁定同一父节点下的其他元素。" },
    { id: "adjacent", title: "相邻兄弟  +", copy: "击碎元素后，立即伤害它右侧相邻的网页元素。" },
    { id: "sameClass", title: "同类选择器  .class", copy: "查找会传播到 CSS class 相同的网页元素。" },
    { id: "nth", title: "奇偶选择器  :nth-child", copy: "查找和剪切命中的每第二个元素获得额外伤害。" },
    { id: "wildcard", title: "通配符  *", copy: "查找可以锁定所有类型，但单次伤害会降低。" },
    { id: "important", title: "最高优先级  !important", copy: "查找重创图片和面板，剪切可以处决更高血量目标。" },
  ];
  const commandUpgrades = [
    { title: "递归查找", copy: "查找冷却时间缩短 20%。", apply: () => { skills.find.cooldown *= 0.8; } },
    { title: "剪贴板加速", copy: "剪切冷却时间缩短 20%。", apply: () => { skills.cut.cooldown *= 0.8; } },
    { title: "批量粘贴", copy: "粘贴冷却时间缩短 25%，基础攻击弹量 +1。", apply: () => { skills.paste.cooldown *= 0.75; player.projectileCount += 1; } },
  ];

  function showUpgrade() {
    paused = true;
    overlayTitle.textContent = `升级到 ${level} 级`;
    overlayCopy.textContent = "选择一项强化，继续清理网页。";
    choicesNode.innerHTML = "";
    actionsNode.innerHTML = "";
    const availableRules = ruleUpgrades
      .filter((upgrade) => !rules[upgrade.id])
      .sort(() => Math.random() - 0.5);
    const pool = [...availableRules, ...commandUpgrades].slice(0, 3);
    pool.forEach((upgrade) => {
      const button = document.createElement("button");
      button.className = "choice";
      button.innerHTML = `<strong>${upgrade.title}</strong><span>${upgrade.copy}</span>`;
      button.addEventListener("click", () => {
        if (upgrade.id) rules[upgrade.id] = true;
        else upgrade.apply();
        paused = false;
        overlay.classList.remove("show");
        updateHud();
        updateSkillHud();
      }, { once: true });
      choicesNode.appendChild(button);
    });
    overlay.classList.add("show");
    updateHud();
  }

  async function endGame(won) {
    if (ended) return;
    ended = true;
    paused = true;
    overlayTitle.textContent = won ? "页面已清理" : "割草机停机了";
    overlayCopy.textContent = won ? `最终得分 ${score}，清除了 ${clearedCount} 个网页元素。` : `最终得分 ${score}。再试一次，优先躲开按钮发射的红色子弹。`;
    choicesNode.innerHTML = "";
    actionsNode.innerHTML = "";

    const replay = document.createElement("button");
    replay.className = "primary";
    replay.textContent = "再玩一次";
    replay.addEventListener("click", restart);
    const exit = document.createElement("button");
    exit.textContent = "退出并恢复网页";
    exit.addEventListener("click", stop);
    actionsNode.append(replay, exit);
    overlay.classList.add("show");

    if (won && chrome?.storage?.local) {
      const stats = await chrome.storage.local.get({ highScore: 0, pagesCleaned: 0 });
      await chrome.storage.local.set({ highScore: Math.max(stats.highScore, score), pagesCleaned: stats.pagesCleaned + 1 });
    }
  }

  function restart() {
    clearTimeout(nextStageTimer);
    for (const element of touchedElements) element.classList.remove("dom-mower-destroyed", "dom-mower-hit", "dom-mower-target");
    touchedElements.clear();
    window.scrollTo(initialScrollX, initialScrollY);
    enemies = scanEnemies();
    bullets = [];
    enemyBullets = [];
    particles = [];
    orbs = [];
    flashes = [];
    chains = [];
    clipboard = [];
    Object.assign(player, { x: width / 2, y: height / 2, hp: 100, damage: 22, attackInterval: 0.28, projectileCount: 1, bladeDamage: 28, bladeRadius: 70, bladeCount: 3, speed: 250, magnet: 115 });
    Object.values(skills).forEach((skill) => { skill.remaining = 0; });
    Object.keys(rules).forEach((rule) => { rules[rule] = false; });
    skills.find.cooldown = 7;
    skills.cut.cooldown = 5;
    skills.paste.cooldown = 2;
    score = 0;
    stageNumber = 1;
    clearedCount = 0;
    combo = 0;
    level = 1;
    xp = 0;
    xpNeeded = 42;
    bulletCooldown = 0;
    elapsed = 0;
    rescanDelay = 0;
    mouseTarget = null;
    ended = false;
    paused = false;
    overlay.classList.remove("show");
    lastTime = performance.now();
    updateHud();
    updateSkillHud();
    animationFrame = requestAnimationFrame(frame);
  }

  function updatePlayer(dt) {
    let dx = 0;
    let dy = 0;
    if (keys.has("KeyA") || keys.has("ArrowLeft")) dx -= 1;
    if (keys.has("KeyD") || keys.has("ArrowRight")) dx += 1;
    if (keys.has("KeyW") || keys.has("ArrowUp")) dy -= 1;
    if (keys.has("KeyS") || keys.has("ArrowDown")) dy += 1;
    if (dx || dy) {
      const length = Math.hypot(dx, dy);
      dx /= length;
      dy /= length;
      mouseTarget = null;
    } else if (mouseTarget) {
      const targetDistance = distance(player, mouseTarget);
      if (targetDistance > 5) {
        dx = (mouseTarget.x - player.x) / targetDistance;
        dy = (mouseTarget.y - player.y) / targetDistance;
      } else {
        mouseTarget = null;
      }
    }
    player.x = clamp(player.x + dx * player.speed * dt, player.radius, width - player.radius);
    player.y = clamp(player.y + dy * player.speed * dt, player.radius, height - player.radius);
  }

  function updateWeapons(dt) {
    bulletCooldown -= dt;
    if (bulletCooldown <= 0) {
      fireBullets();
      bulletCooldown = player.attackInterval;
    }

    const bladeAngle = elapsed * 4.2;
    for (let index = 0; index < player.bladeCount; index += 1) {
      const angle = bladeAngle + index * TAU / player.bladeCount;
      const blade = { x: player.x + Math.cos(angle) * player.bladeRadius, y: player.y + Math.sin(angle) * player.bladeRadius };
      for (const enemy of enemies) {
        if (enemy.dead || enemy.flash > 0) continue;
        if (blade.x >= enemy.x - 10 && blade.x <= enemy.x + enemy.w + 10 && blade.y >= enemy.y - 10 && blade.y <= enemy.y + enemy.h + 10) {
          hitEnemy(enemy, player.bladeDamage * dt * 3.2, blade.x, blade.y);
        }
      }
    }

  }

  function updateBullets(dt) {
    for (const bullet of bullets) {
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      bullet.life -= dt;
      for (const enemy of enemies) {
        if (enemy.dead || bullet.life <= 0 || bullet.hits.has(enemy.id)) continue;
        if (bullet.x >= enemy.x && bullet.x <= enemy.x + enemy.w && bullet.y >= enemy.y && bullet.y <= enemy.y + enemy.h) {
          bullet.hits.add(enemy.id);
          hitEnemy(enemy, bullet.damage, bullet.x, bullet.y);
          if (bullet.splash) {
            const impact = centerOf(enemy);
            flashes.push({ x: impact.x, y: impact.y, radius: 8, maxRadius: bullet.splash, life: 0.3 });
            for (const nearby of enemies) {
              if (nearby.dead || nearby === enemy || distance(impact, centerOf(nearby)) > bullet.splash) continue;
              hitEnemy(nearby, bullet.damage * 0.55, centerOf(nearby).x, centerOf(nearby).y);
            }
          }
          bullet.pierce -= 1;
          if (bullet.pierce <= 0) bullet.life = 0;
        }
      }
    }
    bullets = bullets.filter((bullet) => bullet.life > 0 && bullet.x > -20 && bullet.x < width + 20 && bullet.y > -20 && bullet.y < height + 20);
  }

  function updateEnemies(dt) {
    for (const enemy of enemies) {
      if (enemy.dead) continue;
      enemy.flash = Math.max(0, enemy.flash - dt);
      if (enemy.type === "link") {
        enemy.drift += dt * 2.4;
        enemy.x += Math.cos(enemy.drift) * 14 * dt;
        enemy.y += Math.sin(enemy.drift * 1.3) * 10 * dt;
        enemy.x = clamp(enemy.x, 0, width - enemy.w);
        enemy.y = clamp(enemy.y, 0, height - enemy.h);
      }
      if (enemy.type === "button") {
        enemy.shootTimer -= dt;
        if (enemy.shootTimer <= 0) {
          enemy.shootTimer = randomBetween(2.2, 3.5);
          const center = centerOf(enemy);
          const angle = Math.atan2(player.y - center.y, player.x - center.x);
          enemyBullets.push({ x: center.x, y: center.y, vx: Math.cos(angle) * 210, vy: Math.sin(angle) * 210, life: 5, radius: 7 });
        }
      }
    }
  }

  function updateEnemyBullets(dt) {
    for (const bullet of enemyBullets) {
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      bullet.life -= dt;
      if (bullet.life > 0 && distance(player, bullet) < player.radius + bullet.radius) {
        bullet.life = 0;
        player.hp -= 12;
        flashes.push({ x: player.x, y: player.y, radius: 5, maxRadius: 50, life: 0.2, danger: true });
        updateHud();
        if (player.hp <= 0) endGame(false);
      }
    }
    enemyBullets = enemyBullets.filter((bullet) => bullet.life > 0 && bullet.x > -20 && bullet.x < width + 20 && bullet.y > -20 && bullet.y < height + 20);
  }

  function updateEffects(dt) {
    for (const particle of particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 220 * dt;
      particle.life -= dt;
    }
    particles = particles.filter((particle) => particle.life > 0);

    for (const orb of orbs) {
      const orbDistance = distance(player, orb);
      if (orbDistance < player.magnet) {
        const pull = clamp(900 / Math.max(orbDistance, 15), 8, 45);
        orb.vx += ((player.x - orb.x) / Math.max(orbDistance, 1)) * pull;
        orb.vy += ((player.y - orb.y) / Math.max(orbDistance, 1)) * pull;
      }
      orb.vx *= 0.97;
      orb.vy *= 0.97;
      orb.x += orb.vx * dt;
      orb.y += orb.vy * dt;
      if (orbDistance < player.radius + orb.radius + 4) {
        orb.collected = true;
        collectXp(orb.value);
      }
    }
    orbs = orbs.filter((orb) => !orb.collected);
    for (const flash of flashes) {
      flash.life -= dt;
      flash.radius += (flash.maxRadius - flash.radius) * Math.min(1, dt * 12);
    }
    flashes = flashes.filter((flash) => flash.life > 0);
    for (const chain of chains) chain.life -= dt;
    chains = chains.filter((chain) => chain.life > 0);
  }

  function updateHud() {
    stageNumberNode.textContent = stageNumber;
    levelNode.textContent = level;
    scoreNode.textContent = score.toLocaleString();
    leftNode.textContent = enemies.filter((enemy) => !enemy.dead).length;
    healthBar.style.width = `${clamp(player.hp / player.maxHp, 0, 1) * 100}%`;
    xpBar.style.width = `${clamp(xp / xpNeeded, 0, 1) * 100}%`;
  }

  function update(dt) {
    elapsed += dt;
    comboTimer -= dt;
    if (comboTimer <= 0) combo = 0;
    updatePlayer(dt);
    updateWeapons(dt);
    updateBullets(dt);
    updateEnemies(dt);
    updateEnemyBullets(dt);
    updateEffects(dt);
    for (const skill of Object.values(skills)) skill.remaining = Math.max(0, skill.remaining - dt);
    skillHudTimer -= dt;
    if (skillHudTimer <= 0) {
      skillHudTimer = 0.1;
      updateSkillHud();
    }
    if (rescanDelay > 0) {
      rescanDelay -= dt;
      if (rescanDelay <= 0) rescanAfterClear();
    }
  }

  function roundedRect(x, y, w, h, radius) {
    const r = Math.min(radius, w / 2, h / 2);
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }

  function render() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(5,8,15,.16)";
    ctx.fillRect(0, 0, width, height);

    for (const enemy of enemies) {
      if (enemy.dead) continue;
      const style = enemyStyle[enemy.type];
      ctx.save();
      ctx.globalAlpha = enemy.flash > 0 ? 1 : 0.8;
      roundedRect(enemy.x, enemy.y, enemy.w, enemy.h, Math.min(10, enemy.h / 3));
      ctx.fillStyle = `${style.color}18`;
      ctx.fill();
      ctx.lineWidth = enemy.flash > 0 ? 4 : 2;
      ctx.strokeStyle = style.color;
      ctx.stroke();
      const barWidth = Math.min(enemy.w, 90);
      ctx.fillStyle = "rgba(4,6,12,.72)";
      ctx.fillRect(enemy.x, enemy.y - 7, barWidth, 4);
      ctx.fillStyle = style.color;
      ctx.fillRect(enemy.x, enemy.y - 7, barWidth * clamp(enemy.hp / enemy.maxHp, 0, 1), 4);
      ctx.font = "700 10px system-ui";
      ctx.fillStyle = "rgba(255,255,255,.9)";
      ctx.fillText(style.label, enemy.x + 4, enemy.y + 12);
      ctx.restore();
    }

    for (const orb of orbs) {
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.radius, 0, TAU);
      ctx.fillStyle = "#a7ff5b";
      ctx.shadowColor = "#a7ff5b";
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    for (const chain of chains) {
      ctx.save();
      ctx.globalAlpha = clamp(chain.life * 3.2, 0, 1);
      ctx.strokeStyle = chain.color;
      ctx.lineWidth = 4;
      ctx.shadowColor = chain.color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(chain.from.x, chain.from.y);
      ctx.lineTo(chain.to.x, chain.to.y);
      ctx.stroke();
      ctx.restore();
    }

    for (const bullet of bullets) {
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.radius, 0, TAU);
      ctx.fillStyle = bullet.color;
      ctx.shadowColor = bullet.color;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    for (const bullet of enemyBullets) {
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.radius, 0, TAU);
      ctx.fillStyle = "#ff405f";
      ctx.shadowColor = "#ff405f";
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    for (const particle of particles) {
      ctx.globalAlpha = clamp(particle.life * 1.8, 0, 1);
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    }
    ctx.globalAlpha = 1;

    for (const flash of flashes) {
      ctx.beginPath();
      ctx.arc(flash.x, flash.y, flash.radius, 0, TAU);
      ctx.strokeStyle = flash.danger ? `rgba(255,64,95,${flash.life * 4})` : `rgba(167,255,91,${flash.life * 2})`;
      ctx.lineWidth = flash.danger ? 8 : 5;
      ctx.stroke();
    }

    const bladeAngle = elapsed * 4.2;
    ctx.strokeStyle = "rgba(167,255,91,.28)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.bladeRadius, 0, TAU);
    ctx.stroke();
    for (let index = 0; index < player.bladeCount; index += 1) {
      const angle = bladeAngle + index * TAU / player.bladeCount;
      const x = player.x + Math.cos(angle) * player.bladeRadius;
      const y = player.y + Math.sin(angle) * player.bladeRadius;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + Math.PI / 2);
      roundedRect(-13, -5, 26, 10, 5);
      ctx.fillStyle = "#d9ff74";
      ctx.shadowColor = "#a7ff5b";
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius + 5, 0, TAU);
    ctx.fillStyle = "rgba(5,8,15,.82)";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#a7ff5b";
    ctx.stroke();
    ctx.fillStyle = "#a7ff5b";
    ctx.fillRect(player.x - 7, player.y - 5, 14, 11);
    ctx.fillStyle = "#111725";
    ctx.fillRect(player.x - 4, player.y - 2, 3, 3);
    ctx.fillRect(player.x + 2, player.y - 2, 3, 3);

    if (combo >= 2 && comboTimer > 0) {
      ctx.save();
      ctx.textAlign = "center";
      ctx.font = `900 ${Math.min(48, 24 + combo)}px system-ui`;
      ctx.fillStyle = "#fff";
      ctx.shadowColor = "#a7ff5b";
      ctx.shadowBlur = 18;
      ctx.fillText(`${combo} 连击`, width / 2, 90);
      ctx.restore();
    }
  }

  function frame(now) {
    if (!active) return;
    const dt = Math.min((now - lastTime) / 1000, 0.033);
    lastTime = now;
    if (!paused && !ended) update(dt);
    render();
    if (!ended) animationFrame = requestAnimationFrame(frame);
  }

  function onKeyDown(event) {
    const commandSkill = (event.metaKey || event.ctrlKey) && { KeyF: "find", KeyX: "cut", KeyV: "paste" }[event.code];
    const numberSkill = { Digit1: "find", Digit2: "cut", Digit3: "paste" }[event.code];
    if (commandSkill || numberSkill) {
      event.preventDefault();
      event.stopImmediatePropagation();
      useSkill(commandSkill || numberSkill);
      return;
    }
    if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Escape"].includes(event.code)) event.preventDefault();
    if (event.code === "Escape") return stop();
    keys.add(event.code);
  }

  function onKeyUp(event) {
    keys.delete(event.code);
  }

  function onPointerDown(event) {
    if (event.target === canvas && !paused) mouseTarget = { x: event.clientX, y: event.clientY };
  }

  function blockScroll(event) {
    event.preventDefault();
  }

  function stop() {
    if (!active) return;
    active = false;
    cancelAnimationFrame(animationFrame);
    clearTimeout(nextStageTimer);
    clearTimeout(toastTimer);
    removeEventListener("keydown", onKeyDown, true);
    removeEventListener("keyup", onKeyUp, true);
    removeEventListener("resize", resizeCanvas);
    removeEventListener("wheel", blockScroll, { capture: true });
    removeEventListener("touchmove", blockScroll, { capture: true });
    canvas.removeEventListener("pointerdown", onPointerDown);
    for (const element of touchedElements) element.classList.remove("dom-mower-destroyed", "dom-mower-hit", "dom-mower-target");
    document.documentElement.classList.remove("dom-mower-active");
    host.remove();
    window.scrollTo(initialScrollX, initialScrollY);
    delete window.__DOM_MOWER__;
  }

  window.__DOM_MOWER__ = { stop };
  shadow.querySelector("#exit").addEventListener("click", stop);
  skillButtons.forEach((button) => button.addEventListener("click", () => useSkill(button.dataset.skill)));
  addEventListener("keydown", onKeyDown, true);
  addEventListener("keyup", onKeyUp, true);
  addEventListener("resize", resizeCanvas);
  addEventListener("wheel", blockScroll, { passive: false, capture: true });
  addEventListener("touchmove", blockScroll, { passive: false, capture: true });
  canvas.addEventListener("pointerdown", onPointerDown);
  resizeCanvas();
  enemies = scanEnemies();
  updateHud();
  updateSkillHud();

  if (enemies.length === 0) {
    overlayTitle.textContent = "这一屏没有可清理元素";
    overlayCopy.textContent = "换一个普通网页再试。浏览器设置页和空白页不支持运行扩展。";
    choicesNode.innerHTML = "";
    actionsNode.innerHTML = "";
    const exit = document.createElement("button");
    exit.textContent = "退出";
    exit.addEventListener("click", stop);
    actionsNode.appendChild(exit);
    overlay.classList.add("show");
    paused = true;
  }

  animationFrame = requestAnimationFrame(frame);
})();
