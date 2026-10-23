// ==========================================================================
// 模組六：核心戰鬥與爬塔狀態機 (js/engine.js)
// 維護說明：負責洗牌、抽牌、出牌結算、敵人意圖執行、楊守正二階段覺醒與存檔
// ==========================================================================

const GameState = {
  screen: 'title', // 'title' | 'combat' | 'event' | 'rest' | 'reward' | 'victory' | 'gameover'
  heroId: null,
  hero: null,
  floorIndex: 0, // 0 ~ 7 (對應第 1 ~ 8 重魔宮)
  hp: 75,
  maxHp: 75,
  energy: 3,
  maxEnergy: 3,
  block: 0,
  petHp: 0, // 貓狗領導：BUBU & 烏冬獨立靈寵血條
  str: 0,
  thorns: 0,
  weak: 0,
  vuln: 0,
  stance: 'none', // DC齊發達: 'b_ji' (B記) | 'b_gou' (B狗)
  muzanAwakened: false,
  bankruptUsed: false,

  // 持續性能力牌 (Power) 狀態
  powers: {
    strPerTurn: 0,
    blockPerTurn: 0,
    sisChase: 0,
    threeGods: 0
  },

  // 計數器
  turnCount: 0,
  attacksPlayedTotal: 0,
  cardsPlayedThisTurn: 0,
  firstSkillUsedThisTurn: false,

  // 牌組與牌堆
  deck: [], // [{ uid, id, upgraded }]
  drawPile: [],
  hand: [],
  discardPile: [],
  exhaustPile: [],
  relics: [],

  // 當前敵人
  enemy: null,
  narratorText: '江湖風雲再起！揀選你嘅代表人物，殺上第八重深淵魔宮！',
  combatLog: [],
  rewardChoices: [],
  pendingLettuceUpgrade: false
};

let cardUidCounter = 1;

function createCardInstance(cardId, upgraded = false) {
  return {
    uid: 'c_' + (cardUidCounter++),
    id: cardId,
    upgraded: Boolean(upgraded)
  };
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// 開始新遊戲（選擇 4 大主角之一）
function startNewRun(heroId) {
  const template = PLAYABLE_HEROES.find(h => h.id === heroId) || PLAYABLE_HEROES[0];
  SoundFX.play('power');

  GameState.heroId = template.id;
  GameState.hero = template;
  GameState.floorIndex = 0;
  GameState.maxHp = template.maxHp;
  GameState.hp = template.maxHp;
  GameState.maxEnergy = template.maxEnergy;
  GameState.relics = [template.startingRelic];
  GameState.deck = template.starterDeck.map(cid => createCardInstance(cid, false));
  GameState.combatLog = [];

  setNarrator(`【${template.name}】踏入江湖！${template.tagline}`);
  enterCurrentFloor();
}

// 進入當前樓層
function enterCurrentFloor() {
  const floorData = TOWER_FLOORS[GameState.floorIndex];
  if (!floorData) return;

  if (floorData.nodeType === 'combat' || floorData.nodeType === 'elite' || floorData.nodeType === 'boss') {
    initCombat(floorData);
  } else if (floorData.nodeType === 'event') {
    GameState.screen = 'event';
    GameState.currentEvent = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)];
    setNarrator(`踏入【${floorData.title}】！江湖奇遇正等待你抉擇……`);
    renderApp();
  } else if (floorData.nodeType === 'rest' || floorData.nodeType === 'rest_and_event') {
    GameState.screen = 'rest';
    setNarrator(`抵達【${floorData.title}】！你可以調息回血、閉關將武學升至 ★3 極意，或領悟新神功！`);
    renderApp();
  }
}

