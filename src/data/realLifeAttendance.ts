import { isReserveClub } from './gameConstants';

/**
 * Real-Life Official Starting Attendance & Calibration System
 * 
 * Provides official documented real-world average attendances for European handball clubs
 * (Daikin HBL, 2. HBL, Liqui Moly StarLigue, Handboldligaen, Liga Plenitude ASOBAL,
 * ORLEN Superliga, K&H Liga, REMA 1000-ligaen, Handbollsligan, Quickline Handball League, etc.)
 * 
 * When available, clubs begin with their authentic real-world starting attendance,
 * and attendance dynamically develops from there based on sporting results, trophies,
 * fanbase growth, facility expansions, and division tier changes.
 */

export const REAL_LIFE_START_ATTENDANCES: Record<string, number> = {
  // ==================== GERMANY (Daikin HBL & 2. HBL) ====================
  'THW Kiel': 10048,                 // Wunderino Arena (10,285)
  'Füchse Berlin': 8412,             // Max-Schmeling-Halle (9,000)
  'SC Magdeburg': 6600,              // GETEC Arena (6,600 - 100% sellout)
  'Rhein-Neckar Löwen': 8870,        // SAP Arena (13,200)
  'SG Flensburg-Handewitt': 6180,     // GP JOULE Arena (6,300)
  'TSV Hannover-Burgdorf': 6740,     // ZAG Arena (9,900)
  'HC Erlangen': 6620,               // Arena Nürnberger Versicherung (8,308)
  'TVB Stuttgart': 5010,             // Porsche-Arena (6,211)
  'SC DHfK Leipzig': 4850,           // QUARTERBACK Immobilien ARENA (12,250)
  'Frisch Auf Göppingen': 4460,      // EWS Arena (4,750)
  'HSV Hamburg': 4150,               // Sporthalle Hamburg (7,000)
  'VfL Gummersbach': 4132,           // SCHWALBE arena (4,132 - 100% sellout)
  'MT Melsungen': 4120,              // Rothenbach-Halle (4,300)
  'TBV Lemgo Lippe': 3920,           // Phoenix Contact Arena (4,520)
  'HSG Wetzlar': 3890,               // Buderus Arena Wetzlar (4,412)
  'SG BBM Bietigheim': 3250,         // EgeTrans Arena (4,583)
  'ThSV Eisenach': 3100,             // Werner-Aßmann-Halle (3,100 - 100% sellout)
  '1. VfL Potsdam': 2050,            // MBS Arena (2,050 - 100% sellout)

  // 2. HBL & 3. Liga (Germany)
  'Bergischer HC': 2720,             // Uni-Halle (3,200)
  'HSG Nordhorn-Lingen': 2450,       // Euregium (4,100)
  'HC Empor Rostock': 2350,          // Stadthalle Rostock (4,550)
  'HBW Balingen-Weilstetten': 2300,  // Sparkassen-Arena (2,350)
  'GWD Minden': 2240,                // Kreissporthalle (4,059)
  'HSC 2000 Coburg': 2210,           // HUK-COBURG arena (3,530)
  'ASV Hamm-Westfalen': 2150,        // WESTPRESS arena (2,650)
  'Dessau-Roßlauer HV': 2120,        // Anhalt-Arena (3,300)
  'HC Elbflorenz Dresden': 2080,     // BallsportARENA (2,603)
  'Die Eulen Ludwigshafen': 1880,    // Friedrich-Ebert-Halle (2,350)
  'TuS N-Lübbecke': 1850,            // MERKUR Arena (3,250)
  'TUSEM Essen': 1750,               // Sportpark Am Hallo (2,578)
  'VfL Lübeck-Schwartau': 1720,      // Hansehalle (2,100)
  'Eintracht Hildesheim': 1680,      // Volksbank-Arena (2,400)
  'VfL Eintracht Hagen': 1650,       // Krollmann Arena (3,145)
  'TV Großwallstadt': 1620,          // Untermainhalle (2,500)
  'HSG Krefeld Niederrhein': 1520,   // Glockenspitzhalle (3,000)
  'EHV Aue': 1420,                   // Erzgebirgshalle (2,250)
  'TuS Ferndorf': 1380,              // Stählerwiese (1,450)
  'TV Hüttenberg': 1250,             // Sporthalle Hüttenberg (1,450)
  'SG Pforzheim/Eutingen': 980,      // Bertha-Benz-Halle (1,500)
  'HG Saarlouis': 1150,              // Stadtgartenhalle (1,600)
  'HSG Hanau': 850,                  // Main-Kinzig-Halle (1,200)
  'TV Gelnhausen': 820,              // Großsporthalle (1,100)
  'TSV Altenholz': 750,              // Edgar-Meschkat-Halle (1,000)

  // ==================== FRANCE (Liqui Moly StarLigue & ProLigue) ====================
  'HBC Nantes': 5902,                // H Arena (5,902 - 100% sellout)
  'Chambéry Savoie HB': 4120,        // Le Phare (4,400)
  'Limoges Handball': 3920,          // Palais des Sports de Beaublanc (4,500)
  'Cesson Rennes MHB': 3420,         // Glaz Arena (4,500)
  'C\'Chartres MHB': 3150,           // Colisée Chartres (3,800)
  'Paris Saint-Germain': 3080,       // Stade Pierre de Coubertin (3,400)
  'USAM Nîmes Gard': 3050,           // Le Parnasse (3,391)
  'Montpellier HB': 2950,            // FDI Stadium (3,000)
  'Pays d\'Aix UC': 2780,            // Arena du Pays d'Aix (6,000)
  'Dunkerque HGL': 2320,             // Stade de Flandres (2,400)
  'Saint-Raphaël VHB': 1850,         // Palais des Sports JFK (2,000)
  'Sélestat Alsace HB': 1820,        // CSI Sélestat (2,200)
  'US Créteil': 1650,                // Palais des Sports Robert Oubron (2,400)
  'US Ivry': 1350,                   // Gymnase Auguste Delaune (1,500)
  'Istres Provence HB': 1280,        // Halle Polyvalente (1,600)
  'Tremblay Handball': 1150,         // Palais des Sports (1,200)
  'Pontault-Combault HB': 1100,      // Espace Boisramé (1,300)
  'Grand Nancy HB': 1450,            // Parc des Sports Nations (1,850)
  'JS Cherbourg': 1850,              // Complexe Jean Jaurès (2,000)
  'Billère Handball': 1120,          // Sporting d'Este (1,500)
  'Frontignan Thau HB': 950,         // Salle Henri Ferrari (1,100)
  'Caen HB': 2250,                   // Palais des Sports de Caen (3,650)
  'Valence Handball': 1150,          // Halle Polyvalente (1,500)
  'Massy Essonne HB': 1050,          // Centre Omnisports (1,500)
  'Grand Besançon Doubs HB': 1250,   // Palais des Sports Ghani Yalouz (3,300)
  'Dijon Métropole HB': 1650,        // Palais des Sports JM Geoffroy (4,000)
  'Saran Loiret HB': 1350,           // Halle du Bois Joly (1,440)

  // ==================== DENMARK (Herreligaen & 1. Division) ====================
  'Aalborg Håndbold': 5020,          // Sparekassen Danmark Arena (5,500)
  'KIF Kolding': 3120,               // Sydbank Arena (5,001)
  'Skjern Håndbold': 2740,           // Skjern Bank Arena (3,264)
  'TTH Holstebro': 2450,             // Gråkjær Arena (3,250)
  'Bjerringbro-Silkeborg': 2310,     // JYSK Arena (2,400)
  'Fredericia HK': 2180,             // thansen Arena (2,300)
  'GOG Håndbold': 2150,              // Phønix Tag Arena (2,200)
  'SønderjyskE Herrer': 1890,        // Broager Sparekasse Skansen (2,200)
  'Ribe-Esbjerg HH': 1820,           // Blue Water Dokken (3,380)
  'Skanderborg AGF': 1680,           // Fælledhallen (2,000)
  'Nordsjælland Håndbold': 1550,     // Royal Stage Hillerød (3,000)
  'Mors-Thy Håndbold': 1450,         // Sparekassen Thy Arena (1,500)
  'TMS Ringsted': 1320,              // Ringsted-Hallen (1,600)
  'Grindsted GIF': 980,              // Lynghallen (1,200)
  'Skive fH': 1350,                  // Interfjord Arena (2,000)
  'HC Midtjylland': 1420,            // Klink & Jensen Arena (2,500)
  'HØJ Elite': 1050,                 // Jyllinge Hallen (1,400)
  'Team Sydhavsøerne': 1180,         // BorderShop Arena (1,400)
  'Lemvig-Thyborøn Håndbold': 1150,  // Vestjysk Bank Arena (1,400)
  'FIF Håndbold': 920,               // Frederiksberghallen (1,400)
  'Ajax København': 880,             // Bavnehøj-Hallen (1,200)
  'Roskilde Håndbold': 940,          // Roskilde Hallerne (1,500)
  'Otterup HK': 720,                 // Otterup Idrætscenter (1,100)

  // ==================== SPAIN (Liga Plenitude ASOBAL) ====================
  'Abanca Ademar León': 2740,        // Palacio de los Deportes de León (5,188)
  'FC Barcelona': 2680,              // Palau Blaugrana (7,585 - domestic league)
  'Recoletas Atlético Valladolid': 2420, // Polideportivo Huerta del Rey (3,500)
  'Fraikin BM Granollers': 2150,     // Palau d'Esports de Granollers (5,685)
  'BM Logroño La Rioja': 2120,       // Palacio de los Deportes (3,809)
  'Bathco BM Torrelavega': 2050,     // Pabellón Vicente Trueba (2,400)
  'Bidasoa Irun': 1950,              // Polideportivo Artaleku (2,200)
  'Frigoríficos del Morrazo': 1890,  // O Gatañal (2,500)
  'Helvetia Anaitasuna': 1850,       // Pabellón Anaitasuna (3,000)
  'Bada Huesca': 1720,               // Palacio Municipal de Huesca (4,900)
  'REBI Balonmano Cuenca': 1620,     // El Sargal (1,800)
  'BM Guadalajara': 1380,            // David Santamaría (2,000)
  'TM Benidorm': 1250,               // Palau d'Esports L'Illa (3,000)
  'Viveros Herol BM Nava': 980,      // Pabellón Guerrer@s Naver@s (1,000)
  'Ángel Ximénez Puente Genil': 850, // Alcalde Miguel Salas (900)
  'Fertiberia Puerto Sagunto': 1180, // Pabellón Port de Sagunt (1,500)
  'UBU San Pablo Burgos': 1420,      // Polideportivo El Plantío (2,500)
  'Blendio Sinfín': 1150,            // Pabellón de La Albericia (2,300)
  'BM Caserío Ciudad Real': 1650,    // Quijote Arena (5,800)

  // ==================== POLAND (ORLEN Superliga) ====================
  'ORLEN Wisła Płock': 4620,         // Orlen Arena (5,460)
  'Industria Kielce': 4080,          // Hala Legionów (4,200)
  'Rebud KPR Ostrovia': 2480,        // Arena Ostrów (3,000)
  'Corotop Gwardia Opole': 1950,     // Stegu Arena (3,378)
  'KS Azoty-Puławy': 1850,           // Grupa Azoty Arena (3,200)
  'Energa MKS Kalisz': 1680,         // Arena Kalisz (3,164)
  'KGHM Chrobry Głogów': 1450,       // Hala Ryszarda Matuszaka (2,000)
  'KGHM Zagłębie Lubin': 1350,       // Hala RCS Lubin (3,714)
  'Piotrkowianin Piotrków': 1150,    // Hala Relax (1,500)
  'Energa MMTS Kwidzyn': 1250,       // Hala widowiskowo-sportowa (1,500)
  'Górnik Zabrze': 950,              // Hala Pogoń (1,000)
  'Grupa Azoty Unia Tarnów': 1220,   // Arena Jaskółka Tarnów (4,317)
  'Sandra SPA Pogoń Szczecin': 1120, // Netto Arena (5,400)
  'WKS Śląsk Wrocław': 1280,         // Hala Orbita (3,000)

  // ==================== HUNGARY (K&H Férfi Kézilabda Liga) ====================
  'OTP Bank - Pick Szeged': 5850,    // Pick Aréna (8,143)
  'Veszprém KC': 4750,               // Veszprém Aréna (5,019)
  'MOL Tatabánya KC': 3450,          // Tatabányai Multifunkcionális Csarnok (6,200)
  'Dabas KC': 1250,                  // OBO Aréna Dabas (2,000)
  'Ferencvárosi TC': 1200,           // Elek Gyula Aréna (1,300)
  'Balatonfüredi KSE': 1150,         // Szabadidőközpont (1,500)
  'Csurgói KK': 950,                 // Sótonyi László Sportcsarnok (1,200)
  'Sport36-Komló': 880,              // Komlói Sportközpont (1,000)
  'HE-DO B. Braun Gyöngyös': 1100,   // Dr. Fejes András Sport- és Rendezvénycsarnok (1,500)
  'QHB Eger': 1050,                  // Kemény Ferenc Sportcsarnok (1,200)
  'PLER-Budapest': 850,              // BUD Aréna (1,000)
  'ETO University HT': 1350,         // Magvassy Mihály Sportcsarnok (2,800)

  // ==================== NORWAY (REMA 1000-ligaen) ====================
  'Kolstad Håndball': 4680,          // Trondheim Spektrum (8,900)
  'Elverum Håndball': 2120,          // Terningen Arena (2,500)
  'ØIF Arendal': 1750,               // Sparebanken Sør Amfi (2,500)
  'Drammen HK': 1450,                // Drammenshallen (4,000)
  'Bergen Håndball': 1420,           // Haukelandshallen (3,000)
  'Nærbø IL': 1350,                  // SpareBank 1 Arena (1,500)
  'Runar Sandefjord': 1200,          // Runarhallen (1,500)
  'Kristiansand Topphåndball': 1250, // Aquarama (2,200)
  'Halden Topphåndball': 1120,       // Halden Arena (2,200)
  'Haslum HK': 1150,                 // Nadderud Arena (2,050)
  'Bækkelaget Håndball Elite': 880,  // Nordstrand Arena (1,500)
  'Sandnes HK': 820,                 // Sandneshallen (1,200)
  'Ryger Stavanger': 1350,           // Stavanger Idrettshall (4,000)
  'Follo HK': 950,                   // Stil Arena (1,500)

  // ==================== SWEDEN (Handbollsligan) ====================
  'IFK Kristianstad': 3850,          // Kristianstad Arena (4,700)
  'Ystads IF': 2350,                 // Ystad Arena (2,700)
  'IK Sävehof': 2150,                // Partille Arena (4,000)
  'Hammarby IF': 1950,               // Eriksdalshallen (2,600)
  'IFK Skövde': 1820,                // Arena Skövde (2,280)
  'Alingsås HK': 1750,               // Estrad Alingsås (2,800)
  'Eskilstuna Guif': 1780,           // STIGA Sports Arena (4,000)
  'HK Malmö': 1450,                  // Baltiska hallen (4,000)
  'IF Hallby': 1350,                 // Jönköpings Idrottshus (1,800)
  'LUGI HF': 1320,                   // Sparbanken Skåne Arena (3,000)
  'HK Drott': 1250,                  // Halmstad Arena (3,800)
  'HK Aranäs': 1150,                 // Kungsbacka Ishall (1,500)
  'Önnereds HK': 1100,               // ÖHK-hallen (1,500)
  'HF Karlskrona': 1420,             // Brinova Arena Karlskrona (2,500)
  'Amo HK': 920,                     // Amokabel-Hallen (1,000)

  // ==================== CROATIA (Premijer Liga) ====================
  'RK Zagreb': 2850,                 // Arena Zagreb (15,200 - domestic baseline)
  'RK Nexe': 1850,                   // Sportska dvorana kralja Tomislava (2,000)
  'MRK Sesvete': 1150,               // Sportska dvorana Gimnazije (1,200)
  'RK Poreč': 950,                   // SRC Veli Jože (1,000)
  'HRK Gorica': 920,                 // Gradska dvorana (1,000)
  'GRK Varaždin': 1150,              // Sportska dvorana Graberje (1,500)
  'RK Zamet': 1050,                  // Centar Zamet (2,350)
  'RK Dubrava': 820,                 // SD Dubrava (1,500)

  // ==================== PORTUGAL (Andebol 1) ====================
  'Sporting CP': 2150,               // Pavilhão João Rocha (3,000)
  'FC Porto': 1880,                  // Dragão Arena (2,179)
  'ABC Braga': 1650,                 // Pavilhão Flávio Sá Leite (2,500)
  'SL Benfica': 1250,                // Pavilhão da Luz Nº 2 (1,540)
  'Vitória SC': 1220,                // Pavilhão Unidade Vimaranense (1,800)
  'Águas Santas': 950,               // Pavilhão da Associação (1,200)
  'CF Os Belenenses': 820,           // Pavilhão Acácio Rosa (1,500)
  'Póvoa AC': 850,                   // Pavilhão Municipal (1,200)
  'Marítimo da Madeira': 980,        // Pavilhão do Marítimo (1,500)
  'Artística de Avanca': 750,        // Pavilhão Comendador Adelino (1,000)

  // ==================== SWITZERLAND (Quickline Handball League) ====================
  'Kadetten Schaffhausen': 1750,     // BBC Arena (3,500)
  'Pfadi Winterthur': 1350,          // AXA Arena (2,000)
  'HC Kriens-Luzern': 1220,          // Krauerhalle (1,300)
  'BSV Bern': 1150,                  // Mobiliar Arena (2,000)
  'Wacker Thun': 1120,               // Lachenhalle (2,000)
  'TSV St. Otmar St. Gallen': 1180,  // Kreuzbleiche (3,500)
  'HSC Suhr Aarau': 1050,            // Schachenhalle (2,000)
  'GC Amicitia Zürich': 850,         // Saalsporthalle (2,300)
  'RTV 1879 Basel': 820,             // Rankhof (1,500)
  'CS Chênois Genève': 650,          // Sous-Moulin (1,000)

  // ==================== AUSTRIA (HLA Meisterliga) ====================
  'Alpla HC Hard': 1650,             // Sporthalle am See (2,280)
  'Bregenz Handball': 1250,          // Handball-Arena Rieden-Vorkloster (1,600)
  'Förthof UHK Krems': 1150,         // Sport.Halle.Krems (1,400)
  'HC Fivers Margareten': 980,       // Sporthalle Hollgasse (1,200)
  'Handball Tirol': 850,             // Osthalle Schwaz (1,000)
  'HSG Holding Graz': 920,           // Raiffeisen Sportpark Graz (3,000)
  'BT Füchse Auto Pichler': 780,     // Sporthalle Bruck (1,000)
  'SC kelag Ferlach': 720,           // Ballspielhalle Ferlach (800)
  'HSG Bärnbach/Köflach': 680,       // Sporthalle Bärnbach (1,000)
  'roomz JAGS Vöslau': 620,          // Thermenhalle Bad Vöslau (800)
  'UHC Hollabrunn': 580,             // Weinviertelarena (800)
  'Handball Westwien': 850,          // BSFZ Südstadt (1,200)

  // ==================== ICELAND (Olís deildin) ====================
  'Valur': 1350,                     // Origo-höllin (2,500)
  'FH': 1150,                        // Kaplakriki (2,200)
  'Haukar': 950,                     // Schenkerhöllin (1,800)
  'ÍBV': 850,                        // Íþróttamiðstöð Vestmannaeyja (1,500)
  'Fram': 820,                       // Íþróttahús Fram (1,600)
  'Afturelding': 800,                // Varmá (1,400)
  'Stjarnan': 780,                   // Ásgarður (1,500)
  'KA': 750,                         // KA heimilið (1,800)
  'Selfoss': 720,                    // Iða (1,200)
  'Grótta': 650,                     // Hertz-höllin (1,000)
  'HK': 680,                         // Kórinn (1,200)
  'Hörður': 520,                     // Torfnes (800)
};

