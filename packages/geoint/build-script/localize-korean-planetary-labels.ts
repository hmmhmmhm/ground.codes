import fs from "fs";
import path from "path";

type RegionRow = {
  name: string;
  code: string;
  lat: number;
  long: number;
  population?: number;
  countryCode?: string;
  body?: "earth" | "moon" | "mars";
  featureType?: string;
  diameterKm?: number;
  source?: string;
  sourceId?: string;
  regionKind?: string;
  referenceDistanceKm?: number;
};

const regionDist = path.join(process.cwd(), "region-dist");

const tokenMap = new Map<string, string>([
  ["alba", "알바"],
  ["arabia", "아라비아"],
  ["australe", "아우스트랄레"],
  ["cerberus", "케르베루스"],
  ["elysium", "엘리시움"],
  ["gale", "게일"],
  ["gusev", "구세프"],
  ["hellas", "헬라스"],
  ["lunicus", "루니쿠스"],
  ["mare", "바다"],
  ["marineris", "마리네리스"],
  ["olympus", "올림푸스"],
  ["ophir", "오피르"],
  ["phison", "피손"],
  ["syrtis", "시르티스"],
  ["tarsis", "타르시스"],
  ["tharsis", "타르시스"],
  ["utopia", "유토피아"],
  ["a", "에이"],
  ["b", "비"],
  ["c", "시"],
  ["d", "디"],
  ["e", "이"],
  ["f", "에프"],
  ["g", "지"],
  ["h", "에이치"],
  ["i", "아이"],
  ["j", "제이"],
  ["k", "케이"],
  ["l", "엘"],
  ["m", "엠"],
  ["n", "엔"],
  ["o", "오"],
  ["p", "피"],
  ["q", "큐"],
  ["r", "알"],
  ["s", "에스"],
  ["t", "티"],
  ["u", "유"],
  ["v", "브이"],
  ["w", "더블유"],
  ["x", "엑스"],
  ["y", "와이"],
  ["z", "지"],
]);

const hangulUnits: Array<[RegExp, string]> = [
  [/^sch/, "슈"],
  [/^tch/, "치"],
  [/^ch/, "치"],
  [/^sh/, "시"],
  [/^th/, "트"],
  [/^ph/, "프"],
  [/^gh/, "그"],
  [/^kh/, "크"],
  [/^qu/, "쿠"],
  [/^ck/, "크"],
  [/^ng/, "응"],
  [/^ny/, "니"],
  [/^tion/, "션"],
  [/^sion/, "션"],
  [/^cia/, "시아"],
  [/^tia/, "티아"],
  [/^ya/, "야"],
  [/^yu/, "유"],
  [/^yo/, "요"],
  [/^ja/, "자"],
  [/^ju/, "주"],
  [/^jo/, "조"],
  [/^fa/, "파"],
  [/^fi/, "피"],
  [/^fe/, "페"],
  [/^fo/, "포"],
  [/^va/, "바"],
  [/^vi/, "비"],
  [/^ve/, "베"],
  [/^vo/, "보"],
  [/^wi/, "위"],
  [/^we/, "웨"],
  [/^wo/, "워"],
  [/^x/, "크스"],
  [/^ce/, "세"],
  [/^ci/, "시"],
  [/^cy/, "시"],
  [/^ca/, "카"],
  [/^co/, "코"],
  [/^cu/, "쿠"],
  [/^ge/, "제"],
  [/^gi/, "지"],
  [/^gy/, "지"],
  [/^ga/, "가"],
  [/^go/, "고"],
  [/^gu/, "구"],
  [/^si/, "시"],
  [/^ti/, "티"],
  [/^tu/, "투"],
  [/^di/, "디"],
  [/^du/, "두"],
  [/^la/, "라"],
  [/^li/, "리"],
  [/^lu/, "루"],
  [/^le/, "레"],
  [/^lo/, "로"],
  [/^ra/, "라"],
  [/^ri/, "리"],
  [/^ru/, "루"],
  [/^re/, "레"],
  [/^ro/, "로"],
  [/^ba/, "바"],
  [/^bi/, "비"],
  [/^bu/, "부"],
  [/^be/, "베"],
  [/^bo/, "보"],
  [/^pa/, "파"],
  [/^pi/, "피"],
  [/^pu/, "푸"],
  [/^pe/, "페"],
  [/^po/, "포"],
  [/^ma/, "마"],
  [/^mi/, "미"],
  [/^mu/, "무"],
  [/^me/, "메"],
  [/^mo/, "모"],
  [/^na/, "나"],
  [/^ni/, "니"],
  [/^nu/, "누"],
  [/^ne/, "네"],
  [/^no/, "노"],
  [/^ha/, "하"],
  [/^hi/, "히"],
  [/^hu/, "후"],
  [/^he/, "헤"],
  [/^ho/, "호"],
  [/^sa/, "사"],
  [/^su/, "수"],
  [/^se/, "세"],
  [/^so/, "소"],
  [/^za/, "자"],
  [/^zu/, "주"],
  [/^ze/, "제"],
  [/^zo/, "조"],
  [/^ta/, "타"],
  [/^te/, "테"],
  [/^to/, "토"],
  [/^da/, "다"],
  [/^de/, "데"],
  [/^do/, "도"],
  [/^ka/, "카"],
  [/^ki/, "키"],
  [/^ku/, "쿠"],
  [/^ke/, "케"],
  [/^ko/, "코"],
  [/^wa/, "와"],
  [/^a/, "아"],
  [/^e/, "에"],
  [/^i/, "이"],
  [/^o/, "오"],
  [/^u/, "우"],
  [/^b/, "브"],
  [/^c/, "크"],
  [/^d/, "드"],
  [/^f/, "프"],
  [/^g/, "그"],
  [/^h/, "흐"],
  [/^j/, "지"],
  [/^k/, "크"],
  [/^l/, "르"],
  [/^m/, "므"],
  [/^n/, "느"],
  [/^p/, "프"],
  [/^q/, "쿠"],
  [/^r/, "르"],
  [/^s/, "스"],
  [/^t/, "트"],
  [/^v/, "브"],
  [/^w/, "우"],
  [/^y/, "이"],
  [/^z/, "즈"],
];

