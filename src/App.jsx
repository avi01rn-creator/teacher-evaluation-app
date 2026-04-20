import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, GraduationCap, Printer, ArrowLeft, CloudUpload, LogIn, LogOut, Download, FolderOpen, BriefcaseBusiness, ShieldCheck } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import "./App.css";

/* =======================
   CONFIG
======================= */

const CERT_BOX_COUNT = 6;
const RADAR_LABELS = ["Listening", "Reading", "Writing", "Speaking", "Attitude"];
const PUBLIC_GOOGLE_CONFIG = {
  clientId:
    "275262601989-oih2lqfh9droijqob2bkdnbbn6q5aqfp.apps.googleusercontent.com",
  driveFolderId: "1eXKxWUTNcs55RjEbcS8TGXc6DY3QaoYK",
};
const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID || PUBLIC_GOOGLE_CONFIG.clientId;
const GOOGLE_DRIVE_FOLDER_ID =
  import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID ||
  PUBLIC_GOOGLE_CONFIG.driveFolderId;
const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const DRIVE_SESSION_KEY = "linglow_drive_session";
const DRIVE_SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 4;
const GOOGLE_DRIVE_FOLDER_URL = GOOGLE_DRIVE_FOLDER_ID
  ? `https://drive.google.com/drive/folders/${GOOGLE_DRIVE_FOLDER_ID}`
  : "";
const GOOGLE_CONFIGURED =
  GOOGLE_CLIENT_ID &&
  GOOGLE_DRIVE_FOLDER_ID &&
  !GOOGLE_CLIENT_ID.includes("PASTE_YOUR") &&
  !GOOGLE_DRIVE_FOLDER_ID.includes("PASTE_YOUR");
const EXPORT_WIDTH = 2480;
const EXPORT_HEIGHT = 1754;
const EXPORT_TEMPLATE_BACKGROUND = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="${EXPORT_WIDTH}" height="${EXPORT_HEIGHT}" viewBox="0 0 ${EXPORT_WIDTH} ${EXPORT_HEIGHT}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fff7f8"/>
        <stop offset="48%" stop-color="#fffaf6"/>
        <stop offset="100%" stop-color="#fff5ea"/>
      </linearGradient>
      <radialGradient id="warm" cx="12%" cy="10%" r="28%">
        <stop offset="0%" stop-color="rgba(255,213,178,0.42)"/>
        <stop offset="100%" stop-color="rgba(255,213,178,0)"/>
      </radialGradient>
      <radialGradient id="rose" cx="88%" cy="12%" r="28%">
        <stop offset="0%" stop-color="rgba(244,193,214,0.28)"/>
        <stop offset="100%" stop-color="rgba(244,193,214,0)"/>
      </radialGradient>
      <radialGradient id="sky" cx="82%" cy="78%" r="24%">
        <stop offset="0%" stop-color="rgba(176,220,233,0.18)"/>
        <stop offset="100%" stop-color="rgba(176,220,233,0)"/>
      </radialGradient>
    </defs>
    <rect width="${EXPORT_WIDTH}" height="${EXPORT_HEIGHT}" rx="26" fill="url(#bg)"/>
    <rect x="14" y="14" width="${EXPORT_WIDTH - 28}" height="${EXPORT_HEIGHT - 28}" rx="22" fill="none" stroke="rgba(231,196,145,0.95)" stroke-width="2"/>
    <rect x="3" y="3" width="${EXPORT_WIDTH - 6}" height="${EXPORT_HEIGHT - 6}" rx="24" fill="none" stroke="rgba(227,194,142,0.92)" stroke-width="3"/>
    <rect width="${EXPORT_WIDTH}" height="${EXPORT_HEIGHT}" rx="26" fill="url(#warm)"/>
    <rect width="${EXPORT_WIDTH}" height="${EXPORT_HEIGHT}" rx="26" fill="url(#rose)"/>
    <rect width="${EXPORT_WIDTH}" height="${EXPORT_HEIGHT}" rx="26" fill="url(#sky)"/>
  </svg>
`)}`;
const FALLBACK_RUBRIC_HEADINGS = [
  "Confidence & Clarity (自信と明快な発声)",
  "Natural Fluency (自然な流暢さ)",
  "Pronunciation Focus (発音の正確性)",
  "Vocabulary Mastery (語彙の習得度)",
  "Content Comprehension (学習内容の理解力)",
  "Active Engagement (積極的な参加と表現)",
];

const LEVEL_CATEGORY_MAP = {
  30: ["基本の色 [Basic Colors]", "表現 [Everyday Expressions]", "基本の果物 [Basic Fruits]", "アルファベット [Alphabet Recognition]", "フォニックス [Single Letter Sounds]", "ライティング [Letter Writing]", "復習 [Review Skills]", "ことばのやりとり [Simple Responses]"],
  29: ["表現 [Everyday Expressions]", "数字 [Numbers]", "色 [Colors]", "アルファベット [Alphabet Recognition]", "フォニックス [Single Letter Sounds]", "ライティング [Letter Writing]", "復習 [Review Skills]", "ことばのやりとり [Simple Responses]"],
  28: ["果物 [Fruits]", "表現 [Everyday Expressions]", "数字 1-10 [Numbers 1-10]", "アルファベット [Alphabet Recognition]", "フォニックス [Single Letter Sounds]", "ライティング [Letter Writing]", "復習 [Review Skills]", "ことばのやりとり [Simple Responses]"],
  27: ["表現 [Everyday Expressions]", "乗り物 [Vehicles]", "動物 [Animals]", "アルファベット [Alphabet Recognition]", "フォニックス [Single Letter Sounds]", "ライティング [Letter Writing]", "復習 [Review Skills]", "ことばのやりとり [Simple Responses]"],
  26: ["動物園の動物 [Zoo Animals]", "あいさつ [Greetings]", "形 [Shapes]", "気持ち [Feelings]", "アルファベット [Alphabet Recognition]", "フォニックス [Single Letter Sounds]", "ライティング [Letter Writing]", "ことばのやりとり [Simple Responses]"],
  25: ["体のパーツ [Body Parts]", "海の動物 [Sea Animals]", "数字 1-100 [Numbers 1-100]", "アルファベット [Alphabet Recognition]", "フォニックス [Single Letter Sounds]", "ライティング [Letter Writing]", "復習 [Review Skills]", "ことばのやりとり [Simple Responses]"],
  24: ["あいさつ [Greetings]", "自分の名前 [Name]", "フォニックスの歌 [Phonics Song]", "色 [Colors]", "乗り物 [Vehicles]", "虫 [Insects]", "フォニックス [Phonics Sounds]", "ライティング [Letter Writing]"],
  23: ["あいさつ [Greetings]（名前 / 年れい / 感情表現）", "花 [Flowers]", "野菜 [Vegetables]", "おもちゃ [Toys]", "質問 [How Many?]", "質問 [How Much?]", "フォニックス [Phonics Sounds]", "ライティング [Letter Writing]"],
  22: ["あいさつ [Greetings]（名前 / 年れい / 感情表現）", "食べ物 1 [Food 1]", "持ち物 1 [Belongings 1]", "キッチン周りの道具 [Kitchen Utensils]", "食べ物 2 [Food 2]", "持ち物 2 [Belongings 2]", "フォニックス [Phonics Sounds]", "ライティング [Letter Writing]"],
  21: ["あいさつ [Greetings]（名前 / 年れい / 感情表現）", "曜日 [Days of the Week]", "反対言葉 [Opposites]", "天気 [Weather]", "衣類 1 [Clothes 1]", "衣類 2 [Clothes 2]", "フォニックス [Phonics Sounds]", "ライティング [Letter Writing]"],
  20: ["あいさつ [Greetings]（名前 / 年れい / 感情表現 / 天気）", "体調 [How Are You Feeling?]", "好き・きらい [Likes and Dislikes]", "持ち物 [Things You Have]", "ほしいもの [Things You Want]", "暑い日の服 [Hot Weather Clothes]", "フォニックス [Phonics Sounds]", "ライティング [Letter Writing]"],
  19: ["あいさつ [Greetings]（名前 / 年れい / 感情表現 / 天気）", "楽器 [Musical Instruments]", "スポーツ [Sports]", "動詞 1 [Verbs 1]", "動詞 2 [Verbs 2]", "家族・性格 [Family and Personality]", "フォニックス [Phonics Sounds]", "ライティング [Letter Writing]"],
  18: ["場所の表現 [Location Expressions]", "位置を説明する [Describing Where Things Are]", "習慣 [Daily Habits]", "いつも・ときどき [Frequency Expressions]", "自分について話す [Talking About Yourself]", "文で答える [Sentence Response]", "フォニックス [Phonics Sounds]", "ライティング [Letter Writing]"],
  17: ["あいさつ [Greetings]（名前 / 年れい / 感情表現）", "体のパーツ [Body Parts]", "季節 [Seasons]", "月日 [Months and Dates]", "年間行事 [Yearly Events]", "食べ物の特徴 [Food Adjectives]", "フォニックス [Phonics Sounds]", "ライティング [Letter Writing]"],
  16: ["道案内 [Giving Directions]", "将来の夢 [Future Dreams]", "誕生日にほしいもの [Birthday Wishes]", "年間行事 [Yearly Events]", "家族紹介 [Family Introduction]", "理由を添える [Giving Simple Reasons]", "フォニックス [Phonics Sounds]", "ライティング [Letter Writing]"],
  15: ["あいさつ [Greetings]（名前 / 年れい / 感情表現 / 天気）", "国 1 [Countries 1]", "国 2 [Countries 2]", "ランドマーク [Landmarks]", "シンボル [Symbols]", "複数形 [Plural Forms]", "フォニックス [Phonics Sounds]", "ライティング [Letter Writing]"],
  14: ["出身 [Hometown and Origin]", "国にあるもの [Things in Your Country]", "ものの説明 [Describing Things]", "ふだんすること [Usual Actions]", "時々すること [Sometimes]", "いつもすること [Always]", "フォニックス [Phonics Sounds]", "ライティング [Letter Writing]"],
  13: ["あいさつ [Greetings]（名前 / 年れい / 感情表現 / 誕生日）", "体のパーツ [Body Parts]", "症状 [Symptoms]", "動詞 [Verbs]", "関連語 [Related Words]", "質問に答える [Question Response]", "フォニックス [Phonics Sounds]", "ライティング [Letter Writing]"],
  12: ["過去 1 週間 [Last Week Topics]", "したこと [Things You Did]", "行った場所 [Places You Went]", "見たもの [Things You Saw]", "したかったこと [Things You Wanted To Do]", "順序立てて話す [Sequencing Ideas]", "フォニックス [Phonics Sounds]", "ライティング [Letter Writing]"],
  11: ["あいさつ [Greetings]（名前 / 年れい / 感情表現 / 天気 / 誕生日）", "動詞・質問 1 [Do You Like To...?]", "動詞・質問 2 [Did You...?]", "趣味 [Hobbies]", "形容詞 [Adjectives]", "関連語・Why? [Related Words and Why?]", "フォニックス [Phonics Sounds]", "ライティング [Letter Writing]"],
  10: ["出身地 [Hometown]", "有名なこと [Famous Things]", "持っているもの [Things You Have]", "得意なこと [Things You Are Good At]", "日常生活 [Daily Life]", "家族の仕事 [Family Jobs]", "フォニックス [Phonics Sounds]", "ライティング [Letter Writing]"],
  9: ["不定詞 [Infinitives]", "過去進行形 [Past Progressive]", "when の表現 [When Clauses]", "していたことを話す [Explaining Past Actions]", "アリバイゲーム [Alibi Game Responses]", "理由を加える [Adding Reasons]", "フォニックス [Phonics Sounds]", "ライティング [Letter Writing]"],
  8: ["家族の性格 [Family Personalities]", "家族の習慣 [Family Routines]", "思い出 [Memories]", "週末の予定 [Weekend Plans]", "雨の日の予定 [Rainy Day Plans]", "しなくてはいけないこと [Obligations]", "フォニックス [Phonics Sounds]", "ライティング [Letter Writing]"],
  7: ["あいさつ [Greetings]（名前 / 年れい / 感情表現 / 誕生日 / 天気 / 日曜日にすること）", "形容詞 [Adjectives]", "関連語・表現 [Related Words and Expressions]", "比較 [Comparatives]", "最上級 [Superlatives]", "比較の質問 [Comparison Questions]", "フォニックス [Phonics Sounds]", "ライティング [Letter Writing]"],
  6: ["したいこと [Things You Want To Do]", "行きたい場所 [Places You Want To Go]", "見たいもの [Things You Want To See]", "なりたいもの [Things You Want To Be]", "理由を言う [Giving Reasons]", "スピーチの流れ [Speech Flow]", "フォニックス [Phonics Sounds]", "ライティング [Letter Writing]"],
  5: ["あいさつ [Greetings]（名前 / 年れい / 感情表現 / 誕生日 / 天気 / 日曜日にすること）", "現在形の動詞 [Present Tense Verbs]", "過去形の動詞 [Past Tense Verbs]", "現在完了 1 [Have You Ever...?]", "現在完了 2 [How Long Have You...?]", "現在完了 3 [How Many Times Have You...?]", "フォニックス [Phonics Sounds]", "ライティング [Letter Writing]"],
  4: ["自己紹介 [Self Introduction]", "生まれた場所 [Where You Were Born]", "今住んでいる場所 [Where You Live Now]", "好きなこと [Things You Like Doing]", "長くしていること [Things You Have Done For A Long Time]", "行ったことがある場所 [Places You Have Been]", "フォニックス [Phonics Sounds]", "ライティング [Letter Writing]"],
  3: ["あいさつ [Greetings]（名前 / 年れい / 感情表現 / 誕生日 / 天気 / 日曜日にすること）", "Lv. 3 単語 [Level 3 Vocabulary]", "条件の質問 1 [If Questions 1]", "条件の質問 2 [If Questions 2]", "付加疑問文 [Tag Questions]", "間接疑問文 [Indirect Questions]", "フォニックス [Phonics Sounds]", "ライティング [Letter Writing]"],
  2: ["自己紹介 [Extended Self Introduction]", "比較と理由 [Comparisons and Reasons]", "将来の夢 [Future Dreams]", "したいこと [Things You Want To Do]", "なりたい人物像 [The Person You Want To Be]", "もしお金持ちなら [If You Were Rich]", "フォニックス [Phonics Awareness]", "ライティング [Letter Writing]"],
  1: ["あいさつ [Greetings]", "自分について [About Me]", "数と色 [Numbers and Colors]", "教室のことば [Classroom Words]", "フォニックス [Phonics Awareness]", "ライティング [Letter Writing]", "自信 [Confidence]", "参加の姿勢 [Participation]"],
};

