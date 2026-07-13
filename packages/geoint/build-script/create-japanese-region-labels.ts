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

const root = process.cwd();
const regionDist = path.join(root, "region-dist");

const wholeNameMap = new Map<string, string>([
  ["Mare Tranquillitatis", "静かの海"],
  ["Mare Imbrium", "雨の海"],
  ["Mare Serenitatis", "晴れの海"],
  ["Mare Crisium", "危難の海"],
  ["Mare Fecunditatis", "豊かの海"],
  ["Mare Nectaris", "神酒の海"],
  ["Mare Nubium", "雲の海"],
  ["Mare Humorum", "湿りの海"],
  ["Mare Frigoris", "寒さの海"],
  ["Oceanus Procellarum", "嵐の大洋"],
  ["Olympus Mons", "オリンポス山"],
  ["Valles Marineris", "マリネリス峡谷"],
  ["Hellas Planitia", "ヘラス平原"],
  ["Arabia Terra", "アラビア大陸"],
  ["Tharsis Montes", "タルシス山地"],
]);

const wordMap = new Map<string, string>([
  ["north", "北"],
  ["south", "南"],
  ["east", "東"],
  ["west", "西"],
  ["central", "中央"],
  ["upper", "上"],
  ["lower", "下"],
  ["new", "ニュー"],
  ["old", "旧"],
  ["mount", "マウント"],
  ["mt", "マウント"],
  ["saint", "セント"],
  ["st", "セント"],
  ["santa", "サンタ"],
  ["santo", "サント"],
  ["san", "サン"],
  ["sao", "サン"],
  ["rio", "リオ"],
  ["la", "ラ"],
  ["le", "ル"],
  ["les", "レ"],
  ["el", "エル"],
  ["al", "アル"],
  ["de", "デ"],
  ["del", "デル"],
  ["da", "ダ"],
  ["di", "ディ"],
  ["do", "ド"],
  ["dos", "ドス"],
  ["das", "ダス"],
  ["van", "ヴァン"],
  ["von", "フォン"],
  ["sea", "海"],
  ["ocean", "海"],
  ["bay", "湾"],
  ["gulf", "湾"],
  ["lake", "湖"],
  ["river", "川"],
  ["island", "島"],
  ["islands", "諸島"],
  ["point", "岬"],
  ["cape", "岬"],
  ["mountain", "山"],
  ["mountains", "山地"],
  ["hill", "丘"],
  ["hills", "丘陵"],
  ["valley", "谷"],
  ["desert", "砂漠"],
  ["sector", "区域"],
  ["mine", "鉱山"],
  ["mines", "鉱山"],
  ["crater", "クレーター"],
  ["mare", "海"],
  ["oceanus", "大洋"],
  ["lacus", "湖"],
  ["sinus", "湾"],
  ["palus", "沼"],
  ["mons", "山"],
  ["montes", "山地"],
  ["vallis", "谷"],
  ["valles", "峡谷"],
  ["planitia", "平原"],
  ["planum", "高原"],
  ["terra", "大陸"],
  ["regio", "地域"],
  ["chasma", "峡谷"],
  ["chasmata", "峡谷"],
  ["fossa", "溝"],
  ["fossae", "溝"],
  ["dorsum", "尾根"],
  ["dorsa", "尾根"],
  ["rupes", "崖"],
  ["catena", "連鎖クレーター"],
  ["patera", "火口"],
  ["tholus", "丘"],
  ["tholi", "丘陵"],
  ["mensa", "台地"],
  ["mensae", "台地"],
  ["colles", "丘陵"],
  ["sulci", "溝"],
  ["scopulus", "崖"],
  ["scopuli", "崖"],
]);

const phraseMap = new Map<string, string>([
  ["south pacific ocean", "南太平洋"],
  ["north pacific ocean", "北太平洋"],
  ["south atlantic ocean", "南大西洋"],
  ["north atlantic ocean", "北大西洋"],
  ["indian ocean", "インド洋"],
  ["southern ocean", "南極海"],
  ["arctic ocean", "北極海"],
  ["ross sea", "ロス海"],
  ["weddell sea", "ウェッデル海"],
  ["sahara desert", "サハラ砂漠"],
  ["antarctic", "南極"],
  ["arctic", "北極"],
]);

