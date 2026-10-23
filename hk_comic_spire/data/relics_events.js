// ==========================================================================
// 模組三：海克斯神兵遺物與江湖奇遇資料庫 (data/relics_events.js)
// 維護說明：
//   - RELIC_DB 由原本 AUGMENT_POOL (14款海克斯) 完整轉化為港漫隨身法寶
//   - EVENT_POOL 為爬塔途中的「江湖奇遇 (? 格)」事件
// ==========================================================================

const RELIC_DB = {
  // 四大主角專屬起始法寶
  relic_schrodinger_dice: {
    id: 'relic_schrodinger_dice',
    name: '🎲 薛丁格走數骰',
    desc: '【DC齊發達專屬】每回合自動切換【B記】或【B狗】姿態，受擊時有 25% 機率發動走數身法減免 4 點傷害。'
  },
  relic_muzan_blood: {
    id: 'relic_muzan_blood',
    name: '🩸 無慘鬼王之血',
    desc: '【FreeTed專屬】每打出 4 張攻擊牌自動降下 10 點擴散閃電；半血以下自動進入【無慘鬼化】減傷 30% 並吸血。'
  },
  relic_horcrux_pendant: {
    id: 'relic_horcrux_pendant',
    name: '📿 分靈體護身玉佩',
    desc: '【DV專屬】每損失 10 點氣血攻擊傷害 +2；打出連擊或師姐絕學時額外獲得 4 點護體罡氣與 2 點回血。'
  },
  relic_matcha_whisk: {
    id: 'relic_matcha_whisk',
    name: '🍵 未來百本立茶筅',
    desc: '【鼠姐專屬】每回合首張技能／能力牌回復 3 點氣血，並為敵人烙下 1 層【絕情印】（受擊增傷 15%）。'
  },

  // 14 款海克斯增幅轉化之江湖奇珍 (AUGMENT_POOL)
  aug_lettuce: {
    id: 'aug_lettuce',
    name: '🥬 千年天山大力生菜',
    desc: '【V4 傳奇奇珍】拾獲時立即彈出秘笈視窗，由你親手指定 1 張未升級武學直接突破至【★3 極意・十成功力】境界，並提升 6 點最大氣血！'
  },
  aug_bankrupt: {
    id: 'aug_bankrupt',
    name: '🛡️ 免死金牌・破產保護令',
    desc: '每場戰鬥首次受到致命傷害時不會死亡，氣血鎖定在 1 點、立即獲得 25 點護體罡氣、補滿 3 點真氣並抽 2 張牌！'
  },
  aug_overdrive: {
    id: 'aug_overdrive',
    name: '🔥 爆肝死線戰神令',
    desc: '戰鬥進入第 4 回合時，自動進入「死線爆肝狀態」：獲得 +5 點力量與每回合 +1 點真氣，持續至戰鬥結束！'
  },
  aug_key_echo: {
    id: 'aug_key_echo',
    name: '⌨️ 玄鐵機械鍵盤回音',
    desc: '每當你打出任何費用 >= 2 的大招武學或能力牌時，額外對敵人震出 8 點無視護盾的真實音波傷害！'
  },
  aug_leverage: {
    id: 'aug_leverage',
    name: '📈 百倍乾坤槓桿契',
    desc: '每場戰鬥開局獲得 +1 點額外真氣與 +3 點力量，但開局氣血上限略減 6 點（高風險高回報）。'
  },
  aug_baemon: {
    id: 'aug_baemon',
    name: '👾 寶怪 SHEESH 應援令',
    desc: '每回合開始時，自動回復 3 點氣血並獲得 4 點護體罡氣！'
  },
  aug_3god: {
    id: 'aug_3god',
    name: '✨ 太古幻神之冕',
    desc: '最大氣血 +12，且每場戰鬥第一回合額外獲得 +2 點真氣！'
  },
  aug_oil: {
    id: 'aug_oil',
    name: '🛢️ 末日加速聖火令',
    desc: '所有卡牌造成的治療量與護體罡氣提升 +3 點！'
  },
  aug_glitch: {
    id: 'aug_glitch',
    name: '💻 Mobius 亂碼天書',
    desc: '每場戰鬥開局時，敵人陷入代碼混亂：直接扣除 15% 現有氣血並附加 2 層虛弱與 2 層易傷！'
  },
  aug_short: {
    id: 'aug_short',
    name: '📉 十倍空頭狙擊鏡',
    desc: '你的所有攻擊牌有 35% 機率觸發「空頭暴擊」，造成 1.5 倍傷害！'
  },
  aug_idol: {
    id: 'aug_idol',
    name: '💖 絕對偶像螢光棒',
    desc: '每當你打出「能力牌」或「2費以上武學」時，自動回復 5 點氣血並獲得 5 點護體罡氣！'
  },
  aug_battery: {
    id: 'aug_battery',
    name: '🔋 特斯拉超級聚氣丹',
    desc: '每打出 3 張卡牌，立即自動充能 +1 點真氣！'
  },
  aug_youth: {
    id: 'aug_youth',
    name: '🏃 不老傳奇青春秘笈',
    desc: '每場戰鬥第一回合額外多抽 2 張牌，且永久獲得 +2 點力量！'
  },
  aug_shield: {
    id: 'aug_shield',
    name: '🛡️ 紅利鋼鐵護心鏡',
    desc: '每場戰鬥開局自動獲得 16 點護體罡氣（Shield）！'
  }
};

