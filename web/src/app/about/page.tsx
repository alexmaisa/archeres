"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import "../i18n";
import { 
  IconHelix, 
  IconChart, 
  IconFileDown, 
  IconShield, 
  IconRocket, 
  IconKey,
  IconBook
} from "../components/Icons";

interface CardItem {
  icon: string;
  title: string;
  desc: string;
}

interface StepItem {
  number: string;
  title: string;
  desc: string;
}

interface SymbolItem {
  char: string;
  meaning: string;
}

interface MathFormula {
  id: string;
  name: string;
  context: string;
  useCase: string;
  symbols: SymbolItem[];
  reference: string;
  note?: string;
}


interface ScaleDetail {
  name: string;
  definition: string;
  example: string;
}

interface TestDetail {
  testName: string;
  purpose: string;
}

interface ScaleAdviceGroup {
  title: string;
  testType: string;
  assumption: string;
  scales: ScaleDetail[];
  tests: TestDetail[];
}

interface ChapterSection {
  title: string;
  desc: string;
}

interface AboutContent {
  metaTitle: string;
  title: string;
  subtitle: string;
  howItWorksTitle: string;
  howItWorksSteps: StepItem[];
  featuresTitle: string;
  featuresList: CardItem[];
  mathSectionTitle: string;
  mathSectionDesc: string;
  mathLegendTitle: string;
  mathFormulas: MathFormula[];
  scaleSectionTitle: string;
  scaleSectionDesc: string;
  scaleSectionDefHeader: string;
  scaleSectionExampleHeader: string;
  scaleSectionAssumptionHeader: string;
  scaleSectionTestHeader: string;
  scaleAdvices: ScaleAdviceGroup[];
  chapterSectionTitle: string;
  chapterSectionDesc: string;
  chapterSections: ChapterSection[];
  stackTitle: string;
  stackDesc: string;
  ctaBack: string;
  ctaRegister: string;
}