// 初始化單場戰鬥
function initCombat(floorData) {
  GameState.screen = 'combat';
  const eTpl = floorData.enemy;
  GameState.enemy = {
    id: eTpl.id,
    name: eTpl.name,
    title: eTpl.title,
    icon: eTpl.icon,
    maxHp: eTpl.maxHp,
    hp: eTpl.maxHp,
    block: eTpl.shield || 0,
    str: 0,
    weak: 0,
    vuln: 0,
    sisMark: 0,
    isBoss: Boolean(eTpl.isBoss),
    phase2Triggered: false,
    taunt: eTpl.taunt,
    intents: eTpl.intents,
    intentIndex: 0,
    currentIntent: eTpl.intents[0]
  };

  // 重置單場戰鬥狀態
  GameState.block = 0;
  GameState.petHp = 0;
  GameState.str = 0;
  GameState.thorns = 0;
  GameState.weak = 0;
  GameState.vuln = 0;
  GameState.stance = 'none';
  GameState.muzanAwakened = false;
  GameState.bankruptUsed = false;
  GameState.powers = { strPerTurn: 0, blockPerTurn: 0, sisChase: 0, threeGods: 0 };
  GameState.turnCount = 0;
  GameState.attacksPlayedTotal = 0;

  // 洗牌放入抽牌堆
  GameState.drawPile = shuffleArray(GameState.deck);
  GameState.hand = [];
  GameState.discardPile = [];
  GameState.exhaustPile = [];

  addLog(`⚔️ 遭遇強敵【${GameState.enemy.name}】！「${GameState.enemy.taunt}」`);

  // 開場遺物觸發
  if (hasRelic('aug_leverage')) {
    GameState.str += 3;
    addLog('📈 【百倍乾坤槓桿契】生效：開局獲得 +3 點力量！');
  }
  if (hasRelic('aug_youth')) {
    GameState.str += 2;
    addLog('🏃 【不老傳奇青春秘笈】生效：開局獲得 +2 點力量！');
  }
  if (hasRelic('aug_shield')) {
    GameState.block += 16;
    addLog('🛡️ 【紅利鋼鐵護心鏡】生效：開局獲得 16 點護體罡氣！');
  }
  if (hasRelic('aug_glitch')) {
    const cut = Math.floor(GameState.enemy.hp * 0.15);
    GameState.enemy.hp = Math.max(1, GameState.enemy.hp - cut);
    GameState.enemy.weak += 2;
    GameState.enemy.vuln += 2;
    addLog(`💻 【Mobius 亂碼天書】發動！削去敵人 ${cut} 點氣血並附加雙重弱化！`);
  }

  startPlayerTurn();
}

function hasRelic(relicId) {
  return GameState.relics.includes(relicId);
}

// 開始玩家回合
function startPlayerTurn() {
  GameState.turnCount += 1;
  GameState.cardsPlayedThisTurn = 0;
  GameState.firstSkillUsedThisTurn = false;

  // 回合開始護體罡氣歸零（保留靈寵血條 petHp），然後結算能力牌護甲
  GameState.block = GameState.powers.blockPerTurn;
  if (GameState.powers.strPerTurn > 0) {
    GameState.str += GameState.powers.strPerTurn;
    addLog(`🔥 能力心法催谷：獲得 +${GameState.powers.strPerTurn} 點力量！`);
  }

  // 能量補充
  GameState.energy = GameState.maxEnergy;
  if (hasRelic('aug_leverage')) GameState.energy += 1;
  if (GameState.turnCount === 1 && hasRelic('aug_3god')) {
    GameState.energy += 2;
    addLog('✨ 【太古幻神之冕】首回合灌注 +2 點真氣！');
  }
  if (GameState.turnCount >= 4 && hasRelic('aug_overdrive')) {
    if (GameState.turnCount === 4) {
      GameState.str += 5;
      showComicSplash('🔥 死線戰神・爆肝覺醒！');
      addLog('🔥 第 4 回合【爆肝死線戰神令】全面啟動：力量 +5、每回合真氣 +1！');
    }
    GameState.energy += 1;
  }
  if (hasRelic('aug_baemon')) {
    healPlayer(3);
    GameState.block += 4;
  }

  // 主角專屬回合開始被動：DC齊發達【薛丁格B記/B狗切換】
  if (GameState.heroId === 'dc_tesla') {
    if (Math.random() < 0.5) {
      GameState.stance = 'b_ji';
      GameState.block += 4;
      setNarrator(`🚗 薛丁格判定為【B記・義薄雲天】！本回合所有攻擊傷害 +3，出牌額外獲罡氣！`);
    } else {
      GameState.stance = 'b_gou';
      GameState.hp = Math.max(1, GameState.hp - 2);
      setNarrator(`🚗 薛丁格判定為【B狗・老千魔功】！自損 2 點氣血，但本回合所有攻擊傷害狂加 +6！`);
    }
  } else {
    setNarrator(`第 ${GameState.turnCount} 回合開始！【${GameState.enemy.name}】正準備施展「${GameState.enemy.currentIntent.label}」！`);
  }

  // 抽牌 (預設 5 張，若有青春秘笈首回合 +2)
  const drawCount = (GameState.turnCount === 1 && hasRelic('aug_youth')) ? 7 : 5;
  drawCards(drawCount);
  renderApp();
}

