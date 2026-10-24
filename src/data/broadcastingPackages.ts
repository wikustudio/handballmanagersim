import { isAnyModActive } from '../utils/modManager';

export interface BroadcastingPackage {
  country: string;
  networkName: string;
  networkBadge: string;
  networkTag: string;
  primaryColor: string;
  accentColor: string;
  nationalCupName: string;
  regionalCupName: string;
  decisionDayShow: string;
  mainArena: string;
  lowerThirdBug: string;
  championshipMOTW: string;
  logoKey?: string;
  isFictional?: boolean;
}

export const BROADCASTING_PACKAGES: Record<string, BroadcastingPackage> = {
  GER: {
    country: 'GER',
    networkName: 'Dyn Sport',
    networkBadge: 'DYN EXCLUSIVE',
    networkTag: 'DYN 1 HD',
    primaryColor: '#ff5500',
    accentColor: '#ffa000',
    nationalCupName: 'DHB-Pokal',
    regionalCupName: 'DHB Amateur Cup',
    decisionDayShow: 'DYN MULTIPLEX · DECISION DAY LIVE',
    mainArena: 'Lanxess Arena, Cologne',
    lowerThirdBug: 'DYN HOST BROADCAST · BUNDESLIGA LIVE FEED',
    championshipMOTW: 'DYN MATCH OF THE WEEK',
    logoKey: 'DYN',
  },
  DEN: {
    country: 'DEN',
    networkName: 'TV 2 Sport',
    networkBadge: 'TV 2 DIREKTE',
    networkTag: 'TV 2 SPORT HD',
    primaryColor: '#e30613',
    accentColor: '#38bdf8',
    nationalCupName: 'Santander Cup',
    regionalCupName: 'Jysk / Sjællandsk Pokal',
    decisionDayShow: 'AFGØRELSESDAGEN DIREKTE',
    mainArena: 'Jyske Bank Boxen, Herning',
    lowerThirdBug: 'TV 2 SPORT DANMARK · HÅNDBOLDLIGAEN DIREKTE',
    championshipMOTW: 'UGENS KAMP I HERRELIGAEN',
    logoKey: 'TV2',
  },
  FRA: {
    country: 'FRA',
    networkName: 'beIN SPORTS',
    networkBadge: 'beIN DIRECT HD',
    networkTag: 'beIN SPORTS 1',
    primaryColor: '#7c3aed',
    accentColor: '#fbbf24',
    nationalCupName: 'Coupe de France',
    regionalCupName: 'Coupe Régionale Fédérale',
    decisionDayShow: 'MULTIPLEX STARLIGUE · MATCH DÉCISIF',
    mainArena: 'Accor Arena, Paris-Bercy',
    lowerThirdBug: 'beIN SPORTS FRANCE · DIRECT ÉDITION LIQUI MOLY',
    championshipMOTW: 'LE CHOC DU CHAMPIONNAT',
    logoKey: 'BEIN',
  },
  ESP: {
    country: 'ESP',
    networkName: 'Teledeporte (RTVE) / ASOBAL TV',
    networkBadge: 'TDP EN DIRECTO',
    networkTag: 'TELEDEPORTE · ASOBAL',
    primaryColor: '#e11d48',
    accentColor: '#f59e0b',
    nationalCupName: 'Copa del Rey',
    regionalCupName: 'Copa Federación',
    decisionDayShow: 'JORNADA FINAL ASOBAL · EN DIRECTO',
    mainArena: 'Palau Blaugrana / Madrid Arena',
    lowerThirdBug: 'RTVE TELEDEPORTE · LIGA PLENITUDE EN DIRECTO',
    championshipMOTW: 'EL PARTIDAZO ASOBAL DE LA JORNADA',
    logoKey: 'TELEDEPORTE',
  },
  SWE: {
    country: 'SWE',
    networkName: 'SVT Sport / Handbollsligan Live',
    networkBadge: 'SVT DIREKT',
    networkTag: 'SVT SPORT 1',
    primaryColor: '#0284c7',
    accentColor: '#facc15',
    nationalCupName: 'Svenska Cupen',
    regionalCupName: 'Distriktsmästerskapen',
    decisionDayShow: 'SLUTSPELSKVALET DIREKTSÄNDNING',
    mainArena: 'Scandinavium, Göteborg',
    lowerThirdBug: 'SVT SPORT SVERIGE · HANDBOLLSLIGAN LIVE',
    championshipMOTW: 'VECKANS MATCH I HANDBOLLSLIGAN',
    logoKey: 'SVT',
  },
  CRO: {
    country: 'CRO',
    networkName: 'Arena Sport',
    networkBadge: 'ARENA SPORT UŽIVO',
    networkTag: 'ARENA SPORT 1 HD',
    primaryColor: '#0369a1',
    accentColor: '#38bdf8',
    nationalCupName: 'Kup Hrvatske',
    regionalCupName: 'Regionalni Kup',
    decisionDayShow: 'ARENA MULTIPRIJENOS · DAN ODLUKE',
    mainArena: 'Arena Zagreb',
    lowerThirdBug: 'ARENA SPORT HRVATSKA · PAKET24 PREMIJER LIGA',
    championshipMOTW: 'DERBI KOLA PREMIJER LIGE',
    logoKey: 'ARENA_SPORT',
  },
  POR: {
    country: 'POR',
    networkName: 'Sport TV',
    networkBadge: 'SPORT TV DIRETO',
    networkTag: 'SPORT TV 1 HD',
    primaryColor: '#0a0a0c',
    accentColor: '#fdea00',
    nationalCupName: 'Taça de Portugal',
    regionalCupName: 'Taça Federação',
    decisionDayShow: 'DECISÃO DO TÍTULO · EM DIRETO',
    mainArena: 'Pavilhão João Rocha, Lisboa',
    lowerThirdBug: 'SPORT TV PORTUGAL · CAMPEONATO PLACARD 1',
    championshipMOTW: 'CLÁSSICO DO ANDEBOL',
    logoKey: 'SPORT_TV',
  },
  NOR: {
    country: 'NOR',
    networkName: 'TV 2 Sport / Direktesport',
    networkBadge: 'TV 2 DIREKTE',
    networkTag: 'TV 2 SPORT 2',
    primaryColor: '#dc2626',
    accentColor: '#60a5fa',
    nationalCupName: 'Norgesmesterskapet (NM)',
    regionalCupName: 'Regionscupen',
    decisionDayShow: 'SKJEBNEDAG REMA 1000 DIREKTE',
    mainArena: 'Oslo Spektrum',
    lowerThirdBug: 'TV 2 NORGE · REMA 1000-LIGAEN DIREKTESENDT',
    championshipMOTW: 'HOVEDKAMPEN I REMA 1000-LIGAEN',
    logoKey: 'TV2',
  },
  HUN: {
    country: 'HUN',
    networkName: 'M4 Sport',
    networkBadge: 'M4 SPORT ÉLŐ',
    networkTag: 'M4 SPORT HD',
    primaryColor: '#16a34a',
    accentColor: '#f97316',
    nationalCupName: 'Magyar Kupa',
    regionalCupName: 'Szövetségi Kupa',
    decisionDayShow: 'BAJNOKI DÖNTŐ ÉS KÖRCSAPÁS',
    mainArena: 'MVM Dome, Budapest',
    lowerThirdBug: 'M4 SPORT MAGYARORSZÁG · K&H FÉRFI KÉZILABDA',
    championshipMOTW: 'A FORDULÓ RANGADÓJA',
    logoKey: 'M4',
  },
  ISL: {
    country: 'ISL',
    networkName: 'Stöð 2 Sport',
    networkBadge: 'STÖÐ 2 Í BEINNI',
    networkTag: 'STÖÐ 2 SPORT',
    primaryColor: '#2563eb',
    accentColor: '#38bdf8',
    nationalCupName: 'Coca-Cola Bikarinn',
    regionalCupName: 'Reykjavíkurmótið',
    decisionDayShow: 'ÚRSLITAKVÖLD STÖÐ 2 SPORT',
    mainArena: 'Laugardalshöll, Reykjavík',
    lowerThirdBug: 'STÖÐ 2 SPORT ÍSLAND · OLÍS DEILDIN BEINT',
    championshipMOTW: 'LEIKUR VIKUNNAR Í OLÍS DEILDINNI',
    logoKey: 'STOD2',
  },
  POL: {
    country: 'POL',
    networkName: 'Polsat Sport',
    networkBadge: 'POLSAT NA ŻYWO',
    networkTag: 'POLSAT SPORT 1',
    primaryColor: '#ea580c',
    accentColor: '#facc15',
    nationalCupName: 'Puchar Polski',
    regionalCupName: 'Puchar Regionalny',
    decisionDayShow: 'MULTILIGA SUPERLIGI NA ŻYWO',
    mainArena: 'Orlen Arena, Płock',
    lowerThirdBug: 'POLSAT SPORT POLSKA · ORLEN SUPERLIGA LIVE',
    championshipMOTW: 'MECZ KOLEJKI SUPERLIGI',
    logoKey: 'POLSAT',
  },
  AUT: {
    country: 'AUT',
    networkName: 'ORF Sport+ / LAOLA1',
    networkBadge: 'ORF SPORT+ LIVE',
    networkTag: 'ORF SPORT+ HD',
    primaryColor: '#dc2626',
    accentColor: '#facc15',
    nationalCupName: 'ÖHB-Cup',
    regionalCupName: 'ÖHB Amateur Cup',
    decisionDayShow: 'ORF SPORT+ · HLA CHAMPIONSHIP DECIDER',
    mainArena: 'Handball Arena Rieden-Vorkloster, Bregenz',
    lowerThirdBug: 'ORF SPORT+ AUSTRIA · HLA MEISTERLIGA LIVE',
    championshipMOTW: 'HLA MATCH OF THE ROUND',
    logoKey: 'ORF',
  },
  SUI: {
    country: 'SUI',
    networkName: 'SRF sport / RED+',
    networkBadge: 'SRF SPORT LIVE',
    networkTag: 'SRF zwei HD',
    primaryColor: '#b91c1c',
    accentColor: '#ffffff',
    nationalCupName: 'Mobiliar Handball Cup',
    regionalCupName: 'SHV Regional Cup',
    decisionDayShow: 'SRF SPORT · FINALS & DECISION DAY LIVE',
    mainArena: 'Saalsporthalle, Zürich',
    lowerThirdBug: 'SRF SPORT SWITZERLAND · QUICKLINE HANDBALL LEAGUE LIVE',
    championshipMOTW: 'QHL MATCH OF THE DAY',
    logoKey: 'SRF',
  },
  SLO: {
    country: 'SLO',
    networkName: 'Arena Sport / Sportklub',
    networkBadge: 'ARENA SPORT V ŽIVO',
    networkTag: 'ARENA SPORT 1 SLO',
    primaryColor: '#0284c7',
    accentColor: '#10b981',
    nationalCupName: 'Pokal Slovenije',
    regionalCupName: 'Regionalni Pokal Slovenije',
    decisionDayShow: 'ODLOČITEV O PRVAKU · V ŽIVO',
    mainArena: 'Dvorana Zlatorog, Celje',
    lowerThirdBug: 'ARENA SPORT SLOVENIJA · LIGA NLB V ŽIVO',
    championshipMOTW: 'DERBI KOLA LIGE NLB',
    logoKey: 'ARENA_SPORT',
  },
  MKD: {
    country: 'MKD',
    networkName: 'MRT / Arena Sport',
    networkBadge: 'МРТ ВО ЖИВО',
    networkTag: 'MRT 3 HD',
    primaryColor: '#dc2626',
    accentColor: '#facc15',
    nationalCupName: 'Kup na Makedonija',
    regionalCupName: 'Regionalen Kup na Makedonija',
    decisionDayShow: 'ДЕН НА ОДЛУКА СУПЕРЛИГА',
    mainArena: 'Jane Sandanski Arena, Skopje',
    lowerThirdBug: 'MRT SPORT MAKEDONIJA · VIP SUPERLIGA ВО ЖИВО',
    championshipMOTW: 'ДЕРБИ НА КОЛОТО СУПЕРЛИГА',
    logoKey: 'ARENA_SPORT',
  },
  ITA: {
    country: 'ITA',
    networkName: 'PallamanoTV / Sky Sport',
    networkBadge: 'SKY SPORT DIRETTA',
    networkTag: 'PALLAMANOTV HD',
    primaryColor: '#0284c7',
    accentColor: '#38bdf8',
    nationalCupName: 'Coppa Italia',
    regionalCupName: 'Coppa Federale',
    decisionDayShow: 'FINALS SCUDETTO IN DIRETTA',
    mainArena: 'Palasport Chiarbola, Trieste',
    lowerThirdBug: 'PALLAMANOTV FEDERHANDBALL · SERIE A GOLD LIVE',
    championshipMOTW: 'BIG MATCH SERIE A GOLD',
    logoKey: 'ARENA_SPORT',
  },
};