const kanaUnits: Array<[RegExp, string]> = [
  [/^sch/, "シュ"],
  [/^tch/, "チ"],
  [/^ch/, "チ"],
  [/^sh/, "シ"],
  [/^th/, "ス"],
  [/^ph/, "フ"],
  [/^gh/, "グ"],
  [/^kh/, "ク"],
  [/^qu/, "ク"],
  [/^ck/, "ック"],
  [/^ng/, "ング"],
  [/^ny/, "ニ"],
  [/^ya/, "ヤ"],
  [/^yu/, "ユ"],
  [/^yo/, "ヨ"],
  [/^ja/, "ジャ"],
  [/^ju/, "ジュ"],
  [/^jo/, "ジョ"],
  [/^j/, "ジ"],
  [/^fa/, "ファ"],
  [/^fi/, "フィ"],
  [/^fe/, "フェ"],
  [/^fo/, "フォ"],
  [/^va/, "ヴァ"],
  [/^vi/, "ヴィ"],
  [/^ve/, "ヴェ"],
  [/^vo/, "ヴォ"],
  [/^v/, "ヴ"],
  [/^wi/, "ウィ"],
  [/^we/, "ウェ"],
  [/^wo/, "ウォ"],
  [/^x/, "クス"],
  [/^ce/, "セ"],
  [/^ci/, "シ"],
  [/^cy/, "シ"],
  [/^ca/, "カ"],
  [/^co/, "コ"],
  [/^cu/, "ク"],
  [/^c/, "ク"],
  [/^ge/, "ジェ"],
  [/^gi/, "ジ"],
  [/^gy/, "ジ"],
  [/^ga/, "ガ"],
  [/^go/, "ゴ"],
  [/^gu/, "グ"],
  [/^tion/, "ション"],
  [/^sion/, "ジョン"],
  [/^tia/, "ティア"],
  [/^si/, "シ"],
  [/^ti/, "ティ"],
  [/^tu/, "トゥ"],
  [/^di/, "ディ"],
  [/^du/, "ドゥ"],
  [/^la/, "ラ"],
  [/^li/, "リ"],
  [/^lu/, "ル"],
  [/^le/, "レ"],
  [/^lo/, "ロ"],
  [/^ra/, "ラ"],
  [/^ri/, "リ"],
  [/^ru/, "ル"],
  [/^re/, "レ"],
  [/^ro/, "ロ"],
  [/^ba/, "バ"],
  [/^bi/, "ビ"],
  [/^bu/, "ブ"],
  [/^be/, "ベ"],
  [/^bo/, "ボ"],
  [/^pa/, "パ"],
  [/^pi/, "ピ"],
  [/^pu/, "プ"],
  [/^pe/, "ペ"],
  [/^po/, "ポ"],
  [/^ma/, "マ"],
  [/^mi/, "ミ"],
  [/^mu/, "ム"],
  [/^me/, "メ"],
  [/^mo/, "モ"],
  [/^na/, "ナ"],
  [/^ni/, "ニ"],
  [/^nu/, "ヌ"],
  [/^ne/, "ネ"],
  [/^no/, "ノ"],
  [/^ha/, "ハ"],
  [/^hi/, "ヒ"],
  [/^hu/, "フ"],
  [/^he/, "ヘ"],
  [/^ho/, "ホ"],
  [/^sa/, "サ"],
  [/^su/, "ス"],
  [/^se/, "セ"],
  [/^so/, "ソ"],
  [/^za/, "ザ"],
  [/^zu/, "ズ"],
  [/^ze/, "ゼ"],
  [/^zo/, "ゾ"],
  [/^ta/, "タ"],
  [/^te/, "テ"],
  [/^to/, "ト"],
  [/^da/, "ダ"],
  [/^de/, "デ"],
  [/^do/, "ド"],
  [/^ka/, "カ"],
  [/^ki/, "キ"],
  [/^ku/, "ク"],
  [/^ke/, "ケ"],
  [/^ko/, "コ"],
  [/^wa/, "ワ"],
  [/^a/, "ア"],
  [/^i/, "イ"],
  [/^u/, "ウ"],
  [/^e/, "エ"],
  [/^o/, "オ"],
  [/^b/, "ブ"],
  [/^d/, "ド"],
  [/^f/, "フ"],
  [/^g/, "グ"],
  [/^h/, "フ"],
  [/^k/, "ク"],
  [/^l/, "ル"],
  [/^m/, "ム"],
  [/^n/, "ン"],
  [/^p/, "プ"],
  [/^r/, "ル"],
  [/^s/, "ス"],
  [/^t/, "ト"],
  [/^w/, "ウ"],
  [/^y/, "イ"],
  [/^z/, "ズ"],
];