function drawCards(count) {
  for (let i = 0; i < count; i++) {
    if (GameState.hand.length >= 9) break;
    if (GameState.drawPile.length === 0) {
      if (GameState.discardPile.length === 0) break;
      GameState.drawPile = shuffleArray(GameState.discardPile);
      GameState.discardPile = [];
      addLog('🔄 棄牌堆已重新洗入抽牌堆！');
    }
    const card = GameState.drawPile.pop();
    if (card) GameState.hand.push(card);
  }
}

function healPlayer(amount) {
  let finalHeal = amount;
  if (hasRelic('aug_oil')) finalHeal += 3;
  const before = GameState.hp;
  GameState.hp = Math.min(GameState.maxHp, GameState.hp + finalHeal);
  const actual = GameState.hp - before;
  if (actual > 0) addLog(`💚 氣血回復 +${actual} 點！`);
}

function gainBlock(amount) {
  let finalBlock = amount;
  if (hasRelic('aug_oil')) finalBlock += 3;
  GameState.block += finalBlock;
}

// 計算單段攻擊最終傷害（預覽與實際結算共用）
function calcAttackDamage(baseDmg, extraBonus = 0) {
  let dmg = baseDmg + GameState.str + extraBonus;

  // 主角被動加成
  if (GameState.heroId === 'dc_tesla') {
    if (GameState.stance === 'b_ji') dmg += 3;
    if (GameState.stance === 'b_gou') dmg += 6;
  }
  if (GameState.heroId === 'dv') {
    const missingTens = Math.floor((GameState.maxHp - GameState.hp) / 10);
    dmg += missingTens * 2;
  }

  // 虛弱減傷
  if (GameState.weak > 0) {
    dmg = Math.floor(dmg * 0.75);
  }

  // 敵人易傷與 S.I.S 絕情印增傷
  if (GameState.enemy) {
    let mult = 1.0;
    if (GameState.enemy.vuln > 0) mult += 0.5;
    if (GameState.enemy.sisMark > 0) mult += GameState.enemy.sisMark * 0.15;
    dmg = Math.floor(dmg * mult);
  }

  return Math.max(0, dmg);
}

