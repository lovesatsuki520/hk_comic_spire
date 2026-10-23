// ==========================================================================
// 模組七：港漫介面渲染與互動控制器 (js/ui.js)
// 維護說明：負責繪製選角畫面、戰鬥分鏡、卡牌外框、營火升級視窗與武林圖鑑
// ==========================================================================

const UIState = {
  modal: null, // null | 'deck' | 'upgrade' | 'compendium'
  advanceAfterUpgrade: false
};

function showComicSplash(text) {
  const existing = document.getElementById('comic-fx-container');
  if (existing) existing.remove();

  const div = document.createElement('div');
  div.id = 'comic-fx-container';
  div.className = 'comic-fx-banner';
  div.innerHTML = `<div class="comic-fx-main">${text}</div>`;
  document.body.appendChild(div);
  setTimeout(() => {
    if (div.parentNode) div.remove();
  }, 1150);
}

function triggerEnemyShake() {
  const box = document.getElementById('enemy-stage-box');
  if (box) {
    box.classList.remove('shake-anim');
    void box.offsetWidth;
    box.classList.add('shake-anim');
  }
}

function openDeckModal() {
  UIState.modal = 'deck';
  renderApp();
}

function openCompendiumModal() {
  UIState.modal = 'compendium';
  renderApp();
}

function openUpgradeModal(advanceOnPick = false) {
  UIState.modal = 'upgrade';
  UIState.advanceAfterUpgrade = advanceOnPick;
  renderApp();
}

function closeModal() {
  UIState.modal = null;
  renderApp();
}

function upgradeDeckCard(uid) {
  const target = GameState.deck.find(c => c.uid === uid);
  if (target && !target.upgraded) {
    target.upgraded = true;
    SoundFX.play('upgrade');
    const tpl = CARD_DB[target.id];
    showComicSplash(`★3 極意突破！【${tpl.upName}】`);
  }
  const shouldAdvance = UIState.advanceAfterUpgrade;
  UIState.modal = null;
  UIState.advanceAfterUpgrade = false;
  if (shouldAdvance) {
    advanceToNextFloor();
  } else {
    renderApp();
  }
}

function restHealAction() {
  SoundFX.play('power');
  const gain = Math.floor(GameState.maxHp * 0.35);
  GameState.hp = Math.min(GameState.maxHp, GameState.hp + gain);
  showComicSplash(`🍵 靈泉調息 +${gain} 氣血！`);
  advanceToNextFloor();
}

function restGetFusedOrRelicAction() {
  SoundFX.play('power');
  grantRandomRelic();
  if (!GameState.deck.some(c => c.id === 'fused_andy_opp') && GameState.floorIndex === 6) {
    GameState.deck.push(createCardInstance('fused_andy_opp', false));
    showComicSplash('☯️ 決戰前夕・習得大和解神卡！');
  } else {
    showComicSplash('🎁 獲得傳世海克斯法寶！');
  }
  if (GameState.pendingLettuceUpgrade) {
    GameState.pendingLettuceUpgrade = false;
    openUpgradeModal(true);
    return;
  }
  advanceToNextFloor();
}

