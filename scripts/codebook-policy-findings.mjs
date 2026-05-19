const entries = ({ reason, confidence = "high", words }) =>
  words
    .trim()
    .split(/\s+/)
    .map((word) => ({ word, reason, confidence }));

export const AGENT_REVIEWED_POLICY_FINDINGS = {
  english: [
    ...entries({
      reason: "personal-name",
      words: `
        Roy Tim Brad Carl Eric Gary Jeff Joan Joel Luke Matt Neil Nick Pete
        Phil Tony Troy Allen Billy Bruce Carol Chris Craig Diana Diego Elvis
        Emily Harry Helen Henry Jacob James Jamie Janet Jason Jerry Jimmy
        Julia Julie Kelly Kevin Larry Laura Linda Louis Maria Mario Peter
        Ralph Randy Sarah Scott Simon Steve Susan Terry Tommy Tyler Wayne
        Wendy Albert Andrew Arnold Carlos Dennis Donald Joseph Justin Monica
        Pierre Antonio Jessica Michael Benjamin
      `,
    }),
    ...entries({
      reason: "identity-or-demonym",
      words:
        "Arab Irish Latin Roman Swiss Arabic Norwegian Australian Portuguese",
    }),
    ...entries({
      reason: "place-name",
      words: `
        Francisco Hampshire Lancaster Nashville Newcastle Rochester Tennessee
        Birmingham Manchester Montgomery
      `,
    }),
    ...entries({
      reason: "brand-or-product",
      words: "Mac Java Jeep Spam Zoom Canon Excel Gamespot",
    }),
    ...entries({
      reason: "software-or-web-jargon",
      words: `
        Admin Login Proxy Browser Database Internet Protocol Permalink Trackback
        Webmaster Repository Programming
      `,
    }),
    ...entries({
      reason: "legal-or-regulatory",
      words: `
        Law Laws Court Judge Legal Trial Copyright Liability Testimony Trademark
        Regulation Legislative Regulations
      `,
    }),
    ...entries({
      reason: "medical-or-body-health",
      words: `
        Acid Cure Dose Gene Blind Liver Pulse Health Genetic Genetics Screening
        Substance Prescribed Bandage
      `,
    }),
    ...entries({
      reason: "gambling-alcohol-drug-or-game-adjacent",
      words:
        "Ace Pub Card Cards Drink Joint Prize Smoke Wines Arcade Drinks Tournament",
    }),
    ...entries({
      reason: "weapon-violence-or-military",
      words: "Arms Hunt Raid Shot Tank Blast Force Guard Shots Squad",
    }),
    ...entries({
      reason: "religious-occult-or-spiritual",
      words: "Halo Soul Fairy Magic Angels Belief Bishop Spirit Spirits",
    }),
    ...entries({
      confidence: "medium-high",
      reason: "awkward-rare-industrial-or-url-unfriendly",
      words: `
        Linencloth Rugmat Loomband Threader Ewer Knapkin Outhouse Mossy
        Leafmold Forklift
      `,
    }),
    ...entries({
      reason: "second-pass-personal-name-or-surname",
      words: `
        Jean Kent Clark Lewis Moore Edward George Gordon Harris Howard Johnny
        Martin Morgan Morris Murray Norman Oliver Ronald Samuel Sharon Steven
        Stuart Walter Wilson Anthony Charles Charlie Douglas Francis Leonard
        Matthew Patrick Raymond Richard Russell Stanley Stephen Timothy Vincent
        William Winston Anderson Franklin Jonathan Lawrence Margaret Marshall
        Michelle Mitchell Nicholas Victoria Charlotte
      `,
    }),
    ...entries({
      reason: "second-pass-place-name-overlap",
      words: "Durham Madison Hampton Brighton Hamilton Kingston Stanford",
    }),
    ...entries({
      reason: "second-pass-place-demonym-or-language",
      words: `
        Dutch French German Jersey African British England English Holland
        Italian Memphis Newport Oakland Spanish American Arkansas Brooklyn
        Canadian Carolina European Maryland Portland Cleveland
      `,
    }),
    ...entries({
      reason: "second-pass-software-web-or-network-jargon",
      words: `
        Plugin Server Upload Network Website Username Websites Antivirus
        Databases Networking Client Clients Script Scripts Socket Packet
      `,
    }),
    ...entries({
      reason: "second-pass-brand-or-personal-name",
      words: "Mercedes",
    }),
    ...entries({
      reason: "second-pass-legal-political-or-civic",
      words: `
        Tax Mayor State Voted Votes Courts Empire Nation Patent Permit Police
        Policy Treaty Justice License Senator Contract Governance
      `,
    }),
    ...entries({
      reason: "second-pass-body-part-or-medical",
      words:
        "Arm Ear Eye Foot Bone Skin Brain Heart Hearts Mouth Finger Muscle Nurses",
    }),
    ...entries({
      reason: "second-pass-adult-military-or-tobacco",
      words: "Kiss Navy Smoking",
    }),
    ...entries({
      confidence: "medium-high",
      reason: "second-pass-generated-place-like-or-awkward-compound",
      words: `
        Alderbowl Rosehill Brightleaf Softleaf Redleaf Stillwater Whiskbroom
        Hearthrug
      `,
    }),
  ],
  korean: [
    ...entries({
      reason: "brand-or-platform",
      words: "엘지 구글 롯데 틱톡 네이버 유튜브",
    }),
    ...entries({
      confidence: "medium",
      reason: "brand-common-word-collision",
      words: "애플 신세계",
    }),
    ...entries({
      reason: "place-landmark-or-dynasty",
      words:
        "백두 경복궁 창덕궁 덕수궁 고구려 남대문 영산강 섬진강 대동강 임진강 소양강",
    }),
    ...entries({
      reason: "personal-or-proper-name",
      words: "바흐 멘델 하이든 베르디 푸치니 차이코 파가니 바르톡 모차르트",
    }),
    ...entries({
      reason: "alcohol",
      words:
        "와인 맥주 소주 맛술 술병 술잔 술통 막걸리 와인병 와인잔 와인통 위스키 소주잔 맥주잔",
    }),
    ...entries({
      reason: "medical-or-clinical",
      words: `
        의사 약국 재활 한의 치과 증상 의학 약사 혈압 혈액 백신 염증 통원
        입원 세균 혈관 항체 구급차 간호사 호르몬 염색체
      `,
    }),
    ...entries({
      reason: "legal-political-or-military",
      words:
        "법률 군사 규제 법원 법규 법정 법령 법조 법학 법무 인권 민주 주권 변호사",
    }),
    ...entries({
      reason: "religious-ritual-or-occult",
      words:
        "마법 성당 제단 제물 사제 신령 신주 신전 신사 신탁 신성 신당 영가 사신 마법사",
    }),
    ...entries({
      reason: "violent-disaster-weapon-or-military",
      words: "사격 기폭 탱크 방폭 지진 화재 절단 화살 적군 장군",
    }),
    ...entries({
      reason: "dating-body-or-underwear-adjacent",
      words: "연인 입술 내의 수영복 로맨스 데이트 신혼여행",
    }),
    ...entries({
      confidence: "medium-high",
      reason: "game-gambling-adjacent-or-foreign-fragment",
      words: "룰 윷 게임기",
    }),
    ...entries({
      reason: "clipped-loanword-or-game-product-jargon",
      words: "오렌 아몬 바닐 라즈 크랜 리보 아이템 세이브 퀘스트 스타트 레전드",
    }),
    ...entries({
      confidence: "medium",
      reason: "generated-looking-compound",
      words:
        "푸른새봄 은빛달빛 은빛물빛 차분한일감 새벽일감 밝은누룽지 고요한누룽지",
    }),
    ...entries({
      reason: "second-pass-fragment-brand-or-platform-collision",
      words: "빙 뷰 톡 줌 텐 티쏘 다이소",
    }),
    ...entries({
      reason: "second-pass-proper-name-or-place-fragment",
      words: "베토 주안 가거",
    }),
    ...entries({
      reason: "second-pass-religious-myth-or-occult",
      words: "신화 주술 영혼 마술 여신",
    }),
    ...entries({
      reason: "second-pass-medical-or-clinical",
      words: "간호 진료 증세 예후 약통 치주 부기 경련",
    }),
    ...entries({
      reason: "second-pass-legal-political-or-civic",
      words: "특허 상표 판사 고소 고발 의회",
    }),
    ...entries({
      reason: "second-pass-gambling-game-or-chance",
      words: "블랙잭 주사위 고도리 백개먼",
    }),
    ...entries({
      reason: "second-pass-disaster-violence-or-hunting",
      words: "해일 태풍 사냥꾼",
    }),
    ...entries({
      reason: "second-pass-alcohol",
      words: "브루어리",
    }),
    ...entries({
      reason: "second-pass-dating-or-relationship",
      words: "약혼",
    }),
    ...entries({
      reason: "second-pass-clipped-or-malformed-loanword",
      words: "악세 부끄",
    }),
  ],
  chinese: [
    ...entries({
      reason: "tobacco",
      words: "烟",
    }),
    ...entries({
      reason: "adult-or-sexual-double-meaning",
      words: "高潮",
    }),
    ...entries({
      reason: "place-landmark-or-geopolitical-name",
      words: "普陀 南海 西沙 东沙 黄岩 金门 马祖 澎湖 大连 天坛",
    }),
    ...entries({
      reason: "named-river-lake-or-place-like-label",
      words: `
        珠江 辽河 淮河 海河 洞庭 鄱阳 滇池 巢湖 洱海 阳澄 西江 东江
        南江 北江 沱江 怒江 红河 松江 清江 乌江 涪江 岷江 白河 汉江
        漓江 湘江 赣江 闽江 黑河 渭河 桂江
      `,
    }),
    ...entries({
      reason: "religion-occult-myth-or-holiday",
      words: "魔术 巫师 妖精 幽灵 亡灵 天使 灵魂 中元 天宫 嫦娥 仙女 平安夜",
    }),
    ...entries({
      reason: "medical-anatomy-or-clinical",
      words: `
        愈合 护士 皮肤 细胞 器官 肌肉 骨骼 免疫 生殖 激素 细菌 淋巴
        脊髓 大脑 小脑 脑干 肝脏 肾脏 心脏 胰腺 脾脏 胆囊 毛发 关节
        韧带 肌腱 生理
      `,
    }),
    ...entries({
      reason: "medicine-herb-or-drug-root",
      words:
        "虫草 川芎 白芷 黄连 黄柏 香附 牛膝 杜仲 石斛 麦冬 黄精 地黄 枳实 木通 罂粟 决明子",
    }),
    ...entries({
      reason: "legal-political-or-civic",
      words: `
        审查 备案 批准 赔偿 救济 调解 和解 权利 律师 证人 原告 被告
        案件 权力 人权 公民 改革 民族 制度 民主 条款
      `,
    }),
    ...entries({
      reason: "weapon-combat-threat-or-disaster",
      words: "拳击 武术 射击 塔防 猎人 忍者 敌人 武侠 灾难 反击 警报 刺客",
    }),
    ...entries({
      reason: "card-board-game-or-gambling-adjacent",
      words: "卡牌 纸牌 暗棋 双陆棋",
    }),
    ...entries({
      reason: "brand-product-platform-or-event",
      words: "北斗 奥运 蓝牙 智联 猎云 乐视 咪咕 迅雷 酷狗 虾米 酷我",
    }),
    ...entries({
      reason: "planet-or-celestial-proper-name",
      words: "天王星 海王星 冥王星",
    }),
    ...entries({
      confidence: "medium",
      reason: "place-like-directional-label",
      words: "南澳 北澳 东澳 西澳 南湾 北湾 东湾 西湾",
    }),
    ...entries({
      confidence: "medium",
      reason: "generated-or-poetic-compound",
      words: "青雨 青雪 青露 青霞 青香 白香 绿雪 绿露 绿霞",
    }),
    ...entries({
      confidence: "medium",
      reason: "awkward-childish-or-generated-looking",
      words: "水瓢子 小星星 小太阳 小月亮",
    }),
    ...entries({
      reason: "second-pass-brand-platform-or-social-app",
      words: "优酷 虎扑 陌陌 美克",
    }),
    ...entries({
      reason: "second-pass-planet-or-celestial-proper-name",
      words: "地球 水星 金星 火星 木星 土星",
    }),
    ...entries({
      reason: "second-pass-place-sea-mountain-or-landmark",
      words: "北海 东海 西海 香山 南山 五岳",
    }),
    ...entries({
      reason: "second-pass-lake-or-place-like-label",
      words:
        "东湖 南湖 北湖 龙湖 南岭 南村 南园 南河 南岛 西塔 西港 西岭 西河 西村",
    }),
    ...entries({
      reason: "second-pass-anatomy-or-body-root",
      words: "肺 肝 胃 肾 牙 眼 耳 鼻 喉 脉 胆 骨 脑 肠 齿",
    }),
    ...entries({
      reason: "second-pass-medical-physiology-or-biomedical",
      words: "灸 呼吸 消化 发育 心跳 基因 核酸 遗传",
    }),
    ...entries({
      reason: "second-pass-medicine-herb-or-drug-root",
      words: "枸杞 艾草 陈皮 金银花 银杏叶",
    }),
    ...entries({
      reason: "second-pass-legal-case-evidence-or-civic",
      words: "卷宗 证言 证据 当事人 合规 义务 权益 权限",
    }),
    ...entries({
      reason: "second-pass-religious-ritual-occult-or-myth",
      words: "祈 庵 坛 魂 符文 精灵 信仰 图腾 仪式",
    }),
    ...entries({
      reason: "second-pass-gambling-or-alcohol",
      words: "筹 干杯",
    }),
    ...entries({
      confidence: "medium-high",
      reason: "second-pass-generated-looking-color-nature-compound",
      words: "青沙 绿沙",
    }),
  ],
  japanese: [
    ...entries({
      reason: "adult-dating-sexual-or-relationship",
      words: `
        こい かれし よめ つきあい あいする あいじょう ひとづま しょじょ
        はなよめ こんやく よくぼう じょそう つきあう かいらく いとしい
      `,
    }),
    ...entries({
      reason: "alcohol-gambling-finance-or-auction",
      words:
        "さけ いざかや がちゃ かぶぬし かぶか そうば しょうちゅう くじ いんしゅ らくさつ さいころ あまざけ",
    }),
    ...entries({
      reason: "medical-symptom-anatomy-pharmacy-or-treatment",
      words: `
        いがく げか にきび ずつう べんぴ めんえき にょう しゅっけつ
        かんぞう ますい まひ やっきょく ないか けつあつ どうみゃく
        にんぷ じんぞう りょうよう ふくよう せきずい
      `,
    }),
    ...entries({
      reason: "political-or-legal",
      words: `
        せいふ ほうりつ とうひょう しゅしょう けんぽう こっかい ないかく
        てんのう みんしゅ そしょう そうり はんけつ しほう ちじ ほうてき
        ひこく とうち さよく せんのう しゅのう うよく よとう かんぜい
        あんぽ りっぽう みんぽう
      `,
    }),
    ...entries({
      reason: "military-violence-disaster-crime-or-threat",
      words: `
        いくさ じこ ひがい たたかい ぼうえい さいがい かたな あぶない
        げんぱつ ぶそう ほうしゃ ふくしゅう しんりゃく しんさい しょうぼう
        どろぼう ついらく らち かくとう つなみ ほりょ くうぼ ふんそう
        ぼうどう むち おどし あらす こくぼう こうずい おの とりで
        ようさい はんぎゃく きずつける
      `,
    }),
    ...entries({
      reason: "religious-occult-or-ritual",
      words: `
        まほう たましい てんし おに まじょ ようかい てんごく めがみ
        うらない しんわ ゆうれい ぎしき いのり まおう しんとう すうはい
        みこ くよう おんみょう かぐら
      `,
    }),
    ...entries({
      reason: "place-brand-index-or-demonym-risk",
      words: "りょうこく ぎふ にっけい",
    }),
    ...entries({
      reason: "slang-malformed-stem-clipped-filler-or-awkward-katakana",
      words: `
        まじ すげ めっちゃ やばい すっごい どや こまか すばらし
        がっつり ばりばり ざっくり かたかな ぐる くっく いっと
        ちゃり こすもす
      `,
    }),
    ...entries({
      confidence: "medium",
      reason: "common-name-reading",
      words: "さかい はやし いぬい ゆり なぎさ りか",
    }),
    ...entries({
      confidence: "medium",
      reason: "repeated-mimetic-or-filler",
      words: "ごろごろ ただただ ふわふわ ぐるぐる がちがち もやもや",
    }),
    ...entries({
      reason: "second-pass-relationship-or-dating",
      words: "あい であい",
    }),
    ...entries({
      reason: "second-pass-medical-body-anatomy-or-treatment",
      words: `
        しんたい さいぼう しんけい きんにく かいぼう しょうどく
        こっかく みゃく ちゆ そせい べんじょ
      `,
    }),
    ...entries({
      reason: "second-pass-alcohol-venue-or-process",
      words: "さかば じょうぞう",
    }),
    ...entries({
      reason: "second-pass-finance-tax-or-accounting",
      words: `
        ぎんこう とうし きんゆう かぶしき のうぜい かぜい ぞうぜい
        げらく ふきょう けいり ふりこみ はいとう
      `,
    }),
    ...entries({
      reason: "second-pass-legal-or-crime",
      words:
        "いほう ごうほう ほうてい ほうれい みんじ ほうか ほうふく れんこう",
    }),
    ...entries({
      reason: "second-pass-disaster-violence-or-conflict",
      words: "たいふう ほうかい たたかう あらそう てんらく ぼっぱつ",
    }),
    ...entries({
      reason: "second-pass-religious-clergy-or-pilgrimage",
      words: "しさい しんぷ そうりょ じゅんれい",
    }),
    ...entries({
      reason: "second-pass-political-title-empire-or-dynasty",
      words: "こうしつ だんしゃく おうちょう ていこく",
    }),
  ],
};

export const AGENT_REVIEWED_BLOCKLISTS = Object.fromEntries(
  Object.entries(AGENT_REVIEWED_POLICY_FINDINGS).map(([language, findings]) => [
    language,
    findings.map((finding) => finding.word),
  ]),
);
