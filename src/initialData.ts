/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Member, Payment, BankDeposit, SystemSettings } from './types';

// Standard high-fidelity vector representations of Logo, Founder, and Signature
// Stored as base64 or inline-renderable SVGs for seamless operation and customization.

export const DEFAULT_LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <!-- Circular Green Background -->
  <circle cx="200" cy="200" r="190" fill="%23012111" stroke="%23d4af37" stroke-width="8" />
  <circle cx="200" cy="200" r="175" fill="none" stroke="%23ffffff" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.4" />

  <!-- Left & Right Stars on border -->
  <polygon points="25,200 28,206 35,207 30,212 31,219 25,215 19,219 20,212 15,207 22,206" fill="%23d4af37" />
  <polygon points="375,200 378,206 385,207 380,212 381,219 375,215 369,219 370,212 365,207 372,206" fill="%23d4af37" />

  <!-- Crescent & Star at Top -->
  <path d="M 182,32 A 28,28 0 1,0 222,72 A 23,23 0 1,1 182,32 Z" fill="%23d4af37" />
  <polygon points="212,41 214,48 221,49 216,54 217,61 212,57 207,61 208,54 203,49 210,48" fill="%23ffffff" />

  <!-- Arabic Calligraphy "البركة" -->
  <text x="200" y="105" font-family="'Times New Roman', Amiri, Georgia, serif" font-size="28" font-style="italic" font-weight="900" fill="%23ffffff" text-anchor="middle" letter-spacing="1">البركة</text>

  <!-- Modern Green Skyscrapers on Right -->
  <rect x="220" y="80" width="22" height="120" fill="%23043820" stroke="%23059669" stroke-width="1" opacity="0.8" />
  <rect x="245" y="100" width="22" height="100" fill="%23022c19" stroke="%23059669" stroke-width="1" opacity="0.8" />
  <rect x="270" y="120" width="22" height="80" fill="%23011c10" stroke="%23059669" stroke-width="1" opacity="0.8" />
  <!-- Windows on Skyscrapers -->
  <line x1="231" y1="90" x2="231" y2="190" stroke="%23ffffff" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.4" />
  <line x1="256" y1="110" x2="256" y2="190" stroke="%23ffffff" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.4" />
  <line x1="281" y1="130" x2="281" y2="190" stroke="%23ffffff" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.4" />

  <!-- Lush Green Tree on Left -->
  <path d="M 130,180 Q 95,140 130,110 Q 165,140 130,180 Z" fill="%2315803d" />
  <path d="M 145,170 Q 120,145 145,120 Q 170,145 145,170 Z" fill="%2322c55e" />
  <rect x="127" y="165" width="6" height="35" fill="%2378350f" />
  <rect x="142" y="160" width="5" height="30" fill="%2378350f" />

  <!-- White House with Emerald Roof in Center -->
  <polygon points="140,195 185,150 230,195" fill="%23047857" stroke="%23d4af37" stroke-width="2" />
  <rect x="150" y="195" width="70" height="40" fill="%23ffffff" stroke="%23047857" stroke-width="2" />
  <rect x="178" y="210" width="14" height="25" fill="%2378350f" /> <!-- Door -->
  <circle cx="185" cy="222" r="1.5" fill="%23ffffff" />
  <rect x="158" y="205" width="12" height="12" fill="%2393c5fd" stroke="%23047857" /> <!-- Left Window -->
  <rect x="200" y="205" width="12" height="12" fill="%2393c5fd" stroke="%23047857" /> <!-- Right Window -->

  <!-- Green Rolling Hills Landscapes at bottom of house -->
  <path d="M 40,240 Q 200,195 360,240 L 360,280 Q 200,230 40,280 Z" fill="%23044b24" />
  <path d="M 30,255 Q 200,210 370,255 L 370,310 Q 200,260 30,310 Z" fill="%23022c15" />

  <!-- Curved White Corporate Banner for "আল-বারাকা" -->
  <path d="M 50,250 Q 200,225 350,250 L 340,300 Q 200,275 60,300 Z" fill="%23ffffff" stroke="%23d4af37" stroke-width="3" />
  <text x="200" y="286" font-family="'Siyam Rupali', 'SolaimanLipi', Arial, sans-serif" font-size="34" font-weight="900" fill="%23022c15" text-anchor="middle">আল-বারাকা</text>

  <!-- Organization Type subtitle "―  ভূমি প্রকল্প  ―" -->
  <text x="200" y="324" font-family="'Siyam Rupali', 'SolaimanLipi', Arial, sans-serif" font-size="18" font-weight="extrabold" fill="%23f59e0b" text-anchor="middle">―  ভূমি প্রকল্প  ―</text>

  <!-- Slogan "একমাসে সঞ্চয়, একমাসে ক্রয়" -->
  <text x="200" y="344" font-family="'Siyam Rupali', 'SolaimanLipi', Arial, sans-serif" font-size="11.5" font-weight="bold" fill="%23ffffff" text-anchor="middle">একমাসে সঞ্চয়, একমাসে ক্রয়</text>

  <!-- Handshake & Laurel Wreaths at the Bottom Center -->
  <g transform="translate(180,350) scale(0.4)" stroke="%23d4af37" stroke-width="4" fill="none" opacity="0.9">
    <!-- Handshake Drawing -->
    <path d="M 20,25 Q 30,5 50,25 T 80,25" />
    <path d="M 80,25 Q 70,45 50,25 T 20,25" />
    <path d="M 35,25 L 65,25 M 45,15 L 45,35 M 55,15 L 55,35" stroke-width="2" opacity="0.6" />
  </g>
  <!-- Laurel Leaf Accents Left & Right of Handshake -->
  <path d="M 155,365 Q 165,355 175,362" stroke="%23d4af37" stroke-width="1.5" fill="none" />
  <path d="M 245,365 Q 235,355 225,362" stroke="%23d4af37" stroke-width="1.5" fill="none" />

  <!-- Core Values Footer Circle -->
  <text x="200" y="380" font-family="'Siyam Rupali', 'SolaimanLipi', Arial, sans-serif" font-size="9" font-weight="bold" fill="%23d4af37" text-anchor="middle" letter-spacing="1">সততা  |  স্বচ্ছতা  |  আস্থা  |  নিশ্চয়তা</text>