// ============================================================================
// NATIONAL PUBLIC & FREE-TO-AIR MARQUEE BROADCASTERS
// ============================================================================

// Germany - ARD (Das Erste / Sportschau)
export const GER_ARD_BROADCAST: BroadcastingPackage = {
  country: 'GER',
  networkName: 'ARD (Das Erste / Sportschau)',
  networkBadge: 'ARD LIVE',
  networkTag: 'DAS ERSTE HD',
  primaryColor: '#002d62',
  accentColor: '#f59e0b',
  nationalCupName: 'DHB-Pokal',
  regionalCupName: 'DHB Amateur Cup',
  decisionDayShow: 'ARD SPORTSCHAU · CHAMPIONSHIP DECIDER LIVE',
  mainArena: 'Lanxess Arena, Cologne',
  lowerThirdBug: 'ARD SPORTSCHAU · CHAMPIONSHIP & DHB-POKAL LIVE',
  championshipMOTW: 'ARD SPORTSCHAU MATCH OF THE WEEK',
  logoKey: 'ARD',
};

// Germany - ZDF (sportstudio live)
export const GER_ZDF_BROADCAST: BroadcastingPackage = {
  country: 'GER',
  networkName: 'ZDF (sportstudio live)',
  networkBadge: 'ZDF LIVE',
  networkTag: 'ZDF SPORTSTUDIO',
  primaryColor: '#fa7d00',
  accentColor: '#1f2937',
  nationalCupName: 'DHB-Pokal',
  regionalCupName: 'DHB Amateur Cup',
  decisionDayShow: 'ZDF SPORTSTUDIO · THE GRAND FINAL LIVE',
  mainArena: 'Lanxess Arena, Cologne',
  lowerThirdBug: 'ZDF SPORTSTUDIO · LIVE FROM THE ARENA',
  championshipMOTW: 'ZDF LIVE MATCH OF THE WEEK',
  logoKey: 'ZDF',
};