// 玩家打出一張手牌
function playCard(handIndex) {
  if (GameState.screen !== 'combat' || !GameState.enemy) return;
  const cardInst = GameState.hand[handIndex];
  if (!cardInst) return;

  const tpl = CARD_DB[cardInst.id];
  if (!tpl) return;

  if (GameState.energy < tpl.cost) {
    showComicSplash('⚠️ 真氣不足！');
    return;
  }

  // 扣除真氣並移出手牌
  GameState.energy -= tpl.cost;
  GameState.hand.splice(handIndex, 1);
  GameState.cardsPlayedThisTurn += 1;

  const eff = cardInst.upgraded ? tpl.upEffects : tpl.effects;
  const cardTitle = cardInst.upgraded ? tpl.upName : tpl.name;

  // 港漫大字呼喊與旁白
  showComicSplash(`【${cardTitle}】`);
  setNarrator(`${GameState.hero.name}催谷真氣大喝：${tpl.shout}`);

  // 鼠姐被動：每回合首張技能/能力牌回血 + 絕情印
  if (GameState.heroId === 'mouse_sis' && (tpl.type === 'skill' || tpl.type === 'power') && !GameState.firstSkillUsedThisTurn) {
    GameState.firstSkillUsedThisTurn = true;
    healPlayer(3);
    GameState.enemy.sisMark += 1;
    addLog('🍵 【宇治茶道・玉女心經】觸發：回復 3 點氣血並烙下 1 層【絕情印】！');
  }

  // DC齊發達 B記姿態：出牌額外獲 2 點罡氣
  if (GameState.heroId === 'dc_tesla' && GameState.stance === 'b_ji') {
    GameState.block += 2;
  }

  // 特斯拉超級聚氣丹：每打出 3 張牌 +1 真氣
  if (hasRelic('aug_battery') && GameState.cardsPlayedThisTurn % 3 === 0) {
    GameState.energy += 1;
    addLog('🔋 【特斯拉超級聚氣丹】觸發：額外回復 +1 點真氣！');
  }

  // 偶像螢光棒 / 機械鍵盤回音 (2費以上或能力牌)
  if (tpl.cost >= 2 || tpl.type === 'power' || tpl.type === 'fused') {
    if (hasRelic('aug_idol')) {
      healPlayer(5);
      gainBlock(5);
      addLog('💖 【絕對偶像螢光棒】應援：回復 5 點氣血與 5 點罡氣！');
    }
    if (hasRelic('aug_key_echo')) {
      dealDirectDamageToEnemy(8, true);
      addLog('⌨️ 【玄鐵機械鍵盤回音】震出 8 點無視護盾真實傷害！');
    }
  }

  // 1. 先處理破盾效果
  if (eff.breakEnemyShield && GameState.enemy.block > 0) {
    addLog(`💥 奇門破防！直接擊碎【${GameState.enemy.name}】的 ${GameState.enemy.block} 點護盾！`);
    GameState.enemy.block = 0;
  }

  // 2. 處理攻擊傷害與特殊機制
  if (eff.dmg || eff.pierceDmg) {
    SoundFX.play('hit');
    const hits = eff.hits || 1;
    let extra = 0;

    // HUGO 斬殺加成
    if (eff.executeBonus && GameState.enemy.hp <= GameState.enemy.maxHp * 0.5) {
      extra += eff.executeBonus;
      healPlayer(eff.executeHeal || 5);
      addLog('🌌 【無間次元斬殺】觸發殘血加成！');
    }

    // 師姐 + DV 分靈體聯動
    if (eff.dvBonusDmg && (GameState.heroId === 'dv' || GameState.str > 0)) {
      extra += eff.dvBonusDmg;
      addLog('🔫 【分靈體保護狂暴】觸發額外貫穿加成！');
    }

    for (let h = 0; h < hits; h++) {
      let base = eff.pierceDmg ? eff.pierceDmg : eff.dmg;
      let finalDmg = calcAttackDamage(base, extra);

      // FSD 雙倍暴衝判定
      if (eff.fsdGamble && Math.random() < eff.fsdGamble) {
        finalDmg *= 2;
        GameState.energy += 1;
        if (eff.weakOnCrit) GameState.enemy.weak += eff.weakOnCrit;
        showComicSplash('🚗 FSD 雙倍走數暴衝！！');
        addLog('🚗 觸發【FSD 雙倍走數暴衝】！傷害翻倍並回復 1 點真氣！');
      }

      // 十倍空頭狙擊鏡暴擊
      if (hasRelic('aug_short') && Math.random() < 0.35) {
        finalDmg = Math.floor(finalDmg * 1.5);
        addLog('📉 【十倍空頭狙擊鏡】觸發 1.5 倍暴擊！');
      }

      dealDirectDamageToEnemy(finalDmg, Boolean(eff.pierceDmg));
    }

    // DV 專屬被動：連擊或師姐卡額外護甲回血
    if (GameState.heroId === 'dv' && (hits > 1 || cardInst.id === 'shijie_apex_snipe')) {
      gainBlock(4);
      healPlayer(2);
      addLog('📿 【分靈體護身玉佩】共鳴：獲得 4 點罡氣並回復 2 點氣血！');
    }

    // S.I.S 獨立自主追擊能力
    if (GameState.powers.sisChase > 0 && GameState.enemy.hp > 0) {
      dealDirectDamageToEnemy(GameState.powers.sisChase, false);
      GameState.enemy.sisMark += 1;
      addLog(`💃 【S.I.S 獨立自主】追擊 ${GameState.powers.sisChase} 點傷害並疊加 1 層絕情印！`);
    }

    // FreeTed 專屬被動：每 4 張攻擊牌觸發九天擴散閃電
    if (GameState.heroId === 'freeted' && tpl.type === 'attack') {
      GameState.attacksPlayedTotal += 1;
      if (GameState.attacksPlayedTotal % 4 === 0 && GameState.enemy.hp > 0) {
        dealDirectDamageToEnemy(10, true);
        GameState.enemy.weak += 1;
        showComicSplash('⚡ 九天擴散閃電！！');
        addLog('⚡ 【無慘雷體】累計 4 擊！降下 10 點貫穿閃電並附加 1 層虛弱！');
      }
      if (GameState.muzanAwakened) {
        healPlayer(2);
      }
    }
  } else {
    SoundFX.play(tpl.type === 'power' ? 'power' : 'block');
  }

  // 3. 處理護體罡氣、靈寵血條、回血與能力加成
  if (eff.block) gainBlock(eff.block);
  if (eff.pctMaxHpBlock) {
    gainBlock(Math.floor(GameState.maxHp * eff.pctMaxHpBlock));
  }
  if (eff.petHp) {
    GameState.petHp += eff.petHp;
    addLog(`🐾 召喚【BUBU & 烏冬靈寵護體】+${eff.petHp} 點無敵靈寵血條！`);
  }
  if (eff.heal) healPlayer(eff.heal);
  if (eff.maxHpGain) {
    GameState.maxHp += eff.maxHpGain;
    GameState.hp += eff.maxHpGain;
    addLog(`🦁 最大氣血上限提升 +${eff.maxHpGain} 點！`);
  }
  if (eff.str) GameState.str += eff.str;
  if (eff.thorns) GameState.thorns += eff.thorns;
  if (eff.energy) GameState.energy += eff.energy;
  if (eff.selfDmg) {
    GameState.hp = Math.max(1, GameState.hp - eff.selfDmg);
  }
  if (eff.cleanse) {
    GameState.weak = 0;
    GameState.vuln = 0;
  }

  // 股票奧本海默二選一賭局
  if (eff.oppGamble) {
    if (Math.random() < 0.5) {
      GameState.str += 3;
      addLog('📈 金融核彈開出【牛市暴漲】：獲得 +3 點力量！');
    } else {
      healPlayer(8);
      addLog('📉 金融核彈開出【割韭菜】：吸取 8 點氣血！');
    }
  }

  // 薛丁格賭局卡
  if (eff.schrodingerRoll) {
    if (Math.random() < 0.5) {
      GameState.energy += 2;
      addLog('🎲 薛丁格開出【B記】：立即獲得 +2 點真氣！');
    } else {
      GameState.str += 3;
      addLog('🎲 薛丁格開出【B狗】：立即獲得 +3 點力量！');
    }
  }

  // 敵人負面狀態
  if (GameState.enemy && GameState.enemy.hp > 0) {
    if (eff.weak) GameState.enemy.weak += eff.weak;
    if (eff.vuln) GameState.enemy.vuln += eff.vuln;
    if (eff.sisMark) GameState.enemy.sisMark += eff.sisMark;
  }

  // 常駐能力牌 (Power) 寫入
  if (eff.powerStrPerTurn) GameState.powers.strPerTurn += eff.powerStrPerTurn;
  if (eff.powerBlockPerTurn) GameState.powers.blockPerTurn += eff.powerBlockPerTurn;
  if (eff.powerSisChase) GameState.powers.sisChase += eff.powerSisChase;
  if (eff.powerThreeGods) GameState.powers.threeGods += eff.powerThreeGods;

  // 三幻神能力：每回合第 3 張牌觸發三位一體追擊
  if (GameState.powers.threeGods > 0 && GameState.cardsPlayedThisTurn === 3 && GameState.enemy.hp > 0) {
    dealDirectDamageToEnemy(GameState.powers.threeGods, true);
    GameState.energy += 1;
    showComicSplash('🔱 三幻神・三位一體追擊！');
    addLog(`🔱 【三幻神共鳴】轟出 ${GameState.powers.threeGods} 點神聖傷害並回復 1 點真氣！`);
  }

  // 抽牌效果
  if (eff.draw) drawCards(eff.draw);

  // 卡牌進入棄牌堆或消耗堆
  if (eff.exhaust || tpl.type === 'power') {
    GameState.exhaustPile.push(cardInst);
  } else {
    GameState.discardPile.push(cardInst);
  }

  checkFreeTedAwakening();
  checkCombatEnd();
  renderApp();
}

