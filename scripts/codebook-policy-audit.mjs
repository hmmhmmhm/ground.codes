import { readFileSync } from "node:fs";

import { AGENT_REVIEWED_BLOCKLISTS } from "./codebook-policy-findings.mjs";

export const EXPECTED_COUNTS = {
  english: 6000,
  korean: 5630,
  chinese: 5140,
  japanese: 5000,
  spanish: 5000,
  french: 5000,
  german: 5000,
  portuguese: 5000,
  indonesian: 5000,
  thai: 5000,
  vietnamese: 5000,
  hindi: 5000,
  arabic: 5000,
  russian: 5000,
};

const CODEBOOK_FILES = {
  english: "../packages/codebook/codebook-dist/english.json",
  korean: "../packages/codebook/codebook-dist/korean.json",
  chinese: "../packages/codebook/codebook-dist/chinese.json",
  japanese: "../packages/codebook/codebook-dist/japanese.json",
  spanish: "../packages/codebook/codebook-dist/spanish.json",
  french: "../packages/codebook/codebook-dist/french.json",
  german: "../packages/codebook/codebook-dist/german.json",
  portuguese: "../packages/codebook/codebook-dist/portuguese.json",
  indonesian: "../packages/codebook/codebook-dist/indonesian.json",
  thai: "../packages/codebook/codebook-dist/thai.json",
  vietnamese: "../packages/codebook/codebook-dist/vietnamese.json",
  hindi: "../packages/codebook/codebook-dist/hindi.json",
  arabic: "../packages/codebook/codebook-dist/arabic.json",
  russian: "../packages/codebook/codebook-dist/russian.json",
};

const SPANISH_REVIEW_FILES = [
  "../packages/codebook/codebook-dataset/spanish/standalone-review-2026-05-21.md",
];

const readReviewedSpanishStandaloneWords = () => {
  const words = new Set();

  for (const path of SPANISH_REVIEW_FILES) {
    const text = readFileSync(new URL(path, import.meta.url), "utf8");
    for (const match of text.matchAll(/`([A-Z][a-z]+)`/g)) {
      words.add(match[1]);
    }
  }

  return words;
};

const ENGLISH_BLOCKED_TERMS = [
  "Rough",
  "Bought",
  "Caught",
  "Enough",
  "School",
  "Sought",
  "Taught",
  "Though",
  "Brought",
  "Scholar",
  "Schools",
  "Thought",
  "Schoolbag",
  "Although",
  "Daughter",
  "Deadline",
  "Hardware",
  "Software",
  "Thoughts",
  "Warnings",
  "Warranty",
  "Discharge",
  "Scheduled",
  "Schedules",
  "Shareware",
  "Scheduling",
  "Throughout",
  "Scholarship",
  "Scholarships",
  "Accessibility",
  "Administrator",
  "Advertisement",
  "Announcements",
  "Architectural",
  "Authorization",
  "Automatically",
  "Biotechnology",
  "Certification",
  "Circumstances",
  "Collaboration",
  "Collaborative",
  "Communication",
  "Compatibility",
  "Comprehensive",
  "Concentration",
  "Configuration",
  "Consideration",
  "Contributions",
  "Corresponding",
  "Determination",
  "Documentation",
  "Entertainment",
  "Environmental",
  "Establishment",
  "Illustrations",
  "Informational",
  "Instructional",
  "International",
  "Investigation",
  "Manufacturers",
  "Manufacturing",
  "Miscellaneous",
  "Modifications",
  "Opportunities",
  "Organisations",
  "Organizations",
  "Participating",
  "Participation",
  "Professionals",
  "Relationships",
  "Significantly",
  "Specification",
  "Subscriptions",
  "Technological",
  "Understanding",
  "Accommodations",
  "Administration",
  "Administrative",
  "Communications",
  "Considerations",
  "Correspondence",
  "Identification",
  "Infrastructure",
  "Interpretation",
  "Organizational",
  "Qualifications",
  "Recommendation",
  "Representation",
  "Representative",
  "Responsibility",
  "Transformation",
  "Transportation",
];

const KOREAN_BLOCKED_TERMS = [
  "강",
  "산",
  "술",
  "섬",
  "시",
  "관",
  "회",
  "약",
  "법",
  "스",
  "스탯",
  "스팟",
  "프레",
  "브람스",
  "브루크",
  "스튜디오",
  "프레이즈",
  "스타일링",
  "스테이션",
  "프로듀서",
  "잣",
  "플록스",
  "도토리토리",
  "도토리걸이",
  "토기묶음",
  "섞기",
  "자개쌀독",
  "호박자",
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
];

const CHINESE_BLOCKED_TERMS = [
  "山",
  "河",
  "湖",
  "城",
  "法",
  "园",
  "湾",
  "村",
  "溪",
  "港",
  "岭",
  "江",
  "塔",
  "奖",
  "骰",
  "书法",
  "方法",
  "神话",
  "手法",
  "奖品",
  "法师",
  "法杖",
  "奖杯",
  "奖项",
  "女神",
  "精神",
  "冠军",
  "法规",
  "法律",
  "酒店",
  "米酒",
  "法庭",
  "法官",
  "宪法",
  "奖励",
  "亚军",
  "季军",
  "奖牌",
  "奖章",
  "祝酒",
  "山药",
  "算法",
  "酒柜",
  "酒杯",
  "酒器",
  "酒席",
  "酒宴",
  "酒香",
  "酒水",
  "酒桶",
  "酒瓶",
  "梅枝",
  "芍药",
  "苦酒",
  "神舟",
  "四神",
  "神经",
  "火箭",
  "解法",
  "想法",
  "奖状",
  "技法",
  "酒楼",
  "语法",
  "神秘",
  "奖学金",
  "酒文化",
  "圣诞树",
  "书法家",
];

const JAPANESE_BLOCKED_TERMS = [
  "はは",
  "ちち",
  "つつ",
  "みみ",
  "ごご",
  "きき",
  "やや",
  "もも",
  "ばば",
  "たた",
  "しし",
  "じじ",
];

const SPANISH_BLOCKED_TERMS = [
  "Sexo",
  "Casino",
  "Apuesta",
  "Arma",
  "Guerra",
  "Militar",
  "Droga",
  "Medico",
  "Politica",
  "Religion",
  "Crimen",
  "Muerte",
  "Odio",
  "Violencia",
  "Calavera",
  "Centinela",
  "Cicuta",
  "Cloaca",
  "Cobrador",
  "Demo",
  "Fatiga",
  "Grumete",
  "Guadana",
  "Limosna",
  "Maestre",
  "Michi",
  "Monogamia",
  "Opio",
  "Pancita",
  "Pelele",
  "Poligamia",
  "Rating",
  "Reten",
  "Sanguijuela",
  "Short",
  "Tanga",
  "Vicio",
  "Yelmo",
];