// Denmark - DR 1 Sport
export const DEN_DR_BROADCAST: BroadcastingPackage = {
  country: 'DEN',
  networkName: 'DR 1 Sport',
  networkBadge: 'DR DIREKTE',
  networkTag: 'DR 1 HD',
  primaryColor: '#c8102e',
  accentColor: '#ffffff',
  nationalCupName: 'Santander Cup',
  regionalCupName: 'Jysk / Sjællandsk Pokal',
  decisionDayShow: 'DR SPORTEN · AFGØRELSESDAGEN',
  mainArena: 'Jyske Bank Boxen, Herning',
  lowerThirdBug: 'DR SPORTEN · HÅNDBOLD DIREKTE PÅ DR 1',
  championshipMOTW: 'DR 1 UGENTS KAMP',
  logoKey: 'DR',
};

// France - France Télévisions / L'Équipe
export const FRA_FRANCE_TV_BROADCAST: BroadcastingPackage = {
  country: 'FRA',
  networkName: 'France Télévisions / L\'Équipe',
  networkBadge: 'FRANCE TV SPORT',
  networkTag: 'FRANCE 3 DIRECT',
  primaryColor: '#001b69',
  accentColor: '#e11d48',
  nationalCupName: 'Coupe de France',
  regionalCupName: 'Coupe Régionale Fédérale',
  decisionDayShow: 'FRANCE TV SPORT · MATCH POUR LE TITRE',
  mainArena: 'Accor Arena, Paris-Bercy',
  lowerThirdBug: 'FRANCE TÉLÉVISIONS · COUPE DE FRANCE EN CLAIR',
  championshipMOTW: 'LE GRAND FORMAT HANDBALL',
  logoKey: 'FRANCE_TV',
};

// Spain - RTVE La 1 / Teledeporte Marquee
export const ESP_RTVE_BROADCAST: BroadcastingPackage = {
  country: 'ESP',
  networkName: 'RTVE (La 1 / Teledeporte)',
  networkBadge: 'RTVE EN DIRECTO',
  networkTag: 'LA 1 HD',
  primaryColor: '#e11d48',
  accentColor: '#3b82f6',
  nationalCupName: 'Copa del Rey',
  regionalCupName: 'Copa Federación',
  decisionDayShow: 'RTVE SPORT · JORNADA FINAL Y TÍTULO',
  mainArena: 'Palau Blaugrana / Madrid Arena',
  lowerThirdBug: 'RTVE DEPORTES · COPA DEL REY Y FINAL ASOBAL',
  championshipMOTW: 'EL GRAN PARTIDO RTVE',
  logoKey: 'TELEDEPORTE',
};

// Norway - NRK 1 Sport
export const NOR_NRK_BROADCAST: BroadcastingPackage = {
  country: 'NOR',
  networkName: 'NRK 1 Sport',
  networkBadge: 'NRK DIREKTE',
  networkTag: 'NRK 1 HD',
  primaryColor: '#00457c',
  accentColor: '#dc2626',
  nationalCupName: 'Norgesmesterskapet (NM)',
  regionalCupName: 'Regionscupen',
  decisionDayShow: 'NRK SPORT · FINALE OG SKJEBNEDAG',
  mainArena: 'Oslo Spektrum',
  lowerThirdBug: 'NRK SPORT · NM-FINALE OG ELITEHÅNDBALL',
  championshipMOTW: 'NRK HOVEDKAMPEN',
  logoKey: 'NRK',
};

// Poland - TVP Sport
export const POL_TVP_BROADCAST: BroadcastingPackage = {
  country: 'POL',
  networkName: 'TVP Sport',
  networkBadge: 'TVP NA ŻYWO',
  networkTag: 'TVP SPORT HD',
  primaryColor: '#dc2626',
  accentColor: '#ffffff',
  nationalCupName: 'Puchar Polski',
  regionalCupName: 'Puchar Regionalny',
  decisionDayShow: 'TVP SPORT · MECZ O MISTRZOSTWO POLSKI',
  mainArena: 'Orlen Arena, Płock',
  lowerThirdBug: 'TELEWIZJA POLSKA · TVP SPORT NA ŻYWO',
  championshipMOTW: 'MECZ NA SZCZYCIE TVP SPORT',
  logoKey: 'TVP',
};

// Sweden - SVT 1 Sport
export const SWE_SVT_BROADCAST: BroadcastingPackage = {
  country: 'SWE',
  networkName: 'SVT 1 Sport',
  networkBadge: 'SVT 1 DIREKT',
  networkTag: 'SVT SPORT HD',
  primaryColor: '#0284c7',
  accentColor: '#facc15',
  nationalCupName: 'Svenska Cupen',
  regionalCupName: 'Distriktsmästerskapen',
  decisionDayShow: 'SVT SPORT · SM-FINAL OCH GULDSTRID',
  mainArena: 'Scandinavium, Göteborg',
  lowerThirdBug: 'SVT SPORT · SVENSKA CUPEN OCH SM-SLUTSPEL',
  championshipMOTW: 'SVT MATCHEN DIREKT',
  logoKey: 'SVT',
};

// Austria - ORF 1 Sport
export const AUT_ORF_BROADCAST: BroadcastingPackage = {
  country: 'AUT',
  networkName: 'ORF 1 Sport',
  networkBadge: 'ORF 1 LIVE',
  networkTag: 'ORF 1 HD',
  primaryColor: '#dc2626',
  accentColor: '#facc15',
  nationalCupName: 'ÖHB-Cup',
  regionalCupName: 'ÖHB-Amateurcup',
  decisionDayShow: 'ORF 1 SPORT · HLA MEISTERFINALE',
  mainArena: 'Handball Arena Rieden-Vorkloster, Bregenz',
  lowerThirdBug: 'ORF 1 SPORT LIVE · ÖHB FINALS',
  championshipMOTW: 'ORF SPITZENSPIEL DER MEISTERLIGA',
  logoKey: 'ORF',
};

// Switzerland - SRF zwei Sport
export const SUI_SRF_BROADCAST: BroadcastingPackage = {
  country: 'SUI',
  networkName: 'SRF zwei Sport',
  networkBadge: 'SRF zwei LIVE',
  networkTag: 'SRF zwei HD',
  primaryColor: '#b91c1c',
  accentColor: '#ffffff',
  nationalCupName: 'Mobiliar Handball Cup',
  regionalCupName: 'SHV-Regiocup',
  decisionDayShow: 'SRF SPORT · MOBILIAR CUP FINALS & MEISTERPLAYOFFS',
  mainArena: 'Saalsporthalle, Zürich',
  lowerThirdBug: 'SRF SPORT · FINALS DER QUICKLINE HANDBALL LEAGUE',
  championshipMOTW: 'SRF SPIEL DES TAGES',
  logoKey: 'SRF',
};

// Croatia - HRT Sport
export const CRO_HRT_BROADCAST: BroadcastingPackage = {
  country: 'CRO',
  networkName: 'HRT 2 Sport',
  networkBadge: 'HRT 2 UŽIVO',
  networkTag: 'HRT 2 HD',
  primaryColor: '#003399',
  accentColor: '#dc2626',
  nationalCupName: 'Kup Hrvatske',
  regionalCupName: 'Regionalni Kup',
  decisionDayShow: 'HRT SPORT · DAN ODLUKE I FINALE KUPA',
  mainArena: 'Arena Zagreb',
  lowerThirdBug: 'HRVATSKA RADIOTELEVIZIJA · HRT 2 SPORT UŽIVO',
  championshipMOTW: 'HRT DERBI KOLA',
  logoKey: 'HRT',
};