// 渲染單張港漫武學卡牌 HTML
function renderCardHTML(cardInst, indexInHand = null, clickHandlerStr = '') {
  const tpl = CARD_DB[cardInst.id];
  if (!tpl) return '';
  const isUp = Boolean(cardInst.upgraded);
  const name = isUp ? tpl.upName : tpl.name;
  const desc = isUp ? tpl.upDesc : tpl.desc;
  const eff = isUp ? tpl.upEffects : tpl.effects;

  // 若在戰鬥手牌中，動態計算加成後的實際傷害預覽
  let dynamicDesc = desc;
  if (GameState.screen === 'combat' && (eff.dmg || eff.pierceDmg)) {
    const base = eff.pierceDmg || eff.dmg;
    const calc = calcAttackDamage(base);
    if (calc !== base) {
      dynamicDesc += ` <span class="text-red-700 font-black">(實傷:${calc}${eff.hits ? 'x' + eff.hits : ''})</span>`;
    }
  }

  const typeLabelMap = {
    attack: '攻擊武學',
    skill: '奇門技能',
    power: '鎮派心法',
    fused: '傳說合體'
  };

  const canPlay = indexInHand === null || GameState.energy >= tpl.cost;

  return `
    <div class="hk-card type-${tpl.type} ${isUp ? 'upgraded' : ''} ${!canPlay ? 'unplayable' : ''}"
         ${clickHandlerStr}>
      <div class="card-cost-badge">${tpl.cost}</div>
      <div class="flex items-center justify-between pl-6 mb-1">
        <span class="card-type-pill">${typeLabelMap[tpl.type] || '武學'}</span>
        ${isUp ? '<span class="text-[10px] font-black bg-amber-400 text-black px-1.5 border border-black">★3極意</span>' : ''}
      </div>
      <div class="font-black text-xs text-center leading-tight text-black border-b-2 border-black pb-1">
        ${name}
      </div>
      <div class="card-art-box">
        <span>${tpl.icon}</span>
      </div>
      <div class="card-desc-box">
        <div>${dynamicDesc}</div>
      </div>
      <div class="text-[10px] font-bold text-stone-600 text-right mt-1 truncate">
        ${tpl.category}
      </div>
    </div>
  `;
}

// 渲染頂部狀態列與港漫旁白框
function renderHeaderBar() {
  const floorNum = Math.min(GameState.floorIndex + 1, TOWER_FLOORS.length);
  const floorTitle = TOWER_FLOORS[GameState.floorIndex]?.title || '港漫武林尖塔';

  return `
    <header class="w-full max-w-6xl mx-auto px-3 pt-3">
      <div class="comic-panel p-2.5 flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-3">
          <span class="text-2xl">🐉</span>
          <div>
            <div class="hk-title-text text-lg sm:text-xl leading-none">《港漫尖塔：群俠武神傳》</div>
            <div class="text-xs text-amber-300 font-bold mt-0.5">
              ${GameState.screen === 'title' ? '四大代表主角・十大心法・八重魔宮' : `第 ${floorNum}/8 層｜${floorTitle}`}
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          ${GameState.hero ? `
            <div class="bg-black/80 border-2 border-amber-400 px-2.5 py-1 text-xs font-black flex items-center gap-2">
              <span>${GameState.hero.icon} ${GameState.hero.name}</span>
              <span class="text-red-400">❤️ ${GameState.hp}/${GameState.maxHp}</span>
              ${GameState.petHp > 0 ? `<span class="text-cyan-300">🐾靈寵 ${GameState.petHp}</span>` : ''}
            </div>
            <button class="comic-btn text-xs py-1 px-2.5" onclick="openDeckModal()">
              📜 牌組 (${GameState.deck.length})
            </button>
          ` : ''}
          <button class="comic-btn comic-btn-dark text-xs py-1 px-2.5" onclick="openCompendiumModal()">
            📖 武林圖鑑
          </button>
          <button class="comic-btn comic-btn-dark text-xs py-1 px-2.5" onclick="toggleAudioMute()">
            ${SoundFX.muted ? '🔇 靜音' : '🔊 音效'}
          </button>
          ${GameState.screen !== 'title' ? `
            <button class="comic-btn comic-btn-red text-xs py-1 px-2.5" onclick="backToTitle()">
              🔄 重選主角
            </button>
          ` : ''}
        </div>
      </div>

      <!-- 港漫黃底黑框旁白欄 -->
      <div class="comic-narrator mt-2 px-3 py-2 flex items-center gap-2 text-xs sm:text-sm">
        <span class="comic-narrator-tag shrink-0">港漫旁白</span>
        <span class="truncate sm:whitespace-normal">${GameState.narratorText}</span>
      </div>
    </header>
  `;
}