const FRENCH_BLOCKED_TERMS = [
  "Abaisser",
  "Abdiquer",
  "Abolir",
  "Aborder",
  "Aboutir",
  "Aboyer",
  "Abrasif",
  "Abreuver",
  "Abriter",
  "Abroger",
  "Abrupt",
  "Absence",
  "Absolu",
  "Absurde",
  "Abusif",
  "Accabler",
  "Accepter",
  "Acclamer",
  "Accuser",
  "Acerbe",
  "Acheter",
  "Acquerir",
  "Actuel",
  "Admettre",
  "Admirer",
  "Adopter",
  "Adorer",
  "Adoucir",
  "Affecter",
  "Affreux",
  "Agacer",
  "Agiter",
  "Ajouter",
  "Ajuster",
  "Alcool",
  "Alerte",
  "Allumer",
  "Alourdir",
  "Amertume",
  "Amour",
  "Analyse",
  "Annexer",
  "Anomalie",
  "Anormal",
  "Anxieux",
  "Apaiser",
  "Appeler",
  "Apporter",
  "Appuyer",
  "Arme",
  "Arracher",
  "Arriver",
  "Arroser",
  "Aspect",
  "Atroce",
  "Avenir",
  "Aveugle",
  "Avide",
  "Bizarre",
  "Bobard",
  "Bonheur",
  "Bonus",
  "Casino",
  "Caution",
  "Censurer",
  "Cerveau",
  "Cohesion",
  "Contact",
  "Crime",
  "Crediter",
  "Critere",
  "Cycle",
  "Defensif",
  "Distance",
  "Domaine",
  "Drogue",
  "Effectif",
  "Enfermer",
  "Erreur",
  "Exemple",
  "Exiler",
  "Fatal",
  "Fortune",
  "Fureur",
  "Furieux",
  "Fusion",
  "Guerre",
  "Haine",
  "Horde",
  "Impact",
  "Indice",
  "Injecter",
  "Inutile",
  "Logique",
  "Maladie",
  "Medecin",
  "Morsure",
  "Mort",
  "Offenser",
  "Opinion",
  "Politique",
  "Position",
  "Question",
  "Probleme",
  "Public",
  "Punitif",
  "Querelle",
  "Religion",
  "Resultat",
  "Service",
  "Sexe",
  "Sombre",
  "Suspect",
  "Systeme",
  "Theorie",
  "Travail",
  "Union",
  "Usage",
  "Vexer",
  "Violence",
  "Vin",
];

const FRENCH_VERB_REJECTS = `
  Adjuger Affubler Agencer Agrafer Aliener Alleger Allouer Amenager Amorcer
  Aneantir Aplanir Arpenter Aspirer Asservir Associer Assurer Attirer Attraper
  Augurer Avaler Avancer Aviser Avouer Bafouer Balancer Bavarder Blanchir
  Blinder Bloquer Boiser Bondir Bonifier Bricoler Broder Bronzer Butiner
  Calculer Calmer Capter Caresser Causer Cerner Cesser Chavirer Chercher
  Choisir Cimenter Cintrer Circuler Claquer Cligner Codifier Cogner Coiffer
  Coincer Colmater Conduire Confier Congeler Couvrir Creuser Croquer Cultiver
  Debattre Debiter Deborder Decaler Decider Declarer Decorer Decrire Degager
  Demander Dessiner Devenir Deviner Douter Eclairer Ecouter Effacer Egarer
  Emporter Enlever Envoyer Essayer Eviter Exister Explorer Exposer Fermer
  Filtrer Forcer Fouiller Frapper Gagner Garantir Glisser Gonfler Grimper
  Hesiter Ignorer Imiter Imposer Imprimer Informer Inspirer Inventer Inviter
  Isoler Jongler Laisser Liberer Lister Lutter Nettoyer Observer Occuper Offrir
  Parler Partager Plonger Proteger Quitter Raconter Recycler Remplir Rester
  Sauter Separer Sortir Tailler Terminer Toucher Tricoter Varier Verser
  Predire Prevoir Proceder Projeter Promener Puiser Ralentir Ramasser Ratisser
  Ravager Rayonner Reagir Realiser Reanimer Recevoir Reciter Reclamer Recolter
  Recruter Reculer Rediger Redouter Refaire Reformer Reiterer Rejeter Rejouer
  Relever Remonter Remuer Renifler Renoncer Rentrer Replier Reporter Resoudre
  Retablir Retenir Retomber Retracer Reussir Revivre Rigoler Rincer Riposter
  Rompre Ruiner Saisir Saluer Somnoler Priver Purifier Soulever Soutirer
  Stipuler Subvenir Suggerer Supplier Surmener Pouvoir Vouloir
`
  .trim()
  .split(/\s+/);

const ENGLISH_GENERATED_COMPOUND_PATTERN =
  /^(Amber|Alder|Apricot|Ash|Bamboo|Basalt|Beech|Birch|Cedar|Clover|Cobalt|Copper|Cotton|Crystal|Elm|Fern|Flax|Fruit|Gold|Granite|Hazel|Heather|Ivory|Jade|Juniper|Larch|Maple|Oak|Pine|River|Tea|Vine|Willow|Bright|Sun|Wind|Moss|Lake|Grove|Blossom)(awl|basin|basket|basketry|bead|beaker|bench|binder|block|board|bobbin|bowl|broom|brush|buckle|caddy|case|charm|crate|creel|crock|cup|dibber|dipper|drainer|gimlet|hamper|ladle|loom|mortar|napkin|pestle|pitcher|planter|pot|punnet|quilt|rasp|rod|satchel|saucer|sifter|tassel|tile|toggle|tote|tray|trivet|trug|tumbler|vessel|brook|field|haven|ridge|stone|vale|fall|water|leaf|wood|garden|path|pond|meadow|crest|branch|breeze|sprout|trail)$/u;

const SPANISH_GENERATED_COMPOUND_PATTERN =
  /^(Abedul|Abeto|Acebo|Acero|Agata|Alamo|Albahaca|Alcornoque|Alga|Algodon|Almendra|Aloe|Ambar|Arcilla|Arena|Avellana|Azahar|Bambu|Barro|Brezo|Bronce|Cacao|Cafe|Calabaza|Canela|Cerezo|Cobre|Coral|Cristal|Encina|Esparto|Fresno|Granito|Haya|Helecho|Hierro|Higo|Jade|Junco|Laurel|Lino|Madera|Marmol|Menta|Mimbre|Nogal|Olivo|Paja|Pino|Roble|Romero|Sauce|Tomillo|Trigo|Vid|Yute)(abanico|anillo|asa|azulejo|bandeja|banco|barreno|baston|baul|bol|bolsa|botella|boton|brocha|caja|cajon|canasta|candil|cazo|cepillo|cesto|cinta|copa|cordel|cuenco|cuchara|cubo|cuna|dedal|estante|estera|etiqueta|frasco|gancho|jarra|jarron|lampara|lienzo|maceta|mango|manta|marco|mazo|mortero|olla|paleta|palo|pano|peine|percha|pieza|pinza|placa|plato|regla|saco|sarten|sello|soporte|tabla|tablon|tarro|taza|tejido|telar|tijera|tinaja|tira|torno|trenza|vasija|vaso|vela|varilla|cuerda|cucharita|escobilla|cazuela|criba|tamiz|regadera|cubeta|palillo|costal|morral|boceto|canutillo|carrete|dedalera|hilera|jofaina|lebrillo)$/u;

