export interface Club {
  id: number;
  name: string;
  tier: number;
  baseOvr: number;
  color: string;
  color2?: string;
  stadium: number; 
  logo?: string;
  fallbackLogo?: string;
  country?: string;
  rep?: number;
  fanBase?: number;
  currentBudget?: number;
  historicContext?: string;
  context?: string;
  startAttendance?: number;
  globalFans?: number;
  academyLevel?: number;
  medicalLevel?: number;
  squadSize?: number;
}

// ============================================================================
// 1. GERMANY (GER) - Liqui Moly Handball-Bundesliga & Lower Leagues
// ============================================================================
export const GERMANY_HANDBALL_CLUBS: Club[] = [
  // Tier 1 (18 Clubs)
  { id: 101, name: "SC Magdeburg", tier: 1, baseOvr: 93, color: "009036", color2: "e30613", stadium: 6600, country: "GER", rep: 94, fanBase: 323333, currentBudget: 11500000 },
  { id: 102, name: "Füchse Berlin", tier: 1, baseOvr: 92, color: "009036", color2: "ffffff", stadium: 9000, country: "GER", rep: 92, fanBase: 280000, currentBudget: 10500000 },
  { id: 103, name: "SG Flensburg-Handewitt", tier: 1, baseOvr: 91, color: "002855", color2: "ffffff", stadium: 6300, country: "GER", rep: 91, fanBase: 263333, currentBudget: 9800000 },
  { id: 104, name: "THW Kiel", tier: 1, baseOvr: 91, color: "ffffff", color2: "000000", stadium: 10285, country: "GER", rep: 93, fanBase: 340000, currentBudget: 11000000 },
  { id: 105, name: "MT Melsungen", tier: 1, baseOvr: 88, color: "e30613", color2: "ffffff", stadium: 4300, country: "GER", rep: 86, fanBase: 163333, currentBudget: 8500000 },
  { id: 106, name: "Rhein-Neckar Löwen", tier: 1, baseOvr: 87, color: "f3d522", color2: "002855", stadium: 13200, country: "GER", rep: 88, fanBase: 240000, currentBudget: 8200000 },
  { id: 107, name: "TSV Hannover-Burgdorf", tier: 1, baseOvr: 86, color: "008a52", color2: "ffffff", stadium: 9900, country: "GER", rep: 84, fanBase: 186667, currentBudget: 6800000 },
  { id: 108, name: "VfL Gummersbach", tier: 1, baseOvr: 85, color: "00599e", color2: "ffffff", stadium: 4132, country: "GER", rep: 85, fanBase: 196667, currentBudget: 6200000 },
  { id: 109, name: "SC DHfK Leipzig", tier: 1, baseOvr: 83, color: "009036", color2: "ffffff", stadium: 12250, country: "GER", rep: 82, fanBase: 173333, currentBudget: 5800000 },
  { id: 110, name: "TBV Lemgo Lippe", tier: 1, baseOvr: 83, color: "0055a4", color2: "ffffff", stadium: 4520, country: "GER", rep: 81, fanBase: 130000, currentBudget: 5200000 },
  { id: 111, name: "Frisch Auf Göppingen", tier: 1, baseOvr: 82, color: "009036", color2: "ffffff", stadium: 4750, country: "GER", rep: 80, fanBase: 123333, currentBudget: 4900000 },
  { id: 112, name: "HC Erlangen", tier: 1, baseOvr: 81, color: "e30613", color2: "002855", stadium: 8308, country: "GER", rep: 79, fanBase: 116667, currentBudget: 4600000 },
  { id: 113, name: "HSG Wetzlar", tier: 1, baseOvr: 80, color: "009036", color2: "ffffff", stadium: 4412, country: "GER", rep: 78, fanBase: 106667, currentBudget: 4300000 },
  { id: 114, name: "HSV Hamburg", tier: 1, baseOvr: 80, color: "0055a4", color2: "ffffff", stadium: 7000, country: "GER", rep: 81, fanBase: 183333, currentBudget: 4500000 },
  { id: 115, name: "TVB Stuttgart", tier: 1, baseOvr: 79, color: "0055a4", color2: "ffffff", stadium: 6211, country: "GER", rep: 77, fanBase: 103333, currentBudget: 4100000 },
  { id: 116, name: "ThSV Eisenach", tier: 1, baseOvr: 79, color: "0055a4", color2: "ffffff", stadium: 3100, country: "GER", rep: 76, fanBase: 80000, currentBudget: 3800000 },
  { id: 117, name: "1. VfL Potsdam", tier: 1, baseOvr: 78, color: "e30613", color2: "ffffff", stadium: 2050, country: "GER", rep: 74, fanBase: 63333, currentBudget: 3400000 },
  { id: 118, name: "SG BBM Bietigheim", tier: 1, baseOvr: 78, color: "0055a4", color2: "e30613", stadium: 4583, country: "GER", rep: 74, fanBase: 61333, currentBudget: 3300000 },

  // Tier 2 (18 Clubs)
  { id: 119, name: "Bergischer HC", tier: 2, baseOvr: 77, color: "1d4ed8", stadium: 3200, country: "GER", rep: 73, fanBase: 58667, currentBudget: 2800000 },
  { id: 120, name: "HBW Balingen-Weilstetten", tier: 2, baseOvr: 77, color: "b91c1c", stadium: 2350, country: "GER", rep: 72, fanBase: 54000, currentBudget: 2700000 },
  { id: 121, name: "TuS N-Lübbecke", tier: 2, baseOvr: 76, color: "dc2626", stadium: 3250, country: "GER", rep: 71, fanBase: 50667, currentBudget: 2500000 },
  { id: 122, name: "HSG Nordhorn-Lingen", tier: 2, baseOvr: 75, color: "ef4444", stadium: 4100, country: "GER", rep: 70, fanBase: 47333, currentBudget: 2300000 },
  { id: 123, name: "GWD Minden", tier: 2, baseOvr: 75, color: "16a34a", stadium: 4059, country: "GER", rep: 70, fanBase: 48000, currentBudget: 2400000 },
  { id: 124, name: "HC Elbflorenz Dresden", tier: 2, baseOvr: 74, color: "f59e0b", stadium: 2603, country: "GER", rep: 69, fanBase: 45333, currentBudget: 2200000 },
  { id: 125, name: "ASV Hamm-Westfalen", tier: 2, baseOvr: 74, color: "b91c1c", stadium: 2650, country: "GER", rep: 69, fanBase: 43333, currentBudget: 2150000 },
  { id: 126, name: "HSC 2000 Coburg", tier: 2, baseOvr: 73, color: "facc15", stadium: 3530, country: "GER", rep: 68, fanBase: 41333, currentBudget: 2000000 },
  { id: 127, name: "Dessau-Roßlauer HV", tier: 2, baseOvr: 73, color: "0284c7", stadium: 3300, country: "GER", rep: 67, fanBase: 38667, currentBudget: 1900000 },
  { id: 128, name: "VfL Eintracht Hagen", tier: 2, baseOvr: 72, color: "eab308", stadium: 3145, country: "GER", rep: 66, fanBase: 36000, currentBudget: 1800000 },
  { id: 129, name: "Die Eulen Ludwigshafen", tier: 2, baseOvr: 72, color: "dc2626", stadium: 2350, country: "GER", rep: 66, fanBase: 35333, currentBudget: 1750000 },
  { id: 130, name: "TV Großwallstadt", tier: 2, baseOvr: 72, color: "1e40af", stadium: 4200, country: "GER", rep: 68, fanBase: 40667, currentBudget: 1850000 },
  { id: 131, name: "TV Hüttenberg", tier: 2, baseOvr: 71, color: "2563eb", stadium: 1450, country: "GER", rep: 65, fanBase: 32667, currentBudget: 1650000 },
  { id: 132, name: "TSV Bayer Dormagen", tier: 2, baseOvr: 71, color: "0ea5e9", stadium: 2031, country: "GER", rep: 65, fanBase: 31333, currentBudget: 1600000 },
  { id: 133, name: "TUSEM Essen", tier: 2, baseOvr: 70, color: "dc2626", stadium: 2578, country: "GER", rep: 64, fanBase: 30000, currentBudget: 1550000 },
  { id: 134, name: "TuS Ferndorf", tier: 2, baseOvr: 70, color: "ef4444", stadium: 1400, country: "GER", rep: 63, fanBase: 26000, currentBudget: 1450000 },
  { id: 135, name: "HSG Konstanz", tier: 2, baseOvr: 69, color: "facc15", stadium: 1900, country: "GER", rep: 62, fanBase: 24000, currentBudget: 1400000 },
  { id: 136, name: "HSG Krefeld Niederrhein", tier: 2, baseOvr: 69, color: "eab308", stadium: 2100, country: "GER", rep: 62, fanBase: 22667, currentBudget: 1350000 },

  // TIER 3 (3. Liga) - 14 Clubs
  { id: 137, name: "HC Empor Rostock", tier: 3, baseOvr: 66, color: "0284c7", stadium: 1800, country: "GER", rep: 60, fanBase: 23333, currentBudget: 950000 },
  { id: 138, name: "Eintracht Hildesheim", tier: 3, baseOvr: 65, color: "b91c1c", stadium: 2200, country: "GER", rep: 59, fanBase: 20667, currentBudget: 850000 },
  { id: 139, name: "SG Pforzheim/Eutingen", tier: 3, baseOvr: 65, color: "facc15", stadium: 1200, country: "GER", rep: 58, fanBase: 18667, currentBudget: 800000 },
  { id: 140, name: "HG Saarlouis", tier: 3, baseOvr: 64, color: "15803d", stadium: 1500, country: "GER", rep: 57, fanBase: 16667, currentBudget: 750000 },
  { id: 141, name: "TV Emsdetten", tier: 3, baseOvr: 64, color: "1d4ed8", stadium: 1900, country: "GER", rep: 57, fanBase: 17333, currentBudget: 780000 },
  { id: 142, name: "EHV Aue", tier: 3, baseOvr: 63, color: "7e22ce", stadium: 1500, country: "GER", rep: 56, fanBase: 15333, currentBudget: 700000 },
  { id: 143, name: "HSG Hanau", tier: 3, baseOvr: 63, color: "dc2626", stadium: 1064, country: "GER", rep: 55, fanBase: 14000, currentBudget: 650000 },
  { id: 144, name: "HG Oftersheim/Schwetzingen", tier: 3, baseOvr: 62, color: "d97706", stadium: 1100, country: "GER", rep: 54, fanBase: 12667, currentBudget: 600000 },
  { id: 145, name: "TV Gelnhausen", tier: 3, baseOvr: 62, color: "7f1d1d", stadium: 900, country: "GER", rep: 54, fanBase: 12000, currentBudget: 550000 },
  { id: 146, name: "DJK Waldbüttelbrunn", tier: 3, baseOvr: 61, color: "1e40af", stadium: 1300, country: "GER", rep: 53, fanBase: 11333, currentBudget: 520000 },
  { id: 147, name: "TuS Vinnhorst", tier: 3, baseOvr: 61, color: "16a34a", stadium: 1442, country: "GER", rep: 52, fanBase: 10000, currentBudget: 490000 },
  { id: 148, name: "MTV Braunschweig", tier: 3, baseOvr: 60, color: "f59e0b", stadium: 1800, country: "GER", rep: 51, fanBase: 9333, currentBudget: 450000 },
  { id: 149, name: "TSV Altenholz", tier: 3, baseOvr: 60, color: "eab308", stadium: 800, country: "GER", rep: 50, fanBase: 8667, currentBudget: 420000 },
  { id: 150, name: "SGSH Dragons", tier: 3, baseOvr: 59, color: "dc2626", stadium: 950, country: "GER", rep: 49, fanBase: 8000, currentBudget: 400000 },

  // TIER 4 (Regionalliga / Oberliga) - 12 Clubs
  { id: 151, name: "TSG Altenhagen-Heepen", tier: 4, baseOvr: 57, color: "2563eb", stadium: 1200, country: "GER", rep: 45, fanBase: 6000, currentBudget: 250000 },
  { id: 152, name: "1. FC Köln", tier: 4, baseOvr: 56, color: "e30613", color2: "ffffff", stadium: 821, country: "GER", rep: 44, fanBase: 5667, currentBudget: 230000, logo: "/assets/logos/club_152.svg", fallbackLogo: "/assets/logos/club_152.svg" },
  { id: 153, name: "HT München", tier: 4, baseOvr: 56, color: "000000", stadium: 800, country: "GER", rep: 44, fanBase: 5467, currentBudget: 220000 },
  { id: 154, name: "SC DHfK Leipzig II", tier: 4, baseOvr: 55, color: "15803d", stadium: 750, country: "GER", rep: 43, fanBase: 5200, currentBudget: 210000 },
  { id: 155, name: "ATSV Habenhausen", tier: 4, baseOvr: 55, color: "16a34a", stadium: 900, country: "GER", rep: 43, fanBase: 5000, currentBudget: 200000 },
  { id: 156, name: "HSG Frankfurt/Main", tier: 4, baseOvr: 54, color: "dc2626", stadium: 850, country: "GER", rep: 42, fanBase: 4667, currentBudget: 190000 },
  { id: 157, name: "HBC Nürnberg", tier: 4, baseOvr: 54, color: "b91c1c", stadium: 700, country: "GER", rep: 41, fanBase: 4333, currentBudget: 180000 },
  { id: 158, name: "BTB Aachen", tier: 4, baseOvr: 53, color: "facc15", stadium: 1100, country: "GER", rep: 40, fanBase: 4000, currentBudget: 170000 },
  { id: 159, name: "SG Mainz-Bretzenheim", tier: 4, baseOvr: 53, color: "1d4ed8", stadium: 600, country: "GER", rep: 40, fanBase: 3867, currentBudget: 160000 },
  { id: 160, name: "OSC Dortmund", tier: 4, baseOvr: 52, color: "facc15", stadium: 650, country: "GER", rep: 39, fanBase: 3667, currentBudget: 150000, logo: "/assets/logos/club_160.svg", fallbackLogo: "/assets/logos/club_160.svg" },
  { id: 161, name: "TSV Bonn rrh", tier: 4, baseOvr: 52, color: "2563eb", stadium: 700, country: "GER", rep: 38, fanBase: 3467, currentBudget: 140000 },
  { id: 162, name: "HSG Freiburg", tier: 4, baseOvr: 51, color: "ea580c", stadium: 550, country: "GER", rep: 37, fanBase: 3200, currentBudget: 130000 },
  { id: 10001, name: "SC Magdeburg Youngsters", tier: 4, baseOvr: 56, color: "009036", color2: "e30613", stadium: 500, country: "GER", rep: 44, fanBase: 4200, currentBudget: 220000 },

  // TIER 5 (Verbandsliga) - 10 Clubs
  { id: 163, name: "Karlsruher SV", tier: 5, baseOvr: 49, color: "0284c7", stadium: 500, country: "GER", rep: 32, fanBase: 2333, currentBudget: 80000 },
  { id: 164, name: "HSG Kassel", tier: 5, baseOvr: 48, color: "dc2626", stadium: 450, country: "GER", rep: 31, fanBase: 2133, currentBudget: 75000 },
  { id: 165, name: "HSG Osnabrück", tier: 5, baseOvr: 48, color: "7e22ce", stadium: 600, country: "GER", rep: 31, fanBase: 2000, currentBudget: 70000 },
  { id: 166, name: "TSF Ludwigsfeld", tier: 5, baseOvr: 47, color: "000000", stadium: 400, country: "GER", rep: 30, fanBase: 1867, currentBudget: 65000 },
  { id: 167, name: "ESV Regensburg", tier: 5, baseOvr: 47, color: "b91c1c", stadium: 450, country: "GER", rep: 29, fanBase: 1733, currentBudget: 60000 },
  { id: 168, name: "MTV Lübeck", tier: 5, baseOvr: 46, color: "15803d", stadium: 550, country: "GER", rep: 28, fanBase: 1600, currentBudget: 55000 },
  { id: 169, name: "DJK Trier", tier: 5, baseOvr: 46, color: "1d4ed8", stadium: 400, country: "GER", rep: 27, fanBase: 1467, currentBudget: 50000 },
  { id: 170, name: "USV Halle", tier: 5, baseOvr: 45, color: "16a34a", stadium: 350, country: "GER", rep: 26, fanBase: 1333, currentBudget: 45000 },
  { id: 171, name: "HSG Wiesbaden", tier: 5, baseOvr: 45, color: "003399", color2: "fbbf24", stadium: 450, country: "GER", rep: 25, fanBase: 1200, currentBudget: 40000, logo: "/assets/logos/club_171.svg", fallbackLogo: "/assets/logos/club_171.svg" },
  { id: 172, name: "SG Chemnitz", tier: 5, baseOvr: 44, color: "38bdf8", stadium: 300, country: "GER", rep: 24, fanBase: 1067, currentBudget: 35000 },

  // TIER 6 (Landesliga) - 11 Clubs (Includes FC Bayern München)
  { id: 173, name: "Tuspo Weende Göttingen", tier: 6, baseOvr: 42, color: "1e40af", stadium: 250, country: "GER", rep: 18, fanBase: 1000, currentBudget: 20000 },
  { id: 174, name: "SC Paderborn 07", tier: 6, baseOvr: 41, color: "004b93", color2: "1f1a17", stadium: 200, country: "GER", rep: 17, fanBase: 1000, currentBudget: 18000, logo: "/assets/logos/club_174.svg", fallbackLogo: "/assets/logos/club_174.svg" },
  { id: 175, name: "LHC Cottbus", tier: 6, baseOvr: 41, color: "ea580c", stadium: 220, country: "GER", rep: 16, fanBase: 1000, currentBudget: 16000 },
  { id: 176, name: "HC Koblenz", tier: 6, baseOvr: 40, color: "b91c1c", stadium: 180, country: "GER", rep: 15, fanBase: 1000, currentBudget: 15000 },
  { id: 177, name: "LTV Wuppertal", tier: 6, baseOvr: 40, color: "2563eb", stadium: 300, country: "GER", rep: 14, fanBase: 1000, currentBudget: 14000 },
  { id: 178, name: "DHK Flensborg", tier: 6, baseOvr: 39, color: "0f172a", stadium: 150, country: "GER", rep: 13, fanBase: 1000, currentBudget: 12000 },
  { id: 179, name: "Zwickauer HC", tier: 6, baseOvr: 39, color: "ef4444", stadium: 250, country: "GER", rep: 12, fanBase: 1000, currentBudget: 11000 },
  { id: 180, name: "HSG Marburg/Cappel", tier: 6, baseOvr: 38, color: "3b82f6", stadium: 200, country: "GER", rep: 11, fanBase: 1000, currentBudget: 10000 },
  { id: 181, name: "SBC Traunstein", tier: 6, baseOvr: 38, color: "dc2626", stadium: 150, country: "GER", rep: 10, fanBase: 1000, currentBudget: 9000 },
  { id: 182, name: "HaSpo Bayreuth", tier: 6, baseOvr: 37, color: "facc15", stadium: 250, country: "GER", rep: 9, fanBase: 1000, currentBudget: 8000 },
  { id: 183, name: "FC Bayern München", tier: 6, baseOvr: 45, color: "dc052d", color2: "ffffff", stadium: 1500, country: "GER", rep: 25, fanBase: 15000, currentBudget: 35000, logo: "/assets/logos/club_183.png", fallbackLogo: "/assets/logos/club_183.png" }
];