// Portugal - RTP 2 / RTP Desporto (Public National Broadcaster)
export const POR_RTP_BROADCAST: BroadcastingPackage = {
  country: 'POR',
  networkName: 'RTP 2 / RTP Desporto',
  networkBadge: 'RTP DIRETO',
  networkTag: 'RTP 2 HD',
  primaryColor: '#005ca9',
  accentColor: '#ffcc00',
  nationalCupName: 'Taça de Portugal',
  regionalCupName: 'Taça Federação',
  decisionDayShow: 'RTP DESPORTO · FINAL DA TAÇA EM DIRETO',
  mainArena: 'Pavilhão Multiusos de Guimarães',
  lowerThirdBug: 'RTP 2 · TAÇA DE PORTUGAL DE ANDEBOL EM DIRETO',
  championshipMOTW: 'JOGO DA SEMANA · ANDEBOL 1',
  logoKey: 'RTP',
};

// Portugal - Porto Canal (FC Porto Host Broadcaster)
export const POR_PORTO_CANAL_BROADCAST: BroadcastingPackage = {
  country: 'POR',
  networkName: 'Porto Canal',
  networkBadge: 'PORTO CANAL DIRETO',
  networkTag: 'PORTO CANAL HD',
  primaryColor: '#003882',
  accentColor: '#38bdf8',
  nationalCupName: 'Taça de Portugal',
  regionalCupName: 'Taça Federação',
  decisionDayShow: 'PORTO CANAL · EM DIRETO DO DRAGÃO ARENA',
  mainArena: 'Dragão Arena, Porto',
  lowerThirdBug: 'PORTO CANAL · CAMPEONATO PLACARD 1 EM DIRETO',
  championshipMOTW: 'CLÁSSICO DO ANDEBOL NO DRAGÃO',
  logoKey: 'PORTO_CANAL',
};

// Portugal - Andebol TV (Federação de Andebol de Portugal Official Streamer)
export const POR_ANDEBOL_TV_BROADCAST: BroadcastingPackage = {
  country: 'POR',
  networkName: 'Andebol TV (FAP)',
  networkBadge: 'ANDEBOL TV DIRETO',
  networkTag: 'ANDEBOL TV HD',
  primaryColor: '#064e3b',
  accentColor: '#facc15',
  nationalCupName: 'Taça de Portugal',
  regionalCupName: 'Taça Federação',
  decisionDayShow: 'ANDEBOL TV · DECISÃO DO CAMPEONATO PLACARD 1',
  mainArena: 'Pavilhão Municipal da Maia',
  lowerThirdBug: 'FEDERAÇÃO DE ANDEBOL DE PORTUGAL · ANDEBOL TV DIRETO',
  championshipMOTW: 'JOGO DO TÍTULO · ANDEBOL 1',
  logoKey: 'ANDEBOL_TV',
};

// Portugal - Sporting TV (Sporting CP Official Broadcaster)
export const POR_SPORTING_TV_BROADCAST: BroadcastingPackage = {
  country: 'POR',
  networkName: 'Sporting TV',
  networkBadge: 'SPORTING TV DIRETO',
  networkTag: 'SPORTING TV HD',
  primaryColor: '#006633',
  accentColor: '#facc15',
  nationalCupName: 'Taça de Portugal',
  regionalCupName: 'Taça Federação',
  decisionDayShow: 'SPORTING TV · EM DIRETO DO PAVILHÃO JOÃO ROCHA',
  mainArena: 'Pavilhão João Rocha, Lisboa',
  lowerThirdBug: 'SPORTING TV · CAMPEONATO PLACARD 1 EM DIRETO',
  championshipMOTW: 'CLÁSSICO DO ANDEBOL NO JOÃO ROCHA',
  logoKey: 'SPORTING_TV',
};

// Portugal - BTV (SL Benfica Official Broadcaster)
export const POR_BTV_BROADCAST: BroadcastingPackage = {
  country: 'POR',
  networkName: 'BTV (Benfica TV)',
  networkBadge: 'BTV DIRETO',
  networkTag: 'BTV HD',
  primaryColor: '#cc0000',
  accentColor: '#ffffff',
  nationalCupName: 'Taça de Portugal',
  regionalCupName: 'Taça Federação',
  decisionDayShow: 'BTV · EM DIRETO DO PAVILHÃO DA LUZ',
  mainArena: 'Pavilhão Fidelidade, Lisboa',
  lowerThirdBug: 'BENFICA TV · CAMPEONATO PLACARD 1 EM DIRETO',
  championshipMOTW: 'DÉRBI DE LISBOA NO PAVILHÃO DA LUZ',
  logoKey: 'BTV',
};

export const EHF_EUROPEAN_BROADCAST: BroadcastingPackage = {
  country: 'EUR',
  networkName: 'EHFTV / DAZN',
  networkBadge: 'EHFTV GLOBAL LIVE',
  networkTag: 'EHFTV WORLDWIDE 1080p',
  primaryColor: '#0284c7',
  accentColor: '#f59e0b',
  nationalCupName: 'EHF Champions League',
  regionalCupName: 'EHF European League',
  decisionDayShow: 'TRUCKScout24 EHF FINAL4 COLOGNE',
  mainArena: 'Lanxess Arena, Cologne',
  lowerThirdBug: 'EUROPEAN HANDBALL FEDERATION · OFFICIAL WORLD HOST FEED',
  championshipMOTW: 'EHF MATCH OF THE WEEK (MOTW)',
  logoKey: 'EHFTV',
};

export const DAZN_EUROPEAN_BROADCAST: BroadcastingPackage = {
  country: 'EUR',
  networkName: 'DAZN',
  networkBadge: 'DAZN LIVE',
  networkTag: 'DAZN 1 HD · EHF CHAMPIONS LEAGUE',
  primaryColor: '#f59e0b',
  accentColor: '#ef4444',
  nationalCupName: 'EHF Champions League',
  regionalCupName: 'EHF European League',
  decisionDayShow: 'DAZN EHF FINAL4 COLOGNE LIVE',
  mainArena: 'Lanxess Arena, Cologne',
  lowerThirdBug: 'DAZN EXCLUSIVE LIVE FEED · TRUCKSCOUT24 EHF FINAL4',
  championshipMOTW: 'DAZN EHF MATCH OF THE WEEK (MOTW)',
  logoKey: 'DAZN',
};

export const DAZN_EUROPEAN_TERRITORIES = new Set(['GER', 'AUT', 'SUI', 'ESP', 'ITA', 'POR']);

export const FRA_BEIN_EURO_BROADCAST: BroadcastingPackage = {
  ...BROADCASTING_PACKAGES['FRA'],
  networkName: 'beIN SPORTS',
  networkBadge: 'beIN DIRECT HD',
  networkTag: 'beIN SPORTS 1 HD',
  nationalCupName: 'EHF Champions League',
  regionalCupName: 'EHF European League',
  decisionDayShow: 'beIN SPORTS EHF FINAL4 DIRECT',
  mainArena: 'Lanxess Arena, Cologne',
  lowerThirdBug: 'beIN SPORTS FRANCE · EHF CHAMPIONS LEAGUE DIRECT',
  championshipMOTW: 'LE MATCH DE LA SEMAINE EHF',
  logoKey: 'BEIN',
};