const SPANISH_TEMPLATE_COMPOUND_PATTERN =
  /^[A-Z][a-z]{3,}(?:abanico|anillo|aro|asa|azulejo|banco|bandeja|barreno|baston|baul|boceto|bol|bolsa|bote|botella|boton|brocha|caja|cajon|canasta|candil|carrete|cazo|cazuela|cepillo|cesta|cesto|cinta|copa|cordel|costal|criba|cuchara|cuerda|cuenco|cubo|cubeta|cuna|dado|dedal|estante|estera|etiqueta|ficha|flor|frasco|gancho|hilera|hoja|jarra|jarron|jofaina|lampara|lata|lebrillo|libro|lienzo|lona|luz|maceta|mango|manta|mapa|marco|mazo|mesa|miel|molde|morral|mortero|olla|pala|paleta|palillo|palo|pan|pano|peine|percha|pieza|pinza|placa|plato|red|regla|saco|sal|sarten|sello|silla|sol|soporte|tabla|tablon|tamiz|tapa|tarro|taza|tejido|telar|tijera|tinaja|tira|torno|trenza|tubo|vasija|vaso|vela|varilla)$/u;
const SPANISH_COMPOUND_SATURATION_LIMIT = 2945;
const SPANISH_REVIEWED_STANDALONE_WORDS = readReviewedSpanishStandaloneWords();

const FRENCH_TEMPLATE_COMPOUND_PATTERN =
  /^[A-Z][a-z]{3,}(?:abri|anse|arc|bague|balai|banc|bocal|boite|bol|borne|boule|brin|brosse|cache|cadre|caisse|canne|carafe|carte|casier|cloche|clou|corde|coupe|coussin|cruche|dalle|ecrin|etui|fagot|ficelle|fil|flacon|gobelet|grille|housse|jarre|lampe|louche|malle|manche|moule|nappe|panier|patere|peigne|pichet|pince|plaque|plateau|poche|poignee|pot|regle|rideau|ruban|sac|seau|tamis|tasse|tiroir|toile|vase|verre|volet)$/u;
const FRENCH_COMPOUND_SATURATION_LIMIT = 2500;

const GERMAN_BLOCKED_TERMS = [
  "Abbauen",
  "Aendern",
  "Anfangen",
  "Angst",
  "Arbeiten",
  "Arzt",
  "Besuchen",
  "Bleiben",
  "Casino",
  "Denken",
  "Droge",
  "Fehler",
  "Fragen",
  "Gefahr",
  "Gehen",
  "Gewalt",
  "Hass",
  "Kaufen",
  "Koennen",
  "Krankheit",
  "Krieg",
  "Laufen",
  "Machen",
  "Muessen",
  "Politik",
  "Problem",
  "Religion",
  "Risiko",
  "Sagen",
  "Schmerz",
  "Schuld",
  "Sehen",
  "Sex",
  "Sollen",
  "Sterben",
  "Suchen",
  "Tod",
  "Toeten",
  "Tragen",
  "Verbot",
  "Verbrechen",
  "Verlust",
  "Waffe",
  "Wollen",
  "Zwang",
];

const GERMAN_TEMPLATE_COMPOUND_PATTERN =
  /^[A-Z][a-z]{3,}(?:band|bank|becher|beet|beutel|blatt|blech|brett|bund|dose|eimer|faden|fass|feld|fliese|gabel|glas|griff|haken|hut|kachel|kanne|karton|kasten|kelle|kerze|kiste|klotz|knopf|korb|kranz|kreide|krug|lampe|leiste|mappe|matte|messer|nadel|papier|perle|pfanne|pfeife|pinsel|platte|polster|rahmen|riegel|ring|rohr|sack|schale|seil|sieb|sohle|spange|spatel|spiegel|spule|steg|stein|stift|tafel|tasche|tasse|tisch|topf|truhe|vlies|wagen)$/u;
const GERMAN_COMPOUND_SATURATION_LIMIT = 3500;
const GERMAN_AWKWARD_COMPOUNDS = new Set([
  "Ackerfass",
  "Ackerglas",
  "Ackerhut",
  "Ackerring",
  "Ackerseil",
  "Ackerwagen",
  "Apfelpfeife",
  "Apfelsohle",
  "Blattblatt",
  "Feldfeld",
  "Grasvlies",
  "Papierpapier",
  "Roggenpfeife",
  "Steinstein",
]);
const GERMAN_AWKWARD_COMPOUND_PATTERN =
  /^(?:Acker|Bach|Feld|Garten|Gras)(?:dose|fass|glas|hut|ring|seil|vlies|wagen)$|^(?:Apfel|Birne|Beere|Bohne|Erbse|Feige|Kuerbis|Mandel|Nuss|Olive|Reis|Roggen|Weizen)(?:pfeife|riegel|sohle|spange|spule|vlies)$|^(?:Ahorn|Birken|Buchen|Eichen|Fichten|Tannen|Ulmen|Weiden|Zedern)(?:becher|dose|fass|glas|topf)$/u;

const isAwkwardGermanCompound = (word) => {
  if (GERMAN_AWKWARD_COMPOUNDS.has(word)) return true;
  if (GERMAN_AWKWARD_COMPOUND_PATTERN.test(word)) return true;

  const lower = word.toLowerCase();
  if (lower.length % 2 !== 0) return false;
  const half = lower.slice(0, lower.length / 2);
  return half.length >= 4 && lower === `${half}${half}`;
};

const PORTUGUESE_BLOCKED_TERMS = [
  "Acucarbanco",
  "Acucarfolha",
  "Aguabanco",
  "Aguafolha",
  "Almendra",
  "Arvorebranco",
  "Avelan",
  "Aposta",
  "Arma",
  "Basilio",
  "Betula",
  "Casino",
  "Crime",
  "Culpa",
  "Dever",
  "Dizer",
  "Doenca",
  "Dor",
  "Droga",
  "Erro",
  "Fazer",
  "Guerra",
  "Matar",
  "Medico",
  "Medo",
  "Morte",
  "Morrer",
  "Obrigar",
  "Odio",
  "Perda",
  "Perigo",
  "Poder",
  "Politica",
  "Problema",
  "Proibido",
  "Querer",
  "Religiao",
  "Risco",
  "Roble",
  "Saber",
  "Sexo",
  "Violencia",
  "Yute",
];

const PORTUGUESE_TEMPLATE_COMPOUND_PATTERN =
  /^[A-Z][a-z]{3,}(?:anel|banco|bandeja|bastao|bau|bolsa|botao|brocha|caixa|cesta|cesto|chave|copo|corda|cuba|cuia|escova|esteira|fita|folha|frasco|gancho|jarra|lata|livro|lona|luz|mapa|marco|mesa|pano|pote|prato|rede|saco|selo|suporte|tabua|tampa|tela|tigela|vaso|vela)$/u;
