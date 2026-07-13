import assert from "node:assert/strict";
import { describe, test } from "node:test";

import chineseWords from "@repo/codebook/codebook-dist/chinese.json";
import englishWords from "@repo/codebook/codebook-dist/english.json";
import japaneseWords from "@repo/codebook/codebook-dist/japanese.json";
import koreanWords from "@repo/codebook/codebook-dist/korean.json";
import spanishWords from "@repo/codebook/codebook-dist/spanish.json";
import frenchWords from "@repo/codebook/codebook-dist/french.json";
import germanWords from "@repo/codebook/codebook-dist/german.json";
import portugueseWords from "@repo/codebook/codebook-dist/portuguese.json";
import indonesianWords from "@repo/codebook/codebook-dist/indonesian.json";
import thaiWords from "@repo/codebook/codebook-dist/thai.json";
import vietnameseWords from "@repo/codebook/codebook-dist/vietnamese.json";
import hindiWords from "@repo/codebook/codebook-dist/hindi.json";
import arabicWords from "@repo/codebook/codebook-dist/arabic.json";
import russianWords from "@repo/codebook/codebook-dist/russian.json";
import swahiliWords from "@repo/codebook/codebook-dist/swahili.json";
import filipinoWords from "@repo/codebook/codebook-dist/filipino.json";
import hausaWords from "@repo/codebook/codebook-dist/hausa.json";
import bengaliWords from "@repo/codebook/codebook-dist/bengali.json";
import urduWords from "@repo/codebook/codebook-dist/urdu.json";
import amharicWords from "@repo/codebook/codebook-dist/amharic.json";
import burmeseWords from "@repo/codebook/codebook-dist/burmese.json";
import khmerWords from "@repo/codebook/codebook-dist/khmer.json";
import nepaliWords from "@repo/codebook/codebook-dist/nepali.json";
import somaliWords from "@repo/codebook/codebook-dist/somali.json";
import pashtoWords from "@repo/codebook/codebook-dist/pashto.json";
import lingalaWords from "@repo/codebook/codebook-dist/lingala.json";

const assertBlockedWordsAbsent = (words: string[], blockedWords: string[]) => {
  const blocked = new Set(blockedWords);
  assert.deepEqual(
    words.filter((word) => blocked.has(word)),
    [],
  );
};

const assertWordsPresent = (words: string[], expectedWords: string[]) => {
  const available = new Set(words);
  assert.deepEqual(
    expectedWords.filter((word) => !available.has(word)),
    [],
  );
};

const germanTemplateCompoundPattern =
  /^[A-Z][a-z]{3,}(?:band|bank|becher|beet|beutel|blatt|blech|brett|bund|dose|eimer|faden|fass|feld|fliese|gabel|glas|griff|haken|hut|kachel|kanne|karton|kasten|kelle|kerze|kiste|klotz|knopf|korb|kranz|kreide|krug|lampe|leiste|mappe|matte|messer|nadel|papier|perle|pfanne|pfeife|pinsel|platte|polster|rahmen|riegel|ring|rohr|sack|schale|seil|sieb|sohle|spange|spatel|spiegel|spule|steg|stein|stift|tafel|tasche|tasse|tisch|topf|truhe|vlies|wagen)$/u;
const portugueseTemplateCompoundPattern =
  /^[A-Z][a-z]{3,}(?:anel|banco|bandeja|bastao|bau|bolsa|botao|brocha|caixa|cesta|cesto|chave|copo|corda|cuba|cuia|escova|esteira|fita|folha|frasco|gancho|jarra|lata|livro|lona|luz|mapa|marco|mesa|pano|pote|prato|rede|saco|selo|suporte|tabua|tampa|tela|tigela|vaso|vela)$/u;
const assertScriptCodebook = ({
  words,
  pattern,
  expectedWords,
  blockedWords,
}: {
  words: string[];
  pattern: RegExp;
  expectedWords: string[];
  blockedWords: string[];
}) => {
  assert.equal(words.length, 5000);
  assert.equal(new Set(words).size, words.length);
  assert.deepEqual(
    words.filter((word) => !pattern.test(word)),
    [],
  );
  assertWordsPresent(words, expectedWords);
  assertBlockedWordsAbsent(words, blockedWords);
};

const assertCodebook = ({
  words,
  expectedLength,
  blockedWords,
}: {
  words: string[];
  expectedLength: number;
  blockedWords: string[];
}) => {
  assert.equal(words.length, expectedLength);
  assert.equal(new Set(words).size, words.length);

  assertBlockedWordsAbsent(words, blockedWords);
};