function dealDirectDamageToEnemy(dmg, ignoreShield = false) {
  if (!GameState.enemy || GameState.enemy.hp <= 0) return;
  let remaining = dmg;

  if (!ignoreShield && GameState.enemy.block > 0) {
    const absorbed = Math.min(GameState.enemy.block, remaining);
    GameState.enemy.block -= absorbed;
    remaining -= absorbed;
  }

  if (remaining > 0) {
    GameState.enemy.hp = Math.max(0, GameState.enemy.hp - remaining);
    triggerEnemyShake();
  }

  // 檢查第 8 關終極 Boss 楊守正 半血二階段覺醒【100% 中的 100%】
  if (
    GameState.enemy.isBoss &&
    !GameState.enemy.phase2Triggered &&
    GameState.enemy.hp > 0 &&
    GameState.enemy.hp <= GameState.enemy.maxHp * 0.5
  ) {
    GameState.enemy.phase2Triggered = true;
    GameState.enemy.block += 45;
    GameState.enemy.str += 6;
    SoundFX.play('power');
    showComicSplash('👹 100% 中的 100%・魔尊覺醒！！');
    setNarrator('⚡ 驚天動地！楊守正半血催谷極意【100% 中的 100%】，護體罡氣暴增 45 點、攻擊力狂飆！');
    addLog('👹 【楊守正】覺醒二階段極意【100% 中的 100%】！獲得 45 護盾與 +6 力量，並立即釋放深淵衝擊！');
    damagePlayer(12);
  }
}

