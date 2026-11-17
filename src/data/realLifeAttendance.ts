/**
 * Real-Life Official Starting Attendance & Multi-Tier Calibration System
 *
 * Provides documented real-world average attendances across European handball pyramids:
 * - Tier 1: Daikin HBL, Liqui Moly StarLigue, Herreligaen, Liga Plenitude ASOBAL,
 *   ORLEN Superliga, K&H Liga, REMA 1000-ligaen, Handbollsligan, Premijer Liga,
 *   Andebol 1, Quickline Handball League, HLA Meisterliga, Olís deildin
 * - Tier 2 & Tier 3: 2. HBL, 3. Liga, ProLigue, Nationale 1, Danish 1. Division,
 *   División de Honor Plata, Liga Centralna, NB I/B, Norwegian 1. divisjon,
 *   Swedish Allsvenskan, Croatian 1. HRL, Portuguese Divisão de Honra, Grill 66-deildin
 * - Tiers 3–6 & Reserve/Academy Squads: Country- and division-calibrated curves
 *
 * Zero circular dependencies: leaf data module imported by gameConstants and store.
 */

export const isReserveClubName = (name?: string): boolean => {
  if (!name) return false;
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();
  return (
    trimmed.endsWith(' II') ||
    trimmed.endsWith(' 2') ||
    trimmed.endsWith(' B') ||
    trimmed.endsWith(' U') ||
    trimmed.endsWith('(B)') ||
    trimmed.endsWith(' (B)') ||
    trimmed.endsWith('(U)') ||
    trimmed.endsWith(' (U)') ||
    trimmed.endsWith('(II)') ||
    trimmed.endsWith(' (II)') ||
    /\s+(II|U19|U20|U21|U22|U23)\b/i.test(trimmed) ||
    lower === 'veszprém fa' ||
    lower === 'veszprem fa' ||
    lower.includes('barça atlètic') ||
    lower.includes('barca atletic') ||
    lower.includes('youngsters') ||
    lower.includes('youngstars') ||
    lower.endsWith(' amateure') ||
    lower.endsWith(' reserve') ||
    lower.endsWith(' reserves') ||
    lower.endsWith(' espoirs') ||
    lower.endsWith(' u23') ||
    lower.endsWith(' u21') ||
    lower.endsWith(' u19')
  );
};