// ============================================================================
// 2. DENMARK (DEN) - HTH Herreligaen & 1. Division
// ============================================================================
export const DENMARK_HANDBALL_CLUBS: Club[] = [
  // Tier 1 (14 Clubs)
  { id: 301, name: "Aalborg Håndbold", tier: 1, baseOvr: 93, color: "e30613", color2: "ffffff", stadium: 5020, country: "DEN", rep: 93, fanBase: 240000, currentBudget: 9500000 },
  { id: 302, name: "GOG Håndbold", tier: 1, baseOvr: 89, color: "f3d522", color2: "e30613", stadium: 2265, country: "DEN", rep: 89, fanBase: 166667, currentBudget: 6200000 },
  { id: 303, name: "Bjerringbro-Silkeborg", tier: 1, baseOvr: 86, color: "000000", color2: "ffffff", stadium: 2800, country: "DEN", rep: 85, fanBase: 126667, currentBudget: 4900000 },
  { id: 304, name: "Skjern Håndbold", tier: 1, baseOvr: 85, color: "15803d", color2: "ffffff", stadium: 3264, country: "DEN", rep: 84, fanBase: 123333, currentBudget: 4700000 },
  { id: 305, name: "Fredericia HK", tier: 1, baseOvr: 85, color: "ef4444", color2: "ffffff", stadium: 2500, country: "DEN", rep: 83, fanBase: 110000, currentBudget: 4500000 },
  { id: 306, name: "Mors-Thy Håndbold", tier: 1, baseOvr: 83, color: "2563eb", color2: "ffffff", stadium: 2300, country: "DEN", rep: 80, fanBase: 90000, currentBudget: 3800000 },
  { id: 307, name: "Ribe-Esbjerg HH", tier: 1, baseOvr: 82, color: "1e40af", color2: "ffffff", stadium: 5019, country: "DEN", rep: 79, fanBase: 86667, currentBudget: 3600000 },
  { id: 308, name: "TTH Holstebro", tier: 1, baseOvr: 82, color: "ffffff", color2: "000000", stadium: 3250, country: "DEN", rep: 80, fanBase: 93333, currentBudget: 3700000 },
  { id: 309, name: "SønderjyskE Herrer", tier: 1, baseOvr: 81, color: "38bdf8", color2: "ffffff", stadium: 2200, country: "DEN", rep: 78, fanBase: 80000, currentBudget: 3400000 },
  { id: 310, name: "KIF Kolding", tier: 1, baseOvr: 81, color: "0284c7", color2: "ffffff", stadium: 5000, country: "DEN", rep: 82, fanBase: 113333, currentBudget: 3900000 },
  { id: 311, name: "Skanderborg AGF", tier: 1, baseOvr: 80, color: "16a34a", color2: "ffffff", stadium: 4500, country: "DEN", rep: 77, fanBase: 76667, currentBudget: 3200000 },
  { id: 312, name: "Nordsjælland Håndbold", tier: 1, baseOvr: 79, color: "22c55e", color2: "ffffff", stadium: 5979, country: "DEN", rep: 75, fanBase: 63333, currentBudget: 2900000 },
  { id: 313, name: "TMS Ringsted", tier: 1, baseOvr: 78, color: "047857", color2: "ffffff", stadium: 1600, country: "DEN", rep: 74, fanBase: 54667, currentBudget: 2600000 },
  { id: 314, name: "Grindsted GIF", tier: 1, baseOvr: 77, color: "0369a1", color2: "ffffff", stadium: 1200, country: "DEN", rep: 72, fanBase: 47333, currentBudget: 2300000 },

  // Tier 2 (14 Clubs)
  { id: 315, name: "HØJ Elite", tier: 2, baseOvr: 77, color: "15803d", stadium: 1500, country: "DEN", rep: 73, fanBase: 52000, currentBudget: 2500000 },
  { id: 316, name: "Lemvig-Thyborøn Håndbold", tier: 2, baseOvr: 76, color: "dc2626", stadium: 1400, country: "DEN", rep: 72, fanBase: 46000, currentBudget: 2100000 },
  { id: 317, name: "Skive fH", tier: 2, baseOvr: 75, color: "2563eb", stadium: 2200, country: "DEN", rep: 71, fanBase: 42667, currentBudget: 1900000 },
  { id: 318, name: "Aarhus HC", tier: 2, baseOvr: 74, color: "f97316", stadium: 1800, country: "DEN", rep: 70, fanBase: 39333, currentBudget: 1750000 },
  { id: 319, name: "HC Midtjylland", tier: 2, baseOvr: 74, color: "1d4ed8", stadium: 2500, country: "DEN", rep: 69, fanBase: 37333, currentBudget: 1650000 },
  { id: 320, name: "HC Odense", tier: 2, baseOvr: 73, color: "ef4444", stadium: 2300, country: "DEN", rep: 69, fanBase: 38667, currentBudget: 1700000 },
  { id: 321, name: "Team Sydhavsøerne", tier: 2, baseOvr: 73, color: "dc2626", stadium: 1400, country: "DEN", rep: 68, fanBase: 34000, currentBudget: 1550000 },
  { id: 322, name: "FfI Håndbold", tier: 2, baseOvr: 72, color: "18181b", stadium: 1500, country: "DEN", rep: 67, fanBase: 31333, currentBudget: 1450000 },
  { id: 323, name: "Rækker Mølle Håndbold", tier: 2, baseOvr: 71, color: "9333ea", stadium: 1100, country: "DEN", rep: 66, fanBase: 28000, currentBudget: 1350000 },
  { id: 324, name: "Faaborg ØH", tier: 2, baseOvr: 71, color: "0284c7", stadium: 1200, country: "DEN", rep: 65, fanBase: 26000, currentBudget: 1300000 },
  { id: 325, name: "FIF Håndbold", tier: 2, baseOvr: 70, color: "b91c1c", stadium: 1400, country: "DEN", rep: 66, fanBase: 30667, currentBudget: 1400000 },
  { id: 326, name: "Roskilde Håndbold", tier: 2, baseOvr: 70, color: "ea580c", stadium: 1500, country: "DEN", rep: 64, fanBase: 25333, currentBudget: 1250000 },
  { id: 327, name: "Ajax København", tier: 2, baseOvr: 69, color: "1e40af", stadium: 1200, country: "DEN", rep: 65, fanBase: 27333, currentBudget: 1280000 },
  { id: 328, name: "Otterup HK", tier: 2, baseOvr: 68, color: "2563eb", stadium: 1100, country: "DEN", rep: 63, fanBase: 22667, currentBudget: 1150000 },

  // TIER 3 (2. Division) - 10 Clubs
  { id: 329, name: "Slagelse HK", tier: 3, baseOvr: 66, color: "dc2626", stadium: 1003, country: "DEN", rep: 60, fanBase: 20667, currentBudget: 900000 },
  { id: 330, name: "Helsingør Håndbold", tier: 3, baseOvr: 66, color: "1d4ed8", stadium: 900, country: "DEN", rep: 59, fanBase: 18667, currentBudget: 850000 },
  { id: 331, name: "Vejle HK", tier: 3, baseOvr: 65, color: "16a34a", stadium: 1100, country: "DEN", rep: 58, fanBase: 17333, currentBudget: 780000 },
  { id: 332, name: "Bjerringbro-Silkeborg II", tier: 3, baseOvr: 65, color: "000000", stadium: 500, country: "DEN", rep: 57, fanBase: 16000, currentBudget: 720000 },
  { id: 333, name: "Køge Håndbold", tier: 3, baseOvr: 64, color: "2563eb", stadium: 800, country: "DEN", rep: 56, fanBase: 14667, currentBudget: 650000 },
  { id: 334, name: "Horsens HK", tier: 3, baseOvr: 64, color: "facc15", stadium: 950, country: "DEN", rep: 55, fanBase: 13333, currentBudget: 600000 },
  { id: 335, name: "Randers HH", tier: 3, baseOvr: 63, color: "0284c7", stadium: 850, country: "DEN", rep: 54, fanBase: 12667, currentBudget: 550000 },
  { id: 336, name: "Næstved IF", tier: 3, baseOvr: 63, color: "eab308", stadium: 700, country: "DEN", rep: 53, fanBase: 11667, currentBudget: 500000 },
  { id: 337, name: "Hillerød HK", tier: 3, baseOvr: 62, color: "ea580c", stadium: 600, country: "DEN", rep: 52, fanBase: 10667, currentBudget: 460000 },
  { id: 338, name: "Svendborg HK", tier: 3, baseOvr: 61, color: "1e40af", stadium: 750, country: "DEN", rep: 51, fanBase: 10000, currentBudget: 420000 },

  // TIER 4 (3. Division) - 10 Clubs
  { id: 339, name: "Hjørring Håndbold", tier: 4, baseOvr: 59, color: "2563eb", stadium: 600, country: "DEN", rep: 46, fanBase: 6333, currentBudget: 260000 },
  { id: 340, name: "Nykøbing Falster HK", tier: 4, baseOvr: 58, color: "dc2626", stadium: 550, country: "DEN", rep: 45, fanBase: 6000, currentBudget: 240000 },
  { id: 341, name: "Thisted IK", tier: 4, baseOvr: 58, color: "15803d", stadium: 500, country: "DEN", rep: 44, fanBase: 5667, currentBudget: 220000 },
  { id: 342, name: "Viborg HK", tier: 4, baseOvr: 57, color: "16a34a", stadium: 650, country: "DEN", rep: 43, fanBase: 5333, currentBudget: 200000 },
  { id: 343, name: "Hobro IK", tier: 4, baseOvr: 57, color: "facc15", stadium: 450, country: "DEN", rep: 42, fanBase: 5000, currentBudget: 190000 },
  { id: 344, name: "Skanderborg AGF II", tier: 4, baseOvr: 56, color: "16a34a", stadium: 300, country: "DEN", rep: 41, fanBase: 4667, currentBudget: 170000 },
  { id: 345, name: "Fredericia HK II", tier: 4, baseOvr: 56, color: "ef4444", stadium: 300, country: "DEN", rep: 40, fanBase: 4333, currentBudget: 160000 },
  { id: 346, name: "Taastrup IK", tier: 4, baseOvr: 55, color: "0284c7", stadium: 400, country: "DEN", rep: 39, fanBase: 4000, currentBudget: 150000 },
  { id: 347, name: "Glostrup HB", tier: 4, baseOvr: 55, color: "b91c1c", stadium: 350, country: "DEN", rep: 38, fanBase: 3667, currentBudget: 140000 },
  { id: 348, name: "Brøndby HK", tier: 4, baseOvr: 54, color: "facc15", stadium: 500, country: "DEN", rep: 37, fanBase: 3467, currentBudget: 130000 },

  // TIER 5 (Kvalifikationsrækken) - 10 Clubs
  { id: 349, name: "Middelfart HK", tier: 5, baseOvr: 52, color: "1d4ed8", stadium: 350, country: "DEN", rep: 31, fanBase: 2333, currentBudget: 85000 },
  { id: 350, name: "Varde HK", tier: 5, baseOvr: 51, color: "15803d", stadium: 300, country: "DEN", rep: 30, fanBase: 2133, currentBudget: 80000 },
  { id: 351, name: "Holbæk HK", tier: 5, baseOvr: 51, color: "dc2626", stadium: 400, country: "DEN", rep: 29, fanBase: 2000, currentBudget: 75000 },
  { id: 352, name: "Korsør HK", tier: 5, baseOvr: 50, color: "2563eb", stadium: 250, country: "DEN", rep: 28, fanBase: 1867, currentBudget: 70000 },
  { id: 353, name: "Aabenraa HK", tier: 5, baseOvr: 50, color: "ffffff", stadium: 300, country: "DEN", rep: 27, fanBase: 1667, currentBudget: 65000 },
  { id: 354, name: "Skagen HK", tier: 5, baseOvr: 49, color: "0284c7", stadium: 200, country: "DEN", rep: 26, fanBase: 1467, currentBudget: 60000 },
  { id: 355, name: "Ringkøbing Håndbold", tier: 5, baseOvr: 49, color: "16a34a", stadium: 250, country: "DEN", rep: 25, fanBase: 1333, currentBudget: 55000 },
  { id: 356, name: "Struer FH", tier: 5, baseOvr: 48, color: "1e40af", stadium: 200, country: "DEN", rep: 24, fanBase: 1200, currentBudget: 50000 },
  { id: 357, name: "Odder Håndbold", tier: 5, baseOvr: 48, color: "38bdf8", stadium: 220, country: "DEN", rep: 23, fanBase: 1067, currentBudget: 45000 },
  { id: 358, name: "TM Tønder", tier: 5, baseOvr: 47, color: "ef4444", stadium: 250, country: "DEN", rep: 22, fanBase: 1000, currentBudget: 40000 }
];