</svg>`;

export const DEFAULT_FOUNDER_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400">
  <defs>
    <linearGradient id="suitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%231a2a6c" />
      <stop offset="100%" stop-color="%232753a7" />
    </linearGradient>
    <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="%23ffdbac" />
      <stop offset="100%" stop-color="%23f1c27d" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="300" height="400" fill="%23111827" />
  <circle cx="150" cy="140" r="100" fill="%231f2937" stroke="%23d4af37" stroke-width="2" />
  
  <!-- Body/Suit -->
  <path d="M 50,340 C 50,300 80,260 110,250 L 190,250 C 220,260 250,300 250,340 L 250,400 L 50,400 Z" fill="url(%23suitGrad)" />
  
  <!-- White Shirt -->
  <polygon points="125,250 175,250 150,290" fill="%23ffffff" />
  
  <!-- Striped Tie -->
  <polygon points="142,280 158,280 162,380 150,400 138,380" fill="%231d4ed8" stroke="%23ffffff" stroke-width="1" />
  <line x1="142" y1="290" x2="158" y2="310" stroke="%23ffffff" stroke-width="3" />
  <line x1="142" y1="310" x2="158" y2="330" stroke="%23ffffff" stroke-width="3" />
  <line x1="142" y1="330" x2="158" y2="350" stroke="%23ffffff" stroke-width="3" />
  <line x1="142" y1="350" x2="158" y2="370" stroke="%23ffffff" stroke-width="3" />
  <line x1="142" y1="370" x2="158" y2="390" stroke="%23ffffff" stroke-width="3" />
  
  <!-- Suit Lapels -->
  <polygon points="110,250 135,310 120,315" fill="%23111827" />
  <polygon points="190,250 165,310 180,315" fill="%23111827" />
  
  <!-- Neck -->
  <rect x="135" y="210" width="30" height="50" fill="url(%23skinGrad)" />
  
  <!-- Head & Ears -->
  <circle cx="115" cy="160" r="12" fill="url(%23skinGrad)" />
  <circle cx="185" cy="160" r="12" fill="url(%23skinGrad)" />
  <path d="M 115,160 C 115,100 185,100 185,160 C 185,210 115,210 115,160 Z" fill="url(%23skinGrad)" />
  
  <!-- Hair (Black, Short, Well Groomed) -->
  <path d="M 113,145 C 113,110 187,110 187,145 C 180,125 120,125 113,145 Z" fill="%231a1a1a" />
  <path d="M 113,140 Q 150,110 187,135 L 180,115 Q 150,105 120,115 Z" fill="%230c0c0c" />
  
  <!-- Beard & Mustache (Black, Trimmed) -->
  <path d="M 117,165 C 117,215 183,215 183,165 C 183,185 180,215 150,225 C 120,215 117,185 117,165 Z" fill="%231c1c1c" />
  <path d="M 135,185 Q 150,180 165,185 Q 150,195 135,185 Z" fill="%23121212" /> <!-- Mustache -->
  
  <!-- Eyes & Eyebrows -->
  <rect x="126" y="148" width="14" height="4" fill="%23121212" rx="2" />
  <rect x="160" y="148" width="14" height="4" fill="%23121212" rx="2" />
  <circle cx="133" cy="157" r="4.5" fill="%23ffffff" />
  <circle cx="167" cy="157" r="4.5" fill="%23ffffff" />
  <circle cx="133" cy="157" r="2.5" fill="%234a3728" />
  <circle cx="167" cy="157" r="2.5" fill="%234a3728" />
  <circle cx="134" cy="156" r="1" fill="%23ffffff" />
  <circle cx="168" cy="156" r="1" fill="%23ffffff" />
  
  <!-- Glasses (Black Frames, Professional) -->
  <rect x="122" y="151" width="22" height="13" fill="none" stroke="%23000000" stroke-width="2.5" rx="3" />
  <rect x="156" y="151" width="22" height="13" fill="none" stroke="%23000000" stroke-width="2.5" rx="3" />
  <line x1="144" y1="157" x2="156" y2="157" stroke="%23000000" stroke-width="3" />
  <line x1="117" y1="156" x2="122" y2="156" stroke="%23000000" stroke-width="2" />
  <line x1="178" y1="156" x2="183" y2="156" stroke="%23000000" stroke-width="2" />

  <!-- Nose & Mouth -->
  <path d="M 147,165 Q 150,178 153,165" fill="none" stroke="%23d09a5c" stroke-width="2.5" stroke-linecap="round" />
  <path d="M 142,192 Q 150,198 158,192" fill="none" stroke="%23ffffff" stroke-width="1.5" />
</svg>`;

