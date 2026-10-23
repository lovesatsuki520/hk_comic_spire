// ==========================================================================
// 模組一：四大可選港漫主角資料庫 (data/heroes.js)
// 維護說明：若要新增或調整主角血量、真氣上限、獨門被動或起始牌組，只需修改此陣列
// ==========================================================================

const PLAYABLE_HEROES = [
  {
    id: 'dc_tesla',
    name: 'DC齊發達',
    title: '華爾街窮閪・薛丁格走數劍客',
    icon: '🚗',
    tagline: '「今日開B記定B狗，連馬斯克都算唔到！」',
    maxHp: 72,
    maxEnergy: 3,
    startingRelic: 'relic_schrodinger_dice',
    passiveName: '【薛丁格雙重人格・走數神行】',
    passiveDesc: '每回合開始時，50% 機率進入【B記・義薄雲天】（所有攻擊牌傷害 +3，出牌額外獲 2 點罡氣）；50% 機率進入【B狗・老千魔功】（所有攻擊牌傷害 +6，但回合開始自損 2 點氣血）。受擊時有 25% 機率發動「走數閃避」減免 4 點傷害！',
    lore: '橫行華爾街與香江錢莊的傳奇車神，憑藉一套「FSD 全自動走數步法」與深不可測的雙重人格叱吒武林。',
    starterDeck: [
      'strike', 'strike', 'strike', 'defend', 'defend', 'defend',
      'dc_fsd_rush', 'dc_fsd_rush', 'trait_poor_gambler', 'wallstreet_short'
    ]
  },
  {
    id: 'freeted',
    name: 'FreeTed',
    title: '無慘天魔・雷霆霸主',
    icon: '⚡',
    tagline: '「在座各位都係垃圾——唯有父親大人的威嚴不可侵犯！」',
    maxHp: 82,
    maxEnergy: 3,
    startingRelic: 'relic_muzan_blood',
    passiveName: '【天魔雷體・無慘鬼化】',
    passiveDesc: '每累計打出 4 張攻擊牌，立即引動「九天擴散閃電」對敵人造成 10 點雷屬性傷害並附加 1 層虛弱！當氣血低於 50% 時自動覺醒【無慘鬼化】：受到的傷害減免 30%，且每次攻擊回復 2 點氣血！',
    lore: '傲視群雄的無慘大人，舉手投足皆帶萬鈞雷霆，當身陷絕境之時，真正的天魔霸氣將令全場窒息。',
    starterDeck: [
      'strike', 'strike', 'strike', 'strike', 'defend', 'defend',
      'ted_garbage_all', 'ted_lightning_fist', 'trait_father_majesty', 'trait_big_boss'
    ]
  },
  {
    id: 'dv',
    name: 'DV',
    title: '狂暴慈父・分靈體狂刀',
    icon: '💢',
    tagline: '「邊個敢動我老婆分靈體，我斬到佢十八代都認唔出！」',
    maxHp: 78,
    maxEnergy: 3,
    startingRelic: 'relic_horcrux_pendant',
    passiveName: '【逆鱗父愛・狂戰怒火】',
    passiveDesc: '自身已損失氣血每達 10 點，所有攻擊牌額外獲得 +2 點狂暴傷害！每當打出帶有「連擊」或「師姐」字樣的武學時，立即獲得 4 點護體罡氣並回復 2 點氣血。',
    lore: '身懷霸王父威的狂戰刀客，血條越殘刀勢越狂，與「百步穿楊・師姐」的絕學更能產生毀天滅地的分靈體共鳴。',
    starterDeck: [
      'strike', 'strike', 'strike', 'defend', 'defend', 'defend',
      'dv_manic_combo', 'shijie_apex_snipe', 'trait_father_majesty', 'dv_rage_shield'
    ]
  },
  {
    id: 'mouse_sis',
    name: '鼠姐 sis',
    title: '未來抹茶仙子・玉女掌門',
    icon: '🍵',
    tagline: '「飲啖未來宇治抹茶先啦，跟住就送你上路！」',
    maxHp: 68,
    maxEnergy: 3,
    startingRelic: 'relic_matcha_whisk',
    passiveName: '【宇治茶道・玉女心經】',
    passiveDesc: '每回合打出的第一張「技能牌」或「能力牌」會額外回復 3 點氣血，並在敵人身上烙下 1 層【絕情印】（每層使敵人承受的攻擊傷害提升 +15%）！',
    lore: '來自未來時空的 28 歲高顏值掌門，一手調製回氣抹茶、一手施展玉女仙宗絕情印與靈寵大陣。',
    starterDeck: [
      'strike', 'strike', 'defend', 'defend', 'defend', 'defend',
      'mouse_matcha_brew', 'mouse_matcha_splash', 'trait_sis_mark', 'trait_cat_dog_pet'
    ]
  }
];
