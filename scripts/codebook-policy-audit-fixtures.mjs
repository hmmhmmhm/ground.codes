export const makeHangulFixtures = (count) => {
  const lead = ["가", "나", "다", "라", "마", "바", "사", "아", "자", "차"];
  const middle = ["구", "누", "두", "루", "무", "부", "수", "우", "주", "추"];
  const tail = ["기", "니", "디", "리", "미", "비", "시", "이", "지", "치"];
  const words = [];

  for (const a of lead) {
    for (const b of middle) {
      for (const c of tail) {
        for (const d of lead) {
          words.push(`${a}${b}${c}${d}`);
          if (words.length === count) {
            return words;
          }
        }
      }
    }
  }

  throw new Error(`Unable to generate ${count} Hangul fixtures`);
};

export const makeThaiFixtures = (count) => {
  const lead = ["กา", "นา", "ดา", "มา", "บา", "สา", "ลา", "ชา", "ตา", "ปา"];
  const middle = ["กุ", "นุ", "ดุ", "มุ", "บุ", "สุ", "ลุ", "ชุ", "ตุ", "ปุ"];
  const tail = ["กี", "นี", "ดี", "มี", "บี", "สี", "ลี", "ชี", "ตี", "ปี"];
  const words = [];

  for (const a of lead) {
    for (const b of middle) {
      for (const c of tail) {
        for (const d of lead) {
          words.push(`${a}${b}${c}${d}`);
          if (words.length === count) {
            return words;
          }
        }
      }
    }
  }

  throw new Error(`Unable to generate ${count} Thai fixtures`);
};

export const makeVietnameseFixtures = (count) => {
  const lead = [
    "lúa",
    "sen",
    "tre",
    "mây",
    "gạo",
    "hoa",
    "dừa",
    "núi",
    "sông",
    "biển",
  ];
  const tail = [
    "mát",
    "xanh",
    "vàng",
    "nhỏ",
    "sáng",
    "bền",
    "êm",
    "tươi",
    "thơm",
    "lành",
  ];
  const words = [];

  for (const a of lead) {
    for (const b of tail) {
      for (const c of lead) {
        for (const d of tail) {
          words.push(`${a}${b}${c}${d}`);
          if (words.length === count) {
            return words;
          }
        }
      }
    }
  }

  throw new Error(`Unable to generate ${count} Vietnamese fixtures`);
};

export const makeHindiFixtures = (count) => {
  const lead = [
    "जल",
    "घर",
    "कमल",
    "चाय",
    "नदी",
    "बाग",
    "दीप",
    "रंग",
    "पुल",
    "मिट्टी",
  ];
  const middle = [
    "घड़ा",
    "फूल",
    "पत्ता",
    "कप",
    "थाली",
    "दीया",
    "बेलन",
    "रस्सी",
    "डिब्बा",
    "कटोरा",
  ];
  const words = [];

  for (const a of lead) {
    for (const b of middle) {
      for (const c of lead) {
        for (const d of middle) {
          words.push(`${a}${b}${c}${d}`);
          if (words.length === count) {
            return words;
          }
        }
      }
    }
  }

  throw new Error(`Unable to generate ${count} Hindi fixtures`);
};

export const makeArabicFixtures = (count) => {
  const lead = [
    "ماء",
    "بيت",
    "نهر",
    "جبل",
    "ورد",
    "شاي",
    "كتاب",
    "تمر",
    "زيتون",
    "نخيل",
  ];
  const middle = [
    "حديقة",
    "سوق",
    "طريق",
    "جسر",
    "صندوق",
    "كوب",
    "طبق",
    "سلة",
    "قلم",
    "مصباح",
  ];
  const words = [];

  for (const a of lead) {
    for (const b of middle) {
      for (const c of lead) {
        for (const d of middle) {
          words.push(`${a}${b}${c}${d}`);
          if (words.length === count) {
            return words;
          }
        }
      }
    }
  }

  throw new Error(`Unable to generate ${count} Arabic fixtures`);
};

export const makeLatinFixtures = (count) => {
  const lead = [
    "Bana",
    "Dara",
    "Faro",
    "Gala",
    "Hema",
    "Jina",
    "Kalo",
    "Lima",
    "Mato",
    "Nira",
  ];
  const tail = [
    "baku",
    "dami",
    "feni",
    "goro",
    "haku",
    "joli",
    "kira",
    "lomu",
    "mika",
    "nalo",
  ];
  const words = [];

  for (const a of lead) {
    for (const b of tail) {
      for (const c of lead) {
        for (const d of tail) {
          words.push(`${a}${b}${c}${d}`);
          if (words.length === count) {
            return words;
          }
        }
      }
    }
  }

  throw new Error(`Unable to generate ${count} Latin fixtures`);
};

export const makeBengaliFixtures = (count) => {
  const lead = [
    "বাড়ি",
    "নদী",
    "ফুল",
    "বই",
    "গাছ",
    "পথ",
    "সেতু",
    "মাটি",
    "পাথর",
    "চাবি",
  ];
  const tail = [
    "কাপ",
    "বাটি",
    "কলম",
    "মেঘ",
    "তারা",
    "দরজা",
    "ছবি",
    "খাতা",
    "ইট",
    "ঘাস",
  ];
  const words = [];

  for (const a of lead) {
    for (const b of tail) {
      for (const c of lead) {
        for (const d of tail) {
          words.push(`${a}${b}${c}${d}`);
          if (words.length === count) {
            return words;
          }
        }
      }
    }
  }

  throw new Error(`Unable to generate ${count} Bengali fixtures`);
};

export const makeUrduFixtures = (count) => {
  const lead = [
    "گھر",
    "دریا",
    "پھول",
    "کتاب",
    "درخت",
    "راستہ",
    "پل",
    "مٹی",
    "پتھر",
    "چابی",
  ];
  const tail = [
    "کپ",
    "پیالہ",
    "قلم",
    "بادل",
    "ستارہ",
    "دروازہ",
    "تصویر",
    "کاپی",
    "اینٹ",
    "گھاس",
  ];
  const words = [];

  for (const a of lead) {
    for (const b of tail) {
      for (const c of lead) {
        for (const d of tail) {
          words.push(`${a}${b}${c}${d}`);
          if (words.length === count) {
            return words;
          }
        }
      }
    }
  }

  throw new Error(`Unable to generate ${count} Urdu fixtures`);
};

export const makeAmharicFixtures = (count) => {
  const lead = [
    "ቤት",
    "ወንዝ",
    "አበባ",
    "መጽሐፍ",
    "ዛፍ",
    "መንገድ",
    "ድልድይ",
    "አፈር",
    "ድንጋይ",
    "ቁልፍ",
  ];
  const tail = [
    "ኩባያ",
    "ሳህን",
    "ብዕር",
    "ደመና",
    "ኮከብ",
    "በር",
    "ስዕል",
    "ደብተር",
    "ጡብ",
    "ሣር",
  ];
  const words = [];

  for (const a of lead) {
    for (const b of tail) {
      for (const c of lead) {
        for (const d of tail) {
          words.push(`${a}${b}${c}${d}`);
          if (words.length === count) {
            return words;
          }
        }
      }
    }
  }

  throw new Error(`Unable to generate ${count} Amharic fixtures`);
};