export const DEFAULT_SIGNATURE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">
  <path d="M 20,60 C 40,30 45,20 50,45 C 55,70 65,80 70,55 C 75,30 80,40 85,50 C 90,60 100,65 110,45 C 120,25 125,75 130,60 C 135,45 145,40 155,50 L 175,55 M 35,50 L 55,25 M 65,55 L 140,55 C 160,55 180,65 160,70 C 140,75 80,75 90,72" fill="none" stroke="%23000000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;

export const INITIAL_MEMBERS_RAW = [
  { sNo: 1, name: "প্রকৌশলী মোঃ তানভীন আহমেদ টুটুল", mobile: "01672965561" },
  { sNo: 2, name: "মোঃ রুমান", mobile: "01735449806" },
  { sNo: 3, name: "মোঃ মাহমুদুল হক (সোহেল)", mobile: "0172284662" },
  { sNo: 4, name: "প্রকৌশলী মোঃ মাহমুদুল হাসান (মাসুম)", mobile: "01710335567" },
  { sNo: 5, name: "রাকিবুল হাসান (শিপন)", mobile: "01911919786" },
  { sNo: 6, name: "মোঃ আরমান হোসেন", mobile: "01701633900" },
  { sNo: 7, name: "জাকির হোসেন তালুকদার", mobile: "01753477371" },
  { sNo: 8, name: "প্রকৌশলী খন্দকার মাহবুবুল ইসলাম (রুবেল)", mobile: "01740062064" },
  { sNo: 9, name: "প্রকৌশলী আব্দুল্লাহ আল-আমিন", mobile: "01675889289" },
  { sNo: 10, name: "আরাফাত মিয়া", mobile: "+6583538114" },
  { sNo: 11, name: "প্রকৌশলী নাজমুল হুদা", mobile: "01736111176" },
  { sNo: 12, name: "সানি", mobile: "01316043100" },
  { sNo: 13, name: "তৌফাইল হোসেন", mobile: "01711482922" },
  { sNo: 14, name: "প্রকৌশলী এমামুল", mobile: "01309002170" },
  { sNo: 15, name: "আলআমিন", mobile: "01768731721" },
  { sNo: 16, name: "ফিরোজ আহমেদ", mobile: "01719370435" },
  { sNo: 17, name: "মোহাম্মদ আসরাফুল ইসলাম", mobile: "01719072785" },
  { sNo: 18, name: "মোঃ মাহবুব আলম (নাজমুল)", mobile: "01911169184" },
  { sNo: 19, name: "সামি", mobile: "01905841894" },
  { sNo: 20, name: "মোঃ আব্দুল কালাম আজাদ", mobile: "01724694195" },
  { sNo: 21, name: "আব্দুল্লাহ আল মামুন (শিবলু)", mobile: "01677169099" },
  { sNo: 22, name: "শাহীন ভাই", mobile: "01758293694" },
  { sNo: 23, name: "তাজউদ্দিন ফকির", mobile: "01975792592" },
  { sNo: 24, name: "পারভেজ", mobile: "01761115117" },
  { sNo: 25, name: "মোমেন", mobile: "01770449090" },
  { sNo: 26, name: "প্রকৌশলী রুকন", mobile: "01716661744" },
  { sNo: 27, name: "আমিনুল", mobile: "01783812285" },
  { sNo: 28, name: "রাকিবুল ভাই", mobile: "01793351833" },
  { sNo: 29, name: "শামীম", mobile: "01782213445" },
  { sNo: 30, name: "প্রকৌশলী ওমর ফারুক", mobile: "01642556819" }
];