function checkFreeTedAwakening() {
  if (GameState.heroId === 'freeted' && !GameState.muzanAwakened && GameState.hp <= GameState.maxHp * 0.5) {
    GameState.muzanAwakened = true;
    GameState.block += 12;
    SoundFX.play('power');
    showComicSplash('⚡ 無慘鬼化・全面支配！');
    addLog('⚡ 【FreeTed】氣血跌破半血，觸發【無慘鬼化】：常駐減傷 30%、每次攻擊吸血 +2，並獲 12 點罡氣！');
  }
}

// 承受敵人傷害（依序扣除：護體罡氣 -> 靈寵血條 -> 本體氣血）
function damagePlayer(rawDmg) {
  let dmg = rawDmg;

  // 玩家易傷
  if (GameState.vuln > 0) dmg = Math.floor(dmg * 1.35);

  // FreeTed 無慘鬼化減傷 30%
  if (GameState.heroId === 'freeted' && GameState.muzanAwakened) {
    dmg = Math.floor(dmg * 0.7);
  }

  // DC齊發達 25% 走數閃避
  if (GameState.heroId === 'dc_tesla' && Math.random() < 0.25) {
    dmg = Math.max(0, dmg - 4);
    addLog('🚗 【DC齊發達】發動走數身法，卸去 4 點傷害！');
  }

  // 1. 護體罡氣吸收
  if (GameState.block > 0) {
    const bAbsorb = Math.min(GameState.block, dmg);
    GameState.block -= bAbsorb;
    dmg -= bAbsorb;
  }

  // 2. 貓狗靈寵無敵血條吸收
  if (dmg > 0 && GameState.petHp > 0) {
    const pAbsorb = Math.min(GameState.petHp, dmg);
    GameState.petHp -= pAbsorb;
    dmg -= pAbsorb;
    addLog(`🐾 靈寵【BUBU & 烏冬】替你擋下 ${pAbsorb} 點傷害！`);
  }

  // 3. 本體扣血
  if (dmg > 0) {
    GameState.hp -= dmg;
    addLog(`🩸 你承受了 ${dmg} 點傷害！`);

    // 檢查【🛡️ 免死金牌・破產保護令】
    if (GameState.hp <= 0 && hasRelic('aug_bankrupt') && !GameState.bankruptUsed) {
      GameState.bankruptUsed = true;
      GameState.hp = 1;
      GameState.block += 25;
      GameState.energy += 3;
      GameState.weak = 0;
      GameState.vuln = 0;
      drawCards(2);
      SoundFX.play('power');
      showComicSplash('🛡️ 破產保護令・鎖血不死！');
      addLog('🛡️ 【免死金牌・破產保護令】發動！鎖定 1 點氣血不死、獲 25 點罡氣并補滿真氣！');
    }
  }

  // 荊棘反震（父親大人威嚴）
  if (GameState.thorns > 0 && GameState.enemy && GameState.enemy.hp > 0) {
    dealDirectDamageToEnemy(GameState.thorns, false);
    addLog(`👑 【父親大人威嚴】反震敵人 ${GameState.thorns} 點傷害！`);
  }

  checkFreeTedAwakening();
}

