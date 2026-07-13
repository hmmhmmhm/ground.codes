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
  test("replaces generated Korean material compounds with concrete everyday terms", () => {
    assertWordsPresent(koreanWords, [
      "머그잔",
      "프라이팬",
      "국자",
      "서랍장",
      "신발장",
      "컵받침",
      "접시받침",
      "앞치마",
      "탄산수",
      "레몬차",
      "시리얼",
      "요구르트",
      "카스텔라",
      "티슈",
      "휴지통",
      "세면대",
      "샤워기",
      "비누받침",
      "빨래집게",
      "세탁비누",
      "설거지솔",
      "수세미",
      "밀대",
      "쓰레받기",
      "빨래망",
      "세숫대야",
      "세탁솔",
      "먼지털이",
      "구둣솔",
      "옷핀",
      "바늘집",
      "반짇함",
      "끈신발",
      "장화끈",
      "열쇠함",
      "문손잡이",
      "초인종",
      "현관매트",
      "발매트",
      "탁상등",
      "보냉백",
      "보온컵",
      "머리끈",
      "머리핀",
      "안경집",
      "안경닦이",
      "동전지갑",
      "카드지갑",
      "에코백",
      "토트백",
    ]);

    assertBlockedWordsAbsent(koreanWords, [
      "솔방울꾸러미",
      "솔방울타래",
      "갈대실타래",
      "나무종발",
      "나무대패",
      "나무송곳",
      "솔방울덮개",
      "솔방울뚜껑",
      "솔방울받침대",
      "나무빗살",
      "호박송곳",
      "솔방울자",
      "솔방울함지",
      "솔방울광주리",
      "솔방울개비",
      "솔방울쪽",
      "나무토리",
      "나무말이",
      "연잎종발",
      "솔방울쪽지",
      "연잎목판",
      "대나무빗살",
      "연잎대패",
      "솔방울덮보",
      "솔방울손잡이",
      "솔방울굽",
      "솔방울받침돌",
      "대나무토리",
      "솔방울빗살",
      "솔방울토리",
      "솔방울말이",
      "나무함지",
      "나무목판",
      "대나무말이",
      "종이빗살",
      "나무받침대",
      "나무굽",
      "종이토리",
      "종이함지",
      "종이목판",
      "종이받침대",
      "한지붓통",
      "한지필통",
      "수정절구",
      "한지실패",
      "한지실타래",
      "한지꾸러미",
      "연잎송곳",
      "버들실타래",
      "종이말이",
    ]);
  });

  test("continues Korean cleanup across rare terms and weak address words", () => {
    assertWordsPresent(koreanWords, [
      "손거울",
      "벽시계",
      "탁상시계",
      "사진틀",
      "노트장",
      "연습장",
      "볼펜",
      "만년필",
      "형광펜",
      "사인펜",
      "색연필통",
      "필통집",
      "책받침대",
      "서류함",
      "테이프심",
      "스티커북",
      "앨범장",
      "액자틀",
      "화분받침",
      "화병받침",
      "밥주걱",
      "뒤집개",
      "계량컵",
      "계량스푼",
      "주방타월",
      "컵홀더",
      "보온도시락",
      "휴대가방",
      "손가방",
      "캐리어",
      "레인코트",
      "잠옷",
      "실내화",
      "양말짝",
      "장갑짝",
      "털모자",
      "야구모자",
      "샤워커튼",
      "목욕수건",
      "발수건",
      "빨래비누",
      "세숫비누",
      "손비누",
      "비누갑",
      "칫솔통",
      "양치컵",
      "세면컵",
      "수납장",
      "소금병",
      "후추통",
      "기름병",
      "식초병",
      "주방장갑",
      "냄비장갑",
      "행주걸이",
      "수저통",
      "젓가락통",
      "숟가락통",
      "접시꽂이",
      "그릇장",
      "찬장",
      "찻숟가락",
      "과일접시",
      "샐러드볼",
      "빵칼",
      "도마받침",
      "냄비집게",
      "병따개",
      "캔따개",
      "주걱받침",
      "식힘망",
      "쿠키틀",
      "머핀틀",
      "케이크틀",
      "얼음틀",
      "도시락가방",
      "보온가방",
      "물병주머니",
      "컵주머니",
      "신발주머니",
      "빨래봉투",
      "세탁바구니",
      "빨래통",
      "청소솔",
      "바닥솔",
      "먼지떨이",
      "걸레받이",
      "분리수거함",
      "수납상자",
      "양말상자",
      "장갑상자",
      "모자걸이",
      "옷걸이대",
      "옷솔",
      "구두주걱",
      "신발솔",
      "우산꽂이",
      "우산집",
      "선물상자",
    ]);

    assertBlockedWordsAbsent(koreanWords, [
      "수정자배기",
      "비단토리",
      "잔디함지",
      "잔디개비",
      "잔디덮보",
      "나무조롱",
      "나무광목포",
      "잔디토리",
      "무명토리",
      "나무동곳",
      "대나무고리짝",
      "대나무자배기",
      "대나무옹배기",
      "대나무종발",
      "대나무함지",
      "나무개비",
      "나무덮보",
      "대나무조롱",
      "대나무광목포",
      "삼베토리",
      "대나무개비",
      "대나무동곳",
      "종이고리짝",
      "이끼함지",
      "종이자배기",
      "한지함지",
      "종이옹배기",
      "종이종발",
      "이끼개비",
      "연잎함지",
      "대나무덮보",
      "종이개비",
      "연잎개비",
      "연잎덮보",
      "연잎토리",
      "이끼덮보",
      "종이조롱",
      "종이광목포",
      "이끼토리",
      "종이동곳",
      "비단고리짝",
      "비단자배기",
      "비단옹배기",
      "비단종발",
      "비단조롱",
      "구리조롱",
      "종이덮보",
      "비단광목포",
      "비단개비",
      "비단덮보",
      "한지덮개",
      "나무받침돌",
      "나무공이",
      "들꽃막대",
      "나무자",
      "대나무받침대",
      "삼베붓통",
      "삼베필통",
      "대나무목판",
      "대나무대패",
      "대나무자",
      "연잎장식",
      "연잎막대",
      "대나무송곳",
      "갈대장식",
      "종이자",
      "삼베실패",
      "나무광주리",
      "나무쪽",
      "나무쪽지",
      "나무걸개",
      "대나무절구",
      "삼베빗살",
      "대나무공이",
      "대나무광주리",
      "정겨운물결",
      "정겨운냇물",
      "정겨운강물",
      "푸른달빛",
      "푸른붓끝",
      "푸른들녘",
      "푸른자갈",
      "푸른샘물",
      "푸른꽃잎",
      "고운가람",
      "고운미리내",
      "푸른나무",
      "고운한울",
      "푸른솔잎",
      "정겨운햇살",
      "결정",
      "과정",
      "안정",
      "노력",
      "공감",
      "선",
      "상",
      "면",
      "운",
      "대",
    ]);
  });
});