// Standard handball club prefixes to strip when performing robust prefix-free comparisons
const PREFIX_REGEX = /^(THW|SC|SG|HC|RK|BM|IFK|HK|TSV|VfL|TBV|HSG|HSV|TVB|ThSV|TuS|HBW|ASV|HSC|HV|MRK|HRK|GRK|IK|HF|BSV|CS|RTV|BT|UHC|OTP\s+Bank\s*-\s*|Telekom\s+|Barça\s+|FC\s+)\s*/i;

// Generic terms that must never trigger fuzzy substring matches
const GENERIC_SUBSTRINGS = new Set([
  'handball',
  'håndbold',
  'balonmano',
  'andebol',
  'sporting',
  'dinamo',
  'eintracht',
  'united',
  'athletic',
  'atletico',
  'olympic',
]);

/**
 * Returns documented real-life starting attendance if available for the given club.
 */
export const getRealLifeStartingAttendance = (clubName: string, clubId?: string | number): number | null => {
  if (!clubName && !clubId) return null;

  // Immediately return null for reserve teams
  if (isReserveClub(clubName)) {
    return null;
  }

  // 1. Direct name lookup
  if (clubName && REAL_LIFE_START_ATTENDANCES[clubName]) {
    return REAL_LIFE_START_ATTENDANCES[clubName];
  }

  // Specific alias mappings for known naming differences
  const normName = (clubName || '').toLowerCase().trim();
  if (normName === 'barça' || normName === 'barca') {
    return REAL_LIFE_START_ATTENDANCES['FC Barcelona'] || 2680;
  }
  if (normName === 'montpellier handball') {
    return REAL_LIFE_START_ATTENDANCES['Montpellier HB'] || 2950;
  }
  if (normName === 'telekom veszprém' || normName === 'telekom veszprem') {
    return REAL_LIFE_START_ATTENDANCES['Veszprém KC'] || 4750;
  }

  // 2. Exact match normalized or prefix-stripped match
  const strippedName = normName.replace(PREFIX_REGEX, '').trim();

  for (const [key, att] of Object.entries(REAL_LIFE_START_ATTENDANCES)) {
    const normKey = key.toLowerCase();
    if (normName === normKey) return att;

    const strippedKey = normKey.replace(PREFIX_REGEX, '').trim();
    if (strippedName.length > 3 && strippedKey.length > 3 && strippedName === strippedKey) {
      return att;
    }

    // Check if one starts with the other after stripping prefixes, but ONLY if not a generic word
    if (
      strippedName.length > 5 &&
      strippedKey.length > 5 &&
      !GENERIC_SUBSTRINGS.has(strippedName) &&
      !GENERIC_SUBSTRINGS.has(strippedKey)
    ) {
      if (strippedKey.startsWith(strippedName) || strippedName.startsWith(strippedKey)) {
        return att;
      }
    }
  }

  return null;
};

