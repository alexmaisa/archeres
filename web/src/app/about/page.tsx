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
          title: "Math Estimators Engine",
          desc: "Calculate precise sample sizes using established formulas (Slovin, Cochran, Lemeshow, Yamane, Daniel) with strict float precision ceiling rounding."
        },
        {
          number: "02",
          title: "Operational Variables",
          desc: "Define your study's conceptual variables into Stevens' taxonomy scale levels (Nominal, Ordinal, Interval, Ratio) to receive smart statistical test advice."
        },
        {
          number: "03",
          title: "Structured Draft Compilation",
          desc: "Convert your operational variables and sample calculations into a clean, peer-reviewed standard Chapter III methodology draft in Indonesian and English."
        }
      ],
      featuresTitle: "Core Platform Pillars",
      featuresList: [
        {
          icon: "key",
          title: "Zero-Knowledge E2EE",
          desc: "Your academic profile, research drafts, and variables are fully secured using AES-GCM 256 End-to-End Encryption (E2EE) locally on your device before transmission."
        },
        {
          icon: "shield",
          title: "Privacy & Anti-Spam Shield",
          desc: "Protecting users with self-hosted cryptographic SVG math captchas during registration to deter malicious spam, alongside decoupled privacy-preserving activity logs."
        },
        {
          icon: "helix",
          title: "High-Precision Calculus",
          desc: "No more math errors. The backend Go parser handles formulas with high precision, giving peer-reviewed mathematical certainty to thesis boards."
        },
        {
          icon: "book",
          title: "Scholarly Pedagogy Module",
          desc: "Learn methodology concepts as you compile drafts. The app offers Stevens' scale definitions and dynamic formula guidance on every screen."
        }
      ],
      mathSectionTitle: "Mathematical Estimator Equations",
      mathSectionDesc: "Archeres performs real-time sampling size estimations using rigorous math models verified by senior academic examiners.",
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
        { title: "Part D: Statistical Hypothesis Strategy", desc: "Outlines the specific parametric or non-parametric test schedules chosen to verify the study's claims." }
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
          title: "Estimasi Ukuran Sampel yang Valid",
          desc: "Menentukan ukuran sampel minimal secara presisi menggunakan kalkulasi rumus ilmiah populer seperti Slovin, Lemeshow, Cochran, Yamane, dan Daniel dengan pembulatan ke atas secara otomatis."
        },
        {
          number: "02",
          title: "Operasionalisasi Variabel Penelitian",
          desc: "Memetakan variabel penelitian Anda ke dalam skala pengukuran Stevens (Nominal, Ordinal, Interval, atau Rasio) untuk mendapatkan rekomendasi uji statistik yang sesuai dengan konteks riset."
        },
        {
          number: "03",
          title: "Penyusunan Draf Metodologi Penelitian",
          desc: "Mengompilasi hasil kalkulasi sampel dan operasionalisasi variabel menjadi draf bab metodologi penelitian (BAB III) berstandar akademik dalam Bahasa Indonesia dan Inggris secara simultan."
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
          icon: "shield",
          title: "Sistem Anti-Spam & Privasi",
          desc: "Melindungi platform menggunakan verifikasi captcha matematika SVG mandiri terenkripsi pada saat pendaftaran, serta telemetri sesi terpisah tanpa identitas surel."
        },
        {
          icon: "helix",
          title: "Kalkulasi Matematis Presisi Tinggi",
          desc: "Menghindari risiko kesalahan hitung manual. Mesin komputasi backend Go mengevaluasi rumus dengan pembulatan matematika yang ketat untuk menjamin validitas metodologi di hadapan dewan penguji."
        },
        {
          icon: "book",
          title: "Pusat Edukasi Metodologi Interaktif",
          desc: "Belajar secara aktif saat merancang draf penelitian. Pahami konsep dasar skala pengukuran Stevens, kegunaan setiap rumus sampel, serta konteks akademisnya langsung pada alur kerja Anda."
        }
      ],
      mathSectionTitle: "Formulasi Matematika Ukuran Sampel",
      mathSectionDesc: "Archeres melakukan estimasi ukuran sampel secara real-time menggunakan model matematika rigor yang teruji di hadapan penguji akademik.",
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
        { title: "Bagian D: Rencana Pengujian Hipotesis Statistik", desc: "Menyusun jadwal pengujian hipotesis (parametris/non-parametris) untuk menjawab seluruh rumusan masalah penelitian." }
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