const PORTUGUESE_COMPOUND_SATURATION_LIMIT = 3500;

const PORTUGUESE_AWKWARD_COMPOUND_PATTERN =
  /^(?:Acucar|Agua|Areia|Barro|Lama|Rio|Riacho)(?:banco|fita|folha|lona|livro|mesa|pano|selo)$|^(?:Arvore|Folha|Luz)branco$/u;

const isAwkwardPortugueseCompound = (word) => {
  if (PORTUGUESE_AWKWARD_COMPOUND_PATTERN.test(word)) return true;

  const lower = word.toLowerCase();
  if (lower.length % 2 !== 0) return false;
  const half = lower.slice(0, lower.length / 2);
  return half.length >= 4 && lower === `${half}${half}`;
};

const INDONESIAN_BLOCKED_TERMS = [
  "Benci",
  "Bohong",
  "Halia",
  "Jahat",
  "Judi",
  "Kalah",
  "Korupsi",
  "Mabuk",
  "Mati",
  "Narkoba",
  "Papaya",
  "Politik",
  "Racun",
  "Sakit",
  "Salah",
  "Senjata",
  "Seks",
  "Utang",
];

const INDONESIAN_AWKWARD_COMPOUND_PATTERN =
  /^(?:Laut|Ombak|Garam|Gula)(?:kaca|kain|kertas|meja|panci|piring|saku|topi)$/u;

const INDONESIAN_AWKWARD_ADJECTIVE_PREFIXES = [
  "Akar",
  "Alam",
  "Angin",
  "Awan",
  "Bambu",
  "Bayam",
  "Beras",
  "Cabai",
  "Cawan",
  "Emas",
  "Garam",
  "Gelas",
  "Gula",
  "Hutan",
  "Karet",
  "Kerang",
  "Kertas",
  "Lantai",
  "Laut",
  "Lidi",
  "Merica",
  "Ombak",
  "Panci",
  "Papan",
  "Pati",
  "Perak",
  "Pot",
  "Rotan",
  "Sagu",
  "Sikat",
  "Topi",
  "Wadah",
];

const INDONESIAN_AWKWARD_ADJECTIVE_SUFFIXES = [
  "angin",
  "awan",
  "bagus",
  "baru",
  "bening",
  "bersih",
  "biru",
  "bulat",
  "cerah",
  "datar",
  "halus",
  "hangat",
  "harum",
  "hijau",
  "indah",
  "jernih",
  "kecil",
  "kuning",
  "lebar",
  "lebat",
  "lembut",
  "luas",
  "lurus",
  "manis",
  "merah",
  "murni",
  "muda",
  "padat",
  "panjang",
  "pendek",
  "rata",
  "putih",
  "rapi",
  "rendah",
  "ringan",
  "rindang",
  "segar",
  "sejuk",
  "subur",
  "teduh",
  "tenang",
  "terang",
  "tinggi",
  "tipis",
  "utuh",
  "wangi",
];

const INDONESIAN_AWKWARD_OBJECT_PREFIXES = [
  "Akar",
  "Alam",
  "Angin",
  "Awan",
  "Bambu",
  "Cabai",
  "Garam",
  "Gelas",
  "Gula",
  "Kaca",
  "Kain",
  "Kapas",
  "Kapur",
  "Karet",
  "Kayu",
  "Kelapa",
  "Laut",
  "Ombak",
  "Pita",
  "Sikat",
  "Wadah",
  "Warna",
  "Zaitun",
];

const INDONESIAN_AWKWARD_OBJECT_SUFFIXES = [
  "akar",
  "bakul",
  "bambu",
  "batu",
  "benda",
  "biji",
  "bilik",
  "bunga",
  "cawan",
  "daun",
  "dulang",
  "gelas",
  "guci",
  "ikat",
  "jarum",
  "kaleng",
  "kaca",
  "kain",
  "kapas",
  "kayu",
  "kendi",
  "kerang",
  "kertas",
  "kipas",
  "kotak",
  "kubus",
  "kunci",
  "lampu",
  "lantai",
  "layar",
  "lemari",
  "lensa",
  "lidi",
  "lilin",
  "mangga",
  "meja",
  "nyiru",
  "pagar",
  "panci",
  "papan",
  "payung",
  "pelita",
  "piring",
  "pita",
  "pot",
  "rak",
  "rakit",
  "ranting",
  "rotan",
  "rumah",
  "saku",
  "sikat",
  "tali",
  "taman",
  "topi",
  "wadah",
  "wajan",
];

const INDONESIAN_AWKWARD_UNIVERSAL_OBJECT_SUFFIXES = [
  "benda",
  "bilik",
  "cawan",
  "dulang",
  "guci",
];

const INDONESIAN_ALLOWED_SELF_REPEATING_WORDS = new Set(["Cincin"]);

const hasGeneratedPair = (word, prefixes, suffixes) =>
  prefixes.some((prefix) =>
    suffixes.some((suffix) => word === `${prefix}${suffix}`),
  );

const hasGeneratedSuffix = (word, suffixes) =>
  suffixes.some(
    (suffix) =>
      word.endsWith(suffix) && word.length >= suffix.length + "Akar".length,
  );

const isAwkwardIndonesianCompound = (word) => {
  if (INDONESIAN_AWKWARD_COMPOUND_PATTERN.test(word)) return true;
  if (
    hasGeneratedPair(
      word,
      INDONESIAN_AWKWARD_ADJECTIVE_PREFIXES,
      INDONESIAN_AWKWARD_ADJECTIVE_SUFFIXES,
    )
  ) {
    return true;
  }
  if (
    hasGeneratedPair(
      word,
      INDONESIAN_AWKWARD_OBJECT_PREFIXES,
      INDONESIAN_AWKWARD_OBJECT_SUFFIXES,
    )
  ) {
    return true;
  }
  if (hasGeneratedSuffix(word, INDONESIAN_AWKWARD_UNIVERSAL_OBJECT_SUFFIXES)) {
    return true;
  }

  const lower = word.toLowerCase();
  if (lower.length % 2 !== 0) return false;
  if (INDONESIAN_ALLOWED_SELF_REPEATING_WORDS.has(word)) return false;
  const half = lower.slice(0, lower.length / 2);
  return half.length >= 3 && lower === `${half}${half}`;
};

const THAI_AWKWARD_ATTRIBUTE_ROOTS = [
  "น้ำ",
  "ไฟ",
  "ลม",
  "ข้าว",
  "ปลา",
  "นก",
  "แมว",
  "ม้า",
  "ช้าง",
  "กวาง",
  "ผึ้ง",
  "ไก่",
  "เป็ด",
  "ห่าน",
  "กุ้ง",
  "ปู",
  "หอย",
];

const THAI_AWKWARD_ATTRIBUTE_SUFFIXES = [
  "ดี",
  "ยาว",
  "สูง",
  "ต่ำ",
  "หนัก",
  "แบน",
  "กว้าง",
  "แคบ",
  "เย็น",
];

