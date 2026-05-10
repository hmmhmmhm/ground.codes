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
  ["alba", "阿尔巴"],
  ["arabia", "阿拉伯"],
  ["australe", "奥斯特拉莱"],
  ["cerberus", "刻耳柏洛斯"],
  ["elysium", "埃律西昂"],
  ["gale", "盖尔"],
  ["gusev", "古谢夫"],
  ["hellas", "希腊"],
  ["lunicus", "卢尼库斯"],
  ["mare", "海"],
  ["marineris", "水手"],
  ["olympus", "奥林帕斯"],
  ["ophir", "俄斐"],
  ["phison", "斐逊"],
  ["syrtis", "叙尔提斯"],
  ["tarsis", "塔尔西斯"],
  ["tharsis", "塔尔西斯"],
  ["utopia", "乌托邦"],
  ["a", "甲"],
  ["b", "乙"],
  ["c", "丙"],
  ["d", "丁"],
  ["e", "戊"],
  ["f", "己"],
  ["g", "庚"],
  ["h", "辛"],
  ["i", "壬"],
  ["j", "癸"],
  ["k", "凯"],
  ["l", "艾勒"],
  ["m", "艾姆"],
  ["n", "艾恩"],
  ["o", "欧"],
  ["p", "皮"],
  ["q", "丘"],
  ["r", "阿尔"],
  ["s", "艾斯"],
  ["t", "提"],
  ["u", "优"],
  ["v", "维"],
  ["w", "达布流"],
  ["x", "艾克斯"],
  ["y", "吾艾"],
  ["z", "贼德"],
]);

const chineseUnits: Array<[RegExp, string]> = [
  [/^sch/, "舒"],
  [/^tch/, "奇"],
  [/^ch/, "奇"],
  [/^sh/, "希"],
  [/^th/, "特"],
  [/^ph/, "夫"],
  [/^gh/, "格"],
  [/^kh/, "克"],
  [/^qu/, "库"],
  [/^ck/, "克"],
  [/^ng/, "恩格"],
  [/^ny/, "尼"],
  [/^tion/, "欣"],
  [/^sion/, "欣"],
  [/^cia/, "西亚"],
  [/^tia/, "蒂亚"],
  [/^ya/, "亚"],
  [/^yu/, "尤"],
  [/^yo/, "约"],
  [/^ja/, "贾"],
  [/^ju/, "朱"],
  [/^jo/, "乔"],
  [/^fa/, "法"],
  [/^fi/, "菲"],
  [/^fe/, "费"],
  [/^fo/, "福"],
  [/^va/, "瓦"],
  [/^vi/, "维"],
  [/^ve/, "韦"],
  [/^vo/, "沃"],
  [/^wi/, "维"],
  [/^we/, "韦"],
  [/^wo/, "沃"],
  [/^x/, "克斯"],
  [/^ce/, "塞"],
  [/^ci/, "西"],
  [/^cy/, "西"],
  [/^ca/, "卡"],
  [/^co/, "科"],
  [/^cu/, "库"],
  [/^ge/, "杰"],
  [/^gi/, "吉"],
  [/^gy/, "吉"],
  [/^ga/, "加"],
  [/^go/, "戈"],
  [/^gu/, "古"],
  [/^si/, "西"],
  [/^ti/, "蒂"],
  [/^tu/, "图"],
  [/^di/, "迪"],
  [/^du/, "杜"],
  [/^la/, "拉"],
  [/^li/, "利"],
  [/^lu/, "卢"],
  [/^le/, "勒"],
  [/^lo/, "洛"],
  [/^ra/, "拉"],
  [/^ri/, "里"],
  [/^ru/, "鲁"],
  [/^re/, "雷"],
  [/^ro/, "罗"],
  [/^ba/, "巴"],
  [/^bi/, "比"],
  [/^bu/, "布"],
  [/^be/, "贝"],
  [/^bo/, "博"],
  [/^pa/, "帕"],
  [/^pi/, "皮"],
  [/^pu/, "普"],
  [/^pe/, "佩"],
  [/^po/, "波"],
  [/^ma/, "马"],
  [/^mi/, "米"],
  [/^mu/, "穆"],
  [/^me/, "梅"],
  [/^mo/, "莫"],
  [/^na/, "纳"],
  [/^ni/, "尼"],
  [/^nu/, "努"],
  [/^ne/, "内"],
  [/^no/, "诺"],
  [/^ha/, "哈"],
  [/^hi/, "希"],
  [/^hu/, "胡"],
  [/^he/, "赫"],
  [/^ho/, "霍"],
  [/^sa/, "萨"],
  [/^su/, "苏"],
  [/^se/, "塞"],
  [/^so/, "索"],
  [/^za/, "扎"],
  [/^zu/, "祖"],
  [/^ze/, "泽"],
  [/^zo/, "佐"],
  [/^ta/, "塔"],
  [/^te/, "特"],
  [/^to/, "托"],
  [/^da/, "达"],
  [/^de/, "德"],
  [/^do/, "多"],
  [/^ka/, "卡"],
  [/^ki/, "基"],
  [/^ku/, "库"],
  [/^ke/, "克"],
  [/^ko/, "科"],
  [/^wa/, "瓦"],
  [/^a/, "阿"],
  [/^e/, "埃"],
  [/^i/, "伊"],
  [/^o/, "奥"],
  [/^u/, "乌"],
  [/^b/, "布"],
  [/^c/, "克"],
  [/^d/, "德"],
  [/^f/, "夫"],
  [/^g/, "格"],
  [/^h/, "赫"],
  [/^j/, "吉"],
  [/^k/, "克"],
  [/^l/, "勒"],
  [/^m/, "姆"],
  [/^n/, "恩"],
  [/^p/, "普"],
  [/^q/, "库"],
  [/^r/, "尔"],
  [/^s/, "斯"],
  [/^t/, "特"],
  [/^v/, "夫"],
  [/^w/, "乌"],
  [/^y/, "伊"],
  [/^z/, "兹"],
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
      output += "斯";
      source = source.slice(1);
      continue;
    }

    const unit = chineseUnits.find(([pattern]) => pattern.test(source));
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
    let name = baseName;
    let count = seen.get(name.toLowerCase()) ?? 0;
    while (count > 0) {
      name = `${baseName}区${count + 1}`;
      count = seen.get(name.toLowerCase()) ?? 0;
    }
    seen.set(name.toLowerCase(), 1);

    return {
      ...row,
      name,
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
  "region-2-moon-chinese.json",
  "region-2-mars-chinese.json",
  "region-3-mars-chinese.json",
] as const) {
  localizeFile(fileName);
}