/* =======================
   HELPERS
======================= */

const radarPoints = (values, size, padding) => {
  const count = values.length;
  const center = size / 2;
  const radius = center - padding;
  return values.map((value, i) => {
    const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
    const r = (value / 5) * radius;
    const x = center + Math.cos(angle) * r;
    const y = center + Math.sin(angle) * r;
    return `${x},${y}`;
  });
};

const truncateLabel = (label, max = 14) =>
  label.length > max ? `${label.slice(0, max)}…` : label;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const slugifyFilePart = (value, fallback = "item") =>
  (value || fallback)
    .trim()
    .replace(/[^\p{L}\p{N}._-]+/gu, "_")
    .replace(/^_+|_+$/g, "") || fallback;

const getLevelRubricHeadings = (levelValue) =>
  (LEVEL_CATEGORY_MAP[levelValue] || FALLBACK_RUBRIC_HEADINGS).slice(
    0,
    CERT_BOX_COUNT
  );

const parseHeadingParts = (heading) => {
  const bracketMatch = heading.match(/^(.*?)\s*\[(.*?)\]/);
  if (bracketMatch) {
    return {
      jp: bracketMatch[1].trim(),
      en: bracketMatch[2].trim(),
    };
  }

  const parenMatch = heading.match(/^(.*?)\s*\((.*?)\)$/);
  if (parenMatch) {
    return {
      en: parenMatch[1].trim(),
      jp: parenMatch[2].trim(),
    };
  }

  return { jp: heading.trim(), en: heading.trim() };
};

const averageToFive = (values) => {
  const validValues = values.filter((value) => typeof value === "number");
  if (!validValues.length) return 1;
  return Math.max(
    1,
    Math.min(5, Math.round(validValues.reduce((sum, value) => sum + value, 0) / validValues.length))
  );
};

const pickVariant = (variants, seed = 0) =>
  variants[Math.abs(seed) % variants.length];

const buildFocusStep = (focusHeading, levelValue = 1) => {
  const { jp, en } = parseHeadingParts(focusHeading || "");
  const english = (en || focusHeading || "this area").toLowerCase();
  const japanese = jp || focusHeading || "この項目";

  if (english.includes("greeting")) {
    return {
      en:
        levelValue <= 10
          ? "use greetings more naturally and confidently"
          : "make greetings feel more natural and confident",
      jp: "あいさつをもう少し自然に、自信を持って言えるようにすること",
    };
  }
  if (english.includes("phonics")) {
    return {
      en: "build more confidence with phonics sounds",
      jp: "フォニックスの音をより自信を持って読めるようにすること",
    };
  }
  if (english.includes("writing") || english.includes("letter")) {
    return {
      en: "make writing a little steadier and more confident",
      jp: "書く力をもう少し安定させ、自信につなげること",
    };
  }
  if (english.includes("question")) {
    return {
      en: "answer questions more smoothly and independently",
      jp: "質問にもう少しスムーズに、自分の力で答えられるようにすること",
    };
  }
  if (
    english.includes("verb") ||
    english.includes("present") ||
    english.includes("past") ||
    english.includes("perfect")
  ) {
    return {
      en: "use verb patterns more accurately and consistently",
      jp: "動詞の形をより正確に、安定して使えるようにすること",
    };
  }
  if (
    english.includes("adjective") ||
    english.includes("comparative") ||
    english.includes("superlative")
  ) {
    return {
      en: "use comparison and describing words more naturally",
      jp: "形容詞や比較表現をより自然に使えるようにすること",
    };
  }
  if (
    english.includes("number") ||
    english.includes("color") ||
    english.includes("fruit") ||
    english.includes("animal") ||
    english.includes("body") ||
    english.includes("vehicle")
  ) {
    return {
      en: `use ${en || focusHeading} more confidently in conversation`,
      jp: `${japanese}を会話の中でもっと自信を持って使えるようにすること`,
    };
  }

  return {
    en: `make ${en || focusHeading || "this area"} feel more natural and secure`,
    jp: `${japanese}をもう少し自然に、安定して使えるようにすること`,
  };
};