const normalizeAscii = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "");

const transliterateLatinToken = (token: string) => {
  const normalized = normalizeAscii(token);

  const mapped = tokenMap.get(normalized.toLowerCase());
  if (mapped) return mapped;

  let source = normalized.toLowerCase().replace(/[^a-z]/g, "");
  if (!source) return token;

  let output = "";
  while (source.length > 0) {
    const doubled = source.match(/^([bcdfghjklmnpqrstvwxyz])\1/);
    if (doubled) {
      output += "스";
      source = source.slice(1);
      continue;
    }

    const unit = hangulUnits.find(([pattern]) => pattern.test(source));
    if (!unit) {
      source = source.slice(1);
      continue;
    }
    output += unit[1];
    source = source.replace(unit[0], "");
  }

  return output || token;
};

const localizeLatinTokens = (name: string) =>
  name.replace(/[A-Za-z]+/g, (token) => transliterateLatinToken(token));

const dedupeNames = (rows: RegionRow[]) => {
  const seen = new Map<string, number>();

  return rows.map((row) => {
    const baseName = row.name.replace(/\s+/g, " ").trim();
    const key = baseName.toLowerCase();
    const count = seen.get(key) ?? 0;
    seen.set(key, count + 1);

    return {
      ...row,
      name: count === 0 ? baseName : `${baseName} ${count + 1}`,
    };
  });
};

const localizeFile = (fileName: string) => {
  const filePath = path.join(regionDist, fileName);
  const rows = JSON.parse(fs.readFileSync(filePath, "utf8")) as RegionRow[];
  const localized = dedupeNames(
    rows.map((row) => ({
      ...row,
      name: localizeLatinTokens(row.name),
    })),
  );

  fs.writeFileSync(filePath, `${JSON.stringify(localized, null, 2)}\n`);
  const remainingLatin = localized.filter((row) => /[A-Za-z]/.test(row.name));
  if (remainingLatin.length > 0) {
    throw new Error(
      `${fileName} still contains ${remainingLatin.length} Latin labels`,
    );
  }

  console.log(`${fileName}: ${localized.length}`);
};

for (const fileName of [
  "region-2-moon-korean.json",
  "region-2-mars-korean.json",
  "region-3-mars-korean.json",
] as const) {
  localizeFile(fileName);
}