// 1. 標題與四大主角選角畫面
function renderTitleScreen() {
  const heroCards = PLAYABLE_HEROES.map(h => `
    <div class="comic-panel p-4 flex flex-col justify-between hover:border-amber-400 transition">
      <div>
        <div class="flex items-center gap-3 border-b-2 border-amber-500/40 pb-2">
          <div class="w-14 h-14 bg-black border-2 border-amber-400 flex items-center justify-center text-3xl shrink-0">
            ${h.icon}
          </div>
          <div>
            <div class="hk-title-text text-xl">${h.name}</div>
            <div class="text-xs text-amber-300 font-bold">${h.title}</div>
          </div>
        </div>

        <div class="mt-2 text-xs italic text-yellow-200 bg-black/50 p-2 border-l-4 border-red-600">
          ${h.tagline}
        </div>

        <div class="mt-2.5 flex items-center gap-3 text-xs font-black">
          <span class="bg-red-900/80 border border-black px-2 py-0.5">❤️ 起始氣血：${h.maxHp}</span>
          <span class="bg-amber-700/80 border border-black px-2 py-0.5">⚡ 每回真氣：${h.maxEnergy}</span>
        </div>

        <div class="mt-2.5 text-xs bg-stone-900/90 border border-amber-500/30 p-2.5">
          <div class="text-amber-400 font-black mb-1">${h.passiveName}</div>
          <div class="text-stone-200 leading-relaxed">${h.passiveDesc}</div>
        </div>

        <div class="mt-2 text-[11px] text-stone-300">
          <span class="text-amber-300 font-bold">起始牌組亮點：</span>
          ${h.starterDeck.filter(c => !['strike','defend'].includes(c)).map(cid => `【${CARD_DB[cid]?.name}】`).join('、')}
        </div>
      </div>

      <button class="comic-btn w-full mt-4 py-2.5 text-sm" onclick="startNewRun('${h.id}')">
        ⚔️ 揀選【${h.name}】殺入魔宮！
      </button>
    </div>
  `).join('');

  return `
    <main class="max-w-6xl mx-auto px-3 py-4">
      <div class="comic-panel p-4 mb-4 text-center">
        <h1 class="hk-title-text text-2xl sm:text-4xl mb-2">揀選你嘅代表主角・勇闖八重深淵</h1>
        <p class="text-xs sm:text-sm text-stone-200 max-w-3xl mx-auto leading-relaxed">
          全程單人獨行闖關！原本的「10大羈絆」已全面化為可收集的<strong>鎮派心法與奇門絕技</strong>，17位群組好友化為<strong>成名絕學卡與守關堂主</strong>，直上第八層迎戰深淵魔尊<strong>【楊守正・100%中的100%】</strong>！
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${heroCards}
      </div>
    </main>
  `;
}

