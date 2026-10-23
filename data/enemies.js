// ==========================================================================
// 模組四：八重魔宮關卡與守關Boss資料庫 (data/enemies.js)
// 維護說明：
//   - 完整保留第 8 關深淵終極 Boss【楊守正・100%中的100%】半血二階段狂暴機制
//   - 第 1 至 7 層結合戰鬥、精英、奇遇、營火閉關與最終決戰
// ==========================================================================

const TOWER_FLOORS = [
  {
    floor: 1,
    nodeType: 'combat',
    title: '第一重・華爾街銅牛堂',
    subtitle: '初入江湖・牛刀小試',
    enemy: {
      id: 'enemy_stock_opp',
      name: '股票奧本海默・槓桿堂主',
      title: '百倍槓桿金融核彈',
      icon: '📈',
      maxHp: 58,
      shield: 0,
      taunt: '「後生仔，敢唔敢同我賭一鋪百倍槓桿爆倉？！」',
      intents: [
        { type: 'attack', dmg: 9, label: '📉 割韭菜斬 (9傷害)' },
        { type: 'buff_block', block: 8, str: 2, label: '📈 牛市槓桿 (+8盾 / +2力量)' },
        { type: 'big_attack', dmg: 14, label: '💣 金融核彈轟炸 (14傷害)' }
      ]
    }
  },
  {
    floor: 2,
    nodeType: 'combat',
    title: '第二重・代碼刪庫機房',
    subtitle: '奇門遁甲・機關重重',
    enemy: {
      id: 'enemy_aming',
      name: '阿明・全棧刪庫機關師',
      title: 'rm -rf /* 禁術傳人',
      icon: '💻',
      maxHp: 74,
      shield: 8,
      taunt: '「Sudo rm -rf /*！今日我就將你嘅血條連根拔起！」',
      intents: [
        { type: 'debuff_attack', dmg: 10, weak: 1, label: '👾 植入致命Bug (10傷 + 虛弱)' },
        { type: 'attack', dmg: 13, label: '⌨️ 鍵盤連環爆擊 (13傷害)' },
        { type: 'buff_block', block: 12, str: 2, label: '🛡️ 防火牆重啟 (+12盾 / +2力量)' }
      ]
    }
  },
  {
    floor: 3,
    nodeType: 'event',
    title: '第三重・風雪客棧奇遇',
    subtitle: '江湖奇遇・宿命交會'
  },
  {
    floor: 4,
    nodeType: 'elite',
    title: '第四重・萬里長城鐵血關（精英）',
    subtitle: '精英守將・贏取海克斯神兵',
    enemy: {
      id: 'enemy_dvp_ansir',
      name: 'DVP & AN SIR・大佬雙雄',
      title: '雖遠必誅 ✕ 超音速教官',
      icon: '🛡️',
      maxHp: 105,
      shield: 18,
      taunt: '「年輕人終究係年輕人！我哋萬里長城護體，你打唔穿㗎！」',
      intents: [
        { type: 'shield_bash', dmg: 12, block: 12, label: '🧱 雖遠必誅巨盾擊 (12傷 + 12盾)' },
        { type: 'attack', dmg: 16, label: '🏃 超音速嘲諷連踢 (16傷害)' },
        { type: 'buff_heal', heal: 10, str: 3, block: 10, label: '💪 薑越老越辣 (+10血/+10盾/+3力)' }
      ]
    }
  },
  {
    floor: 5,
    nodeType: 'rest',
    title: '第五重・天山靈泉營火',
    subtitle: '閉關修煉・突破★3極意'
  },
  {
    floor: 6,
    nodeType: 'elite',
    title: '第六重・太古三幻神殿（精英）',
    subtitle: '精英守將・末日與神罰',
    enemy: {
      id: 'enemy_3gods_andy',
      name: '三幻神護法 & 安迪先知',
      title: 'Loki・大神・HUGO・負油價儀式',
      icon: '🔱',
      maxHp: 135,
      shield: 15,
      taunt: '「末日儀式已經啟動！承受三幻神與負四十美元隕石嘅審判啦！」',
      intents: [
        { type: 'debuff_attack', dmg: 15, vuln: 1, label: '🦊 時間線收割 (15傷 + 易傷)' },
        { type: 'shield_bash', dmg: 14, block: 14, label: '👑 全知全能神諭 (14傷 + 14盾)' },
        { type: 'big_attack', dmg: 22, label: '🛢️ 負油價末日隕石 (22毀滅傷害)' }
      ]
    }
  },
  {
    floor: 7,
    nodeType: 'rest_and_event',
    title: '第七重・決戰前夕・黑市與靈泉',
    subtitle: '最終整備・迎接深淵魔尊'
  },
  {
    floor: 8,
    nodeType: 'boss',
    title: '第八重・深淵終極魔宮（終極Boss）',
    subtitle: '深淵終極支配者・100%中的100%',
    enemy: {
      id: 'boss_yeung',
      name: '楊守正',
      title: '深淵終極支配者・100%中的100%',
      icon: '👹',
      maxHp: 220,
      shield: 45,
      isBoss: true,
      phase2Triggered: false,
      taunt: '「哼，能闖到第八層算你有點本事……但係，你見識過『100% 中的 100%』未？！」',
      intents: [
        { type: 'shield_bash', dmg: 18, block: 16, label: '👹 深淵裁決・絕對支配 (18傷 + 16盾)' },
        { type: 'debuff_attack', dmg: 16, weak: 1, vuln: 1, label: '⚡ 霸王父威鎮壓 (16傷 + 雙弱化)' },
        { type: 'big_attack', dmg: 26, label: '💥 十成功力・深淵滅世轟 (26巨額傷害)' }
      ]
    }
  }
];