// ============================================================================
// 3. FRANCE (FRA) - Liqui Moly StarLigue & Proligue
// ============================================================================
export const FRANCE_HANDBALL_CLUBS: Club[] = [
  // Tier 1 (16 Clubs)
  { id: 401, name: "Paris Saint-Germain", tier: 1, baseOvr: 94, color: "004170", color2: "da291c", stadium: 4016, country: "FRA", rep: 95, fanBase: 386667, currentBudget: 14500000 },
  { id: 402, name: "HBC Nantes", tier: 1, baseOvr: 90, color: "581c87", color2: "facc15", stadium: 5900, country: "FRA", rep: 90, fanBase: 253333, currentBudget: 9200000 },
  { id: 403, name: "Montpellier HB", tier: 1, baseOvr: 89, color: "2563eb", color2: "ffffff", stadium: 5455, country: "FRA", rep: 92, fanBase: 293333, currentBudget: 8900000 },
  { id: 404, name: "USAM Nîmes Gard", tier: 1, baseOvr: 85, color: "15803d", color2: "ffffff", stadium: 3600, country: "FRA", rep: 84, fanBase: 126667, currentBudget: 5100000 },
  { id: 405, name: "Chambéry Savoie HB", tier: 1, baseOvr: 85, color: "facc15", color2: "000000", stadium: 4400, country: "FRA", rep: 85, fanBase: 140000, currentBudget: 5300000 },
  { id: 406, name: "Fenix Toulouse HB", tier: 1, baseOvr: 84, color: "0284c7", color2: "ffffff", stadium: 3850, country: "FRA", rep: 83, fanBase: 123333, currentBudget: 4900000 },
  { id: 407, name: "Pays d'Aix UC", tier: 1, baseOvr: 84, color: "ca8a04", color2: "000000", stadium: 6000, country: "FRA", rep: 83, fanBase: 133333, currentBudget: 5200000 },
  { id: 408, name: "Limoges Handball", tier: 1, baseOvr: 83, color: "1e40af", color2: "ffffff", stadium: 4400, country: "FRA", rep: 81, fanBase: 110000, currentBudget: 4600000 },
  { id: 409, name: "Dunkerque HGL", tier: 1, baseOvr: 82, color: "0284c7", color2: "ffffff", stadium: 2500, country: "FRA", rep: 82, fanBase: 103333, currentBudget: 4200000 },
  { id: 410, name: "Saint-Raphaël VHB", tier: 1, baseOvr: 82, color: "0369a1", color2: "facc15", stadium: 5300, country: "FRA", rep: 80, fanBase: 93333, currentBudget: 4100000 },
  { id: 411, name: "C'Chartres MHB", tier: 1, baseOvr: 81, color: "2563eb", color2: "ffffff", stadium: 3800, country: "FRA", rep: 79, fanBase: 86667, currentBudget: 3900000 },
  { id: 412, name: "Cesson Rennes MHB", tier: 1, baseOvr: 81, color: "ec4899", color2: "2563eb", stadium: 4300, country: "FRA", rep: 79, fanBase: 90000, currentBudget: 4000000 },
  { id: 413, name: "US Créteil", tier: 1, baseOvr: 80, color: "1d4ed8", color2: "ffffff", stadium: 2500, country: "FRA", rep: 78, fanBase: 80000, currentBudget: 3600000 },
  { id: 414, name: "US Ivry", tier: 1, baseOvr: 79, color: "dc2626", color2: "000000", stadium: 1500, country: "FRA", rep: 78, fanBase: 76667, currentBudget: 3300000 },
  { id: 415, name: "Tremblay Handball", tier: 1, baseOvr: 79, color: "2563eb", color2: "facc15", stadium: 6124, country: "FRA", rep: 76, fanBase: 70000, currentBudget: 3400000 },
  { id: 416, name: "Istres Provence HB", tier: 1, baseOvr: 78, color: "7e22ce", color2: "000000", stadium: 1400, country: "FRA", rep: 75, fanBase: 63333, currentBudget: 3100000 },

  // Tier 2 (14 Clubs)
  { id: 417, name: "Sélestat Alsace HB", tier: 2, baseOvr: 77, color: "6b21a8", stadium: 2200, country: "FRA", rep: 74, fanBase: 54667, currentBudget: 2600000 },
  { id: 418, name: "Pontault-Combault HB", tier: 2, baseOvr: 76, color: "1e40af", stadium: 1500, country: "FRA", rep: 73, fanBase: 49333, currentBudget: 2400000 },
  { id: 419, name: "Saran Loiret HB", tier: 2, baseOvr: 76, color: "0284c7", stadium: 2775, country: "FRA", rep: 73, fanBase: 50667, currentBudget: 2500000 },
  { id: 420, name: "Dijon Métropole HB", tier: 2, baseOvr: 75, color: "b91c1c", stadium: 2834, country: "FRA", rep: 72, fanBase: 48000, currentBudget: 2350000 },
  { id: 421, name: "Grand Nancy HB", tier: 2, baseOvr: 75, color: "dc2626", stadium: 2242, country: "FRA", rep: 71, fanBase: 45333, currentBudget: 2250000 },
  { id: 422, name: "JS Cherbourg", tier: 2, baseOvr: 74, color: "2563eb", stadium: 2600, country: "FRA", rep: 70, fanBase: 42000, currentBudget: 2100000 },
  { id: 423, name: "Billère Handball", tier: 2, baseOvr: 74, color: "0284c7", stadium: 1500, country: "FRA", rep: 69, fanBase: 39333, currentBudget: 2000000 },
  { id: 424, name: "Frontignan Thau HB", tier: 2, baseOvr: 73, color: "eab308", stadium: 1100, country: "FRA", rep: 68, fanBase: 36000, currentBudget: 1850000 },
  { id: 425, name: "Caen HB", tier: 2, baseOvr: 73, color: "dc2626", stadium: 4200, country: "FRA", rep: 69, fanBase: 38667, currentBudget: 1950000 },
  { id: 426, name: "Valence Handball", tier: 2, baseOvr: 72, color: "ef4444", stadium: 1500, country: "FRA", rep: 67, fanBase: 32667, currentBudget: 1700000 },
  { id: 427, name: "Massy Essonne HB", tier: 2, baseOvr: 72, color: "1d4ed8", stadium: 1500, country: "FRA", rep: 67, fanBase: 32000, currentBudget: 1650000 },
  { id: 428, name: "Grand Besançon Doubs HB", tier: 2, baseOvr: 71, color: "b91c1c", stadium: 3300, country: "FRA", rep: 68, fanBase: 34667, currentBudget: 1750000 },
  { id: 429, name: "Cournon d'Auvergne", tier: 2, baseOvr: 70, color: "0284c7", stadium: 1200, country: "FRA", rep: 64, fanBase: 26000, currentBudget: 1450000 },
  { id: 430, name: "Angers SCO Handball", tier: 2, baseOvr: 70, color: "06b6d4", stadium: 1500, country: "FRA", rep: 64, fanBase: 25333, currentBudget: 1400000 },

  // TIER 3 (Nationale 1) - 14 Clubs
  { id: 431, name: "Bordeaux Bruges Lormont", tier: 3, baseOvr: 68, color: "1d4ed8", stadium: 1800, country: "FRA", rep: 61, fanBase: 24000, currentBudget: 1050000 },
  { id: 432, name: "Strasbourg Schiltigheim", tier: 3, baseOvr: 67, color: "0284c7", stadium: 1600, country: "FRA", rep: 60, fanBase: 22667, currentBudget: 980000 },
  { id: 433, name: "Mulhouse HB", tier: 3, baseOvr: 67, color: "dc2626", stadium: 1200, country: "FRA", rep: 59, fanBase: 20667, currentBudget: 920000 },
  { id: 434, name: "Metz Handball", tier: 3, baseOvr: 66, color: "facc15", stadium: 1500, country: "FRA", rep: 58, fanBase: 19333, currentBudget: 850000 },
  { id: 435, name: "Vénissieux HB", tier: 3, baseOvr: 66, color: "ffffff", stadium: 1100, country: "FRA", rep: 58, fanBase: 18000, currentBudget: 810000 },
  { id: 436, name: "Gonfreville l'Orcher", tier: 3, baseOvr: 65, color: "7f1d1d", stadium: 1781, country: "FRA", rep: 57, fanBase: 16667, currentBudget: 750000 },
  { id: 437, name: "Lanester HB", tier: 3, baseOvr: 65, color: "ea580c", stadium: 900, country: "FRA", rep: 56, fanBase: 15333, currentBudget: 700000 },
  { id: 438, name: "Hazebrouck HB", tier: 3, baseOvr: 64, color: "9333ea", stadium: 800, country: "FRA", rep: 55, fanBase: 14000, currentBudget: 650000 },
  { id: 439, name: "Pau Nousty Sports", tier: 3, baseOvr: 64, color: "16a34a", stadium: 950, country: "FRA", rep: 54, fanBase: 12667, currentBudget: 600000 },
  { id: 440, name: "Sarrebourg Moselle", tier: 3, baseOvr: 63, color: "fde047", stadium: 850, country: "FRA", rep: 53, fanBase: 12000, currentBudget: 550000 },
  { id: 441, name: "Martigues HB", tier: 3, baseOvr: 63, color: "2563eb", stadium: 1488, country: "FRA", rep: 52, fanBase: 11333, currentBudget: 520000 },
  { id: 442, name: "Annecy HB", tier: 3, baseOvr: 62, color: "dc2626", stadium: 1200, country: "FRA", rep: 51, fanBase: 10667, currentBudget: 480000 },
  { id: 443, name: "Torcy HB", tier: 3, baseOvr: 62, color: "b91c1c", stadium: 1100, country: "FRA", rep: 50, fanBase: 10000, currentBudget: 450000 },
  { id: 444, name: "Saint-Étienne HB", tier: 3, baseOvr: 61, color: "000000", stadium: 700, country: "FRA", rep: 49, fanBase: 8667, currentBudget: 400000 },

  // TIER 4 (Nationale 2) - 12 Clubs
  { id: 445, name: "Lille Métropole HB", tier: 4, baseOvr: 59, color: "1d4ed8", stadium: 800, country: "FRA", rep: 45, fanBase: 6333, currentBudget: 280000 },
  { id: 446, name: "Rouen HB", tier: 4, baseOvr: 58, color: "15803d", stadium: 793, country: "FRA", rep: 44, fanBase: 6000, currentBudget: 260000 },
  { id: 447, name: "HBC Nantes II", tier: 4, baseOvr: 58, color: "ef4444", stadium: 900, country: "FRA", rep: 43, fanBase: 5667, currentBudget: 240000 },
  { id: 448, name: "Marseille Provence HB", tier: 4, baseOvr: 57, color: "7e22ce", stadium: 500, country: "FRA", rep: 42, fanBase: 5333, currentBudget: 220000 },
  { id: 449, name: "Brest Bretagne HB", tier: 4, baseOvr: 57, color: "38bdf8", stadium: 1200, country: "FRA", rep: 41, fanBase: 5000, currentBudget: 210000 },
  { id: 450, name: "Cavigal Nice HB", tier: 4, baseOvr: 56, color: "1e40af", stadium: 850, country: "FRA", rep: 40, fanBase: 4667, currentBudget: 190000 },
  { id: 451, name: "Tours HB", tier: 4, baseOvr: 56, color: "facc15", stadium: 750, country: "FRA", rep: 39, fanBase: 4333, currentBudget: 180000 },
  { id: 452, name: "Reims Champagne HB", tier: 4, baseOvr: 55, color: "dc2626", stadium: 700, country: "FRA", rep: 38, fanBase: 4000, currentBudget: 170000 },
  { id: 453, name: "Clermont HB", tier: 4, baseOvr: 55, color: "18181b", stadium: 800, country: "FRA", rep: 37, fanBase: 3667, currentBudget: 160000 },
  { id: 454, name: "Amiens Picardie", tier: 4, baseOvr: 54, color: "b91c1c", stadium: 650, country: "FRA", rep: 36, fanBase: 3333, currentBudget: 150000 },
  { id: 455, name: "Orléans HB", tier: 4, baseOvr: 54, color: "ef4444", stadium: 600, country: "FRA", rep: 35, fanBase: 3200, currentBudget: 140000 },
  { id: 456, name: "Le Havre HB", tier: 4, baseOvr: 53, color: "eab308", stadium: 700, country: "FRA", rep: 34, fanBase: 3000, currentBudget: 130000 },

  // TIER 5 (Nationale 3) - 10 Clubs
  { id: 457, name: "Avignon HB", tier: 5, baseOvr: 51, color: "2563eb", stadium: 550, country: "FRA", rep: 30, fanBase: 2333, currentBudget: 85000 },
  { id: 458, name: "Dijon Métropole II", tier: 5, baseOvr: 50, color: "16a34a", stadium: 500, country: "FRA", rep: 29, fanBase: 2133, currentBudget: 80000 },
  { id: 459, name: "Lorient HB", tier: 5, baseOvr: 50, color: "b91c1c", stadium: 600, country: "FRA", rep: 28, fanBase: 2000, currentBudget: 75000 },
  { id: 460, name: "Perpignan HB", tier: 5, baseOvr: 49, color: "9333ea", stadium: 450, country: "FRA", rep: 27, fanBase: 1867, currentBudget: 70000 },
  { id: 461, name: "Limoges Handball II", tier: 5, baseOvr: 49, color: "dc2626", stadium: 400, country: "FRA", rep: 26, fanBase: 1667, currentBudget: 65000 },
  { id: 462, name: "GFC Ajaccio HB", tier: 5, baseOvr: 48, color: "1e40af", stadium: 350, country: "FRA", rep: 25, fanBase: 1467, currentBudget: 60000 },
  { id: 463, name: "Grand Besançon II", tier: 5, baseOvr: 48, color: "ffffff", stadium: 400, country: "FRA", rep: 24, fanBase: 1333, currentBudget: 55000 },
  { id: 464, name: "Valence Handball II", tier: 5, baseOvr: 47, color: "000000", stadium: 500, country: "FRA", rep: 23, fanBase: 1200, currentBudget: 50000 },
  { id: 465, name: "Chambéry Savoie II", tier: 5, baseOvr: 47, color: "facc15", stadium: 450, country: "FRA", rep: 22, fanBase: 1067, currentBudget: 45000 },
  { id: 466, name: "Montauban HB", tier: 5, baseOvr: 46, color: "f59e0b", stadium: 300, country: "FRA", rep: 21, fanBase: 1000, currentBudget: 40000 },

  // TIER 6 (Prénationale) - 10 Clubs
  { id: 467, name: "Tarbes HB", tier: 6, baseOvr: 44, color: "0284c7", stadium: 300, country: "FRA", rep: 16, fanBase: 1000, currentBudget: 25000 },
  { id: 468, name: "Brive HB", tier: 6, baseOvr: 43, color: "dc2626", stadium: 250, country: "FRA", rep: 15, fanBase: 1000, currentBudget: 20000 },
  { id: 469, name: "Narbonne HB", tier: 6, baseOvr: 43, color: "16a34a", stadium: 200, country: "FRA", rep: 14, fanBase: 1000, currentBudget: 18000 },
  { id: 470, name: "Carcassonne HB", tier: 6, baseOvr: 42, color: "ea580c", stadium: 250, country: "FRA", rep: 13, fanBase: 1000, currentBudget: 16000 },
  { id: 471, name: "Biarritz HB", tier: 6, baseOvr: 42, color: "18181b", stadium: 220, country: "FRA", rep: 12, fanBase: 1000, currentBudget: 14000 },
  { id: 472, name: "Saint-Nazaire HB", tier: 6, baseOvr: 41, color: "ef4444", stadium: 300, country: "FRA", rep: 11, fanBase: 1000, currentBudget: 12000 },
  { id: 473, name: "Vannes HB", tier: 6, baseOvr: 41, color: "2563eb", stadium: 180, country: "FRA", rep: 10, fanBase: 1000, currentBudget: 11000 },
  { id: 474, name: "Colmar HB", tier: 6, baseOvr: 40, color: "7e22ce", stadium: 200, country: "FRA", rep: 9, fanBase: 1000, currentBudget: 10000 },
  { id: 475, name: "Belfort HB", tier: 6, baseOvr: 40, color: "15803d", stadium: 250, country: "FRA", rep: 8, fanBase: 1000, currentBudget: 9000 },
  { id: 476, name: "AS Monaco HB", tier: 6, baseOvr: 39, color: "facc15", stadium: 150, country: "FRA", rep: 7, fanBase: 1000, currentBudget: 8000 }
];

