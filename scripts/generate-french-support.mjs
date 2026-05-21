import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const root = new URL("../", import.meta.url);
const geointRequire = createRequire(
  new URL("../packages/geoint/", import.meta.url),
);
const { default: KDBush } = await import(geointRequire.resolve("kdbush"));
const { Level } = await import(geointRequire.resolve("level"));

const readJson = (path) =>
  JSON.parse(readFileSync(new URL(path, root), "utf8"));
const writeJson = (path, value) =>
  writeFileSync(new URL(path, root), `${JSON.stringify(value, null, 2)}\n`);

const normalizeAscii = (value) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "Oe")
    .replace(/æ/g, "ae")
    .replace(/Æ/g, "Ae")
    .replace(/[’']/g, "")
    .replace(/[-/#?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const titleWord = (value) => {
  const normalized = normalizeAscii(value).replace(/[^A-Za-z]/g, "");
  if (!normalized) return "";
  return `${normalized[0].toUpperCase()}${normalized.slice(1).toLowerCase()}`;
};

const standaloneWords = [
  "Abri",
  "Aire",
  "Album",
  "Amande",
  "Ancre",
  "Aneth",
  "Anis",
  "Anneau",
  "Arbre",
  "Archet",
  "Argile",
  "Armoire",
  "Arome",
  "Atelier",
  "Aubepine",
  "Aulne",
  "Aurore",
  "Avoine",
  "Baguette",
  "Balai",
  "Balle",
  "Banc",
  "Bande",
  "Bateau",
  "Baton",
  "Baume",
  "Bocal",
  "Bois",
  "Boite",
  "Bol",
  "Bonbon",
  "Borne",
  "Bosse",
  "Boucle",
  "Bougie",
  "Boule",
  "Bouquet",
  "Bourgeon",
  "Bouton",
  "Branche",
  "Brique",
  "Brise",
  "Brosse",
  "Buis",
  "Cabane",
  "Cacao",
  "Cache",
  "Cahier",
  "Caisse",
  "Calebasse",
  "Canal",
  "Canne",
  "Carafe",
  "Carotte",
  "Carte",
  "Casier",
  "Cedre",
  "Cerisier",
  "Cerise",
  "Chalet",
  "Champ",
  "Chapeau",
  "Charme",
  "Chene",
  "Chevalet",
  "Cheville",
  "Ciel",
  "Cire",
  "Citron",
  "Clairiere",
  "Cloche",
  "Clou",
  "Coing",
  "Colline",
  "Coquille",
  "Corbeille",
  "Corde",
  "Coton",
  "Coupe",
  "Coussin",
  "Couvercle",
  "Craie",
  "Cruche",
  "Cuiller",
  "Cuivre",
  "Cypres",
  "Dalle",
  "Digue",
  "Drap",
  "Dune",
  "Echelle",
  "Ecorce",
  "Ecrin",
  "Ecuelle",
  "Etain",
  "Etagere",
  "Etang",
  "Etui",
  "Eventail",
  "Fagot",
  "Faience",
  "Farine",
  "Fauvette",
  "Feuille",
  "Ficelle",
  "Figue",
  "Fil",
  "Fleur",
  "Flocon",
  "Fontaine",
  "Fougere",
  "Fraise",
  "Frene",
  "Galet",
  "Gazon",
  "Givre",
  "Gobelet",
  "Graine",
  "Grange",
  "Gravier",
  "Griffe",
  "Grille",
  "Groseille",
  "Haie",
  "Herbe",
  "Hetre",
  "Houx",
  "Housse",
  "Iris",
  "Jardin",
  "Jarre",
  "Jasmin",
  "Jonc",
  "Laiton",
  "Lampe",
  "Lanterne",
  "Lavande",
  "Lierre",
  "Lin",
  "Lisiere",
  "Livre",
  "Louche",
  "Lueur",
  "Lutin",
  "Luzerne",
  "Macaron",
  "Malle",
  "Manche",
  "Manguier",
  "Margelle",
  "Marron",
  "Menthe",
  "Merisier",
  "Miel",
  "Miroir",
  "Moisson",
  "Moule",
  "Mousse",
  "Muguet",
  "Murier",
  "Myrtille",
  "Nappe",
  "Nectar",
  "Noisette",
  "Noyer",
  "Nuage",
  "Olivier",
  "Ombelle",
  "Orge",
  "Osier",
  "Outil",
  "Paille",
  "Panier",
  "Papier",
  "Parasol",
  "Parfum",
  "Passoire",
  "Patere",
  "Pavillon",
  "Peigne",
  "Perle",
  "Pichet",
  "Pierre",
  "Pince",
  "Pinson",
  "Plateau",
  "Plume",
  "Poignee",
  "Poire",
  "Pommier",
  "Prairie",
  "Prune",
  "Pupitre",
  "Rayon",
  "Regle",
  "Rideau",
  "Rive",
  "Roseau",
  "Ruban",
  "Sable",
  "Sabot",
  "Safran",
  "Sapin",
  "Sauge",
  "Seau",
  "Seigle",
  "Semence",
  "Serre",
  "Serviette",
  "Silex",
  "Sureau",
  "Table",
  "Tamis",
  "Tasse",
  "Thym",
  "Tilleul",
  "Tiroir",
  "Toile",
  "Torchon",
  "Tournesol",
  "Trefle",
  "Treille",
  "Tuiles",
  "Tulipe",
  "Vallee",
  "Vanille",
  "Vase",
  "Verger",
  "Verre",
  "Verveine",
  "Vigne",
  "Violette",
  "Volet",
];

const supplementalStandaloneWords = [
  "Accordeon",
  "Accoudoir",
  "Agrafe",
  "Agneau",
  "Agrume",
  "Aimant",
  "Aigrette",
  "Airelle",
  "Alouette",
  "Ananas",
  "Alpage",
  "Amulette",
  "Anchois",
  "Anguille",
  "Anse",
  "Annuaire",
  "Arbalete",
  "Arrosoir",
  "Artichaut",
  "Asperge",
  "Aubergine",
  "Avocat",
  "Bac",
  "Baie",
  "Baignoire",
  "Balise",
  "Balancoire",
  "Bambou",
  "Bandana",
  "Banquette",
  "Baratte",
  "Baril",
  "Bassine",
  "Bec",
  "Beignet",
  "Bergamote",
  "Betterave",
  "Biche",
  "Blette",
  "Bleuet",
  "Bocage",
  "Boiserie",
  "Bonbonniere",
  "Bonnet",
  "Bouchon",
  "Bouilloire",
  "Bouleau",
  "Bouture",
  "Bracelet",
  "Branchette",
  "Brindille",
  "Briquette",
  "Broderie",
  "Brouette",
  "Bruine",
  "Buvard",
  "Cabas",
  "Cabillaud",
  "Cafe",
  "Caille",
  "Canard",
  "Canneberge",
  "Capeline",
  "Capucine",
  "Caravane",
  "Carnet",
  "Carreau",
  "Casserole",
  "Cassis",
  "Castor",
  "Cerfeuil",
  "Cerf",
  "Chanterelle",
  "Chardon",
  "Chataigne",
  "Chaussette",
  "Chaudron",
  "Chemise",
  "Chenil",
  "Cheval",
  "Chevet",
  "Chevre",
  "Chevreuil",
  "Chien",
  "Chou",
  "Ciboule",
  "Ciboulette",
  "Cigale",
  "Citrouille",
  "Classeur",
  "Clavier",
  "Clairevoie",
  "Cloison",
  "Clochette",
  "Clementine",
  "Colza",
  "Compotier",
  "Confiture",
  "Corail",
  "Cornet",
  "Cormier",
  "Couteau",
  "Couette",
  "Courge",
  "Courgette",
  "Couscous",
  "Cresson",
  "Crevette",
  "Crayon",
  "Cygne",
  "Dattier",
  "Dentelle",
  "Echalote",
  "Eglantine",
  "Epeautre",
  "Ecureuil",
  "Echarpe",
  "Eponge",
  "Estragon",
  "Faisselle",
  "Faisan",
  "Fenouil",
  "Feutre",
  "Flanelle",
  "Fleurette",
  "Flute",
  "Fourche",
  "Fourneau",
  "Foulard",
  "Furet",
  "Futaie",
  "Gant",
  "Gaufre",
  "Genet",
  "Gilet",
  "Girofle",
  "Glycine",
  "Goujon",
  "Gourde",
  "Grive",
  "Haricot",
  "Hamster",
  "Herisson",
  "Hirondelle",
  "Horloge",
  "Houblon",
  "Jambon",
  "Jujube",
  "Jupe",
  "Lacet",
  "Laitue",
  "Lambris",
  "Lapin",
  "Lentille",
  "Lezard",
  "Lilas",
  "Liseron",
  "Libellule",
  "Lievre",
  "Loutre",
  "Luciole",
  "Loupe",
  "Manteau",
  "Marmite",
  "Melisse",
  "Merle",
  "Mirabelle",
  "Moineau",
  "Mulot",
  "Muscade",
  "Mouchoir",
  "Nacelle",
  "Navet",
  "Neflier",
  "Oignon",
  "Orange",
  "Oreiller",
  "Oseille",
  "Orvet",
  "Palet",
  "Palette",
  "Panais",
  "Pantalon",
  "Paon",
  "Pastille",
  "Patate",
  "Peinture",
  "Pelote",
  "Perche",
  "Pipeau",
  "Pivoine",
  "Pivert",
  "Poireau",
  "Poelon",
  "Poivron",
  "Pois",
  "Poule",
  "Potiron",
  "Poterie",
  "Poussette",
  "Prunelle",
  "Raifort",
  "Radis",
  "Rameau",
  "Ramequin",
  "Renard",
  "Rhubarbe",
  "Robinet",
  "Ronce",
  "Roseraie",
  "Salopette",
  "Sarriette",
  "Saumon",
  "Savon",
  "Scie",
  "Sirop",
  "Sorbier",
  "Tabouret",
  "Tapis",
  "Tartelette",
  "Terrine",
  "Tisane",
  "Tomme",
  "Tomate",
  "Tonnelet",
  "Toupie",
  "Tricot",
  "Truite",
  "Tussilage",
  "Ustensile",
  "Valise",
  "Vannerie",
  "Velours",
  "Violette",
  "Viorne",
  "Zeste",
];

const additionalSupplementalStandaloneWords = [
  "Abricot",
  "Acacia",
  "Ail",
  "Allee",
  "Alisier",
  "Ampoule",
  "Ancolie",
  "Anorak",
  "Arcade",
  "Autocar",
  "Basilic",
  "Beret",
  "Bigorneau",
  "Ble",
  "Bottine",
  "Brocoli",
  "Bruyere",
  "Cabine",
  "Cadran",
  "Cannelle",
  "Canape",
  "Caramel",
  "Carillon",
  "Cartable",
  "Celeri",
  "Cerceau",
  "Charrette",
  "Chausson",
  "Clarinette",
  "Coquelicot",
  "Couronne",
  "Cumin",
  "Crepiere",
  "Dahlia",
  "Domino",
  "Epinard",
  "Erable",
  "Escabeau",
  "Fauteuil",
  "Framboise",
  "Gaufrier",
  "Geranium",
  "Glaieul",
  "Gondole",
  "Gouttiere",
  "Harpe",
  "Jacinthe",
  "Jonquille",
  "Kiwi",
  "Lac",
  "Limace",
  "Lis",
  "Lys",
  "Mandarine",
  "Mer",
  "Meringue",
  "Navette",
  "Noiseraie",
  "Olive",
  "Origan",
  "Ortie",
  "Pagaie",
  "Pamplemousse",
  "Patisserie",
  "Peche",
  "Pedalo",
  "Persil",
  "Pissenlit",
  "Poivriere",
  "Pomelo",
  "Pomme",
  "Potimarron",
  "Pullover",
  "Ravier",
  "Reglette",
  "Ricotta",
  "Riz",
  "Romarin",
  "Sel",
  "Serpette",
  "Son",
  "Sorbet",
  "Soupiere",
  "Tambourin",
  "Tapisserie",
  "Tartine",
  "The",
  "Toboggan",
  "Tourte",
  "Vareuse",
  "Verrine",
  "Yaourt",
];

const prefixes = [
  "Abricot",
  "Acacia",
  "Amande",
  "Aneth",
  "Anis",
  "Argile",
  "Aulne",
  "Avoine",
  "Bambou",
  "Basilic",
  "Baie",
  "Ble",
  "Bois",
  "Bouleau",
  "Brise",
  "Bruyere",
  "Buis",
  "Cacao",
  "Cannelle",
  "Carotte",
  "Cedre",
  "Cerise",
  "Chene",
  "Cire",
  "Citron",
  "Coton",
  "Cypres",
  "Eau",
  "Dune",
  "Ecorce",
  "Erable",
  "Figue",
  "Fleur",
  "Fraise",
  "Frene",
  "Fer",
  "Galet",
  "Givre",
  "Graine",
  "Gravier",
  "Herbe",
  "Hetre",
  "Houx",
  "Iris",
  "Jasmin",
  "Jonc",
  "Lac",
  "Lavande",
  "Lierre",
  "Lin",
  "Lis",
  "Lys",
  "Luzerne",
  "Menthe",
  "Mer",
  "Miel",
  "Mousse",
  "Muguet",
  "Murier",
  "Myrtille",
  "Noisette",
  "Noyer",
  "Or",
  "Olive",
  "Orge",
  "Osier",
  "Paille",
  "Papier",
  "Peche",
  "Poire",
  "Pomme",
  "Pois",
  "Prairie",
  "Prune",
  "Roseau",
  "Riz",
  "Safran",
  "Sapin",
  "Sauge",
  "Seigle",
  "Sel",
  "Son",
  "Sureau",
  "Thym",
  "Tilleul",
  "Trefle",
  "Tulipe",
  "The",
  "Vanille",
  "Verveine",
  "Vigne",
  "Violette",
];

const suffixes = [
  "abri",
  "anse",
  "arc",
  "bague",
  "balai",
  "banc",
  "bocal",
  "boite",
  "bol",
  "borne",
  "boule",
  "brin",
  "brosse",
  "cache",
  "cadre",
  "caisse",
  "canne",
  "carafe",
  "carte",
  "casier",
  "cloche",
  "clou",
  "corde",
  "coupe",
  "coussin",
  "cruche",
  "dalle",
  "ecrin",
  "etui",
  "fagot",
  "ficelle",
  "fil",
  "flacon",
  "gobelet",
  "grille",
  "housse",
  "jarre",
  "lampe",
  "louche",
  "malle",
  "manche",
  "moule",
  "nappe",
  "panier",
  "patere",
  "peigne",
  "pichet",
  "pince",
  "plaque",
  "plateau",
  "poche",
  "poignee",
  "pot",
  "regle",
  "rideau",
  "ruban",
  "sac",
  "seau",
  "tamis",
  "tasse",
  "tiroir",
  "toile",
  "vase",
  "verre",
  "volet",
];

const reviewedFrenchVerbRejects = new Set(
  `
    Adjuger Affubler Agencer Agrafer Aliener Alleger Allouer Amenager Amorcer
    Aneantir Aplanir Arpenter Aspirer Asservir Associer Assurer Attirer
    Attraper Augurer Avaler Avancer Aviser Avouer Bafouer Balancer Bavarder
    Blanchir Blinder Bloquer Boiser Bondir Bonifier Bricoler Broder Bronzer
    Butiner Calculer Calmer Capter Caresser Causer Cerner Cesser Chavirer
    Chercher Choisir Cimenter Cintrer Circuler Claquer Cligner Codifier
    Cogner Coiffer Coincer Colmater Conduire Confier Congeler Couvrir Creuser
    Croquer Cultiver Debattre Debiter Deborder Decaler Decider Declarer
    Decorer Decrire Degager Demander Dessiner Devenir Deviner Douter Eclairer
    Ecouter Effacer Egarer Emporter Enlever Envoyer Essayer Eviter Exister
    Explorer Exposer Fermer Filtrer Forcer Fouiller Frapper Gagner Garantir
    Glisser Gonfler Grimper Hesiter Ignorer Imiter Imposer Imprimer Informer
    Inspirer Inventer Inviter Isoler Jongler Laisser Liberer Lister Lutter
    Nettoyer Observer Occuper Offrir Parler Partager Plonger Proteger Quitter
    Raconter Recycler Remplir Rester Sauter Separer Sortir Tailler Terminer
    Toucher Tricoter Varier Verser
  `
    .trim()
    .split(/\s+/),
);

const blockedCodebookWords = new Set([
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
]);

const buildFrenchCodebook = () => {
  const words = [];
  const seen = new Set();
  const bip39SeedWords = readJson(
    "packages/codebook/codebook-dataset/french/bip39-normalized-seed.json",
  );

  const add = (word) => {
    const candidate = titleWord(word);
    if (!candidate) return;
    if (!/^[A-Z][a-z]+$/.test(candidate)) return;
    if (candidate.length > 12) return;
    if (blockedCodebookWords.has(candidate)) return;
    if (reviewedFrenchVerbRejects.has(candidate)) return;
    if (seen.has(candidate)) return;
    seen.add(candidate);
    words.push(candidate);
  };

  for (const word of standaloneWords) add(word);
  for (const word of bip39SeedWords) add(word);
  for (const word of supplementalStandaloneWords) add(word);
  for (const word of additionalSupplementalStandaloneWords) add(word);

  for (const suffix of suffixes) {
    for (const prefix of prefixes) {
      add(`${prefix}${suffix}`);
      if (words.length >= 5000) break;
    }
    if (words.length >= 5000) break;
  }

  if (words.length < 5000) {
    throw new Error(`French codebook generated ${words.length} words`);
  }

  return words.slice(0, 5000);
};

const earthNameOverridesByCode = new Map(
  Object.entries({
    1835848: "Seoul",
    1850147: "Tokyo",
    1816670: "Pekin",
    2988507: "Paris",
    5128581: "New York",
    2643743: "Londres",
    2950159: "Berlin",
    3169070: "Rome",
    3530597: "Mexico",
    2147714: "Sydney",
    5368361: "Los Angeles",
    1880252: "Singapour",
    292223: "Dubai",
    745044: "Istanbul",
    3451190: "Rio",
    3435910: "Buenos Aires",
    360630: "Le Caire",
    3369157: "Le Cap",
    1275339: "Bombay",
    1273294: "Delhi",
    1609350: "Bangkok",
    1796236: "Shanghai",
    1819729: "Hong Kong",
    6167865: "Toronto",
    6077243: "Montreal",
    6094817: "Ottawa",
    6173331: "Vancouver",
  }),
);

const translateEarthRegionName = (row) => {
  if (earthNameOverridesByCode.has(String(row.code))) {
    return earthNameOverridesByCode.get(String(row.code));
  }
  return normalizeAscii(row.name);
};

const marineTerms = new Map([
  ["Sea", "Mer"],
  ["Ocean", "Ocean"],
  ["Bay", "Baie"],
  ["Gulf", "Golfe"],
  ["Channel", "Chenal"],
  ["Strait", "Detroit"],
  ["Sound", "Detroit"],
  ["Basin", "Bassin"],
  ["Ridge", "Dorsale"],
  ["Plateau", "Plateau"],
  ["Rise", "Ride"],
  ["Trench", "Fosse"],
  ["Bank", "Banc"],
]);

const translateRegion3Name = (row) => {
  let name = normalizeAscii(row.name);

  if (name === "Antarctic Continent") {
    return "Antarctique";
  }

  if (row.source === "synthetic-named-gap" && name === "HavreSaint Pierre") {
    return "Havre Pierre";
  }

  if (row.source === "natural-earth-marine") {
    const marineGridMatch = name.match(
      /^(.+) (Sea|Ocean|Bay|Gulf|Channel|Strait|Sound|Basin|Ridge|Plateau|Rise|Trench|Bank) (\d+)$/,
    );
    if (marineGridMatch) {
      const [, base, term, index] = marineGridMatch;
      return normalizeAscii(
        `${marineTerms.get(term) ?? term} ${base} ${index}`,
      );
    }

    for (const [english, french] of marineTerms) {
      name = name.replace(new RegExp(`^${english} `), `${french} `);
      name = name.replace(new RegExp(` ${english} `), ` ${french} `);
      name = name.replace(new RegExp(` ${english}( \\d+)$`), ` ${french}$1`);
    }
  }

  name = name
    .replace(/^Antarctic /, "Antarctique ")
    .replace(/^Arctic /, "Arctique ")
    .replace(/^Sahara /, "Sahara ")
    .replace(/^Greenland /, "Groenland ")
    .replace(/^Desert /, "Desert ")
    .replace(/^Forest /, "Foret ")
    .replace(/^Island /, "Ile ")
    .replace(/^Lake /, "Lac ")
    .replace(/^Mount /, "Mont ")
    .replace(/^River /, "Riviere ")
    .replace(/^Valley /, "Vallee ");

  return normalizeAscii(name);
};

const planetaryPhraseOverrides = new Map([
  ["Mare Tranquillitatis", "Mer Tranquillite"],
  ["Mare Serenitatis", "Mer Serenite"],
  ["Mare Imbrium", "Mer Pluies"],
  ["Mare Crisium", "Mer Crises"],
  ["Mare Nectaris", "Mer Nectar"],
  ["Mare Nubium", "Mer Nuages"],
  ["Mare Humorum", "Mer Humeurs"],
  ["Mare Frigoris", "Mer Froid"],
  ["Mare Orientale", "Mer Orientale"],
  ["Mare Australe", "Mer Australe"],
  ["Oceanus Procellarum", "Ocean Tempetes"],
  ["Sinus Iridum", "Baie Arcs"],
  ["Lacus Somniorum", "Lac Songes"],
  ["Olympus Mons", "Mont Olympe"],
  ["Elysium Mons", "Mont Elysium"],
  ["Ascraeus Mons", "Mont Ascraeus"],
  ["Arsia Mons", "Mont Arsia"],
  ["Pavonis Mons", "Mont Pavonis"],
  ["Valles Marineris", "Vallees Marineris"],
  ["Hellas Planitia", "Plaine Hellas"],
  ["Utopia Planitia", "Plaine Utopia"],
  ["Amazonis Planitia", "Plaine Amazonis"],
  ["Isidis Planitia", "Plaine Isidis"],
  ["Argyre Planitia", "Plaine Argyre"],
  ["Borealis Planitia", "Plaine Boreale"],
]);

const planetaryTerms = [
  [/^Mare /, "Mer "],
  [/^Maria /, "Mers "],
  [/^Oceanus /, "Ocean "],
  [/^Sinus /, "Baie "],
  [/^Lacus /, "Lac "],
  [/^Palus /, "Marais "],
  [/^Mons /, "Mont "],
  [/^Montes /, "Monts "],
  [/^Vallis /, "Vallee "],
  [/^Valles /, "Vallees "],
  [/^Rima /, "Rainure "],
  [/^Rimae /, "Rainures "],
  [/^Rupes /, "Escarpement "],
  [/^Dorsum /, "Ride "],
  [/^Dorsa /, "Rides "],
  [/^Planitia /, "Plaine "],
  [/^Planum /, "Plateau "],
  [/^Terra /, "Terre "],
  [/^Chaos /, "Chaos "],
  [/^Chasma /, "Gouffre "],
  [/^Chasmata /, "Gouffres "],
  [/^Vastitas /, "Plaine "],
  [/^Cavus /, "Creux "],
  [/^Cavi /, "Creux "],
  [/^Fossa /, "Fosse "],
  [/^Fossae /, "Fosses "],
  [/^Labes /, "Glissement "],
  [/^Lingula /, "Langue "],
  [/^Mensae /, "Mesas "],
  [/^Mensa /, "Mesa "],
  [/^Patera /, "Patera "],
  [/^Scopulus /, "Escarpe "],
  [/^Scopuli /, "Escarpes "],
  [/^Sulcus /, "Sillon "],
  [/^Sulci /, "Sillons "],
  [/^Tholus /, "Dome "],
  [/^Tholi /, "Domes "],
  [/^Undae /, "Dunes "],
  [/^Vicus /, "Village "],
  [/ Crater( \d+)?$/, " Cratere$1"],
];

const translatePlanetaryName = (name) => {
  const normalized = normalizeAscii(name);
  if (planetaryPhraseOverrides.has(normalized)) {
    return planetaryPhraseOverrides.get(normalized);
  }

  let translated = normalized;
  for (const [pattern, replacement] of planetaryTerms) {
    translated = translated.replace(pattern, replacement);
  }
  translated = translated.replace(
    /^([A-Za-z]+) Cratere( \d+)?$/,
    "Cratere $1$2",
  );
  return normalizeAscii(translated);
};

const dedupeNames = (rows) => {
  const seen = new Set();
  return rows.map((row) => {
    const baseName = row.name;
    let name = baseName;
    let count = 2;
    while (seen.has(name.toLowerCase())) {
      name = `${baseName} ${count}`;
      count += 1;
    }
    seen.add(name.toLowerCase());
    if (name === row.name) return row;
    return {
      ...row,
      name,
    };
  });
};

const buildLocalizedRows = (sourcePath, targetPath, translateName) => {
  const rows = readJson(sourcePath).map((row) => ({
    ...row,
    name: translateName(row),
  }));
  writeJson(targetPath, dedupeNames(rows));
};

const buildEmbeddedRegionDb = async (regionName) => {
  const regionJsonPath = new URL(
    `packages/geoint/region-dist/${regionName}.json`,
    root,
  );
  const regionDbPath = new URL("packages/geoint/region-db/", root);
  const regionLevelDbPath = path.join(regionDbPath.pathname, regionName);
  const regionKDBushPath = path.join(
    regionDbPath.pathname,
    `${regionName}.index`,
  );
  const regionLevel = Number(regionName.split("-")[1]);
  const regions = JSON.parse(readFileSync(regionJsonPath, "utf8"));

  mkdirSync(regionDbPath, { recursive: true });
  rmSync(regionLevelDbPath, { recursive: true, force: true });
  rmSync(regionKDBushPath, { force: true });

  const kdbush = new KDBush(regions.length);
  const db = new Level(regionLevelDbPath);
  await db.open();

  for (const [index, region] of regions.entries()) {
    await db.put(`I-${index}`, JSON.stringify(region));
    await db.put(
      `N-${regionLevel === 1 ? region.code : region.name}`,
      `I-${index}`,
    );
    kdbush.add(region.long, region.lat);
  }

  kdbush.finish();
  await db.close();
  writeFileSync(regionKDBushPath, Buffer.from(kdbush.data));
};

const mode = process.argv[2] ?? "all";
if (!["all", "codebook-only"].includes(mode)) {
  throw new Error(`Unsupported mode: ${mode}`);
}

writeJson("packages/codebook/codebook-dist/french.json", buildFrenchCodebook());

if (mode === "all") {
  buildLocalizedRows(
    "packages/geoint/region-dist/region-2.json",
    "packages/geoint/region-dist/region-2-french.json",
    translateEarthRegionName,
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-3.json",
    "packages/geoint/region-dist/region-3-french.json",
    translateRegion3Name,
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-2-moon.json",
    "packages/geoint/region-dist/region-2-moon-french.json",
    (row) => translatePlanetaryName(row.name),
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-2-mars.json",
    "packages/geoint/region-dist/region-2-mars-french.json",
    (row) => translatePlanetaryName(row.name),
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-3-mars.json",
    "packages/geoint/region-dist/region-3-mars-french.json",
    (row) => translatePlanetaryName(row.name),
  );

  for (const regionName of [
    "region-2-french",
    "region-3-french",
    "region-2-moon-french",
    "region-2-mars-french",
    "region-3-mars-french",
  ]) {
    await buildEmbeddedRegionDb(regionName);
  }
}