describe("reviewed multilingual codebooks", () => {
  test("keeps reviewed Chinese codebook terms out", () => {
    assertCodebook({
      words: chineseWords,
      expectedLength: 5140,
      blockedWords: [
        "战争",
        "战斗",
        "战场",
        "战术",
        "战役",
        "战舰",
        "战士",
        "战队",
        "战",
        "刀",
        "刀具",
        "小刀",
        "水枪",
        "盗贼",
        "彩票",
        "麻将",
        "伤病",
        "病",
        "丑",
        "政治",
        "失败",
        "药",
        "血",
        "血液",
        "血管",
        "哺乳",
        "佛",
        "佛像",
        "寺",
        "军棋",
        "扣杀",
        "抢断",
        "京东",
        "颐和园",
        "圆明园",
        "帝国",
        "国庆",
        "魔王",
        "魔兽",
        "魔物",
        "小丑",
        "麻",
        "色",
        "是",
        "和",
        "人",
        "马",
        "龙",
        "花",
        "灯",
        "鼓",
        "乐",
        "旗",
        "彩",
        "节",
        "庆",
        "音",
        "曲",
        "标枪",
        "政",
        "政策",
        "挑战",
        "挑战者",
        "雷鬼",
        "魔法",
        "魔力",
        "步",
        "行",
        "场",
        "面",
        "口",
        "手",
        "头",
        "心",
        "门",
        "东",
        "北",
        "剪刀",
        "冰刀",
        "刀豆",
        "指甲刀",
        "青园",
        "青亭",
        "翠谷",
        "晴岚",
        "梅溪",
        "兰溪",
        "青溪",
        "碧溪",
        "林溪",
        "花桥",
        "兰亭",
        "雨巷",
        "雕塑园",
        "柳庭",
        "星野",
        "云舟",
        "月泉",
        "香径",
        "青篱",
        "梅枝",
        "兰草",
        "微博",
        "微信",
        "抖音",
        "知乎",
        "豆瓣",
        "美团",
        "网易",
        "搜狐",
        "新浪",
        "腾讯",
        "百度",
        "阿里",
        "小米",
        "华为",
        "淘宝",
        "小红书",
        "拼多多",
        "爱奇艺",
        "海南",
        "桂林",
        "庐山",
        "丽江",
        "九寨沟",
        "兵马俑",
        "大雁塔",
        "长江",
        "黄河",
        "松花江",
        "黑龙江",
        "黄浦江",
        "微雨",
        "云岚",
        "月湾",
        "花坞",
        "柳岸",
        "兰舟",
        "芳洲",
        "碧潭",
        "远帆",
        "香林",
        "小星",
        "小日",
        "大凤",
        "大狮",
        "大鳄",
        "香荔",
        "香樱",
        "酸荔枝",
        "黑荔枝",
        "黑花生",
        "溆",
        "渟",
        "瀣",
        "鳙",
        "槭",
        "薏苡仁",
        "透闪石",
        "重晶石",
      ],
    });
  });

  test("keeps latest Korean sub-agent review findings out", () => {
    assertBlockedWordsAbsent(koreanWords, [
      "트레",
      "칼라디움",
      "프로코",
      "체",
      "채",
      "카혼",
      "당귀",
      "기기",
      "코코",
      "력",
      "울릉",
      "에잇",
      "시뮬",
      "트레드밀",
      "트레이닝",
      "린넨",
      "페튜니아",
      "게시",
      "던전",
      "아마씨",
      "페북",
      "가스펠",
      "스크래블",
      "케이퍼",
      "스티치",
      "드뷔시",
      "베르가못",
      "넷마블",
      "시약",
      "약학",
      "약물",
      "약제",
      "약품",
      "의약",
      "약리",
      "작약",
      "인삼",
      "약초",
      "한약",
      "드럼",
      "첼로",
      "바이올린",
      "하모니카",
      "마라카스",
      "타악기",
      "관악기",
      "현악기",
      "여의도",
      "맥도날드",
      "서브웨이",
      "롤렉스",
      "스와치",
      "브레게",
      "프로세스",
      "프로그래밍",
      "프린터",
      "카탈로그",
      "아카이브",
      "업데이트",
      "디스플레이",
      "스키머신",
      "프로젝트",
      "컨퍼런스",
      "카테고리",
      "스도쿠",
      "스크래블",
      "루미큐브",
      "트럼프",
      "스페이드",
      "고스톱",
      "상상",
      "촉촉",
      "주주",
      "지지",
      "부부",
      "차차",
      "수수",
      "바바",
      "일일",
      "매매",
      "강강",
      "잣",
      "플록스",
      "도토리토리",
      "도토리걸이",
      "토기묶음",
      "섞기",
      "자개쌀독",
      "호박자",
    ]);
  });

  test("keeps uncommon Korean chaeban family terms out", () => {
    assert.deepEqual(
      koreanWords.filter((word) => /[채체]반/u.test(word)),
      [],
    );
  });

  test("keeps approved restored Korean everyday terms in", () => {
    assertWordsPresent(koreanWords, [
      "테이블",
      "테이프",
      "스카프",
      "포스터",
      "스티커",
      "아이스크림",
      "피스타치오",
      "디저트",
      "피아노",
      "테니스",
      "마라톤",
      "콘서트",
      "클래식",
      "사진첩",
    ]);

    assertBlockedWordsAbsent(koreanWords, [
      "나무고리짝",
      "나무자배기",
      "나무옹배기",
      "들꽃동곳",
      "솔방울묶음",
      "연잎고리짝",
      "연잎자배기",
      "연잎옹배기",
      "호박끌",
      "솔방울꼬챙이",
      "솔방울꽂개",
      "솔방울걸개",
      "호박쌀독",
      "한지도장집",
    ]);
  });
});