export const getInitialMembers = (): Member[] => {
  return INITIAL_MEMBERS_RAW.map((m) => {
    const paddedId = String(m.sNo).padStart(2, '0');
    return {
      memberId: `AB-${paddedId}`,
      name: m.name,
      fatherName: "মোঃ রহমান আলী",
      motherName: "মোসাম্মৎ আমেনা খাতুন",
      mobile: m.mobile,
      whatsapp: m.mobile.startsWith('+') ? m.mobile : `+88${m.mobile}`,
      nid: `461829${m.sNo}03192`,
      birthDate: "1990-01-01",
      address: "ঢাকা, বাংলাদেশ",
      profession: m.name.includes("প্রকৌশলী") ? "প্রকৌশলী (Engineer)" : "ব্যবসা (Business)",
      joiningDate: "2026-01-01",
      nominee: "মোসাম্মৎ সালমা বেগম",
      nomineeMobile: m.mobile,
      photo: DEFAULT_FOUNDER_SVG,
      status: 'Active',
      remarks: "প্রতিষ্ঠাতা সদস্য"
    };
  });
};

export const getInitialPayments = (): Payment[] => {
  const months = ["January", "February", "March", "April", "May", "June"];
  const payments: Payment[] = [];
  let receiptCounter = 1;

  // Let's create registration fee payments for all 30 members to give us an initial pool of money
  INITIAL_MEMBERS_RAW.forEach((m, idx) => {
    const paddedId = String(m.sNo).padStart(2, '0');
    const memberId = `AB-${paddedId}`;
    
    // Registration Fee for everyone
    payments.push({
      receiptNo: `AB-2026-${String(receiptCounter++).padStart(4, '0')}`,
      memberId,
      memberName: m.name,
      month: "January",
      year: 2026,
      paymentType: "Registration Fee",
      amount: 1000,
      entryDate: "2026-01-05",
      remarks: "রেজিস্ট্রেশন ফি পরিশোধ"
    });

    // Add some monthly deposits for active months to make reports live and beautiful!
    if (idx < 20) {
      // Members 1 to 20 paid Jan, Feb, Mar, Apr, May
      months.forEach((month, mIdx) => {
        payments.push({
          receiptNo: `AB-2026-${String(receiptCounter++).padStart(4, '0')}`,
          memberId,
          memberName: m.name,
          month,
          year: 2026,
          paymentType: "Monthly Deposit",
          amount: 2000,
          entryDate: `2026-0${mIdx + 1}-10`,
          remarks: `${month} মাসের মাসিক সঞ্চয়`
        });
      });
    } else {
      // Members 21 to 30 paid only Jan, Feb (they are currently due!)
      ["January", "February"].forEach((month, mIdx) => {
        payments.push({
          receiptNo: `AB-2026-${String(receiptCounter++).padStart(4, '0')}`,
          memberId,
          memberName: m.name,
          month,
          year: 2026,
          paymentType: "Monthly Deposit",
          amount: 2000,
          entryDate: `2026-0${mIdx + 1}-10`,
          remarks: `${month} মাসের মাসিক সঞ্চয়`
        });
      });
    }
    
    // Give some people meeting fees & fines
    if (idx % 5 === 0) {
      payments.push({
        receiptNo: `AB-2026-${String(receiptCounter++).padStart(4, '0')}`,
        memberId,
        memberName: m.name,
        month: "March",
        year: 2026,
        paymentType: "Meeting Fee",
        amount: 100,
        entryDate: "2026-03-15",
        remarks: "সাধারণ সভা ফি"
      });
    }
    if (idx % 7 === 0) {
      payments.push({
        receiptNo: `AB-2026-${String(receiptCounter++).padStart(4, '0')}`,
        memberId,
        memberName: m.name,
        month: "April",
        year: 2026,
        paymentType: "Fine",
        amount: 50,
        entryDate: "2026-04-20",
        remarks: "বিলম্ব জরিমানা"
      });
    }
  });

  return payments;
};