// ============================================================================
// 4. SPAIN (ESP) - Liga Plenitude ASOBAL & División de Honor Plata
// ============================================================================
export const SPAIN_HANDBALL_CLUBS: Club[] = [
  // Tier 1 (16 Clubs)
  { id: 501, name: "FC Barcelona", tier: 1, baseOvr: 95, color: "a50044", color2: "004d98", stadium: 7585, country: "ESP", rep: 96, fanBase: 433333, currentBudget: 10500000 },
  { id: 502, name: "Bidasoa Irun", tier: 1, baseOvr: 86, color: "facc15", color2: "0000ff", stadium: 2200, country: "ESP", rep: 86, fanBase: 126667, currentBudget: 3400000 },
  { id: 503, name: "Fraikin BM Granollers", tier: 1, baseOvr: 85, color: "ffffff", color2: "0000ff", stadium: 5685, country: "ESP", rep: 87, fanBase: 140000, currentBudget: 3200000 },
  { id: 504, name: "BM Logroño La Rioja", tier: 1, baseOvr: 84, color: "dc2626", color2: "ffffff", stadium: 3809, country: "ESP", rep: 84, fanBase: 110000, currentBudget: 2800000 },
  { id: 505, name: "Abanca Ademar León", tier: 1, baseOvr: 84, color: "2563eb", color2: "ffffff", stadium: 5000, country: "ESP", rep: 86, fanBase: 130000, currentBudget: 2900000 },
  { id: 506, name: "Bathco BM Torrelavega", tier: 1, baseOvr: 83, color: "ea580c", color2: "ffffff", stadium: 2400, country: "ESP", rep: 81, fanBase: 90000, currentBudget: 2400000 },
  { id: 507, name: "REBI Balonmano Cuenca", tier: 1, baseOvr: 82, color: "15803d", color2: "ffffff", stadium: 1800, country: "ESP", rep: 80, fanBase: 83333, currentBudget: 2200000 },
  { id: 508, name: "Recoletas Atlético Valladolid", tier: 1, baseOvr: 82, color: "7c3aed", color2: "ffffff", stadium: 3500, country: "ESP", rep: 82, fanBase: 96667, currentBudget: 2300000 },
  { id: 509, name: "Ángel Ximénez Puente Genil", tier: 1, baseOvr: 81, color: "1e40af", color2: "ffffff", stadium: 1200, country: "ESP", rep: 78, fanBase: 70000, currentBudget: 1900000 },
  { id: 510, name: "Bada Huesca", tier: 1, baseOvr: 81, color: "b91c1c", color2: "ffffff", stadium: 5000, country: "ESP", rep: 78, fanBase: 73333, currentBudget: 1950000 },
  { id: 511, name: "Frigoríficos del Morrazo", tier: 1, baseOvr: 80, color: "0284c7", color2: "ffffff", stadium: 2500, country: "ESP", rep: 77, fanBase: 65333, currentBudget: 1750000 },
  { id: 512, name: "Helvetia Anaitasuna", tier: 1, baseOvr: 80, color: "16a34a", color2: "ffffff", stadium: 2500, country: "ESP", rep: 79, fanBase: 76667, currentBudget: 1850000 },
  { id: 513, name: "TM Benidorm", tier: 1, baseOvr: 79, color: "0284c7", color2: "ffffff", stadium: 6226, country: "ESP", rep: 76, fanBase: 61333, currentBudget: 1700000 },
  { id: 514, name: "Viveros Herol BM Nava", tier: 1, baseOvr: 79, color: "ef4444", color2: "ffffff", stadium: 1100, country: "ESP", rep: 75, fanBase: 56000, currentBudget: 1600000 },
  { id: 515, name: "BM Guadalajara", tier: 1, baseOvr: 78, color: "6b21a8", color2: "ffffff", stadium: 5800, country: "ESP", rep: 75, fanBase: 60000, currentBudget: 1650000 },
  { id: 516, name: "UBU San Pablo Burgos", tier: 1, baseOvr: 77, color: "facc15", color2: "ff0000", stadium: 2500, country: "ESP", rep: 74, fanBase: 54000, currentBudget: 1500000 },

  // Tier 2 (14 Clubs)
  { id: 517, name: "Blendio Sinfín", tier: 2, baseOvr: 76, color: "15803d", stadium: 2500, country: "ESP", rep: 73, fanBase: 50667, currentBudget: 1350000 },
  { id: 518, name: "Fertiberia Puerto Sagunto", tier: 2, baseOvr: 76, color: "dc2626", stadium: 2534, country: "ESP", rep: 73, fanBase: 49333, currentBudget: 1300000 },
  { id: 519, name: "CD Agustinos Alicante", tier: 2, baseOvr: 75, color: "b91c1c", stadium: 1860, country: "ESP", rep: 71, fanBase: 43333, currentBudget: 1200000 },
  { id: 520, name: "Club Cisne BM", tier: 2, baseOvr: 75, color: "ffffff", stadium: 3500, country: "ESP", rep: 72, fanBase: 45333, currentBudget: 1250000 },
  { id: 521, name: "Dólmenes Antequera", tier: 2, baseOvr: 74, color: "16a34a", stadium: 2500, country: "ESP", rep: 70, fanBase: 40000, currentBudget: 1100000 },
  { id: 522, name: "BM Caserío Ciudad Real", tier: 2, baseOvr: 74, color: "eab308", stadium: 5200, country: "ESP", rep: 75, fanBase: 56667, currentBudget: 1300000 },
  { id: 523, name: "UD Ibiza Handbol", tier: 2, baseOvr: 73, color: "0284c7", stadium: 1500, country: "ESP", rep: 69, fanBase: 34667, currentBudget: 1050000 },
  { id: 524, name: "BM Alcobendas", tier: 2, baseOvr: 73, color: "ef4444", stadium: 1200, country: "ESP", rep: 68, fanBase: 33333, currentBudget: 1000000 },
  { id: 525, name: "Valinox Novás", tier: 2, baseOvr: 72, color: "ffffff", stadium: 1200, country: "ESP", rep: 67, fanBase: 30667, currentBudget: 950000 },
  { id: 526, name: "Amenabar Zarautz", tier: 2, baseOvr: 71, color: "2563eb", stadium: 2024, country: "ESP", rep: 66, fanBase: 27333, currentBudget: 890000 },
  { id: 527, name: "Handbol Mallorca", tier: 2, baseOvr: 71, color: "dc2626", stadium: 2005, country: "ESP", rep: 67, fanBase: 31333, currentBudget: 920000 },
  { id: 528, name: "BM Triana", tier: 2, baseOvr: 70, color: "b91c1c", stadium: 1200, country: "ESP", rep: 65, fanBase: 26667, currentBudget: 850000 },
  { id: 529, name: "Barça Atlètic", tier: 2, baseOvr: 73, color: "004d98", color2: "a50044", stadium: 2059, country: "ESP", rep: 70, fanBase: 36667, currentBudget: 1100000 },
  { id: 530, name: "Atlética Avilesina", tier: 2, baseOvr: 69, color: "ea580c", stadium: 1500, country: "ESP", rep: 64, fanBase: 24000, currentBudget: 800000 },

  // TIER 3 (Primera Nacional) - 14 Clubs
  { id: 531, name: "BM Maristas Zaragoza", tier: 3, baseOvr: 67, color: "b91c1c", stadium: 1500, country: "ESP", rep: 60, fanBase: 22000, currentBudget: 900000 },
  { id: 532, name: "RGC Covadonga", tier: 3, baseOvr: 66, color: "dc2626", stadium: 1200, country: "ESP", rep: 59, fanBase: 20000, currentBudget: 850000 },
  { id: 533, name: "CB Santoña", tier: 3, baseOvr: 66, color: "2563eb", stadium: 1418, country: "ESP", rep: 58, fanBase: 18667, currentBudget: 780000 },
  { id: 534, name: "CB San José Obrero", tier: 3, baseOvr: 65, color: "0284c7", stadium: 900, country: "ESP", rep: 57, fanBase: 17333, currentBudget: 720000 },
  { id: 535, name: "BM Soria", tier: 3, baseOvr: 65, color: "ef4444", stadium: 1300, country: "ESP", rep: 56, fanBase: 16000, currentBudget: 680000 },
  { id: 536, name: "BM Maracena", tier: 3, baseOvr: 64, color: "000000", stadium: 1100, country: "ESP", rep: 55, fanBase: 14667, currentBudget: 640000 },
  { id: 537, name: "UB Lavadores Vigo", tier: 3, baseOvr: 64, color: "16a34a", stadium: 800, country: "ESP", rep: 54, fanBase: 13333, currentBudget: 590000 },
  { id: 538, name: "CB Pinto", tier: 3, baseOvr: 63, color: "eab308", stadium: 750, country: "ESP", rep: 53, fanBase: 12667, currentBudget: 550000 },
  { id: 539, name: "JD Arrate", tier: 3, baseOvr: 63, color: "ea580c", stadium: 850, country: "ESP", rep: 52, fanBase: 11667, currentBudget: 520000 },
  { id: 540, name: "Cajasur CBM", tier: 3, baseOvr: 62, color: "1d4ed8", stadium: 1597, country: "ESP", rep: 51, fanBase: 10667, currentBudget: 480000 },
  { id: 541, name: "BM Bahía de Almería", tier: 3, baseOvr: 62, color: "ffffff", stadium: 900, country: "ESP", rep: 50, fanBase: 10000, currentBudget: 450000 },
  { id: 542, name: "BM Málaga", tier: 3, baseOvr: 61, color: "38bdf8", stadium: 1100, country: "ESP", rep: 49, fanBase: 9333, currentBudget: 420000 },
  { id: 543, name: "CBM Eldense", tier: 3, baseOvr: 61, color: "18181b", stadium: 700, country: "ESP", rep: 48, fanBase: 8667, currentBudget: 390000 },
  { id: 544, name: "BM Granollers B", tier: 3, baseOvr: 60, color: "ffffff", stadium: 500, country: "ESP", rep: 47, fanBase: 8000, currentBudget: 360000 },

  // TIER 4 (Segunda Nacional) - 12 Clubs
  { id: 545, name: "Egia Eskubaloia", tier: 4, baseOvr: 58, color: "0284c7", stadium: 600, country: "ESP", rep: 43, fanBase: 6000, currentBudget: 250000 },
  { id: 546, name: "BM Tenerife", tier: 4, baseOvr: 57, color: "1e40af", stadium: 800, country: "ESP", rep: 42, fanBase: 5667, currentBudget: 230000 },
  { id: 547, name: "BM Las Palmas", tier: 4, baseOvr: 57, color: "facc15", stadium: 750, country: "ESP", rep: 41, fanBase: 5333, currentBudget: 210000 },
  { id: 548, name: "BM Ciudad Imperial", tier: 4, baseOvr: 56, color: "15803d", stadium: 700, country: "ESP", rep: 40, fanBase: 5000, currentBudget: 200000 },
  { id: 549, name: "BM Salamanca", tier: 4, baseOvr: 56, color: "000000", stadium: 650, country: "ESP", rep: 39, fanBase: 4667, currentBudget: 180000 },
  { id: 550, name: "Base Oviedo", tier: 4, baseOvr: 55, color: "2563eb", stadium: 850, country: "ESP", rep: 38, fanBase: 4333, currentBudget: 170000 },
  { id: 551, name: "BM Logroño La Rioja B", tier: 4, baseOvr: 55, color: "dc2626", stadium: 400, country: "ESP", rep: 37, fanBase: 4000, currentBudget: 160000 },
  { id: 552, name: "BM Palma", tier: 4, baseOvr: 54, color: "b91c1c", stadium: 600, country: "ESP", rep: 36, fanBase: 3667, currentBudget: 150000 },
  { id: 553, name: "BM Murcia", tier: 4, baseOvr: 54, color: "991b1b", stadium: 700, country: "ESP", rep: 35, fanBase: 3333, currentBudget: 140000 },
  { id: 554, name: "CAB Cartagena", tier: 4, baseOvr: 53, color: "ef4444", stadium: 550, country: "ESP", rep: 34, fanBase: 3200, currentBudget: 130000 },
  { id: 555, name: "BM Huelva", tier: 4, baseOvr: 53, color: "0ea5e9", stadium: 650, country: "ESP", rep: 33, fanBase: 3000, currentBudget: 120000 },
  { id: 556, name: "BM Gades", tier: 4, baseOvr: 52, color: "eab308", stadium: 500, country: "ESP", rep: 32, fanBase: 2800, currentBudget: 110000 },

  // TIER 5 (Tercera / Regional) - 10 Clubs
  { id: 557, name: "BM Albacete", tier: 5, baseOvr: 50, color: "ffffff", stadium: 450, country: "ESP", rep: 28, fanBase: 2133, currentBudget: 80000 },
  { id: 558, name: "BM Badajoz", tier: 5, baseOvr: 50, color: "18181b", stadium: 500, country: "ESP", rep: 27, fanBase: 2000, currentBudget: 75000 },
  { id: 559, name: "BM Cáceres", tier: 5, baseOvr: 49, color: "16a34a", stadium: 400, country: "ESP", rep: 26, fanBase: 1867, currentBudget: 70000 },
  { id: 560, name: "BM Mérida", tier: 5, baseOvr: 49, color: "000000", stadium: 350, country: "ESP", rep: 25, fanBase: 1733, currentBudget: 65000 },
  { id: 561, name: "Handbol Tarragona", tier: 5, baseOvr: 48, color: "dc2626", stadium: 450, country: "ESP", rep: 24, fanBase: 1600, currentBudget: 60000 },
  { id: 562, name: "Handbol Girona", tier: 5, baseOvr: 48, color: "b91c1c", stadium: 500, country: "ESP", rep: 23, fanBase: 1467, currentBudget: 55000 },
  { id: 563, name: "CE Lleida", tier: 5, baseOvr: 47, color: "ef4444", stadium: 300, country: "ESP", rep: 22, fanBase: 1333, currentBudget: 50000 },
  { id: 564, name: "CN Reus Ploms", tier: 5, baseOvr: 47, color: "2563eb", stadium: 350, country: "ESP", rep: 21, fanBase: 1200, currentBudget: 45000 },
  { id: 565, name: "BM Castellón", tier: 5, baseOvr: 46, color: "18181b", stadium: 400, country: "ESP", rep: 20, fanBase: 1067, currentBudget: 40000 },
  { id: 566, name: "BM Vila-real", tier: 5, baseOvr: 46, color: "facc15", stadium: 300, country: "ESP", rep: 19, fanBase: 1000, currentBudget: 35000 },

  // TIER 6 (Provincial) - 10 Clubs
  { id: 567, name: "BM Nava B", tier: 6, baseOvr: 44, color: "1d4ed8", stadium: 250, country: "ESP", rep: 15, fanBase: 1000, currentBudget: 22000 },
  { id: 568, name: "BM Ávila", tier: 6, baseOvr: 43, color: "dc2626", stadium: 200, country: "ESP", rep: 14, fanBase: 1000, currentBudget: 20000 },
  { id: 569, name: "BM Zamora", tier: 6, baseOvr: 43, color: "b91c1c", stadium: 250, country: "ESP", rep: 13, fanBase: 1000, currentBudget: 18000 },
  { id: 570, name: "BM Palencia", tier: 6, baseOvr: 42, color: "9333ea", stadium: 180, country: "ESP", rep: 12, fanBase: 1000, currentBudget: 16000 },
  { id: 571, name: "Xiria Carballo", tier: 6, baseOvr: 42, color: "ef4444", stadium: 220, country: "ESP", rep: 11, fanBase: 1000, currentBudget: 15000 },
  { id: 572, name: "BM Ourense", tier: 6, baseOvr: 41, color: "dc2626", stadium: 200, country: "ESP", rep: 10, fanBase: 1000, currentBudget: 14000 },
  { id: 573, name: "GAB Jaén", tier: 6, baseOvr: 41, color: "ffffff", stadium: 300, country: "ESP", rep: 9, fanBase: 1000, currentBudget: 12000 },
  { id: 574, name: "BM Linares", tier: 6, baseOvr: 40, color: "2563eb", stadium: 250, country: "ESP", rep: 8, fanBase: 1000, currentBudget: 11000 },
  { id: 575, name: "BM Úbeda", tier: 6, baseOvr: 40, color: "15803d", stadium: 150, country: "ESP", rep: 7, fanBase: 1000, currentBudget: 10000 },
  { id: 576, name: "BM Baeza", tier: 6, baseOvr: 39, color: "b91c1c", stadium: 100, country: "ESP", rep: 6, fanBase: 1000, currentBudget: 8000 }
];