export const DEN_TV2_EURO_BROADCAST: BroadcastingPackage = {
  ...BROADCASTING_PACKAGES['DEN'],
  networkName: 'TV 2 Sport',
  networkBadge: 'TV 2 DIREKTE',
  networkTag: 'TV 2 SPORT HD',
  nationalCupName: 'EHF Champions League',
  regionalCupName: 'EHF European League',
  decisionDayShow: 'TV 2 SPORT EHF FINAL4 DIREKTE',
  mainArena: 'Lanxess Arena, Cologne',
  lowerThirdBug: 'TV 2 SPORT DANMARK · EHF CHAMPIONS LEAGUE DIREKTE',
  championshipMOTW: 'UGENS EHF KAMP I CHAMPIONS LEAGUE',
  logoKey: 'TV2',
};

export const POL_TVP_EURO_BROADCAST: BroadcastingPackage = {
  ...POL_TVP_BROADCAST,
  networkBadge: 'TVP SPORT NA ŻYWO',
  nationalCupName: 'EHF Liga Mistrzów',
  regionalCupName: 'EHF Liga Europejska',
  decisionDayShow: 'EHF FINAL4 NA ŻYWO W TVP',
  mainArena: 'Lanxess Arena, Cologne',
  lowerThirdBug: 'TVP SPORT · LIGA MISTRZÓW PIŁKI RĘCZNEJ NA ŻYWO',
  championshipMOTW: 'MECZ TYGODNIA EHF',
  logoKey: 'TVP',
};

export const HUN_SPORT1_EURO_BROADCAST: BroadcastingPackage = {
  ...BROADCASTING_PACKAGES['HUN'],
  networkName: 'Sport 1',
  networkBadge: 'SPORT 1 ÉLŐ',
  networkTag: 'SPORT 1 HD',
  nationalCupName: 'EHF Bajnokok Ligája',
  regionalCupName: 'Európa-liga',
  decisionDayShow: 'EHF FINAL4 KÖLN ÉLŐBEN',
  mainArena: 'Lanxess Arena, Cologne',
  lowerThirdBug: 'SPORT 1 HUNGARY · EHF BAJNOKOK LIGÁJA ÉLŐ KÖZVETÍTÉS',
  championshipMOTW: 'A HÉT EHF MÉRKŐZÉSE',
  logoKey: 'SPORT1',
};

// ============================================================================
// AUTHENTIC GERMAN REGIONAL CUP BROADCASTERS (LANDESPOKAL / REGIONALPOKAL)
// ============================================================================

export const GER_MDR_BROADCAST: BroadcastingPackage = {
  ...BROADCASTING_PACKAGES['GER'],
  networkName: 'MDR Sport im Osten',
  networkBadge: 'LANDESPOKAL',
  networkTag: 'MDR HD',
  nationalCupName: 'DHB-Pokal',
  regionalCupName: 'Landespokal',
  decisionDayShow: 'SPORT IM OSTEN · LANDESPOKAL LIVE',
  mainArena: 'GETEC Arena, Magdeburg',
  lowerThirdBug: 'MDR FERNSEHEN · SPORT IM OSTEN · LANDESPOKAL LIVE',
  championshipMOTW: 'SPORT IM OSTEN TOP-SPIEL',
  logoKey: 'MDR',
};

export const GER_WDR_BROADCAST: BroadcastingPackage = {
  ...BROADCASTING_PACKAGES['GER'],
  networkName: 'WDR Sport im Westen',
  networkBadge: 'LANDESPOKAL',
  networkTag: 'WDR HD',
  nationalCupName: 'DHB-Pokal',
  regionalCupName: 'Landespokal',
  decisionDayShow: 'SPORT IM WESTEN · LANDESPOKAL',
  mainArena: 'Schwalbe Arena, Gummersbach',
  lowerThirdBug: 'WDR FERNSEHEN · SPORT IM WESTEN · LANDESPOKAL',
  championshipMOTW: 'SPORT IM WESTEN LIVE',
  logoKey: 'WDR',
};

export const GER_BR_BROADCAST: BroadcastingPackage = {
  ...BROADCASTING_PACKAGES['GER'],
  networkName: 'BR Sport',
  networkBadge: 'LANDESPOKAL',
  networkTag: 'BR HD',
  nationalCupName: 'DHB-Pokal',
  regionalCupName: 'Landespokal',
  decisionDayShow: 'BR SPORT · LANDESPOKAL LIVE',
  mainArena: 'Arena Nürnberger Versicherung',
  lowerThirdBug: 'BR FERNSEHEN · BR SPORT · LANDESPOKAL LIVE',
  championshipMOTW: 'BR SPORT LIVE',
  logoKey: 'BR',
};

export const GER_SWR_BROADCAST: BroadcastingPackage = {
  ...BROADCASTING_PACKAGES['GER'],
  networkName: 'SWR Sport',
  networkBadge: 'LANDESPOKAL',
  networkTag: 'SWR HD',
  nationalCupName: 'DHB-Pokal',
  regionalCupName: 'Landespokal',
  decisionDayShow: 'SWR SPORT · LANDESPOKAL',
  mainArena: 'EWS Arena, Göppingen',
  lowerThirdBug: 'SWR FERNSEHEN · SWR SPORT · LANDESPOKAL',
  championshipMOTW: 'SWR SPORT LIVE',
  logoKey: 'SWR',
};

export const GER_SPORT1_BROADCAST: BroadcastingPackage = {
  ...BROADCASTING_PACKAGES['GER'],
  networkName: 'Sport1',
  networkBadge: 'POKAL LIVE',
  networkTag: 'SPORT1 HD',
  nationalCupName: 'DHB-Pokal',
  regionalCupName: 'Landespokal',
  decisionDayShow: 'SPORT1 POKAL LIVE',
  mainArena: 'Lanxess Arena, Köln',
  lowerThirdBug: 'SPORT1 · POKAL LIVE ÜBERTRAGUNG',
  championshipMOTW: 'SPORT1 TOP-SPIEL',
  logoKey: 'SPORT1',
};

export const GER_SPORTTOTAL_BROADCAST: BroadcastingPackage = {
  ...BROADCASTING_PACKAGES['GER'],
  networkName: 'Sporttotal.tv',
  networkBadge: 'LANDESPOKAL',
  networkTag: 'SPORTTOTAL HD',
  nationalCupName: 'DHB-Pokal',
  regionalCupName: 'Landespokal',
  decisionDayShow: 'SPORTTOTAL.TV · AMATEURPOKAL LIVE',
  mainArena: 'Regionalhalle',
  lowerThirdBug: 'SPORTTOTAL.TV · MULTI-CAM LIVESTREAM · LANDESPOKAL',
  championshipMOTW: 'SPORTTOTAL MATCH OF THE WEEK',
  logoKey: 'SPORTTOTAL',
};

export const GER_REGIONAL_CUP_PACKAGES: BroadcastingPackage[] = [
  GER_MDR_BROADCAST,
  GER_WDR_BROADCAST,
  GER_BR_BROADCAST,
  GER_SWR_BROADCAST,
  GER_SPORT1_BROADCAST,
  GER_SPORTTOTAL_BROADCAST,
];

// ============================================================================
// GENERIC FICTIONAL NETWORKS (STRICTLY USED WHEN REAL DATA MOD IS OFF)
// ============================================================================