const normalizeAscii = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[-_/.,()]/g, " ")
    .replace(/&/g, " and ")
    .replace(/\s+/g, " ")
    .trim();

const transliterateToken = (token: string) => {
  if (/^\d+$/.test(token)) return token;
  if (/[\u3040-\u30ff\u3400-\u9fff]/u.test(token)) return token;

  const lower = token.toLowerCase();
  const mapped = wordMap.get(lower);
  if (mapped) return mapped;

  let source = lower.replace(/[^a-z]/g, "");
  if (!source) return token;

  let output = "";
  while (source.length > 0) {
    const doubled = source.match(/^([bcdfghjklmnpqrstvwxyz])\1/);
    if (doubled) {
      output += "ッ";
      source = source.slice(1);
      continue;
    }

    const unit = kanaUnits.find(([pattern]) => pattern.test(source));
    if (!unit) {
      source = source.slice(1);
      continue;
    }
    output += unit[1];
    source = source.replace(unit[0], "");
  }

  return output || token;
};

const localizeName = (name: string) => {
  const whole = wholeNameMap.get(name);
  if (whole) return whole;

  const normalized = normalizeAscii(name);
  const trailingNumber = normalized.match(/^(.*)\s+(\d+)$/);
  const base = trailingNumber ? (trailingNumber[1] ?? normalized) : normalized;
  const suffix = trailingNumber ? ` ${trailingNumber[2]}` : "";
  const phrase = phraseMap.get(base.toLowerCase());
  if (phrase) return `${phrase}${suffix}`;

  const tokens = base.split(" ").filter(Boolean);
  const firstGeneric = wordMap.get(tokens[0]?.toLowerCase() ?? "");
  if (
    tokens.length > 1 &&
    firstGeneric &&
    /^(海|大洋|湖|湾|沼)$/u.test(firstGeneric)
  ) {
    return `${tokens.slice(1).map(transliterateToken).join(" ")}${firstGeneric}${suffix}`;
  }

  return `${tokens
    .map(transliterateToken)
    .join(" ")
    .replace(
      /\s+(海|湾|湖|川|島|諸島|岬|山|山地|丘|丘陵|谷|砂漠|区域|クレーター|大洋|沼|峡谷|平原|高原|大陸|地域|溝|尾根|崖|連鎖クレーター|火口|台地)$/u,
      "$1",
    )}${suffix}`;
};

const dedupeNames = (rows: RegionRow[]) => {
  const seen = new Map<string, number>();

  return rows.map((row) => {
    const baseName = row.name.replace(/-/g, " ").replace(/\s+/g, " ").trim();
    const key = baseName.toLowerCase();
    const count = seen.get(key) ?? 0;
    seen.set(key, count + 1);

    return {
      ...row,
      name: count === 0 ? baseName : `${baseName} ${count + 1}`,
    };
  });
};

const localizeFile = (sourceFile: string, targetFile: string) => {
  const sourcePath = path.join(regionDist, sourceFile);
  const targetPath = path.join(regionDist, targetFile);
  const rows = JSON.parse(fs.readFileSync(sourcePath, "utf8")) as RegionRow[];
  const localized = dedupeNames(
    rows.map((row) => ({
      ...row,
      name:
        row.source === "synthetic-named-gap"
          ? `${localizeName(row.name)}区域`
          : localizeName(row.name),
    })),
  );

  fs.writeFileSync(targetPath, `${JSON.stringify(localized, null, 2)}\n`);
  console.log(`${targetFile}: ${localized.length}`);
};

for (const [source, target] of [
  ["region-2.json", "region-2-japanese.json"],
  ["region-3.json", "region-3-japanese.json"],
  ["region-2-moon.json", "region-2-moon-japanese.json"],
  ["region-2-mars.json", "region-2-mars-japanese.json"],
  ["region-3-mars.json", "region-3-mars-japanese.json"],
] as const) {
  localizeFile(source, target);
}