const isAwkwardThaiCompound = (word) =>
  hasGeneratedPair(
    word,
    THAI_AWKWARD_ATTRIBUTE_ROOTS,
    THAI_AWKWARD_ATTRIBUTE_SUFFIXES,
  );

const VIETNAMESE_AWKWARD_EXACT_COMPOUNDS = new Set([
  "nướccao",
  "lửacao",
  "nhàcao",
  "vườncao",
  "xanhxanh",
  "hoacao",
  "trecao",
  "camcao",
  "chimcao",
  "khoaicao",
  "lencao",
  "sencao",
  "thancao",
  "tranhcao",
  "khoaiđèn",
  "lácửa",
  "lạchồ",
  "chuôngbình",
  "ruộngthuyền",
  "nắngcam",
  "trăngđậu",
  "bànchảitrắng",
  "bànchảiđồng",
  "gốiớt",
  "chiếugạo",
  "mànhbút",
  "hộpxanh",
  "bútvàng",
  "cốcđen",
  "báttrắng",
  "vảitím",
  "lụahồng",
  "đènđen",
  "bìnhnâu",
  "vườnnắng",
  "ruộnggió",
  "đồngmát",
  "bãivàng",
  "sânxanh",
  "núimát",
  "đồinắng",
  "aomát",
  "hồxanh",
  "sôngmát",
]);

const isAwkwardVietnameseCompound = (word) => {
  const lower = word.toLowerCase();
  if (VIETNAMESE_AWKWARD_EXACT_COMPOUNDS.has(lower)) return true;
  if (lower.length % 2 !== 0) return false;
  const half = lower.slice(0, lower.length / 2);
  return half.length >= 3 && lower === `${half}${half}`;
};

const HINDI_AWKWARD_EXACT_COMPOUNDS = new Set([
  "किताबमाटी",
  "घड़ास्टेशन",
  "दीपकसड़क",
  "मोहल्लाकुर्सी",
  "मोहल्लातवा",
  "थालीकुर्सी",
  "कटोरामेज",
  "प्यालास्टेशन",
  "डिब्बासड़क",
  "मीठानमक",
  "मीठाप्याज",
  "ताजाकुर्सी",
  "गमलारोटी",
  "सुनहराकुर्सी",
  "सुनहरामेज",
  "रूपहलालहसुन",
  "रूपहलासत्तू",
  "रूपहलालस्सी",
  "रूपहलासूप",
  "रूपहलाहांडी",
  "सुनहरादान",
  "रूपहलाघर",
  "नदीघर",
  "नदीबाजार",
  "नदीलाल",
  "नदीसुनहरा",
  "झीलनीला",
  "लालघर",
  "नीलाकिताब",
  "छोटामिट्टी",
  "बड़ाहवा",
  "कागजकंबल",
  "कागजरजाई",
  "कपासदीया",
  "चांदीकुर्सी",
  "गांवमेड़",
  "बरामदाबाजार",
  "तालाबसुनहरा",
  "समुद्ररूपहला",
  "हवाकाला",
  "सूरजहरा",
  "चाँदपीला",
  "रास्तागुलाबी",
  "पीतलकंबल",
  "ईंटसाड़ी",
  "अपरस",
  "सुपली",
  "खिड़कीपट",
  "टोकरीढक्कन",
  "गरमपानी",
  "चावलदान",
  "मोडक",
  "पटल",
  "बखार",
  "सरौता",
  "बलुआ",
  "खर्रा",
  "पपीहा",
]);

const isAwkwardHindiCompound = (word) =>
  HINDI_AWKWARD_EXACT_COMPOUNDS.has(word);

const ARABIC_ABSTRACT_COMPOUND_PREFIXES = [
  "صفاء",
  "هدوء",
  "بسمة",
  "فرح",
  "أمل",
];

const isAwkwardArabicCompound = (word) =>
  ARABIC_ABSTRACT_COMPOUND_PREFIXES.some(
    (prefix) => word.startsWith(prefix) && word !== prefix,
  );

const CHINESE_GENERATED_COMPOUND_PATTERN =
  /^(木|梅|杉|竹|棉|麻|兰|草|玉|石|纸|藤|布|砂|花|豆|米|松|枫|琥珀|翡翠|玛瑙)(小)?(筐|篮|盏|架|匣|瓶|钵|盂|盒|盖|箔|盆|塞|芯|坠|槽|坯|扣子|箩|提篮|篓|笼|夹|杯|碗|盘|筷|板|片|块|挂件|罐|箸|盒盖|坠子|木勺|刷|梳|小罐|小盘|小盒|小盆|小槽|小箩|小篓|小笼|小夹|小板|小片|小块)$/u;

const JAPANESE_GENERATED_COMPOUND_PATTERN =
  /^(き|すな|たけ|つた|かみ|ぬの|いと|すぎ|まめ|こめ|はな|くさ|あさ|きぬ|めのう|ひのき|もめん|はっぱ|もみじ|こはく|ひすい|ふじ|つち|よし|まつ|とう|たま|わら)(こ)?(とって|うけ|ぼう|こもの|はたき|こいた|こだい|こつぼ|さじ|すくい|めじるし|おけ|ふた|わく|はけ|くし|つつ|はこ|うちわ|ざる|へら|べら|つまみ|かご|かざり|とめ|いため|たば|かなぐ|ふだ|かさ|ひっかけ|ひきだし|づつみ|はりばこ|いとまき|おはじき|ちぎりえ|まめざら|ちゃたく|こざいく)$/u;

const KOREAN_ALLOWED_ONE_SYLLABLE = new Set(
  `
    물 빛 별 꽃 숲 쌀 밥 떡 솜 꿀 깨 벼 밤 봄 달 옷 천 흙 삽 배 귤 논
    닭 말 개 벌 새 맛 잔 향 국 김 해 붓 땅 곰 돌 들 샘 잎 늪 솔 씨 굴
    빵 집 찜 초 띠 옥 벨 편 잠 햄 톳 쌈 알 잼 참 쑥 끈 틀 숯 솥 짚
    뿔 빗 젓 쌍 찬 색 무 소 밀 팥 차 문 담 창 감 비 실 철 양 돛 벽 탕
  `
    .trim()
    .split(/\s+/),
);

const KOREAN_POETIC_ADJECTIVE_PATTERN =
  /^(정겨운|너른|푸른|따스한|고요한|소담한|포근한|새벽|밝은|고운|둥근|차분한|은빛|맑은)/u;

const KOREAN_GENERATED_COMPOUND_ROOT_PATTERN =
  /^(도토리|솔방울|연잎|나뭇잎|조약돌|자갈|잔디|이끼|꽃잎|들꽃|갈대|버들|무명|비단|삼베|모시|한지|종이|색종이|나무|대나무|토기|청자|백자|자개|수정|구리|옥돌|호박|면(?:솔방울|나뭇잎))/u;

const KOREAN_GENERATED_COMPOUND_ALLOWED_STANDALONE = new Set([
  "도토리",
  "솔방울",
  "연잎",
  "나뭇잎",
  "호박",
  "대나무",
  "조약돌",
]);