// ============================================================================
// 5. SWEDEN (SWE) - Handbollsligan & Allsvenskan
// ============================================================================
export const SWEDEN_HANDBALL_CLUBS: Club[] = [
  // Tier 1 (14 Clubs)
  { id: 601, name: "IK Sävehof", tier: 1, baseOvr: 87, color: "facc15", color2: "000000", stadium: 4100, country: "SWE", rep: 88, fanBase: 173333, currentBudget: 4200000 },
  { id: 602, name: "Ystads IF", tier: 1, baseOvr: 85, color: "1d4ed8", color2: "ffffff", stadium: 2700, country: "SWE", rep: 85, fanBase: 140000, currentBudget: 3500000 },
  { id: 603, name: "IFK Kristianstad", tier: 1, baseOvr: 85, color: "ea580c", color2: "000000", stadium: 5000, country: "SWE", rep: 86, fanBase: 160000, currentBudget: 3800000 },
  { id: 604, name: "Alingsås HK", tier: 1, baseOvr: 83, color: "0284c7", color2: "ffffff", stadium: 2700, country: "SWE", rep: 82, fanBase: 106667, currentBudget: 2900000 },
  { id: 605, name: "IFK Skövde", tier: 1, baseOvr: 83, color: "2563eb", color2: "ffffff", stadium: 2400, country: "SWE", rep: 81, fanBase: 100000, currentBudget: 2800000 },
  { id: 606, name: "Hammarby IF", tier: 1, baseOvr: 82, color: "15803d", color2: "ffffff", stadium: 2200, country: "SWE", rep: 83, fanBase: 146667, currentBudget: 3100000 },
  { id: 607, name: "Önnereds HK", tier: 1, baseOvr: 81, color: "16a34a", color2: "ffffff", stadium: 1500, country: "SWE", rep: 78, fanBase: 80000, currentBudget: 2400000 },
  { id: 608, name: "HK Malmö", tier: 1, baseOvr: 81, color: "000000", color2: "ffffff", stadium: 6358, country: "SWE", rep: 79, fanBase: 90000, currentBudget: 2500000 },
  { id: 609, name: "Eskilstuna Guif", tier: 1, baseOvr: 80, color: "dc2626", color2: "ffffff", stadium: 5744, country: "SWE", rep: 80, fanBase: 96667, currentBudget: 2600000 },
  { id: 610, name: "IF Hallby", tier: 1, baseOvr: 80, color: "0284c7", color2: "ffffff", stadium: 1800, country: "SWE", rep: 77, fanBase: 73333, currentBudget: 2200000 },
  { id: 611, name: "HF Karlskrona", tier: 1, baseOvr: 79, color: "f97316", color2: "000000", stadium: 2500, country: "SWE", rep: 76, fanBase: 70000, currentBudget: 2100000 },
  { id: 612, name: "Amo HK", tier: 1, baseOvr: 79, color: "1d4ed8", color2: "ffffff", stadium: 1100, country: "SWE", rep: 75, fanBase: 58667, currentBudget: 1950000 },
  { id: 613, name: "IFK Ystad", tier: 1, baseOvr: 78, color: "881337", color2: "ffffff", stadium: 2700, country: "SWE", rep: 76, fanBase: 68000, currentBudget: 2050000 },
  { id: 614, name: "HK Aranäs", tier: 1, baseOvr: 77, color: "0369a1", color2: "ffffff", stadium: 1800, country: "SWE", rep: 74, fanBase: 56667, currentBudget: 1850000 },

  // Tier 2 (12 Clubs)
  { id: 615, name: "Redbergslids IK", tier: 2, baseOvr: 76, color: "ffffff", stadium: 2726, country: "SWE", rep: 79, fanBase: 83333, currentBudget: 1900000 },
  { id: 616, name: "LUGI HF", tier: 2, baseOvr: 76, color: "991b1b", stadium: 2113, country: "SWE", rep: 78, fanBase: 76667, currentBudget: 1800000 },
  { id: 617, name: "HK Varberg", tier: 2, baseOvr: 75, color: "2563eb", stadium: 2200, country: "SWE", rep: 72, fanBase: 43333, currentBudget: 1500000 },
  { id: 618, name: "HK Drott", tier: 2, baseOvr: 74, color: "ffffff", stadium: 2698, country: "SWE", rep: 75, fanBase: 56667, currentBudget: 1600000 },
  { id: 619, name: "VästeråsIrsta HF", tier: 2, baseOvr: 74, color: "18181b", stadium: 2400, country: "SWE", rep: 71, fanBase: 41333, currentBudget: 1450000 },
  { id: 620, name: "Skånela IF", tier: 2, baseOvr: 73, color: "7f1d1d", stadium: 1200, country: "SWE", rep: 69, fanBase: 35333, currentBudget: 1300000 },
  { id: 621, name: "Tyresö Handboll", tier: 2, baseOvr: 73, color: "facc15", stadium: 2109, country: "SWE", rep: 68, fanBase: 32667, currentBudget: 1250000 },
  { id: 622, name: "Vinslövs HK", tier: 2, baseOvr: 72, color: "eab308", stadium: 1100, country: "SWE", rep: 67, fanBase: 30000, currentBudget: 1150000 },
  { id: 623, name: "Kungälvs HK", tier: 2, baseOvr: 71, color: "15803d", stadium: 1500, country: "SWE", rep: 67, fanBase: 30667, currentBudget: 1200000 },
  { id: 624, name: "IFK Tumba", tier: 2, baseOvr: 71, color: "1d4ed8", stadium: 2641, country: "SWE", rep: 66, fanBase: 27333, currentBudget: 1100000 },
  { id: 625, name: "Anderstorps SK", tier: 2, baseOvr: 70, color: "ea580c", stadium: 2514, country: "SWE", rep: 65, fanBase: 25333, currentBudget: 1050000 },
  { id: 626, name: "Rimbo HK", tier: 2, baseOvr: 69, color: "16a34a", stadium: 800, country: "SWE", rep: 63, fanBase: 21333, currentBudget: 950000 },

  // TIER 3 (Division 1) - 10 Clubs
  { id: 627, name: "Norrköpings HK", tier: 3, baseOvr: 67, color: "ffffff", stadium: 1100, country: "SWE", rep: 60, fanBase: 20000, currentBudget: 850000 },
  { id: 628, name: "Linköpings Lejon", tier: 3, baseOvr: 66, color: "1d4ed8", stadium: 1127, country: "SWE", rep: 59, fanBase: 18667, currentBudget: 800000 },
  { id: 629, name: "Umeå IK", tier: 3, baseOvr: 66, color: "dc2626", stadium: 900, country: "SWE", rep: 58, fanBase: 17333, currentBudget: 750000 },
  { id: 630, name: "Örebro SK", tier: 3, baseOvr: 65, color: "15803d", stadium: 850, country: "SWE", rep: 57, fanBase: 16000, currentBudget: 680000 },
  { id: 631, name: "Uppsala HK", tier: 3, baseOvr: 65, color: "eab308", stadium: 950, country: "SWE", rep: 56, fanBase: 14667, currentBudget: 620000 },
  { id: 632, name: "IF Hellton", tier: 3, baseOvr: 64, color: "ea580c", stadium: 800, country: "SWE", rep: 55, fanBase: 13333, currentBudget: 580000 },
  { id: 633, name: "Gävle GIK", tier: 3, baseOvr: 64, color: "2563eb", stadium: 750, country: "SWE", rep: 54, fanBase: 12667, currentBudget: 530000 },
  { id: 634, name: "Sundsvall HK", tier: 3, baseOvr: 63, color: "0ea5e9", stadium: 700, country: "SWE", rep: 53, fanBase: 11667, currentBudget: 490000 },
  { id: 635, name: "Borås HK", tier: 3, baseOvr: 62, color: "16a34a", stadium: 650, country: "SWE", rep: 52, fanBase: 10667, currentBudget: 450000 },
  { id: 636, name: "Falu HK", tier: 3, baseOvr: 61, color: "1e40af", stadium: 600, country: "SWE", rep: 51, fanBase: 10000, currentBudget: 410000 },

  // TIER 4 (Division 2) - 10 Clubs
  { id: 637, name: "Kalmar HK", tier: 4, baseOvr: 59, color: "b91c1c", stadium: 550, country: "SWE", rep: 46, fanBase: 6333, currentBudget: 250000 },
  { id: 638, name: "Växjö HF", tier: 4, baseOvr: 58, color: "facc15", stadium: 500, country: "SWE", rep: 45, fanBase: 6000, currentBudget: 230000 },
  { id: 639, name: "Skellefteå HBK", tier: 4, baseOvr: 58, color: "2563eb", stadium: 450, country: "SWE", rep: 44, fanBase: 5667, currentBudget: 210000 },
  { id: 640, name: "Luleå HK", tier: 4, baseOvr: 57, color: "18181b", stadium: 400, country: "SWE", rep: 43, fanBase: 5333, currentBudget: 190000 },
  { id: 641, name: "Östersunds HK", tier: 4, baseOvr: 57, color: "0284c7", stadium: 550, country: "SWE", rep: 42, fanBase: 5000, currentBudget: 180000 },
  { id: 642, name: "KFUM Trollhättan", tier: 4, baseOvr: 56, color: "15803d", stadium: 450, country: "SWE", rep: 41, fanBase: 4667, currentBudget: 170000 },
  { id: 643, name: "Lidingö SK", tier: 4, baseOvr: 56, color: "dc2626", stadium: 350, country: "SWE", rep: 40, fanBase: 4333, currentBudget: 160000 },
  { id: 644, name: "IFK Nyköping", tier: 4, baseOvr: 55, color: "eab308", stadium: 300, country: "SWE", rep: 39, fanBase: 4000, currentBudget: 150000 },
  { id: 645, name: "Enköpings HF", tier: 4, baseOvr: 55, color: "16a34a", stadium: 400, country: "SWE", rep: 38, fanBase: 3667, currentBudget: 140000 },
  { id: 646, name: "OV Helsingborg", tier: 4, baseOvr: 54, color: "ef4444", stadium: 450, country: "SWE", rep: 37, fanBase: 3467, currentBudget: 130000 },

  // TIER 5 (Division 3) - 10 Clubs
  { id: 647, name: "IFK Motala", tier: 5, baseOvr: 52, color: "000000", stadium: 300, country: "SWE", rep: 31, fanBase: 2333, currentBudget: 80000 },
  { id: 648, name: "HK Landskrona", tier: 5, baseOvr: 51, color: "18181b", stadium: 250, country: "SWE", rep: 30, fanBase: 2133, currentBudget: 75000 },
  { id: 649, name: "Falkenbergs HK", tier: 5, baseOvr: 51, color: "facc15", stadium: 350, country: "SWE", rep: 29, fanBase: 2000, currentBudget: 70000 },
  { id: 650, name: "Trelleborgs HBK", tier: 5, baseOvr: 50, color: "1d4ed8", stadium: 200, country: "SWE", rep: 28, fanBase: 1867, currentBudget: 65000 },
  { id: 651, name: "Ljungby HK", tier: 5, baseOvr: 50, color: "dc2626", stadium: 250, country: "SWE", rep: 27, fanBase: 1667, currentBudget: 60000 },
  { id: 652, name: "Kiruna HK", tier: 5, baseOvr: 49, color: "38bdf8", stadium: 150, country: "SWE", rep: 26, fanBase: 1467, currentBudget: 55000 },
  { id: 653, name: "Bodens BK", tier: 5, baseOvr: 49, color: "b91c1c", stadium: 200, country: "SWE", rep: 25, fanBase: 1333, currentBudget: 50000 },
  { id: 654, name: "Strömnäs GIF", tier: 5, baseOvr: 48, color: "ea580c", stadium: 180, country: "SWE", rep: 24, fanBase: 1200, currentBudget: 45000 },
  { id: 655, name: "Visby IF Gute", tier: 5, baseOvr: 48, color: "1e40af", stadium: 150, country: "SWE", rep: 23, fanBase: 1067, currentBudget: 40000 },
  { id: 656, name: "Ronneby HK", tier: 5, baseOvr: 47, color: "16a34a", stadium: 220, country: "SWE", rep: 22, fanBase: 1000, currentBudget: 35000 }
];

// ============================================================================
// 6. CROATIA (CRO) - Paket24 Premijer liga & 1. HRL
// ============================================================================
export const CROATIA_HANDBALL_CLUBS: Club[] = [
  // Tier 1 (16 Clubs)
  { id: 701, name: "RK Zagreb", tier: 1, baseOvr: 89, color: "0033a0", color2: "ffffff", stadium: 15200, country: "CRO", rep: 91, fanBase: 260000, currentBudget: 5500000 },
  { id: 702, name: "RK Nexe", tier: 1, baseOvr: 86, color: "15803d", color2: "ffffff", stadium: 2500, country: "CRO", rep: 86, fanBase: 146667, currentBudget: 3800000 },
  { id: 703, name: "MRK Sesvete", tier: 1, baseOvr: 82, color: "dc2626", color2: "0033a0", stadium: 5432, country: "CRO", rep: 79, fanBase: 76667, currentBudget: 1900000 },
  { id: 704, name: "RK Poreč", tier: 1, baseOvr: 81, color: "2563eb", color2: "facc15", stadium: 3700, country: "CRO", rep: 77, fanBase: 65333, currentBudget: 1600000 },
  { id: 705, name: "HRK Gorica", tier: 1, baseOvr: 80, color: "facc15", color2: "000000", stadium: 1500, country: "CRO", rep: 76, fanBase: 60667, currentBudget: 1450000 },
  { id: 706, name: "GRK Varaždin", tier: 1, baseOvr: 80, color: "0284c7", color2: "ffffff", stadium: 5000, country: "CRO", rep: 78, fanBase: 73333, currentBudget: 1550000 },
  { id: 707, name: "RK Zamet", tier: 1, baseOvr: 79, color: "1d4ed8", color2: "ffffff", stadium: 2350, country: "CRO", rep: 77, fanBase: 70000, currentBudget: 1400000 },
  { id: 708, name: "RK Dubrava", tier: 1, baseOvr: 79, color: "881337", color2: "ffffff", stadium: 1500, country: "CRO", rep: 75, fanBase: 56000, currentBudget: 1300000 },
  { id: 709, name: "MRK Čakovec", tier: 1, baseOvr: 78, color: "ef4444", color2: "ffffff", stadium: 1500, country: "CRO", rep: 74, fanBase: 52000, currentBudget: 1200000 },
  { id: 710, name: "HRK Karlovac", tier: 1, baseOvr: 78, color: "0369a1", color2: "facc15", stadium: 3500, country: "CRO", rep: 75, fanBase: 57333, currentBudget: 1250000 },
  { id: 711, name: "RK Metković", tier: 1, baseOvr: 78, color: "f97316", color2: "0369a1", stadium: 2500, country: "CRO", rep: 77, fanBase: 61333, currentBudget: 1300000 },
  { id: 712, name: "MRK Trogir", tier: 1, baseOvr: 77, color: "0284c7", color2: "ffffff", stadium: 1100, country: "CRO", rep: 73, fanBase: 47333, currentBudget: 1100000 },
  { id: 713, name: "RK Ribola Kaštela", tier: 1, baseOvr: 77, color: "2563eb", color2: "ffffff", stadium: 1200, country: "CRO", rep: 72, fanBase: 45333, currentBudget: 1050000 },
  { id: 714, name: "RK Rudar Rude", tier: 1, baseOvr: 76, color: "16a34a", color2: "ffffff", stadium: 6368, country: "CRO", rep: 71, fanBase: 41333, currentBudget: 950000 },
  { id: 715, name: "RK Osijek", tier: 1, baseOvr: 76, color: "ffffff", color2: "0033a0", stadium: 3500, country: "CRO", rep: 74, fanBase: 52667, currentBudget: 1150000 },
  { id: 716, name: "RK Moslavina", tier: 1, baseOvr: 75, color: "ea580c", color2: "ffffff", stadium: 1500, country: "CRO", rep: 71, fanBase: 40667, currentBudget: 920000 },

  // Tier 2 (12 Clubs)
  { id: 717, name: "RK Split", tier: 2, baseOvr: 75, color: "dc2626", stadium: 3500, country: "CRO", rep: 73, fanBase: 50000, currentBudget: 1050000 },
  { id: 718, name: "MRK Umag", tier: 2, baseOvr: 74, color: "2563eb", stadium: 1200, country: "CRO", rep: 70, fanBase: 38667, currentBudget: 880000 },
  { id: 719, name: "RK Ardiaei", tier: 2, baseOvr: 74, color: "0284c7", stadium: 1500, country: "CRO", rep: 70, fanBase: 39333, currentBudget: 890000 },
  { id: 720, name: "RK Zadar 1954", tier: 2, baseOvr: 73, color: "1d4ed8", stadium: 2540, country: "CRO", rep: 71, fanBase: 42667, currentBudget: 930000 },
  { id: 721, name: "RK Đakovo", tier: 2, baseOvr: 73, color: "b91c1c", stadium: 1800, country: "CRO", rep: 68, fanBase: 32667, currentBudget: 780000 },
  { id: 722, name: "RK Sisak", tier: 2, baseOvr: 72, color: "ef4444", stadium: 2859, country: "CRO", rep: 67, fanBase: 30000, currentBudget: 750000 },
  { id: 723, name: "MRK Kozala", tier: 2, baseOvr: 72, color: "0369a1", stadium: 1100, country: "CRO", rep: 66, fanBase: 28667, currentBudget: 720000 },
  { id: 724, name: "RK Maksimir Pastela", tier: 2, baseOvr: 71, color: "1e40af", stadium: 2009, country: "CRO", rep: 67, fanBase: 30667, currentBudget: 760000 },
  { id: 725, name: "RK Senj", tier: 2, baseOvr: 70, color: "dc2626", stadium: 2718, country: "CRO", rep: 65, fanBase: 25333, currentBudget: 680000 },
  { id: 726, name: "RK Rovinj", tier: 2, baseOvr: 70, color: "facc15", stadium: 1100, country: "CRO", rep: 65, fanBase: 26000, currentBudget: 690000 },
  { id: 727, name: "MRK Vidovec", tier: 2, baseOvr: 69, color: "2563eb", stadium: 900, country: "CRO", rep: 63, fanBase: 21333, currentBudget: 610000 },
  { id: 728, name: "RK Požega", tier: 2, baseOvr: 69, color: "15803d", stadium: 1200, country: "CRO", rep: 63, fanBase: 22000, currentBudget: 620000 },

  // TIER 3 (2. HRL) - 10 Clubs
  { id: 729, name: "RK Spačva Vinkovci", tier: 3, baseOvr: 66, color: "1d4ed8", stadium: 800, country: "CRO", rep: 59, fanBase: 19333, currentBudget: 800000 },
  { id: 730, name: "RK Bjelovar", tier: 3, baseOvr: 66, color: "dc2626", stadium: 900, country: "CRO", rep: 58, fanBase: 18000, currentBudget: 750000 },
  { id: 731, name: "RK Slavonski Brod", tier: 3, baseOvr: 65, color: "ef4444", stadium: 1626, country: "CRO", rep: 57, fanBase: 16667, currentBudget: 680000 },
  { id: 732, name: "RK Koprivnica", tier: 3, baseOvr: 65, color: "ffffff", stadium: 750, country: "CRO", rep: 56, fanBase: 15333, currentBudget: 620000 },
  { id: 733, name: "RK Šibenik", tier: 3, baseOvr: 64, color: "ea580c", stadium: 850, country: "CRO", rep: 55, fanBase: 14000, currentBudget: 580000 },
  { id: 734, name: "RK Makarska", tier: 3, baseOvr: 64, color: "2563eb", stadium: 700, country: "CRO", rep: 54, fanBase: 12667, currentBudget: 530000 },
  { id: 735, name: "RK Gospić", tier: 3, baseOvr: 63, color: "15803d", stadium: 650, country: "CRO", rep: 53, fanBase: 11667, currentBudget: 490000 },
  { id: 736, name: "RK Knin", tier: 3, baseOvr: 62, color: "0284c7", stadium: 600, country: "CRO", rep: 52, fanBase: 10667, currentBudget: 450000 },
  { id: 737, name: "RK Kamičak Sinj", tier: 3, baseOvr: 62, color: "b91c1c", stadium: 550, country: "CRO", rep: 51, fanBase: 10000, currentBudget: 420000 },
  { id: 738, name: "RK Hrvatski Dragovoljac", tier: 3, baseOvr: 61, color: "1e40af", stadium: 500, country: "CRO", rep: 50, fanBase: 9333, currentBudget: 390000 },

  // TIER 4 (3. HRL) - 10 Clubs
  { id: 739, name: "RK Solin", tier: 4, baseOvr: 59, color: "2563eb", stadium: 450, country: "CRO", rep: 45, fanBase: 6000, currentBudget: 240000 },
  { id: 740, name: "RK Imotski", tier: 4, baseOvr: 58, color: "dc2626", stadium: 400, country: "CRO", rep: 44, fanBase: 5667, currentBudget: 220000 },
  { id: 741, name: "RK Pazin", tier: 4, baseOvr: 58, color: "1d4ed8", stadium: 350, country: "CRO", rep: 43, fanBase: 5333, currentBudget: 200000 },
  { id: 742, name: "RK Mladi Rudar Labin", tier: 4, baseOvr: 57, color: "16a34a", stadium: 500, country: "CRO", rep: 42, fanBase: 5000, currentBudget: 190000 },
  { id: 743, name: "RK Buzet", tier: 4, baseOvr: 57, color: "ea580c", stadium: 300, country: "CRO", rep: 41, fanBase: 4667, currentBudget: 170000 },
  { id: 744, name: "RK Buje", tier: 4, baseOvr: 56, color: "0284c7", stadium: 250, country: "CRO", rep: 40, fanBase: 4333, currentBudget: 160000 },
  { id: 745, name: "RK Mornar Crikvenica", tier: 4, baseOvr: 56, color: "ef4444", stadium: 350, country: "CRO", rep: 39, fanBase: 4000, currentBudget: 150000 },
  { id: 746, name: "RK Goranin Delnice", tier: 4, baseOvr: 55, color: "1e40af", stadium: 200, country: "CRO", rep: 38, fanBase: 3667, currentBudget: 140000 },
  { id: 747, name: "RK Otočac", tier: 4, baseOvr: 55, color: "15803d", stadium: 250, country: "CRO", rep: 37, fanBase: 3467, currentBudget: 130000 },
  { id: 748, name: "RK Ogulin", tier: 4, baseOvr: 54, color: "facc15", stadium: 300, country: "CRO", rep: 36, fanBase: 3267, currentBudget: 120000 },

  // TIER 5 (Županijska liga) - 10 Clubs
  { id: 749, name: "RK Krk", tier: 5, baseOvr: 51, color: "2563eb", stadium: 200, country: "CRO", rep: 30, fanBase: 2133, currentBudget: 75000 },
  { id: 750, name: "RK Rab", tier: 5, baseOvr: 50, color: "b91c1c", stadium: 150, country: "CRO", rep: 29, fanBase: 2000, currentBudget: 70000 },
  { id: 751, name: "RK Mali Lošinj", tier: 5, baseOvr: 50, color: "16a34a", stadium: 200, country: "CRO", rep: 28, fanBase: 1867, currentBudget: 65000 },
  { id: 752, name: "RK Pag", tier: 5, baseOvr: 49, color: "eab308", stadium: 150, country: "CRO", rep: 27, fanBase: 1667, currentBudget: 60000 },
  { id: 753, name: "RK Novigrad", tier: 5, baseOvr: 49, color: "1d4ed8", stadium: 250, country: "CRO", rep: 26, fanBase: 1467, currentBudget: 55000 },
  { id: 754, name: "RK Biograd", tier: 5, baseOvr: 48, color: "ffffff", stadium: 150, country: "CRO", rep: 25, fanBase: 1333, currentBudget: 50000 },
  { id: 755, name: "RK Vodice", tier: 5, baseOvr: 48, color: "7f1d1d", stadium: 200, country: "CRO", rep: 24, fanBase: 1200, currentBudget: 45000 },
  { id: 756, name: "RK Murter", tier: 5, baseOvr: 47, color: "0284c7", stadium: 100, country: "CRO", rep: 23, fanBase: 1067, currentBudget: 40000 },
  { id: 757, name: "RK Primošten", tier: 5, baseOvr: 47, color: "ea580c", stadium: 120, country: "CRO", rep: 22, fanBase: 1000, currentBudget: 35000 },
  { id: 758, name: "RK Hvar", tier: 5, baseOvr: 46, color: "15803d", stadium: 150, country: "CRO", rep: 21, fanBase: 1000, currentBudget: 30000 }
];