/**
 * Calculates a realistic starting attendance for any club across European leagues.
 * If an official real-life figure exists, it is prioritized.
 * Otherwise, calculates an authentic baseline attendance from arena capacity, tier, and stature.
 */
export const getClubStartingAttendance = (club: {
  id?: string | number;
  name?: string;
  tier?: number;
  stadium?: number;
  baseOvr?: number;
  rep?: number;
  country?: string;
  fanBase?: number;
}): number => {
  const stad = Math.max(100, Math.round(club.stadium || 2000));
  const realAtt = getRealLifeStartingAttendance(club.name || '', club.id);
  
  if (realAtt && realAtt > 0) {
    return Math.min(stad, realAtt);
  }

  // Realistic tier-calibrated starting attendance utilization:
  const tier = club.tier || 1;
  const baseOvr = club.baseOvr || 65;
  const rep = club.rep || 65;

  // Base starting capacity fill percentage by division
  const baseUtil = tier === 1 ? 0.74 : tier === 2 ? 0.60 : tier === 3 ? 0.46 : tier === 4 ? 0.36 : 0.28;
  const targetLeagueAvg = tier === 1 ? 80 : tier === 2 ? 68 : tier === 3 ? 60 : tier === 4 ? 52 : 44;
  const perfBonus = Math.max(-0.16, Math.min(0.18, ((baseOvr + rep) / 2 - targetLeagueAvg) * 0.018));
  const effectiveUtil = Math.max(0.18, Math.min(0.92, baseUtil + perfBonus));

  const standardTierVenue = tier === 1 ? 7500 : tier === 2 ? 3200 : tier === 3 ? 1400 : 700;
  let calcAtt = 0;
  if (stad <= standardTierVenue) {
    calcAtt = Math.round(stad * effectiveUtil);
  } else {
    // Diminishing returns for oversized venues in lower leagues
    const primaryTierFill = standardTierVenue * effectiveUtil;
    const extraSeats = stad - standardTierVenue;
    calcAtt = Math.round(primaryTierFill + (extraSeats * effectiveUtil * 0.35));
  }

  return Math.max(40, Math.min(stad, calcAtt));
};

/**
 * Derives the starting supporter base (fanBase) required to sustain the authentic starting attendance.
 * Weekly home matchday attendance represents ~12-18% active ticket demand of the broader supporter base.
 */
export const getCalibratedStartingFanbase = (club: {
  id?: string | number;
  name?: string;
  tier?: number;
  stadium?: number;
  baseOvr?: number;
  rep?: number;
  country?: string;
  fanBase?: number;
}): number => {
  const startAtt = getClubStartingAttendance(club);
  const tier = club.tier || 1;
  // Matchday active rate in European handball: ~16% in top flight, scaling slightly down in lower tiers
  const activeRate = tier === 1 ? 0.16 : tier === 2 ? 0.15 : tier === 3 ? 0.14 : 0.13;
  return Math.round(startAtt / activeRate);
};
