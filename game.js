'use strict';

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = 960;
  const H = 528;
  const C = 48;
  const AURA_CAP = 3;
  const SOFT_BONUS_CAP = 1.5;
  const canvasbox = document.querySelector('.canvasbox');
  const route = [[-24, 264], [120, 264], [120, 120], [360, 120], [360, 408], [600, 408], [600, 216], [840, 216], [840, 312], [984, 312]];

  const towers = {
    arrow: { name: '连射弓塔', icon: '➶', cost: 50, range: 155, rate: 0.66, damage: 16, color: '#6dc9ff', kind: 'arrow', category: 'arch', desc: '高速多目标箭矢' },
    arcane: { name: '奥术飞弹', icon: '✦', cost: 55, range: 165, rate: 1.05, damage: 27, color: '#9dd7ff', kind: 'bolt', category: 'spell', desc: '追踪单体纯粹伤害' },
    fire: { name: '烈焰爆弹', icon: '🔥', cost: 65, range: 145, rate: 1.45, damage: 30, color: '#ff8a4c', kind: 'splash', category: 'spell', desc: '范围直击与燃烧' },
    frost: { name: '寒霜脉冲', icon: '❄', cost: 60, range: 145, rate: 1.1, damage: 14, color: '#8ce8e7', kind: 'slow', category: 'spell', desc: '减速并造成直击' },
    chain: { name: '闪电链', icon: 'ϟ', cost: 75, range: 165, rate: 1.55, damage: 23, color: '#c99cff', kind: 'chain', category: 'spell', desc: '跳跃打击多个目标' },
    blade: { name: '刃灵召唤', icon: '⚔', cost: 70, range: 130, rate: 1.5, damage: 16, color: '#f2d879', kind: 'summonPhysical', category: 'summon', desc: '物理召唤物，继承攻速' },
    wisp: { name: '奥灵召唤', icon: '◈', cost: 75, range: 150, rate: 1.7, damage: 19, color: '#c99cff', kind: 'summonMagic', category: 'summon', desc: '法术召唤物，继承施法速度' },
    aura: { name: '强化光环', icon: '✧', cost: 22, range: 175, color: '#e5c16e', kind: 'aura', category: 'support', desc: '强化范围内友方塔的六维' },
    venomAura: { name: '剧毒光环', icon: '☠', cost: 25, range: 165, color: '#8cdb77', kind: 'poisonAura', category: 'support', desc: '令范围内怪物中毒并易伤' },
    frostAura: { name: '冰霜光环', icon: '❄', cost: 25, range: 165, color: '#80dce5', kind: 'frostAura', category: 'support', desc: '令范围内怪物减速并易伤' }
  };

  const supports = {
    reach: { name: '集中效应', icon: '◎', desc: '作用范围 -25%，伤害 +35%', stats: { range: -0.25, direct: 0.35, dot: 0.35 } },
    echo: { name: '范围扩张', icon: '◉', desc: '作用范围 +30%，伤害 -20%', stats: { range: 0.3, direct: -0.2, dot: -0.2 } },
    cast: { name: '施法急速', icon: '»', desc: '施法频率 +40%', stat: 'cast', value: 0.4 },
    summon: { name: '召唤增幅', icon: '♙', desc: '召唤频率 +40%，召唤上限 +1', stat: 'cast', value: 0.4, summonCap: 1 },
    attack: { name: '攻击急速', icon: '➤', desc: '攻击频率 +40%', stat: 'attack', value: 0.4 },
    multishot: { name: '连射校准', icon: '⋔', desc: '攻击频率 +20%，弓塔额外箭矢', stat: 'attack', value: 0.2, arrows: 1 },
    might: { name: '强力打击', icon: '✹', desc: '直击伤害 +45%', stat: 'direct', value: 0.45 },
    pierce: { name: '破防之刃', icon: '⚔', desc: '无视 25% 防御力', stat: 'penetration', value: 0.25 },
    dot: { name: '毒素蔓延', icon: '♨', desc: '持续伤害 +70%', stat: 'dot', value: 0.7 },
    poison: { name: '腐蚀之牙', icon: '☠', desc: '施加中毒与易伤', stat: 'debuff', value: 0.3, effect: 'poison' },
    fracture: { name: '破甲印记', icon: '⛓', desc: '降低怪物防御力', stat: 'debuff', value: 0.3, effect: 'armorBreak' },
    chill: { name: '冰霜缠绕', icon: '❄', desc: '施加减速', stat: 'debuff', value: 0.3, effect: 'slow' },
    root: { name: '纠缠藤蔓', icon: '♧', desc: '施加短暂定身', stat: 'debuff', value: 0.25, effect: 'root' },
    expose: { name: '精神洞穿', icon: '◉', desc: '施加易伤', stat: 'debuff', value: 0.25, effect: 'vulnerability' },
    burn: { name: '余烬附着', icon: '♨', desc: '命中后附加燃烧 DoT', stat: 'dot', value: 0.2, effect: 'burn' },
    fireSeed: { name: '火之种', icon: '🔥', desc: '命中时 50% 几率点燃 3 秒；每秒造成该次命中伤害的 20%，最多叠加 5 层', effect: 'fireSeed', value: 1 },
    iceSeed: { name: '冰之种', icon: '❄', desc: '命中时 50% 几率冰冻 3 秒；冰冻期间受到的伤害提高 10%', effect: 'iceSeed', value: 1 },
    lightningSeed: { name: '雷之种', icon: 'ϟ', desc: '命中时 50% 几率感电 3 秒；感电敌人被击中时释放闪电，造成施加感电那次命中伤害的 50%，连锁 3 次', effect: 'lightningSeed', value: 1 }
  };

  let gold = 150;
  let life = 20;
  let wave = 0;
  let kills = 0;
  let selected = 'arrow';
  let activeTowerCategory = 'arch';
  let activeSupportGroup = 'range';
  let buildLinks = [];
  let placed = [];
  let enemies = [];
  let projectiles = [];
  let particles = [];
  let arcs = [];
  let spawnLeft = 0;
  let spawnedInBatch = 0;
  let spawnTimer = 0;
  let active = false;
  let speed = 1;
  let last = 0;
  let gameOver = false;
  let selectedTower = null;

  function fitCanvas() {
    const r = canvasbox.getBoundingClientRect();
    const scale = Math.min(r.width / W, r.height / H);
    canvas.style.width = `${W * scale}px`;
    canvas.style.height = `${H * scale}px`;
  }
  new ResizeObserver(fitCanvas).observe(canvasbox);
  fitCanvas();

  function notify(text) {
    const toast = document.getElementById('toast');
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => toast.classList.remove('show'), 1900);
  }

  function softBonus(value) {
    if (value <= 1) return value;
    return 1 + (SOFT_BONUS_CAP - 1) * (1 - Math.exp(-(value - 1) / (SOFT_BONUS_CAP - 1)));
  }

  function linkStats(tower) {
    const stats = { range: 0, cast: 0, attack: 0, direct: 0, dot: 0, debuff: 0, penetration: 0, arrows: 0, summonCap: 0, effects: {} };
    const seen = {};
    for (const id of tower.links) {
      const support = supports[id];
      if (!support) continue;
      seen[id] = (seen[id] || 0) + 1;
      const stack = seen[id] === 2 ? 1.35 : 1;
      const modifiers = support.stats || (support.stat ? { [support.stat]: support.value } : {});
      for (const [stat, value] of Object.entries(modifiers)) stats[stat] = (stats[stat] || 0) + value * stack;
      if (support.arrows) stats.arrows += support.arrows * stack;
      if (support.summonCap) stats.summonCap += support.summonCap;
      if (support.effect) stats.effects[support.effect] = (stats.effects[support.effect] || 0) + support.value * stack;
    }
    return stats;
  }

  function towerRange(tower) {
    return tower.range * (1 + softBonus(linkStats(tower).range));
  }

  function auraBonuses(tower) {
    const inRange = placed
      .filter(a => a.kind === 'aura' && a !== tower && distance(a, tower) <= towerRange(a))
      .map(a => {
        const range = towerRange(a);
        return { power: 1 - 0.45 * distance(a, tower) / range };
      })
      .sort((a, b) => b.power - a.power)
      .slice(0, AURA_CAP);
    const scale = inRange.reduce((sum, aura) => sum + aura.power, 0);
    return {
      range: scale * 0.12,
      cast: scale * 0.12,
      attack: scale * 0.12,
      direct: scale * 0.12,
      dot: scale * 0.12,
      debuff: scale * 0.12
    };
  }

  function statsFor(tower) {
    const links = linkStats(tower);
    const aura = tower.category === 'support' ? { range: 0, cast: 0, attack: 0, direct: 0, dot: 0, debuff: 0 } : auraBonuses(tower);
    const merge = stat => softBonus(links[stat] + aura[stat]);
    return {
      range: tower.range * Math.max(0.3, 1 + merge('range')),
      cast: merge('cast'),
      attack: merge('attack'),
      direct: merge('direct'),
      dot: merge('dot'),
      debuff: merge('debuff'),
      penetration: Math.min(0.8, links.penetration),
      arrows: links.arrows,
      summonCap: links.summonCap,
      effects: links.effects
    };
  }

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function refreshLinks() {
    const sockets = document.getElementById('sockets');
    const activeLinks = selectedTower ? selectedTower.links : buildLinks;
    sockets.innerHTML = '';
    for (let i = 0; i < 4; i++) {
      const button = document.createElement('button');
      button.className = `socket${activeLinks[i] ? ' filled' : ''}`;
      button.title = activeLinks[i] ? `移除 ${supports[activeLinks[i]].name}` : `链接槽 ${i + 1}`;
      button.textContent = activeLinks[i] ? supports[activeLinks[i]].icon : '+';
      button.disabled = !activeLinks[i];
      button.onclick = () => {
        activeLinks.splice(i, 1);
        refreshLinks();
        updateSelection();
      };
      sockets.appendChild(button);
    }
    document.querySelectorAll('.support').forEach(button => {
      button.classList.toggle('on', activeLinks.includes(button.dataset.id));
      button.disabled = false;
    });
    document.getElementById('loadout').textContent = activeLinks.length
      ? `${selectedTower ? '该塔链接' : '新建塔配置'}：${activeLinks.map(id => supports[id].name).join(' + ')}`
      : selectedTower ? '该塔没有链接辅助石' : '未设置新建塔辅助石';
  }

  function updateSelection() {
    const info = document.getElementById('selectedInfo');
    const button = document.getElementById('applyBtn');
    button.hidden = !selectedTower;
    if (!selectedTower) {
      info.textContent = `建造选择：${towers[selected].name} · ${towers[selected].cost} 碎片`;
      button.disabled = true;
      refreshLinks();
      return;
    }
    const type = towers[selectedTower.type];
    const stats = statsFor(selectedTower);
    info.textContent = `${type.icon} ${type.name} · ${type.category === 'support' ? '辅助塔' : `范围 ${Math.round(stats.range)} · 链接：${selectedTower.links.map(id => supports[id].name).join('、') || '无'}`}`;
    button.disabled = false;
    refreshLinks();
  }

  function setTowerCategory(category) {
    activeTowerCategory = category;
    const firstTower = Object.entries(towers).find(([, tower]) => tower.category === category);
    if (firstTower) selected = firstTower[0];
    document.querySelectorAll('#towerTabs .tab').forEach(tab => {
      const active = tab.dataset.category === category;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-pressed', String(active));
    });
    document.querySelectorAll('.skill').forEach(button => {
      button.hidden = button.dataset.category !== category;
      button.classList.toggle('active', button.dataset.id === selected);
    });
    updateSelection();
  }

  function setSupportGroup(group) {
    activeSupportGroup = group;
    document.querySelectorAll('#supportTabs .tab').forEach(tab => {
      const active = tab.dataset.supportGroup === group;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-pressed', String(active));
    });
    document.querySelectorAll('.support').forEach(button => {
      button.hidden = button.dataset.group !== group;
    });
  }

  const supportGroups = {
    reach: 'range', echo: 'range',
    cast: 'frequency', summon: 'frequency', attack: 'frequency', multishot: 'frequency',
    might: 'damage', pierce: 'damage', dot: 'damage',
    poison: 'debuff', fracture: 'debuff', chill: 'debuff', root: 'debuff', expose: 'debuff', burn: 'debuff',
    fireSeed: 'element', iceSeed: 'element', lightningSeed: 'element'
  };

  const elementTab = document.createElement('button');
  elementTab.className = 'tab';
  elementTab.dataset.supportGroup = 'element';
  elementTab.setAttribute('aria-pressed', 'false');
  elementTab.textContent = '元素';
  document.getElementById('supportTabs').appendChild(elementTab);
  document.getElementById('supportTabs').style.gridTemplateColumns = 'repeat(5, minmax(0, 1fr))';

  document.querySelectorAll('#towerTabs .tab').forEach(tab => {
    tab.onclick = () => setTowerCategory(tab.dataset.category);
  });
  document.querySelectorAll('#supportTabs .tab').forEach(tab => {
    tab.onclick = () => setSupportGroup(tab.dataset.supportGroup);
  });

  Object.entries(towers).forEach(([id, tower]) => {
    const button = document.createElement('button');
    button.className = `skill${id === selected ? ' active' : ''}`;
    button.dataset.id = id;
    button.dataset.category = tower.category;
    button.hidden = tower.category !== activeTowerCategory;
    button.innerHTML = `<strong>${tower.icon} ${tower.name}</strong><small>${tower.cost} 碎片 · ${tower.desc}</small>`;
    button.onclick = () => {
      selected = id;
      document.querySelectorAll('.skill').forEach(item => item.classList.toggle('active', item === button));
      updateSelection();
    };
    document.getElementById('skills').appendChild(button);
  });

  Object.entries(supports).forEach(([id, support]) => {
    const button = document.createElement('button');
    button.className = 'support';
    button.dataset.id = id;
    button.dataset.group = supportGroups[id];
    button.hidden = supportGroups[id] !== activeSupportGroup;
    button.title = support.desc;
    button.textContent = `${support.icon} ${support.name}`;
    button.onclick = () => {
      const links = selectedTower ? selectedTower.links : buildLinks;
      if (links.length >= 4) {
        notify('链接槽最多 4 颗辅助石');
        return;
      } else if (links.filter(link => link === id).length >= 2) {
        notify('同名辅助石最多链接 2 颗');
        return;
      } else {
        links.push(id);
      }
      refreshLinks();
      updateSelection();
    };
    document.getElementById('supports').appendChild(button);
  });

  function updateUI() {
    document.getElementById('gold').textContent = gold;
    document.getElementById('life').textContent = life;
    document.getElementById('wave').textContent = wave;
    document.getElementById('kills').textContent = kills;
    document.getElementById('waveInfo').textContent = active
      ? `敌群来袭：剩余 ${spawnLeft} 个待出发，场上 ${enemies.filter(e => !e.dead).length} 个`
      : '布置防御后，按空格或点击按钮开始下一波。';
  }

  function onRoute(x, y) {
    for (let i = 0; i < route.length - 1; i++) {
      const [ax, ay] = route[i];
      const [bx, by] = route[i + 1];
      const dx = bx - ax;
      const dy = by - ay;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
      if (Math.hypot(x - ax - t * dx, y - ay - t * dy) < 26) return true;
    }
    return false;
  }

  function pos(event) {
    const r = canvas.getBoundingClientRect();
    return { x: (event.clientX - r.left) * W / r.width, y: (event.clientY - r.top) * H / r.height };
  }

  canvas.addEventListener('click', event => {
    if (gameOver) return;
    const p = pos(event);
    const tower = placed.find(item => distance(item, p) < 23);
    if (tower) {
      selectedTower = tower;
      updateSelection();
      return;
    }
    selectedTower = null;
    updateSelection();
    const x = Math.floor(p.x / C) * C + C / 2;
    const y = Math.floor(p.y / C) * C + C / 2;
    if (x < 24 || x > W - 24 || y < 24 || y > H - 24) return;
    if (onRoute(x, y)) return notify('不能在敌人路线上建塔');
    if (placed.some(item => distance(item, { x, y }) < C * 0.8)) return notify('建造位置太近');
    const type = towers[selected];
    if (gold < type.cost) return notify('碎片不足');
    gold -= type.cost;
    const links = [...buildLinks];
    placed.push({ x, y, type: selected, category: type.category, kind: type.kind, range: type.range, links, cool: Math.random() * 0.25, flash: 0, minions: [] });
    updateSelection();
    updateUI();
  });

  canvas.addEventListener('contextmenu', event => {
    event.preventDefault();
    const p = pos(event);
    const index = placed.findIndex(tower => distance(tower, p) < 25);
    if (index < 0) return;
    const tower = placed[index];
    if (tower === selectedTower) selectedTower = null;
    gold += Math.floor(towers[tower.type].cost * 0.6);
    placed.splice(index, 1);
    updateSelection();
    updateUI();
    notify('已拆除防御塔，返还 60% 碎片');
  });

  document.getElementById('applyBtn').onclick = () => {
    if (!selectedTower) return;
    const type = towers[selected];
    if (type.cost > gold) return notify(`碎片不足，更换需要 ${type.cost} 碎片`);
    gold -= type.cost;
    selectedTower.type = selected;
    selectedTower.category = type.category;
    selectedTower.kind = type.kind;
    selectedTower.range = type.range || 0;
    selectedTower.links = [...buildLinks];
    selectedTower.cool = 0;
    selectedTower.minions = [];
    updateSelection();
    updateUI();
    notify(`已替换为${type.name}`);
  };

  function spawn() {
    const baseHp = 90 * (wave - 1) + 26 * Math.pow(wave - 1, 1.6);
    const elite = (spawnLeft % 7 === 0);
    const hp = Math.max(90, baseHp) * (elite ? 1.8 : 1);
    enemies.push({
      x: route[0][0], y: route[0][1], segment: 0, progress: 0, hp, maxHp: hp,
      def: 14 + 4.2 * wave, speed: (0.07 + Math.min(wave * 0.003, 0.09)) * C,
      slow: 0, root: 0, freeze: 0, shock: 0, shockDamage: 0, igniteStacks: [],
      vulnerability: 0, vulnerabilityTime: 0, armorBreak: 0, armorBreakTime: 0, burn: 0, poison: 0,
      burnPower: 1, poisonPower: 1, dead: false, elite
    });
    spawnLeft--;
    spawnedInBatch++;
    spawnTimer = spawnLeft > 0 && spawnedInBatch % 3 === 0 ? 1.6 : 0.72;
  }

  function defeat(enemy) {
    if (enemy.dead) return;
    enemy.dead = true;
    kills++;
    const reward = enemy.elite ? 18 : 6;
    gold += reward;
    for (let i = 0; i < 7; i++) particles.push({ x: enemy.x, y: enemy.y, vx: (Math.random() - 0.5) * 95, vy: (Math.random() - 0.5) * 95, life: 0.45, color: enemy.elite ? '#f0d26c' : '#ffad72' });
  }

  function damage(raw, enemy, options = {}) {
    if (enemy.dead || raw <= 0) return 0;
    if (options.alreadyMitigated) {
      const vulnerability = Math.max(0, enemy.vulnerability + (enemy.freeze > 0 ? 0.1 : 0) + (options.vulnerability || 0));
      const actual = raw * (1 + vulnerability);
      enemy.hp -= actual;
      if (enemy.hp <= 0) defeat(enemy);
      return actual;
    }
    const penetration = Math.min(0.8, (options.penetration || 0) + (enemy.armorBreak || 0));
    const vulnerability = Math.max(0, enemy.vulnerability + (enemy.freeze > 0 ? 0.1 : 0) + (options.vulnerability || 0));
    const K = 90 + 6 * wave;
    const actual = raw * (1 + vulnerability) * K / (K + enemy.def * (1 - penetration));
    enemy.hp -= actual;
    if (enemy.hp <= 0) defeat(enemy);
    return actual;
  }

  function applyDebuff(enemy, effect, strength, towerStats) {
    const power = softBonus(strength + (towerStats.debuff || 0));
    if (effect === 'slow') enemy.slow = Math.max(enemy.slow, 1.2 * power);
    if (effect === 'root') enemy.root = Math.max(enemy.root, 0.55 * power);
    if (effect === 'vulnerability') enemy.vulnerability = Math.max(enemy.vulnerability, 0.2 * power);
    if (effect === 'armorBreak') enemy.armorBreak = Math.max(enemy.armorBreak, 0.2 * power);
    if (effect === 'burn') {
      enemy.burn = Math.max(enemy.burn, 2.4 * power);
      enemy.burnPower = Math.max(enemy.burnPower || 0, 1 + (towerStats.dot || 0));
    }
    if (effect === 'poison') {
      enemy.poison = Math.max(enemy.poison, 3 * power);
      enemy.vulnerability = Math.max(enemy.vulnerability, 0.15 * power);
      enemy.poisonPower = Math.max(enemy.poisonPower || 0, 1 + (towerStats.dot || 0));
    }
    if (effect === 'iceSeed') enemy.freeze = Math.max(enemy.freeze, 3);
    if (effect === 'lightningSeed') {
      enemy.shock = Math.max(enemy.shock, 3);
    }
    if (effect === 'vulnerability' || effect === 'poison') {
      enemy.vulnerabilityTime = Math.max(enemy.vulnerabilityTime || 0, 1.5 * power);
    }
    if (effect === 'armorBreak') enemy.armorBreakTime = Math.max(enemy.armorBreakTime || 0, 1.5 * power);
  }

  function makeArc(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy);
    const nx = -dy / (length || 1);
    const ny = dx / (length || 1);
    const points = [{ x: x1, y: y1 }];
    for (let i = 1; i < 8; i++) {
      const f = i / 8;
      const jitter = (Math.random() - 0.5) * Math.min(34, length * 0.16);
      points.push({ x: x1 + dx * f + nx * jitter, y: y1 + dy * f + ny * jitter });
    }
    points.push({ x: x2, y: y2 });
    return { points, life: 0.19, maxLife: 0.19 };
  }

  function triggerShock(enemy) {
    if (enemy.dead || enemy.shock <= 0 || enemy.shockDamage <= 0) return;
    const hitList = [enemy];
    let lastHit = enemy;
    for (let i = 0; i < 3; i++) {
      const next = enemies.filter(candidate => !candidate.dead && !hitList.includes(candidate) && distance(candidate, lastHit) < 92)
        .sort((a, b) => distance(a, lastHit) - distance(b, lastHit))[0];
      if (!next) break;
      damage(enemy.shockDamage * 0.5, next, { alreadyMitigated: true });
      arcs.push(makeArc(lastHit.x, lastHit.y, next.x, next.y));
      hitList.push(next);
      lastHit = next;
    }
  }

  function applyHitEffects(enemy, hitDamage, effects, towerStats) {
    if (enemy.dead) return;
    for (const [effect, strength] of Object.entries(effects)) {
      if (effect === 'fireSeed') {
        const chance = 1 - Math.pow(0.5, strength);
        if (Math.random() < chance) {
          const stacks = enemy.igniteStacks;
          const ignite = { time: 3, damage: hitDamage * 0.2 * Math.max(0, 1 + (towerStats.dot || 0)) };
          if (stacks.length < 5) stacks.push(ignite);
          else {
            const oldest = stacks.reduce((earliest, stack, index) => stack.time < stacks[earliest].time ? index : earliest, 0);
            stacks[oldest] = ignite;
          }
        }
      } else if (effect === 'iceSeed' || effect === 'lightningSeed') {
        if (Math.random() < 1 - Math.pow(0.5, strength)) {
          applyDebuff(enemy, effect, strength, towerStats);
          if (effect === 'lightningSeed') enemy.shockDamage = hitDamage;
        }
      } else {
        applyDebuff(enemy, effect, strength, towerStats);
      }
    }
  }

  function hitEnemy(enemy, raw, options, effects, towerStats) {
    if (enemy.shock > 0) triggerShock(enemy);
    const hitDamage = damage(raw, enemy, options);
    applyHitEffects(enemy, hitDamage, effects, { ...towerStats, hitDamage });
    return hitDamage;
  }

  function fire(tower, target, stats) {
    const type = towers[tower.type];
    if (type.category === 'support') return;
    const frequency = type.category === 'arch' ? stats.attack : stats.cast;
    tower.cool = type.rate / (1 + frequency);
    tower.flash = 0.17;
    const raw = type.damage * (1 + stats.direct);
    const debuffs = stats.effects;

    if (type.kind === 'summonPhysical' || type.kind === 'summonMagic') {
      const max = 3 + stats.summonCap;
      if (tower.minions.length < max) {
        tower.minions.push({ x: tower.x, y: tower.y, target, cool: 0, kind: type.kind });
      }
      return;
    }
    if (type.kind === 'chain') {
      let hitList = [target];
      let lastHit = target;
      for (let i = 0; i < 3; i++) {
        const next = enemies.filter(enemy => !enemy.dead && !hitList.includes(enemy) && distance(enemy, lastHit) < 92)
          .sort((a, b) => distance(a, lastHit) - distance(b, lastHit))[0];
        if (!next) break;
        hitList.push(next);
        lastHit = next;
      }
      let from = { x: tower.x, y: tower.y };
      for (const enemy of hitList) {
        hitEnemy(enemy, raw, { penetration: stats.penetration }, debuffs, stats);
        arcs.push(makeArc(from.x, from.y, enemy.x, enemy.y));
        from = enemy;
      }
      return;
    }

    const count = type.category === 'arch' ? 1 + Math.floor(stats.arrows) : 1;
    const nearby = enemies.filter(enemy => !enemy.dead && distance(enemy, tower) <= stats.range)
      .sort((a, b) => (b.segment + b.progress) - (a.segment + a.progress));
    const dx = target.x - tower.x;
    const dy = target.y - tower.y;
    const length = Math.hypot(dx, dy) || 1;
    const perp = { x: -dy / length, y: dx / length };
    for (let i = 0; i < count; i++) {
      const aim = type.category === 'arch' ? (nearby[i] || target) : target;
      projectiles.push({
        x: tower.x + perp.x * (i - (count - 1) / 2) * 9, y: tower.y + perp.y * (i - (count - 1) / 2) * 9,
        target: aim, damage: raw, penetration: stats.penetration, color: type.color, kind: type.kind,
        slow: type.kind === 'slow' ? 1.2 * (1 + stats.debuff) : 0, splash: type.kind === 'splash' ? 43 : 0,
        effects: debuffs, debuffStrength: stats.debuff, dotBonus: stats.dot, speed: 330
      });
    }
  }

  function applyAuras(dt) {
    const auraTowers = placed.filter(tower => tower.kind === 'poisonAura' || tower.kind === 'frostAura');
    for (const enemy of enemies) {
      if (enemy.dead) continue;
      const effects = auraTowers
        .filter(aura => distance(aura, enemy) <= towerRange(aura))
        .map(aura => {
          const range = towerRange(aura);
          return { tower: aura, strength: 1 - 0.45 * distance(aura, enemy) / range };
        })
        .sort((a, b) => b.strength - a.strength)
        .slice(0, AURA_CAP);
      for (const item of effects) {
        const effect = item.tower.kind === 'poisonAura' ? 'poison' : 'slow';
        const stats = statsFor(item.tower);
        applyDebuff(enemy, effect, item.strength * 0.35, stats);
      }
    }
  }

  function waveTotal() {
    return 8 + Math.max(0, wave - 1) * 3;
  }

  function update(dt) {
    if (gameOver) return;
    dt = Math.min(dt, 0.05) * speed;
    if (active) {
      spawnTimer -= dt;
      if (spawnLeft > 0 && spawnTimer <= 0) spawn();
      if (spawnLeft === 0 && enemies.every(enemy => enemy.dead)) {
        active = false;
        const reward = 32 + 9 * wave;
        gold += reward;
        notify(`第 ${wave} 波完成！奖励 ${reward} 碎片`);
        updateUI();
      }
    }

    applyAuras(dt);
    for (const enemy of enemies) {
      if (enemy.dead) continue;
      if (enemy.slow > 0) enemy.slow -= dt;
      if (enemy.root > 0) enemy.root -= dt;
      if (enemy.freeze > 0) enemy.freeze -= dt;
      if (enemy.shock > 0) enemy.shock -= dt;
      if (enemy.vulnerabilityTime > 0) {
        enemy.vulnerabilityTime -= dt;
        if (enemy.vulnerabilityTime <= 0) enemy.vulnerability = 0;
      }
      if (enemy.armorBreakTime > 0) {
        enemy.armorBreakTime -= dt;
        if (enemy.armorBreakTime <= 0) enemy.armorBreak = 0;
      }
      if (enemy.burn > 0) {
        enemy.burn -= dt;
        damage(7 * dt * enemy.burnPower, enemy);
      }
      if (enemy.poison > 0) {
        enemy.poison -= dt;
        damage(5 * dt * enemy.poisonPower, enemy);
      }
      for (const ignite of enemy.igniteStacks) {
        const tick = Math.min(dt, ignite.time);
        if (tick > 0) damage(ignite.damage * tick, enemy, { alreadyMitigated: true });
        ignite.time -= dt;
      }
      enemy.igniteStacks = enemy.igniteStacks.filter(ignite => ignite.time > 0);
      if (enemy.dead) continue;
      if (enemy.root > 0 || enemy.freeze > 0) continue;
      const [ax, ay] = route[enemy.segment];
      const [bx, by] = route[enemy.segment + 1];
      const length = Math.hypot(bx - ax, by - ay);
      enemy.progress += enemy.speed * (enemy.slow > 0 ? 0.55 : 1) * dt / length;
      enemy.x = ax + (bx - ax) * enemy.progress;
      enemy.y = ay + (by - ay) * enemy.progress;
      if (enemy.progress >= 1) {
        enemy.segment++;
        enemy.progress = 0;
        if (enemy.segment >= route.length - 1) {
          enemy.dead = true;
          life--;
          if (life <= 0) {
            gameOver = true;
            notify('灯塔已陷落！点击重新开始');
            document.getElementById('waveBtn').textContent = '↻ 重新开始';
          }
        }
      }
    }

    for (const tower of placed) {
      const type = towers[tower.type];
      const stats = statsFor(tower);
      if (type.category === 'support') continue;
      tower.cool -= dt;
      tower.flash = Math.max(0, tower.flash - dt);
      if (type.kind === 'summonPhysical' || type.kind === 'summonMagic') {
        tower.minions = tower.minions.filter(minion => !minion.dead);
        const minionRate = type.kind === 'summonPhysical' ? stats.attack : stats.cast;
        for (const minion of tower.minions) {
          minion.cool -= dt;
          if (!minion.target || minion.target.dead) {
            minion.target = enemies.filter(enemy => !enemy.dead && distance(enemy, tower) < stats.range + 60)
              .sort((a, b) => (b.segment + b.progress) - (a.segment + a.progress))[0];
          }
          if (minion.target && !minion.target.dead) {
            const dx = minion.target.x - minion.x;
            const dy = minion.target.y - minion.y;
            const d = Math.hypot(dx, dy);
            if (d > 17) {
              minion.x += dx / d * 105 * dt;
              minion.y += dy / d * 105 * dt;
            } else if (minion.cool <= 0) {
              hitEnemy(minion.target, type.damage * (1 + stats.direct), { penetration: stats.penetration }, stats.effects, stats);
              minion.cool = 0.55 / (1 + minionRate);
            }
          }
        }
        if (tower.minions.length < 3 + stats.summonCap && tower.cool <= 0) {
          const target = enemies.filter(enemy => !enemy.dead && distance(enemy, tower) < stats.range)
            .sort((a, b) => (b.segment + b.progress) - (a.segment + a.progress))[0];
          if (target) {
            tower.minions.push({ x: tower.x, y: tower.y, target, cool: 0, kind: type.kind });
            tower.cool = type.rate / (1 + stats.cast);
          }
        }
        continue;
      }
      if (tower.cool <= 0) {
        const target = enemies.filter(enemy => !enemy.dead && distance(enemy, tower) < stats.range)
          .sort((a, b) => (b.segment + b.progress) - (a.segment + a.progress))[0];
        if (target) fire(tower, target, stats);
      }
    }

    for (const projectile of projectiles) {
      if (projectile.dead || !projectile.target || projectile.target.dead) {
        projectile.dead = true;
        continue;
      }
      const dx = projectile.target.x - projectile.x;
      const dy = projectile.target.y - projectile.y;
      const length = Math.hypot(dx, dy);
      const step = projectile.speed * dt;
      if (length <= step) {
        const hit = projectile.target;
        hitEnemy(hit, projectile.damage, { penetration: projectile.penetration }, projectile.effects, { debuff: projectile.debuffStrength, dot: projectile.dotBonus });
        if (projectile.slow) hit.slow = Math.max(hit.slow, projectile.slow);
        if (projectile.kind === 'splash') {
          for (const enemy of enemies) {
            if (!enemy.dead && enemy !== hit && distance(enemy, hit) < projectile.splash) {
              hitEnemy(enemy, projectile.damage * 0.6, { penetration: projectile.penetration }, projectile.effects, { debuff: projectile.debuffStrength, dot: projectile.dotBonus });
            }
          }
        }
        if (projectile.kind === 'splash' && !projectile.effects.burn) {
          applyDebuff(hit, 'burn', 0.25, { debuff: 0, dot: projectile.dotBonus });
        }
        projectile.dead = true;
        particles.push({ x: hit.x, y: hit.y, vx: 0, vy: 0, life: 0.24, color: projectile.color, ring: true });
      } else {
        projectile.x += dx / length * step;
        projectile.y += dy / length * step;
      }
    }
    projectiles = projectiles.filter(projectile => !projectile.dead);
    for (const particle of particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.life -= dt;
    }
    particles = particles.filter(particle => particle.life > 0);
    for (const arc of arcs) arc.life -= dt;
    arcs = arcs.filter(arc => arc.life > 0);
    enemies = enemies.filter(enemy => !enemy.dead || enemy.hp <= 0);
    document.getElementById('progress').style.width = active ? `${100 * (waveTotal() - spawnLeft) / waveTotal()}%` : '0%';
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#151d22';
    ctx.fillRect(0, 0, W, H);
    for (let y = 0; y < 11; y++) {
      for (let x = 0; x < 20; x++) {
        ctx.fillStyle = (x + y) % 2 ? '#1a2429' : '#1c272c';
        ctx.fillRect(x * C, y * C, C, C);
        ctx.strokeStyle = '#253138';
        ctx.strokeRect(x * C, y * C, C, C);
      }
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    route.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.strokeStyle = '#553e2d';
    ctx.lineWidth = 43;
    ctx.stroke();
    ctx.strokeStyle = '#806041';
    ctx.lineWidth = 34;
    ctx.stroke();
    ctx.setLineDash([9, 13]);
    ctx.strokeStyle = '#e2ba6c88';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#172735';
    ctx.beginPath();
    ctx.arc(906, 312, 29, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#72d9df';
    ctx.stroke();
    ctx.fillStyle = '#b9ffff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✧', 906, 320);

    for (const tower of placed) {
      const type = towers[tower.type];
      const isAura = type.category === 'support';
      const range = statsFor(tower).range;
      if (isAura || tower === selectedTower) {
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, range, 0, Math.PI * 2);
        ctx.fillStyle = `${type.color}0c`;
        ctx.fill();
        ctx.strokeStyle = `${type.color}33`;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, 20, 0, Math.PI * 2);
      ctx.fillStyle = '#18232a';
      ctx.fill();
      ctx.strokeStyle = tower === selectedTower ? '#fff' : tower.flash > 0 ? '#fff' : type.color;
      ctx.lineWidth = tower === selectedTower ? 4 : 2;
      ctx.stroke();
      ctx.fillStyle = type.color;
      ctx.font = '20px sans-serif';
      ctx.fillText(type.icon, tower.x, tower.y + 7);
      tower.links.forEach((id, i) => {
        ctx.beginPath();
        ctx.arc(tower.x - 10 + i * 7, tower.y + 25, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#14232b';
        ctx.fill();
        ctx.strokeStyle = '#73d8df';
        ctx.stroke();
        ctx.fillStyle = '#a7f3ef';
        ctx.font = '8px sans-serif';
        ctx.fillText(supports[id].icon, tower.x - 10 + i * 7, tower.y + 28);
      });
      for (const minion of tower.minions) {
        ctx.beginPath();
        ctx.arc(minion.x, minion.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#ffe27a';
        ctx.fill();
        ctx.strokeStyle = '#fff4bf';
        ctx.stroke();
      }
    }
    for (const enemy of enemies) {
      if (enemy.dead) continue;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.elite ? 14 : 12, 0, Math.PI * 2);
      ctx.fillStyle = enemy.freeze > 0 ? '#a4f3ff' : enemy.shock > 0 ? '#d6a5ff' : enemy.burn > 0 || enemy.igniteStacks.length ? '#ff8b57' : enemy.poison > 0 ? '#8cdb77' : enemy.slow > 0 ? '#91e8eb' : '#d7825b';
      ctx.fill();
      ctx.strokeStyle = enemy.elite ? '#f0d26c' : '#ffd2aa';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#481f20';
      ctx.fillRect(enemy.x - 13, enemy.y - 20, 26, 4);
      ctx.fillStyle = '#ed6b64';
      ctx.fillRect(enemy.x - 13, enemy.y - 20, 26 * Math.max(0, enemy.hp / enemy.maxHp), 4);
    }
    for (const projectile of projectiles) {
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, projectile.kind === 'splash' ? 5 : 4, 0, Math.PI * 2);
      ctx.fillStyle = projectile.color;
      ctx.shadowColor = projectile.color;
      ctx.shadowBlur = 9;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    for (const arc of arcs) {
      ctx.globalAlpha = Math.min(1, arc.life / arc.maxLife);
      ctx.shadowColor = '#ad75ff';
      ctx.shadowBlur = 18;
      ctx.strokeStyle = '#a96cff';
      ctx.lineWidth = 7;
      ctx.beginPath();
      arc.points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
    for (const particle of particles) {
      ctx.globalAlpha = Math.max(0, particle.life * 2);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.ring ? 5 : 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (gameOver) {
      ctx.fillStyle = '#090c11bb';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f0c77a';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText('灯塔陷落', W / 2, H / 2);
    }
  }

  document.getElementById('waveBtn').onclick = () => {
    if (gameOver) {
      gold = 150; life = 20; wave = 0; kills = 0; placed = []; enemies = []; projectiles = []; particles = []; arcs = [];
      active = false; gameOver = false; selectedTower = null; updateUI(); updateSelection();
      document.getElementById('waveBtn').textContent = '▶ 开始第 1 波';
      notify('新的远征开始！');
      return;
    }
    if (active) return;
    wave++;
    spawnLeft = waveTotal();
    spawnedInBatch = 0;
    spawnTimer = 0;
    active = true;
    document.getElementById('waveBtn').textContent = `⚔ 第 ${wave} 波进行中`;
    updateUI();
  };
  document.getElementById('speedBtn').onclick = event => {
    speed = speed === 1 ? 2 : 1;
    event.currentTarget.textContent = `⏩ ${speed}×`;
  };
  window.addEventListener('keydown', event => {
    if (event.code === 'Space' && !event.target.matches('input,textarea,button')) {
      event.preventDefault();
      if (!active && !gameOver) document.getElementById('waveBtn').click();
    }
  });
  function frame(time) {
    const dt = (time - last) / 1000 || 0;
    last = time;
    update(dt);
    draw();
    if (active) updateUI();
    if (!gameOver && !active && wave > 0) document.getElementById('waveBtn').textContent = `▶ 开始第 ${wave + 1} 波`;
    requestAnimationFrame(frame);
  }
  updateUI();
  updateSelection();
  setTowerCategory(activeTowerCategory);
  setSupportGroup(activeSupportGroup);
  requestAnimationFrame(frame);
})();