export const FICTIONAL_COURTVISION_PACKAGE: BroadcastingPackage = {
  country: 'GEN',
  networkName: 'CourtVision',
  networkBadge: 'COURTVISION LIVE',
  networkTag: 'CV 1 HD',
  primaryColor: '#0ea5e9',
  accentColor: '#38bdf8',
  nationalCupName: 'National Cup',
  regionalCupName: 'Amateur Cup',
  decisionDayShow: 'COURTVISION · DECISION DAY LIVE',
  mainArena: 'Main Sports Arena',
  lowerThirdBug: 'COURTVISION SPORTS · MATCHDAY LIVE FEED',
  championshipMOTW: 'COURTVISION MATCH OF THE WEEK',
  logoKey: 'COURTVISION',
  isFictional: true,
};

export const FICTIONAL_HANDBALL_LIVE_PACKAGE: BroadcastingPackage = {
  country: 'GEN',
  networkName: 'Handball Live',
  networkBadge: 'HANDBALL LIVE',
  networkTag: 'HB LIVE HD',
  primaryColor: '#f97316',
  accentColor: '#fbbf24',
  nationalCupName: 'National Cup',
  regionalCupName: 'Amateur Trophy',
  decisionDayShow: 'HANDBALL LIVE · FINALS MULTIPLEX',
  mainArena: 'National Indoor Arena',
  lowerThirdBug: 'HANDBALL LIVE · CUP FINALS ON-COURT COVERAGE',
  championshipMOTW: 'HANDBALL LIVE SHOWCASE',
  logoKey: 'HANDBALL_LIVE',
  isFictional: true,
};

export const FICTIONAL_COURTVISION_EURO_PACKAGE: BroadcastingPackage = {
  country: 'EUR',
  networkName: 'CourtVision Euro',
  networkBadge: 'COURTVISION EURO',
  networkTag: 'CV EURO 1',
  primaryColor: '#3b82f6',
  accentColor: '#60a5fa',
  nationalCupName: 'Continental Championship',
  regionalCupName: 'Continental Cup',
  decisionDayShow: 'COURTVISION CONTINENTAL FINAL 4',
  mainArena: 'Continental Grand Arena',
  lowerThirdBug: 'COURTVISION CONTINENTAL · LIVE DIRECT FEED',
  championshipMOTW: 'CONTINENTAL MATCH OF THE WEEK',
  logoKey: 'COURTVISION_EURO',
  isFictional: true,
};

export const FICTIONAL_COURTSTREAM_PACKAGE: BroadcastingPackage = {
  country: 'GEN',
  networkName: 'CourtStream',
  networkBadge: 'COURTSTREAM LIVE',
  networkTag: 'STREAM 1 HD',
  primaryColor: '#8b5cf6',
  accentColor: '#a78bfa',
  nationalCupName: 'National Cup',
  regionalCupName: 'Federation Cup',
  decisionDayShow: 'COURTSTREAM · SURVIVAL BATTLE LIVE',
  mainArena: 'Municipal Sports Hall',
  lowerThirdBug: 'COURTSTREAM INTERACTIVE · ON DEMAND & LIVE',
  championshipMOTW: 'COURTSTREAM DERBY MATCH',
  logoKey: 'COURTSTREAM',
  isFictional: true,
};

export interface BroadcastContext {
  type?: string;          // 'championship_decider' | 'playoff' | 'relegation_playoff' | 'cup_final' | 'cup_sf' | 'cup_qf' | 'reg_cup' | 'regional_cup'
  title?: string;
  subtitle?: string;
  isCupFinal?: boolean;
  isRegionalCup?: boolean;
  isDecisionDay?: boolean;
  isRelegation?: boolean;
  preferredNetwork?: 'ARD' | 'ZDF' | 'DYN' | 'DR' | 'FRANCE_TV' | 'TVP' | 'NRK' | 'SVT' | 'ORF' | 'SRF' | 'HRT' | 'MDR' | 'WDR' | 'BR' | 'SWR' | 'SPORT1' | 'SPORTTOTAL' | 'SPORT_TV' | 'RTP' | 'PORTO_CANAL' | 'ANDEBOL_TV' | 'SPORTING_TV' | 'BTV';
  year?: number;
  isModActive?: boolean;
  clubName?: string;
  clubCity?: string;
}