export const REAL_LIFE_START_ATTENDANCES: Record<string, number> = {
  // ==================== GERMANY (Daikin HBL, 2. HBL & 3. Liga) ====================
  'THW Kiel': 10071,                 // Wunderino Arena (10,285)
  'TSV Hannover-Burgdorf': 9169,     // ZAG Arena (9,900)
  'Füchse Berlin': 8429,             // Max-Schmeling-Halle (9,000)
  'Rhein-Neckar Löwen': 8400,        // SAP Arena (13,200)
  'SC Magdeburg': 6600,              // GETEC Arena (6,600 - 100% sellout)
  'HC Erlangen': 6303,               // Arena Nürnberger Versicherung (8,308)
  'SG Flensburg-Handewitt': 6262,    // GP JOULE Arena (6,300)
  'TVB Stuttgart': 5010,             // Porsche-Arena (6,211)
  'SC DHfK Leipzig': 4850,           // QUARTERBACK Immobilien ARENA (12,250)
  'Frisch Auf Göppingen': 4460,      // EWS Arena (4,750)
  'HSV Hamburg': 4221,               // Sporthalle Hamburg / Barclays Arena (7,000)
  'MT Melsungen': 4120,              // Rothenbach-Halle (4,300)
  'VfL Gummersbach': 4095,           // SCHWALBE arena (4,132)
  'TBV Lemgo Lippe': 3920,           // Phoenix Contact Arena (4,520)
  'HSG Wetzlar': 3890,               // Buderus Arena Wetzlar (4,412)
  'SG BBM Bietigheim': 3250,         // EgeTrans Arena (4,583)
  'ThSV Eisenach': 3100,             // Werner-Aßmann-Halle (3,100 - 100% sellout)
  '1. VfL Potsdam': 2050,            // MBS Arena (2,050 - 100% sellout)

  // 2. HBL & 3. Liga (Germany)
  'Bergischer HC': 2720,             // Uni-Halle (3,200)
  'HSG Nordhorn-Lingen': 2450,       // Euregium (4,100)
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
  'TV Emsdetten': 1580,              // Ems-Halle (2,200)
  'HSG Krefeld Niederrhein': 1520,   // Glockenspitzhalle (3,000)
  'MTV Braunschweig': 1450,          // Sporthalle Alte Waage
  'HC Empor Rostock': 1450,          // Stadthalle / OSPA Arena (1,800)
  'EHV Aue': 1420,                   // Erzgebirgshalle (2,250)
  'TSV Bayer Dormagen': 1420,        // TSV Bayer Sportcenter (2,031)
  'TuS Ferndorf': 1380,              // Stählerwiese (1,450)
  'HSG Konstanz': 1280,              // Schänzle-Sporthalle (1,900)
  'TV Hüttenberg': 1250,             // Sporthalle Hüttenberg (1,450)
  'HG Saarlouis': 1150,              // Stadtgartenhalle (1,600)
  'SG Pforzheim/Eutingen': 980,      // Bertha-Benz-Halle (1,500)
  'TuS Vinnhorst': 920,              // Sportzentrum Vinnhorst
  'HSG Hanau': 850,                  // Main-Kinzig-Halle (1,200)
  'TV Gelnhausen': 820,              // Großsporthalle (1,100)
  'TSV Altenholz': 750,              // Edgar-Meschkat-Halle (1,000)
  'HG Oftersheim/Schwetzingen': 680, // Nordstadthalle
  'DJK Waldbüttelbrunn': 640,        // Ballsporthalle Waldbüttelbrunn
  'SGSH Dragons': 620,               // Sporthalle Löh

  // ==================== FRANCE (StarLigue, ProLigue & Nationale 1) ====================
  'HBC Nantes': 5902,                // H Arena (5,902 - 100% sellout)
  'Chambéry Savoie HB': 4044,        // Le Phare (4,400)
  'Limoges Handball': 3902,          // Palais des Sports de Beaublanc (4,500)
  'Cesson Rennes MHB': 3420,         // Glaz Arena (4,500)
  'C\'Chartres MHB': 3150,           // Colisée Chartres (3,800)
  'Fenix Toulouse HB': 3150,         // Palais des Sports André-Brouat (3,850)
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
  'Tremblay Handball': 1150,         // Palais des Sports (1,500)
  // ProLigue (Tier 2)
  'Caen HB': 2250,                   // Palais des Sports de Caen (3,650)
  'JS Cherbourg': 1850,              // Complexe Jean Jaurès (2,000)
  'Dijon Métropole HB': 1650,        // Palais des Sports JM Geoffroy (4,000)
  'Grand Nancy HB': 1450,            // Parc des Sports Nations (1,850)
  'Angers SCO Handball': 1380,       // Salle Jean-Bouin (1,500)
  'Saran Loiret HB': 1350,           // Halle du Bois Joly (1,440)
  'Grand Besançon Doubs HB': 1250,   // Palais des Sports Ghani Yalouz (3,300)
  'Valence Handball': 1150,          // Halle Polyvalente (1,500)
  'Billère Handball': 1120,          // Sporting d'Este (1,500)
  'Pontault-Combault HB': 1100,      // Espace Boisramé (1,300)
  'Massy Essonne HB': 1050,          // Centre Omnisports (1,500)
  'Cournon d\'Auvergne': 980,        // Maison des Sports / Gymnase Boisset
  'Frontignan Thau HB': 950,         // Salle Henri Ferrari (1,100)
  // Nationale 1 (Tier 3)
  'Bordeaux Bruges Lormont': 980,
  'Strasbourg Schiltigheim': 880,
  'Gonfreville l\'Orcher': 820,
  'Mulhouse HB': 780,
  'Lanester HB': 740,
  'Hazebrouck HB': 690,
  'Sarrebourg Moselle': 660,
  'Pau Nousty Sports': 650,
  'Martigues HB': 610,
  'Metz Handball': 620,
  'Vénissieux HB': 560,
  'Annecy HB': 540,
  'Torcy HB': 490,
  'Saint-Étienne HB': 460,

  // ==================== DENMARK (Herreligaen & 1. Division) ====================
  'Aalborg Håndbold': 5145,          // Sparekassen Danmark Arena (5,500)
  'Skjern Håndbold': 2962,           // Skjern Bank Arena (3,264)
  'TTH Holstebro': 2450,             // Gråkjær Arena (3,250)
  'Bjerringbro-Silkeborg': 2310,     // JYSK Arena (2,400)
  'KIF Kolding': 2278,               // Sydbank Arena (5,001)
  'GOG Håndbold': 2240,              // Phønix Tag Arena (2,265)
  'Fredericia HK': 2180,             // thansen Arena (2,300)
  'SønderjyskE Herrer': 1890,        // Broager Sparekasse Skansen (2,200)
  'Ribe-Esbjerg HH': 1820,           // Blue Water Dokken (3,380)
  'Skanderborg AGF': 1680,           // Fælledhallen (2,000)
  'Nordsjælland Håndbold': 1550,     // Royal Stage Hillerød (3,000)
  'Mors-Thy Håndbold': 1450,         // Sparekassen Thy Arena (1,500)
  'TMS Ringsted': 1320,              // Ringsted-Hallen (1,600)
  'Grindsted GIF': 980,              // Lynghallen (1,200)
  // 1. Division (Tier 2)
  'HC Midtjylland': 1420,            // Klink & Jensen Arena (2,500)
  'Skive fH': 1350,                  // Interfjord Arena (2,000)
  'Team Sydhavsøerne': 1180,         // BorderShop Arena (1,400)
  'Lemvig-Thyborøn Håndbold': 1150,  // Vestjysk Bank Arena (1,400)
  'HØJ Elite': 1050,                 // Jyllinge Hallen (1,400)
  'Roskilde Håndbold': 940,          // Roskilde Hallerne (1,500)
  'FIF Håndbold': 920,               // Frederiksberghallen (1,400)
  'Aarhus HC': 920,                  // Ceres Stadionhal (1,800)
  'Ajax København': 880,             // Bavnehøj-Hallen (1,200)
  'HC Odense': 860,                  // Odense Idrætshal (2,300)
  'Otterup HK': 720,                 // Otterup Idrætscenter (1,100)
  'FfI Håndbold': 680,               // Arena Nord Frederikshavn
  'Rækker Mølle Håndbold': 640,      // Rækker Mølle Hallen
  'Faaborg ØH': 580,                 // Forum Faaborg

  // ==================== SPAIN (ASOBAL & División de Honor Plata) ====================
  'FC Barcelona': 2680,              // Palau Blaugrana (7,585 - domestic league)
  'Abanca Ademar León': 2525,        // Palacio de los Deportes de León (5,188)
  'Frigoríficos del Morrazo': 2167,  // O Gatañal (2,500)
  'Fraikin BM Granollers': 2150,     // Palau d'Esports de Granollers (5,685)
  'BM Logroño La Rioja': 2120,       // Palacio de los Deportes (3,809)
  'Bathco BM Torrelavega': 2050,     // Pabellón Vicente Trueba (2,400)
  'Recoletas Atlético Valladolid': 2042, // Polideportivo Huerta del Rey (3,500)
  'Bidasoa Irun': 1950,              // Polideportivo Artaleku (2,200)
  'Bada Huesca': 1863,               // Palacio Municipal de Huesca (4,900)
  'Helvetia Anaitasuna': 1850,       // Pabellón Anaitasuna (3,000)
  'REBI Balonmano Cuenca': 1620,     // El Sargal (1,800)
  'BM Guadalajara': 1380,            // David Santamaría (2,000)
  'TM Benidorm': 1250,               // Palau d'Esports L'Illa (3,000)
  'Viveros Herol BM Nava': 980,      // Pabellón Guerrer@s Naver@s (1,000)
  'Ángel Ximénez Puente Genil': 850, // Alcalde Miguel Salas (900)
  // División de Honor Plata (Tier 2)
  'BM Caserío Ciudad Real': 1650,    // Quijote Arena (5,200)
  'UBU San Pablo Burgos': 1420,      // Polideportivo El Plantío (2,500)
  'Fertiberia Puerto Sagunto': 1180, // Pabellón Port de Sagunt (1,500)
  'Blendio Sinfín': 1150,            // Pabellón de La Albericia (2,300)
  'Club Cisne BM': 1080,             // Pavillón Municipal Pontevedra
  'Dólmenes Antequera': 1020,        // Fernando Argüelles (2,500)
  'CD Agustinos Alicante': 880,      // Pitiu Rochel (1,860)
  'Amenabar Zarautz': 820,           // Aritzbatalde
  'Valinox Novás': 790,              // Pavillón do Rosal
  'BM Alcobendas': 680,              // Pabellón de los Sueños
  'UD Ibiza Handbol': 620,           // Es Pratet
  'Handbol Mallorca': 560,           // La Salle Pont d'Inca
  'Atlética Avilesina': 540,         // Polideportivo La Magdalena
  'BM Triana': 520,                  // El Paraguas Sevilla

  // ==================== POLAND (ORLEN Superliga & Liga Centralna) ====================
  'Industria Kielce': 3150,          // Hala Legionów (4,200)
  'ORLEN Wisła Płock': 2850,         // Orlen Arena (5,460)
  'Rebud KPR Ostrovia': 2591,        // Arena Ostrów (3,000)
  'Corotop Gwardia Opole': 1650,     // Stegu Arena (3,378)
  'Energa MKS Kalisz': 1480,         // Arena Kalisz (3,164)
  'KS Azoty-Puławy': 1450,           // Grupa Azoty Arena (3,200)
  'KGHM Chrobry Głogów': 1450,       // Hala Ryszarda Matuszaka (2,000)
  'KGHM Zagłębie Lubin': 1350,       // Hala RCS Lubin (3,714)
  'Zepter KPR Legionowo': 1320,      // Arena Legionowo (1,998)
  'WKS Śląsk Wrocław': 1280,         // Hala Orbita (3,000)
  'Energa MMTS Kwidzyn': 1250,       // Hala widowiskowo-sportowa (1,500)
  'Grupa Azoty Unia Tarnów': 1220,   // Arena Jaskółka Tarnów (4,317)
  'Piotrkowianin Piotrków': 980,     // Hala Relax (1,500)
  'Górnik Zabrze': 950,              // Hala Pogoń (1,000)
  // Liga Centralna (Tier 2)
  'Handball Stal Mielec': 1150,      // Hala MOSiR Mielec (2,200)
  'Sandra SPA Pogoń Szczecin': 1050, // Netto Arena (5,400)
  'Padwa Zamość': 780,               // Hala OSiR Zamość (1,000)
  'Siódemka Miedź Legnica': 720,     // Hala Lotnicza (1,000)
  'AZS AWF Biała Podlaska': 680,     // Hala AWF (1,000)
  'E.Link Gwardia Koszalin': 650,    // Hala Widowiskowo-Sportowa (1,200)
  'Jurand Ciechanów': 640,           // Hala MOSiR Ciechanów (800)
  'Nielba Wągrowiec': 580,           // Hala OSiR Wągrowiec (800)
  'Olimpia Piekary Śląskie': 560,    // Hala MOSiR Piekary (800)
  'Zagłębie Sosnowiec': 520,         // Hala Żeromskiego (1,000)
  'Anilana Łódź': 460,               // Hala Anilana (1,000)
  'WKS Grunwald Poznań': 420,        // Hala Grunwald (600)
  'KPR Fit Dieta Żukowo': 410,       // Hala Żukowo (600)
  'SMS ZPRP I Kielce': 220,          // Federation Youth School Hall (500)

  // ==================== HUNGARY (K&H Liga & NB I/B) ====================
  'OTP Bank - Pick Szeged': 5150,    // Pick Aréna (8,143)
  'Veszprém KC': 4850,               // Veszprém Aréna (5,019)
  'MOL Tatabánya KC': 2950,          // Tatabányai Multifunkcionális Csarnok (6,200)
  'ETO University HT': 1350,         // Magvassy Mihály Sportcsarnok (2,800)
  'Dabas KC': 1250,                  // OBO Aréna Dabas (2,000)
  'Ferencvárosi TC': 1200,           // Elek Gyula Aréna (1,300)
  'Balatonfüredi KSE': 1150,         // Szabadidőközpont (1,500)
  'HE-DO B. Braun Gyöngyös': 1100,   // Dr. Fejes András Sportcsarnok (1,500)
  'QHB Eger': 1050,                  // Kemény Ferenc Sportcsarnok (1,200)
  'Csurgói KK': 950,                 // Sótonyi László Sportcsarnok (1,200)
  'Sport36-Komló': 880,              // Komlói Sportközpont (1,200)
  'PLER-Budapest': 850,              // BUD Aréna (1,200)
  'NEKA': 650,                       // NEKA Sportcsarnok Balatonboglár (900)
  'Budakalász KZRT': 580,            // Budakalász Sportcsarnok (900)
  // NB I/B (Tier 2)
  'DEAC': 780,                       // Hódos Imre Rendezvénycsarnok (1,500)
  'Ceglédi KKSE': 720,               // Gál József Sportcsarnok (1,200)
  'Békési FKC': 680,                 // Városi Sportcsarnok Békés (1,100)
  'Mezőkövesdi KC': 650,             // Városi Sportcsarnok Mezőkövesd (1,200)
  'Ózdi KC': 640,                    // Marosi István Városi Sportcsarnok (1,200)
  'Százhalombattai KE': 540,         // Városi Szabadidőközpont (1,200)
  'Tatai AC': 520,                   // Güntner Aréna Tata (1,100)
  'Szigetszentmiklósi KSK': 490,     // Városi Sportcsarnok (1,100)
  'Salgótarjáni SKC': 480,           // Városi Sportcsarnok (1,200)
  'Ajka KSE': 440,                   // Városi Sportcentrum Ajka (800)
  'Vecsés SE': 390,                  // Városi Sportcsarnok Vecsés (800)

  // ==================== NORWAY (REMA 1000-ligaen & 1. divisjon) ====================
  'Kolstad Håndball': 4680,          // Trondheim Spektrum (8,900)
  'Elverum Håndball': 2120,          // Terningen Arena (2,500)
  'ØIF Arendal': 1750,               // Sparebanken Sør Amfi (2,500)
  'Drammen HK': 1450,                // Drammenshallen (4,000)
  'Bergen Håndball': 1420,           // Haukelandshallen (3,000)
  'Nærbø IL': 1350,                  // SpareBank 1 Arena (1,500)
  'Kristiansand Topphåndball': 1250, // Aquarama (2,200)
  'Runar Sandefjord': 1200,          // Runarhallen (1,500)
  'Haslum HK': 1150,                 // Nadderud Arena (2,050)
  'Halden Topphåndball': 1120,       // Halden Arena (2,200)
  'Follo HK': 950,                   // Stil Arena (1,500)
  'Fjellhammer IL': 920,             // Fjellhamar Arena (1,600)
  'Bækkelaget Håndball Elite': 880,  // Nordstrand Arena (1,500)
  'Sandnes HK': 820,                 // Sandneshallen (1,200)
  // 1. divisjon (Tier 2)
  'Ryger Stavanger': 980,            // Stavanger Idrettshall
  'Bodø HK': 960,                    // Bodø Spektrum (2,200)
  'Sandefjord Håndball': 890,        // Jotunhallen (1,800)
  'Viking TIF': 720,                 // Haukelandshallen / Åsane Arena
  'Falk Horten': 660,                // Holtanhallen (1,500)
  'Grenland Topphåndball': 540,      // Skienshallen (1,200)
  'Charlottenlund SK': 510,          // CSK Varmbo Arena (1,100)
  'Melhus IL': 480,                  // Melhushallen (1,200)
  'Tromsø HK': 470,                  // Tromsøhallen (1,200)
  'HK Herulf Moss': 450,             // Mossehallen (1,200)
  'Urædd Håndball': 420,             // Borgehallen (1,100)
  'OSI Håndball': 280,               // Domus Athletica Oslo (800)

  // ==================== SWEDEN (Handbollsligan & Allsvenskan) ====================
  'IFK Kristianstad': 3850,          // Kristianstad Arena (4,700)
  'Ystads IF': 2350,                 // Ystad Arena (2,700)
  'IK Sävehof': 2150,                // Partille Arena (4,000)
  'Hammarby IF': 1950,               // Eriksdalshallen (2,600)
  'IFK Skövde': 1820,                // Arena Skövde (2,280)
  'Eskilstuna Guif': 1780,           // STIGA Sports Arena (4,000)
  'Alingsås HK': 1750,               // Estrad Alingsås (2,800)
  'HK Malmö': 1450,                  // Baltiska hallen (4,000)
  'HF Karlskrona': 1420,             // Brinova Arena Karlskrona (2,500)
  'IFK Ystad': 1380,                 // Ystad Arena (2,700)
  'IF Hallby': 1350,                 // Jönköpings Idrottshus (1,800)
  'HK Aranäs': 1150,                 // Kungsbacka Ishall (1,500)
  'Önnereds HK': 1100,               // ÖHK-hallen (1,500)
  'Amo HK': 920,                     // Amokabel-Hallen (1,000)
  // Allsvenskan (Tier 2)
  'LUGI HF': 1180,                   // Sparbanken Skåne Arena (3,000)
  'HK Drott': 1150,                  // Halmstad Arena (3,800)
  'Redbergslids IK': 1120,           // Prioritet Serneke Arena / Lisebergshallen
  'HK Varberg': 960,                 // Sparbankshallen Varberg (2,200)
  'VästeråsIrsta HF': 880,           // Västerås Arena (2,400)
  'Kungälvs HK': 760,                // Mimershushallen (1,500)
  'Vinslövs HK': 690,                // Furutorpshallen (1,100)
  'Skånela IF': 680,                 // Vikingahallen Märsta (1,200)
  'Anderstorps SK': 650,             // Anderstorps Sporthall (1,400)
  'Tyresö Handboll': 640,            // Tyresöhallen (1,400)
  'IFK Tumba': 540,                  // Tumba Idrottshus (1,400)
  'Rimbo HK': 480,                   // Sparbankshallen Rimbo (800)

  // ==================== CROATIA (Premijer Liga & 1. HRL) ====================
  'RK Zagreb': 2850,                 // Arena Zagreb (15,200 - domestic baseline)
  'RK Nexe': 1850,                   // Sportska dvorana kralja Tomislava (2,000)
  'RK Metković': 1250,               // Gradska sportska dvorana Metković
  'HRK Karlovac': 1150,              // ŠSD Mladost Karlovac
  'MRK Sesvete': 1150,               // Sportska dvorana Jelkovec (1,400)
  'GRK Varaždin': 1150,              // Arena Varaždin / Graberje (3,500)
  'RK Zamet': 1050,                  // Centar Zamet (2,350)
  'RK Osijek': 980,                  // Dvorana Zrinjevac (1,500)
  'RK Poreč': 950,                   // SRC Veli Jože (1,200)
  'MRK Čakovec': 920,                // Dvorana GŠ Čakovec (1,500)
  'HRK Gorica': 920,                 // Gradska dvorana (1,100)
  'RK Dubrava': 820,                 // SD Dubrava (1,500)
  'RK Moslavina': 750,               // Športski centar Kutina (1,500)
  'MRK Trogir': 720,                 // Dvorana Vinko Kandija (1,100)
  'RK Ribola Kaštela': 680,          // GD Sokolana Kaštel Sućurac (1,200)
  'RK Rudar Rude': 620,              // SD Rude (1,000)
  // 1. HRL (Tier 2)
  'RK Split': 680,                   // SC Gripe Mala dvorana (2,000)
  'RK Zadar 1954': 620,              // Dvorana Mocire (1,500)
  'RK Sisak': 560,                   // SD Zeleni brijeg (1,500)
  'RK Đakovo': 540,                  // Nastavno-sportska dvorana Đakovo (1,500)
  'MRK Umag': 480,                   // ŠD Stella Maris (1,200)
  'RK Ardiaei': 450,                 // ŠD Mlini Župa dubrovačka (1,200)
  'RK Požega': 440,                  // SD Tomislav Pirc (1,200)
  'MRK Kozala': 420,                 // Dvorana Dinko Lukarić Rijeka (1,100)
  'RK Senj': 390,                    // ŠD Robert Barbić-Beli (1,000)
  'MRK Vidovec': 380,                // ŠSD Vidovec (900)
  'RK Rovinj': 350,                  // Dvorana Gimnasium Rovinj (1,100)
  'RK Maksimir Pastela': 280,        // SD Martinovka / MIOC Zagreb (1,000)

  // ==================== PORTUGAL (Andebol 1 & Divisão de Honra) ====================
  'Sporting CP': 2150,               // Pavilhão João Rocha (3,000)
  'FC Porto': 1880,                  // Dragão Arena (2,179)
  'ABC Braga': 1450,                 // Pavilhão Flávio Sá Leite (2,500)
  'SL Benfica': 1250,                // Pavilhão da Luz Nº 2 (1,540)
  'Vitória SC': 1220,                // Pavilhão Unidade Vimaranense (1,800)
  'Marítimo da Madeira': 980,        // Pavilhão do Marítimo (1,500)
  'Águas Santas': 950,               // Pavilhão da Associação (1,200)
  'Póvoa AC': 850,                   // Pavilhão Municipal (1,200)
  'CF Os Belenenses': 820,           // Pavilhão Acácio Rosa (1,500)
  'FC Gaia': 780,                    // Pavilhão FC Gaia (1,200)
  'Artística de Avanca': 750,        // Pavilhão Comendador Adelino (1,200)
  'Vitória FC': 740,                 // Pavilhão Antoine Velge (1,500)
  // Divisão de Honra (Tier 2)
  'Boavista FC': 620,                // Pavilhão Vasco Gama / Fontes Pereira de Melo
  'AD Sanjoanense': 580,             // Pavilhão dos Desportos São João da Madeira
  'São Bernardo': 540,               // Gimnodesportivo de São Bernardo
  'AC Fafe': 520,                    // Pavilhão Multiusos de Fafe
  'Xico Andebol': 490,               // Pavilhão Desportivo Francisco de Holanda
  'GC Santo Tirso': 460,             // Pavilhão Municipal de Santo Tirso
  'Académico de Viseu': 450,         // Pavilhão Cidade de Viseu
  'Boa-Hora FC': 440,                // Pavilhão Fernando Tavares
  'Almada AC': 410,                  // Complexo Municipal dos Desportos
  'Alto do Moinho': 390,             // Pavilhão Municipal Alto do Moinho
  'Nazaré Dom Fuas': 380,            // Pavilhão Gimnodesportivo da Nazaré
  'Vela de Tavira': 320,             // Pavilhão Dr. Eduardo Mansinho

  // ==================== SWITZERLAND (Quickline Handball League) ====================
  'Kadetten Schaffhausen': 1750,     // BBC Arena (3,500)
  'Pfadi Winterthur': 1350,          // AXA Arena (2,000)
  'HC Kriens-Luzern': 1220,          // Krauerhalle (1,300)
  'TSV St. Otmar St. Gallen': 1180,  // Kreuzbleiche (3,500)
  'BSV Bern': 1150,                  // Mobiliar Arena (2,000)
  'Wacker Thun': 1120,               // Lachenhalle (2,000)
  'HSC Suhr Aarau': 1050,            // Schachenhalle (2,000)
  'GC Amicitia Zürich': 850,         // Saalsporthalle (2,300)
  'RTV 1879 Basel': 820,             // Rankhof (1,500)
  'CS Chênois Genève': 650,          // Sous-Moulin (1,000)

  // ==================== AUSTRIA (HLA Meisterliga) ====================
  'Alpla HC Hard': 1650,             // Sporthalle am See (2,280)
  'Bregenz Handball': 1250,          // Handball-Arena Rieden-Vorkloster (1,600)
  'Förthof UHK Krems': 1150,         // Sport.Halle.Krems (1,400)
  'HC Fivers Margareten': 980,       // Sporthalle Hollgasse (1,200)
  'HSG Holding Graz': 920,           // Raiffeisen Sportpark Graz (3,000)
  'Handball Tirol': 850,             // Osthalle Schwaz (1,000)
  'Handball Westwien': 850,          // BSFZ Südstadt (1,200)
  'BT Füchse Auto Pichler': 780,     // Sporthalle Bruck (1,000)
  'SC kelag Ferlach': 720,           // Ballspielhalle Ferlach (800)
  'HSG Bärnbach/Köflach': 680,       // Sporthalle Bärnbach (1,000)
  'roomz JAGS Vöslau': 620,          // Thermenhalle Bad Vöslau (800)
  'UHC Hollabrunn': 580,             // Weinviertelarena (800)

  // ==================== ICELAND (Olís deildin & Grill 66-deildin) ====================
  'Valur': 1350,                     // Origo-höllin (2,500)
  'FH': 1150,                        // Kaplakriki (2,200)
  'Haukar': 950,                     // Schenkerhöllin (2,000)
  'ÍBV': 850,                        // Íþróttamiðstöð Vestmannaeyja (1,500)
  'Fram': 820,                       // Íþróttahús Fram (1,600)
  'Afturelding': 800,                // Varmá (1,400)
  'Stjarnan': 780,                   // Ásgarður (1,500)
  'KA': 750,                         // KA heimilið (1,800)
  'Selfoss': 720,                    // Iða (1,200)
  'HK': 680,                         // Kórinn (1,200)
  'Grótta': 650,                     // Hertz-höllin (1,100)
  'Hörður': 520,                     // Torfnes (800)
  // Grill 66-deildin (Tier 2)
  'Víkingur': 460,                   // Víkin (1,200)
  'Þór': 450,                        // Höllin Akureyri (1,200)
  'ÍR': 420,                         // Skógarsel (1,200)
  'Fjölnir': 360,                    // Dalhús (1,100)
  'KR': 350,                         // DHL-höllin (1,200)
  'Kári': 260,                       // Akraneshöllin (800)
  'Hvíti riddarinn': 210,            // Varmá (800)
  'Berserkir': 190,                  // Víkin (800)
  'Mílan': 180,                      // Selfoss (600)
  'Vængir Júpiters': 170,            // Fjölnishöllin (600)
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
  'viking',
  'stjarnan',
]);