// ============================================================================
// 7. PORTUGAL (POR) - Campeonato Placard Andebol 1 & Divisão de Honra
// ============================================================================
export const PORTUGAL_HANDBALL_CLUBS: Club[] = [
  // Tier 1 (12 Clubs) - B Teams filtered out!
  { id: 201, name: "Sporting CP", tier: 1, baseOvr: 91, color: "008057", color2: "ffffff", stadium: 4863, country: "POR", rep: 91, fanBase: 253333, currentBudget: 6800000 },
  { id: 202, name: "FC Porto", tier: 1, baseOvr: 88, color: "0054a6", color2: "ffffff", stadium: 2177, country: "POR", rep: 89, fanBase: 226667, currentBudget: 5900000 },
  { id: 203, name: "SL Benfica", tier: 1, baseOvr: 87, color: "e1000f", color2: "ffffff", stadium: 2400, country: "POR", rep: 88, fanBase: 233333, currentBudget: 5600000 },
  { id: 204, name: "ABC Braga", tier: 1, baseOvr: 83, color: "eab308", color2: "000000", stadium: 1500, country: "POR", rep: 83, fanBase: 110000, currentBudget: 2800000 },
  { id: 205, name: "Águas Santas", tier: 1, baseOvr: 82, color: "2563eb", color2: "000000", stadium: 1200, country: "POR", rep: 80, fanBase: 83333, currentBudget: 2200000 },
  { id: 206, name: "Marítimo da Madeira", tier: 1, baseOvr: 81, color: "dc2626", color2: "008057", stadium: 1500, country: "POR", rep: 79, fanBase: 73333, currentBudget: 1950000 },
  { id: 207, name: "CF Os Belenenses", tier: 1, baseOvr: 81, color: "1d4ed8", color2: "ffffff", stadium: 1500, country: "POR", rep: 80, fanBase: 80000, currentBudget: 2050000 },
  { id: 208, name: "Póvoa AC", tier: 1, baseOvr: 80, color: "facc15", color2: "000000", stadium: 1200, country: "POR", rep: 77, fanBase: 63333, currentBudget: 1750000 },
  { id: 209, name: "Artística de Avanca", tier: 1, baseOvr: 79, color: "0284c7", color2: "ffffff", stadium: 4018, country: "POR", rep: 76, fanBase: 58667, currentBudget: 1600000 },
  { id: 210, name: "Vitória SC", tier: 1, baseOvr: 79, color: "15803d", color2: "000000", stadium: 1800, country: "POR", rep: 76, fanBase: 61333, currentBudget: 1650000 },
  { id: 211, name: "FC Gaia", tier: 1, baseOvr: 78, color: "ffffff", color2: "000000", stadium: 5559, country: "POR", rep: 74, fanBase: 54000, currentBudget: 1450000 },
  { id: 212, name: "Vitória FC", tier: 1, baseOvr: 78, color: "008000", color2: "ffffff", stadium: 1500, country: "POR", rep: 76, fanBase: 65333, currentBudget: 1550000 },

  // Tier 2 (12 Clubs)
  { id: 213, name: "Boavista FC", tier: 2, baseOvr: 76, color: "000000", stadium: 1500, country: "POR", rep: 74, fanBase: 52000, currentBudget: 1250000 },
  { id: 214, name: "São Bernardo", tier: 2, baseOvr: 75, color: "ffffff", stadium: 1500, country: "POR", rep: 73, fanBase: 47333, currentBudget: 1150000 },
  { id: 215, name: "Boa-Hora FC", tier: 2, baseOvr: 75, color: "16a34a", stadium: 2352, country: "POR", rep: 71, fanBase: 43333, currentBudget: 1050000 },
  { id: 216, name: "AD Sanjoanense", tier: 2, baseOvr: 74, color: "000000", stadium: 1200, country: "POR", rep: 70, fanBase: 40667, currentBudget: 980000 },
  { id: 217, name: "Alto do Moinho", tier: 2, baseOvr: 73, color: "0284c7", stadium: 2200, country: "POR", rep: 68, fanBase: 34667, currentBudget: 890000 },
  { id: 218, name: "Xico Andebol", tier: 2, baseOvr: 73, color: "dc2626", stadium: 1200, country: "POR", rep: 69, fanBase: 37333, currentBudget: 920000 },
  { id: 219, name: "AC Fafe", tier: 2, baseOvr: 72, color: "facc15", stadium: 1200, country: "POR", rep: 67, fanBase: 32000, currentBudget: 840000 },
  { id: 220, name: "Académico de Viseu", tier: 2, baseOvr: 72, color: "18181b", stadium: 1500, country: "POR", rep: 68, fanBase: 34667, currentBudget: 870000 },
  { id: 221, name: "Nazaré Dom Fuas", tier: 2, baseOvr: 71, color: "eab308", stadium: 2406, country: "POR", rep: 66, fanBase: 29333, currentBudget: 790000 },
  { id: 222, name: "GC Santo Tirso", tier: 2, baseOvr: 71, color: "ef4444", stadium: 2345, country: "POR", rep: 65, fanBase: 28000, currentBudget: 760000 },
  { id: 223, name: "Almada AC", tier: 2, baseOvr: 70, color: "2563eb", stadium: 2152, country: "POR", rep: 64, fanBase: 26000, currentBudget: 720000 },
  { id: 224, name: "Vela de Tavira", tier: 2, baseOvr: 69, color: "15803d", stadium: 800, country: "POR", rep: 63, fanBase: 22667, currentBudget: 650000 },

  // TIER 3 (2ª Divisão) - 10 Clubs
  { id: 225, name: "Ginásio Clube do Sul", tier: 3, baseOvr: 66, color: "15803d", stadium: 800, country: "POR", rep: 60, fanBase: 650, currentBudget: 850000 },
  { id: 226, name: "Louletano DC", tier: 3, baseOvr: 66, color: "dc2626", stadium: 750, country: "POR", rep: 59, fanBase: 600, currentBudget: 800000 },
  { id: 227, name: "Portimonense SC", tier: 3, baseOvr: 65, color: "1d4ed8", stadium: 900, country: "POR", rep: 58, fanBase: 700, currentBudget: 750000 },
  { id: 228, name: "CD Beja", tier: 3, baseOvr: 65, color: "ffffff", stadium: 700, country: "POR", rep: 57, fanBase: 550, currentBudget: 680000 },
  { id: 229, name: "Évora AC", tier: 3, baseOvr: 64, color: "facc15", stadium: 850, country: "POR", rep: 56, fanBase: 620, currentBudget: 620000 },
  { id: 230, name: "Portalegre AC", tier: 3, baseOvr: 64, color: "16a34a", stadium: 650, country: "POR", rep: 55, fanBase: 500, currentBudget: 580000 },
  { id: 231, name: "AD Castelo Branco", tier: 3, baseOvr: 63, color: "ef4444", stadium: 750, country: "POR", rep: 54, fanBase: 550, currentBudget: 530000 },
  { id: 232, name: "Guarda Unida", tier: 3, baseOvr: 62, color: "2563eb", stadium: 600, country: "POR", rep: 53, fanBase: 450, currentBudget: 490000 },
  { id: 233, name: "CA Bragança", tier: 3, baseOvr: 62, color: "eab308", stadium: 550, country: "POR", rep: 52, fanBase: 420, currentBudget: 450000 },
  { id: 234, name: "BC Vila Real", tier: 3, baseOvr: 61, color: "15803d", stadium: 600, country: "POR", rep: 51, fanBase: 450, currentBudget: 410000 },

  // TIER 4 (3ª Divisão) - 10 Clubs
  { id: 235, name: "GD Chaves", tier: 4, baseOvr: 59, color: "b91c1c", stadium: 500, country: "POR", rep: 46, fanBase: 350, currentBudget: 250000 },
  { id: 236, name: "SC Mirandela", tier: 4, baseOvr: 58, color: "ffffff", stadium: 450, country: "POR", rep: 45, fanBase: 300, currentBudget: 230000 },
  { id: 237, name: "Macedo de Cavaleiros", tier: 4, baseOvr: 58, color: "ea580c", stadium: 400, country: "POR", rep: 44, fanBase: 280, currentBudget: 210000 },
  { id: 238, name: "Lamego AC", tier: 4, baseOvr: 57, color: "facc15", stadium: 350, country: "POR", rep: 43, fanBase: 250, currentBudget: 190000 },
  { id: 239, name: "Tarouca AC", tier: 4, baseOvr: 57, color: "1d4ed8", stadium: 300, country: "POR", rep: 42, fanBase: 220, currentBudget: 180000 },
  { id: 240, name: "Moimenta da Beira", tier: 4, baseOvr: 56, color: "16a34a", stadium: 250, country: "POR", rep: 41, fanBase: 200, currentBudget: 170000 },
  { id: 241, name: "Armamar AC", tier: 4, baseOvr: 56, color: "ef4444", stadium: 200, country: "POR", rep: 40, fanBase: 180, currentBudget: 160000 },
  { id: 242, name: "Penedono AC", tier: 4, baseOvr: 55, color: "0284c7", stadium: 180, country: "POR", rep: 39, fanBase: 150, currentBudget: 150000 },
  { id: 243, name: "Sernancelhe AC", tier: 4, baseOvr: 55, color: "eab308", stadium: 150, country: "POR", rep: 38, fanBase: 130, currentBudget: 140000 },
  { id: 244, name: "Tabuaço AC", tier: 4, baseOvr: 54, color: "15803d", stadium: 200, country: "POR", rep: 37, fanBase: 160, currentBudget: 130000 },

  // TIER 5 (Ligas Regionais) - 10 Clubs
  { id: 245, name: "Vagos SC", tier: 5, baseOvr: 52, color: "2563eb", stadium: 150, country: "POR", rep: 31, fanBase: 120, currentBudget: 80000 },
  { id: 246, name: "Ílhavo AC", tier: 5, baseOvr: 51, color: "facc15", stadium: 120, country: "POR", rep: 30, fanBase: 100, currentBudget: 75000 },
  { id: 247, name: "Ovar AC", tier: 5, baseOvr: 51, color: "16a34a", stadium: 200, country: "POR", rep: 29, fanBase: 140, currentBudget: 70000 },
  { id: 248, name: "Murtosa AC", tier: 5, baseOvr: 50, color: "dc2626", stadium: 150, country: "POR", rep: 28, fanBase: 110, currentBudget: 65000 },
  { id: 249, name: "Esmoriz GC", tier: 5, baseOvr: 50, color: "1d4ed8", stadium: 180, country: "POR", rep: 27, fanBase: 130, currentBudget: 60000 },
  { id: 250, name: "SC Espinho", tier: 5, baseOvr: 49, color: "18181b", stadium: 250, country: "POR", rep: 26, fanBase: 150, currentBudget: 55000 },
  { id: 251, name: "Feirense B", tier: 5, baseOvr: 49, color: "0284c7", stadium: 200, country: "POR", rep: 25, fanBase: 130, currentBudget: 50000 },
  { id: 252, name: "AD Sanjoanense B", tier: 5, baseOvr: 48, color: "ef4444", stadium: 150, country: "POR", rep: 24, fanBase: 100, currentBudget: 45000 },
  { id: 253, name: "AD Vagos", tier: 5, baseOvr: 48, color: "1e40af", stadium: 120, country: "POR", rep: 23, fanBase: 90, currentBudget: 40000 },
  { id: 254, name: "FC Arouca", tier: 5, baseOvr: 47, color: "15803d", stadium: 100, country: "POR", rep: 22, fanBase: 80, currentBudget: 35000 }
];