// 結束玩家回合 -> 執行敵人行動
function endPlayerTurn() {
  if (GameState.screen !== 'combat' || !GameState.enemy) return;

  // 手牌全部棄置
  while (GameState.hand.length > 0) {
    GameState.discardPile.push(GameState.hand.pop());
  }

  // 玩家自身回合計數遞減
  if (GameState.weak > 0) GameState.weak--;
  if (GameState.vuln > 0) GameState.vuln--;

  // 敵人行動
  const e = GameState.enemy;
  if (e.hp > 0) {
    e.block = 0; // 敵人舊護盾重置
    const intent = e.currentIntent;
    let eDmg = (intent.dmg || 0) + e.str;
    if (e.weak > 0) eDmg = Math.floor(eDmg * 0.75);

    showComicSplash(`⚠️ ${intent.label.split(' ')[0]}`);

    if (intent.type === 'attack' || intent.type === 'big_attack') {
      SoundFX.play('hit');
      damagePlayer(eDmg);
    } else if (intent.type === 'debuff_attack') {
      SoundFX.play('hit');
      damagePlayer(eDmg);
      if (intent.weak) GameState.weak += intent.weak;
      if (intent.vuln) GameState.vuln += intent.vuln;
    } else if (intent.type === 'shield_bash') {
      SoundFX.play('hit');
      e.block += intent.block || 10;
      damagePlayer(eDmg);
    } else if (intent.type === 'buff_block') {
      SoundFX.play('block');
      e.block += intent.block || 8;
      e.str += intent.str || 2;
      addLog(`📈 【${e.name}】催谷功力：獲得 ${intent.block} 護盾與 +${intent.str} 力量！`);
    } else if (intent.type === 'buff_heal') {
      SoundFX.play('power');
      e.hp = Math.min(e.maxHp, e.hp + (intent.heal || 10));
      e.block += intent.block || 10;
      e.str += intent.str || 2;
      addLog(`💪 【${e.name}】運功調息：回復 ${intent.heal} 氣血並強化力量！`);
    }

    // 敵人狀態遞減與切換下回合意圖
    if (e.weak > 0) e.weak--;
    if (e.vuln > 0) e.vuln--;
    e.intentIndex = (e.intentIndex + 1) % e.intents.length;
    e.currentIntent = e.intents[e.intentIndex];
  }

  if (!checkCombatEnd()) {
    startPlayerTurn();
  } else {
    renderApp();
  }
}