export function getBroadcastingPackage(
  countryCode: string = 'GER',
  isEuropean: boolean = false,
  context?: BroadcastContext
): BroadcastingPackage {
  const cleanCode = countryCode.trim().toUpperCase();
  const isModActive = context?.isModActive !== undefined 
    ? context.isModActive 
    : isAnyModActive();

  const isEuroSupercup = Boolean(
    context?.type === 'euro_supercup' ||
    (context?.title && (
      context.title.toUpperCase().includes('EUROPEAN SUPERCUP') ||
      context.title.toUpperCase().includes('CONTINENTAL SUPERCUP') ||
      context.title.toUpperCase().includes('EHF SUPERCUP')
    ))
  );

  const isDomesticSupercup = Boolean(
    context?.type === 'domestic_supercup'
  );

  // If Real Data Mod is OFF, strictly return generic fictional packages with NO real-world networks
  if (!isModActive) {
    if (isEuropean || isEuroSupercup) {
      return {
        ...FICTIONAL_COURTVISION_EURO_PACKAGE,
        country: cleanCode,
      };
    }

    const isCup = Boolean(
      isDomesticSupercup ||
      context?.isCupFinal || 
      context?.type === 'cup_final' || 
      context?.type === 'cup_sf' ||
      context?.type === 'cup_qf' ||
      (context?.title && (context.title.toUpperCase().includes('FINAL') || context.title.toUpperCase().includes('SUPERCUP'))) ||
      (context?.subtitle && (context.subtitle.toUpperCase().includes('POKAL') || context.subtitle.toUpperCase().includes('CUP') || context.subtitle.toUpperCase().includes('FINAL') || context.subtitle.toUpperCase().includes('SUPERCUP')))
    );

    if (isCup) {
      return {
        ...FICTIONAL_HANDBALL_LIVE_PACKAGE,
        country: cleanCode,
      };
    }

    const isRelegation = Boolean(
      context?.isRelegation ||
      context?.type === 'relegation_playoff' ||
      (context?.title && (context.title.toUpperCase().includes('RELEGATION') || context.title.toUpperCase().includes('SURVIVAL'))) ||
      (context?.subtitle && (context.subtitle.toUpperCase().includes('RELEGATION') || context.subtitle.toUpperCase().includes('SURVIVAL')))
    );

    if (isRelegation) {
      return {
        ...FICTIONAL_COURTSTREAM_PACKAGE,
        country: cleanCode,
      };
    }

    return {
      ...FICTIONAL_COURTVISION_PACKAGE,
      country: cleanCode,
    };
  }

  const isIhfMatch = Boolean(
    context?.type === 'ihf_final' ||
    (context?.title && (context.title.toUpperCase().includes('IHF') || context.title.toUpperCase().includes('SUPER GLOBE') || context.title.toUpperCase().includes('WORLD CLUB'))) ||
    (context?.subtitle && (context.subtitle.toUpperCase().includes('IHF') || context.subtitle.toUpperCase().includes('SUPER GLOBE') || context.subtitle.toUpperCase().includes('WORLD CLUB')))
  );

  // When Real Data Mod is ON, return authentic licensed broadcaster networks
  if (isIhfMatch) {
    const yr = context?.year || 2024;
    const useDazn = DAZN_EUROPEAN_TERRITORIES.has(cleanCode) ? (yr % 2 === 0) : (yr % 2 !== 0);
    if (useDazn) {
      return {
        ...DAZN_EUROPEAN_BROADCAST,
        country: cleanCode,
        networkTag: 'DAZN 1 HD · IHF SUPER GLOBE',
        mainArena: 'New Administrative Capital Hall',
        lowerThirdBug: 'DAZN EXCLUSIVE LIVE FEED · IHF SUPER GLOBE WORLD FINAL',
      };
    }
    return {
      ...EHF_EUROPEAN_BROADCAST,
      country: cleanCode,
      networkName: 'EHF TV',
      networkTag: 'EHFTV WORLDWIDE 1080p · IHF SUPER GLOBE',
      mainArena: 'New Administrative Capital Hall',
      lowerThirdBug: 'EHFTV · IHF SUPER GLOBE OFFICIAL WORLD HOST FEED',
    };
  }

  if (isEuroSupercup) {
    const yr = context?.year || 2024;
    const useDazn = DAZN_EUROPEAN_TERRITORIES.has(cleanCode) ? (yr % 2 === 0) : (yr % 2 !== 0);
    if (useDazn) {
      return {
        ...DAZN_EUROPEAN_BROADCAST,
        country: cleanCode,
        networkTag: 'DAZN 1 HD · EHF EUROPEAN SUPERCUP',
        mainArena: 'Lanxess Arena, Cologne',
        lowerThirdBug: 'DAZN EXCLUSIVE LIVE FEED · EHF EUROPEAN SUPERCUP OPENER',
      };
    }
    return {
      ...EHF_EUROPEAN_BROADCAST,
      country: cleanCode,
      networkName: 'EHF TV',
      networkTag: 'EHFTV WORLDWIDE 1080p · EHF EUROPEAN SUPERCUP',
      mainArena: 'Lanxess Arena, Cologne',
      lowerThirdBug: 'EHFTV · EHF EUROPEAN SUPERCUP OFFICIAL HOST FEED',
    };
  }

  if (isEuropean) {
    if (DAZN_EUROPEAN_TERRITORIES.has(cleanCode)) {
      return { ...DAZN_EUROPEAN_BROADCAST, country: cleanCode };
    }
    if (cleanCode === 'FRA') return FRA_BEIN_EURO_BROADCAST;
    if (cleanCode === 'DEN') return DEN_TV2_EURO_BROADCAST;
    if (cleanCode === 'POL') return POL_TVP_EURO_BROADCAST;
    if (cleanCode === 'HUN') return HUN_SPORT1_EURO_BROADCAST;
    return EHF_EUROPEAN_BROADCAST;
  }

  // Germany (GER): Handle ARD, ZDF, Dyn Sport, and Regional Cup Broadcasters (MDR, WDR, BR, SWR, Sport1, Sporttotal)
  if (cleanCode === 'GER') {
    if (context?.preferredNetwork === 'ARD') return GER_ARD_BROADCAST;
    if (context?.preferredNetwork === 'ZDF') return GER_ZDF_BROADCAST;
    if (context?.preferredNetwork === 'DYN') return BROADCASTING_PACKAGES['GER'];
    if (context?.preferredNetwork === 'MDR') return GER_MDR_BROADCAST;
    if (context?.preferredNetwork === 'WDR') return GER_WDR_BROADCAST;
    if (context?.preferredNetwork === 'BR') return GER_BR_BROADCAST;
    if (context?.preferredNetwork === 'SWR') return GER_SWR_BROADCAST;
    if (context?.preferredNetwork === 'SPORT1') return GER_SPORT1_BROADCAST;
    if (context?.preferredNetwork === 'SPORTTOTAL') return GER_SPORTTOTAL_BROADCAST;

    if (isDomesticSupercup) {
      const yr = context?.year || 2024;
      const basePkg = yr % 3 === 0 ? GER_ARD_BROADCAST : yr % 3 === 1 ? GER_ZDF_BROADCAST : BROADCASTING_PACKAGES['GER'];
      return {
        ...basePkg,
        mainArena: 'PSD Bank Dome, Düsseldorf',
        lowerThirdBug: `${basePkg.networkName.toUpperCase()} · HBL SUPERCUP LIVE FROM DÜSSELDORF`,
      };
    }

    const isRegionalCup = Boolean(
      context?.isRegionalCup ||
      context?.type === 'reg_cup' ||
      context?.type === 'regional_cup' ||
      (context?.title && (context.title.toUpperCase().includes('LANDESPOKAL') || context.title.toUpperCase().includes('REGIONALPOKAL') || context.title.toUpperCase().includes('AMATEUR'))) ||
      (context?.subtitle && (context.subtitle.toUpperCase().includes('LANDESPOKAL') || context.subtitle.toUpperCase().includes('REGIONALPOKAL') || context.subtitle.toUpperCase().includes('AMATEUR')))
    );

    // Authentic Regional Cup Rights Holders in Germany:
    // MDR Sport im Osten (East Germany / Saxony / Thuringia / Saxony-Anhalt),
    // WDR Sport im Westen (North Rhine-Westphalia),
    // BR Sport (Bavaria),
    // SWR Sport (Baden-Württemberg / Rhineland-Palatinate),
    // Sport1 & Sporttotal.tv (National amateur / streaming)
    if (isRegionalCup) {
      const nameOrCity = `${context?.clubName || ''} ${context?.clubCity || ''}`.toLowerCase();
      
      // East Germany: Magdeburg, Leipzig, Dresden, Aue, Eisenach, Dessau, Potsdam, Erfurt, Halle, Rostock
      if (/(magdeburg|leipzig|dresden|aue|eisenach|dessau|potsdam|erfurt|halle|rostock|th[üu]ringen|sachsen)/i.test(nameOrCity)) {
        return GER_MDR_BROADCAST;
      }
      // North Rhine-Westphalia: Gummersbach, Minden, Essen, Hagen, Hamm, Ferndorf, Dormagen, Düsseldorf, Köln, Krefeld, Bergischer, Emsdetten
      if (/(gummersbach|minden|essen|hagen|hamm|ferndorf|dormagen|d[üu]sseldorf|k[öo]ln|krefeld|bergisch|emsdetten|nrw|westfalen|rhein)/i.test(nameOrCity)) {
        return GER_WDR_BROADCAST;
      }
      // Bavaria: Erlangen, Coburg, Würzburg, Großwallstadt, Rimpar, Fürstenfeldbruck, Bayern, München, Nürnberg
      if (/(erlangen|coburg|w[üu]rzburg|gro[ßs]wallstadt|rimpar|f[üu]rstenfeldbruck|bayern|m[üu]nchen|n[üu]rnberg|franken)/i.test(nameOrCity)) {
        return GER_BR_BROADCAST;
      }
      // South-West / Baden-Württemberg: Göppingen, Balingen, Stuttgart, Konstanz, Ludwigshafen, Friesenheim, Rhein-Neckar, Mannheim
      if (/(g[öo]ppingen|balingen|stuttgart|konstanz|ludwigshafen|friesenheim|mannheim|baden|w[üu]rttemberg|pfalz)/i.test(nameOrCity)) {
        return GER_SWR_BROADCAST;
      }

      const yr = context?.year || 2024;
      const index = Math.abs(yr) % GER_REGIONAL_CUP_PACKAGES.length;
      return GER_REGIONAL_CUP_PACKAGES[index];
    }

    const isCup = Boolean(
      context?.isCupFinal || 
      context?.type === 'cup_final' || 
      (context?.title && context.title.toUpperCase().includes('FINAL')) ||
      (context?.subtitle && (context.subtitle.toUpperCase().includes('POKAL') || context.subtitle.toUpperCase().includes('FINAL')))
    );

    const isTitleDecider = Boolean(
      context?.type === 'championship_decider' ||
      (context?.title && context.title.toUpperCase().includes('DECISION DAY')) ||
      context?.isDecisionDay
    );

    // Domestic Cup Final in Germany (DHB-Pokal): Broadcast on public national television (ARD or ZDF alternate annually)
    if (isCup) {
      const yr = context?.year || 2024;
      return yr % 2 === 0 ? GER_ARD_BROADCAST : GER_ZDF_BROADCAST;
    }

    // Championship Decider: Marquee showcase shared between Dyn Sport, ARD, and ZDF
    if (isTitleDecider) {
      const yr = context?.year || 2024;
      const mod = yr % 3;
      if (mod === 1) return GER_ARD_BROADCAST;
      if (mod === 2) return GER_ZDF_BROADCAST;
      return BROADCASTING_PACKAGES['GER'];
    }

    // Default for league matchdays, playoffs, and relegation battles: Dyn Sport (Official host broadcaster)
    return BROADCASTING_PACKAGES['GER'];
  }

  // Denmark (DEN)
  if (cleanCode === 'DEN') {
    if (context?.preferredNetwork === 'DR') return DEN_DR_BROADCAST;
    const isCup = Boolean(context?.isCupFinal || context?.type === 'cup_final' || isDomesticSupercup);
    if (isCup) return DEN_DR_BROADCAST;
    return BROADCASTING_PACKAGES['DEN'];
  }

  // France (FRA)
  if (cleanCode === 'FRA') {
    if (context?.preferredNetwork === 'FRANCE_TV') return FRA_FRANCE_TV_BROADCAST;
    const isCup = Boolean(context?.isCupFinal || context?.type === 'cup_final');
    if (isCup) return FRA_FRANCE_TV_BROADCAST;
    return BROADCASTING_PACKAGES['FRA'];
  }

  // Spain (ESP)
  if (cleanCode === 'ESP') {
    const isCup = Boolean(context?.isCupFinal || context?.type === 'cup_final' || isDomesticSupercup);
    if (isCup) return ESP_RTVE_BROADCAST;
    return BROADCASTING_PACKAGES['ESP'];
  }

  // Norway (NOR)
  if (cleanCode === 'NOR') {
    if (context?.preferredNetwork === 'NRK') return NOR_NRK_BROADCAST;
    const isCup = Boolean(context?.isCupFinal || context?.type === 'cup_final' || isDomesticSupercup);
    if (isCup) return NOR_NRK_BROADCAST;
    return BROADCASTING_PACKAGES['NOR'];
  }

  // Poland (POL)
  if (cleanCode === 'POL') {
    if (context?.preferredNetwork === 'TVP') return POL_TVP_BROADCAST;
    const isCup = Boolean(context?.isCupFinal || context?.type === 'cup_final' || isDomesticSupercup);
    if (isCup) return POL_TVP_BROADCAST;
    return BROADCASTING_PACKAGES['POL'];
  }

  // Sweden (SWE)
  if (cleanCode === 'SWE') {
    if (context?.preferredNetwork === 'SVT') return SWE_SVT_BROADCAST;
    const isCup = Boolean(context?.isCupFinal || context?.type === 'cup_final' || isDomesticSupercup);
    if (isCup) return SWE_SVT_BROADCAST;
    return BROADCASTING_PACKAGES['SWE'];
  }

  // Austria (AUT)
  if (cleanCode === 'AUT') {
    if (context?.preferredNetwork === 'ORF') return AUT_ORF_BROADCAST;
    const isCup = Boolean(context?.isCupFinal || context?.type === 'cup_final' || isDomesticSupercup);
    if (isCup) return AUT_ORF_BROADCAST;
    return BROADCASTING_PACKAGES['AUT'];
  }

  // Switzerland (SUI)
  if (cleanCode === 'SUI') {
    if (context?.preferredNetwork === 'SRF') return SUI_SRF_BROADCAST;
    const isCup = Boolean(context?.isCupFinal || context?.type === 'cup_final' || isDomesticSupercup);
    if (isCup) return SUI_SRF_BROADCAST;
    return BROADCASTING_PACKAGES['SUI'];
  }

  // Croatia (CRO)
  if (cleanCode === 'CRO') {
    if (context?.preferredNetwork === 'HRT') return CRO_HRT_BROADCAST;
    const isCup = Boolean(context?.isCupFinal || context?.type === 'cup_final' || isDomesticSupercup);
    if (isCup) return CRO_HRT_BROADCAST;
    return BROADCASTING_PACKAGES['CRO'];
  }

  // Portugal (POR)
  if (cleanCode === 'POR') {
    if (context?.preferredNetwork === 'RTP') return POR_RTP_BROADCAST;
    if (context?.preferredNetwork === 'PORTO_CANAL') return POR_PORTO_CANAL_BROADCAST;
    if (context?.preferredNetwork === 'SPORT_TV') return BROADCASTING_PACKAGES['POR'];
    if (context?.preferredNetwork === 'ANDEBOL_TV') return POR_ANDEBOL_TV_BROADCAST;
    if (context?.preferredNetwork === 'SPORTING_TV') return POR_SPORTING_TV_BROADCAST;
    if (context?.preferredNetwork === 'BTV') return POR_BTV_BROADCAST;

    const isCup = Boolean(
      isDomesticSupercup ||
      context?.isCupFinal || 
      context?.type === 'cup_final' || 
      (context?.title && context.title.toUpperCase().includes('TAÇA DE PORTUGAL')) ||
      (context?.subtitle && context.subtitle.toUpperCase().includes('TAÇA DE PORTUGAL'))
    );

    // Domestic Cup Final / Supertaça in Portugal: Broadcast live on public television RTP 2 / RTP Desporto
    if (isCup) return POR_RTP_BROADCAST;

    // Check club name from context, or check fallback from active state storage
    let club = (context?.clubName || '').toLowerCase();
    if (!club && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('handball-manager-storage');
        if (stored) {
          const parsed = JSON.parse(stored);
          const cName = parsed?.state?.club?.name || parsed?.club?.name;
          if (cName) club = cName.toLowerCase();
        }
      } catch {
        // ignore
      }
    }

    // For FC Porto: Porto Canal is their dedicated host broadcaster
    if (club.includes('porto')) {
      return POR_PORTO_CANAL_BROADCAST;
    }
    // For Sporting CP: Sporting TV is their dedicated broadcaster
    if (club.includes('sporting')) {
      return POR_SPORTING_TV_BROADCAST;
    }
    // For SL Benfica: BTV is their dedicated broadcaster
    if (club.includes('benfica')) {
      return POR_BTV_BROADCAST;
    }

    // Default top league broadcaster: Sport TV (Campeonato Placard Andebol 1)
    return BROADCASTING_PACKAGES['POR'];
  }

  return BROADCASTING_PACKAGES[cleanCode] || BROADCASTING_PACKAGES['GER'];
}

/**
 * Normalizes broadcast badge text, removing any accidental duplicated "LIVE LIVE" tokens
 * or trailing duplicate state badges.
 */
export function cleanBroadcastBadge(badge?: string, isModActive?: boolean): string {
  const modActive = isModActive !== undefined ? isModActive : isAnyModActive();
  if (!badge) return modActive ? 'DAZN LIVE' : 'COURTVISION LIVE';
  return badge
    .replace(/\bLIVE\s+LIVE\b/gi, 'LIVE')
    .replace(/\bDIREKTE\s+DIREKTE\b/gi, 'DIREKTE')
    .replace(/\bDIRECTO\s+DIRECTO\b/gi, 'DIRECTO')
    .trim();
}
