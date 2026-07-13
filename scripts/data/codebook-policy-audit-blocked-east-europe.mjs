import { readFileSync } from "node:fs";

export const SPANISH_REVIEW_FILES = [
  "../packages/codebook/codebook-dataset/spanish/standalone-review-2026-05-21.md",
];

export const readReviewedSpanishStandaloneWords = () => {
  const words = new Set();

  for (const path of SPANISH_REVIEW_FILES) {
    const text = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
    for (const match of text.matchAll(/`([A-Z][a-z]+)`/g)) {
      words.add(match[1]);
    }
  }

  return words;
};

export const CHINESE_BLOCKED_TERMS = [
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

export const JAPANESE_BLOCKED_TERMS = [
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

export const SPANISH_BLOCKED_TERMS = [
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

export const FRENCH_BLOCKED_TERMS = [
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

export const FRENCH_VERB_REJECTS = `
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

export const ENGLISH_GENERATED_COMPOUND_PATTERN =
  /^(Amber|Alder|Apricot|Ash|Bamboo|Basalt|Beech|Birch|Cedar|Clover|Cobalt|Copper|Cotton|Crystal|Elm|Fern|Flax|Fruit|Gold|Granite|Hazel|Heather|Ivory|Jade|Juniper|Larch|Maple|Oak|Pine|River|Tea|Vine|Willow|Bright|Sun|Wind|Moss|Lake|Grove|Blossom)(awl|basin|basket|basketry|bead|beaker|bench|binder|block|board|bobbin|bowl|broom|brush|buckle|caddy|case|charm|crate|creel|crock|cup|dibber|dipper|drainer|gimlet|hamper|ladle|loom|mortar|napkin|pestle|pitcher|planter|pot|punnet|quilt|rasp|rod|satchel|saucer|sifter|tassel|tile|toggle|tote|tray|trivet|trug|tumbler|vessel|brook|field|haven|ridge|stone|vale|fall|water|leaf|wood|garden|path|pond|meadow|crest|branch|breeze|sprout|trail)$/u;

export const SPANISH_GENERATED_COMPOUND_PATTERN =
  /^(Abedul|Abeto|Acebo|Acero|Agata|Alamo|Albahaca|Alcornoque|Alga|Algodon|Almendra|Aloe|Ambar|Arcilla|Arena|Avellana|Azahar|Bambu|Barro|Brezo|Bronce|Cacao|Cafe|Calabaza|Canela|Cerezo|Cobre|Coral|Cristal|Encina|Esparto|Fresno|Granito|Haya|Helecho|Hierro|Higo|Jade|Junco|Laurel|Lino|Madera|Marmol|Menta|Mimbre|Nogal|Olivo|Paja|Pino|Roble|Romero|Sauce|Tomillo|Trigo|Vid|Yute)(abanico|anillo|asa|azulejo|bandeja|banco|barreno|baston|baul|bol|bolsa|botella|boton|brocha|caja|cajon|canasta|candil|cazo|cepillo|cesto|cinta|copa|cordel|cuenco|cuchara|cubo|cuna|dedal|estante|estera|etiqueta|frasco|gancho|jarra|jarron|lampara|lienzo|maceta|mango|manta|marco|mazo|mortero|olla|paleta|palo|pano|peine|percha|pieza|pinza|placa|plato|regla|saco|sarten|sello|soporte|tabla|tablon|tarro|taza|tejido|telar|tijera|tinaja|tira|torno|trenza|vasija|vaso|vela|varilla|cuerda|cucharita|escobilla|cazuela|criba|tamiz|regadera|cubeta|palillo|costal|morral|boceto|canutillo|carrete|dedalera|hilera|jofaina|lebrillo)$/u;

export const SPANISH_TEMPLATE_COMPOUND_PATTERN =
  /^[A-Z][a-z]{3,}(?:abanico|anillo|aro|asa|azulejo|banco|bandeja|barreno|baston|baul|boceto|bol|bolsa|bote|botella|boton|brocha|caja|cajon|canasta|candil|carrete|cazo|cazuela|cepillo|cesta|cesto|cinta|copa|cordel|costal|criba|cuchara|cuerda|cuenco|cubo|cubeta|cuna|dado|dedal|estante|estera|etiqueta|ficha|flor|frasco|gancho|hilera|hoja|jarra|jarron|jofaina|lampara|lata|lebrillo|libro|lienzo|lona|luz|maceta|mango|manta|mapa|marco|mazo|mesa|miel|molde|morral|mortero|olla|pala|paleta|palillo|palo|pan|pano|peine|percha|pieza|pinza|placa|plato|red|regla|saco|sal|sarten|sello|silla|sol|soporte|tabla|tablon|tamiz|tapa|tarro|taza|tejido|telar|tijera|tinaja|tira|torno|trenza|tubo|vasija|vaso|vela|varilla)$/u;
export const SPANISH_COMPOUND_SATURATION_LIMIT = 2945;
export const SPANISH_REVIEWED_STANDALONE_WORDS =
  readReviewedSpanishStandaloneWords();

export const FRENCH_TEMPLATE_COMPOUND_PATTERN =
  /^[A-Z][a-z]{3,}(?:abri|anse|arc|bague|balai|banc|bocal|boite|bol|borne|boule|brin|brosse|cache|cadre|caisse|canne|carafe|carte|casier|cloche|clou|corde|coupe|coussin|cruche|dalle|ecrin|etui|fagot|ficelle|fil|flacon|gobelet|grille|housse|jarre|lampe|louche|malle|manche|moule|nappe|panier|patere|peigne|pichet|pince|plaque|plateau|poche|poignee|pot|regle|rideau|ruban|sac|seau|tamis|tasse|tiroir|toile|vase|verre|volet)$/u;
export const FRENCH_COMPOUND_SATURATION_LIMIT = 2500;