export const getInitialBankDeposits = (): BankDeposit[] => {
  return [
    {
      id: "BD-0001",
      date: "2026-01-20",
      bankName: "জনতা ব্যাংক পিএলসি",
      branch: "ময়মনসিংহ শাখা",
      amount: 45000,
      slipNumber: "SL-92817",
      reference: "ব্যাংক জমা - জানুয়ারি সঞ্চয়",
      remarks: "মাসিক সভার সিদ্ধান্ত মোতাবেক জমা"
    },
    {
      id: "BD-0002",
      date: "2026-03-10",
      bankName: "জনতা ব্যাংক পিএলসি",
      branch: "ময়মনসিংহ শাখা",
      amount: 60000,
      slipNumber: "SL-94012",
      reference: "ব্যাংক জমা - ফেব্রুয়ারি ও মার্চ",
      remarks: "সাধারণ তহবিল স্থানান্তর"
    },
    {
      id: "BD-0003",
      date: "2026-05-15",
      bankName: "জনতা ব্যাংক পিএলসি",
      branch: "ময়মনসিংহ শাখা",
      amount: 80000,
      slipNumber: "SL-96120",
      reference: "ব্যাংক জমা - এপ্রিল ও মে",
      remarks: "সঞ্চয় তহবিল স্থানান্তর"
    }
  ];
};

export const DEFAULT_SETTINGS: SystemSettings = {
  monthlyAmount: 2000,
  registrationFee: 1000,
  meetingFee: 100,
  fine: 50,
  orgName: "আল-বারাকা ভূমি প্রকল্প",
  orgSlogan: "একমাসে সঞ্চয়, একমাসে ক্রয়",
  orgMobile: "01672965561",
  orgEmail: "albarakaland@gmail.com",
  orgAddress: "মিরপুর, ঢাকা, বাংলাদেশ",
  founderName: "প্রকৌশলী মোঃ তানভীন আহমেদ টুটুল",
  founderMobile: "01672965561",
  founderDesignation: "প্রতিষ্ঠাতা ও স্বপ্নদ্রষ্টা",
  logo: DEFAULT_LOGO_SVG,
  founderPhoto: DEFAULT_FOUNDER_SVG,
  signature: DEFAULT_SIGNATURE_SVG,
  firebaseApiKey: "",
  firebaseAuthDomain: "",
  firebaseProjectId: "",
  firebaseStorageBucket: "",
  firebaseMessagingSenderId: "",
  firebaseAppId: "",
  firebaseSyncEnabled: false,
  adminPin: "1234"
};