const detectRubricTone = (headingText) => {
  const text = (headingText || "").toLowerCase();

  if (text.includes("greeting") || text.includes("あいさつ")) {
    return {
      nounEn: "greetings",
      nounJp: "あいさつ",
      skillEn: "greeting use",
      skillJp: "あいさつのやりとり",
    };
  }
  if (text.includes("phonics") || text.includes("フォニックス")) {
    return {
      nounEn: "phonics sounds",
      nounJp: "フォニックス",
      skillEn: "sound recognition",
      skillJp: "音の読み取り",
    };
  }
  if (
    text.includes("writing") ||
    text.includes("letter") ||
    text.includes("ライティング")
  ) {
    return {
      nounEn: "writing",
      nounJp: "書く力",
      skillEn: "letter writing",
      skillJp: "文字を書く力",
    };
  }
  if (
    text.includes("question") ||
    text.includes("why") ||
    text.includes("質問")
  ) {
    return {
      nounEn: "question response",
      nounJp: "質問への答え方",
      skillEn: "answering questions",
      skillJp: "質問に答える力",
    };
  }
  if (
    text.includes("verb") ||
    text.includes("tense") ||
    text.includes("動詞") ||
    text.includes("present perfect")
  ) {
    return {
      nounEn: "verb use",
      nounJp: "動詞の使い方",
      skillEn: "sentence building",
      skillJp: "文の組み立て",
    };
  }
  if (
    text.includes("adjective") ||
    text.includes("comparative") ||
    text.includes("superlative") ||
    text.includes("形容詞") ||
    text.includes("比較")
  ) {
    return {
      nounEn: "descriptive language",
      nounJp: "表現の広がり",
      skillEn: "describing things",
      skillJp: "説明する力",
    };
  }
  if (
    text.includes("numbers") ||
    text.includes("colors") ||
    text.includes("fruit") ||
    text.includes("animal") ||
    text.includes("body") ||
    text.includes("vehicle") ||
    text.includes("weather") ||
    text.includes("country") ||
    text.includes("food")
  ) {
    return {
      nounEn: "target vocabulary",
      nounJp: "対象語い",
      skillEn: "word use",
      skillJp: "単語の定着",
    };
  }

  return {
    nounEn: "this area",
    nounJp: "この項目",
    skillEn: "overall use",
    skillJp: "全体の使い方",
  };
};

const buildRubricTexts = (headings, scores, levelValue = 1) =>
  scores.map((score, idx) => {
    const heading = headings[idx] || FALLBACK_RUBRIC_HEADINGS[idx] || "Skill";
    const tone = detectRubricTone(heading);
    const seed = levelValue * 17 + idx * 11 + (score || 1);

    const templatesByScore = {
      1: [
        {
          en: `${tone.nounEn} is still developing. A little more practice will help.`,
          jp: `${tone.nounJp}はこれから少しずつ伸ばしていきましょう。`,
        },
        {
          en: `${tone.skillEn} is at an early stage. Steady support will build confidence.`,
          jp: `${tone.skillJp}はまだ練習中ですが、少しずつ自信につながっていきそうです。`,
        },
      ],
      2: [
        {
          en: `${tone.nounEn} is starting to settle. A bit more repetition will help.`,
          jp: `${tone.nounJp}は少しずつ形になってきています。`,
        },
        {
          en: `${tone.skillEn} showed a good start today. It should become smoother with practice.`,
          jp: `${tone.skillJp}は良いスタートが見られました。くり返しでさらに自然になりそうです。`,
        },
      ],
      3: [
        {
          en: `${tone.nounEn} was steady today. Nice progress is showing.`,
          jp: `${tone.nounJp}は安定していて、良い成長が見られました。`,
        },
        {
          en: `${tone.skillEn} was reasonably secure today. This is moving in a good direction.`,
          jp: `${tone.skillJp}はしっかりしてきていて、順調に伸びています。`,
        },
      ],
      4: [
        {
          en: `${tone.nounEn} was a clear strength today. It was used with confidence.`,
          jp: `${tone.nounJp}は今日の強みの一つで、自信を持って取り組めていました。`,
        },
        {
          en: `${tone.skillEn} was very good today. There was clear confidence here.`,
          jp: `${tone.skillJp}はとても良くできていて、安定感がありました。`,
        },
      ],
      5: [
        {
          en: `${tone.nounEn} stood out beautifully today. Excellent work.`,
          jp: `${tone.nounJp}は特によくできていて、とても印象的でした。`,
        },
        {
          en: `${tone.skillEn} was excellent today. Confident and polished throughout.`,
          jp: `${tone.skillJp}は非常に素晴らしく、自信を持って表現できていました。`,
        },
      ],
    };

    const chosen = pickVariant(templatesByScore[score || 1], seed);
    return `${chosen.en}\n${chosen.jp}`;
  });

const buildAutoMessage = ({
  skills,
  rubrics,
  name,
  levelValue,
  totalCorrect,
  totalQuestionCount,
  headings,
}) => {
  const rubricAvg =
    rubrics.reduce((sum, score) => sum + (score || 0), 0) / rubrics.length;
  const accuracy = totalQuestionCount ? totalCorrect / totalQuestionCount : 0.6;
  const lowIndex = rubrics.indexOf(Math.min(...rubrics));
  const highIndex = rubrics.indexOf(Math.max(...rubrics));
  const focusHeading =
    headings?.[lowIndex] || FALLBACK_RUBRIC_HEADINGS[0];
  const strengthHeading =
    headings?.[highIndex] || FALLBACK_RUBRIC_HEADINGS[1];
  const focus = parseHeadingParts(focusHeading);
  const strength = parseHeadingParts(strengthHeading);
  const focusStep = buildFocusStep(focusHeading, levelValue);
  const learnerName = name ? `${name}, ` : "";
  const learnerNameJp = name ? `${name}さん、` : "";
  const seed = (name || "").length + levelValue + Math.round(rubricAvg * 10);

  const performanceBand =
    accuracy >= 0.84 && rubricAvg >= 4.2
      ? "high"
      : accuracy >= 0.64 && rubricAvg >= 3
        ? "mid"
        : "growth";

  if (levelValue <= 10) {
    const englishOpeners = {
      high: [
        `${learnerName}you brought wonderful energy to the lesson today, and ${strength.en} was especially strong.`,
        `${learnerName}you did a bright and confident job today, especially in ${strength.en}.`,
      ],
      mid: [
        `${learnerName}you worked hard today and showed nice progress throughout the lesson.`,
        `${learnerName}you stayed engaged today and showed steady growth in your English work.`,
      ],
      growth: [
        `${learnerName}you kept trying all the way through today, and that effort was lovely to see.`,
        `${learnerName}you showed a positive attitude today and kept going even when something felt difficult.`,
      ],
    };

    const englishClosers = [
      `Next time, let's keep working on how to ${focusStep.en}.`,
      `For the next step, we can focus on how to ${focusStep.en}.`,
    ];

    const japaneseOpeners = {
      high: [
        `${learnerNameJp}今日はとても明るく自信を持って取り組めていて、特に${strength.jp}がよくできていました。`,
        `${learnerNameJp}今日は元気よく取り組めていて、特に${strength.jp}が光っていました。`,
      ],
      mid: [
        `${learnerNameJp}今日はよく頑張っていて、しっかり成長が見られました。`,
        `${learnerNameJp}今日は最後まで集中して取り組み、少しずつ力がついている様子が見られました。`,
      ],
      growth: [
        `${learnerNameJp}今日は難しいところがあっても、あきらめずに頑張れていたのがとても良かったです。`,
        `${learnerNameJp}今日は前向きに取り組みながら、一つずつチャレンジする姿が見られました。`,
      ],
    };

    const japaneseClosers = [
      `次は、${focusStep.jp}ことを意識していきましょう。`,
      `次のレッスンでは、${focusStep.jp}ことを目標にしていきましょう。`,
    ];

    return `${pickVariant(englishOpeners[performanceBand], seed)} ${pickVariant(
      englishClosers,
      seed + 1
    )}
${pickVariant(japaneseOpeners[performanceBand], seed + 2)}${pickVariant(
      japaneseClosers,
      seed + 3
    )}`;
  }

  if (levelValue <= 20) {
    const englishOpeners = {
      high: [
        `${learnerName}you showed strong progress today, and ${strength.en} stood out as a clear strength.`,
        `${learnerName}you handled the lesson very well today, with particularly strong work in ${strength.en}.`,
      ],
      mid: [
        `${learnerName}you showed solid progress today and worked through the lesson with good focus.`,
        `${learnerName}you handled today's work steadily and showed encouraging growth across the lesson.`,
      ],
      growth: [
        `${learnerName}you stayed with the lesson well today and kept building your confidence step by step.`,
        `${learnerName}you kept working carefully today, and that effort is helping your skills grow.`,
      ],
    };

    const englishClosers = [
      `A good next focus is how to ${focusStep.en}, so the overall performance becomes even more consistent.`,
      `For the next step, let's work on how to ${focusStep.en}.`,
    ];

    const japaneseOpeners = {
      high: [
        `${learnerNameJp}今日はとても良い成長が見られ、特に${strength.jp}が印象的でした。`,
        `${learnerNameJp}今日は全体的にしっかり取り組めていて、特に${strength.jp}がよくできていました。`,
      ],
      mid: [
        `${learnerNameJp}今日は落ち着いて取り組み、着実な成長が見られました。`,
        `${learnerNameJp}今日は最後まで安定して取り組み、しっかり力を出すことができていました。`,
      ],
      growth: [
        `${learnerNameJp}今日は一つずつ丁寧に取り組みながら、少しずつ自信をつけている様子が見られました。`,
        `${learnerNameJp}今日は粘り強く取り組み、次につながる良い土台を作ることができました。`,
      ],
    };

    const japaneseClosers = [
      `次のステップとして、${focusStep.jp}ことを意識していきましょう。`,
      `これからは、${focusStep.jp}ことを通して全体の完成度を高めていきましょう。`,
    ];

    return `${pickVariant(englishOpeners[performanceBand], seed)} ${pickVariant(
      englishClosers,
      seed + 1
    )}
${pickVariant(japaneseOpeners[performanceBand], seed + 2)}${pickVariant(
      japaneseClosers,
      seed + 3
    )}`;
  }

  const englishOpeners = {
    high: [
      `${learnerName}you gave a polished performance today, with ${strength.en} standing out in particular.`,
      `${learnerName}you worked at a strong level today, and ${strength.en} was especially impressive.`,
    ],
    mid: [
      `${learnerName}you showed thoughtful progress today and communicated with growing confidence.`,
      `${learnerName}you handled today's lesson in a steady and mature way, showing clear development.`,
    ],
    growth: [
      `${learnerName}you engaged seriously with the lesson today and laid a good foundation for the next stage.`,
      `${learnerName}you approached the work carefully today and continued building toward greater confidence.`,
    ],
  };

  const englishClosers = [
    `A useful next focus will be how to ${focusStep.en}, so the overall performance feels even more natural and complete.`,
    `The next step is to work on how to ${focusStep.en}, which will make the overall performance even more polished.`,
  ];

  const japaneseOpeners = {
    high: [
      `${learnerNameJp}今日は全体的に完成度の高い取り組みで、特に${strength.jp}が印象的でした。`,
      `${learnerNameJp}今日はしっかりとした力が見られ、特に${strength.jp}が大きな強みになっていました。`,
    ],
    mid: [
      `${learnerNameJp}今日はよく考えながら取り組めており、表現への自信が着実についてきています。`,
      `${learnerNameJp}今日は安定して取り組めていて、全体として前向きな成長が見られました。`,
    ],
    growth: [
      `${learnerNameJp}今日は丁寧に取り組みながら、次の段階につながる土台をしっかり作ることができました。`,
      `${learnerNameJp}今日は一つずつ着実に取り組み、今後につながる大切な積み重ねができていました。`,
    ],
  };

  const japaneseClosers = [
    `次は、${focusStep.jp}ことを意識し、全体をさらに自然で完成度の高い表現にしていきましょう。`,
    `これからは、${focusStep.jp}ことを通して、全体の表現をより自然で洗練されたものにしていきましょう。`,
  ];

  return `${pickVariant(englishOpeners[performanceBand], seed)} ${pickVariant(
    englishClosers,
    seed + 1
  )}
${pickVariant(japaneseOpeners[performanceBand], seed + 2)}${pickVariant(
    japaneseClosers,
    seed + 3
  )}`;
};

