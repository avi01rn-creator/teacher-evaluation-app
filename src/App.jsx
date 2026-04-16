import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, GraduationCap, Printer, ArrowLeft, CloudUpload, LogIn, LogOut, Download } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import "./App.css";

/* =======================
   CONFIG
======================= */

const CERT_BOX_COUNT = 6;
const RADAR_LABELS = ["Listening", "Reading", "Writing", "Speaking", "Attitude"];
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const GOOGLE_DRIVE_FOLDER_ID = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID || "";
const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const GOOGLE_CONFIGURED =
  GOOGLE_CLIENT_ID &&
  GOOGLE_DRIVE_FOLDER_ID &&
  !GOOGLE_CLIENT_ID.includes("PASTE_YOUR") &&
  !GOOGLE_DRIVE_FOLDER_ID.includes("PASTE_YOUR");
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
  24: ["あいさつ [Hello]", "自分の名前 [Name]", "フォニックスの歌 [Phonics Song]", "色 [Colors]", "乗り物 [Vehicles]", "虫 [Insects]", "フォニックス [phonics]", "ライティング [writing]"],
  23: ["あいさつ [Greetings]（名前 / 年れい / 感情表現 ）", "花 [Flowers]", "野菜 [Vegetables]", "おもちゃ [toys]", "Question [How many]", "Question [How much]", "フォニックス [phonics]", "ライティング [writing]"],
  22: ["あいさつ [Greetings]（名前 / 年れい / 感情表現 ）", "食べ物 1[Food]", "持ち物1[Belongings]", "キッチン周りの道具[Kitchen Utencils]", "食べ物2[Food]", "持ち物2[Belongings]", "フォニックス [phonics]", "ライティング [writing]"],
  21: ["あいさつ [Greetings]（名前 / 年れい / 感情表現 ）", "曜日 [The Days of The Week]", "反対言葉 [Opposite]", "天気 [Weather]", "衣類１ [Clothes 1]", "衣類２ [Clothes 2]", "フォニックス [phonics]", "ライティング [writing]"],
  20: ["声の大きさ [Voice]", "すらすら言える [Fluency]", "発音 [Pronunciation]", "暗記 [Memorization]", "内容 [Content]", "ジェスチャー [Gesture]", "顔の表情や目線 [Facial Expressions, Eyes]", "態度 [Atittude]"],
  19: ["あいさつ [Greetings]（名前 / 年れい / 感情表現 / 天気）", "楽器 [Musical Instruments]", "スポーツ [Sports]", "動詞1 [Verbs]", "動詞2 [Verbs]", "家族・性格 [Family/Personality]", "フォニックス [phonics]", "ライティング [writing]"],
  18: ["声の大きさ [Voice]", "すらすら言える [Fluency]", "発音 [Pronunciation]", "暗記 [Memorization]", "内容 [Content]", "ジェスチャー [Gesture]", "顔の表情や目線 [Facial Expressions, Eyes]", "態度 [Atittude]"],
  17: ["あいさつ [Greetings]（名前 / 年れい / 感情表現 ）", "体のパーツ [Body Parts]", "季節 [Seasons]", "月日 [Months,Date]", "年間行事 [Yearly Event]", "食べ物の特徴 [Adjective for food]", "フォニックス [phonics]", "ライティング [writing]"],
  16: ["声の大きさ [Voice]", "すらすら言える [Fluency]", "発音 [Pronunciation]", "暗記 [Memorization]", "内容 [Content]", "ジェスチャー [Gesture]", "顔の表情や目線 [Facial Expressions, Eyes]", "態度 [Atittude]"],
  15: ["あいさつ [Greetings]（名前 / 年れい / 感情表現 / 天気 ）", "国1 [Countries 1]", "国2 [Coutries 2]", "ランドマーク [Land mark]", "シンボル [Symbols]", "複数形 [Plural forms]", "フォニックス [phonics]", "ライティング [writing]"],
  14: ["声の大きさ [Voice]", "すらすら言える [Fluency]", "発音 [Pronunciation]", "暗記 [Memorization]", "内容 [Content]", "ジェスチャー [Gesture]", "顔の表情や目線 [Facial Expressions, Eyes]", "態度 [Atittude]"],
  13: ["あいさつ [Greetings]（名前 / 年れい / 感情表現 /誕生日）", "体のパーツ [Body Parts]", "症状[Symptons]", "動詞[Verbs]", "関連語[Related Words]", "質問[Does Questions]", "フォニックス [phonics]", "ライティング [writing]"],
  12: ["声の大きさ [Voice]", "すらすら言える [Fluency]", "発音 [Pronunciation]", "暗記 [Memorization]", "内容 [Content]", "ジェスチャー [Gesture]", "顔の表情や目線 [Facial Expressions, Eyes]", "態度 [Atittude]"],
  11: ["あいさつ [Greetings]（名前 / 年れい / 感情表現 / 天気 / 誕生日）", "動詞・質問①[Do you like to-?]", "動詞・質問②[Did you-?]", "趣味[Hobby]", "形容詞[Adjective]", "関連語・Why?[Related words/Why?]", "フォニックス [phonics]", "ライティング [writing]"],
  10: ["声の大きさ [Voice]", "すらすら言える [Fluency]", "発音 [Pronunciation]", "暗記 [Memorization]", "内容 [Content]", "ジェスチャー [Gesture]", "顔の表情や目線 [Facial Expressions, Eyes]", "態度 [Atittude]"],
  9: ["声の大きさ [Voice]", "すらすら言える [Fluency]", "発音 [Pronunciation]", "暗記 [Memorization]", "内容 [Content]", "ジェスチャー [Gesture]", "顔の表情や目線 [Facial Expressions, Eyes]", "態度 [Atittude]"],
  8: ["声の大きさ [Voice]", "すらすら言える [Fluency]", "発音 [Pronunciation]", "暗記 [Memorization]", "内容 [Content]", "ジェスチャー [Gesture]", "顔の表情や目線 [Facial Expressions, Eyes]", "態度 [Atittude]"],
  7: ["あいさつ [Greetings]（名前 / 年れい / 感情表現 /誕生日/天気/日曜日にすること）", "形容詞[adjective]", "関連語・表現[Related Words&Expressions]", "比較を表す単語[~er / more~]", "最上級（3つ以上を比べる）を表す単語[~est / most~]", "その他比較表現の入った質問[like better/as~as]", "フォニックス [phonics]", "ライティング [writing]"],
  6: ["声の大きさ [Voice]", "すらすら言える [Fluency]", "発音 [Pronunciation]", "暗記 [Memorization]", "内容 [Content]", "ジェスチャー [Gesture]", "顔の表情や目線 [Facial Expressions, Eyes]", "態度 [Atittude]"],
  5: ["あいさつ [Greetings]（名前 / 年れい / 感情表現 /誕生日/天気/日曜日にすること）", "現在形の動詞 [Present tense verb/ Do you like to-?]", "過去形の動詞 [Past tense verb/ Did you-?]", "現在完了形① [Present perfect tense/ Have you-?]", "現在完了形② [Present perfect tense/ How long have you-?]", "現在完了形③ [Present perfect tense/ How many time have you-?]", "フォニックス [phonics]", "ライティング [writing]"],
  4: ["声の大きさ [Voice]", "すらすら言える [Fluency]", "発音 [Pronunciation]", "暗記 [Memorization]", "内容 [Content]", "ジェスチャー [Gesture]", "顔の表情や目線 [Facial Expressions, Eyes]", "態度 [Atittude]"],
  3: ["あいさつ [Greetings]（名前 / 年れい / 感情表現 /誕生日/天気/日曜日にすること）", "Lv.3 単語[Lv.3 Vocabulary]", "Question 1 [if]", "Question 2 [if]", "付加疑問文[Tag question]", "間接疑問文[Indirect question]", "フォニックス [phonics]", "ライティング [writing]"],
  2: ["声の大きさ [Voice]", "すらすら言える [Fluency]", "発音 [Pronunciation]", "暗記 [Memorization]", "内容 [Content]", "ジェスチャー [Gesture]", "顔の表情や目線 [Facial Expressions, Eyes]", "態度 [Atittude]"],
  1: ["cat A1.1", "cat A1.2", "cat A1.3", "cat A1.4", "cat A1.5", "cat A1.6", "cat A1.7", "cat A1.8"],
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
      className="mx-auto radar-svg"
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
        const x = clamp(xRaw, 14, size - 14);
        const y = clamp(yRaw, 14, size - 14);
        const anchor = x < center ? "end" : "start";
        const dy = y < center ? "-0.35em" : "1.1em";
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
  const certificateRef = useRef(null);
  const tokenClientRef = useRef(null);
  const lastAutoUploadKeyRef = useRef("");
  const levelRubricHeadings = getLevelRubricHeadings(Number(level));

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
            } catch {
              setDriveUserEmail("");
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
      handleGoogleConnect(true);
    }, 500);

    return () => window.clearTimeout(timer);
  }, [googleReady, driveAccessToken]);

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
      rubricTexts: buildRubricTexts(sampleHeadings, sampleRubrics),
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
        reject(new Error("Missing VITE_GOOGLE_CLIENT_ID."));
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
        } catch {
          setDriveUserEmail("");
        }

        resolve(token);
      };

      tokenClientRef.current.requestAccessToken({
        prompt,
      });
    });

  const buildCertificatePdfBlob = async () => {
    if (!certificateRef.current) {
      throw new Error("Certificate preview is not ready yet.");
    }

    const canvas = await html2canvas(certificateRef.current, {
      scale: 4,
      useCORS: true,
      backgroundColor: "#ffffff",
      onclone: (clonedDocument) => {
        clonedDocument.querySelectorAll("style").forEach((styleTag) => {
          if (styleTag.textContent?.includes("oklch") || styleTag.textContent?.includes("oklab")) {
            styleTag.textContent = sanitizeCssForPdf(styleTag.textContent);
          }
        });
      },
    });

    const orientation = printSize === "A5" ? "l" : "l";
    const format = printSize.toLowerCase();
    const pdf = new jsPDF({
      orientation,
      unit: "mm",
      format,
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imageData = canvas.toDataURL("image/png");

    pdf.addImage(imageData, "PNG", 0, 0, pageWidth, pageHeight, undefined, "FAST");
    return pdf.output("blob");
  };

  const uploadCertificateToDrive = async (data = certificateData) => {
    if (!data) {
      throw new Error("No certificate data available to upload.");
    }

    if (!GOOGLE_DRIVE_FOLDER_ID) {
      throw new Error("Missing VITE_GOOGLE_DRIVE_FOLDER_ID.");
    }

    const token = driveAccessToken || (await ensureGoogleAccess(""));
    const pdfBlob = await buildCertificatePdfBlob();
    const safeStudentName = (data.studentName || "student").replace(/[^\w.-]+/g, "_");
    const safeDate = (data.certificateDate || todayIso).replace(/[^\d-]+/g, "-");
    const fileName = `${safeStudentName}_Lv${data.level}_${safeDate}.pdf`;

    const metadata = {
      name: fileName,
      mimeType: "application/pdf",
      parents: [GOOGLE_DRIVE_FOLDER_ID],
    };

    const formData = new FormData();
    formData.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    formData.append("file", pdfBlob, fileName);

    setIsUploading(true);
    setUploadStatus("Uploading certificate to Google Drive...");

    try {
      const response = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Drive upload failed.");
      }

      const result = await response.json();
      setUploadStatus(`Saved to Google Drive as ${result.name}.`);
      return result;
    } finally {
      setIsUploading(false);
    }
  };

  const handleGoogleConnect = async (silent = false) => {
    try {
      if (!GOOGLE_CONFIGURED) {
        setUploadStatus("Google Drive is not configured. Add VITE_GOOGLE_CLIENT_ID in .env.local and restart the app.");
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
      setUploadStatus("Preparing PDF download...");
      const pdfBlob = await buildCertificatePdfBlob();
      const safeStudentName = (certificateData?.studentName || "student").replace(/[^\w.-]+/g, "_");
      const safeDate = (certificateData?.certificateDate || todayIso).replace(/[^\d-]+/g, "-");
      const fileName = `${safeStudentName}_Lv${certificateData?.level || level}_${safeDate}.pdf`;
      const objectUrl = window.URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = objectUrl;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      window.URL.revokeObjectURL(objectUrl);
      setUploadStatus("PDF downloaded. Print the saved PDF for the most reliable result on iPad.");
    } catch (error) {
      setUploadStatus(error.message || "PDF download failed.");
    }
  };

  const buildRubricTexts = (headings, scores) =>
    scores.map((score, idx) => {
      const heading = headings[idx] || FALLBACK_RUBRIC_HEADINGS[idx] || "Skill";
      const { jp, en } = parseHeadingParts(heading);
      const labelJp = jp || en;

      const templates = [
        `${labelJp}はこれから練習していきましょう。少しずつ自信をつけていければ十分です。`,
        `${labelJp}は少しずつ安定してきました。次回はもう一歩レベルアップを目指しましょう。`,
        `${labelJp}はしっかり取り組めていました。着実に力がついています。`,
        `${labelJp}はとても良くできていました。自分の力で表現できる場面が増えています。`,
        `${labelJp}はとても素晴らしかったです。自信を持って使えていました。`,
      ];

      return templates[Math.max(0, Math.min(4, (score || 1) - 1))];
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
    const accuracy = totalQuestionCount
      ? totalCorrect / totalQuestionCount
      : 0.6;
    const lowIndex = rubrics.indexOf(Math.min(...rubrics));
    const highIndex = rubrics.indexOf(Math.max(...rubrics));
    const focusHeading =
      headings?.[lowIndex] || levelRubricHeadings[lowIndex] || FALLBACK_RUBRIC_HEADINGS[0];
    const strengthHeading =
      headings?.[highIndex] || levelRubricHeadings[highIndex] || FALLBACK_RUBRIC_HEADINGS[1];
    const focus = parseHeadingParts(focusHeading);
    const strength = parseHeadingParts(strengthHeading);
    const learnerName = name ? `${name}, ` : "";
    const learnerNameJp = name ? `${name}さん、` : "";

    if (levelValue <= 10) {
      const enPraise =
        accuracy >= 0.82 && rubricAvg >= 4
          ? `you did such a bright, confident job today. Your ${strength.en} really shined.`
          : accuracy >= 0.6
            ? `you worked hard today and showed lovely progress.`
            : `you kept trying today, and that was wonderful to see.`;
      const enNext = `Next time, let's practice ${focus.en} a little more together.`;
      const jpPraise =
        accuracy >= 0.82 && rubricAvg >= 4
          ? `とても明るく自信を持って取り組めました。${strength.jp}もとても良かったです。`
          : accuracy >= 0.6
            ? `よく頑張っていて、しっかり成長が見られました。`
            : `最後まであきらめずに取り組めたことがとても素敵でした。`;
      const jpNext = `次は${focus.jp}をいっしょにもう少し練習していきましょう。`;
      return `${learnerName}${enPraise} ${enNext}
${learnerNameJp}${jpPraise}${jpNext}`;
    }

    if (levelValue <= 20) {
      const enPraise =
        accuracy >= 0.8 && rubricAvg >= 4
          ? `you showed strong progress today, especially in ${strength.en}.`
          : accuracy >= 0.62
            ? `you showed solid progress today and handled the lesson well.`
            : `you stayed focused and kept building your skills today.`;
      const enNext = `For the next step, let's strengthen ${focus.en} and make it more consistent.`;
      const jpPraise =
        accuracy >= 0.8 && rubricAvg >= 4
          ? `今日はとても良い成長が見られ、特に${strength.jp}が光っていました。`
          : accuracy >= 0.62
            ? `今日は落ち着いて取り組み、しっかり力を出せていました。`
            : `今日は集中して取り組み、力を積み重ねることができました。`;
      const jpNext = `次のステップとして、${focus.jp}をさらに安定させていきましょう。`;
      return `${learnerName}${enPraise} ${enNext}
${learnerNameJp}${jpPraise}${jpNext}`;
    }

    const enPraise =
      accuracy >= 0.85 && rubricAvg >= 4.1
        ? `you delivered a polished performance today, with ${strength.en} standing out in particular.`
        : accuracy >= 0.68
          ? `you showed thoughtful progress today and communicated with growing confidence.`
          : `you engaged steadily today and laid a good foundation for the next stage.`;
    const enNext = `A good next focus is ${focus.en}, so your overall performance feels even more natural and complete.`;
    const jpPraise =
      accuracy >= 0.85 && rubricAvg >= 4.1
        ? `今日は全体的に完成度の高い発表で、特に${strength.jp}が印象的でした。`
        : accuracy >= 0.68
          ? `今日はよく考えながら取り組めており、自信ある表現につながってきています。`
          : `今日は安定して取り組めており、次のステップにつながる土台ができています。`;
    const jpNext = `次は${focus.jp}を意識し、全体をさらに自然で完成度の高い表現にしていきましょう。`;
    return `${learnerName}${enPraise} ${enNext}
${learnerNameJp}${jpPraise}${jpNext}`;
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
      const rubricTexts = buildRubricTexts(levelRubricHeadings, rubricScores);

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

  if (showCertificate && certificateData) {
    return (
      <div className="app-shell certificate-screen min-h-screen">
        <div className="no-print max-w-6xl mx-auto px-4 py-6 flex flex-wrap gap-3">
          <button
            onClick={() => setShowCertificate(false)}
            className="action-button action-button--secondary px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Evaluation
          </button>
          <button
            onClick={() => window.print()}
            className="action-button action-button--primary px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Printer size={16} />
            Print Certificate
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="action-button action-button--secondary px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Download size={16} />
            Download PDF
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
          <div className="drive-toolbar">
            {driveAccessToken ? (
              <>
                <button
                  type="button"
                  onClick={handleManualDriveUpload}
                  disabled={isUploading}
                  className="action-button action-button--secondary px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <CloudUpload size={16} />
                  {isUploading ? "Uploading..." : "Save To Drive"}
                </button>
                <button
                  type="button"
                  onClick={handleGoogleDisconnect}
                  className="action-button action-button--secondary px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Disconnect Drive
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleGoogleConnect}
                disabled={!googleReady || !GOOGLE_CLIENT_ID}
                className="action-button action-button--secondary px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <LogIn size={16} />
                Connect Drive
              </button>
            )}
          </div>
        </div>

        {(uploadStatus || driveUserEmail) && (
          <div className="no-print max-w-6xl mx-auto px-4 pb-2">
            <div className="drive-status-banner">
              <span>{uploadStatus || "Google Drive is connected."}</span>
              {driveUserEmail && <strong>{driveUserEmail}</strong>}
            </div>
          </div>
        )}

        <div className="no-print max-w-6xl mx-auto px-4 pb-4">
          <div className="drive-status-pill">
            iPad tip: use <strong>Download PDF</strong> first, then print the saved PDF for the most reliable colors, watermark, and text.
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
          <button
            onClick={resetForm}
            className="reset-button"
          >
            <RotateCcw size={18} />
          </button>
        </div>

        <div className="h-1 bg-white/40">
          <div
            className="h-full premium-gradient transition-all"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        <section className="hero-panel">
          <div className="hero-panel__content">
            <h2 className="hero-title">Teacher Evaluation Section</h2>
            <p className="hero-copy hero-copy--compact">Score each rubric clearly and generate the certificate when ready.</p>
          </div>
          <div className="hero-panel__mascot" aria-hidden="true">
            <img src="/character-luca-happy.png" alt="" className="hero-panel__mascot-image" />
          </div>
        </section>

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

        <section className="space-y-3 content-panel content-panel--soft">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-base font-bold">Google Drive</h2>
              <div className="text-sm text-slate-500">
                Connect the school Google account once to auto-save certificates after generation.
              </div>
            </div>
            {driveAccessToken ? (
              <div className="drive-inline-actions">
                <div className="drive-status-pill">
                  Connected{driveUserEmail ? `: ${driveUserEmail}` : ""}
                </div>
                <button
                  type="button"
                  onClick={handleGoogleDisconnect}
                  className="action-button action-button--secondary px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleConnect}
                disabled={!googleReady || !GOOGLE_CLIENT_ID}
                className="action-button action-button--secondary px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <LogIn size={16} />
                Connect Google Drive
              </button>
            )}
          </div>
          <div className="text-sm text-slate-500">
            {GOOGLE_CONFIGURED
              ? uploadStatus || "Certificates will auto-upload after Generate Certificate when Google Drive is connected."
              : "Set VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_DRIVE_FOLDER_ID to enable Drive saving."}
          </div>
          <div className="drive-debug">
            <span>Client ID: {GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes("PASTE_YOUR") ? "configured" : "missing"}</span>
            <span>Folder ID: {GOOGLE_DRIVE_FOLDER_ID && !GOOGLE_DRIVE_FOLDER_ID.includes("PASTE_YOUR") ? "configured" : "missing"}</span>
            <span>Google script: {googleReady ? "ready" : "not ready"}</span>
          </div>
        </section>
      </main>

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
    </div>
  );
}