// Country-level spectator market factor relative to Germany across lower tiers (Tiers 2–6)
const COUNTRY_LOWER_TIER_ATTENDANCE_SCALE: Record<string, number> = {
  GER: 1.00,
  FRA: 0.78,
  DEN: 0.66,
  ESP: 0.60,
  SWE: 0.60,
  POL: 0.56,
  NOR: 0.52,
  HUN: 0.50,
  ROU: 0.50,
  MKD: 0.50,
  SLO: 0.48,
  SUI: 0.46,
  AUT: 0.44,
  CRO: 0.42,
  POR: 0.42,
  ISL: 0.34,
  ITA: 0.34,
  USA: 0.32,
  ECU: 0.28,
};

const normalizeSimpleCountry = (country?: string): string => {
  if (!country || typeof country !== 'string') return 'GER';
  const c = country.trim().toUpperCase();
  return c || 'GER';
};

/**
 * Returns documented real-life starting attendance if available for the given club.
 */
export const getRealLifeStartingAttendance = (clubName: string, clubId?: string | number): number | null => {
  if (!clubName && !clubId) return null;

  // Immediately return null for reserve / U23 / II teams
  if (isReserveClubName(clubName)) {
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
    return REAL_LIFE_START_ATTENDANCES['Veszprém KC'] || 4850;
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
 * Calculates a realistic starting attendance for any club across all tiers (Tiers 1–6 & Reserves).
 * - Documented real-life figures take top priority.
 * - Reserve / II / U21 squads are calibrated to authentic reserve hall crowds (80–285, strictly <= 290).
 * - Lower-tier clubs (Tiers 2–6) scale by both division tier and national spectator ecosystem so
 *   every pyramid maintains authentic monotonic attendance progression (T1 > T2 > T3 > T4 > T5 > T6).
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
  const tier = club.tier || 1;
  const ctry = normalizeSimpleCountry(club.country);
  const marketScale = COUNTRY_LOWER_TIER_ATTENDANCE_SCALE[ctry] ?? 0.45;

  // 1. Reserve / Academy II Squads (strictly capped below the 300-spectator reserve ceiling)
  if (isReserveClubName(club.name)) {
    const baseRes =
      tier <= 2 ? 255 : tier === 3 ? 195 : tier === 4 ? 135 : 85;
    const scaledRes = Math.round(baseRes * (0.62 + 0.38 * marketScale));
    return Math.max(45, Math.min(stad, 285, scaledRes));
  }

  // 2. Official documented real-life average attendance
  const realAtt = getRealLifeStartingAttendance(club.name || '', club.id);
  if (realAtt && realAtt > 0) {
    return Math.min(stad, realAtt);
  }

  // 3. Country- & Tier-calibrated baseline utilization for Tiers 1–6
  const baseOvr = club.baseOvr || (tier === 1 ? 75 : tier === 2 ? 68 : tier === 3 ? 60 : tier === 4 ? 52 : 44);
  const rep = club.rep || baseOvr;

  const baseUtilByTier =
    tier === 1
      ? 0.68
      : tier === 2
      ? 0.56
      : tier === 3
      ? 0.44
      : tier === 4
      ? 0.40
      : tier === 5
      ? 0.33
      : 0.27;

  // Modulate utilization gently by national spectator culture in lower divisions
  const countryUtilFactor = tier === 1 ? (0.72 + 0.28 * marketScale) : (0.58 + 0.42 * marketScale);
  const targetLeagueAvg =
    tier === 1 ? 80 : tier === 2 ? 68 : tier === 3 ? 60 : tier === 4 ? 47 : tier === 5 ? 40 : 35;
  const perfBonus = Math.max(-0.10, Math.min(0.14, ((baseOvr + rep) / 2 - targetLeagueAvg) * 0.014));
  const effectiveUtil = Math.max(0.18, Math.min(0.90, baseUtilByTier * countryUtilFactor + perfBonus));

  // Typical hall size per division scaled to country pyramid
  const rawStandardVenue =
    tier === 1
      ? 6800
      : tier === 2
      ? 2900
      : tier === 3
      ? 1350
      : tier === 4
      ? 720
      : tier === 5
      ? 420
      : 260;
  const standardTierVenue = Math.max(180, Math.round(rawStandardVenue * (0.45 + 0.55 * marketScale)));

  let calcAtt = 0;
  if (stad <= standardTierVenue) {
    calcAtt = Math.round(stad * effectiveUtil);
  } else {
    // Diminishing returns for oversized municipal halls in lower divisions
    const primaryTierFill = standardTierVenue * effectiveUtil;
    const extraSeats = stad - standardTierVenue;
    calcAtt = Math.round(primaryTierFill + extraSeats * effectiveUtil * 0.25);
  }

  return Math.max(40, Math.min(stad, calcAtt));
};

/**
 * Derives the starting supporter base (fanBase) required to sustain the authentic starting attendance.
 * Weekly home matchday attendance represents ~13-16% active ticket demand of the broader supporter base.
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
  const activeRate = tier === 1 ? 0.16 : tier === 2 ? 0.15 : tier === 3 ? 0.14 : 0.13;
  return Math.round(startAtt / activeRate);
};