const buildRadarSkillsFromRubrics = (rubrics) => {
  const safeRubrics = rubrics.map((score) => score || 1);
  return {
    listening: averageToFive([safeRubrics[0], safeRubrics[1], safeRubrics[4]]),
    reading: averageToFive([safeRubrics[2], safeRubrics[3], safeRubrics[4]]),
    writing: averageToFive([safeRubrics[3], safeRubrics[4], safeRubrics[5]]),
    speaking: averageToFive([safeRubrics[0], safeRubrics[1], safeRubrics[5]]),
    attitude: averageToFive(safeRubrics),
  };
};

const loadExternalScript = (src) =>
  new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      if (existingScript.dataset.loaded === "true") {
        resolve();
        return;
      }
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });

const sanitizeCssForPdf = (cssText) =>
  cssText
    .replace(/oklch\([^)]+\)/g, "rgb(120, 120, 120)")
    .replace(/oklab\([^)]+\)/g, "rgba(120, 120, 120, 0.4)")
    .replace(/color-mix\([^)]+\)/g, "rgba(255, 255, 255, 0.4)");

const sanitizeStyleValue = (value) => {
  if (!value || value === "none") return value;
  return value
    .replace(/oklch\([^)]+\)/g, "rgb(120, 120, 120)")
    .replace(/oklab\([^)]+\)/g, "rgba(120, 120, 120, 0.4)")
    .replace(/color-mix\([^)]+\)/g, "rgba(255, 255, 255, 0.4)");
};

const PDF_SAFE_STYLE_PROPS = [
  "color",
  "background",
  "backgroundColor",
  "backgroundImage",
  "borderColor",
  "borderTopColor",
  "borderRightColor",
  "borderBottomColor",
  "borderLeftColor",
  "outlineColor",
  "textDecorationColor",
  "boxShadow",
  "textShadow",
  "fill",
  "stroke",
];

const applyPdfSafeInlineStyles = (sourceRoot, clonedRoot) => {
  if (!sourceRoot || !clonedRoot) return;

  const sourceElements = [sourceRoot, ...sourceRoot.querySelectorAll("*")];
  const clonedElements = [clonedRoot, ...clonedRoot.querySelectorAll("*")];

  clonedElements.forEach((clonedEl, index) => {
    const sourceEl = sourceElements[index];
    if (!sourceEl) return;

    const computed = window.getComputedStyle(sourceEl);
    PDF_SAFE_STYLE_PROPS.forEach((prop) => {
      const safeValue = sanitizeStyleValue(computed[prop]);
      if (safeValue && safeValue !== "initial") {
        clonedEl.style[prop] = safeValue;
      }
    });

    clonedEl.style.backdropFilter = "none";
    clonedEl.style.webkitBackdropFilter = "none";
    clonedEl.style.filter = "none";
  });
};

const waitForImages = async (root) => {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }

          const finish = () => resolve();
          img.addEventListener("load", finish, { once: true });
          img.addEventListener("error", finish, { once: true });
        })
    )
  );
};

const buildSanitizedStylesheetText = () => {
  const cssChunks = [];

  Array.from(document.styleSheets).forEach((styleSheet) => {
    try {
      const rules = Array.from(styleSheet.cssRules || []);
      if (!rules.length) return;
      cssChunks.push(
        sanitizeCssForPdf(
          rules
            .map((rule) => rule.cssText)
            .join("\n")
        )
      );
    } catch {
      // Ignore cross-origin or unreadable stylesheets.
    }
  });

  return cssChunks.join("\n");
};

const isIOSDevice = () => {
  if (typeof window === "undefined") return false;
  const userAgent = window.navigator.userAgent || "";
  const platform = window.navigator.platform || "";
  const touchPoints = window.navigator.maxTouchPoints || 0;
  return /iPad|iPhone|iPod/i.test(userAgent) || (platform === "MacIntel" && touchPoints > 1);
};

const RadarChart = ({ values, labels }) => {
  const size = 360;
  const padding = 44;
  const center = size / 2;
  const levels = 5;
  const axisCount = labels.length;

  const gridPolygons = Array.from({ length: levels }, (_, i) => {
    const level = (i + 1) / levels;
    const points = labels.map((_, idx) => {
      const angle = (Math.PI * 2 * idx) / axisCount - Math.PI / 2;
      const r = (size / 2 - padding) * level;
      const x = center + Math.cos(angle) * r;
      const y = center + Math.sin(angle) * r;
      return `${x},${y}`;
    });
    return points.join(" ");
  });

  const dataPoints = radarPoints(values, size, padding).join(" ");

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="radar-svg"
      role="img"
      aria-label="Skill radar chart"
    >
      {gridPolygons.map((points, i) => (
        <polygon
          key={i}
          points={points}
          fill="none"
          stroke="#CBD5F5"
          strokeWidth="1"
        />
      ))}
      {labels.map((_, idx) => {
        const angle = (Math.PI * 2 * idx) / axisCount - Math.PI / 2;
        const x = center + Math.cos(angle) * (size / 2 - padding + 10);
        const y = center + Math.sin(angle) * (size / 2 - padding + 10);
        return (
          <line
            key={idx}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="#CBD5F5"
            strokeWidth="1"
          />
        );
      })}
      <polygon
        points={dataPoints}
        fill="rgba(255, 138, 91, 0.26)"
        stroke="#F97316"
        strokeWidth="2"
      />
      {labels.map((label, idx) => {
        const angle = (Math.PI * 2 * idx) / axisCount - Math.PI / 2;
        const xRaw = center + Math.cos(angle) * (size / 2 - padding + 22);
        const yRaw = center + Math.sin(angle) * (size / 2 - padding + 22);
        const x = clamp(xRaw, 26, size - 26);
        const y = clamp(yRaw, 20, size - 20);
        const anchor =
          Math.abs(xRaw - center) < 26 ? "middle" : xRaw < center ? "end" : "start";
        const dy =
          yRaw < center - 24 ? "-0.55em" : yRaw > center + 24 ? "1.2em" : "0.35em";
        return (
          <text
            key={label}
            x={x}
            y={y}
            textAnchor={anchor}
            dy={dy}
            fontSize="11"
            fill="#1F2937"
          >
            {truncateLabel(label)}
          </text>
        );
      })}
    </svg>
  );
};

const RatingDots = ({ score, onSelect, showMascot = false }) => (
  <div className="flex gap-2 mt-2 items-end">
    {[1, 2, 3, 4, 5].map((n) => {
      const isActive = n === score;
      const sizeClass = [
        "h-7 w-7 text-[11px]",
        "h-8 w-8 text-xs",
        "h-9 w-9 text-sm",
        "h-10 w-10 text-sm",
        "h-11 w-11 text-base",
      ][n - 1];
      return (
        <button
          type="button"
          key={n}
          onClick={onSelect ? () => onSelect(n) : undefined}
          className={`${sizeClass} rating-dot rounded-full border-2 flex items-center justify-center font-semibold transition ${
            isActive
              ? "bg-amber-400 border-amber-500 text-white"
              : "bg-white border-slate-300 text-slate-500"
          } ${showMascot && isActive ? "rating-dot--mascot" : ""}`}
        >
          {showMascot && isActive && (
            <img
              src="/mascot-head.png"
              alt=""
              className="rating-mascot-inner"
              aria-hidden="true"
            />
          )}
          <span className="rating-number">{n}</span>
        </button>
      );
    })}
  </div>
);

const ScoreBar = ({ score, onSelect, showMascot = false }) => (
  <div className="score-bar" role="group" aria-label="Select score">
    {[1, 2, 3, 4, 5].map((value) => {
      const isActive = value === score;
      return (
        <button
          type="button"
          key={value}
          onClick={() => onSelect(value)}
          className={`score-bar__segment ${isActive ? "score-bar__segment--active" : ""}`}
          aria-pressed={isActive}
        >
          {showMascot && isActive && (
            <img
              src="/mascot-head.png"
              alt=""
              className="score-bar__mascot"
              aria-hidden="true"
            />
          )}
          <span className="score-bar__number">{value}</span>
          <span className="score-bar__label">
            {["Emerging", "Developing", "Secure", "Strong", "Excellent"][value - 1]}
          </span>
        </button>
      );
    })}
  </div>
);

