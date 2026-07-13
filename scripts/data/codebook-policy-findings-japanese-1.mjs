const entries = ({ reason, confidence = "high", words }) =>
  words
    .trim()
    .split(/\s+/)
    .map((word) => ({ word, reason, confidence }));

export const japanesePolicyFindingsPart1 = [
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
    words: "いほう ごうほう ほうてい ほうれい みんじ ほうか ほうふく れんこう",
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
  ...entries({
    reason: "third-pass-adult-or-relationship",
    words: "つま おっと ふうふ こうさい",
  }),
  ...entries({
    reason: "third-pass-alcohol-or-gambling",
    words: "さかずき かんぱい はなふだ",
  }),
  ...entries({
    reason: "third-pass-medical-body-or-anatomy",
    words: `
        からだ かお あたま くち あし むね ゆび うで はら せなか
        こし ひざ ほね おなか のど つば あせ なみだ おやゆび てあし
        しろめ ひじ てのひら あしくび まゆ めだま ゆびさき ひふ
        しきゅう しりょく たいじゅう こきゅう しんちょう たいかく
        けんこう しょうじょう とうにょう しょうに ほっさ しょほう
        せっしゅ かいご だつもう たいちょう はっきょう
      `,
  }),
  ...entries({
    reason: "third-pass-legal-political-or-civic",
    words: `
        けいやく こっか とりひき けんり しょうこ ぜい ぎむ ぎょうせい
        きそく きてい めんきょ じち ごうい せいとう つうほう こくりつ
        ぎかい こくえい こくせい かくりょう ほうせい じゅんさ けつぎ
        はんれい もうしたて こっき あいこく ぼこく そこく たこく
        たいこく やくしょ やくしょく げんこく かけつ とくひょう
        ちょうかい けんさつ ゆうざい むざい じょうれい べんご
        きょうじゅつ せんこく しっこう ていけつ
      `,
  }),
  ...entries({
    reason: "third-pass-finance-tax-or-accounting",
    words: `
        しゅうにゅう きゅうりょう しはらい きんがく つうか しへい
        かけい こぜに きんこ ねさげ ねあげ ねびき ぶっか もうける
        もうかる ししゅつ へんさい さいむ しょとく かんさ かかく
        しょうひ しじょう ひよう ていか げつがく やすね
      `,
  }),
  ...entries({
    reason: "third-pass-military-violence-crime-or-disaster",
    words: `
        やり ゆみ かんたい じえい せんご せんりゃく せめ あらそい
        けいび けいじ けいかい だっしゅつ いじめ しゅつどう
        きょうぼう ちょうはつ ちょうえき ぼうご ぼうび しゅりょう
        しきょ ざいあく けんどう からて
      `,
  }),
  ...entries({
    reason: "third-pass-religion-or-occult",
    words: "ようせい せいれい まもの まりょく みこと しと",
  }),
  ...entries({
    reason: "third-pass-software-hardware-or-jargon",
    words: `
        けんさく とうろく せってい しょり せつぞく にゅうりょく
        たんまつ じっそう しゅつりょく へんすう かくちょう そうち
      `,
  }),
  ...entries({
    reason: "third-pass-generated-looking-compound",
    words: `
        たけこづつみ きこづつみ かみこづつみ いとこづつみ
        たけこぶくろ きこぶくろ かみこぶくろ いとこぶくろ
        まめこぶくろ こめこぶくろ むぎこぶくろ はっぱこぶくろ
        はなこぶくろ くさこぶくろ
      `,
  }),
  ...entries({
    reason: "fourth-pass-medical-body-or-anatomy",
    words: "ぞうき たいしゃ",
  }),
  ...entries({
    reason: "fourth-pass-identity-place-title-or-royalty",
    words: `
        くに がいこく こくない こくないがい くにぐに しゅと みんぞく
        みょうじ おう ひめ おうじ じょおう との はくしゃく おうひ
        おうじゃ おうざ しゃちょう かいちょう ぶちょう せんちょう
        がくちょう
      `,
  }),
  ...entries({
    reason: "fourth-pass-legal-political-civic-or-finance",
    words: `
        りえき ゆうし きょか ほしょう しんせい けんりょく れんぽう
        がいこう うったえ こよう せいきゅう わりびき かせぐ じょうと
        ちょうしゅう きゅうふ かいやく しょうだく ちんたい めんじょ
        しょうほう たがく しんたく てっぱい かくぎ かねもち まずしい
        びんぼう ふごう
      `,
  }),
  ...entries({
    reason: "fourth-pass-military-violence-crime-disaster-or-death",
    words: `
        めいれい しれい はっしゃ かいぞく かいじゅう かいぶつ めつぼう
        とどめ ぜっきょう ぶじょく ぞうお ほろび まいそう そうしき
      `,
  }),
  ...entries({
    reason: "fourth-pass-religion-occult-or-ritual",
    words: "みや おんりょう めいそう",
  }),
  ...entries({
    reason: "fourth-pass-software-technical-jargon",
    words: "けいたい はいれつ ざひょう",
  }),
  ...entries({
    confidence: "medium-high",
    reason: "fourth-pass-generated-looking-or-malformed",
    words: `
        きさら きたな きつくえ きござ きかさ きひがさ きなふだ
        きえふだ きまきもの きつつみ きとじひも きおてだま
        きおりがみ ききりえ きちぎりえ ききゅうす
      `,
  }),
  ...entries({
    reason: "fifth-pass-body-or-anatomy",
    words: "くちびる てくび かみのけ くろかみ まえがみ えら",
  }),
  ...entries({
    reason: "fifth-pass-title-royalty-identity-place-or-demonym",
    words: `
        せんせい はかせ きょうじゅ ぎちょう こうちょう てんちょう
        かんちょう いんちょう かちょう だんちょう しょちょう
        ばんちょう こくおう おうじょ おうこく おうべい かんとく
        せんしゅ せんぱい よこづな りきし ぜんこく こくさい かいがい
      `,
  }),
  ...entries({
    reason: "fifth-pass-legal-political-finance-or-negative",
    words: `
        けいざい かくめい じょうやく きやく ぜいこみ きんり しはらう
        ほうしゅう ついほう ふほう しゃくほう えいり ゆうふく
        ちょうじゃ げっしゅう たいきょ はんそく はんする おきて
        ぜつぼう しつぼう くのう ざせつ さいてい めいわく ひどい
        じゃま ずるい ずる いつわり きょぎ なさけない だいなし
        きょひ むりょく
      `,
  }),
  ...entries({
    reason: "fifth-pass-threat-violence-or-distress",
    words: `
        ひめい さけび さけぶ しょうげき あっぱく けいほう ぼうそう
        とらえる おいだし まっしょう かっとう
      `,
  }),
  ...entries({
    reason: "sixth-pass-adult-relationship-medical-body-or-symptom",
    words: "かれ つめ ほお くうふく やせる もうそう げんかく",
  }),
  ...entries({
    reason: "sixth-pass-death-ritual-occult-or-legal-political-civic",
    words: `
        いれい ついとう にんぎょ ばけ こうふ しゅつば にゅうたい
        はばつ こっこう もんぶ
      `,
  }),
  ...entries({
    reason: "sixth-pass-place-institution-corporate-or-negative",
    words: `
        とうだい ちめい めいしょ しゃめい へいしゃ ふはい けんお
        ぼうめい ろうえい とうわく
      `,
  }),
  ...entries({
    reason: "seventh-pass-negative-insult-distress",
    words: `
        がき だめ わるい むり いや まけ むだ こまる はずかしい なやみ
        あっか へた くろう うるさい むなしい さびしい いらいら しっと
        あやしい そんがい にせ ぎわく きつい まける ふのう かなしみ
        うしなう ひげき くずれ くるしい はいぼく ざつ さわぎ まよい
        かなし あくむ やっかい くるしみ ぎそう しっかく しつぎょう
        うんざり こんわく きょぜつ だまし はきけ あくい ぐち しんどい
        ひきょう むのう とらわれ やぶれ きらう ふちょう ぜいじゃく
        あわれ ためいき あやまち くるい かしつ すさまじい せつない
        さっかく
      `,
  }),
  ...entries({
    reason: "seventh-pass-finance-legal-political-identity-corporate",
    words: `
        うりあげ ばいきゃく かいけい ざいせい ばいしゅう そうぞく
        いたく とっきょ てんばい きゅうよ しゅうえき あかじ けっさい
        ざいむ かわせ けいひ にゅうさつ めいがら もうけ じゅちゅう
        こくせき かっこく とうきょく じんしゅ ざいにち にゅうこく
        しょうひょう きみつ こくゆう ぜんべい じつめい ほんみょう
        あだな べつめい ほんしゃ とうしゃ しゃない かくしゃ
      `,
  }),
  ...entries({
    reason: "seventh-pass-medical-body-religion-death-occult-or-violence",
    words: `
        ないぞう ふしょう あんま たいない じんたい けあな てあて
        はっしょう かんせつ せいたい べんき けいぶ きせき いのる はか
        ぼうず ぼち せっきょう さんぱい ぼくし しゅくふく けんじゃ
        かさい わな たいけつ たおす ぼうぎょ にんじゃ さむらい
        かいめつ きょうき ひょうてき ごえい ていさつ じゅうどう
        でんげき よろい ふんか しっそう ほかく たいじ せんにゅう
        ぶし くんしょう
      `,
  }),
  ...entries({
    reason: "seventh-pass-software-technical-jargon-or-malformed",
    words: `
        あんごう すうち かんすう しすう しひょう たんし だいすう
        ていすう けいすう でんりゅう でんあつ でんじ こうあつ おんぱ
        ぶつり りけい りつ しゃ しゅ ほんと やっぱ ちょい とんでも
        ごく じゃく ぞく まぢか おた あんだ ちと べた ぶつ とつ
        ずい へき めんどい ばあ
      `,
  }),
  ...entries({
    reason: "eighth-pass-finance-commerce-corporate",
    words: `
        かいしゃ きぎょう はつばい はんばい こうにゅう よやく こうこく
        こきゃく しょうぎょう ざいこ ねんしゅう ちょうたつ しょうばい
        ぼうえき しゅっか じきゅう かいとり ふさい はんがく はっちゅう
        うりば
      `,
  }),
  ...entries({
    reason: "eighth-pass-legal-political-civic",
    words: `
        ようぎ ちょさく じゅうしょ しょゆう しょじ こっきょう きふ
        ばいしょう もちぬし ほゆう こくど けんい にんか うったえる
        たんぽ
      `,
  }),
  ...entries({
    reason: "eighth-pass-medical-body-health-or-identity",
    words: `
        ねつ えいよう やせ きゅうきゅう よぼう たいしつ しんりょう
        あご ひげ きんぱつ ひやけ めす
      `,
  }),
  ...entries({
    reason: "eighth-pass-violence-disaster-crime-threat-or-negative",
    words: `
        ひさい けいこく ぜつめつ きゅうじょ ぼうさい くつう はんこう
        ぶしょう むりやり ゆうがい つぶす くるしむ つぶれ まいご
        もんだい うそ しんぱい ごみ やろう めちゃくちゃ あくしつ
        にせもの わるぐち おろか くやしい くじょう むしょく かこく
        しょうしつ
      `,
  }),
  ...entries({
    reason: "eighth-pass-software-media-place-or-malformed",
    words: `
        どうが がぞう でんわ でんし つうち じまく ばいたい えき
        えきまえ くうこう ばんぱく からおけ ばいばい けたい いお
        ぶい
      `,
  }),
  ...entries({
    reason: "ninth-pass-political-legal-civic",
    words: `
        やとう たいし しょめい ろうどう ざんぎょう じんじ じしょく
        にんめい めいぼ じょうむ みんえい じしゅく
      `,
  }),
  ...entries({
    reason: "ninth-pass-commerce-finance-industrial-or-medical",
    words:
      "しいれ せったい ゆうりょう げんゆ きゅうゆ しわ びよう けしょう かび",
  }),
  ...entries({
    reason: "ninth-pass-violence-negative-user-hostile",
    words: `
        たたく くじょ はいじょ にげる さまたげ そがい いんぺい ごくひ
        くろまく ふとう ふりょう はずれ つぶし だったい れんぱい
      `,
  }),
  ...entries({
    reason: "ninth-pass-software-technical-media",
    words:
      "せいぎょ ぞくせい じっこう ふくせい てんぷ さくじょ ろくが いんさつ",
  }),
  ...entries({
    reason: "ninth-pass-fragments-malformed-or-names",
    words:
      "きえ たけえ まめえ あで おも とめ ふれ ちら てい ごび かそ ひこ ざい ふよ びみ きよ",
  }),
  ...entries({
    reason: "tenth-pass-gambling-or-medical-body",
    words: `
        きさいころ たけさいころ かみさいころ いとさいころ せき つかれ
        つかれる ふるえ ふるえる ひとみ こぶし りょうて みぎて ひだりて
        つら てさき はみがき
      `,
  }),
  ...entries({
    reason: "tenth-pass-legal-political-civic-place-or-software-security",
    words: `
        こうほ きせい きょうせい ふくし しんがい しゅっしょ けんない
        とない こくがい しょこく りょうど こくどう いせき そうさ
        かんし きどう にんしょう かいどく
      `,
  }),
  ...entries({
    reason: "tenth-pass-finance-commerce-industrial",
    words: `
        はらう はらい かせぎ かせげる かくやす うりきれ せきゆ じゅきゅう
        ぶつりゅう さいくつ ばいよう ようせつ ゆにゅう ゆしゅつ
        りゅうつう そうりょう そんしつ とみ こづかい
      `,
  }),
];