// ============================================================================
// 8. NORWAY (NOR) - REMA 1000-ligaen & 1. divisjon
// ============================================================================
export const NORWAY_HANDBALL_CLUBS: Club[] = [
  // Tier 1 (14 Clubs)
  { id: 801, name: "Kolstad Håndball", tier: 1, baseOvr: 90, color: "dc2626", color2: "ffffff", stadium: 8900, country: "NOR", rep: 91, fanBase: 233333, currentBudget: 7200000 },
  { id: 802, name: "Elverum Håndball", tier: 1, baseOvr: 87, color: "000000", color2: "ffffff", stadium: 2500, country: "NOR", rep: 88, fanBase: 173333, currentBudget: 4600000 },
  { id: 803, name: "Drammen HK", tier: 1, baseOvr: 84, color: "2563eb", color2: "ffffff", stadium: 4200, country: "NOR", rep: 84, fanBase: 120000, currentBudget: 3400000 },
  { id: 804, name: "Runar Sandefjord", tier: 1, baseOvr: 84, color: "ffffff", color2: "000000", stadium: 2500, country: "NOR", rep: 83, fanBase: 116667, currentBudget: 3300000 },
  { id: 805, name: "ØIF Arendal", tier: 1, baseOvr: 83, color: "991b1b", color2: "000000", stadium: 2500, country: "NOR", rep: 82, fanBase: 106667, currentBudget: 3100000 },
  { id: 806, name: "Nærbø IL", tier: 1, baseOvr: 82, color: "0284c7", color2: "ffffff", stadium: 1800, country: "NOR", rep: 80, fanBase: 90000, currentBudget: 2700000 },
  { id: 807, name: "Bergen Håndball", tier: 1, baseOvr: 81, color: "ea580c", color2: "000000", stadium: 2200, country: "NOR", rep: 79, fanBase: 86667, currentBudget: 2600000 },
  { id: 808, name: "Haslum HK", tier: 1, baseOvr: 81, color: "dc2626", color2: "ffffff", stadium: 1500, country: "NOR", rep: 80, fanBase: 93333, currentBudget: 2800000 },
  { id: 809, name: "Halden Topphåndball", tier: 1, baseOvr: 80, color: "1d4ed8", color2: "ffffff", stadium: 1600, country: "NOR", rep: 78, fanBase: 76667, currentBudget: 2400000 },
  { id: 810, name: "Kristiansand Topphåndball", tier: 1, baseOvr: 80, color: "0369a1", color2: "ffffff", stadium: 2100, country: "NOR", rep: 77, fanBase: 73333, currentBudget: 2300000 },
  { id: 811, name: "Bækkelaget Håndball Elite", tier: 1, baseOvr: 79, color: "facc15", color2: "000000", stadium: 1500, country: "NOR", rep: 78, fanBase: 83333, currentBudget: 2500000 },
  { id: 812, name: "Sandnes HK", tier: 1, baseOvr: 78, color: "38bdf8", color2: "ffffff", stadium: 1200, country: "NOR", rep: 75, fanBase: 61333, currentBudget: 2000000 },
  { id: 813, name: "Follo HK", tier: 1, baseOvr: 78, color: "ef4444", color2: "ffffff", stadium: 1500, country: "NOR", rep: 74, fanBase: 58667, currentBudget: 1900000 },
  { id: 814, name: "Fjellhammer IL", tier: 1, baseOvr: 77, color: "15803d", color2: "ffffff", stadium: 3870, country: "NOR", rep: 74, fanBase: 57333, currentBudget: 1850000 },

  // Tier 2 (12 Clubs)
  { id: 815, name: "Viking TIF", tier: 2, baseOvr: 76, color: "7c3aed", stadium: 1800, country: "NOR", rep: 73, fanBase: 50667, currentBudget: 1550000 },
  { id: 816, name: "Ryger Stavanger", tier: 2, baseOvr: 76, color: "1d4ed8", stadium: 2500, country: "NOR", rep: 74, fanBase: 54667, currentBudget: 1650000 },
  { id: 817, name: "Sandefjord Håndball", tier: 2, baseOvr: 75, color: "0284c7", stadium: 2757, country: "NOR", rep: 72, fanBase: 46667, currentBudget: 1450000 },
  { id: 818, name: "Falk Horten", tier: 2, baseOvr: 74, color: "dc2626", stadium: 1500, country: "NOR", rep: 71, fanBase: 42667, currentBudget: 1350000 },
  { id: 819, name: "Melhus IL", tier: 2, baseOvr: 73, color: "eab308", stadium: 2991, country: "NOR", rep: 68, fanBase: 34000, currentBudget: 1150000 },
  { id: 820, name: "Bodø HK", tier: 2, baseOvr: 73, color: "2563eb", stadium: 2792, country: "NOR", rep: 70, fanBase: 39333, currentBudget: 1250000 },
  { id: 821, name: "Charlottenlund SK", tier: 2, baseOvr: 72, color: "ec4899", stadium: 1100, country: "NOR", rep: 67, fanBase: 31333, currentBudget: 1050000 },
  { id: 822, name: "OSI Håndball", tier: 2, baseOvr: 71, color: "000000", stadium: 800, country: "NOR", rep: 66, fanBase: 28000, currentBudget: 950000 },
  { id: 823, name: "Grenland Topphåndball", tier: 2, baseOvr: 71, color: "0369a1", stadium: 1200, country: "NOR", rep: 66, fanBase: 28667, currentBudget: 980000 },
  { id: 824, name: "Tromsø HK", tier: 2, baseOvr: 70, color: "ffffff", stadium: 1500, country: "NOR", rep: 65, fanBase: 26667, currentBudget: 920000 },
  { id: 825, name: "HK Herulf Moss", tier: 2, baseOvr: 69, color: "16a34a", stadium: 2341, country: "NOR", rep: 64, fanBase: 24000, currentBudget: 850000 },
  { id: 826, name: "Urædd Håndball", tier: 2, baseOvr: 69, color: "18181b", stadium: 2489, country: "NOR", rep: 63, fanBase: 22667, currentBudget: 810000 },

  // TIER 3 (2. divisjon) - 10 Clubs
  { id: 827, name: "Lillestrøm HK", tier: 3, baseOvr: 66, color: "dc2626", stadium: 800, country: "NOR", rep: 59, fanBase: 18667, currentBudget: 800000 },
  { id: 828, name: "Gjøvik HK", tier: 3, baseOvr: 66, color: "1d4ed8", stadium: 700, country: "NOR", rep: 58, fanBase: 17333, currentBudget: 750000 },
  { id: 829, name: "Lillehammer Faaberg Håndball", tier: 3, baseOvr: 65, color: "ffffff", stadium: 900, country: "NOR", rep: 57, fanBase: 16000, currentBudget: 680000 },
  { id: 830, name: "Hamar IL", tier: 3, baseOvr: 65, color: "15803d", stadium: 750, country: "NOR", rep: 56, fanBase: 14667, currentBudget: 620000 },
  { id: 831, name: "Alta IF", tier: 3, baseOvr: 64, color: "facc15", stadium: 650, country: "NOR", rep: 55, fanBase: 13333, currentBudget: 580000 },
  { id: 832, name: "Harstad HK", tier: 3, baseOvr: 64, color: "2563eb", stadium: 600, country: "NOR", rep: 54, fanBase: 12667, currentBudget: 530000 },
  { id: 833, name: "Narvik HK", tier: 3, baseOvr: 63, color: "ef4444", stadium: 550, country: "NOR", rep: 53, fanBase: 11667, currentBudget: 490000 },
  { id: 834, name: "Kongsvinger IL", tier: 3, baseOvr: 62, color: "16a34a", stadium: 500, country: "NOR", rep: 52, fanBase: 10667, currentBudget: 450000 },
  { id: 835, name: "Notodden HB", tier: 3, baseOvr: 62, color: "0284c7", stadium: 450, country: "NOR", rep: 51, fanBase: 10000, currentBudget: 420000 },
  { id: 836, name: "Kongsberg HK", tier: 3, baseOvr: 61, color: "ffffff", stadium: 400, country: "NOR", rep: 50, fanBase: 9333, currentBudget: 390000 },

  // TIER 4 (3. divisjon) - 10 Clubs
  { id: 837, name: "Herkules Håndball", tier: 4, baseOvr: 59, color: "18181b", stadium: 350, country: "NOR", rep: 45, fanBase: 6000, currentBudget: 240000 },
  { id: 838, name: "ØIF Arendal 2", tier: 4, baseOvr: 58, color: "991b1b", stadium: 300, country: "NOR", rep: 44, fanBase: 5667, currentBudget: 220000 },
  { id: 839, name: "Grimstad HK", tier: 4, baseOvr: 58, color: "1d4ed8", stadium: 350, country: "NOR", rep: 43, fanBase: 5333, currentBudget: 200000 },
  { id: 840, name: "Mandal IL", tier: 4, baseOvr: 57, color: "ea580c", stadium: 250, country: "NOR", rep: 42, fanBase: 5000, currentBudget: 190000 },
  { id: 841, name: "Farsund IL", tier: 4, baseOvr: 57, color: "15803d", stadium: 200, country: "NOR", rep: 41, fanBase: 4667, currentBudget: 170000 },
  { id: 842, name: "Flekkefjord HK", tier: 4, baseOvr: 56, color: "facc15", stadium: 220, country: "NOR", rep: 40, fanBase: 4333, currentBudget: 160000 },
  { id: 843, name: "Egersund IK", tier: 4, baseOvr: 56, color: "ef4444", stadium: 300, country: "NOR", rep: 39, fanBase: 4000, currentBudget: 150000 },
  { id: 844, name: "Bryne HK", tier: 4, baseOvr: 55, color: "ffffff", stadium: 280, country: "NOR", rep: 38, fanBase: 3667, currentBudget: 140000 },
  { id: 845, name: "Haugaland HK", tier: 4, baseOvr: 55, color: "2563eb", stadium: 350, country: "NOR", rep: 37, fanBase: 3467, currentBudget: 130000 },
  { id: 846, name: "Kopervik IL", tier: 4, baseOvr: 54, color: "16a34a", stadium: 200, country: "NOR", rep: 36, fanBase: 3267, currentBudget: 120000 },

  // TIER 5 (4. divisjon) - 10 Clubs
  { id: 847, name: "Stord IL", tier: 5, baseOvr: 51, color: "dc2626", stadium: 150, country: "NOR", rep: 30, fanBase: 2133, currentBudget: 75000 },
  { id: 848, name: "Leirvik HK", tier: 5, baseOvr: 50, color: "1d4ed8", stadium: 100, country: "NOR", rep: 29, fanBase: 2000, currentBudget: 70000 },
  { id: 849, name: "Odda IL", tier: 5, baseOvr: 50, color: "15803d", stadium: 120, country: "NOR", rep: 28, fanBase: 1867, currentBudget: 65000 },
  { id: 850, name: "Voss HK", tier: 5, baseOvr: 49, color: "eab308", stadium: 150, country: "NOR", rep: 27, fanBase: 1667, currentBudget: 60000 },
  { id: 851, name: "Ål IL", tier: 5, baseOvr: 49, color: "ef4444", stadium: 100, country: "NOR", rep: 26, fanBase: 1467, currentBudget: 55000 },
  { id: 852, name: "Geilo IL", tier: 5, baseOvr: 48, color: "0284c7", stadium: 150, country: "NOR", rep: 25, fanBase: 1333, currentBudget: 50000 },
  { id: 853, name: "Gol IL", tier: 5, baseOvr: 48, color: "16a34a", stadium: 100, country: "NOR", rep: 24, fanBase: 1200, currentBudget: 45000 },
  { id: 854, name: "Nesbyen IL", tier: 5, baseOvr: 47, color: "ea580c", stadium: 120, country: "NOR", rep: 23, fanBase: 1067, currentBudget: 40000 },
  { id: 855, name: "Flå IL", tier: 5, baseOvr: 47, color: "facc15", stadium: 80, country: "NOR", rep: 22, fanBase: 1000, currentBudget: 35000 },
  { id: 856, name: "Hemsedal IL", tier: 5, baseOvr: 46, color: "b91c1c", stadium: 100, country: "NOR", rep: 21, fanBase: 1000, currentBudget: 30000 }
];

// ============================================================================
// 9. HUNGARY (HUN) - K&H Férfi Kézilabda Liga (NB I) & NB I/B
// ============================================================================
export const HUNGARY_HANDBALL_CLUBS: Club[] = [
  // Tier 1 (14 Clubs)
  { id: 901, name: "Veszprém KC", tier: 1, baseOvr: 93, color: "e2001a", color2: "ffffff", stadium: 5096, country: "HUN", rep: 94, fanBase: 340000, currentBudget: 12000000 },
  { id: 902, name: "OTP Bank - Pick Szeged", tier: 1, baseOvr: 91, color: "0055a4", color2: "ffffff", stadium: 8143, country: "HUN", rep: 92, fanBase: 300000, currentBudget: 9800000 },
  { id: 903, name: "MOL Tatabánya KC", tier: 1, baseOvr: 85, color: "0284c7", color2: "ffffff", stadium: 6000, country: "HUN", rep: 85, fanBase: 146667, currentBudget: 4200000 },
  { id: 904, name: "Ferencvárosi TC", tier: 1, baseOvr: 84, color: "15803d", color2: "ffffff", stadium: 1300, country: "HUN", rep: 86, fanBase: 186667, currentBudget: 4500000 },
  { id: 905, name: "Balatonfüredi KSE", tier: 1, baseOvr: 83, color: "facc15", color2: "000000", stadium: 1500, country: "HUN", rep: 81, fanBase: 100000, currentBudget: 3200000 },
  { id: 906, name: "HE-DO B. Braun Gyöngyös", tier: 1, baseOvr: 82, color: "eab308", color2: "000000", stadium: 1500, country: "HUN", rep: 79, fanBase: 83333, currentBudget: 2700000 },
  { id: 907, name: "Csurgói KK", tier: 1, baseOvr: 81, color: "ef4444", color2: "ffffff", stadium: 1200, country: "HUN", rep: 78, fanBase: 76667, currentBudget: 2500000 },
  { id: 908, name: "Dabas KC", tier: 1, baseOvr: 80, color: "b91c1c", color2: "ffffff", stadium: 2500, country: "HUN", rep: 77, fanBase: 70000, currentBudget: 2300000 },
  { id: 909, name: "Sport36-Komló", tier: 1, baseOvr: 80, color: "2563eb", color2: "ffffff", stadium: 4824, country: "HUN", rep: 76, fanBase: 65333, currentBudget: 2200000 },
  { id: 910, name: "NEKA", tier: 1, baseOvr: 79, color: "0369a1", color2: "ffffff", stadium: 5113, country: "HUN", rep: 75, fanBase: 59333, currentBudget: 2000000 },
  { id: 911, name: "Budakalász KZRT", tier: 1, baseOvr: 79, color: "dc2626", color2: "ffffff", stadium: 4462, country: "HUN", rep: 74, fanBase: 56000, currentBudget: 1900000 },
  { id: 912, name: "PLER-Budapest", tier: 1, baseOvr: 78, color: "facc15", color2: "000000", stadium: 5022, country: "HUN", rep: 75, fanBase: 58667, currentBudget: 1950000 },
  { id: 913, name: "ETO University HT", tier: 1, baseOvr: 78, color: "16a34a", color2: "ffffff", stadium: 5500, country: "HUN", rep: 77, fanBase: 73333, currentBudget: 2400000 },
  { id: 914, name: "QHB Eger", tier: 1, baseOvr: 77, color: "b91c1c", color2: "ffffff", stadium: 1200, country: "HUN", rep: 73, fanBase: 50667, currentBudget: 1750000 },

  // Tier 2 (12 Clubs)
  { id: 915, name: "Veszprém FA", tier: 2, baseOvr: 76, color: "ef4444", stadium: 1500, country: "HUN", rep: 73, fanBase: 49333, currentBudget: 1600000 },
  { id: 916, name: "Ceglédi KKSE", tier: 2, baseOvr: 75, color: "2563eb", stadium: 1200, country: "HUN", rep: 72, fanBase: 45333, currentBudget: 1450000 },
  { id: 917, name: "Békési FKC", tier: 2, baseOvr: 74, color: "7e22ce", stadium: 2238, country: "HUN", rep: 70, fanBase: 39333, currentBudget: 1300000 },
  { id: 918, name: "DEAC", tier: 2, baseOvr: 74, color: "000000", stadium: 1500, country: "HUN", rep: 71, fanBase: 43333, currentBudget: 1400000 },
  { id: 919, name: "Százhalombattai KE", tier: 2, baseOvr: 73, color: "15803d", stadium: 2150, country: "HUN", rep: 68, fanBase: 34000, currentBudget: 1150000 },
  { id: 920, name: "Tatai AC", tier: 2, baseOvr: 73, color: "0284c7", stadium: 2049, country: "HUN", rep: 68, fanBase: 32667, currentBudget: 1100000 },
  { id: 921, name: "Szigetszentmiklósi KSK", tier: 2, baseOvr: 72, color: "dc2626", stadium: 2067, country: "HUN", rep: 67, fanBase: 30667, currentBudget: 1050000 },
  { id: 922, name: "Salgótarjáni SKC", tier: 2, baseOvr: 72, color: "1d4ed8", stadium: 1200, country: "HUN", rep: 66, fanBase: 29333, currentBudget: 1000000 },
  { id: 923, name: "Vecsés SE", tier: 2, baseOvr: 71, color: "ef4444", stadium: 800, country: "HUN", rep: 65, fanBase: 26667, currentBudget: 920000 },
  { id: 924, name: "Mezőkövesdi KC", tier: 2, baseOvr: 71, color: "facc15", stadium: 2621, country: "HUN", rep: 66, fanBase: 28000, currentBudget: 960000 },
  { id: 925, name: "Ózdi KC", tier: 2, baseOvr: 70, color: "b91c1c", stadium: 2612, country: "HUN", rep: 64, fanBase: 24000, currentBudget: 850000 },
  { id: 926, name: "Ajka KSE", tier: 2, baseOvr: 69, color: "16a34a", stadium: 800, country: "HUN", rep: 63, fanBase: 21333, currentBudget: 780000 },

  // TIER 3 (NB II) - 10 Clubs
  { id: 927, name: "Pécsi VSE", tier: 3, baseOvr: 66, color: "b91c1c", stadium: 900, country: "HUN", rep: 59, fanBase: 19333, currentBudget: 800000 },
  { id: 928, name: "Miskolci VSC", tier: 3, baseOvr: 66, color: "facc15", stadium: 850, country: "HUN", rep: 58, fanBase: 18000, currentBudget: 750000 },
  { id: 929, name: "Alba Regia KSE", tier: 3, baseOvr: 65, color: "1d4ed8", stadium: 800, country: "HUN", rep: 57, fanBase: 16667, currentBudget: 680000 },
  { id: 930, name: "Váci KSE", tier: 3, baseOvr: 65, color: "ef4444", stadium: 750, country: "HUN", rep: 56, fanBase: 15333, currentBudget: 620000 },
  { id: 931, name: "Békéscsabai BDSK", tier: 3, baseOvr: 64, color: "7e22ce", stadium: 700, country: "HUN", rep: 55, fanBase: 14000, currentBudget: 580000 },
  { id: 932, name: "Szolnoki KC", tier: 3, baseOvr: 64, color: "2563eb", stadium: 850, country: "HUN", rep: 54, fanBase: 12667, currentBudget: 530000 },
  { id: 933, name: "Nyíregyházi SN", tier: 3, baseOvr: 63, color: "dc2626", stadium: 800, country: "HUN", rep: 53, fanBase: 11667, currentBudget: 490000 },
  { id: 934, name: "Kaposvári SE", tier: 3, baseOvr: 62, color: "15803d", stadium: 750, country: "HUN", rep: 52, fanBase: 10667, currentBudget: 450000 },
  { id: 935, name: "Zalaegerszegi TE", tier: 3, baseOvr: 62, color: "0284c7", stadium: 700, country: "HUN", rep: 51, fanBase: 10000, currentBudget: 420000 },
  { id: 936, name: "Soproni KC", tier: 3, baseOvr: 61, color: "7f1d1d", stadium: 650, country: "HUN", rep: 50, fanBase: 9333, currentBudget: 390000 },

  // TIER 4 (NB III / Regional) - 10 Clubs
  { id: 937, name: "Esztergomi KSE", tier: 4, baseOvr: 59, color: "16a34a", stadium: 450, country: "HUN", rep: 45, fanBase: 6000, currentBudget: 240000 },
  { id: 938, name: "Kecskeméti TE", tier: 4, baseOvr: 58, color: "9333ea", stadium: 500, country: "HUN", rep: 44, fanBase: 5667, currentBudget: 220000 },
  { id: 939, name: "Bajai KSE", tier: 4, baseOvr: 58, color: "1e40af", stadium: 400, country: "HUN", rep: 43, fanBase: 5333, currentBudget: 200000 },
  { id: 940, name: "Szekszárdi FGKC", tier: 4, baseOvr: 57, color: "eab308", stadium: 350, country: "HUN", rep: 42, fanBase: 5000, currentBudget: 190000 },
  { id: 941, name: "Keszthelyi KSK", tier: 4, baseOvr: 57, color: "0284c7", stadium: 300, country: "HUN", rep: 41, fanBase: 4667, currentBudget: 170000 },
  { id: 942, name: "Pápai KSE", tier: 4, baseOvr: 56, color: "dc2626", stadium: 250, country: "HUN", rep: 40, fanBase: 4333, currentBudget: 160000 },
  { id: 943, name: "Várpalotai BSK", tier: 4, baseOvr: 56, color: "18181b", stadium: 350, country: "HUN", rep: 39, fanBase: 4000, currentBudget: 150000 },
  { id: 944, name: "Dunaújvárosi KKA", tier: 4, baseOvr: 55, color: "ef4444", stadium: 400, country: "HUN", rep: 38, fanBase: 3667, currentBudget: 140000 },
  { id: 945, name: "Siklósi KC", tier: 4, baseOvr: 55, color: "facc15", stadium: 300, country: "HUN", rep: 37, fanBase: 3467, currentBudget: 130000 },
  { id: 946, name: "Bonyhádi KSE", tier: 4, baseOvr: 54, color: "15803d", stadium: 250, country: "HUN", rep: 36, fanBase: 3267, currentBudget: 120000 },

  // TIER 5 (Megyei I.) - 10 Clubs
  { id: 947, name: "Mohácsi TE", tier: 5, baseOvr: 51, color: "b91c1c", stadium: 200, country: "HUN", rep: 30, fanBase: 2133, currentBudget: 75000 },
  { id: 948, name: "Sport36-Komló U21", tier: 5, baseOvr: 50, color: "2563eb", stadium: 150, country: "HUN", rep: 29, fanBase: 2000, currentBudget: 70000 },
  { id: 949, name: "Szigetvári KSE", tier: 5, baseOvr: 50, color: "1d4ed8", stadium: 180, country: "HUN", rep: 28, fanBase: 1867, currentBudget: 65000 },
  { id: 950, name: "Harkányi SE", tier: 5, baseOvr: 49, color: "16a34a", stadium: 150, country: "HUN", rep: 27, fanBase: 1667, currentBudget: 60000 },
  { id: 951, name: "Kozármisleny SE", tier: 5, baseOvr: 49, color: "ffffff", stadium: 220, country: "HUN", rep: 26, fanBase: 1467, currentBudget: 55000 },
  { id: 952, name: "Bólyi SE", tier: 5, baseOvr: 48, color: "7f1d1d", stadium: 120, country: "HUN", rep: 25, fanBase: 1333, currentBudget: 50000 },
  { id: 953, name: "Pécsváradi Spartacus", tier: 5, baseOvr: 48, color: "eab308", stadium: 150, country: "HUN", rep: 24, fanBase: 1200, currentBudget: 45000 },
  { id: 954, name: "Szentlőrinci SE", tier: 5, baseOvr: 47, color: "0284c7", stadium: 200, country: "HUN", rep: 23, fanBase: 1067, currentBudget: 40000 },
  { id: 955, name: "Sásdi SK", tier: 5, baseOvr: 47, color: "ea580c", stadium: 100, country: "HUN", rep: 22, fanBase: 1000, currentBudget: 35000 },
  { id: 956, name: "Szászvári SE", tier: 5, baseOvr: 46, color: "15803d", stadium: 100, country: "HUN", rep: 21, fanBase: 1000, currentBudget: 30000 }
];