const COLLECTIBLE_RELIC_IDS = [
  'aug_lettuce', 'aug_bankrupt', 'aug_overdrive', 'aug_key_echo',
  'aug_leverage', 'aug_baemon', 'aug_3god', 'aug_oil',
  'aug_glitch', 'aug_short', 'aug_idol', 'aug_battery',
  'aug_youth', 'aug_shield'
];

// 港漫江湖奇遇事件庫 (? 格)
const EVENT_POOL = [
  {
    id: 'event_fusion',
    title: '☯️ 【宿敵奇遇】布雷頓森林客棧・世紀大和解',
    desc: '你在風雪客棧中偶遇正在爭論「負油價隕石」與「百倍槓桿核彈」的 Andy安迪 與 股票奧本海默。兩人見你骨骼精奇，決定放下隔夜仇，將畢生功力合而為一傳授於你！',
    choices: [
      {
        label: '🔥 見證「大和解」！領悟 0 費傳說神卡【安迪與奧本海默】',
        effectText: '獲得傳說合體神卡【安迪與奧本海默・終局大和解】！',
        action: 'grant_fused_card'
      },
      {
        label: '🍵 請兩位大佬飲抹茶和氣生財（全滿回血＋獲大力生菜升級）',
        effectText: '氣血全滿，並隨機將牌組 2 張卡牌突破至 ★3 極意！',
        action: 'heal_and_upgrade_two'
      }
    ]
  },
  {
    id: 'event_lettuce_master',
    title: '🥬 【仙人指路】天山大力生菜農夫',
    desc: '一名神秘老農手捧一顆散發金光的「🥬 大力生菜」攔住去路：「後生仔，食咗呢棵 V4 新版大力生菜，你嘅武學即刻突破 ★3 極意境界！」',
    choices: [
      {
        label: '🥬 生吞大力生菜！（自選 1 張卡牌突破 ★3 極意 ＋ 最大氣血 +8）',
        effectText: '最大氣血 +8，並手動指定 1 張卡牌突破至 ★3 極意！',
        action: 'lettuce_upgrade'
      },
      {
        label: '🛡️ 求取護身法寶（隨機獲得 1 件傳世海克斯法寶）',
        effectText: '隨機獲得 1 件未擁有的海克斯神兵遺物！',
        action: 'random_relic'
      }
    ]
  },
  {
    id: 'event_horcrux',
    title: '🔫 【江湖誤會】DV 與師姐的分靈體奇緣',
    desc: '遠處傳來克雷貝爾狙擊槍響，師姐 sis 正在懸崖練槍，旁邊的 DV 激動大喊：「珊！你果然係我老婆嘅分靈體！」整座山頭充滿了狂暴的保護慾氣場。',
    choices: [
      {
        label: '🔫 領悟【師姐・克雷貝爾一槍穿雲（★3極意版）】',
        effectText: '獲得已升級的 ★3【克雷貝爾一槍穿雲】無視護盾神槍卡！',
        action: 'grant_shijie_up'
      },
      {
        label: '💢 吸收分靈體狂暴父愛（永久提升最大氣血 +15 並回滿血）',
        effectText: '最大氣血 +15 並回復 20 點氣血！',
        action: 'boost_hp_15'
      }
    ]
  }
];
