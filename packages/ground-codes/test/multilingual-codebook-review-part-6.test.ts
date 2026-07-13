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
  test("keeps French codebook URL-safe and neutral", () => {
    assert.equal(frenchWords.length, 5000);
    assert.equal(new Set(frenchWords).size, frenchWords.length);
    assert.deepEqual(
      frenchWords.filter((word) => !/^[A-Z][a-z]+$/.test(word)),
      [],
    );
    assert.deepEqual(
      frenchWords.filter((word) => word.length > 12),
      [],
    );
    assertWordsPresent(frenchWords, [
      "Abri",
      "Amande",
      "Bocal",
      "Panier",
      "Tilleul",
    ]);
    assertBlockedWordsAbsent(frenchWords, [
      "Sexe",
      "Casino",
      "Arme",
      "Guerre",
      "Drogue",
      "Medecin",
      "Politique",
      "Religion",
      "Crime",
      "Mort",
      "Violence",
      "Abdiquer",
      "Abusif",
      "Anxieux",
      "Caution",
      "Censurer",
      "Cerveau",
      "Defensif",
      "Enfermer",
      "Erreur",
      "Exiler",
      "Fatal",
      "Fureur",
      "Furieux",
      "Horde",
      "Injecter",
      "Inutile",
      "Morsure",
      "Offenser",
      "Sombre",
      "Suspect",
      "Vexer",
      "Absence",
      "Actuel",
      "Analyse",
      "Aspect",
      "Avenir",
      "Bonus",
      "Cohesion",
      "Contact",
      "Crediter",
      "Critere",
      "Cycle",
      "Distance",
      "Domaine",
      "Effectif",
      "Exemple",
      "Fortune",
      "Fusion",
      "Impact",
      "Indice",
      "Logique",
      "Opinion",
      "Position",
      "Question",
      "Resultat",
      "Service",
      "Systeme",
      "Theorie",
      "Travail",
      "Union",
      "Usage",
      "Abaisser",
      "Abolir",
      "Aborder",
      "Aboutir",
      "Aboyer",
      "Abreuver",
      "Abriter",
      "Abroger",
      "Accabler",
      "Accepter",
      "Acclamer",
      "Accuser",
      "Acheter",
      "Acquerir",
      "Admettre",
      "Admirer",
      "Adopter",
      "Adorer",
      "Adoucir",
      "Affecter",
      "Agacer",
      "Agiter",
      "Ajouter",
      "Ajuster",
      "Allumer",
      "Alourdir",
      "Annexer",
      "Apaiser",
      "Appeler",
      "Apporter",
      "Appuyer",
      "Arracher",
      "Arriver",
      "Arroser",
      "Prevoir",
      "Priver",
      "Pouvoir",
      "Purifier",
      "Vouloir",
    ]);
  });

  test("keeps German codebook URL-safe and neutral", () => {
    assert.equal(germanWords.length, 5000);
    assert.equal(new Set(germanWords).size, germanWords.length);
    assert.deepEqual(
      germanWords.filter((word) => !/^[A-Z][a-z]+$/.test(word)),
      [],
    );
    assert.deepEqual(
      germanWords.filter((word) => word.length > 12),
      [],
    );
    assert.ok(
      germanWords.filter((word) => germanTemplateCompoundPattern.test(word))
        .length <= 3500,
    );
    assertWordsPresent(germanWords, [
      "Acker",
      "Apfel",
      "Bach",
      "Korb",
      "Wiese",
    ]);
    assertBlockedWordsAbsent(germanWords, [
      "Sex",
      "Casino",
      "Waffe",
      "Krieg",
      "Droge",
      "Arzt",
      "Politik",
      "Religion",
      "Verbrechen",
      "Tod",
      "Gewalt",
      "Angst",
      "Fehler",
      "Gefahr",
      "Hass",
      "Krankheit",
      "Problem",
      "Risiko",
      "Schmerz",
      "Schuld",
      "Sterben",
      "Toeten",
      "Verbot",
      "Verlust",
      "Zwang",
      "Abbauen",
      "Aendern",
      "Anfangen",
      "Arbeiten",
      "Besuchen",
      "Bleiben",
      "Denken",
      "Fragen",
      "Gehen",
      "Kaufen",
      "Koennen",
      "Laufen",
      "Machen",
      "Muessen",
      "Sagen",
      "Sehen",
      "Sollen",
      "Suchen",
      "Tragen",
      "Wollen",
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
  });

  test("keeps Portuguese codebook URL-safe and neutral", () => {
    assert.equal(portugueseWords.length, 5000);
    assert.equal(new Set(portugueseWords).size, portugueseWords.length);
    assert.deepEqual(
      portugueseWords.filter((word) => !/^[A-Z][a-z]+$/.test(word)),
      [],
    );
    assert.deepEqual(
      portugueseWords.filter((word) => word.length > 12),
      [],
    );
    assert.ok(
      portugueseWords.filter((word) =>
        portugueseTemplateCompoundPattern.test(word),
      ).length <= 3500,
    );
    assertWordsPresent(portugueseWords, [
      "Acucar",
      "Amendoa",
      "Areia",
      "Arvore",
      "Avela",
      "Casa",
      "Cesto",
      "Jardim",
      "Pao",
      "Rio",
    ]);
    assertBlockedWordsAbsent(portugueseWords, [
      "Almendra",
      "Avelan",
      "Basilio",
      "Betula",
      "Roble",
      "Yute",
      "Acucarfolha",
      "Aguafolha",
      "Acucarbanco",
      "Aguabanco",
      "Arvorebranco",
      "Folhabranco",
      "Luzbranco",
      "Sexo",
      "Casino",
      "Aposta",
      "Arma",
      "Guerra",
      "Droga",
      "Medico",
      "Politica",
      "Religiao",
      "Crime",
      "Morte",
      "Violencia",
      "Medo",
      "Erro",
      "Perigo",
      "Odio",
      "Doenca",
      "Problema",
      "Risco",
      "Dor",
      "Culpa",
      "Morrer",
      "Matar",
      "Proibido",
      "Perda",
      "Obrigar",
      "Fazer",
      "Querer",
      "Saber",
      "Dizer",
      "Poder",
      "Dever",
    ]);
  });
});