const PdfRatingDots = ({ score }) => (
  <div className="pdf-rating-dots" aria-label={`Score ${score || 1} out of 5`}>
    {[1, 2, 3, 4, 5].map((value) => (
      <span
        key={value}
        className={`pdf-rating-dot ${value === score ? "pdf-rating-dot--active" : ""}`}
      >
        {value === score && (
          <img
            src="/mascot-head.png"
            alt=""
            className="pdf-rating-mascot"
            aria-hidden="true"
          />
        )}
        <span className="pdf-rating-number">{value}</span>
      </span>
    ))}
  </div>
);

/* =======================
   APP
======================= */

export default function App() {
  const todayIso = new Date().toISOString().slice(0, 10);
  const [previewScale, setPreviewScale] = useState(1);
  const [printSize, setPrintSize] = useState("A4");
  const [studentName, setStudentName] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [certificateDate, setCertificateDate] = useState(todayIso);
  const [level, setLevel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedStudent, setSubmittedStudent] = useState(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [certificateData, setCertificateData] = useState(null);
  const [rubricScores, setRubricScores] = useState(
    Array(CERT_BOX_COUNT).fill(null)
  );
  const [googleReady, setGoogleReady] = useState(false);
  const [driveAccessToken, setDriveAccessToken] = useState("");
  const [driveUserEmail, setDriveUserEmail] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [pendingAutoUpload, setPendingAutoUpload] = useState(false);
  const [managerView, setManagerView] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState(
    () => (new URLSearchParams(window.location.search).get("savedEvaluation") ? "manager" : null)
  );
  const [savedEvaluations, setSavedEvaluations] = useState([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [savedEvaluationId] = useState(
    () => new URLSearchParams(window.location.search).get("savedEvaluation") || ""
  );
  const [isOpeningSavedEvaluation, setIsOpeningSavedEvaluation] = useState(false);
  const certificateRef = useRef(null);
  const pdfCertificateRef = useRef(null);
  const tokenClientRef = useRef(null);
  const lastAutoUploadKeyRef = useRef("");
  const certificateOriginRef = useRef("teacher");
  const levelRubricHeadings = getLevelRubricHeadings(Number(level));

  useEffect(() => {
    const storedSession = window.sessionStorage.getItem(DRIVE_SESSION_KEY);
    if (!storedSession) return;

    try {
      const parsed = JSON.parse(storedSession);
      if (
        parsed?.token &&
        parsed?.savedAt &&
        Date.now() - Number(parsed.savedAt) < DRIVE_SESSION_MAX_AGE_MS
      ) {
        setDriveAccessToken(parsed.token);
        setDriveUserEmail(parsed.email || "");
      } else {
        window.sessionStorage.removeItem(DRIVE_SESSION_KEY);
      }
    } catch {
      window.sessionStorage.removeItem(DRIVE_SESSION_KEY);
    }
  }, []);

  useEffect(() => {
    const updateScale = () => {
      const certWidth = printSize === "A5" ? 900 : 1200;
      const certHeight = printSize === "A5" ? 636 : 850;
      const availableWidth = window.innerWidth - 32;
      const availableHeight = window.innerHeight - 200;
      const scale = Math.min(
        1,
        availableWidth / certWidth,
        availableHeight / certHeight
      );
      setPreviewScale(Number.isFinite(scale) ? scale : 1);
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [printSize]);

  useEffect(() => {
    if (!GOOGLE_CONFIGURED) return;

    let cancelled = false;

    const initializeGoogle = async () => {
      try {
        await loadExternalScript("https://accounts.google.com/gsi/client");
        if (cancelled || !window.google?.accounts?.oauth2) return;

        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: GOOGLE_DRIVE_SCOPE,
          callback: async (response) => {
            if (response?.error) {
              setUploadStatus("Google sign-in was cancelled or failed.");
              return;
            }

            const token = response.access_token || "";
            setDriveAccessToken(token);
            setUploadStatus("Google Drive is connected.");

            try {
              const profileResponse = await fetch(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              const profileData = await profileResponse.json();
              setDriveUserEmail(profileData.email || "");
              window.sessionStorage.setItem(
                DRIVE_SESSION_KEY,
                JSON.stringify({ token, email: profileData.email || "", savedAt: Date.now() })
              );
            } catch {
              setDriveUserEmail("");
              window.sessionStorage.setItem(
                DRIVE_SESSION_KEY,
                JSON.stringify({ token, email: "", savedAt: Date.now() })
              );
            }
          },
        });

        setGoogleReady(true);
      } catch {
        setUploadStatus("Google services could not be loaded.");
      }
    };

    initializeGoogle();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!GOOGLE_CONFIGURED || !googleReady || driveAccessToken) return;

    const timer = window.setTimeout(() => {
      handleGoogleConnect(Boolean(savedEvaluationId) ? false : true);
    }, 500);

    return () => window.clearTimeout(timer);
  }, [googleReady, driveAccessToken, savedEvaluationId]);

  useEffect(() => {
    if (!pendingAutoUpload || !showCertificate || !certificateData || !driveAccessToken) {
      return;
    }

    const uploadKey = [
      certificateData.studentName,
      certificateData.level,
      certificateData.certificateDate,
      ...(certificateData.rubricScores || []),
    ].join("|");

    if (lastAutoUploadKeyRef.current === uploadKey) {
      setPendingAutoUpload(false);
      return;
    }

    lastAutoUploadKeyRef.current = uploadKey;

    const runAutoUpload = async () => {
      try {
        await uploadCertificateToDrive(certificateData);
      } finally {
        setPendingAutoUpload(false);
      }
    };

    const timer = window.setTimeout(() => {
      runAutoUpload();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [pendingAutoUpload, showCertificate, certificateData, driveAccessToken]);

  const setRubricScore = (idx, score) => {
    setRubricScores((prev) => {
      const next = [...prev];
      next[idx] = score;
      return next;
    });
  };

  const handleTestPreview = () => {
    const sampleName = studentName.trim() || "Test Student";
    const sampleTeacher = teacherName.trim() || "Test Teacher";
    const sampleLevel = Number(level) || 15;
    const sampleHeadings = getLevelRubricHeadings(sampleLevel);
    const sampleRubrics = [3, 4, 4, 3, 4, 5];
    const sampleSkills = buildRadarSkillsFromRubrics(sampleRubrics);
    const sampleTotalScore = sampleRubrics.reduce((sum, score) => sum + score, 0);

    const autoMessage = buildAutoMessage({
      skills: sampleSkills,
      rubrics: sampleRubrics,
      name: sampleName,
      levelValue: sampleLevel,
      totalCorrect: sampleTotalScore,
      totalQuestionCount: sampleRubrics.length * 5,
      headings: sampleHeadings,
    });
    setCertificateData({
      studentName: sampleName,
      level: sampleLevel,
      skills: sampleSkills,
      totalScore: sampleTotalScore,
      message: autoMessage,
      rubricTexts: buildRubricTexts(sampleHeadings, sampleRubrics, sampleLevel),
      rubricHeadings: sampleHeadings,
      rubricScores: sampleRubrics,
      teacherName: sampleTeacher,
      certificateDate: certificateDate || todayIso,
    });

    setShowCertificate(true);
  };

  const ensureGoogleAccess = (prompt = "consent") =>
    new Promise((resolve, reject) => {
      if (!GOOGLE_CLIENT_ID) {
        reject(new Error("Google sign-in is not configured."));
        return;
      }

      if (!tokenClientRef.current) {
        reject(new Error("Google sign-in is not ready yet."));
        return;
      }

      tokenClientRef.current.callback = async (response) => {
        if (response?.error) {
          reject(new Error("Google authorization failed."));
          return;
        }

        const token = response.access_token || "";
        setDriveAccessToken(token);
        setUploadStatus("Google Drive is connected.");

        try {
          const profileResponse = await fetch(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const profileData = await profileResponse.json();
          setDriveUserEmail(profileData.email || "");
          window.sessionStorage.setItem(
            DRIVE_SESSION_KEY,
            JSON.stringify({ token, email: profileData.email || "", savedAt: Date.now() })
          );
        } catch {
          setDriveUserEmail("");
          window.sessionStorage.setItem(
            DRIVE_SESSION_KEY,
            JSON.stringify({ token, email: "", savedAt: Date.now() })
          );
        }

        resolve(token);
      };

      tokenClientRef.current.requestAccessToken({
        prompt,
      });
    });

  const buildCertificateImageBlob = async () => {
    if (!pdfCertificateRef.current) {
      throw new Error("Certificate export layout is not ready yet.");
    }

    const sourceCertificate = pdfCertificateRef.current;

    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
    await waitForImages(sourceCertificate);

    const canvas = await html2canvas(sourceCertificate, {
      scale: 1,
      useCORS: true,
      backgroundColor: null,
      logging: false,
      onclone: (clonedDocument) => {
        const sanitizedStyles = buildSanitizedStylesheetText();

        clonedDocument.querySelectorAll('link[rel="stylesheet"]').forEach((linkTag) => {
          linkTag.remove();
        });

        clonedDocument.querySelectorAll("style").forEach((styleTag) => {
          if (
            styleTag.textContent?.includes("oklch") ||
            styleTag.textContent?.includes("oklab") ||
            styleTag.textContent?.includes("color-mix")
          ) {
            styleTag.textContent = sanitizeCssForPdf(styleTag.textContent);
          }
        });

        if (sanitizedStyles) {
          const mergedStyleTag = clonedDocument.createElement("style");
          mergedStyleTag.textContent = sanitizedStyles;
          clonedDocument.head.appendChild(mergedStyleTag);
        }

        const clonedCertificate = clonedDocument.getElementById("certificate-pdf");
        applyPdfSafeInlineStyles(sourceCertificate, clonedCertificate);
      },
    });

    const pngBlob = await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Image export failed."));
          return;
        }
        resolve(blob);
      }, "image/png");
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [canvas.width, canvas.height],
    });

    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
    const pdfBlob = pdf.output("blob");

    return {
      pngBlob,
      pdfBlob,
    };
  };

  const uploadDriveFile = async ({ token, fileName, mimeType, blob }) => {
    const metadata = {
      name: fileName,
      mimeType,
      parents: [GOOGLE_DRIVE_FOLDER_ID],
    };

    const formData = new FormData();
    formData.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    formData.append("file", blob, fileName);

    const response = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink&supportsAllDrives=true",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      let errorMessage = "Drive upload failed.";
      try {
        const errorData = await response.json();
        errorMessage =
          errorData?.error?.message ||
          errorData?.error_description ||
          errorMessage;
      } catch {
        const fallbackText = await response.text();
        if (fallbackText) {
          errorMessage = fallbackText;
        }
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  };

  const buildEvaluationRecord = (data) => ({
    studentName: data.studentName || "",
    level: data.level || "",
    teacherName: data.teacherName || "",
    certificateDate: data.certificateDate || "",
    savedAt: new Date().toISOString(),
    rubricHeadings: data.rubricHeadings || [],
    rubricScores: data.rubricScores || [],
    rubricTexts: data.rubricTexts || [],
    radarLabels: RADAR_LABELS,
    radarValues: {
      listening: data.skills?.listening || 1,
      reading: data.skills?.reading || 1,
      writing: data.skills?.writing || 1,
      speaking: data.skills?.speaking || 1,
      attitude: data.skills?.attitude || 1,
    },
    totalScore: data.totalScore || 0,
    autoMessage: data.message || "",
  });

  const buildCertificateDataFromRecord = (record) => ({
    studentName: record.studentName || "",
    level: Number(record.level) || 1,
    skills: {
      listening: record.radarValues?.listening || 1,
      reading: record.radarValues?.reading || 1,
      writing: record.radarValues?.writing || 1,
      speaking: record.radarValues?.speaking || 1,
      attitude: record.radarValues?.attitude || 1,
    },
    totalScore: record.totalScore || 0,
    message: record.autoMessage || "",
    rubricTexts: record.rubricTexts || [],
    rubricHeadings: record.rubricHeadings || [],
    rubricScores: record.rubricScores || [],
    teacherName: record.teacherName || "",
    certificateDate: record.certificateDate || todayIso,
  });

  const formatSavedEvaluationTitle = (file) => {
    const fileName = (file.name || "").replace(/\.json$/i, "");
    const normalized = fileName.replace(/_+/g, " ").trim();
    return normalized || file.name || "Saved evaluation";
  };

  const loadSavedEvaluations = async (silent = false) => {
    try {
      setIsLoadingSaved(true);
      const token = driveAccessToken || (await ensureGoogleAccess(""));
      const query = encodeURIComponent(
        `'${GOOGLE_DRIVE_FOLDER_ID}' in parents and mimeType='application/json' and trashed=false`
      );
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime,modifiedTime)&orderBy=modifiedTime desc&includeItemsFromAllDrives=true&supportsAllDrives=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        let errorMessage = "Could not load saved evaluations from Google Drive.";
        try {
          const errorData = await response.json();
          errorMessage =
            errorData?.error?.message ||
            errorData?.error_description ||
            errorMessage;
        } catch {
          const fallbackText = await response.text();
          if (fallbackText) {
            errorMessage = fallbackText;
          }
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      setSavedEvaluations(result.files || []);
      if (!silent) {
        setUploadStatus(`${(result.files || []).length} saved evaluations loaded.`);
      }
    } catch (error) {
      setUploadStatus(error.message || "Failed to load saved evaluations.");
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const openSavedEvaluation = async (fileId, options = {}) => {
    const { silent = false } = options;
    try {
      setIsOpeningSavedEvaluation(true);
      const token = driveAccessToken || (await ensureGoogleAccess(""));
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        let errorMessage = "Could not open this saved evaluation.";
        try {
          const errorData = await response.json();
          errorMessage =
            errorData?.error?.message ||
            errorData?.error_description ||
            errorMessage;
        } catch {
          const fallbackText = await response.text();
          if (fallbackText) {
            errorMessage = fallbackText;
          }
        }
        throw new Error(errorMessage);
      }

      const record = await response.json();
      certificateOriginRef.current = "manager";
      setCertificateData(buildCertificateDataFromRecord(record));
      setShowCertificate(true);
      setManagerView(false);
      if (!silent) {
        setUploadStatus(`Loaded saved evaluation for ${record.studentName || "student"}.`);
      }
    } catch (error) {
      setUploadStatus(error.message || "Failed to open the saved evaluation.");
    } finally {
      setIsOpeningSavedEvaluation(false);
    }
  };

  const uploadCertificateToDrive = async (data = certificateData) => {
    if (!data) {
      throw new Error("No certificate data available to upload.");
    }

    if (!GOOGLE_DRIVE_FOLDER_ID) {
      throw new Error("Google Drive folder is not configured.");
    }

    const token = driveAccessToken || (await ensureGoogleAccess(""));
    const { pngBlob } = await buildCertificateImageBlob();
    const record = buildEvaluationRecord(data);
    const recordBlob = new Blob([JSON.stringify(record, null, 2)], {
      type: "application/json",
    });
    const safeStudentName = slugifyFilePart(data.studentName, "student");
    const safeTeacherName = slugifyFilePart(data.teacherName, "teacher");
    const safeDate = slugifyFilePart(data.certificateDate || todayIso, todayIso);
    const baseFileName = `${safeStudentName}_${safeTeacherName}_Lv${data.level}_${safeDate}`;
    const imageFileName = `${baseFileName}.png`;
    const recordFileName = `${baseFileName}.json`;

    setIsUploading(true);
    setUploadStatus("Saving evaluation record to Google Drive...");

    try {
      const imageResult = await uploadDriveFile({
        token,
        fileName: imageFileName,
        mimeType: "image/png",
        blob: pngBlob,
      });

      const recordResult = await uploadDriveFile({
        token,
        fileName: recordFileName,
        mimeType: "application/json",
        blob: recordBlob,
      });

      setUploadStatus(`Saved image and evaluation record to Google Drive.`);
      return {
        image: imageResult,
        record: recordResult,
      };
    } finally {
      setIsUploading(false);
    }
  };

  const handleGoogleConnect = async (silent = false) => {
    try {
      if (!GOOGLE_CONFIGURED) {
        setUploadStatus("Google Drive is not configured for this app yet.");
        return;
      }

      if (!googleReady) {
        if (!silent) {
          setUploadStatus("Google sign-in is still loading. If this keeps happening, check the browser console and Google OAuth setup.");
        }
        return;
      }

      await ensureGoogleAccess("consent");
    } catch (error) {
      if (!silent) {
        setUploadStatus(error.message);
      }
    }
  };

  const handleGoogleDisconnect = () => {
    if (driveAccessToken && window.google?.accounts?.oauth2?.revoke) {
      window.google.accounts.oauth2.revoke(driveAccessToken, () => {});
    }
    setDriveAccessToken("");
    setDriveUserEmail("");
    setUploadStatus("Google Drive connection cleared on this device.");
    window.sessionStorage.removeItem(DRIVE_SESSION_KEY);
  };

  const handleOpenSavedFiles = () => {
    if (!GOOGLE_DRIVE_FOLDER_ID) {
      setUploadStatus("Google Drive folder is not configured yet.");
      return;
    }
    setWorkspaceMode("manager");
    setManagerView(true);
    loadSavedEvaluations();
  };

  const handleManualDriveUpload = async () => {
    try {
      await uploadCertificateToDrive();
    } catch (error) {
      setUploadStatus(error.message);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setUploadStatus("Preparing high-resolution image...");
      const { pngBlob } = await buildCertificateImageBlob();
      const safeStudentName = (certificateData?.studentName || "student").replace(/[^\w.-]+/g, "_");
      const safeDate = (certificateData?.certificateDate || todayIso).replace(/[^\d-]+/g, "-");
      const fileName = `${safeStudentName}_Lv${certificateData?.level || level}_${safeDate}.png`;
      const objectUrl = window.URL.createObjectURL(pngBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = objectUrl;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      window.URL.revokeObjectURL(objectUrl);
      setUploadStatus(
        isIOSDevice()
          ? "High-resolution image downloaded. Please print the saved file."
          : "High-resolution image downloaded. Print the saved image for the most reliable result."
      );
    } catch (error) {
      setUploadStatus(error.message || "Image download failed.");
    }
  };

  const handleSubmit = async () => {
    const cleanName = studentName.trim();

    if (submittedStudent === cleanName) {
      alert(`⚠️ ${cleanName} has already been evaluated.`);
      return;
    }

    if (!cleanName || !level) {
      alert("Please enter a student name and level.");
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    const totalScore = rubricScores.reduce((sum, score) => sum + (score || 0), 0);
    const skills = buildRadarSkillsFromRubrics(rubricScores);

    const payload = {
      studentName: cleanName,
      level: Number(level),
      skills,
      totalScore,
    };

    try {
      const rubricTexts = buildRubricTexts(
        levelRubricHeadings,
        rubricScores,
        payload.level
      );

      const autoMessage = buildAutoMessage({
        skills: payload.skills,
        rubrics: rubricScores,
        name: payload.studentName,
        levelValue: payload.level,
        totalCorrect: payload.totalScore,
        totalQuestionCount: rubricScores.length * 5,
        headings: levelRubricHeadings,
      });
      setCertificateData({
        studentName: payload.studentName,
        level: payload.level,
        skills: payload.skills,
        totalScore: payload.totalScore,
        message: autoMessage,
        rubricTexts,
        rubricHeadings: levelRubricHeadings,
        rubricScores,
        teacherName: teacherName.trim(),
        certificateDate,
      });

      certificateOriginRef.current = "teacher";
      setShowCertificate(true);
      setSubmittedStudent(cleanName);
      setPendingAutoUpload(Boolean(driveAccessToken && GOOGLE_DRIVE_FOLDER_ID));
    } catch (error) {
      console.error("Submission failed:", error);
      alert("❌ Error: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    if (confirm("Start evaluation for a new student?")) {
      setStudentName("");
      setTeacherName("");
      setCertificateDate(todayIso);
      setLevel("");
      setRubricScores(Array(CERT_BOX_COUNT).fill(null));
      setSubmittedStudent(null);
      setIsSubmitting(false);
      setShowCertificate(false);
      setCertificateData(null);
      setPendingAutoUpload(false);
      setManagerView(workspaceMode === "manager");
      setUploadStatus("");
      lastAutoUploadKeyRef.current = "";
    }
  };

  const completedRubrics = rubricScores.filter(Boolean).length;
  const progressPercentage = Math.round((completedRubrics / CERT_BOX_COUNT) * 100);
  const totalScore = rubricScores.reduce((sum, score) => sum + (score || 0), 0);
  const rubricsComplete = rubricScores.every((score) => score);
  const radarPreview = buildRadarSkillsFromRubrics(rubricScores);
  const radarPreviewValues = [
    radarPreview.listening,
    radarPreview.reading,
    radarPreview.writing,
    radarPreview.speaking,
    radarPreview.attitude,
  ];

  const canSubmit =
    studentName.trim() &&
    level &&
    rubricsComplete &&
    !isSubmitting &&
    submittedStudent !== studentName.trim();

  const radarValues = useMemo(() => {
    if (!certificateData) return [1, 1, 1, 1, 1];
    const { listening, reading, writing, speaking, attitude } =
      certificateData.skills;
    return [listening, reading, writing, speaking, attitude];
  }, [certificateData]);

  useEffect(() => {
    if (!savedEvaluationId || !googleReady || !driveAccessToken || showCertificate) return;

    openSavedEvaluation(savedEvaluationId, { silent: true });
  }, [savedEvaluationId, googleReady, driveAccessToken, showCertificate]);

  if (savedEvaluationId && !showCertificate) {
    return (
      <div className="app-shell evaluation-screen min-h-screen">
        <div className="sticky top-0 z-20 app-topbar">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="app-brand-logo-wrap">
              <img
                src="/logo-clean2.png?v=1"
                alt="Linglow English School"
                className="app-brand-logo"
              />
            </div>
          </div>
        </div>

        <main className="max-w-3xl mx-auto p-6">
          <section className="content-panel content-panel--board space-y-3">
            <h2 className="text-base font-bold">Preparing Saved Certificate</h2>
            <p className="text-sm text-slate-500">
              {!driveAccessToken
                ? "Connect Google Drive in this tab to open the saved evaluation."
                : isOpeningSavedEvaluation
                ? "Loading the saved evaluation and opening the print-ready certificate preview."
                : uploadStatus || "Please wait while the saved evaluation is opened."}
            </p>
            {!driveAccessToken && googleReady && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleGoogleConnect(false)}
                  className="action-button action-button--primary px-4 py-2 rounded-lg"
                >
                  Connect Drive To Open Certificate
                </button>
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }

  if (!workspaceMode) {
    return (
      <div className="app-shell evaluation-screen min-h-screen">
        <div className="sticky top-0 z-20 app-topbar">
          <div className="max-w-6xl mx-auto px-4 py-5 flex justify-center">
            <div className="app-brand-logo-wrap">
              <img
                src="/logo-clean2.png?v=1"
                alt="Linglow English School"
                className="app-brand-logo app-brand-logo--landing"
              />
            </div>
          </div>
        </div>

        <main className="max-w-6xl mx-auto px-4 py-10">
          <section className="landing-hero">
            <div className="landing-hero__copy">
              <div className="landing-hero__eyebrow">Linglow Evaluation Studio</div>
              <h1 className="landing-hero__title">Choose your workspace</h1>
              <p className="landing-hero__text">
                Start in the teacher panel to complete a new evaluation, or open the manager panel to review saved records and print certificates from a school PC.
              </p>
            </div>
            <div className="landing-hero__mascots" aria-hidden="true">
              <img src="/character-boy.png" alt="" className="landing-hero__mascot landing-hero__mascot--boy" />
              <img src="/character-luca-happy.png" alt="" className="landing-hero__mascot landing-hero__mascot--luca" />
              <img src="/character-girl.png" alt="" className="landing-hero__mascot landing-hero__mascot--girl" />
            </div>
          </section>

          <section className="landing-grid">
            <button
              type="button"
              onClick={() => {
                setWorkspaceMode("teacher");
                setManagerView(false);
              }}
              className="landing-card landing-card--teacher"
            >
              <div className="landing-card__icon">
                <BriefcaseBusiness size={30} />
              </div>
              <div className="landing-card__content">
                <h2 className="landing-card__title">Teacher Panel</h2>
                <p className="landing-card__text">
                  Enter student details, score the evaluation, and generate a certificate that saves automatically for the manager.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleOpenSavedFiles()}
              className="landing-card landing-card--manager"
            >
              <div className="landing-card__icon">
                <ShieldCheck size={30} />
              </div>
              <div className="landing-card__content">
                <h2 className="landing-card__title">Manager Panel</h2>
                <p className="landing-card__text">
                  Review saved evaluations, open certificates, and print polished records directly from the school PC.
                </p>
              </div>
            </button>
          </section>
        </main>
      </div>
    );
  }

  if (showCertificate && certificateData) {
    return (
      <div className="app-shell certificate-screen min-h-screen">
        <div className="no-print max-w-6xl mx-auto px-4 py-6 flex flex-wrap gap-3">
          <button
            onClick={() => {
              setShowCertificate(false);
              setManagerView(certificateOriginRef.current === "manager");
            }}
            className="action-button action-button--secondary px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            {certificateOriginRef.current === "manager" ? "Back to Manager Panel" : "Back to Evaluation"}
          </button>
          <button
            onClick={() => window.print()}
            className="action-button action-button--primary px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Printer size={16} />
            Print Certificate
          </button>
          <div className="print-size-switch" role="group" aria-label="Print size">
            {["A4", "A5"].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setPrintSize(size)}
                className={`print-size-switch__button ${printSize === size ? "print-size-switch__button--active" : ""}`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-center px-4 pb-10">
          <div
            className="certificate-shell"
            style={{ "--cert-scale": previewScale }}
            data-print-size={printSize}
          >
            <div
              id="certificate"
              ref={certificateRef}
              className={`certificate-page bg-white border border-slate-200 shadow-xl ${printSize === "A5" ? "certificate-page--a5" : "certificate-page--a4"}`}
            >
              <img className="mascot-watermark" src="/character-luca-neutral.png" alt="Linglow mascot" />
              <div className="certificate-content p-2">
                <div className="certificate-meta">
                  <div className="school-name">
                    <img
                      src="/logo-clean2.png?v=1"
                      alt="Linglow English School"
                      className="school-logo"
                    />
                    <img
                      src="/character-luca-happy.png"
                      alt="Smiling Linglow mascot"
                      className="school-mascot-head"
                    />
                  </div>
                  <div className="meta-right">
                    <div className="meta-chip">Teacher: {certificateData.teacherName || "—"}</div>
                    <div className="meta-chip">Date: {certificateData.certificateDate || "—"}</div>
                  </div>
                </div>
                <div className="certificate-body">
                  <div className="flex flex-col gap-3">
                    <div className="certificate-header">
                      <div className="header-title">★ 総合評価</div>
                      <div className="text-lg font-semibold">
                        {certificateData.studentName}
                      </div>
                    </div>

                    <div className="p-3 flex-1 flex flex-col justify-center radar-wrap">
                      <RadarChart
                        values={radarValues}
                        labels={RADAR_LABELS}
                      />
                      <div className="radar-legend">
                        {RADAR_LABELS.map((label, idx) => (
                          <div key={label} className="radar-legend-item">
                            <span className="radar-dot" />
                            <span>{label}</span>
                            <span className="radar-score">{radarValues[idx]}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="certificate-ribbon">MESSAGE</div>

                    <div className="message-box">
                      {certificateData.message || "No comment provided."}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="certificate-header">
                      <div className="header-title">
                        Competency Assessment (主要能力の評価)
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-lg font-semibold">
                          Lv.{certificateData.level}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 flex-1 rubric-grid">
                      {(certificateData.rubricHeadings || levelRubricHeadings).map(
                        (heading, idx) => (
                          <div key={`${heading}-${idx}`} className="rubric-card">
                          <div className="rubric-title">
                            <span className="rubric-pill">
                                {heading}
                            </span>
                          </div>
                          <div className="rubric-score">
                            <RatingDots
                              score={certificateData.rubricScores?.[idx]}
                              showMascot
                            />
                          </div>
                          <div className="rubric-body-box">
                            <div className="rubric-body">
                              {certificateData.rubricTexts?.[idx] || ""}
                            </div>
                          </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pdf-export-root" aria-hidden="true">
          <div
            id="certificate-pdf"
            ref={pdfCertificateRef}
            className={`pdf-certificate-page ${printSize === "A5" ? "pdf-certificate-page--a5" : "pdf-certificate-page--a4"}`}
          >
            <img
              className="pdf-template-background"
              src={EXPORT_TEMPLATE_BACKGROUND}
              alt=""
              aria-hidden="true"
              crossOrigin="anonymous"
            />
            <img
              className="pdf-mascot-watermark"
              src="/character-luca-neutral.png"
              alt=""
              crossOrigin="anonymous"
            />
            <div className="pdf-certificate-inner">
              <div className="pdf-certificate-meta">
                <div className="pdf-school-brand">
                  <img
                    src="/logo-clean2.png?v=1"
                    alt="Linglow English School"
                    className="pdf-school-logo"
                    crossOrigin="anonymous"
                  />
                  <img
                    src="/character-luca-happy.png"
                    alt=""
                    className="pdf-school-mascot"
                  />
                </div>
                <div className="pdf-meta-group">
                  <div className="pdf-meta-chip">Teacher: {certificateData.teacherName || "—"}</div>
                  <div className="pdf-meta-chip">Date: {certificateData.certificateDate || "—"}</div>
                </div>
              </div>

              <div className="pdf-certificate-grid">
                <div className="pdf-left-column">
                  <div className="pdf-header-band">
                    <span className="pdf-header-label">★ 総合評価</span>
                    <strong className="pdf-header-value">{certificateData.studentName}</strong>
                  </div>

                  <div className="pdf-radar-card">
                    <RadarChart values={radarValues} labels={RADAR_LABELS} />
                    <div className="pdf-radar-legend">
                      {RADAR_LABELS.map((label, idx) => (
                        <div key={label} className="pdf-radar-legend-item">
                          <span className="pdf-radar-dot" />
                          <span className="pdf-radar-label">{label}</span>
                          <span className="pdf-radar-score">{radarValues[idx]}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pdf-message-ribbon">MESSAGE</div>
                  <div className="pdf-message-box">
                    {certificateData.message || "No comment provided."}
                  </div>
                </div>

                <div className="pdf-right-column">
                  <div className="pdf-header-band">
                    <span className="pdf-header-label">Competency Assessment (主要能力の評価)</span>
                    <strong className="pdf-header-value">Lv.{certificateData.level}</strong>
                  </div>

                  <div className="pdf-rubric-grid">
                    {(certificateData.rubricHeadings || levelRubricHeadings).map((heading, idx) => (
                      <div key={`pdf-${heading}-${idx}`} className="pdf-rubric-card">
                        <div className="pdf-rubric-title">{heading}</div>
                        <PdfRatingDots score={certificateData.rubricScores?.[idx]} />
                        <div className="pdf-rubric-body">
                          {certificateData.rubricTexts?.[idx] || ""}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell evaluation-screen min-h-screen text-slate-900 pb-32">
      <div className="sticky top-0 z-20 app-topbar">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="app-brand-logo-wrap">
              <img
                src="/logo-clean2.png?v=1"
                alt="Linglow English School"
                className="app-brand-logo"
              />
            </div>
          </div>
          <div className="topbar-actions">
            <button
              type="button"
              onClick={() => {
                setWorkspaceMode(null);
                setManagerView(false);
              }}
              className="action-button action-button--secondary topbar-manager-button"
            >
              Change Panel
            </button>
            <button
              onClick={resetForm}
              className="reset-button"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>

        <div className="h-1 bg-white/40">
          <div
            className="h-full premium-gradient transition-all"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        {managerView && (
          <section className="content-panel content-panel--board space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-base font-bold">Saved Evaluations</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Open a saved teacher evaluation from Google Drive and print it from this PC.
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => loadSavedEvaluations()}
                  className="action-button action-button--secondary px-4 py-2 rounded-lg"
                  disabled={isLoadingSaved}
                >
                  {isLoadingSaved ? "Refreshing..." : "Refresh List"}
                </button>
                <button
                  type="button"
                  onClick={() => window.open(GOOGLE_DRIVE_FOLDER_URL, "_blank", "noopener,noreferrer")}
                  className="action-button action-button--secondary px-4 py-2 rounded-lg"
                  disabled={!GOOGLE_DRIVE_FOLDER_URL}
                >
                  Open Drive Folder
                </button>
                <button
                  type="button"
                  onClick={() => setManagerView(false)}
                  className="action-button action-button--secondary px-4 py-2 rounded-lg"
                >
                  Back to Evaluation
                </button>
              </div>
            </div>

            <div className="saved-evaluations-list">
              {savedEvaluations.length ? (
                savedEvaluations.map((file) => (
                  <div key={file.id} className="saved-evaluation-card">
                    <div>
                      <div className="saved-evaluation-card__title">{formatSavedEvaluationTitle(file)}</div>
                      <div className="saved-evaluation-card__meta">
                        Updated {file.modifiedTime ? new Date(file.modifiedTime).toLocaleString() : "—"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openSavedEvaluation(file.id)}
                      className="action-button action-button--primary px-4 py-2 rounded-lg saved-evaluation-card__action"
                    >
                      <img
                        src="/character-luca-happy.png"
                        alt=""
                        className="saved-evaluation-card__action-mascot"
                        aria-hidden="true"
                      />
                      <Printer size={16} />
                      <span>Open & Print</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="saved-evaluations-empty">
                  {isLoadingSaved ? "Loading saved evaluations..." : "No saved evaluations found yet."}
                </div>
              )}
            </div>
          </section>
        )}

        {!managerView && (
        <section className="hero-panel">
          <div className="hero-panel__content">
            <h2 className="hero-title">Teacher Evaluation Section</h2>
            <p className="hero-copy hero-copy--compact">Complete the evaluation and generate the certificate. The record will save automatically for the manager panel.</p>
          </div>
          <div className="hero-panel__mascot" aria-hidden="true">
            <img src="/character-luca-happy.png" alt="" className="hero-panel__mascot-image" />
          </div>
        </section>
        )}

        {!managerView && (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Student name"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="premium-input p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffb15c]/40"
          />

          <select
            value={level}
            onChange={(e) => {
              setLevel(e.target.value);
              setRubricScores(Array(CERT_BOX_COUNT).fill(null));
            }}
            className="premium-input p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffb15c]/40"
          >
            <option value="">Select level</option>
            {Array.from({ length: 30 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Level {i + 1}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Teacher name"
            value={teacherName}
            onChange={(e) => setTeacherName(e.target.value)}
            className="premium-input p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffb15c]/40"
          />
          <input
            type="date"
            value={certificateDate}
            onChange={(e) => setCertificateDate(e.target.value)}
            className="premium-input p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffb15c]/40"
          />
        </div>

        <section className="space-y-4 content-panel content-panel--board">
          <div className="evaluation-heading">
            <div className="evaluation-heading__characters" aria-hidden="true">
              <img src="/character-boy.png" alt="" className="evaluation-heading__character evaluation-heading__character--boy" />
              <img src="/character-girl.png" alt="" className="evaluation-heading__character evaluation-heading__character--girl" />
            </div>
            <div className="evaluation-heading__copy">
              <h2 className="text-base font-bold">Teacher Evaluation</h2>
              <p className="text-sm text-slate-500 mt-1">Score each rubric from 1 to 5.</p>
            </div>
            <div className="score-summary-chip">
              <span>{completedRubrics}/{CERT_BOX_COUNT} scored</span>
              <span>Total {totalScore}/{CERT_BOX_COUNT * 5}</span>
            </div>
          </div>

          <div className="evaluation-grid">
            <div className="space-y-3 evaluation-rubric-column">
              {levelRubricHeadings.map((heading, idx) => (
                <div key={heading} className="rubric-input-card">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="rubric-input-card__index">
                        <img
                          src={idx % 2 === 0 ? "/character-boy.png" : "/character-girl.png"}
                          alt=""
                          className="rubric-input-card__avatar"
                          aria-hidden="true"
                        />
                        <span>Skill {idx + 1}</span>
                      </div>
                      <div className="font-semibold text-sm">{heading}</div>
                    </div>
                    <div className="score-chip">
                      Score {rubricScores[idx] || "—"}/5
                    </div>
                  </div>
                  <div className="mt-3">
                    <ScoreBar
                      score={rubricScores[idx]}
                      onSelect={(score) => setRubricScore(idx, score)}
                      showMascot
                    />
                  </div>
                </div>
              ))}
            </div>

            <aside className="score-card evaluation-summary-card p-5">
              <div className="evaluation-summary-card__kicker">Live Certificate Preview</div>
              <h3 className="evaluation-summary-card__title">Radar summary</h3>
              <div className="evaluation-mini-radar">
                <RadarChart
                  values={radarPreviewValues}
                  labels={RADAR_LABELS}
                />
              </div>
              <div className="space-y-2">
                {RADAR_LABELS.map((label, idx) => {
                  return (
                    <div key={label} className="summary-row">
                      <span>{label}</span>
                      <strong>{radarPreviewValues[idx]}/5</strong>
                    </div>
                  );
                })}
              </div>
            </aside>
          </div>
        </section>

        <section className="space-y-3 content-panel content-panel--soft">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-base font-bold">Print Format</h2>
            </div>
            <div className="print-size-switch" role="group" aria-label="Print size">
              {["A4", "A5"].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setPrintSize(size)}
                  className={`print-size-switch__button ${printSize === size ? "print-size-switch__button--active" : ""}`}
                >
                  {size} Landscape
                </button>
              ))}
            </div>
          </div>
        </section>
        </>
        )}
      </main>

      {!managerView && (
      <div className="fixed bottom-0 left-0 right-0 app-footer-bar">
        <div className="max-w-2xl mx-auto px-4 py-4 flex flex-wrap items-center gap-3 justify-between">
          <div className="text-xs text-slate-500">
            Progress: {completedRubrics}/{CERT_BOX_COUNT} categories scored • Total score: {totalScore}/{CERT_BOX_COUNT * 5}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleTestPreview}
              className="action-button action-button--secondary px-4 py-2 rounded-lg"
            >
              Preview Certificate
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`action-button px-4 py-2 rounded-lg text-white ${
                canSubmit ? "action-button--primary" : "action-button--disabled"
              }`}
            >
              Generate Certificate
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