// 2. 戰鬥畫面
function renderCombatScreen() {
  const e = GameState.enemy;
  const heroPct = Math.max(0, Math.min(100, Math.round((GameState.hp / GameState.maxHp) * 100)));
  const enemyPct = Math.max(0, Math.min(100, Math.round((e.hp / e.maxHp) * 100)));

  // 角色狀態徽章
  const playerBadges = [];
  if (GameState.stance === 'b_ji') playerBadges.push('<span class="bg-cyan-700 border border-black px-2 py-0.5 text-xs font-black">🚗 B記・義薄雲天(+3攻/+2盾)</span>');
  if (GameState.stance === 'b_gou') playerBadges.push('<span class="bg-red-700 border border-black px-2 py-0.5 text-xs font-black">🚗 B狗・老千魔功(+6攻)</span>');
  if (GameState.muzanAwakened) playerBadges.push('<span class="bg-purple-800 border border-amber-400 px-2 py-0.5 text-xs font-black">⚡ 無慘鬼化(減傷30%+吸血)</span>');
  if (GameState.str > 0) playerBadges.push(`<span class="bg-red-800 border border-black px-2 py-0.5 text-xs font-black">💪 力量 +${GameState.str}</span>`);
  if (GameState.thorns > 0) playerBadges.push(`<span class="bg-amber-700 border border-black px-2 py-0.5 text-xs font-black">👑 父威反震 ${GameState.thorns}</span>`);
  if (GameState.powers.sisChase > 0) playerBadges.push(`<span class="bg-pink-700 border border-black px-2 py-0.5 text-xs font-black">💃 S.I.S追擊 +${GameState.powers.sisChase}</span>`);
  if (GameState.powers.threeGods > 0) playerBadges.push(`<span class="bg-indigo-700 border border-black px-2 py-0.5 text-xs font-black">🔱 三幻神(${GameState.cardsPlayedThisTurn}/3)</span>`);
  if (GameState.weak > 0) playerBadges.push(`<span class="bg-stone-700 border border-black px-2 py-0.5 text-xs font-black">💫 虛弱(${GameState.weak})</span>`);
  if (GameState.vuln > 0) playerBadges.push(`<span class="bg-orange-800 border border-black px-2 py-0.5 text-xs font-black">🩸 易傷(${GameState.vuln})</span>`);

  // 敵人狀態徽章
  const enemyBadges = [];
  if (e.phase2Triggered) enemyBadges.push('<span class="bg-red-600 border border-yellow-300 px-2 py-0.5 text-xs font-black animate-pulse">👹 100%中的100%・狂暴二階段</span>');
  if (e.str > 0) enemyBadges.push(`<span class="bg-red-800 border border-black px-2 py-0.5 text-xs font-black">💪 力量 +${e.str}</span>`);
  if (e.sisMark > 0) enemyBadges.push(`<span class="bg-pink-700 border border-black px-2 py-0.5 text-xs font-black">💃 絕情印 x${e.sisMark} (+${e.sisMark * 15}%傷)</span>`);
  if (e.vuln > 0) enemyBadges.push(`<span class="bg-orange-700 border border-black px-2 py-0.5 text-xs font-black">🩸 易傷(${e.vuln})</span>`);
  if (e.weak > 0) enemyBadges.push(`<span class="bg-stone-700 border border-black px-2 py-0.5 text-xs font-black">💫 虛弱(${e.weak})</span>`);

  const relicsHtml = GameState.relics.map(rid => {
    const r = RELIC_DB[rid];
    return r ? `<span class="bg-stone-900 border border-amber-400/70 px-2 py-0.5 text-xs font-bold" title="${r.desc}">${r.name}</span>` : '';
  }).join('');

  const handHtml = GameState.hand.map((c, idx) =>
    renderCardHTML(c, idx, `onclick="playCard(${idx})"`)
  ).join('');

  // 攀塔進度條 (1~8層)
  const towerProgressHtml = TOWER_FLOORS.map((f, i) => {
    const stateCls = i === GameState.floorIndex
      ? 'bg-amber-400 text-black font-black border-2 border-black scale-110'
      : i < GameState.floorIndex
        ? 'bg-green-800 text-white border border-black opacity-75'
        : 'bg-stone-800 text-stone-400 border border-black';
    return `<div class="px-2 py-0.5 text-[11px] ${stateCls}">${i + 1}F</div>`;
  }).join('');

  return `
    <main class="max-w-6xl mx-auto px-3 py-2 flex flex-col gap-2.5">
      <!-- 樓層進度與隨身海克斯法寶欄 -->
      <div class="comic-panel px-3 py-1.5 flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-1">
          <span class="text-xs font-black text-amber-400 mr-1">🏯 八重魔宮：</span>
          ${towerProgressHtml}
        </div>
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="text-xs font-black text-amber-400">🔮 隨身法寶：</span>
          ${relicsHtml}
        </div>
      </div>

      <!-- 主角 vs 守關強敵 港漫雙分鏡對決舞台 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <!-- 左分鏡：玩家主角 -->
        <div class="comic-panel p-3 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2.5">
                <div class="w-14 h-14 bg-black border-3 border-amber-400 flex items-center justify-center text-3xl">
                  ${GameState.hero.icon}
                </div>
                <div>
                  <div class="hk-title-text text-xl">${GameState.hero.name}</div>
                  <div class="text-xs text-amber-300 font-bold">${GameState.hero.title}</div>
                </div>
              </div>

              <!-- 護體罡氣與靈寵護盾 -->
              <div class="flex items-center gap-1.5">
                <div class="bg-sky-900 border-2 border-black px-2.5 py-1 text-center">
                  <div class="text-[10px] text-sky-200 font-bold">🛡️ 護體罡氣</div>
                  <div class="text-base font-black text-white">${GameState.block}</div>
                </div>
                ${GameState.petHp > 0 ? `
                  <div class="bg-cyan-900 border-2 border-black px-2.5 py-1 text-center">
                    <div class="text-[10px] text-cyan-200 font-bold">🐾 靈寵血條</div>
                    <div class="text-base font-black text-cyan-300">${GameState.petHp}</div>
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- 玩家氣血條 -->
            <div class="mt-2.5">
              <div class="flex justify-between text-xs font-black mb-1">
                <span>❤️ 氣血 (HP)</span>
                <span>${GameState.hp} / ${GameState.maxHp}</span>
              </div>
              <div class="hp-bar-outer">
                <div class="hp-bar-inner" style="width: ${heroPct}%"></div>
              </div>
            </div>

            <!-- 狀態列 -->
            <div class="mt-2 flex flex-wrap gap-1 min-h-[24px]">
              ${playerBadges.join('') || '<span class="text-xs text-stone-400">氣定神閒・真氣運轉中</span>'}
            </div>
          </div>

          <div class="mt-2 pt-2 border-t border-stone-700 flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <span class="bg-amber-400 text-black font-black px-2.5 py-1 border-2 border-black text-sm">
                ⚡ 真氣：${GameState.energy} / ${GameState.maxEnergy}
              </span>
              <span class="text-stone-300 font-bold">抽牌堆: ${GameState.drawPile.length}｜棄牌堆: ${GameState.discardPile.length}</span>
            </div>
          </div>
        </div>

        <!-- 右分鏡：守關強敵 / 終極Boss楊守正 -->
        <div id="enemy-stage-box" class="comic-panel p-3 flex flex-col justify-between ${e.isBoss ? 'border-red-600' : ''}">
          <div>
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2.5">
                <div class="w-14 h-14 bg-black border-3 border-red-500 flex items-center justify-center text-3xl">
                  ${e.icon}
                </div>
                <div>
                  <div class="hk-title-text text-xl">${e.name}</div>
                  <div class="text-xs text-red-300 font-bold">${e.title}</div>
                </div>
              </div>

              <!-- 敵人護盾 -->
              <div class="bg-stone-800 border-2 border-black px-2.5 py-1 text-center">
                <div class="text-[10px] text-stone-300 font-bold">🛡️ 敵方護盾</div>
                <div class="text-base font-black text-amber-300">${e.block}</div>
              </div>
            </div>

            <!-- 敵人氣血條 -->
            <div class="mt-2.5">
              <div class="flex justify-between text-xs font-black mb-1">
                <span>👹 敵方氣血</span>
                <span>${e.hp} / ${e.maxHp}</span>
              </div>
              <div class="hp-bar-outer">
                <div class="hp-bar-inner" style="width: ${enemyPct}%"></div>
              </div>
            </div>

            <!-- 敵人狀態列 -->
            <div class="mt-2 flex flex-wrap gap-1 min-h-[24px]">
              ${enemyBadges.join('') || '<span class="text-xs text-stone-400">殺氣騰騰・蓄勢待發</span>'}
            </div>
          </div>

          <!-- 敵人下回合意圖預告 -->
          <div class="mt-2 pt-2 border-t border-stone-700 flex items-center justify-between">
            <div class="bg-red-950/90 border-2 border-red-500 px-3 py-1 text-xs font-black text-yellow-300">
              🎯 下回合意圖：${e.currentIntent.label}
            </div>
            <button class="comic-btn comic-btn-red text-sm py-1.5 px-4" onclick="endPlayerTurn()">
              ⏭️ 結束回合
            </button>
          </div>
        </div>
      </div>

      <!-- 手牌出招區 -->
      <div class="comic-panel p-3">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-black text-amber-300">🃏 當前手牌（點擊卡牌直接催谷出招！）</span>
          <span class="text-xs text-stone-300">本回合已出牌：${GameState.cardsPlayedThisTurn} 張</span>
        </div>
        <div class="flex flex-wrap items-center justify-center gap-3 py-2 min-h-[236px]">
          ${handHtml || '<div class="text-stone-400 font-bold py-12">本回合手牌已盡數打出，請點擊「結束回合」！</div>'}
        </div>
      </div>

      <!-- 港漫戰況速報 -->
      <div class="comic-panel p-2.5 max-h-28 overflow-y-auto text-xs space-y-1 bg-black/80">
        ${GameState.combatLog.map(l => `<div class="text-stone-200 border-b border-stone-800 pb-0.5">${l}</div>`).join('')}
      </div>
    </main>
  `;
}

// 3. 戰勝獎勵三選一畫面
function renderRewardScreen() {
  const cardsHtml = GameState.rewardChoices.map(cid => {
    const inst = { uid: 'reward_' + cid, id: cid, upgraded: false };
    return `
      <div class="flex flex-col items-center gap-2">
        ${renderCardHTML(inst, null, `onclick="pickRewardCard('${cid}')"`)}
        <button class="comic-btn text-xs py-1 px-3" onclick="pickRewardCard('${cid}')">
          ➕ 納入秘笈
        </button>
      </div>
    `;
  }).join('');

  return `
    <main class="max-w-4xl mx-auto px-3 py-6 text-center">
      <div class="comic-panel p-6">
        <h2 class="hk-title-text text-3xl mb-2">🏆 擊敗強敵・領悟群俠新武學</h2>
        <p class="text-sm text-stone-200 mb-5">
          揀選 1 張新武學秘笈加入你嘅牌組（或略過以保持精簡牌庫）：
        </p>
        <div class="flex flex-wrap items-center justify-center gap-6 my-4">
          ${cardsHtml}
        </div>
        <div class="mt-6">
          <button class="comic-btn comic-btn-dark text-sm" onclick="pickRewardCard(null)">
            ➡️ 略過秘笈，直接前往下一層魔宮
          </button>
        </div>
      </div>
    </main>
  `;
}

// 4. 江湖奇遇事件畫面 (? 格)
function renderEventScreen() {
  const ev = GameState.currentEvent || EVENT_POOL[0];
  const choicesHtml = ev.choices.map(ch => `
    <button class="comic-btn w-full py-3 px-4 text-left flex flex-col items-start gap-1"
            onclick="resolveEventChoice('${ch.action}')">
      <span class="text-sm font-black">${ch.label}</span>
      <span class="text-xs text-stone-800 font-bold">${ch.effectText}</span>
    </button>
  `).join('');

  return `
    <main class="max-w-3xl mx-auto px-3 py-6">
      <div class="comic-panel p-6">
        <h2 class="hk-title-text text-2xl sm:text-3xl mb-3">${ev.title}</h2>
        <p class="text-sm sm:text-base text-stone-100 leading-relaxed bg-black/60 p-4 border-l-4 border-amber-400 mb-6">
          ${ev.desc}
        </p>
        <div class="space-y-3">
          ${choicesHtml}
        </div>
      </div>
    </main>
  `;
}

// 5. 營火閉關修煉畫面
function renderRestScreen() {
  const isFinalPrep = GameState.floorIndex === 6;
  return `
    <main class="max-w-3xl mx-auto px-3 py-6 text-center">
      <div class="comic-panel p-6">
        <div class="text-5xl mb-2">🔥</div>
        <h2 class="hk-title-text text-3xl mb-2">
          ${isFinalPrep ? '第七重・決戰深淵前夕整備處' : '第五重・天山靈泉營火閉關'}
        </h2>
        <p class="text-sm text-stone-200 mb-6">
          ${isFinalPrep ? '下一層就係第八重終極魔尊【楊守正・100%中的100%】！請作最後突破：' : '在靈泉旁調息養神，或將手頭武學推上 ★3 極意境界：'}
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button class="comic-btn py-4 flex flex-col items-center gap-1" onclick="restHealAction()">
            <span class="text-2xl">🍵</span>
            <span class="text-sm font-black">靈泉調息回血</span>
            <span class="text-xs text-stone-800">回復 35% 最大氣血</span>
          </button>

          <button class="comic-btn comic-btn-cyan py-4 flex flex-col items-center gap-1" onclick="openUpgradeModal(true)">
            <span class="text-2xl">⚡</span>
            <span class="text-sm font-black">閉關突破 ★3 極意</span>
            <span class="text-xs text-stone-100">自選 1 張武學升級</span>
          </button>

          <button class="comic-btn comic-btn-red py-4 flex flex-col items-center gap-1" onclick="restGetFusedOrRelicAction()">
            <span class="text-2xl">☯️</span>
            <span class="text-sm font-black">${isFinalPrep ? '領悟大和解神卡＋法寶' : '求取海克斯神兵'}</span>
            <span class="text-xs text-stone-100">${isFinalPrep ? '獲【安迪與奧本海默】及法寶' : '隨機獲 1 件傳世海克斯'}</span>
          </button>
        </div>
      </div>
    </main>
  `;
}

// 6. 通關勝利與戰敗畫面
function renderEndScreen(isVictory) {
  return `
    <main class="max-w-3xl mx-auto px-3 py-8 text-center">
      <div class="comic-panel p-8">
        <div class="text-6xl mb-3">${isVictory ? '🏆' : '💀'}</div>
        <h2 class="hk-title-text text-3xl sm:text-4xl mb-3">
          ${isVictory ? '十成功力・一統港漫武林！！' : '氣血耗盡・飲恨魔宮'}
        </h2>
        <p class="text-sm sm:text-base text-stone-200 max-w-xl mx-auto leading-relaxed mb-6">
          ${isVictory
            ? `恭喜你操控【${GameState.hero.name}】連破八重魔宮，成功擊潰終極魔尊【楊守正（100%中的100%）】，寫下不朽港漫傳奇！`
            : `你在第 ${GameState.floorIndex + 1} 層不敵【${GameState.enemy?.name || '強敵'}】。不妨換個主角或嘗試不同心法流派再戰江湖！`}
        </p>

        <div class="flex flex-wrap justify-center gap-4">
          <button class="comic-btn text-base py-2.5 px-6" onclick="startNewRun('${GameState.heroId}')">
            🔄 用【${GameState.hero?.name}】再戰一局
          </button>
          <button class="comic-btn comic-btn-red text-base py-2.5 px-6" onclick="backToTitle()">
            🐉 返回主畫面揀選其他主角
          </button>
        </div>
      </div>
    </main>
  `;
}

// 彈出視窗渲染（檢視牌組 / 升級卡牌 / 武林圖鑑）
function renderModalHTML() {
  if (!UIState.modal) return '';

  if (UIState.modal === 'deck' || UIState.modal === 'upgrade') {
    const isUpgrade = UIState.modal === 'upgrade';
    const list = isUpgrade ? GameState.deck.filter(c => !c.upgraded) : GameState.deck;

    const cardsGrid = list.map(c => {
      const clickAttr = isUpgrade ? `onclick="upgradeDeckCard('${c.uid}')"` : '';
      return renderCardHTML(c, null, clickAttr);
    }).join('');

    return `
      <div class="comic-modal-backdrop" onclick="if(event.target===this && !${UIState.advanceAfterUpgrade}) closeModal()">
        <div class="comic-panel max-w-5xl w-full max-h-[88vh] overflow-y-auto p-5">
          <div class="flex items-center justify-between border-b-2 border-amber-400 pb-3 mb-4">
            <h3 class="hk-title-text text-2xl">
              ${isUpgrade ? '🥬 揀選 1 張武學突破至【★3 極意・十成功力】' : `📜 當前隨身武學牌組 (${GameState.deck.length} 張)`}
            </h3>
            ${!UIState.advanceAfterUpgrade ? `<button class="comic-btn comic-btn-red text-xs" onclick="closeModal()">✖ 關閉</button>` : ''}
          </div>
          <div class="flex flex-wrap justify-center gap-4">
            ${cardsGrid || '<div class="text-amber-300 font-bold py-8">所有卡牌皆已達 ★3 極意境界！</div>'}
          </div>
          ${UIState.advanceAfterUpgrade && list.length === 0 ? `
            <div class="text-center mt-4">
              <button class="comic-btn" onclick="advanceToNextFloor()">➡️ 繼續前進</button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  if (UIState.modal === 'compendium') {
    const allCardsHtml = Object.keys(CARD_DB).map(cid =>
      renderCardHTML({ uid: 'comp_' + cid, id: cid, upgraded: false }, null, '')
    ).join('');

    const allRelicsHtml = Object.values(RELIC_DB).map(r => `
      <div class="bg-stone-900 border-2 border-amber-400/60 p-2.5 text-xs">
        <div class="text-amber-300 font-black mb-1">${r.name}</div>
        <div class="text-stone-200">${r.desc}</div>
      </div>
    `).join('');

    return `
      <div class="comic-modal-backdrop" onclick="if(event.target===this) closeModal()">
        <div class="comic-panel max-w-6xl w-full max-h-[90vh] overflow-y-auto p-5">
          <div class="flex items-center justify-between border-b-2 border-amber-400 pb-3 mb-4">
            <h3 class="hk-title-text text-2xl">📖 港漫武林全圖鑑（10大舊羈絆心法 ✕ 17群俠絕學 ✕ 14海克斯法寶）</h3>
            <button class="comic-btn comic-btn-red text-xs" onclick="closeModal()">✖ 關閉</button>
          </div>

          <h4 class="text-amber-400 font-black text-base mb-2">🃏 全部武學與心法卡 (${Object.keys(CARD_DB).length} 款)</h4>
          <div class="flex flex-wrap justify-center gap-3 mb-6">
            ${allCardsHtml}
          </div>

          <h4 class="text-amber-400 font-black text-base mb-2">🔮 傳世海克斯法寶 (${Object.keys(RELIC_DB).length} 款)</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            ${allRelicsHtml}
          </div>
        </div>
      </div>
    `;
  }

  return '';
}

function toggleAudioMute() {
  SoundFX.toggleMute();
  renderApp();
}

function backToTitle() {
  UIState.modal = null;
  GameState.screen = 'title';
  GameState.hero = null;
  GameState.narratorText = '江湖風雲再起！揀選你嘅代表人物，殺上第八重深淵魔宮！';
  renderApp();
}

function renderApp() {
  const root = document.getElementById('app-root');
  if (!root) return;

  let bodyHtml = '';
  if (GameState.screen === 'title') bodyHtml = renderTitleScreen();
  else if (GameState.screen === 'combat') bodyHtml = renderCombatScreen();
  else if (GameState.screen === 'reward') bodyHtml = renderRewardScreen();
  else if (GameState.screen === 'event') bodyHtml = renderEventScreen();
  else if (GameState.screen === 'rest') bodyHtml = renderRestScreen();
  else if (GameState.screen === 'victory') bodyHtml = renderEndScreen(true);
  else if (GameState.screen === 'gameover') bodyHtml = renderEndScreen(false);

  root.innerHTML = renderHeaderBar() + bodyHtml + renderModalHTML();
}

window.addEventListener('DOMContentLoaded', () => {
  renderApp();
});
renderApp();