const KOREAN_UNAPPROVED_LOANWORD_PATTERN =
  /(화이트|블랙|레드|그린|스퀘어|플레인|로컬|글로벌|럭셔리|내추럴|스포티|미니멀|플라워|스카이|아이스|스노클|슬레드|클로저|트위스트|리스트|리퀴드|트렌디|소프트|솔리드|심플|다크|오가닉|어쿠스틱|엘레강스|컨셉|커스텀|프리미엄|에디션|패키지|텍스처|클리너|스테이지|플래시|리모컨|노트북|헤드폰|이어폰|스마트|디지털|비주얼|이미지|그래픽|사운드|뮤직|라이브|게이트|업그레이드)/u;

const KOREAN_ALLOWED_LOANWORDS = new Set([
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
  "머그잔",
  "프라이팬",
  "시리얼",
  "티슈",
  "에코백",
  "토트백",
]);

const GUIDE_REVIEWED_BLOCKLISTS = {
  english: ENGLISH_BLOCKED_TERMS,
  korean: KOREAN_BLOCKED_TERMS,
  chinese: CHINESE_BLOCKED_TERMS,
  japanese: JAPANESE_BLOCKED_TERMS,
  spanish: SPANISH_BLOCKED_TERMS,
  french: [...FRENCH_BLOCKED_TERMS, ...FRENCH_VERB_REJECTS],
  german: GERMAN_BLOCKED_TERMS,
  portuguese: PORTUGUESE_BLOCKED_TERMS,
  indonesian: INDONESIAN_BLOCKED_TERMS,
  thai: [
    "พนัน",
    "ยาเสพติด",
    "อาวุธ",
    "การเมือง",
    "ศาสนา",
    "หนี้",
    "ป่วย",
    "ตาย",
    "เกลียด",
    "โกง",
    "หลอก",
    "แพ้",
    "ผิด",
    "เหล้า",
    "เบียร์",
    "บุหรี่",
    "คาสิโน",
    "หวย",
    "ปืน",
    "มีดดาบ",
    "เลือด",
    "คุก",
    "ฆ่า",
    "ฆาต",
    "ขโมย",
    "โจร",
    "เซ็กซ์",
    "โป๊",
    "โรค",
    "ยา",
    "ไข้",
    "เจ็บ",
    "แผล",
    "ศพ",
    "ผี",
    "วัด",
    "พระ",
    "ราชา",
    "ตำรวจ",
    "ทหาร",
    "ภาษี",
    "ศาล",
    "คดี",
    "ล้ม",
    "พัง",
    "เสีย",
  ],
  vietnamese: [
    "cờbạc",
    "matúy",
    "vũkhí",
    "chínhtrị",
    "tôngiáo",
    "nợ",
    "bệnh",
    "chết",
    "rượu",
    "bia",
    "thuốclá",
    "súng",
    "máu",
    "tù",
    "giết",
    "tìnhdục",
    "dao",
  ],
  hindi: [
    "शराब",
    "जुआ",
    "नशा",
    "हथियार",
    "राजनीति",
    "धर्म",
    "मौत",
    "खून",
    "जेल",
    "सेक्स",
    "बीमारी",
    "कर्ज",
    "गोली",
    "बंदूक",
    "हत्या",
    "युद्ध",
    "चुनाव",
    "मंदिर",
    "प्रार्थना",
    "अस्पताल",
  ],
  arabic: [
    "دين",
    "حرب",
    "قتل",
    "دم",
    "سلاح",
    "مرض",
    "خمر",
    "سجن",
    "سياسة",
    "جنس",
    "قنبلة",
    "رصاص",
  ],
  russian: [
    "война",
    "оружие",
    "кровь",
    "тюрьма",
    "секс",
    "наркотик",
    "политика",
    "религия",
    "болезнь",
    "долг",
    "убийство",
    "казино",
    "алкоголь",
  ],
};

const EXACT_BLOCKLISTS = Object.fromEntries(
  Object.entries(GUIDE_REVIEWED_BLOCKLISTS).map(([language, words]) => [
    language,
    [...words, ...(AGENT_REVIEWED_BLOCKLISTS[language] ?? [])],
  ]),
);

const HANGUL_BASE = 0xac00;
const HANGUL_END = 0xd7a3;
const HANGUL_VOWEL_COUNT = 21;
const HANGUL_FINAL_COUNT = 28;
const KOREAN_VOWEL_CONFUSION_GROUPS = new Map([
  [1, "E"], // ㅐ
  [5, "E"], // ㅔ
]);

const makeKoreanPronunciationKey = (word) =>
  [...word]
    .map((char) => {
      const code = char.codePointAt(0);
      if (code < HANGUL_BASE || code > HANGUL_END) return char;

      const offset = code - HANGUL_BASE;
      const initial = Math.floor(
        offset / (HANGUL_VOWEL_COUNT * HANGUL_FINAL_COUNT),
      );
      const vowel = Math.floor(
        (offset % (HANGUL_VOWEL_COUNT * HANGUL_FINAL_COUNT)) /
          HANGUL_FINAL_COUNT,
      );
      const final = offset % HANGUL_FINAL_COUNT;
      const normalizedVowel = KOREAN_VOWEL_CONFUSION_GROUPS.get(vowel) ?? vowel;

      return `${initial}:${normalizedVowel}:${final}`;
    })
    .join("|");

const readJson = (path) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));

export const loadCodebooks = () =>
  Object.fromEntries(
    Object.entries(CODEBOOK_FILES).map(([language, path]) => [
      language,
      readJson(path),
    ]),
  );

const makeViolation = ({ language, index, word, rule, detail }) => ({
  language,
  index,
  word,
  rule,
  detail,
});

