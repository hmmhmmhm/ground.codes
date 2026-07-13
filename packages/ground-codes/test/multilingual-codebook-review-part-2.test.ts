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
  test("keeps reviewed Korean codebook terms out", () => {
    assertCodebook({
      words: koreanWords,
      expectedLength: 5630,
      blockedWords: [
        "병",
        "암",
        "전쟁",
        "범죄",
        "강도",
        "사기",
        "무기",
        "화투",
        "복권",
        "격투기",
        "바이러스",
        "차별",
        "증오",
        "저주",
        "우울",
        "부상",
        "화상",
        "병원",
        "병력",
        "병리",
        "발병",
        "병증",
        "의료",
        "치료",
        "환자",
        "진단",
        "검진",
        "검체",
        "아픔",
        "주사기",
        "면도칼",
        "물총",
        "검도",
        "검무",
        "연애",
        "애인",
        "돼지",
        "돼지고기",
        "돼지국밥",
        "피부",
        "피부과",
        "정치",
        "정당",
        "선거",
        "투표",
        "교회",
        "사찰",
        "신부",
        "신앙",
        "제사",
        "귀신",
        "쇼",
        "죽",
        "벗",
        "신",
        "왕",
        "신라",
        "백제",
        "북신",
        "남산",
        "한강",
        "낙동",
        "낙동강",
        "한라",
        "독도",
        "브라운",
        "아이라이너",
        "하이라이터",
        "포트폴리오",
        "사운드트랙",
        "뮤직비디오",
        "기타리스트",
        "피아니스트",
        "필로덴드론",
        "페퍼로미아",
        "스파티필럼",
        "드라카에나",
        "산세베리아",
        "스킨답서스",
        "버거킹",
        "랭킹",
        "워킹",
        "베이킹",
        "스피닝",
        "튜토리얼",
        "레스토랑",
        "주사",
        "눈병",
        "장애물",
        "화병",
        "쇼핑",
        "쇼팽",
        "피규어",
        "컨투어",
        "패션쇼",
        "오토바이",
        "토너먼트",
        "브라우니",
        "칼라",
        "칼로",
        "검사",
        "검토",
        "점검",
        "검색",
        "검증",
        "너른고운결",
        "소담한고운결",
        "따스한고운결",
        "소담한은은함",
        "따스한은은함",
        "너른한걸음",
        "소담한한걸음",
        "따스한한걸음",
        "너른나무향",
        "너른은은함",
        "소담한나무향",
        "따스한나무향",
        "고운나무상자",
        "맑은나무상자",
        "고운구름빛",
        "고운결",
        "정겨운흙담",
        "정겨운꽃길",
        "정겨운나루터",
        "푸른미리내",
        "고운라온",
        "맑은아람",
        "소담한실꾸리",
        "너른나무결",
        "차분한붓끝",
        "맑은글밭",
        "꿈",
        "줄",
        "형",
        "점",
        "장",
        "공",
        "구",
        "도",
        "로",
        "읍",
        "백도",
        "흑산",
        "홍도",
        "부천",
        "삼성",
        "인도",
        "파리",
        "실꾸리",
        "탭",
        "토크",
        "드론",
        "세션",
        "부스",
        "미션",
        "패션",
        "네트워크",
        "프로그램",
        "모바일",
        "슬롯",
        "당뇨",
        "찬기",
        "면기",
        "탕기",
        "도기",
        "포인세티아",
        "트릭",
        "게임",
        "시트",
        "코스",
        "카드",
        "모델",
        "뉴스",
        "테마",
        "차트",
        "히트",
        "멤버",
        "클럽",
        "캠프",
        "트랙",
        "비트",
        "커버",
        "믹스",
        "트램",
        "빌딩",
        "버그",
        "노트",
        "아트",
        "타일",
        "헬스",
        "코치",
        "코어",
        "스릴",
        "펌프",
        "라인",
        "빌라",
        "모터",
        "쿠페",
        "트럭",
        "옵션",
        "모텔",
        "로비",
        "피트",
        "카트",
        "코너",
        "로고",
        "스프",
        "버전",
        "스텝",
        "체스",
        "채팅",
        "포트",
        "모드",
        "데모",
        "버튼",
        "메일",
        "스팸",
        "라켓",
        "스틱",
        "뷔페",
        "메뉴",
        "카펫",
        "코트",
        "타이",
        "벨트",
        "모던",
        "코디",
        "데님",
        "니트",
        "도트",
        "모듈",
        "로그",
        "페달",
        "미팅",
        "보스",
        "스냅",
        "디스",
        "큐브",
        "서브",
        "모션",
        "웹툰",
        "액션",
        "필라",
        "세팅",
        "퓨전",
        "박스",
        "마커",
        "회로",
        "로프",
        "로드",
        "슈팅",
        "타워",
        "마작",
        "마블",
        "루미",
        "매트",
        "로잉",
        "쿠션",
        "루어",
        "악마",
      ],
    });
  });
});