// ============================================================================
// 10. ICELAND (ISL) - Olís deild karla & 1. deild karla
// ============================================================================
export const ICELAND_HANDBALL_CLUBS: Club[] = [
  // Tier 1 (12 Clubs)
  { id: 1001, name: "Valur", tier: 1, baseOvr: 85, color: "e2001a", color2: "ffffff", stadium: 2500, country: "ISL", rep: 85, fanBase: 130000, currentBudget: 3200000 },
  { id: 1002, name: "FH", tier: 1, baseOvr: 84, color: "ffffff", color2: "000000", stadium: 2200, country: "ISL", rep: 84, fanBase: 116667, currentBudget: 2800000 },
  { id: 1003, name: "Haukar", tier: 1, baseOvr: 83, color: "b91c1c", color2: "ffffff", stadium: 4734, country: "ISL", rep: 83, fanBase: 110000, currentBudget: 2600000 },
  { id: 1004, name: "ÍBV", tier: 1, baseOvr: 82, color: "ffffff", color2: "000000", stadium: 1500, country: "ISL", rep: 81, fanBase: 93333, currentBudget: 2300000 },
  { id: 1005, name: "Afturelding", tier: 1, baseOvr: 82, color: "ef4444", color2: "ffffff", stadium: 1400, country: "ISL", rep: 80, fanBase: 86667, currentBudget: 2200000 },
  { id: 1006, name: "Fram", tier: 1, baseOvr: 81, color: "2563eb", color2: "ffffff", stadium: 1600, country: "ISL", rep: 80, fanBase: 90000, currentBudget: 2250000 },
  { id: 1007, name: "Stjarnan", tier: 1, baseOvr: 81, color: "1d4ed8", color2: "ffffff", stadium: 1500, country: "ISL", rep: 79, fanBase: 80000, currentBudget: 2100000 },
  { id: 1008, name: "KA", tier: 1, baseOvr: 80, color: "facc15", color2: "000000", stadium: 1800, country: "ISL", rep: 78, fanBase: 76667, currentBudget: 2000000 },
  { id: 1009, name: "Grótta", tier: 1, baseOvr: 79, color: "0284c7", color2: "ffffff", stadium: 3897, country: "ISL", rep: 76, fanBase: 63333, currentBudget: 1750000 },
  { id: 1010, name: "HK", tier: 1, baseOvr: 78, color: "dc2626", color2: "ffffff", stadium: 1200, country: "ISL", rep: 75, fanBase: 60000, currentBudget: 1650000 },
  { id: 1011, name: "Selfoss", tier: 1, baseOvr: 78, color: "881337", color2: "ffffff", stadium: 1200, country: "ISL", rep: 76, fanBase: 65333, currentBudget: 1700000 },
  { id: 1012, name: "Hörður", tier: 1, baseOvr: 76, color: "0369a1", color2: "ffffff", stadium: 800, country: "ISL", rep: 72, fanBase: 45333, currentBudget: 1350000 },

  // Tier 2 (10 Clubs)
  { id: 1013, name: "Víkingur", tier: 2, baseOvr: 76, color: "dc2626", stadium: 1500, country: "ISL", rep: 74, fanBase: 54667, currentBudget: 1500000 },
  { id: 1014, name: "Þór", tier: 2, baseOvr: 75, color: "ffffff", stadium: 1500, country: "ISL", rep: 73, fanBase: 50000, currentBudget: 1400000 },
  { id: 1015, name: "Fjölnir", tier: 2, baseOvr: 74, color: "eab308", stadium: 1200, country: "ISL", rep: 71, fanBase: 43333, currentBudget: 1250000 },
  { id: 1016, name: "KR", tier: 2, baseOvr: 74, color: "000000", stadium: 1500, country: "ISL", rep: 73, fanBase: 52000, currentBudget: 1350000 },
  { id: 1017, name: "ÍR", tier: 2, baseOvr: 73, color: "2563eb", stadium: 1200, country: "ISL", rep: 71, fanBase: 42000, currentBudget: 1200000 },
  { id: 1018, name: "Kári", tier: 2, baseOvr: 72, color: "facc15", stadium: 800, country: "ISL", rep: 68, fanBase: 34000, currentBudget: 1050000 },
  { id: 1019, name: "Berserkir", tier: 2, baseOvr: 71, color: "b91c1c", stadium: 800, country: "ISL", rep: 66, fanBase: 29333, currentBudget: 950000 },
  { id: 1020, name: "Hvíti riddarinn", tier: 2, baseOvr: 70, color: "ffffff", stadium: 800, country: "ISL", rep: 65, fanBase: 26667, currentBudget: 890000 },
  { id: 1021, name: "Mílan", tier: 2, baseOvr: 69, color: "7f1d1d", stadium: 600, country: "ISL", rep: 63, fanBase: 22667, currentBudget: 780000 },
  { id: 1022, name: "Vængir Júpiters", tier: 2, baseOvr: 68, color: "1d4ed8", stadium: 600, country: "ISL", rep: 62, fanBase: 20667, currentBudget: 720000 },

  // TIER 3 (2. deild) - 10 Clubs
  { id: 1023, name: "Keflavík", tier: 3, baseOvr: 66, color: "1d4ed8", stadium: 600, country: "ISL", rep: 59, fanBase: 19333, currentBudget: 800000 },
  { id: 1024, name: "Njarðvík", tier: 3, baseOvr: 66, color: "15803d", stadium: 550, country: "ISL", rep: 58, fanBase: 18000, currentBudget: 750000 },
  { id: 1025, name: "Grindavík", tier: 3, baseOvr: 65, color: "facc15", stadium: 500, country: "ISL", rep: 57, fanBase: 16667, currentBudget: 680000 },
  { id: 1026, name: "Þróttur", tier: 3, baseOvr: 65, color: "dc2626", stadium: 450, country: "ISL", rep: 56, fanBase: 15333, currentBudget: 620000 },
  { id: 1027, name: "Leiknir", tier: 3, baseOvr: 64, color: "2563eb", stadium: 400, country: "ISL", rep: 55, fanBase: 14000, currentBudget: 580000 },
  { id: 1028, name: "Fylkir", tier: 3, baseOvr: 64, color: "ea580c", stadium: 450, country: "ISL", rep: 54, fanBase: 12667, currentBudget: 530000 },
  { id: 1029, name: "Álftanes", tier: 3, baseOvr: 63, color: "ffffff", stadium: 350, country: "ISL", rep: 53, fanBase: 11667, currentBudget: 490000 },
  { id: 1030, name: "Haukar U", tier: 3, baseOvr: 62, color: "b91c1c", stadium: 300, country: "ISL", rep: 52, fanBase: 10667, currentBudget: 450000 },
  { id: 1031, name: "Valur U", tier: 3, baseOvr: 62, color: "ef4444", stadium: 300, country: "ISL", rep: 51, fanBase: 10000, currentBudget: 420000 },
  { id: 1032, name: "FH U", tier: 3, baseOvr: 61, color: "ffffff", stadium: 300, country: "ISL", rep: 50, fanBase: 9333, currentBudget: 390000 },

  // TIER 4 (3. deild / Regional) - 10 Clubs
  { id: 1033, name: "Reynir Sandgerði", tier: 4, baseOvr: 59, color: "0284c7", stadium: 250, country: "ISL", rep: 45, fanBase: 6000, currentBudget: 240000 },
  { id: 1034, name: "Víðir", tier: 4, baseOvr: 58, color: "1e40af", stadium: 200, country: "ISL", rep: 44, fanBase: 5667, currentBudget: 220000 },
  { id: 1035, name: "Huginn", tier: 4, baseOvr: 58, color: "16a34a", stadium: 180, country: "ISL", rep: 43, fanBase: 5333, currentBudget: 200000 },
  { id: 1036, name: "Höttur", tier: 4, baseOvr: 57, color: "facc15", stadium: 220, country: "ISL", rep: 42, fanBase: 5000, currentBudget: 190000 },
  { id: 1037, name: "Fjarðabyggð", tier: 4, baseOvr: 57, color: "dc2626", stadium: 200, country: "ISL", rep: 41, fanBase: 4667, currentBudget: 170000 },
  { id: 1038, name: "Sindri", tier: 4, baseOvr: 56, color: "1d4ed8", stadium: 150, country: "ISL", rep: 40, fanBase: 4333, currentBudget: 160000 },
  { id: 1039, name: "Völsungur", tier: 4, baseOvr: 56, color: "15803d", stadium: 250, country: "ISL", rep: 39, fanBase: 4000, currentBudget: 150000 },
  { id: 1040, name: "Magni", tier: 4, baseOvr: 55, color: "eab308", stadium: 150, country: "ISL", rep: 38, fanBase: 3667, currentBudget: 140000 },
  { id: 1041, name: "Dalvík/Reynir", tier: 4, baseOvr: 55, color: "2563eb", stadium: 120, country: "ISL", rep: 37, fanBase: 3467, currentBudget: 130000 },
  { id: 1042, name: "Tindastóll", tier: 4, baseOvr: 54, color: "ef4444", stadium: 200, country: "ISL", rep: 36, fanBase: 3267, currentBudget: 120000 }
];

// ============================================================================
// ALL HANDBALL CLUBS EXPORT
// ============================================================================
import handballBaseDatabase from '../mod-data/handball_base_database.json';

const rawAllClubs: Club[] = [
  ...GERMANY_HANDBALL_CLUBS,
  ...DENMARK_HANDBALL_CLUBS,
  ...FRANCE_HANDBALL_CLUBS,
  ...SPAIN_HANDBALL_CLUBS,
  ...SWEDEN_HANDBALL_CLUBS,
  ...CROATIA_HANDBALL_CLUBS,
  ...PORTUGAL_HANDBALL_CLUBS,
  ...NORWAY_HANDBALL_CLUBS,
  ...HUNGARY_HANDBALL_CLUBS,
  ...ICELAND_HANDBALL_CLUBS
];

import { hasVerifiedLocalAsset, getLocalAssetPath } from './teams';
import { REAL_WORLD_LOGOS } from './realWorldLogos';

const handballClubMap = new Map<number | string, { historicContext?: string; context?: string; logo?: string; fallbackLogo?: string }>();
if (Array.isArray(handballBaseDatabase)) {
  (handballBaseDatabase as any[]).forEach((fc) => {
    if (!fc) return;
    const data = {
      historicContext: fc.historicContext,
      context: fc.context || fc.historicContext,
      logo: fc.logo,
      fallbackLogo: fc.fallbackLogo
    };
    if (fc.id !== undefined) handballClubMap.set(fc.id, data);
    if (fc.name) handballClubMap.set(fc.name.trim().toLowerCase(), data);
  });
}

const existingIds = new Set(rawAllClubs.map(c => c.id));
const extraClubsFromDb: Club[] = Array.isArray(handballBaseDatabase)
  ? (handballBaseDatabase as any[])
      .filter((fc) => fc && fc.id && !existingIds.has(fc.id))
      .map((fc) => ({
        id: fc.id,
        name: fc.name,
        tier: fc.tier || 1,
        baseOvr: fc.baseOvr || 75,
        color: fc.color || '1e3a8a',
        color2: fc.color2,
        stadium: fc.stadium || 2000,
        country: fc.country,
        rep: fc.rep,
        fanBase: fc.fanBase,
        currentBudget: fc.currentBudget,
        historicContext: fc.historicContext,
        context: fc.context || fc.historicContext,
        logo: fc.logo,
        fallbackLogo: fc.fallbackLogo
      }))
  : [];

const allCombinedClubs: Club[] = [...rawAllClubs, ...extraClubsFromDb];

const enrichedClubs: Club[] = allCombinedClubs.map((c) => {
  const match = handballClubMap.get(c.id) || (c.name ? handballClubMap.get(c.name.trim().toLowerCase()) : undefined);
  const officialLogo = REAL_WORLD_LOGOS[c.id];
  const hasLocal = hasVerifiedLocalAsset(c.id);
  const localAsset = getLocalAssetPath(c.id);

  let primaryLogo: string | undefined;
  let fallback: string | undefined;

  if (hasLocal && localAsset) {
    primaryLogo = localAsset;
    fallback = officialLogo || c.fallbackLogo || match?.fallbackLogo;
  } else if (officialLogo && officialLogo.startsWith('http')) {
    primaryLogo = officialLogo;
    fallback = undefined;
  } else {
    const candidate = c.logo || match?.logo;
    if (candidate) {
      primaryLogo = candidate;
      fallback = c.fallbackLogo || match?.fallbackLogo;
    } else {
      primaryLogo = undefined;
      fallback = undefined;
    }
  }

  return {
    ...c,
    historicContext: c.historicContext || match?.historicContext,
    context: c.context || match?.context,
    logo: primaryLogo,
    fallbackLogo: fallback
  };
});

export const ALL_HANDBALL_CLUBS: Club[] = enrichedClubs;
export const ALL_CLUBS: Club[] = enrichedClubs;
export const INITIAL_CLUBS: Club[] = enrichedClubs;