export const auditCodebooks = (codebooks = loadCodebooks()) => {
  const violations = [];
  const summary = {};

  for (const [language, words] of Object.entries(codebooks)) {
    const seen = new Map();
    summary[language] = {
      count: words.length,
      expectedCount: EXPECTED_COUNTS[language],
      unique: new Set(words).size,
      blanks: words.filter((word) => word.trim() === "").length,
    };

    if (words.length !== EXPECTED_COUNTS[language]) {
      violations.push(
        makeViolation({
          language,
          index: -1,
          word: `${words.length}`,
          rule: "expected-count",
          detail: `Expected ${EXPECTED_COUNTS[language]} entries`,
        }),
      );
    }

    if (language === "spanish") {
      const templateCompoundCount = words.filter(
        (word) =>
          !SPANISH_REVIEWED_STANDALONE_WORDS.has(word) &&
          SPANISH_TEMPLATE_COMPOUND_PATTERN.test(word),
      ).length;

      if (templateCompoundCount > SPANISH_COMPOUND_SATURATION_LIMIT) {
        violations.push(
          makeViolation({
            language,
            index: -1,
            word: `${templateCompoundCount}`,
            rule: "spanish-compound-saturation",
            detail: `Spanish codebooks should not be saturated with fused template compounds; limit is ${SPANISH_COMPOUND_SATURATION_LIMIT}`,
          }),
        );
      }
    }

    if (language === "french") {
      const templateCompoundCount = words.filter((word) =>
        FRENCH_TEMPLATE_COMPOUND_PATTERN.test(word),
      ).length;

      if (templateCompoundCount > FRENCH_COMPOUND_SATURATION_LIMIT) {
        violations.push(
          makeViolation({
            language,
            index: -1,
            word: `${templateCompoundCount}`,
            rule: "french-compound-saturation",
            detail: `French codebooks should not be saturated with fused template compounds; limit is ${FRENCH_COMPOUND_SATURATION_LIMIT}`,
          }),
        );
      }
    }

    if (language === "german") {
      const templateCompoundCount = words.filter((word) =>
        GERMAN_TEMPLATE_COMPOUND_PATTERN.test(word),
      ).length;

      if (templateCompoundCount > GERMAN_COMPOUND_SATURATION_LIMIT) {
        violations.push(
          makeViolation({
            language,
            index: -1,
            word: `${templateCompoundCount}`,
            rule: "german-compound-saturation",
            detail: `German codebooks should not be saturated with fused template compounds; limit is ${GERMAN_COMPOUND_SATURATION_LIMIT}`,
          }),
        );
      }
    }

    if (language === "portuguese") {
      const templateCompoundCount = words.filter((word) =>
        PORTUGUESE_TEMPLATE_COMPOUND_PATTERN.test(word),
      ).length;

      if (templateCompoundCount > PORTUGUESE_COMPOUND_SATURATION_LIMIT) {
        violations.push(
          makeViolation({
            language,
            index: -1,
            word: `${templateCompoundCount}`,
            rule: "portuguese-compound-saturation",
            detail: `Portuguese codebooks should not be saturated with fused template compounds; limit is ${PORTUGUESE_COMPOUND_SATURATION_LIMIT}`,
          }),
        );
      }
    }

    const koreanPronunciationKeys = new Map();

    for (const [index, word] of words.entries()) {
      if (word.trim() === "") {
        violations.push(
          makeViolation({
            language,
            index,
            word,
            rule: "blank",
            detail: "Codebook entries must not be blank",
          }),
        );
      }

      const previous = seen.get(word);
      if (previous !== undefined) {
        violations.push(
          makeViolation({
            language,
            index,
            word,
            rule: "duplicate",
            detail: `Duplicate of index ${previous}`,
          }),
        );
      }
      seen.set(word, index);

      const exactBlocklist = new Set(EXACT_BLOCKLISTS[language] ?? []);
      if (exactBlocklist.has(word)) {
        violations.push(
          makeViolation({
            language,
            index,
            word,
            rule: "reviewed-blocklist",
            detail: "Rejected by the codebook authoring guide review pass",
          }),
        );
      }

      if (language === "english") {
        if (!/^[A-Z][a-z]+$/.test(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "english-shape",
              detail: "English entries should use ordinary title-case words",
            }),
          );
        }
        if (word.length > 12) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "english-too-long",
              detail: "English entries should stay short for URL readability",
            }),
          );
        }
        if (/(ough|augh|psy|sch|corps)/i.test(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "english-hard-pronunciation",
              detail: "Guide rejects hard clusters and silent-letter patterns",
            }),
          );
        }
        if (ENGLISH_GENERATED_COMPOUND_PATTERN.test(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "english-generated-material-compound",
              detail:
                "English entries should avoid generated material/nature compounds",
            }),
          );
        }
      }

      if (language === "spanish") {
        if (!/^[A-Z][a-z]+$/.test(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "spanish-shape",
              detail:
                "Spanish URL codebook entries should use ASCII title-case words",
            }),
          );
        }
        if (word.length > 12) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "spanish-too-long",
              detail: "Spanish entries should stay short for URL readability",
            }),
          );
        }
        if (SPANISH_GENERATED_COMPOUND_PATTERN.test(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "spanish-generated-material-compound",
              detail:
                "Spanish entries should avoid fused generated material/object compounds",
            }),
          );
        }
      }

      if (language === "french") {
        if (!/^[A-Z][a-z]+$/.test(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "french-shape",
              detail:
                "French URL codebook entries should use ASCII title-case words",
            }),
          );
        }
        if (word.length > 12) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "french-too-long",
              detail: "French entries should stay short for URL readability",
            }),
          );
        }
      }

      if (language === "german") {
        if (isAwkwardGermanCompound(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "german-awkward-generated-compound",
              detail:
                "German generated compounds should avoid self-duplication and implausible object pairings",
            }),
          );
        }
        if (!/^[A-Z][a-z]+$/.test(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "german-shape",
              detail:
                "German URL codebook entries should use ASCII title-case words",
            }),
          );
        }
        if (word.length > 12) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "german-too-long",
              detail: "German entries should stay short for URL readability",
            }),
          );
        }
      }

      if (language === "portuguese") {
        if (isAwkwardPortugueseCompound(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "portuguese-awkward-generated-compound",
              detail:
                "Portuguese generated compounds should avoid self-duplication and implausible object pairings",
            }),
          );
        }
        if (!/^[A-Z][a-z]+$/.test(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "portuguese-shape",
              detail:
                "Portuguese URL codebook entries should use ASCII title-case words",
            }),
          );
        }
        if (word.length > 12) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "portuguese-too-long",
              detail:
                "Portuguese entries should stay short for URL readability",
            }),
          );
        }
      }

      if (language === "indonesian") {
        if (isAwkwardIndonesianCompound(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "indonesian-awkward-generated-compound",
              detail:
                "Indonesian generated compounds should avoid self-duplication and implausible object pairings",
            }),
          );
        }
        if (!/^[A-Z][a-z]+$/.test(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "indonesian-shape",
              detail:
                "Indonesian URL codebook entries should use ASCII title-case words",
            }),
          );
        }
        if (word.length > 12) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "indonesian-too-long",
              detail:
                "Indonesian entries should stay short for URL readability",
            }),
          );
        }
      }

      if (language === "thai") {
        if (isAwkwardThaiCompound(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "thai-awkward-generated-compound",
              detail:
                "Thai generated compounds should avoid broad noun/adjective pairings that read as template output",
            }),
          );
        }
        if (!/^[\p{Script=Thai}]+$/u.test(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "thai-script",
              detail: "Thai entries should be written in Thai script",
            }),
          );
        }
        if ([...word].length > 12) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "thai-too-long",
              detail: "Thai entries should stay short for readable share URLs",
            }),
          );
        }
      }

      if (language === "vietnamese") {
        if (isAwkwardVietnameseCompound(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "vietnamese-awkward-generated-compound",
              detail:
                "Vietnamese generated compounds should avoid broad adjective templates and implausible fused noun pairings",
            }),
          );
        }
        if (!/^[\p{Script=Latin}\p{Mark}]+$/u.test(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "vietnamese-script",
              detail:
                "Vietnamese entries should use Vietnamese Latin letters only",
            }),
          );
        }
        if (/[\s\-/#?]/.test(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "vietnamese-url-safety",
              detail:
                "Vietnamese entries should not contain spaces or URL separators",
            }),
          );
        }
        if ([...word].length > 14) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "vietnamese-too-long",
              detail:
                "Vietnamese entries should stay short for readable share URLs",
            }),
          );
        }
      }

      if (language === "hindi") {
        if (isAwkwardHindiCompound(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "hindi-awkward-generated-compound",
              detail:
                "Hindi generated compounds should avoid broad object/place or object/material pairings that read as template output",
            }),
          );
        }
        if (!/^[\p{Script=Devanagari}\p{Mark}]+$/u.test(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "hindi-script",
              detail: "Hindi entries should use Devanagari letters only",
            }),
          );
        }
        if (/[\s\-/#?]/.test(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "hindi-url-safety",
              detail:
                "Hindi entries should not contain spaces or URL separators",
            }),
          );
        }
        if ([...word].length > 14) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "hindi-too-long",
              detail:
                "Hindi entries should stay short for readable share URLs",
            }),
          );
        }
      }

      if (language === "arabic") {
        if (isAwkwardArabicCompound(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "arabic-awkward-generated-compound",
              detail:
                "Arabic generated compounds should avoid abstract mood/value prefixes fused to concrete objects",
            }),
          );
        }
        if (!/^[\p{Script=Arabic}\p{Mark}]+$/u.test(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "arabic-script",
              detail: "Arabic entries should use Arabic letters only",
            }),
          );
        }
        if (/[\s\-/#?]/.test(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "arabic-url-safety",
              detail:
                "Arabic entries should not contain spaces or URL separators",
            }),
          );
        }
        if ([...word].length > 14) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "arabic-too-long",
              detail:
                "Arabic entries should stay short for readable share URLs",
            }),
          );
        }
      }

      if (language === "russian") {
        if (!/^[\p{Script=Cyrillic}\p{Mark}]+$/u.test(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "russian-script",
              detail: "Russian entries should use Cyrillic letters only",
            }),
          );
        }
        if (/[\s\-/#?]/.test(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "russian-url-safety",
              detail:
                "Russian entries should not contain spaces or URL separators",
            }),
          );
        }
        if ([...word].length > 14) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "russian-too-long",
              detail:
                "Russian entries should stay short for readable share URLs",
            }),
          );
        }
      }

      if (language === "chinese") {
        if (CHINESE_GENERATED_COMPOUND_PATTERN.test(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "chinese-generated-material-compound",
              detail:
                "Chinese entries should avoid generated material/object compounds",
            }),
          );
        }
      }

      if (language === "japanese") {
        if ([...word].length > 6) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "japanese-too-long",
              detail:
                "Japanese entries should stay short enough for readable share URLs",
            }),
          );
        }
        if (JAPANESE_GENERATED_COMPOUND_PATTERN.test(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "japanese-generated-material-compound",
              detail:
                "Japanese entries should avoid generated material/object compounds",
            }),
          );
        }
      }

      if (language === "korean" && !/^[\p{Script=Hangul}]+$/u.test(word)) {
        violations.push(
          makeViolation({
            language,
            index,
            word,
            rule: "korean-script",
            detail: "Korean entries should be written in Hangul",
          }),
        );
      }

      if (language === "korean") {
        if (
          KOREAN_GENERATED_COMPOUND_ROOT_PATTERN.test(word) &&
          [...word].length >= 4 &&
          !KOREAN_GENERATED_COMPOUND_ALLOWED_STANDALONE.has(word)
        ) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "korean-generated-material-compound",
              detail:
                "Korean entries should avoid generated material/nature compounds",
            }),
          );
        }

        if (KOREAN_POETIC_ADJECTIVE_PATTERN.test(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "korean-poetic-adjective-compound",
              detail:
                "Korean entries should avoid poetic adjective compounds in public address words",
            }),
          );
        }

        if ([...word].length === 1 && !KOREAN_ALLOWED_ONE_SYLLABLE.has(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "korean-weak-one-syllable",
              detail:
                "Korean one-syllable entries need explicit review and should be familiar standalone nouns",
            }),
          );
        }

        if ([...word].length >= 6) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "korean-too-long",
              detail:
                "Korean entries should stay short enough for readable share URLs",
            }),
          );
        }

        if (
          KOREAN_UNAPPROVED_LOANWORD_PATTERN.test(word) &&
          !KOREAN_ALLOWED_LOANWORDS.has(word)
        ) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "korean-unapproved-loanword",
              detail:
                "Korean loanword-style entries should be reviewed allowlist items, not style or product jargon",
            }),
          );
        }

        if (/[채체]반/.test(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "korean-obscure-household-term",
              detail:
                "Korean entries should avoid uncommon 채반/체반 family terms",
            }),
          );
        }

        const pronunciationKey = makeKoreanPronunciationKey(word);
        const previous = koreanPronunciationKeys.get(pronunciationKey);
        if (previous !== undefined && previous.word !== word) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "korean-pronunciation-collision",
              detail: `Sounds like index ${previous.index} "${previous.word}" under Korean confusion groups`,
            }),
          );
        } else {
          koreanPronunciationKeys.set(pronunciationKey, { index, word });
        }
      }

      if (language === "chinese" && !/^[\p{Script=Han}]+$/u.test(word)) {
        violations.push(
          makeViolation({
            language,
            index,
            word,
            rule: "chinese-script",
            detail: "Chinese entries should be written in Han characters",
          }),
        );
      }

      if (language === "japanese") {
        if (!/^[\p{Script=Hiragana}]+$/u.test(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "japanese-script",
              detail: "Japanese entries should remain hiragana-visible",
            }),
          );
        }
        if (/[っん]$/u.test(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "japanese-ending",
              detail: "Japanese entries should not end with small tsu or n",
            }),
          );
        }
        if (/^([\p{Script=Hiragana}])\1$/u.test(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "japanese-repeated-kana",
              detail: "Repeated-syllable filler should be rejected",
            }),
          );
        }
      }
    }
  }

  return { summary, violations };
};

export const formatAuditMarkdown = ({ summary, violations }) => {
  const rows = Object.entries(summary)
    .map(
      ([language, item]) =>
        `| ${language} | ${item.count} | ${item.expectedCount} | ${item.unique} | ${item.blanks} |`,
    )
    .join("\n");

  const samples = violations
    .slice(0, 80)
    .map(
      (item) =>
        `- ${item.language}[${item.index}] ${item.word}: ${item.rule} (${item.detail})`,
    )
    .join("\n");

  return [
    "# Codebook Policy Audit",
    "",
    "| Language | Count | Expected | Unique | Blanks |",
    "| --- | ---: | ---: | ---: | ---: |",
    rows,
    "",
    `Violations: ${violations.length}`,
    samples ? `\n${samples}` : "",
  ].join("\n");
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = auditCodebooks();
  console.log(formatAuditMarkdown(result));
  process.exitCode = result.violations.length === 0 ? 0 : 1;
}