function checkCombatEnd() {
  if (GameState.hp <= 0) {
    GameState.hp = 0;
    GameState.screen = 'gameover';
    setNarrator('💀 勝敗乃兵家常事！少俠請重新來過，再闖八重魔宮！');
    return true;
  }

  if (GameState.enemy && GameState.enemy.hp <= 0) {
    SoundFX.play('power');
    const floorData = TOWER_FLOORS[GameState.floorIndex];

    // 若擊敗第 8 關終極 Boss 楊守正 -> 通關勝利！
    if (floorData.nodeType === 'boss') {
      GameState.screen = 'victory';
      showComicSplash('🏆 十成功力・一統江湖！！');
      setNarrator('🎉 驚天動地！你成功擊敗深淵終極支配者【楊守正（100%中的100%）】，登頂港漫武神之巔！');
      return true;
    }

    // 戰勝一般或精英敵人 -> 進入武學獎勵三選一
    GameState.screen = 'reward';
    healPlayer(6); // 戰後自動小幅調息

    // 若為精英關卡，額外贈送一件未擁有的海克斯神兵遺物
    if (floorData.nodeType === 'elite') {
      grantRandomRelic();
    }

    // 隨機抽出 3 張不重複獎勵卡
    const shuffledPool = shuffleArray(REWARD_CARD_IDS);
    GameState.rewardChoices = shuffledPool.slice(0, 3);
    setNarrator(`🎉 大獲全勝！從以下三門群俠絕學中揀選一門納入你嘅牌組！`);
    return true;
  }

  return false;
}

function grantRandomRelic() {
  const available = COLLECTIBLE_RELIC_IDS.filter(rid => !GameState.relics.includes(rid));
  if (available.length === 0) return;
  const pick = available[Math.floor(Math.random() * available.length)];
  GameState.relics.push(pick);
  const rTpl = RELIC_DB[pick];
  addLog(`🎁 獲得傳世海克斯法寶：【${rTpl.name}】！`);

  // 若抽到【🥬 千年天山大力生菜】，立即提升最大生命並標記免費升級
  if (pick === 'aug_lettuce') {
    GameState.maxHp += 6;
    GameState.hp += 6;
    GameState.pendingLettuceUpgrade = true;
  }
}

function pickRewardCard(cardId) {
  if (cardId) {
    GameState.deck.push(createCardInstance(cardId, false));
    SoundFX.play('power');
  }
  advanceToNextFloor();
}

function advanceToNextFloor() {
  GameState.floorIndex += 1;
  if (GameState.floorIndex >= TOWER_FLOORS.length) {
    GameState.screen = 'victory';
    renderApp();
  } else {
    enterCurrentFloor();
  }
}

// 處理奇遇事件選項
function resolveEventChoice(actionType) {
  SoundFX.play('power');
  if (actionType === 'grant_fused_card') {
    GameState.deck.push(createCardInstance('fused_andy_opp', false));
    showComicSplash('☯️ 領悟神卡・安迪與奧本海默！');
  } else if (actionType === 'heal_and_upgrade_two') {
    GameState.hp = GameState.maxHp;
    const unupgraded = GameState.deck.filter(c => !c.upgraded);
    shuffleArray(unupgraded).slice(0, 2).forEach(c => { c.upgraded = true; });
    showComicSplash('★3 雙重極意突破！');
  } else if (actionType === 'lettuce_upgrade') {
    GameState.maxHp += 8;
    GameState.hp += 8;
    if (!hasRelic('aug_lettuce')) GameState.relics.push('aug_lettuce');
    openUpgradeModal(true);
    return;
  } else if (actionType === 'random_relic') {
    grantRandomRelic();
    if (GameState.pendingLettuceUpgrade) {
      GameState.pendingLettuceUpgrade = false;
      openUpgradeModal(true);
      return;
    }
  } else if (actionType === 'grant_shijie_up') {
    GameState.deck.push(createCardInstance('shijie_apex_snipe', true));
    showComicSplash('🔫 獲 ★3 克雷貝爾穿雲槍！');
  } else if (actionType === 'boost_hp_15') {
    GameState.maxHp += 15;
    GameState.hp = Math.min(GameState.maxHp, GameState.hp + 20);
    showComicSplash('💢 狂父霸體・氣血大增！');
  }
  advanceToNextFloor();
}

function addLog(msg) {
  GameState.combatLog.unshift(msg);
  if (GameState.combatLog.length > 18) GameState.combatLog.pop();
}

function setNarrator(msg) {
  GameState.narratorText = msg;
}