export default function AboutPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [mounted, setMounted] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [windowWidth, setWindowWidth] = useState<number>(1200);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    setIsMobile(window.innerWidth <= 768);
    setWindowWidth(window.innerWidth);

    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.email) {
          setIsLoggedIn(true);
        }
      } catch (e) {}
    }

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!mounted) return null;

  const currentLang = i18n.language || "en";

  const content: Record<string, AboutContent> = {
    en: {
      metaTitle: "About Archeres | Scientific Paradigm Planner",
      title: "Scientific Precision, Simplified",
      subtitle: "Archeres is an academic methodology companion designed to empower beginner researchers in structuring sound, mathematically backed, and privacy-respecting studies.",
      howItWorksTitle: "How It Works",
      howItWorksSteps: [
        {
          number: "01",
          title: "Math Estimators & Sensitivity",
          desc: "Calculate precise sample sizes using established formulas (Slovin, Cochran, Lemeshow, Yamane, Daniel, etc.) with automatic ceiling rounding, and visualize trade-offs with a dynamic Neon SVG Sensitivity Curve."
        },
        {
          number: "02",
          title: "Paradigm & Dynamic Reliability",
          desc: "Select your research instrument paradigm (Surveys, Secondary/Lab Data, or Qualitative). Evaluate E2EE survey reliability (Cronbach's Alpha / KR-20) or apply Lincoln & Guba (1985) qualitative trustworthiness checklists."
        },
        {
          number: "03",
          title: "Unified Backup & Chapter III Draft",
          desc: "Protect progress globally using client-side E2EE offline JSON backup and restore in any step. Instantly compile a peer-review standard Chapter III methodology chapter tailored to your paradigm."
        }
      ],
      featuresTitle: "Core Platform Pillars",
      featuresList: [
        {
          icon: "key",
          title: "Zero-Knowledge E2EE",
          desc: "Your academic profile, variables, and research drafts are fully secured using AES-GCM 256 End-to-End Encryption (E2EE) locally on your device before transmission."
        },
        {
          icon: "chart",
          title: "Multi-Paradigm Workspace",
          desc: "Seamlessly adapts to quantitative surveys, secondary/lab data validation, or qualitative Lincoln & Guba (1985) trustworthiness checklists depending on your research design."
        },
        {
          icon: "shield",
          title: "Privacy & Anti-Spam Shield",
          desc: "Protecting users with self-hosted cryptographic SVG math captchas and Fiber-level rate limiters on auth paths, decoupling all telemetry to maintain absolute privacy."
        },
        {
          icon: "helix",
          title: "High-Precision Calculus",
          desc: "No more math errors. The backend Go parser handles Slovin, Yamane, Lemeshow, and Daniel equations with ceiling rounding to guarantee academic precision."
        },
        {
          icon: "book",
          title: "Scholarly Pedagogy Module",
          desc: "Learn methodology concepts as you compile drafts. Includes Cohen's power standards (1988), Stevens' taxonomy guides, and Lincoln & Guba criteria."
        }
      ],
      mathSectionTitle: "Mathematical Estimator Equations",
      mathSectionDesc: "Archeres performs real-time sampling size estimations and instrument reliability calculations using rigorous math models verified by senior academic examiners.",
      mathLegendTitle: "Symbols Legend",
      mathFormulas: [
        { 
          id: "slovin", 
          name: "Slovin Formula", 
          useCase: "Commonly used in social sciences for simple random sampling when the exact population size is known and finite. Best suited for basic survey research due to its mathematical simplicity.",
          context: "Used when N is known and you need a quick, highly generalizable estimation of n with a designated tolerance margin.",
          reference: "Sevilla, C. G., Ochave, J. A., Punsalan, T. G., Regala, B. P., & Uriarte, G. G. (1984). An Introduction to Research Methods. Rex Book Store. (Commonly associated with Slovin, 1960).",
          symbols: [
            { char: "n", meaning: "Minimum sample size required" },
            { char: "N", meaning: "Total finite population size" },
            { char: "e", meaning: "Margin of error (e.g., 0.05 for 5%)" }
          ]
        },
        { 
          id: "cochran", 
          name: "Cochran Formula", 
          useCase: "Designed for infinite or extremely large populations where the total population size is unknown or hard to estimate. Ideal for broad demographic surveys.",
          context: "Used when the population size is practically infinite, leveraging a standardized critical confidence level.",
          reference: "Cochran, W. G. (1977). Sampling Techniques (3rd ed.). John Wiley & Sons.",
          symbols: [
            { char: "n", meaning: "Minimum sample size required" },
            { char: "Z", meaning: "Standard normal deviation (typically 1.96 for 95% confidence)" },
            { char: "p", meaning: "Estimated proportion of attributes in population (default 0.5)" },
            { char: "q", meaning: "Inverse probability (1 - p)" },
            { char: "e", meaning: "Acceptable margin of error" }
          ]
        },
        { 
          id: "lemeshow", 
          name: "Lemeshow Equation", 
          useCase: "A specialized epidemiological formula developed by Stanley Lemeshow for clinical trials and healthcare studies where the total population is unknown but expected disease prevalence is anticipated.",
          context: "Used in clinical and medical settings with unknown population size to evaluate specific binary diagnostic attributes.",
          reference: "Lemeshow, S., Hosmer, D. W., Klar, J., & Lwanga, S. K. (1990). Adequacy of Sample Size in Health Studies. World Health Organization (WHO) / John Wiley & Sons.",
          symbols: [
            { char: "n", meaning: "Minimum sample size required" },
            { char: "Z", meaning: "Standard normal value (typically 1.96 for 95% confidence)" },
            { char: "P", meaning: "Anticipated population prevalence or expected proportion" },
            { char: "d", meaning: "Absolute precision limit required" }
          ],
          note: "Note: Mathematically identical to Daniel's and Cochran's formulas for unknown populations. However, Lemeshow's formula is specifically favored in World Health Organization (WHO) protocols and epidemiological studies. In Archeres, Lemeshow is paired with the Finite Population Correction (FPC) when the population size is known."
        },
        { 
          id: "yamane", 
          name: "Yamane Formula", 
          useCase: "Introduced by Taro Yamane as an alternative for finite populations with a high degree of precision control. It calculates the necessary sample size based on total population size.",
          context: "A highly consistent and academically accepted estimator for finite, known administrative populations.",
          reference: "Yamane, T. (1967). Elementary Sampling Theory. Prentice-Hall.",
          symbols: [
            { char: "n", meaning: "Minimum sample size required" },
            { char: "N", meaning: "Total finite population size" },
            { char: "d", meaning: "Margin tolerance level of error" }
          ]
        },
        { 
          id: "daniel", 
          name: "Daniel Formula", 
          useCase: "Widely applied in medical diagnosis and prevalence research for assessing binary characteristics or characteristics of a specific subgroup.",
          context: "Determines the necessary sample size when studying the prevalence of specific diagnostic parameters.",
          reference: "Daniel, W. W. (1999). Biostatistics: A Foundation for Analysis in the Health Sciences (7th ed.). John Wiley & Sons.",
          symbols: [
            { char: "n", meaning: "Minimum sample size required" },
            { char: "Z", meaning: "Critical normal value based on confidence intervals" },
            { char: "P", meaning: "Anticipated population prevalence of the trait" },
            { char: "d", meaning: "Margin of precision desired" }
          ],
          note: "Note: Mathematically identical to Cochran's and Lemeshow's infinite population formulas. It is named after Wayne W. Daniel and is traditionally preferred in clinical, pharmacy, and biostatistics textbooks. In Archeres, it is recommended when the population size is unknown/infinite."
        },
        { 
          id: "isaac_michael", 
          name: "Isaac & Michael Formula", 
          useCase: "Utilizes Chi-Square distributions to calculate representative sample sizes for finite populations with specific error rates (1%, 5%, 10%).",
          context: "Used when determining sample size based on degrees of freedom and specific confidence intervals.",
          reference: "Isaac, S., & Michael, W. B. (1981). Handbook in Research and Evaluation. EdITS Publishers.",
          symbols: [
            { char: "n", meaning: "Minimum sample size required" },
            { char: "N", meaning: "Total finite population size" },
            { char: "χ²", meaning: "Chi-square value for 1 degree of freedom" },
            { char: "P", meaning: "Estimated proportion (default 0.5)" },
            { char: "e", meaning: "Error rate (0.01, 0.05, 0.10)" }
          ]
        },
        { 
          id: "arikunto", 
          name: "Suharsimi Arikunto Guideline", 
          useCase: "A practical rule of thumb widely used in Indonesian academic circles. Suggests taking the entire population if N < 100, or a percentage (10%-25%) if N >= 100.",
          context: "Used as a pragmatic heuristic for educational and social science research.",
          reference: "Arikunto, S. (2010). Prosedur Penelitian: Suatu Pendekatan Praktik. Rineka Cipta.",
          symbols: [
            { char: "n", meaning: "Sample size" },
            { char: "N", meaning: "Total finite population size" },
            { char: "%", meaning: "Percentage to be sampled (10% - 25%)" }
          ]
        },
        { 
          id: "gay_diehl", 
          name: "Gay & Diehl Guideline", 
          useCase: "Recommends sample sizes based directly on the research design methodology (e.g., 30 for correlational, 60 for experimental, 10-20% for descriptive).",
          context: "Used when a rigid statistical formula is less appropriate than methodological guidelines.",
          reference: "Gay, L. R., & Diehl, P. L. (1992). Research Methods for Business and Management. Macmillan Publishing Company.",
          symbols: [
            { char: "n", meaning: "Sample size" },
            { char: "N", meaning: "Total population size (for descriptive studies)" }
          ]
        },
        { 
          id: "kish_leslie", 
          name: "Kish Leslie Formula", 
          useCase: "Designed for estimating proportions in cross-sectional studies where the population size is unknown or infinite.",
          context: "Commonly used in survey research and cross-sectional studies for infinite populations.",
          reference: "Kish, L. (1965). Survey Sampling. John Wiley & Sons.",
          symbols: [
            { char: "n", meaning: "Minimum sample size required" },
            { char: "Z", meaning: "Z-score for confidence level" },
            { char: "p", meaning: "Estimated proportion (default 0.5)" },
            { char: "e", meaning: "Margin of error" }
          ]
        },
        {
          id: "cronbach_alpha",
          name: "Cronbach's Alpha",
          useCase: "A psychometric coefficient used to evaluate the internal consistency or reliability of a Likert-scale questionnaire (continuous rating scale). Helps verify if a set of items consistently measures the same construct.",
          context: "Used during pilot instrument pre-tests with 5-point, 7-point, or multi-value interval response options.",
          reference: "Cronbach, L. J. (1951). Coefficient alpha and the internal structure of tests. Psychometrika, 16(3), 297-334.",
          symbols: [
            { char: "α", meaning: "Cronbach's Alpha coefficient of reliability" },
            { char: "k", meaning: "Number of test/questionnaire items" },
            { char: "s_i^2", meaning: "Variance of individual item i" },
            { char: "s_t^2", meaning: "Total variance of sum scores across respondents" }
          ],
          note: "Note: Reliability values range from 0 to 1. Values >= 0.70 are generally accepted as reliable in social research (Nunnally, 1978). In Archeres, it is computed entirely client-side using zero-knowledge E2EE parameters."
        },
        {
          id: "kr20",
          name: "Kuder-Richardson 20 (KR-20)",
          useCase: "A specialized psychometric formula used to assess the internal consistency reliability of tests with dichotomous or binary response choices (e.g., Yes/No, Correct/Incorrect, 1/0).",
          context: "Used in educational diagnostic exams or binary-choice surveys to measure overall instrument reliability.",
          reference: "Kuder, G. F., & Richardson, M. W. (1937). The theory of the estimation of test reliability. Psychometrika, 2(3), 151-160.",
          symbols: [
            { char: "KR-20", meaning: "Kuder-Richardson formula 20 coefficient" },
            { char: "k", meaning: "Number of binary test items" },
            { char: "p_i", meaning: "Proportion of correct responses to item i" },
            { char: "q_i", meaning: "Proportion of incorrect responses to item i (1 - p_i)" },
            { char: "s_t^2", meaning: "Total variance of observed test scores across respondents" }
          ],
          note: "Note: KR-20 is mathematically equivalent to Cronbach's Alpha when items are scored dichotomously (0 or 1), but is optimized specifically for binary-choice evaluations."
        }
      ],
      scaleSectionTitle: "Stevens' Measurement Scales & Statistical Advice",
      scaleSectionDesc: "Understanding the properties of Stevens' measurement scales helps you choose between parametric and non-parametric statistical tests.",
      scaleSectionDefHeader: "Scale Definition",
      scaleSectionExampleHeader: "Research Example",
      scaleSectionAssumptionHeader: "Mathematical Assumption",
      scaleSectionTestHeader: "Applicable Statistical Tests",
      scaleAdvices: [
        {
          title: "Nominal & Ordinal Scales",
          testType: "Non-Parametric Statistical Analysis",
          assumption: "Does not assume normal distribution. Highly resilient for categorical, ranked, or qualitative research designs where sample distributions are skewed.",
          scales: [
            {
              name: "Nominal Scale",
              definition: "Categorical labels used purely for identification with no inherent order, sequence, or ranking.",
              example: "Gender, blood type, religious affiliation, field of study."
            },
            {
              name: "Ordinal Scale",
              definition: "Categorical data with a natural, logical ranking, but the mathematical intervals between ranks are unequal.",
              example: "Education levels (High School < Bachelor < PhD), satisfaction ratings (Likert scale: 1 to 5)."
            }
          ],
          tests: [
            { testName: "Chi-Square Test of Independence", purpose: "Determines if there is a significant association between two categorical variables." },
            { testName: "Mann-Whitney U Test", purpose: "Compares differences between two independent ranked groups (ordinal alternative to independent t-Test)." },
            { testName: "Wilcoxon Signed-Rank Test", purpose: "Compares differences between two related/paired ranked groups (pre/post-test ordinal alternative)." },
            { testName: "Spearman's Rank Correlation", purpose: "Measures the strength and direction of monotonic association between two ranked variables." },
            { testName: "Kruskal-Wallis Test", purpose: "Compares differences among three or more independent ranked groups (ordinal alternative to ANOVA)." }
          ]
        },
        {
          title: "Interval & Ratio Scales",
          testType: "Parametric Statistical Analysis",
          assumption: "Assumes continuous numerical metrics, normal data distribution, and equal variance across groups.",
          scales: [
            {
              name: "Interval Scale",
              definition: "Numeric metrics with equal intervals between values, but has no true absolute zero (zero is arbitrary).",
              example: "Temperature in Celsius or Fahrenheit (0°C doesn't mean absence of heat), IQ scores."
            },
            {
              name: "Ratio Scale",
              definition: "Numeric metrics with equal intervals and a true absolute zero point representing total absence of the variable.",
              example: "Age, height, weight, distance, income, duration (0 years represents total absence of time elapsed)."
            }
          ],
          tests: [
            { testName: "Pearson's Correlation Coefficient", purpose: "Measures the strength and direction of a linear relationship between two continuous variables." },
            { testName: "Independent Samples t-Test", purpose: "Compares the means of two independent quantitative/numerical groups." },
            { testName: "Paired Samples t-Test", purpose: "Compares the means of two related/paired quantitative groups (pre/post-test repeated measurements)." },
            { testName: "One-Way ANOVA (F-Test)", purpose: "Compares the means of three or more independent quantitative groups." },
            { testName: "Simple & Multiple Linear Regression", purpose: "Predicts the value of a dependent variable based on one or more independent variables." }
          ]
        }
      ],
      chapterSectionTitle: "Chapter III Thesis Blueprint Framework",
      chapterSectionDesc: "The generated Chapter 3 markdown draft is structured to conform strictly with international peer-reviewed thesis guidelines.",
      chapterSections: [
        { title: "Part A: Research Philosophy", desc: "Outlines the scientific paradigm, approach (quantitative/qualitative), and standard design rationale." },
        { title: "Part B: Variables Operationalization Matrix", desc: "A comprehensive table linking variables, conceptual definitions, operational indicators, and Stevens scales." },
        { title: "Part C: Population & Sampling Protocol", desc: "Documents the exact mathematical formula choice, variable parameters, and ceiling rounding justifications." },
        { title: "Part D: Statistical Hypothesis Strategy", desc: "Outlines the specific parametric or non-parametric test schedules chosen to verify the study's claims." },
        { title: "Part E: Instrument Validity & Reliability (Section 3.5)", desc: "Outlines survey reliability coefficients (Cronbach's Alpha/KR-20), secondary data quality assurance/outlier checks, or Lincoln & Guba trustworthiness strategies." }
      ],
      stackTitle: "Our Technology Stack",
      stackDesc: "Archeres is engineered with high-speed, lightweight components: Next.js App Router for dynamic glassmorphic rendering, Go Fiber for high-performance concurrent REST APIs, and SQLite with GORM for robust, isolated telemetry databases.",
      ctaBack: "Back to Home",
      ctaRegister: "Register Workspace"
    },
    id: {
      metaTitle: "Tentang Archeres | Asisten Perancangan Metodologi Penelitian",
      title: "Presisi Ilmiah, Dibuat Lebih Sederhana",
      subtitle: "Archeres adalah asisten perancangan metodologi akademik yang dirancang khusus untuk membantu peneliti pemula merumuskan rancangan penelitian yang valid, memiliki fondasi matematis yang kuat, serta menjamin privasi data secara mutlak.",
      howItWorksTitle: "Cara Kerja Platform",
      howItWorksSteps: [
        {
          number: "01",
          title: "Kalkulator Sampel & Sensitivitas",
          desc: "Menentukan ukuran sampel minimal secara presisi menggunakan kalkulasi rumus ilmiah populer (Slovin, Lemeshow, Cochran, Yamane, Daniel, dll.) dengan pembulatan ke atas otomatis, dan visualisasikan lewat Kurva Sensitivitas SVG."
        },
        {
          number: "02",
          title: "Paradigma & Reliabilitas Dinamis",
          desc: "Pilih paradigma instrumen Anda (Survei Kuesioner, Data Sekunder/Lab, atau Kualitatif). Uji reliabilitas kuesioner E2EE lokal (Cronbach's Alpha / KR-20) atau terapkan checklist keabsahan Lincoln & Guba (1985)."
        },
        {
          number: "03",
          title: "Cadangan Sidebar & Draf Bab III",
          desc: "Amankan progres Anda secara global melalui fitur cadangan offline JSON terenkripsi di sidebar kiri. Ekspor draf Bab III standar akademik secara instan sesuai paradigma riset Anda."
        }
      ],
      featuresTitle: "Pilar Utama Keunggulan Platform",
      featuresList: [
        {
          icon: "key",
          title: "Zero-Knowledge E2EE",
          desc: "Kekayaan intelektual, profil peneliti, dan draf bab riset Anda dilindungi sepenuhnya secara lokal di browser menggunakan enkripsi ujung-ke-ujung (E2EE) AES-GCM 256."
        },
        {
          icon: "chart",
          title: "Antarmuka Multi-Paradigma",
          desc: "Menyesuaikan secara dinamis untuk kuesioner survei, validasi data sekunder/eksperimen, atau checklist keabsahan Lincoln & Guba (1985) tergantung desain riset Anda."
        },
        {
          icon: "shield",
          title: "Sistem Anti-Spam & Keamanan Kokoh",
          desc: "Mengamankan otentikasi melalui captcha matematika SVG mandiri terenkripsi dan pembatasan laju (rate limiter) Fiber, serta memisahkan telemetri tanpa identitas surel."
        },
        {
          icon: "helix",
          title: "Kalkulasi Matematis Presisi Tinggi",
          desc: "Menghindari kesalahan hitung manual. Mesin backend Go mengevaluasi rumus Slovin, Yamane, Lemeshow, dan Daniel dengan pembulatan ke atas demi menjamin validitas pengujian."
        },
        {
          icon: "book",
          title: "Pusat Edukasi Metodologi Interaktif",
          desc: "Belajar konsep dasar skala pengukuran Stevens, standar Cohen (1988), kriteria Lincoln & Guba, serta konteks akademisnya langsung pada alur kerja Anda."
        }
      ],
      mathSectionTitle: "Formulasi Matematika Ukuran Sampel & Reliabilitas",
      mathSectionDesc: "Archeres melakukan estimasi ukuran sampel dan perhitungan reliabilitas instrumen secara real-time menggunakan model matematika akademis teruji.",
      mathLegendTitle: "Legenda Simbol",
      mathFormulas: [
        { 
          id: "slovin", 
          name: "Rumus Slovin", 
          useCase: "Paling sering digunakan dalam penelitian sosial untuk pengambilan sampel acak sederhana ketika ukuran populasi (N) diketahui secara pasti dan berjumlah terbatas (populasi terbatas). Sangat direkomendasikan karena kesederhanaan perhitungannya.",
          context: "Digunakan ketika total populasi (N) diketahui dan Anda membutuhkan estimasi ukuran sampel (n) secara cepat dengan tingkat batas kesalahan tertentu.",
          reference: "Sevilla, C. G., Ochave, J. A., Punsalan, T. G., Regala, B. P., & Uriarte, G. G. (1984). An Introduction to Research Methods. Rex Book Store. (Commonly associated with Slovin, 1960).",
          symbols: [
            { char: "n", meaning: "Jumlah sampel minimal yang dibutuhkan" },
            { char: "N", meaning: "Ukuran total populasi penelitian" },
            { char: "e", meaning: "Margin toleransi kesalahan (misal: 0,05 untuk 5%)" }
          ]
        },
        { 
          id: "cochran", 
          name: "Rumus Cochran", 
          useCase: "Dirancang oleh ahli statistik William G. Cochran untuk pengambilan sampel pada populasi yang sangat besar atau tidak terbatas (tidak diketahui jumlah pastinya). Sangat ideal untuk survei demografi berskala luas.",
          context: "Digunakan ketika jumlah populasi dianggap tidak terbatas, memanfaatkan nilai deviasi standar normal kritis.",
          reference: "Cochran, W. G. (1977). Sampling Techniques (3rd ed.). John Wiley & Sons.",
          symbols: [
            { char: "n", meaning: "Jumlah sampel minimal yang dibutuhkan" },
            { char: "Z", meaning: "Skor standar normal (biasanya 1,96 untuk tingkat kepercayaan 95%)" },
            { char: "p", meaning: "Estimasi proporsi populasi dengan karakteristik tertentu (default 0,5)" },
            { char: "q", meaning: "Peluang kebalikan proporsi populasi (1 - p)" },
            { char: "e", meaning: "Margin toleransi kesalahan yang diterima" }
          ]
        },
        { 
          id: "lemeshow", 
          name: "Persamaan Lemeshow", 
          useCase: "Persamaan epidemiologi khusus yang dikembangkan oleh Stanley Lemeshow untuk uji klinis, kedokteran, dan bidang kesehatan umum ketika jumlah total populasi tidak diketahui namun estimasi prevalensi penyakit dapat diantisipasi secara biner.",
          context: "Digunakan dalam latar medis/klinis dengan populasi tak terbatas untuk mengevaluasi karakteristik diagnosis biner.",
          reference: "Lemeshow, S., Hosmer, D. W., Klar, J., & Lwanga, S. K. (1990). Adequacy of Sample Size in Health Studies. World Health Organization (WHO) / John Wiley & Sons.",
          symbols: [
            { char: "n", meaning: "Jumlah sampel minimal yang dibutuhkan" },
            { char: "Z", meaning: "Skor standar normal kritis (biasanya 1,96 pada tingkat kepercayaan 95%)" },
            { char: "P", meaning: "Ekspektasi proporsi atau tingkat prevalensi penyakit dalam populasi" },
            { char: "d", meaning: "Batas presisi kesalahan absolut yang diinginkan" }
          ],
          note: "Catatan: Secara matematis identik dengan Rumus Daniel dan Cochran untuk populasi tidak diketahui. Namun, nama Lemeshow disukai dalam protokol Organisasi Kesehatan Dunia (WHO) dan riset epidemiologi. Di Archeres, Lemeshow dipadukan dengan Koreksi Populasi Terbatas (FPC) jika ukuran populasi diketahui."
        },
        { 
          id: "yamane", 
          name: "Rumus Yamane", 
          useCase: "Diperkenalkan oleh Taro Yamane sebagai alternatif matematis yang konsisten untuk populasi terbatas yang diketahui jumlahnya. Rumus ini menghitung ukuran sampel berdasarkan total populasi dan batas toleransi.",
          context: "Estimator yang sangat andal dan diterima secara luas di ranah akademis untuk populasi terbatas administratif.",
          reference: "Yamane, T. (1967). Elementary Sampling Theory. Prentice-Hall.",
          symbols: [
            { char: "n", meaning: "Jumlah sampel minimal yang dibutuhkan" },
            { char: "N", meaning: "Ukuran total populasi penelitian" },
            { char: "d", meaning: "Toleransi batas kesalahan kesalahan presisi" }
          ]
        },
        { 
          id: "daniel", 
          name: "Rumus Daniel", 
          useCase: "Banyak diterapkan dalam diagnosis medis dan penelitian klinis untuk menguji prevalensi karakteristik biner (seperti keberadaan penyakit atau gejala khusus) pada populasi target.",
          context: "Menentukan ukuran sampel ketika peneliti berfokus pada pengujian proporsi diagnosis pada populasi tak terbatas.",
          reference: "Daniel, W. W. (1999). Biostatistics: A Foundation for Analysis in the Health Sciences (7th ed.). John Wiley & Sons.",
          symbols: [
            { char: "n", meaning: "Jumlah sampel minimal yang dibutuhkan" },
            { char: "Z", meaning: "Nilai kritis normal berdasarkan rentang tingkat kepercayaan" },
            { char: "P", meaning: "Antisipasi nilai prevalensi/proporsi fenomena di populasi" },
            { char: "d", meaning: "Margin presisi kesalahan toleransi" }
          ],
          note: "Catatan: Secara matematis identik dengan rumus Cochran dan Lemeshow untuk populasi tidak terbatas. Dinamai berdasarkan Wayne W. Daniel dan secara tradisional disukai dalam buku teks klinis, farmasi, dan biostatistika. Di Archeres, rumus ini direkomendasikan ketika ukuran populasi tidak diketahui/tak terbatas."
        },
        { 
          id: "isaac_michael", 
          name: "Rumus Isaac & Michael", 
          useCase: "Menggunakan distribusi Chi-Square untuk menghitung ukuran sampel yang representatif pada populasi terbatas dengan tingkat kesalahan spesifik (1%, 5%, 10%).",
          context: "Digunakan saat menentukan ukuran sampel berdasarkan derajat kebebasan dan interval kepercayaan spesifik.",
          reference: "Isaac, S., & Michael, W. B. (1981). Handbook in Research and Evaluation. EdITS Publishers.",
          symbols: [
            { char: "n", meaning: "Jumlah sampel minimal yang dibutuhkan" },
            { char: "N", meaning: "Ukuran total populasi terbatas" },
            { char: "χ²", meaning: "Nilai Chi-square untuk 1 derajat kebebasan" },
            { char: "P", meaning: "Estimasi proporsi (default 0,5)" },
            { char: "e", meaning: "Tingkat kesalahan (0,01, 0,05, 0,10)" }
          ]
        },
        { 
          id: "arikunto", 
          name: "Pedoman Suharsimi Arikunto", 
          useCase: "Sebuah pedoman praktis (*rule of thumb*) yang banyak digunakan di kalangan akademisi Indonesia. Menyarankan pengambilan seluruh populasi jika N < 100, atau persentase (10%-25%) jika N >= 100.",
          context: "Digunakan sebagai heuristik pragmatis untuk penelitian pendidikan dan ilmu sosial.",
          reference: "Arikunto, S. (2010). Prosedur Penelitian: Suatu Pendekatan Praktik. Rineka Cipta.",
          symbols: [
            { char: "n", meaning: "Ukuran sampel" },
            { char: "N", meaning: "Total populasi terbatas" },
            { char: "%", meaning: "Persentase yang akan dijadikan sampel (10% - 25%)" }
          ]
        },
        { 
          id: "gay_diehl", 
          name: "Pedoman Gay & Diehl", 
          useCase: "Merekomendasikan ukuran sampel secara langsung berdasarkan metodologi desain penelitian (misalnya, 30 untuk korelasional, 60 untuk eksperimental, 10-20% untuk deskriptif).",
          context: "Digunakan ketika formula statistik yang kaku kurang sesuai dibandingkan pedoman metodologis langsung.",
          reference: "Gay, L. R., & Diehl, P. L. (1992). Research Methods for Business and Management. Macmillan Publishing Company.",
          symbols: [
            { char: "n", meaning: "Ukuran sampel" },
            { char: "N", meaning: "Ukuran total populasi (untuk studi deskriptif)" }
          ]
        },
        { 
          id: "kish_leslie", 
          name: "Rumus Kish Leslie", 
          useCase: "Dirancang untuk mengestimasi proporsi pada studi potong-lintang (*cross-sectional*) di mana ukuran populasi tidak diketahui atau tidak terbatas.",
          context: "Biasa digunakan dalam survei penelitian dan studi *cross-sectional* untuk populasi tak terbatas.",
          reference: "Kish, L. (1965). Survey Sampling. John Wiley & Sons.",
          symbols: [
            { char: "n", meaning: "Jumlah sampel minimal yang dibutuhkan" },
            { char: "Z", meaning: "Z-score untuk tingkat kepercayaan" },
            { char: "p", meaning: "Estimasi proporsi (default 0,5)" },
            { char: "e", meaning: "Margin toleransi kesalahan" }
          ]
        },
        {
          id: "cronbach_alpha",
          name: "Cronbach's Alpha",
          useCase: "Koefisien psikometrik yang digunakan untuk mengevaluasi konsistensi internal atau reliabilitas kuesioner skala Likert (skala pengukuran kontinu). Membantu memverifikasi apakah sekumpulan butir pertanyaan secara konsisten mengukur konstruk yang sama.",
          context: "Digunakan selama uji coba instrumen (pilot pre-test) dengan pilihan jawaban rentang nilai/kontinu (misal skala 1-5 atau 1-7).",
          reference: "Cronbach, L. J. (1951). Coefficient alpha and the internal structure of tests. Psychometrika, 16(3), 297-334.",
          symbols: [
            { char: "α", meaning: "Koefisien reliabilitas Cronbach's Alpha" },
            { char: "k", meaning: "Jumlah butir pertanyaan/pernyataan instrumen" },
            { char: "s_i^2", meaning: "Varians skor butir ke-i" },
            { char: "s_t^2", meaning: "Varians total dari jumlah skor seluruh responden" }
          ],
          note: "Catatan: Nilai reliabilitas berkisar antara 0 hingga 1. Nilai >= 0,70 umumnya diterima sebagai instrumen yang reliabel dalam penelitian sosial (Nunnally, 1978). Di Archeres, komputasi ini dieksekusi 100% di browser tanpa menyentuh server (Zero-Knowledge)."
        },
        {
          id: "kr20",
          name: "Kuder-Richardson 20 (KR-20)",
          useCase: "Rumus psikometrik khusus yang digunakan untuk menguji konsistensi internal reliabilitas instrumen dengan pilihan jawaban dikotomis atau biner (seperti Ya/Tidak, Benar/Salah, 1/0).",
          context: "Digunakan dalam ujian diagnostik pendidikan atau survei biner untuk mengukur keandalan instrumen tes.",
          reference: "Kuder, G. F., & Richardson, M. W. (1937). The theory of the estimation of test reliability. Psychometrika, 2(3), 151-160.",
          symbols: [
            { char: "KR-20", meaning: "Koefisien reliabilitas formula Kuder-Richardson 20" },
            { char: "k", meaning: "Jumlah butir pertanyaan biner instrumen" },
            { char: "p_i", meaning: "Proporsi jawaban benar untuk butir ke-i" },
            { char: "q_i", meaning: "Proporsi jawaban salah untuk butir ke-i (1 - p_i)" },
            { char: "s_t^2", meaning: "Varians total dari jumlah skor tes seluruh responden" }
          ],
          note: "Catatan: Rumus KR-20 secara matematis setara dengan Cronbach's Alpha ketika butir pertanyaan dinilai secara dikotomis (0 atau 1), tetapi dioptimalkan secara khusus untuk evaluasi biner."
        }
      ],
      scaleSectionTitle: "Skala Pengukuran Stevens & Arahan Uji Statistik",
      scaleSectionDesc: "Memahami karakteristik masing-masing skala pengukuran Stevens membantu Anda memilih antara uji statistik parametris dan non-parametris secara tepat.",
      scaleSectionDefHeader: "Definisi Skala",
      scaleSectionExampleHeader: "Contoh Riset",
      scaleSectionAssumptionHeader: "Asumsi Matematis",
      scaleSectionTestHeader: "Uji Statistik yang Berlaku",
      scaleAdvices: [
        {
          title: "Skala Nominal & Ordinal",
          testType: "Analisis Statistik Non-Parametris",
          assumption: "Bebas distribusi (tidak mengasumsikan distribusi data normal). Sangat tangguh untuk data kategori, peringkat/ranking, atau riset kualitatif dengan ukuran sampel kecil/skala skewed.",
          scales: [
            {
              name: "Skala Nominal",
              definition: "Label kategori yang murni digunakan untuk identifikasi data, tanpa tingkatan, urutan, atau nilai matematika di dalamnya.",
              example: "Jenis kelamin, golongan darah, agama, suku, bidang ilmu/jurusan."
            },
            {
              name: "Skala Ordinal",
              definition: "Label kategori yang memiliki urutan atau tingkatan logis, namun jarak matematika antar tingkatan tidak sama/terukur secara numerik konstan.",
              example: "Tingkat pendidikan (SD < SMP < SMA < S1), skala kepuasan Likert (1: Sangat Tidak Puas s/d 5: Sangat Puas)."
            }
          ],
          tests: [
            { testName: "Uji Chi-Square (Uji Asosiasi)", purpose: "Menentukan ada tidaknya hubungan signifikan antara dua variabel kategorik." },
            { testName: "Uji Mann-Whitney U", purpose: "Membandingkan perbedaan skor ordinal antara dua kelompok independen (alternatif non-parametrik t-Test independen)." },
            { testName: "Uji Wilcoxon Signed-Rank", purpose: "Membandingkan perbedaan skor ordinal dua kelompok berpasangan (alternatif non-parametrik paired t-Test/sebelum-sesudah)." },
            { testName: "Korelasi Spearman Rank (Rho)", purpose: "Mengukur kekuatan dan arah hubungan monotonik antara dua variabel bertingkat/ordinal." },
            { testName: "Uji Kruskal-Wallis ANOVA", purpose: "Membandingkan perbedaan skor ordinal antara tiga kelompok independen atau lebih (alternatif non-parametrik ANOVA)." }
          ]
        },
        {
          title: "Skala Interval & Rasio",
          testType: "Analisis Statistik Parametris",
          assumption: "Mengasumsikan data berupa nilai numerik kontinu, data berdistribusi normal, dan varians kelompok homogen.",
          scales: [
            {
              name: "Skala Interval",
              definition: "Data numerik dengan jarak konstan yang sama antar nilai, namun tidak memiliki nilai nol mutlak (nilai nol bersifat arbitrer).",
              example: "Suhu Celsius/Fahrenheit (0°C tidak berarti tidak ada panas), skor tes IQ (0 IQ tidak berarti tidak memiliki kecerdasan)."
            },
            {
              name: "Skala Rasio",
              definition: "Data numerik kontinu dengan jarak konstan antar nilai serta memiliki titik nol mutlak yang melambangkan ketiadaan mutlak variabel tersebut.",
              example: "Usia, tinggi badan, berat badan, pendapatan, jarak tempuh (0 meter melambangkan ketiadaan jarak sama sekali)."
            }
          ],
          tests: [
            { testName: "Korelasi Pearson Product-Moment", purpose: "Mengukur kekuatan dan arah hubungan linear antara dua variabel numerik kontinu." },
            { testName: "Independent Samples t-Test", purpose: "Membandingkan perbedaan rata-rata (mean) numerik antara dua kelompok independen." },
            { testName: "Paired Samples t-Test", purpose: "Membandingkan perbedaan rata-rata numerik dua kelompok berpasangan (pengukuran berulang/sebelum-sesudah)." },
            { testName: "One-Way ANOVA (F-Test)", purpose: "Membandingkan perbedaan rata-rata numerik antara tiga kelompok independen atau lebih." },
            { testName: "Regresi Linear Sederhana & Berganda", purpose: "Memprediksi nilai variabel dependen numerik berdasarkan pengaruh satu atau lebih variabel independen." }
          ]
        }
      ],
      chapterSectionTitle: "Kerangka Blueprint Dokumen BAB III",
      chapterSectionDesc: "Draf berkas markdown BAB III yang dihasilkan disusun secara sistematis agar selaras dengan pedoman penulisan karya ilmiah universitas.",
      chapterSections: [
        { title: "Bagian A: Pendekatan & Desain Penelitian", desc: "Menguraikan paradigma keilmuan yang dipilih (kuantitatif/kualitatif) serta alasan ilmiah di balik desain studi." },
        { title: "Bagian B: Matriks Operasionalisasi Variabel", desc: "Tabel komprehensif yang menghubungkan variabel, definisi konseptual, indikator operasional, dan skala pengukuran Stevens." },
        { title: "Bagian C: Protokol Populasi & Perhitungan Sampel", desc: "Mendokumentasikan alasan pemilihan rumus sampel, parameter yang diinput, serta argumen matematis pembulatan ke atas." },
        { title: "Bagian D: Rencana Pengujian Hipotesis Statistik", desc: "Menyusun jadwal pengujian hipotesis (parametris/non-parametris) untuk menjawab seluruh rumusan masalah penelitian." },
        { title: "Bagian E: Validitas & Reliabilitas Instrumen (Pasal 3.5)", desc: "Menguraikan koefisien keandalan kuesioner (Alpha/KR-20), penjaminan kualitas data sekunder/mitigasi pencilan, atau strategi keabsahan kualitatif Lincoln & Guba." }
      ],
      stackTitle: "Fondasi Teknologi Berkinerja Tinggi",
      stackDesc: "Archeres dirancang menggunakan arsitektur modern berkecepatan tinggi: Next.js App Router untuk antarmuka glassmorphic yang responsif, Go Fiber untuk kinerja konkurensi API backend yang efisien, serta basis data SQLite terisolasi via GORM untuk keandalan penyimpanan telemetri secara lokal.",
      ctaBack: "Kembali ke Beranda",
      ctaRegister: "Mulai Susun Metodologi Sekarang"
    }
  };

  const copy = content[currentLang] || content["en"];

  const getIcon = (type: string): React.JSX.Element | null => {
    switch (type) {
      case "helix":
        return <IconHelix size={24} style={{ color: "#c084fc", strokeWidth: 2 }} />;
      case "chart":
        return <IconChart size={24} style={{ color: "#38bdf8", strokeWidth: 2 }} />;
      case "fileDown":
        return <IconFileDown size={24} style={{ color: "#22d3ee", strokeWidth: 2 }} />;
      case "shield":
        return <IconShield size={24} style={{ color: "#a78bfa", strokeWidth: 2 }} />;
      case "key":
        return <IconKey size={24} style={{ color: "#34d399", strokeWidth: 2 }} />;
      case "book":
        return <IconBook size={24} style={{ color: "#fb7185", strokeWidth: 2 }} />;
      default:
        return null;
    }
  };

  const renderMathFormula = (id: string) => {
    switch (id) {
      case "slovin":
        return (
          <div style={styles.mathExpr}>
            <span>n = </span>
            <div style={styles.fraction}>
              <span style={styles.numerator}>N</span>
              <span style={styles.denominator}>1 + N(e<sup>2</sup>)</span>
            </div>
          </div>
        );
      case "cochran":
        return (
          <div style={styles.mathExpr}>
            <span>n = </span>
            <div style={styles.fraction}>
              <span style={styles.numerator}>Z<sup>2</sup> &bull; p &bull; q</span>
              <span style={styles.denominator}>e<sup>2</sup></span>
            </div>
          </div>
        );
      case "lemeshow":
        return (
          <div style={styles.mathExpr}>
            <span>n = </span>
            <div style={styles.fraction}>
              <span style={styles.numerator}>Z<sup>2</sup> &bull; P(1 - P)</span>
              <span style={styles.denominator}>d<sup>2</sup></span>
            </div>
          </div>
        );
      case "yamane":
        return (
          <div style={styles.mathExpr}>
            <span>n = </span>
            <div style={styles.fraction}>
              <span style={styles.numerator}>N</span>
              <span style={styles.denominator}>1 + N(d<sup>2</sup>)</span>
            </div>
          </div>
        );
      case "daniel":
        return (
          <div style={styles.mathExpr}>
            <span>n = </span>
            <div style={styles.fraction}>
              <span style={styles.numerator}>Z<sup>2</sup> &bull; P(1 - P)</span>
              <span style={styles.denominator}>d<sup>2</sup></span>
            </div>
          </div>
        );
      case "isaac_michael":
        return (
          <div style={styles.mathExpr}>
            <span>n = </span>
            <div style={styles.fraction}>
              <span style={styles.numerator}>&chi;<sup>2</sup> &bull; N &bull; P(1 - P)</span>
              <span style={styles.denominator}>d<sup>2</sup>(N - 1) + &chi;<sup>2</sup> &bull; P(1 - P)</span>
            </div>
          </div>
        );
      case "arikunto":
        return (
          <div style={{ ...styles.mathExpr, flexDirection: "column", gap: "0.5rem", fontSize: "1rem" }}>
            <span>if N &lt; 100 &rArr; n = N</span>
            <span>if N &ge; 100 &rArr; n = N &bull; (10% - 25%)</span>
          </div>
        );
      case "gay_diehl":
        return (
          <div style={{ ...styles.mathExpr, flexDirection: "column", gap: "0.5rem", fontSize: "0.95rem" }}>
            <span>Descriptive: 10% - 20% of N</span>
            <span>Correlational: 30 subjects</span>
            <span>Experimental: 60 subjects</span>
          </div>
        );
      case "kish_leslie":
        return (
          <div style={styles.mathExpr}>
            <span>n = </span>
            <div style={styles.fraction}>
              <span style={styles.numerator}>Z<sup>2</sup> &bull; p &bull; q</span>
              <span style={styles.denominator}>e<sup>2</sup></span>
            </div>
          </div>
        );
      case "cronbach_alpha":
        return (
          <div style={styles.mathExpr}>
            <span>&alpha; = </span>
            <div style={styles.fraction}>
              <span style={styles.numerator}>k</span>
              <span style={styles.denominator}>k - 1</span>
            </div>
            <span>&bull; [ 1 - </span>
            <div style={styles.fraction}>
              <span style={styles.numerator}>&sum; s<sub>i</sub><sup>2</sup></span>
              <span style={styles.denominator}>s<sub>t</sub><sup>2</sup></span>
            </div>
            <span> ]</span>
          </div>
        );
      case "kr20":
        return (
          <div style={styles.mathExpr}>
            <span>KR<sub>20</sub> = </span>
            <div style={styles.fraction}>
              <span style={styles.numerator}>k</span>
              <span style={styles.denominator}>k - 1</span>
            </div>
            <span>&bull; [ 1 - </span>
            <div style={styles.fraction}>
              <span style={styles.numerator}>&sum; p<sub>i</sub>q<sub>i</sub></span>
              <span style={styles.denominator}>s<sub>t</sub><sup>2</sup></span>
            </div>
            <span> ]</span>
          </div>
        );
      default:
        return null;
    }
  };

  const mainContainerStyle: React.CSSProperties = {
    ...styles.mainContainer,
    flexDirection: "column",
    marginTop: "80px",
    marginBottom: "80px",
    padding: isMobile ? "1rem" : "2rem 1.5rem",
    gap: "3.5rem"
  };

  return (
    <div style={styles.landingContainer}>
      {/* Background Decorative Ambient Neon Orbs */}
      <div style={styles.orbPurple}></div>
      <div style={styles.orbCyan}></div>

      {/* Header */}
      <header className="fixed-header">
        <div className="nav-brand" style={{ cursor: "pointer" }} onClick={() => router.push("/")}>
          <img src="/Archeres.svg" alt="Archeres Logo" className="nav-brand-logo" style={{ width: "24px", height: "24px", objectFit: "contain" }} />
          <span className="nav-brand-name">{t("common.appName")}</span>
        </div>

        <div style={styles.navLinks}>
          <span
            onClick={() => router.push("/")}
            style={styles.navLink}
            className="hover-bright"
          >
            {currentLang === "id" ? "Beranda" : "Home"}
          </span>
        </div>

        <div style={styles.headerActions}>
          <div style={styles.langBar}>
            <button
              onClick={() => i18n.changeLanguage("en")}
              style={{
                ...styles.langBtn,
                ...(currentLang === "en" ? styles.langBtnActive : {})
              }}
            >
              EN
            </button>
            <button
              onClick={() => i18n.changeLanguage("id")}
              style={{
                ...styles.langBtn,
                ...(currentLang === "id" ? styles.langBtnActive : {})
              }}
            >
              ID
            </button>
          </div>

          {isLoggedIn ? (
            <button 
              onClick={() => router.push("/user/dashboard")} 
              className="btn btn-primary" 
              style={{ 
                padding: isMobile ? "0.4rem 0.75rem" : "0.5rem 1rem", 
                fontSize: isMobile ? "0.75rem" : "0.85rem",
                whiteSpace: "nowrap"
              }}
            >
              {isMobile ? "Workspace" : (currentLang === "id" ? "Ke Workspace" : "Go to Workspace")}
            </button>
          ) : (
            <button onClick={() => router.push("/auth/login")} style={styles.signInHeaderBtn}>
              {t("auth.submitLogin")}
            </button>
          )}
        </div>
      </header>

      {/* Main Body content */}
      <main style={mainContainerStyle} className="animate-fade-in">
        
        {/* Section 1: Hero title */}
        <section style={{ textAlign: "center", maxWidth: "800px", alignSelf: "center", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h1 style={styles.heroTitle}>{copy.title}</h1>
          <p style={styles.heroSubtitle}>{copy.subtitle}</p>
        </section>

        {/* Section 2: How it works step by step visual flow */}
        <section style={{ width: "100%", maxWidth: "1000px", alignSelf: "center" }}>
          <h2 style={styles.sectionHeader}>{copy.howItWorksTitle}</h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
            gap: "1.5rem",
            marginTop: "1.5rem"
          }}>
            {copy.howItWorksSteps.map((step, idx) => (
              <div key={idx} className="glass-panel" style={{ padding: "1.5rem", borderRadius: "14px", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <span style={{ fontSize: "2rem", fontWeight: 900, color: "rgba(124,58,237,0.3)" }}>{step.number}</span>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "white" }}>{step.title}</h3>
                <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.45 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Core Features list */}
        <section style={{ width: "100%", maxWidth: "1000px", alignSelf: "center" }}>
          <h2 style={styles.sectionHeader}>{copy.featuresTitle}</h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: "1.5rem",
            marginTop: "1.5rem"
          }}>
            {copy.featuresList.map((f, idx) => (
              <div key={idx} className="glass-panel" style={{ padding: "1.5rem", borderRadius: "14px", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.5rem", borderRadius: "10px", flexShrink: 0 }}>
                  {getIcon(f.icon)}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "white" }}>{f.title}</h3>
                  <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* EXPLORATIVE SECTION A: Mathematical formulas detail */}
        <section style={{ width: "100%", maxWidth: "1000px", alignSelf: "center" }}>
          <h2 style={styles.sectionHeader}>{copy.mathSectionTitle}</h2>
          <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.45)", marginTop: "0.5rem", marginBottom: "1.5rem" }}>
            {copy.mathSectionDesc}
          </p>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "2rem"
          }}>
            {copy.mathFormulas.map((f, idx) => (
              <div key={idx} className="glass-panel" style={{ padding: "2rem", borderRadius: "16px", display: "flex", flexDirection: windowWidth <= 1024 ? "column" : "row", gap: "2rem", alignItems: "stretch" }}>
                
                {/* Left Side: Equation and Title */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.25rem", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ marginBottom: "0.5rem" }}>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: 850, color: "white", fontFamily: "'Outfit', sans-serif" }}>{f.name}</h3>
                    </div>
                    <p style={{ fontSize: "0.86rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>
                      {f.useCase}
                    </p>
                  </div>
                  
                  <div style={{ background: "rgba(0,0,0,0.2)", padding: "1.5rem 1rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    {renderMathFormula(f.id)}
                  </div>
                </div>

                {/* Right Side: Usage, Symbols Legend, & Academic Reference */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.25rem", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", padding: "1.5rem", borderRadius: "12px" }}>
                  <div>
                    <h4 style={{ fontSize: "0.85rem", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>
                      {currentLang === "id" ? "Konteks Penggunaan" : "Application Context"}
                    </h4>
                    <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.45 }}>
                      {f.context}
                    </p>
                  </div>

                  <div>
                    <h4 style={{ fontSize: "0.85rem", fontWeight: 800, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.6rem" }}>
                      {copy.mathLegendTitle}
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {f.symbols.map((sym, sIdx) => (
                        <div key={sIdx} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                          <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#c084fc", fontFamily: "monospace", width: "20px", textAlign: "center", display: "inline-block" }}>
                            {sym.char}
                          </span>
                          <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.35, flex: 1 }}>
                            {sym.meaning}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: "0.85rem", fontWeight: 800, color: "#fb7185", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>
                      {currentLang === "id" ? "Referensi" : "Reference"}
                    </h4>
                    <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.45, fontStyle: "italic", borderLeft: "2px solid #fb7185", paddingLeft: "0.5rem" }}>
                      {f.reference}
                    </p>
                  </div>

                  {f.note && (
                    <div style={{ marginTop: "0.25rem", background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.15)", padding: "0.75rem 1rem", borderRadius: "8px" }}>
                      <h4 style={{ fontSize: "0.85rem", fontWeight: 800, color: "#34d399", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>
                        {currentLang === "id" ? "Catatan Perbandingan" : "Comparison Note"}
                      </h4>
                      <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.45 }}>
                        {f.note}
                      </p>
                    </div>
                  )}


                </div>

              </div>
            ))}
          </div>
        </section>

        {/* EXPLORATIVE SECTION B: Scale measurement guidelines advice */}
        <section style={{ width: "100%", maxWidth: "1000px", alignSelf: "center" }}>
          <h2 style={styles.sectionHeader}>{copy.scaleSectionTitle}</h2>
          <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.45)", marginTop: "0.5rem", marginBottom: "1.5rem" }}>
            {copy.scaleSectionDesc}
          </p>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "2.5rem"
          }}>
            {copy.scaleAdvices.map((group, idx) => (
              <div key={idx} className="glass-panel animate-fade-in" style={{ padding: "2rem", borderRadius: "18px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                
                {/* Header panel */}
                <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", gap: "1rem", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "1rem" }}>
                  <div>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 900, color: "white", fontFamily: "'Outfit', sans-serif" }}>{group.title}</h3>
                    <span style={{ fontSize: "0.8rem", color: idx === 0 ? "#38bdf8" : "#34d399", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {group.testType}
                    </span>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.02)", border: idx === 0 ? "1px solid rgba(56,189,248,0.2)" : "1px solid rgba(52,211,153,0.2)", padding: "0.75rem 1rem", borderRadius: "10px", maxWidth: "480px" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 800, color: idx === 0 ? "#38bdf8" : "#34d399", textTransform: "uppercase", display: "block", marginBottom: "0.2rem" }}>
                      {copy.scaleSectionAssumptionHeader}
                    </span>
                    <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.35 }}>{group.assumption}</p>
                  </div>
                </div>

                {/* Sub-grid of Scales */}
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "1.5rem" }}>
                  {group.scales.map((sc, scIdx) => (
                    <div key={scIdx} style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", padding: "1.25rem", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      <h4 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#c084fc", fontFamily: "'Outfit', sans-serif" }}>{sc.name}</h4>
                      <div>
                        <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", fontWeight: 700, display: "block" }}>{copy.scaleSectionDefHeader}</span>
                        <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.45 }}>{sc.definition}</p>
                      </div>
                      <div style={{ background: "rgba(0,0,0,0.1)", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.03)" }}>
                        <span style={{ fontSize: "0.72rem", color: idx === 0 ? "#38bdf8" : "#34d399", textTransform: "uppercase", fontWeight: 800, display: "block" }}>{copy.scaleSectionExampleHeader}</span>
                        <p style={{ fontSize: "0.8rem", color: "white", fontWeight: 600 }}>{sc.example}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Statistical test mapping listing */}
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", padding: "1.25rem", borderRadius: "12px" }}>
                  <h4 style={{ fontSize: "0.85rem", fontWeight: 800, color: "#fb7185", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.04)", paddingBottom: "0.4rem" }}>
                    {copy.scaleSectionTestHeader}
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {group.tests.map((test, tIdx) => (
                      <div key={tIdx} style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? "0.25rem" : "1.5rem" }}>
                        <span style={{ fontSize: "0.86rem", fontWeight: 800, color: "white", width: isMobile ? "100%" : "260px", flexShrink: 0 }}>{test.testName}</span>
                        <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>{test.purpose}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ))}
          </div>
        </section>

        {/* EXPLORATIVE SECTION C: Generated chapters outline blueprint */}
        <section style={{ width: "100%", maxWidth: "1000px", alignSelf: "center" }}>
          <h2 style={styles.sectionHeader}>{copy.chapterSectionTitle}</h2>
          <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.45)", marginTop: "0.5rem", marginBottom: "1.5rem" }}>
            {copy.chapterSectionDesc}
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 2fr",
            gap: "1.5rem"
          }}>
            {copy.chapterSections.map((ch, idx) => (
              <React.Fragment key={idx}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#a78bfa" }}></div>
                  <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "white" }}>{ch.title}</h3>
                </div>
                <div className="glass-panel" style={{ padding: "1rem 1.25rem", borderRadius: "12px", display: "flex", alignItems: "center" }}>
                  <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>
                    {ch.desc}
                  </p>
                </div>
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* Section 4: Technology Stack info */}
        <section className="glass-panel" style={{ width: "100%", maxWidth: "1000px", alignSelf: "center", padding: "2rem", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "white" }}>{copy.stackTitle}</h2>
          <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{copy.stackDesc}</p>
        </section>



      </main>

      {/* Footer */}
      <footer className="fixed-footer">
        <p className="footer-text">
          &copy; 2026 <a href="https://repo.alexmaisa.my.id/alexmaisa" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255, 255, 255, 0.6)", textDecoration: "none" }}>Benny Maisa</a>. <a href="https://repo.alexmaisa.my.id/alexmaisa/archeres/src/branch/main/LICENSE" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255, 255, 255, 0.6)", textDecoration: "none" }}>Archeres is licensed under PolyForm Noncommercial 1.0.0</a>. <span className="footer-powered">Powered by Next.js, Go Fiber, & SQLite.</span>
        </p>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  landingContainer: {
    minHeight: "100vh",
    width: "100vw",
    backgroundColor: "hsl(var(--bg-color))",
    color: "white",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
    overflowX: "hidden",
    padding: "0 2rem",
    boxSizing: "border-box"
  },
  mainContainer: {
    width: "100%",
    maxWidth: "1000px",
    display: "flex",
    zIndex: 10,
    position: "relative",
    boxSizing: "border-box"
  },
  orbPurple: {
    position: "absolute",
    top: "5%",
    left: "10%",
    width: "350px",
    height: "350px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, rgba(0,0,0,0) 70%)",
    filter: "blur(70px)",
    zIndex: 0,
    pointerEvents: "none",
  },
  orbCyan: {
    position: "absolute",
    bottom: "10%",
    right: "10%",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(6,182,212,0.06) 0%, rgba(0,0,0,0) 70%)",
    filter: "blur(70px)",
    zIndex: 0,
    pointerEvents: "none",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "1.25rem",
  },
  langBar: {
    display: "flex",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "8px",
    padding: "2px",
  },
  langBtn: {
    background: "transparent",
    border: "none",
    color: "rgba(255,255,255,0.4)",
    padding: "0.25rem 0.55rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.7rem",
    fontWeight: 700,
    transition: "all 0.2s ease",
  },
  langBtnActive: {
    background: "rgba(124, 58, 237, 0.15)",
    color: "#c084fc",
  },
  signInHeaderBtn: {
    background: "transparent",
    border: "none",
    color: "rgba(255,255,255,0.75)",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 600,
    transition: "color 0.2s ease",
  },
  navLinks: {
    display: "flex",
    gap: "1.5rem",
    marginRight: "auto",
    marginLeft: "2rem",
  },
  navLink: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "rgba(255,255,255,0.7)",
    cursor: "pointer",
    transition: "color 0.2s ease",
  },
  heroTitle: {
    fontSize: "2.5rem",
    fontWeight: 900,
    fontFamily: "'Outfit', sans-serif",
    lineHeight: 1.15,
    letterSpacing: "-0.03em",
    color: "white",
  },
  heroSubtitle: {
    fontSize: "1rem",
    color: "rgba(255,255,255,0.55)",
    lineHeight: 1.5,
    maxWidth: "680px",
    margin: "0 auto"
  },
  sectionHeader: {
    fontSize: "1.3rem",
    fontWeight: 800,
    color: "white",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    paddingBottom: "0.5rem"
  },
  // Beautiful fraction style classes
  mathExpr: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Outfit', sans-serif",
    fontSize: "1.35rem",
    fontWeight: 800,
    color: "#38bdf8",
    gap: "0.5rem"
  },
  fraction: {
    display: "inline-flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    verticalAlign: "middle"
  },
  numerator: {
    borderBottom: "1.5px solid rgba(255,255,255,0.35)",
    padding: "0 0.5rem 2px 0.5rem",
    textAlign: "center",
    fontSize: "1.1rem"
  },
  denominator: {
    padding: "2px 0.5rem 0 0.5rem",
    textAlign: "center",
    fontSize: "1.1rem"
  }
};
