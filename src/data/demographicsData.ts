export interface CityDemographic {
  cityName: string;
  population: number;
  category: 'metro' | 'stronghold' | 'mid' | 'town';
}

export interface CityRule {
  match: RegExp;
  city: string;
  pop: number;
  cat: 'metro' | 'stronghold' | 'mid' | 'town';
}

const normCountryCode = (country: string = 'GER'): string => {
  const c = country.toUpperCase().trim();
  if (c === 'GERMANY' || c === 'DE' || c === 'DEU') return 'GER';
  if (c === 'DENMARK' || c === 'DK' || c === 'DNK') return 'DEN';
  if (c === 'FRANCE' || c === 'FR' || c === 'FRA') return 'FRA';
  if (c === 'SPAIN' || c === 'ES' || c === 'ESP') return 'ESP';
  if (c === 'SWEDEN' || c === 'SE' || c === 'SWE') return 'SWE';
  if (c === 'NORWAY' || c === 'NO' || c === 'NOR') return 'NOR';
  if (c === 'POLAND' || c === 'PL' || c === 'POL') return 'POL';
  if (c === 'HUNGARY' || c === 'HU' || c === 'HUN') return 'HUN';
  if (c === 'CROATIA' || c === 'HR' || c === 'CRO') return 'CRO';
  if (c === 'PORTUGAL' || c === 'PT' || c === 'POR') return 'POR';
  if (c === 'SWITZERLAND' || c === 'CH' || c === 'SUI') return 'SUI';
  if (c === 'AUSTRIA' || c === 'AT' || c === 'AUT') return 'AUT';
  if (c === 'ICELAND' || c === 'IS' || c === 'ISL') return 'ISL';
  if (c === 'ROU' || c === 'ROMANIA' || c === 'ROMÂNIA') return 'ROU';
  if (c === 'MKD' || c === 'NORTH MACEDONIA' || c === 'MACEDONIA') return 'MKD';
  if (c === 'SLO' || c === 'SLOVENIA' || c === 'SLOVENIJA') return 'SLO';
  if (c === 'ITA' || c === 'ITALY' || c === 'ITALIA') return 'ITA';
  if (c === 'ENG' || c === 'ENGLAND' || c === 'GB' || c === 'GBR') return 'ENG';
  if (c === 'USA' || c === 'UNITED STATES' || c === 'US') return 'USA';
  if (c === 'ECU' || c === 'ECUADOR') return 'ECU';
  return c;
};

// ==================== DENMARK (58 Clubs) ====================
// Greater Copenhagen (Hovedstaden) metropolitan catchment: ~2,100,000
export const DANISH_CITY_RULES: CityRule[] = [
  // København Metro (Ajax København, FIF, HIK, Brøndby, Taastrup, Glostrup, HØJ/Zealand)
  { match: /K[øo]benhavn|Copenhagen|Ajax|FIF\b|HIK\b|Taastrup|Glostrup|Br[øo]ndby|Bavneh[øo]j|Frederiksberg/i, city: 'København', pop: 2100000, cat: 'metro' },
  { match: /Aarhus|\bAGF\b/i, city: 'Aarhus', pop: 360000, cat: 'metro' },
  { match: /Odense/i, city: 'Odense', pop: 185000, cat: 'metro' },
  { match: /Aalborg/i, city: 'Aalborg', pop: 220000, cat: 'stronghold' },
  { match: /Esbjerg|Ribe/i, city: 'Esbjerg', pop: 115000, cat: 'mid' },
  { match: /Vejle/i, city: 'Vejle', pop: 120000, cat: 'mid' },
  { match: /Silkeborg|Bjerringbro/i, city: 'Silkeborg', pop: 100000, cat: 'stronghold' },
  { match: /Viborg/i, city: 'Viborg', pop: 97000, cat: 'mid' },
  { match: /Horsens/i, city: 'Horsens', pop: 95000, cat: 'mid' },
  { match: /Kolding|\bKIF\b/i, city: 'Kolding', pop: 94000, cat: 'stronghold' },
  { match: /Herning|Midtjylland/i, city: 'Herning', pop: 90000, cat: 'mid' },
  { match: /Roskilde/i, city: 'Roskilde', pop: 90000, cat: 'mid' },
  { match: /N[æa]stved/i, city: 'Næstved', pop: 84000, cat: 'mid' },
  { match: /Slagelse/i, city: 'Slagelse', pop: 80000, cat: 'mid' },
  { match: /S[øo]nderborg|S[øo]nderjyskE|Gr[åa]sten/i, city: 'Sønderborg', pop: 74000, cat: 'stronghold' },
  { match: /Holb[æa]k/i, city: 'Holbæk', pop: 73000, cat: 'mid' },
  { match: /Skanderborg/i, city: 'Skanderborg', pop: 65000, cat: 'mid' },
  { match: /Randers/i, city: 'Randers', pop: 64000, cat: 'mid' },
  { match: /Hj[øo]rring/i, city: 'Hjørring', pop: 64000, cat: 'mid' },
  { match: /Helsing[øo]r/i, city: 'Helsingør', pop: 63000, cat: 'mid' },
  { match: /K[øo]ge/i, city: 'Køge', pop: 62000, cat: 'mid' },
  { match: /Frederikshavn|\bFfI\b/i, city: 'Frederikshavn', pop: 60000, cat: 'mid' },
  { match: /Nyk[øo]bing Falster|Sydhavs[øo]erne/i, city: 'Nykøbing Falster', pop: 60000, cat: 'mid' },
  { match: /Holstebro|\bTTH\b/i, city: 'Holstebro', pop: 59000, cat: 'stronghold' },
  { match: /Svendborg|\bGOG\b|Gudme/i, city: 'Gudme', pop: 60000, cat: 'stronghold' },
  { match: /Aabenraa/i, city: 'Aabenraa', pop: 59000, cat: 'mid' },
  { match: /Skjern|Ringk[øo]bing/i, city: 'Skjern', pop: 57000, cat: 'stronghold' },
  { match: /Hiller[øo]d|Nordsj[æa]lland/i, city: 'Hillerød', pop: 54000, cat: 'mid' },
  { match: /Fredericia/i, city: 'Fredericia', pop: 52000, cat: 'stronghold' },
  { match: /Varde/i, city: 'Varde', pop: 50000, cat: 'town' },
  { match: /Skive/i, city: 'Skive', pop: 46000, cat: 'mid' },
  { match: /H[ØO]J|[ØO]lstykke|Jyllinge/i, city: 'Ølstykke', pop: 45000, cat: 'mid' },
  { match: /Thisted|Nyk[øo]bing Mors|Mors-Thy/i, city: 'Nykøbing Mors', pop: 45000, cat: 'stronghold' },
  { match: /Hobro/i, city: 'Hobro', pop: 42000, cat: 'mid' },
  { match: /Middelfart/i, city: 'Middelfart', pop: 39000, cat: 'mid' },
  { match: /T[øo]nder/i, city: 'Tønder', pop: 38000, cat: 'town' },
  { match: /Ringsted|\bTMS\b/i, city: 'Ringsted', pop: 36000, cat: 'mid' },
  { match: /Odder/i, city: 'Odder', pop: 23000, cat: 'town' },
  { match: /Struer/i, city: 'Struer', pop: 21000, cat: 'town' },
  { match: /Lemvig|Thybor[øo]n/i, city: 'Lemvig', pop: 20000, cat: 'town' },
  { match: /Faaborg/i, city: 'Faaborg', pop: 17000, cat: 'town' },
  { match: /Kors[øo]r/i, city: 'Korsør', pop: 15000, cat: 'town' },
  { match: /Skagen/i, city: 'Skagen', pop: 8000, cat: 'town' },
  { match: /Grindsted/i, city: 'Grindsted', pop: 7000, cat: 'town' },
  { match: /Otterup/i, city: 'Otterup', pop: 5300, cat: 'town' },
  { match: /R[æa]kker M[øo]lle/i, city: 'Rækker Mølle', pop: 2500, cat: 'town' },
];

// ==================== GERMANY (84 Clubs) ====================
export const GERMAN_CITY_RULES: CityRule[] = [
  { match: /Berlin/i, city: 'Berlin', pop: 3750000, cat: 'metro' },
  { match: /Hamburg/i, city: 'Hamburg', pop: 1900000, cat: 'metro' },
  { match: /M[üu]nchen|Munich/i, city: 'Munich', pop: 1550000, cat: 'metro' },
  { match: /K[öo]ln|Cologne/i, city: 'Cologne', pop: 1085000, cat: 'metro' },
  { match: /Frankfurt/i, city: 'Frankfurt am Main', pop: 765000, cat: 'metro' },
  { match: /Stuttgart/i, city: 'Stuttgart', pop: 630000, cat: 'metro' },
  { match: /D[üu]sseldorf/i, city: 'Düsseldorf', pop: 620000, cat: 'metro' },
  { match: /Leipzig/i, city: 'Leipzig', pop: 615000, cat: 'metro' },
  { match: /Dortmund/i, city: 'Dortmund', pop: 590000, cat: 'metro' },
  { match: /Essen|TUSEM/i, city: 'Essen', pop: 585000, cat: 'stronghold' },
  { match: /Bremen|Habenhausen/i, city: 'Bremen', pop: 570000, cat: 'metro' },
  { match: /Dresden|Elbflorenz/i, city: 'Dresden', pop: 560000, cat: 'metro' },
  { match: /Hannover/i, city: 'Hannover', pop: 545000, cat: 'metro' },
  { match: /N[üu]rnberg|Nuremberg/i, city: 'Nuremberg', pop: 520000, cat: 'metro' },
  { match: /Duisburg/i, city: 'Duisburg', pop: 500000, cat: 'metro' },
  { match: /Bochum/i, city: 'Bochum', pop: 365000, cat: 'metro' },
  { match: /Wuppertal/i, city: 'Wuppertal', pop: 355000, cat: 'metro' },
  { match: /Bielefeld|Altenhagen/i, city: 'Bielefeld', pop: 340000, cat: 'metro' },
  { match: /Bonn/i, city: 'Bonn', pop: 330000, cat: 'metro' },
  { match: /M[üu]nster/i, city: 'Münster', pop: 315000, cat: 'metro' },
  { match: /Mannheim|Rhein-Neckar|L[öo]wen/i, city: 'Mannheim', pop: 315000, cat: 'stronghold' },
  { match: /Karlsruhe/i, city: 'Karlsruhe', pop: 310000, cat: 'metro' },
  { match: /Augsburg/i, city: 'Augsburg', pop: 300000, cat: 'metro' },
  { match: /Wiesbaden/i, city: 'Wiesbaden', pop: 280000, cat: 'metro' },
  { match: /M[öo]nchengladbach/i, city: 'Mönchengladbach', pop: 260000, cat: 'metro' },
  { match: /Gelsenkirchen/i, city: 'Gelsenkirchen', pop: 260000, cat: 'metro' },
  { match: /Aachen/i, city: 'Aachen', pop: 250000, cat: 'metro' },
  { match: /Braunschweig/i, city: 'Braunschweig', pop: 250000, cat: 'metro' },
  { match: /Chemnitz/i, city: 'Chemnitz', pop: 250000, cat: 'metro' },
  { match: /Kiel(?!\w)/i, city: 'Kiel', pop: 247000, cat: 'stronghold' },
  { match: /\bHalle(?:\s*\(Saale\)|\s+an\s+der\s+Saale)?\b/i, city: 'Halle (Saale)', pop: 240000, cat: 'metro' },
  { match: /Magdeburg/i, city: 'Magdeburg', pop: 239000, cat: 'stronghold' },
  { match: /Freiburg/i, city: 'Freiburg', pop: 235000, cat: 'metro' },
  { match: /Krefeld/i, city: 'Krefeld', pop: 227000, cat: 'mid' },
  { match: /Mainz/i, city: 'Mainz', pop: 220000, cat: 'metro' },
  { match: /L[üu]beck/i, city: 'Lübeck', pop: 220000, cat: 'metro' },
  { match: /Erfurt/i, city: 'Erfurt', pop: 215000, cat: 'metro' },
  { match: /Oberhausen/i, city: 'Oberhausen', pop: 210000, cat: 'metro' },
  { match: /Rostock|Empor/i, city: 'Rostock', pop: 209000, cat: 'stronghold' },
  { match: /Kassel/i, city: 'Kassel', pop: 205000, cat: 'stronghold' },
  { match: /\bHagen\b/i, city: 'Hagen', pop: 188000, cat: 'mid' },
  { match: /Potsdam/i, city: 'Potsdam', pop: 185000, cat: 'mid' },
  { match: /Saarbr[üu]cken/i, city: 'Saarbrücken', pop: 180000, cat: 'metro' },
  { match: /Hamm/i, city: 'Hamm', pop: 179000, cat: 'mid' },
  { match: /Ludwigshafen|Eulen/i, city: 'Ludwigshafen', pop: 172000, cat: 'mid' },
  { match: /Paderborn/i, city: 'Paderborn', pop: 155000, cat: 'mid' },
  { match: /Oldenburg/i, city: 'Oldenburg', pop: 170000, cat: 'mid' },
  { match: /Osnabr[üu]ck/i, city: 'Osnabrück', pop: 165000, cat: 'mid' },
  { match: /Leverkusen/i, city: 'Leverkusen', pop: 163000, cat: 'metro' },
  { match: /Solingen|Bergischer/i, city: 'Solingen', pop: 160000, cat: 'stronghold' },
  { match: /Heidelberg/i, city: 'Heidelberg', pop: 160000, cat: 'mid' },
  { match: /Darmstadt/i, city: 'Darmstadt', pop: 160000, cat: 'mid' },
  { match: /Regensburg/i, city: 'Regensburg', pop: 153000, cat: 'mid' },
  { match: /Ingolstadt/i, city: 'Ingolstadt', pop: 140000, cat: 'mid' },
  { match: /W[üu]rzburg|W[öo]lfe/i, city: 'Würzburg', pop: 130000, cat: 'mid' },
  { match: /Ulm/i, city: 'Ulm', pop: 126000, cat: 'mid' },
  { match: /Wolfsburg/i, city: 'Wolfsburg', pop: 125000, cat: 'mid' },
  { match: /Offenbach/i, city: 'Offenbach', pop: 130000, cat: 'mid' },
  { match: /Heilbronn/i, city: 'Heilbronn', pop: 125000, cat: 'mid' },
  { match: /Pforzheim/i, city: 'Pforzheim', pop: 125000, cat: 'mid' },
  { match: /G[öo]ttingen/i, city: 'Göttingen', pop: 118000, cat: 'mid' },
  { match: /Erlangen/i, city: 'Erlangen', pop: 116000, cat: 'stronghold' },
  { match: /Trier/i, city: 'Trier', pop: 110000, cat: 'mid' },
  { match: /Recklinghausen/i, city: 'Recklinghausen', pop: 110000, cat: 'mid' },
  { match: /Cottbus/i, city: 'Cottbus', pop: 100000, cat: 'mid' },
  { match: /Hildesheim/i, city: 'Hildesheim', pop: 100000, cat: 'mid' },
  { match: /Siegen|Ferndorf/i, city: 'Siegen', pop: 100000, cat: 'stronghold' },
  { match: /Hanau/i, city: 'Hanau', pop: 100000, cat: 'mid' },
  { match: /Flensburg/i, city: 'Flensburg', pop: 92000, cat: 'stronghold' },
  { match: /Gie[ßs]en|H[üu]ttenberg/i, city: 'Gießen', pop: 90000, cat: 'stronghold' },
  { match: /Konstanz/i, city: 'Konstanz', pop: 85000, cat: 'stronghold' },
  { match: /Dessau/i, city: 'Dessau-Roßlau', pop: 79000, cat: 'stronghold' },
  { match: /Minden/i, city: 'Minden', pop: 82000, cat: 'stronghold' },
  { match: /Villingen-Schwenningen/i, city: 'Villingen-Schwenningen', pop: 86000, cat: 'mid' },
  { match: /Nordhorn|Lingen/i, city: 'Nordhorn', pop: 55000, cat: 'stronghold' },
  { match: /G[öo]ppingen|Frisch Auf/i, city: 'Göppingen', pop: 58000, cat: 'stronghold' },
  { match: /Bietigheim/i, city: 'Bietigheim-Bissingen', pop: 43000, cat: 'stronghold' },
  { match: /Gummersbach/i, city: 'Gummersbach', pop: 51000, cat: 'stronghold' },
  { match: /Wetzlar/i, city: 'Wetzlar', pop: 53000, cat: 'stronghold' },
  { match: /Eisenach/i, city: 'Eisenach', pop: 42000, cat: 'stronghold' },
  { match: /Coburg/i, city: 'Coburg', pop: 41000, cat: 'stronghold' },
  { match: /Lemgo/i, city: 'Lemgo', pop: 41000, cat: 'stronghold' },
  { match: /Balingen|HBW/i, city: 'Balingen', pop: 34000, cat: 'stronghold' },
  { match: /L[üu]bbecke/i, city: 'Lübbecke', pop: 26000, cat: 'stronghold' },
  { match: /Melsungen/i, city: 'Melsungen', pop: 14000, cat: 'stronghold' },
  { match: /Aue\b|Erzgebirge/i, city: 'Aue-Bad Schlema', pop: 20000, cat: 'stronghold' },
  { match: /Saarlouis/i, city: 'Saarlouis', pop: 35000, cat: 'mid' },
  { match: /Gelnhausen/i, city: 'Gelnhausen', pop: 23000, cat: 'mid' },
  { match: /Gro[ßs]wallstadt/i, city: 'Großwallstadt', pop: 4100, cat: 'stronghold' },
  { match: /Altenholz/i, city: 'Altenholz', pop: 10000, cat: 'mid' },
  { match: /Schalksm[üu]hle|Halver|SGSH/i, city: 'Schalksmühle', pop: 32000, cat: 'town' },
  { match: /Krefeld/i, city: 'Krefeld', pop: 227000, cat: 'mid' },
];

// ==================== FRANCE (76 Clubs) ====================
export const FRENCH_CITY_RULES: CityRule[] = [
  { match: /Paris|PSG|Cr[eé]teil|Ivry|Tremblay|Massy|Pontault|Torcy/i, city: 'Paris', pop: 2160000, cat: 'metro' },
  { match: /Marseille/i, city: 'Marseille', pop: 870000, cat: 'metro' },
  { match: /Lyon|V[eé]nissieux|Villeurbanne/i, city: 'Lyon', pop: 520000, cat: 'metro' },
  { match: /Toulouse/i, city: 'Toulouse', pop: 490000, cat: 'metro' },
  { match: /Nice/i, city: 'Nice', pop: 340000, cat: 'metro' },
  { match: /Nantes/i, city: 'Nantes', pop: 320000, cat: 'stronghold' },
  { match: /Montpellier/i, city: 'Montpellier', pop: 295000, cat: 'stronghold' },
  { match: /Strasbourg/i, city: 'Strasbourg', pop: 290000, cat: 'metro' },
  { match: /Bordeaux/i, city: 'Bordeaux', pop: 260000, cat: 'metro' },
  { match: /Lille/i, city: 'Lille', pop: 235000, cat: 'metro' },
  { match: /Rennes|Cesson/i, city: 'Rennes', pop: 220000, cat: 'metro' },
  { match: /Toulon/i, city: 'Toulon', pop: 180000, cat: 'mid' },
  { match: /Reims/i, city: 'Reims', pop: 180000, cat: 'mid' },
  { match: /Saint-[EÉ]tienne/i, city: 'Saint-Étienne', pop: 175000, cat: 'mid' },
  { match: /Le Havre/i, city: 'Le Havre', pop: 165000, cat: 'mid' },
  { match: /Grenoble/i, city: 'Grenoble', pop: 160000, cat: 'mid' },
  { match: /Dijon/i, city: 'Dijon', pop: 160000, cat: 'mid' },
  { match: /Angers/i, city: 'Angers', pop: 155000, cat: 'mid' },
  { match: /Villeurbanne/i, city: 'Villeurbanne', pop: 150000, cat: 'mid' },
  { match: /N[îi]mes|USAM/i, city: 'Nîmes', pop: 150000, cat: 'stronghold' },
  { match: /Aix|PAUC/i, city: 'Aix-en-Provence', pop: 145000, cat: 'stronghold' },
  { match: /Clermont|Cournon/i, city: 'Clermont-Ferrand', pop: 147000, cat: 'mid' },
  { match: /Le Mans/i, city: 'Le Mans', pop: 145000, cat: 'mid' },
  { match: /Brest/i, city: 'Brest', pop: 140000, cat: 'mid' },
  { match: /Tours/i, city: 'Tours', pop: 136000, cat: 'mid' },
  { match: /Amiens/i, city: 'Amiens', pop: 134000, cat: 'mid' },
  { match: /Limoges/i, city: 'Limoges', pop: 130000, cat: 'stronghold' },
  { match: /Annecy/i, city: 'Annecy', pop: 130000, cat: 'mid' },
  { match: /Perpignan/i, city: 'Perpignan', pop: 120000, cat: 'mid' },
  { match: /Boulogne/i, city: 'Boulogne-Billancourt', pop: 120000, cat: 'metro' },
  { match: /Metz/i, city: 'Metz', pop: 120000, cat: 'stronghold' },
  { match: /Besan[çc]on/i, city: 'Besançon', pop: 118000, cat: 'stronghold' },
  { match: /Orl[eé]ans|Saran/i, city: 'Orléans', pop: 116000, cat: 'mid' },
  { match: /Rouen/i, city: 'Rouen', pop: 114000, cat: 'stronghold' },
  { match: /Mulhouse/i, city: 'Mulhouse', pop: 110000, cat: 'mid' },
  { match: /Caen/i, city: 'Caen', pop: 106000, cat: 'stronghold' },
  { match: /Nancy/i, city: 'Nancy', pop: 105000, cat: 'stronghold' },
  { match: /Dunkerque/i, city: 'Dunkerque', pop: 86000, cat: 'stronghold' },
  { match: /Pau|Bill[èe]re/i, city: 'Pau', pop: 77000, cat: 'stronghold' },
  { match: /Chamb[eé]ry/i, city: 'Chambéry', pop: 60000, cat: 'stronghold' },
  { match: /Valence/i, city: 'Valence', pop: 65000, cat: 'mid' },
  { match: /Montauban/i, city: 'Montauban', pop: 63000, cat: 'mid' },
  { match: /Lorient/i, city: 'Lorient', pop: 58000, cat: 'mid' },
  { match: /Vannes/i, city: 'Vannes', pop: 55000, cat: 'mid' },
  { match: /Cherbourg/i, city: 'Cherbourg', pop: 78000, cat: 'stronghold' },
  { match: /Chartres/i, city: 'Chartres', pop: 39000, cat: 'stronghold' },
  { match: /Monaco/i, city: 'Monaco', pop: 39000, cat: 'stronghold' },
  { match: /Saint-Rapha[ëe]l/i, city: 'Saint-Raphaël', pop: 36000, cat: 'stronghold' },
  { match: /Istres/i, city: 'Istres', pop: 44000, cat: 'stronghold' },
  { match: /Carcassonne/i, city: 'Carcassonne', pop: 47000, cat: 'mid' },
  { match: /Biarritz/i, city: 'Biarritz', pop: 26000, cat: 'mid' },
  { match: /Lanester/i, city: 'Lanester', pop: 23000, cat: 'mid' },
  { match: /Frontignan/i, city: 'Frontignan', pop: 23000, cat: 'stronghold' },
  { match: /S[eé]lestat/i, city: 'Sélestat', pop: 19000, cat: 'stronghold' },
];

// ==================== SPAIN (76 Clubs) ====================
export const SPANISH_CITY_RULES: CityRule[] = [
  { match: /Madrid|Alcobendas|Pinto/i, city: 'Madrid', pop: 3300000, cat: 'metro' },
  { match: /Barcelona|Bar[çc]a/i, city: 'Barcelona', pop: 1620000, cat: 'metro' },
  { match: /Valencia/i, city: 'Valencia', pop: 800000, cat: 'metro' },
  { match: /Sevilla|Seville/i, city: 'Seville', pop: 690000, cat: 'metro' },
  { match: /Zaragoza/i, city: 'Zaragoza', pop: 680000, cat: 'metro' },
  { match: /M[áa]laga/i, city: 'Málaga', pop: 580000, cat: 'metro' },
  { match: /Murcia/i, city: 'Murcia', pop: 460000, cat: 'metro' },
  { match: /Palma del R[íi]o/i, city: 'Palma del Río', pop: 21000, cat: 'town' },
  { match: /Las Palmas/i, city: 'Las Palmas', pop: 380000, cat: 'metro' },
  { match: /\bPalma\b(?! del R[íi]o)|Mallorca/i, city: 'Palma de Mallorca', pop: 420000, cat: 'metro' },
  { match: /Bilbao/i, city: 'Bilbao', pop: 345000, cat: 'metro' },
  { match: /Alicante|Eldense|Elda/i, city: 'Alicante', pop: 340000, cat: 'metro' },
  { match: /C[óo]rdoba|Puente Genil/i, city: 'Córdoba', pop: 325000, cat: 'stronghold' },
  { match: /Valladolid/i, city: 'Valladolid', pop: 300000, cat: 'stronghold' },
  { match: /Vigo|Lavadores/i, city: 'Vigo', pop: 295000, cat: 'metro' },
  { match: /Gij[óo]n|Covadonga/i, city: 'Gijón', pop: 270000, cat: 'metro' },
  { match: /Hospitalet/i, city: 'L\'Hospitalet', pop: 265000, cat: 'metro' },
  { match: /Vitoria|Gazteiz/i, city: 'Vitoria-Gasteiz', pop: 250000, cat: 'mid' },
  { match: /Coru[ñn]a/i, city: 'A Coruña', pop: 245000, cat: 'mid' },
  { match: /Granada/i, city: 'Granada', pop: 230000, cat: 'mid' },
  { match: /Cartagena/i, city: 'Cartagena', pop: 215000, cat: 'stronghold' },
  { match: /Pamplona|Anaitasuna|Navarra/i, city: 'Pamplona', pop: 205000, cat: 'stronghold' },
  { match: /Almer[íi]a/i, city: 'Almería', pop: 200000, cat: 'mid' },
  { match: /San Sebasti[áa]n|Donostia|Egia/i, city: 'San Sebastián', pop: 188000, cat: 'stronghold' },
  { match: /Santander|Sinf[íi]n/i, city: 'Santander', pop: 172000, cat: 'stronghold' },
  { match: /Burgos/i, city: 'Burgos', pop: 175000, cat: 'stronghold' },
  { match: /Castell[óo]n/i, city: 'Castellón de la Plana', pop: 170000, cat: 'mid' },
  { match: /Badajoz/i, city: 'Badajoz', pop: 150000, cat: 'mid' },
  { match: /Salamanca/i, city: 'Salamanca', pop: 145000, cat: 'stronghold' },
  { match: /Huelva/i, city: 'Huelva', pop: 140000, cat: 'mid' },
  { match: /Logro[ñn]o|La Rioja/i, city: 'Logroño', pop: 150000, cat: 'stronghold' },
  { match: /Le[óo]n|Ademar/i, city: 'León', pop: 125000, cat: 'stronghold' },
  { match: /C[áa]diz/i, city: 'Cádiz', pop: 115000, cat: 'mid' },
  { match: /Ja[ée]n/i, city: 'Jaén', pop: 112000, cat: 'mid' },
  { match: /Ourense/i, city: 'Ourense', pop: 105000, cat: 'mid' },
  { match: /Lugo/i, city: 'Lugo', pop: 100000, cat: 'mid' },
  { match: /Girona/i, city: 'Girona', pop: 100000, cat: 'mid' },
  { match: /C[áa]ceres/i, city: 'Cáceres', pop: 96000, cat: 'mid' },
  { match: /Guadalajara/i, city: 'Guadalajara', pop: 88000, cat: 'stronghold' },
  { match: /Toledo|Ciudad Imperial/i, city: 'Toledo', pop: 86000, cat: 'stronghold' },
  { match: /Pontevedra|Teucro/i, city: 'Pontevedra', pop: 83000, cat: 'stronghold' },
  { match: /Palencia/i, city: 'Palencia', pop: 78000, cat: 'mid' },
  { match: /Ciudad Real|Caser[íi]o/i, city: 'Ciudad Real', pop: 75000, cat: 'stronghold' },
  { match: /Benidorm/i, city: 'Benidorm', pop: 70000, cat: 'stronghold' },
  { match: /Torrelavega/i, city: 'Torrelavega', pop: 52000, cat: 'stronghold' },
  { match: /Huesca/i, city: 'Huesca', pop: 54000, cat: 'stronghold' },
  { match: /Cuenca/i, city: 'Cuenca', pop: 54000, cat: 'stronghold' },
  { match: /Sagunto|Puerto Sagunto/i, city: 'Sagunto', pop: 67000, cat: 'stronghold' },
  { match: /Irun|Bidasoa/i, city: 'Irun', pop: 62000, cat: 'stronghold' },
  { match: /Granollers/i, city: 'Granollers', pop: 62000, cat: 'stronghold' },
  { match: /Segovia/i, city: 'Segovia', pop: 52000, cat: 'mid' },
  { match: /[ÁA]vila/i, city: 'Ávila', pop: 58000, cat: 'mid' },
  { match: /Linares/i, city: 'Linares', pop: 56000, cat: 'mid' },
  { match: /Soria/i, city: 'Soria', pop: 40000, cat: 'town' },
  { match: /Cangas|Morrazo/i, city: 'Cangas do Morrazo', pop: 27000, cat: 'stronghold' },
  { match: /Eibar|Arrate/i, city: 'Eibar', pop: 28000, cat: 'stronghold' },
  { match: /Zarautz|Amenabar/i, city: 'Zarautz', pop: 24000, cat: 'town' },
  { match: /Santo[ñn]a/i, city: 'Santoña', pop: 11000, cat: 'town' },
  { match: /Nava/i, city: 'Nava de la Asunción', pop: 2800, cat: 'stronghold' },
  { match: /Tarragona/i, city: 'Tarragona', pop: 135000, cat: 'stronghold' },
  { match: /Reus/i, city: 'Reus', pop: 108000, cat: 'stronghold' },
];

// ==================== SWEDEN (56 Clubs) ====================
export const SWEDISH_CITY_RULES: CityRule[] = [
  { match: /Stockholm|Hammarby|Tyres[öo]|Tumba|Liding[öo]|Huddinge|Sollentuna/i, city: 'Stockholm', pop: 985000, cat: 'metro' },
  { match: /G[öo]teborg|S[äa]vehof|Partille|[ÖO]nnered|Redbergslid|Wasaiterna|Heid|KvIK/i, city: 'Gothenburg', pop: 600000, cat: 'metro' },
  { match: /Malm[öo]/i, city: 'Malmö', pop: 350000, cat: 'metro' },
  { match: /Uppsala/i, city: 'Uppsala', pop: 170000, cat: 'metro' },
  { match: /V[äa]ster[åa]s/i, city: 'Västerås', pop: 130000, cat: 'mid' },
  { match: /[ÖO]rebro/i, city: 'Örebro', pop: 160000, cat: 'stronghold' },
  { match: /Link[öo]ping/i, city: 'Linköping', pop: 115000, cat: 'mid' },
  { match: /Helsingborg|OV Helsingborg/i, city: 'Helsingborg', pop: 113000, cat: 'stronghold' },
  { match: /J[öo]nk[öo]ping|Hallby/i, city: 'Jönköping', pop: 100000, cat: 'stronghold' },
  { match: /Norrk[öo]ping/i, city: 'Norrköping', pop: 98000, cat: 'mid' },
  { match: /Lund|LUGI/i, city: 'Lund', pop: 95000, cat: 'stronghold' },
  { match: /Ume[åa]/i, city: 'Umeå', pop: 130000, cat: 'stronghold' },
  { match: /G[äa]vle/i, city: 'Gävle', pop: 78000, cat: 'mid' },
  { match: /Bor[åa]s/i, city: 'Borås', pop: 74000, cat: 'mid' },
  { match: /Eskilstuna|Guif/i, city: 'Eskilstuna', pop: 70000, cat: 'stronghold' },
  { match: /Halmstad|Drott/i, city: 'Halmstad', pop: 72000, cat: 'stronghold' },
  { match: /V[äa]xj[öo]/i, city: 'Växjö', pop: 70000, cat: 'mid' },
  { match: /Karlstad/i, city: 'Karlstad', pop: 67000, cat: 'mid' },
  { match: /Sundsvall/i, city: 'Sundsvall', pop: 60000, cat: 'mid' },
  { match: /Trollh[äa]ttan/i, city: 'Trollhättan', pop: 50000, cat: 'mid' },
  { match: /Sk[öo]vde/i, city: 'Skövde', pop: 40000, cat: 'stronghold' },
  { match: /Karlskrona/i, city: 'Karlskrona', pop: 37000, cat: 'stronghold' },
  { match: /Kristianstad/i, city: 'Kristianstad', pop: 41000, cat: 'stronghold' },
  { match: /Kungsbacka|Aran[äa]s/i, city: 'Kungsbacka', pop: 24000, cat: 'stronghold' },
  { match: /Alings[åa]s/i, city: 'Alingsås', pop: 25000, cat: 'stronghold' },
  { match: /Ystad/i, city: 'Ystad', pop: 20000, cat: 'stronghold' },
  { match: /Nyk[öo]ping/i, city: 'Nyköping', pop: 58000, cat: 'mid' },
  { match: /Enk[öo]ping/i, city: 'Enköping', pop: 47000, cat: 'mid' },
  { match: /Pite[åa]|Str[öo]mn[äa]s/i, city: 'Piteå', pop: 42000, cat: 'mid' },
  { match: /Amo|Alstermo/i, city: 'Alstermo', pop: 1200, cat: 'stronghold' },
];

// ==================== CROATIA (58 Clubs) ====================
export const CROATIAN_CITY_RULES: CityRule[] = [
  { match: /Zagreb|Sesvete|Dubrava|Maksimir|Medve[šs][čc]ak|Trnje|Metalac/i, city: 'Zagreb', pop: 790000, cat: 'metro' },
  { match: /Split|Solin|Bali[ćc]|Mornar Split/i, city: 'Split', pop: 160000, cat: 'metro' },
  { match: /Rijeka|Zamet|Kozala/i, city: 'Rijeka', pop: 108000, cat: 'metro' },
  { match: /Osijek/i, city: 'Osijek', pop: 96000, cat: 'stronghold' },
  { match: /Zadar/i, city: 'Zadar', pop: 71000, cat: 'mid' },
  { match: /Pula/i, city: 'Pula', pop: 52000, cat: 'mid' },
  { match: /Slavonski Brod/i, city: 'Slavonski Brod', pop: 50000, cat: 'mid' },
  { match: /Karlovac/i, city: 'Karlovac', pop: 49000, cat: 'stronghold' },
  { match: /Vara[žz]din|Vidovec/i, city: 'Varaždin', pop: 44000, cat: 'stronghold' },
  { match: /\b[ŠS]ibenik\b/i, city: 'Šibenik', pop: 43000, cat: 'mid' },
  { match: /Sisak/i, city: 'Sisak', pop: 40000, cat: 'mid' },
  { match: /Dubrovnik/i, city: 'Dubrovnik', pop: 41000, cat: 'mid' },
  { match: /Bjelovar/i, city: 'Bjelovar', pop: 37000, cat: 'stronghold' },
  { match: /Vinkovci/i, city: 'Vinkovci', pop: 31000, cat: 'mid' },
  { match: /Velika Gorica|Gorica/i, city: 'Velika Gorica', pop: 61000, cat: 'mid' },
  { match: /Koprivnica/i, city: 'Koprivnica', pop: 31000, cat: 'stronghold' },
  { match: /Po[žz]ega/i, city: 'Požega', pop: 26000, cat: 'town' },
  { match: /\bSinj\b|Kami[čc]ak/i, city: 'Sinj', pop: 24000, cat: 'town' },
  { match: /Na[šs]ice|Nexe/i, city: 'Našice', pop: 16000, cat: 'stronghold' },
  { match: /Pore[čc]/i, city: 'Poreč', pop: 17000, cat: 'stronghold' },
  { match: /Umag/i, city: 'Umag', pop: 13000, cat: 'stronghold' },
  { match: /Metkovi[ćc]/i, city: 'Metković', pop: 15000, cat: 'stronghold' },
  { match: /Trogir/i, city: 'Trogir', pop: 13000, cat: 'stronghold' },
  { match: /Ka[šs]tela/i, city: 'Kaštela', pop: 38000, cat: 'mid' },
  { match: /Rovinj/i, city: 'Rovinj', pop: 14000, cat: 'town' },
  { match: /Gospi[ćc]/i, city: 'Gospić', pop: 13000, cat: 'town' },
  { match: /Knin/i, city: 'Knin', pop: 11000, cat: 'town' },
  { match: /Crikvenica|Mornar Crikvenica/i, city: 'Crikvenica', pop: 11000, cat: 'town' },
  { match: /Oto[čc]ac/i, city: 'Otočac', pop: 9000, cat: 'town' },
  { match: /\bRab\b/i, city: 'Rab', pop: 9000, cat: 'town' },
  { match: /Vodice/i, city: 'Vodice', pop: 9000, cat: 'town' },
  { match: /Murter/i, city: 'Murter', pop: 5000, cat: 'town' },
  { match: /Primo[šs]ten/i, city: 'Primošten', pop: 3000, cat: 'town' },
  { match: /\bHvar\b/i, city: 'Hvar', pop: 4000, cat: 'town' },
];

// ==================== PORTUGAL (54 Clubs) ====================
export const PORTUGUESE_CITY_RULES: CityRule[] = [
  { match: /Lisboa|Lisbon|Sporting|Benfica|Belenenses|Boa-Hora/i, city: 'Lisbon', pop: 545000, cat: 'metro' },
  { match: /Porto|Boavista/i, city: 'Porto', pop: 230000, cat: 'metro' },
  { match: /Vila Nova de Gaia|Gaia/i, city: 'Vila Nova de Gaia', pop: 300000, cat: 'metro' },
  { match: /Amadora/i, city: 'Amadora', pop: 175000, cat: 'metro' },
  { match: /Braga|\bABC\b/i, city: 'Braga', pop: 195000, cat: 'stronghold' },
  { match: /Set[úu]bal/i, city: 'Setúbal', pop: 125000, cat: 'mid' },
  { match: /Coimbra/i, city: 'Coimbra', pop: 140000, cat: 'mid' },
  { match: /Funchal|Madeira|Mar[íi]timo/i, city: 'Funchal', pop: 105000, cat: 'stronghold' },
  { match: /Almada/i, city: 'Almada', pop: 175000, cat: 'metro' },
  { match: /Guimar[ãa]es|Vit[óo]ria/i, city: 'Guimarães', pop: 155000, cat: 'stronghold' },
  { match: /Aveiro|S[ãa]o Bernardo/i, city: 'Aveiro', pop: 80000, cat: 'mid' },
  { match: /P[óo]voa/i, city: 'Póvoa de Varzim', pop: 63000, cat: 'stronghold' },
  { match: /Portim[ãa]o|Portimonense/i, city: 'Portimão', pop: 60000, cat: 'mid' },
  { match: /[ÉE]vora/i, city: 'Évora', pop: 54000, cat: 'mid' },
  { match: /Chaves/i, city: 'Chaves', pop: 41000, cat: 'town' },
  { match: /Maia|[ÁA]guas Santas/i, city: 'Maia', pop: 140000, cat: 'stronghold' },
  { match: /Horta/i, city: 'Horta', pop: 15000, cat: 'stronghold' },
  { match: /Avanca/i, city: 'Avanca', pop: 6000, cat: 'stronghold' },
  { match: /Espinho/i, city: 'Espinho', pop: 32000, cat: 'town' },
  { match: /Vagos/i, city: 'Vagos', pop: 23000, cat: 'town' },
  { match: /[ÍI]lhavo/i, city: 'Ílhavo', pop: 40000, cat: 'town' },
  { match: /Murtosa/i, city: 'Murtosa', pop: 10000, cat: 'town' },
  { match: /Armamar/i, city: 'Armamar', pop: 6000, cat: 'town' },
  { match: /Lamego/i, city: 'Lamego', pop: 24000, cat: 'town' },
  { match: /Tarouca/i, city: 'Tarouca', pop: 8000, cat: 'town' },
  { match: /Moimenta da Beira/i, city: 'Moimenta da Beira', pop: 10000, cat: 'town' },
  { match: /Penedono/i, city: 'Penedono', pop: 3000, cat: 'town' },
  { match: /Sernancelhe/i, city: 'Sernancelhe', pop: 5500, cat: 'town' },
  { match: /Tabua[çc]o/i, city: 'Tabuaço', pop: 5000, cat: 'town' },
  { match: /Ovar|Esmoriz/i, city: 'Ovar', pop: 55000, cat: 'mid' },
  { match: /Feirense|Feira/i, city: 'Santa Maria da Feira', pop: 140000, cat: 'mid' },
  { match: /Arouca/i, city: 'Arouca', pop: 21000, cat: 'town' },
];

// ==================== NORWAY (56 Clubs) ====================
export const NORWEGIAN_CITY_RULES: CityRule[] = [
  { match: /Oslo|B[æa]kkelaget|OSI\b/i, city: 'Oslo', pop: 710000, cat: 'metro' },
  { match: /Bergen|Viking TIF/i, city: 'Bergen', pop: 290000, cat: 'metro' },
  { match: /Trondheim|Kolstad/i, city: 'Trondheim', pop: 210000, cat: 'stronghold' },
  { match: /Stavanger|Ryger/i, city: 'Stavanger', pop: 145000, cat: 'metro' },
  { match: /B[æa]rum|Haslum/i, city: 'Bærum', pop: 130000, cat: 'mid' },
  { match: /Kristiansand/i, city: 'Kristiansand', pop: 115000, cat: 'stronghold' },
  { match: /Drammen/i, city: 'Drammen', pop: 103000, cat: 'stronghold' },
  { match: /Lillestr[øo]m|Fjellhammer/i, city: 'Lillestrøm', pop: 90000, cat: 'mid' },
  { match: /Fredrikstad/i, city: 'Fredrikstad', pop: 85000, cat: 'mid' },
  { match: /Sandnes/i, city: 'Sandnes', pop: 83000, cat: 'mid' },
  { match: /Troms[øo]/i, city: 'Tromsø', pop: 78000, cat: 'mid' },
  { match: /Sandefjord|Runar/i, city: 'Sandefjord', pop: 65000, cat: 'stronghold' },
  { match: /Nordre Follo|Follo|Ski\b/i, city: 'Ski', pop: 62000, cat: 'mid' },
  { match: /Skien|Herkules/i, city: 'Skien', pop: 55000, cat: 'stronghold' },
  { match: /Bod[øo]/i, city: 'Bodø', pop: 53000, cat: 'stronghold' },
  { match: /[ÅA]lesund/i, city: 'Ålesund', pop: 47000, cat: 'mid' },
  { match: /Arendal|[ØO]IF/i, city: 'Arendal', pop: 45000, cat: 'stronghold' },
  { match: /Halden/i, city: 'Halden', pop: 32000, cat: 'stronghold' },
  { match: /Hamar/i, city: 'Hamar', pop: 32000, cat: 'stronghold' },
  { match: /Porsgrunn|Ur[æa]dd/i, city: 'Porsgrunn', pop: 37000, cat: 'mid' },
  { match: /Elverum/i, city: 'Elverum', pop: 21000, cat: 'stronghold' },
  { match: /Kongsvinger/i, city: 'Kongsvinger', pop: 18000, cat: 'town' },
  { match: /Mandal/i, city: 'Mandal', pop: 16000, cat: 'town' },
  { match: /N[æa]rb[øo]/i, city: 'Nærbø', pop: 7500, cat: 'stronghold' },
  { match: /Odda/i, city: 'Odda', pop: 7000, cat: 'town' },
  { match: /Alta/i, city: 'Alta', pop: 21000, cat: 'town' },
  { match: /Notodden/i, city: 'Notodden', pop: 13000, cat: 'town' },
  { match: /Farsund/i, city: 'Farsund', pop: 10000, cat: 'town' },
  { match: /Kopervik|Karm[øo]y/i, city: 'Karmøy', pop: 42000, cat: 'mid' },
  { match: /\bGol\b/i, city: 'Gol', pop: 4500, cat: 'town' },
  { match: /Nesbyen/i, city: 'Nesbyen', pop: 3500, cat: 'town' },
  { match: /Geilo/i, city: 'Geilo', pop: 3000, cat: 'town' },
  { match: /Hemsedal/i, city: 'Hemsedal', pop: 2600, cat: 'town' },
];

// ==================== HUNGARY (56 Clubs) ====================
export const HUNGARIAN_CITY_RULES: CityRule[] = [
  { match: /Budapest|FTC|Ferencv[áa]ros|PLER|Honv[ée]d/i, city: 'Budapest', pop: 1750000, cat: 'metro' },
  { match: /Debrecen/i, city: 'Debrecen', pop: 200000, cat: 'metro' },
  { match: /Szeged|Pick/i, city: 'Szeged', pop: 160000, cat: 'stronghold' },
  { match: /Miskolc/i, city: 'Miskolc', pop: 150000, cat: 'metro' },
  { match: /P[ée]cs/i, city: 'Pécs', pop: 140000, cat: 'mid' },
  { match: /Gy[őo]r/i, city: 'Győr', pop: 132000, cat: 'stronghold' },
  { match: /Ny[íi]regyh[áa]z/i, city: 'Nyíregyháza', pop: 116000, cat: 'metro' },
  { match: /Kecskem[ée]t/i, city: 'Kecskemét', pop: 110000, cat: 'stronghold' },
  { match: /Sz[ée]kesfeh[ée]rv[áa]r|Alba Regia/i, city: 'Székesfehérvár', pop: 96000, cat: 'stronghold' },
  { match: /Szombathely/i, city: 'Szombathely', pop: 78000, cat: 'mid' },
  { match: /Szolnok/i, city: 'Szolnok', pop: 70000, cat: 'mid' },
  { match: /Tatab[áa]nya/i, city: 'Tatabánya', pop: 66000, cat: 'stronghold' },
  { match: /Sopron/i, city: 'Sopron', pop: 63000, cat: 'mid' },
  { match: /Kaposv[áa]r/i, city: 'Kaposvár', pop: 60000, cat: 'mid' },
  { match: /Veszpr[ée]m/i, city: 'Veszprém', pop: 60000, cat: 'stronghold' },
  { match: /B[ée]k[ée]scsaba/i, city: 'Békéscsaba', pop: 58000, cat: 'mid' },
  { match: /Zalaegerszeg/i, city: 'Zalaegerszeg', pop: 57000, cat: 'mid' },
  { match: /[ÉE]rd\b/i, city: 'Érd', pop: 70000, cat: 'mid' },
  { match: /Eger\b/i, city: 'Eger', pop: 52000, cat: 'stronghold' },
  { match: /Duna[úu]jv[áa]ros/i, city: 'Dunaújváros', pop: 44000, cat: 'mid' },
  { match: /V[áa]c\b|V[áa]ci/i, city: 'Vác', pop: 33000, cat: 'mid' },
  { match: /Gy[öo]ngy[öo]s/i, city: 'Gyöngyös', pop: 29000, cat: 'stronghold' },
  { match: /Baja\b|Bajai/i, city: 'Baja', pop: 35000, cat: 'town' },
  { match: /Szeksz[áa]rd/i, city: 'Szekszárd', pop: 31000, cat: 'town' },
  { match: /P[áa]pa\b|P[áa]pai/i, city: 'Pápa', pop: 30000, cat: 'town' },
  { match: /Esztergom/i, city: 'Esztergom', pop: 28000, cat: 'town' },
  { match: /Cegl[ée]d/i, city: 'Cegléd', pop: 35000, cat: 'mid' },
  { match: /Orosh[áa]za/i, city: 'Orosháza', pop: 26000, cat: 'mid' },
  { match: /Koml[óo]/i, city: 'Komló', pop: 22000, cat: 'stronghold' },
  { match: /Dabas/i, city: 'Dabas', pop: 17000, cat: 'stronghold' },
  { match: /Balatonf[üu]red/i, city: 'Balatonfüred', pop: 13000, cat: 'stronghold' },
  { match: /Csurg[óo]/i, city: 'Csurgó', pop: 5000, cat: 'stronghold' },
  { match: /Budakal[áa]sz/i, city: 'Budakalász', pop: 11000, cat: 'stronghold' },
  { match: /Balassagyarmat/i, city: 'Balassagyarmat', pop: 14000, cat: 'town' },
  { match: /Mez[őo]k[öo]vesd/i, city: 'Mezőkövesd', pop: 16000, cat: 'town' },
  { match: /Keszthely/i, city: 'Keszthely', pop: 19000, cat: 'town' },
  { match: /V[áa]rpalota/i, city: 'Várpalota', pop: 19000, cat: 'town' },
  { match: /Bonyh[áa]d/i, city: 'Bonyhád', pop: 13000, cat: 'town' },
  { match: /Szigetv[áa]r/i, city: 'Szigetvár', pop: 10000, cat: 'town' },
  { match: /Sikl[óo]s/i, city: 'Siklós', pop: 9000, cat: 'town' },
  { match: /Moh[áa]cs/i, city: 'Mohács', pop: 17000, cat: 'town' },
  { match: /Hark[áa]ny/i, city: 'Harkány', pop: 4500, cat: 'town' },
  { match: /B[óo]ly\b|B[óo]lyi/i, city: 'Bóly', pop: 4000, cat: 'town' },
  { match: /S[áa]sd\b|S[áa]sdi/i, city: 'Sásd', pop: 3000, cat: 'town' },
  { match: /Sz[áa]szv[áa]r/i, city: 'Szászvár', pop: 2300, cat: 'town' },
  { match: /Koz[áa]rmisleny/i, city: 'Kozármisleny', pop: 6500, cat: 'town' },
  { match: /Szentl[őo]rinc/i, city: 'Szentlőrinc', pop: 6200, cat: 'town' },
];

// ==================== ICELAND (42 Clubs) ====================
export const ICELANDIC_CITY_RULES: CityRule[] = [
  { match: /Reykjav[íi]k|Valur|Fram|\bKR\b|V[íi]kingur|Fj[öo]lnir|[ÍI]R\b|[ÞT]r[óo]ttur|Leiknir|Fylkir|V[æa]ngir/i, city: 'Reykjavík', pop: 140000, cat: 'metro' },
  { match: /K[óo]pavogur|\bHK\b/i, city: 'Kópavogur', pop: 40000, cat: 'stronghold' },
  { match: /Hafnarfj[öo]r[ðd]ur|\bFH\b|Haukar/i, city: 'Hafnarfjörður', pop: 30000, cat: 'stronghold' },
  { match: /Akureyri|\bKA\b|[ÞT][óo]r\b/i, city: 'Akureyri', pop: 20000, cat: 'stronghold' },
  { match: /Gar[ðd]ab[æa]r|Stjarnan/i, city: 'Garðabær', pop: 19000, cat: 'stronghold' },
  { match: /Mosfellsb[æa]r|Afturelding/i, city: 'Mosfellsbær', pop: 13500, cat: 'stronghold' },
  { match: /Keflav[íi]k|Reykjanesb[æa]r/i, city: 'Reykjanesbær', pop: 22000, cat: 'mid' },
  { match: /Akranes|[ÍI]A\b/i, city: 'Akranes', pop: 8000, cat: 'town' },
  { match: /Selfoss/i, city: 'Selfoss', pop: 9500, cat: 'stronghold' },
  { match: /Seltjarnarnes|Gr[óo]tta/i, city: 'Seltjarnarnes', pop: 4700, cat: 'stronghold' },
  { match: /Vestmannaeyjar|[ÍI]BV/i, city: 'Vestmannaeyjar', pop: 4400, cat: 'stronghold' },
  { match: /[ÍI]safj[öo]r[ðd]ur|H[öo]r[ðd]ur/i, city: 'Ísafjörður', pop: 2800, cat: 'town' },
  { match: /Egilssta[ðd]ir|H[öo]ttur/i, city: 'Egilsstaðir', pop: 3000, cat: 'town' },
  { match: /Grindav[íi]k/i, city: 'Grindavík', pop: 3600, cat: 'town' },
  { match: /Huginn|Sey[ðd]isfj[öo]r[ðd]ur/i, city: 'Seyðisfjörður', pop: 700, cat: 'town' },
  { match: /Fjar[ðd]abygg[ðd]/i, city: 'Fjarðabyggð', pop: 5200, cat: 'town' },
  { match: /Sindri|H[öo]fn/i, city: 'Höfn', pop: 2500, cat: 'town' },
  { match: /V[öo]lsungur|H[úu]sav[íi]k/i, city: 'Húsavík', pop: 2400, cat: 'town' },
  { match: /Magni|Greniv[íi]k/i, city: 'Grenivík', pop: 400, cat: 'town' },
  { match: /Tindast[óo]ll|Sau[ðd][áa]rkr[óo]kur/i, city: 'Sauðárkrókur', pop: 2600, cat: 'town' },
  { match: /Sandger[ðd]i/i, city: 'Sandgerði', pop: 2000, cat: 'town' },
  { match: /Gar[ðd]ur/i, city: 'Garður', pop: 1800, cat: 'town' },
];

// ==================== POLAND (28 Clubs) ====================
export const POLISH_CITY_RULES: CityRule[] = [
  { match: /Warszawa|Warsaw/i, city: 'Warsaw', pop: 1860000, cat: 'metro' },
  { match: /Krak[óo]w|Cracow/i, city: 'Kraków', pop: 800000, cat: 'metro' },
  { match: /Wroc[łl]aw|[ŚS]l[ąa]sk/i, city: 'Wrocław', pop: 670000, cat: 'metro' },
  { match: /[ŁL][óo]d[źz]/i, city: 'Łódź', pop: 660000, cat: 'metro' },
  { match: /Pozna[ńn]/i, city: 'Poznań', pop: 540000, cat: 'metro' },
  { match: /Gda[ńn]sk|Wybrze[żz]e/i, city: 'Gdańsk', pop: 485000, cat: 'metro' },
  { match: /Szczecin|Pogo[ńn]/i, city: 'Szczecin', pop: 395000, cat: 'metro' },
  { match: /Bydgoszcz/i, city: 'Bydgoszcz', pop: 335000, cat: 'mid' },
  { match: /Lublin/i, city: 'Lublin', pop: 330000, cat: 'mid' },
  { match: /Katowice/i, city: 'Katowice', pop: 285000, cat: 'metro' },
  { match: /Gdynia/i, city: 'Gdynia', pop: 245000, cat: 'metro' },
  { match: /Cz[ęe]stochowa/i, city: 'Częstochowa', pop: 210000, cat: 'mid' },
  { match: /Radom/i, city: 'Radom', pop: 200000, cat: 'mid' },
  { match: /Toru[ńn]/i, city: 'Toruń', pop: 195000, cat: 'mid' },
  { match: /Sosnowiec/i, city: 'Sosnowiec', pop: 190000, cat: 'mid' },
  { match: /Kielce|Industria/i, city: 'Kielce', pop: 185000, cat: 'stronghold' },
  { match: /Gliwice/i, city: 'Gliwice', pop: 175000, cat: 'mid' },
  { match: /Zabrze|G[óo]rnik/i, city: 'Zabrze', pop: 170000, cat: 'stronghold' },
  { match: /Bielsko-Bia[łl]a/i, city: 'Bielsko-Biała', pop: 168000, cat: 'mid' },
  { match: /Olsztyn/i, city: 'Olsztyn', pop: 168000, cat: 'mid' },
  { match: /Rzesz[óo]w/i, city: 'Rzeszów', pop: 195000, cat: 'mid' },
  { match: /Ruda [ŚS]l[ąa]ska/i, city: 'Ruda Śląska', pop: 135000, cat: 'mid' },
  { match: /Rybnik/i, city: 'Rybnik', pop: 135000, cat: 'mid' },
  { match: /Tychy/i, city: 'Tychy', pop: 125000, cat: 'mid' },
  { match: /Opole|Gwardia/i, city: 'Opole', pop: 127000, cat: 'stronghold' },
  { match: /P[łl]ock|Wis[łl]a/i, city: 'Płock', pop: 115000, cat: 'stronghold' },
  { match: /Elbl[ąa]g/i, city: 'Elbląg', pop: 115000, cat: 'mid' },
  { match: /D[ąa]browa G[óo]rnicza/i, city: 'Dąbrowa Górnicza', pop: 115000, cat: 'mid' },
  { match: /Wa[łl]brzych/i, city: 'Wałbrzych', pop: 105000, cat: 'mid' },
  { match: /Tarn[óo]w|Unia/i, city: 'Tarnów', pop: 105000, cat: 'mid' },
  { match: /Chorz[óo]w/i, city: 'Chorzów', pop: 100000, cat: 'mid' },
  { match: /Kalisz|Energa MKS/i, city: 'Kalisz', pop: 98000, cat: 'stronghold' },
  { match: /Koszalin/i, city: 'Koszalin', pop: 105000, cat: 'mid' },
  { match: /Legnica/i, city: 'Legnica', pop: 95000, cat: 'mid' },
  { match: /Grudzi[ąa]dz/i, city: 'Grudziądz', pop: 90000, cat: 'mid' },
  { match: /Jaworzno/i, city: 'Jaworzno', pop: 89000, cat: 'mid' },
  { match: /S[łl]upsk/i, city: 'Słupsk', pop: 88000, cat: 'mid' },
  { match: /Jastrz[ęe]bie-Zdr[óo]j/i, city: 'Jastrzębie-Zdrój', pop: 86000, cat: 'mid' },
  { match: /Nowy S[ąa]cz/i, city: 'Nowy Sącz', pop: 83000, cat: 'mid' },
  { match: /Jelenia G[óo]ra/i, city: 'Jelenia Góra', pop: 78000, cat: 'mid' },
  { match: /Siedlce/i, city: 'Siedlce', pop: 77000, cat: 'mid' },
  { match: /Mys[łl]owice/i, city: 'Mysłowice', pop: 73000, cat: 'mid' },
  { match: /Konin/i, city: 'Konin', pop: 70000, cat: 'mid' },
  { match: /Pi[łl]a/i, city: 'Piła', pop: 72000, cat: 'mid' },
  { match: /Piotrk[óo]w/i, city: 'Piotrków Trybunalski', pop: 70000, cat: 'stronghold' },
  { match: /Inowroc[łl]aw/i, city: 'Inowrocław', pop: 70000, cat: 'mid' },
  { match: /Ostr[óo]w|Ostrovia/i, city: 'Ostrów Wielkopolski', pop: 71000, cat: 'stronghold' },
  { match: /Lubin|Zag[łl][ęe]bie/i, city: 'Lubin', pop: 70000, cat: 'stronghold' },
  { match: /G[łl]og[óo]w|Chrobry/i, city: 'Głogów', pop: 65000, cat: 'stronghold' },
  { match: /Mielec|Stal Mielec/i, city: 'Mielec', pop: 60000, cat: 'stronghold' },
  { match: /Pu[łl]awy|Azoty/i, city: 'Puławy', pop: 46000, cat: 'stronghold' },
  { match: /Legionowo/i, city: 'Legionowo', pop: 53000, cat: 'mid' },
  { match: /Kwidzyn|MMTS/i, city: 'Kwidzyn', pop: 38000, cat: 'stronghold' },
];

// ==================== AUSTRIA (12 Clubs) ====================
export const AUSTRIAN_CITY_RULES: CityRule[] = [
  { match: /Wien|Vienna|Fivers|Westwien/i, city: 'Vienna', pop: 1980000, cat: 'metro' },
  { match: /Graz/i, city: 'Graz', pop: 300000, cat: 'metro' },
  { match: /Linz/i, city: 'Linz', pop: 210000, cat: 'metro' },
  { match: /Salzburg/i, city: 'Salzburg', pop: 155000, cat: 'mid' },
  { match: /Innsbruck/i, city: 'Innsbruck', pop: 130000, cat: 'mid' },
  { match: /Bregenz/i, city: 'Bregenz', pop: 30000, cat: 'stronghold' },
  { match: /Krems/i, city: 'Krems', pop: 25000, cat: 'stronghold' },
  { match: /\bHard\b|Alpla/i, city: 'Hard', pop: 14000, cat: 'stronghold' },
  { match: /Schwaz|Tirol/i, city: 'Schwaz', pop: 14000, cat: 'mid' },
  { match: /Bruck|Pichler/i, city: 'Bruck an der Mur', pop: 15000, cat: 'town' },
  { match: /Ferlach/i, city: 'Ferlach', pop: 7200, cat: 'town' },
  { match: /B[äa]rnbach|K[öo]flach/i, city: 'Bärnbach', pop: 5700, cat: 'town' },
  { match: /V[öo]slau/i, city: 'Bad Vöslau', pop: 12000, cat: 'town' },
  { match: /Hollabrunn/i, city: 'Hollabrunn', pop: 12000, cat: 'town' },
];

// ==================== SWITZERLAND (10 Clubs) ====================
export const SWISS_CITY_RULES: CityRule[] = [
  { match: /Z[üu]rich|Amicitia/i, city: 'Zürich', pop: 425000, cat: 'metro' },
  { match: /Gen[èe]ve|Geneva|Ch[êe]nois/i, city: 'Geneva', pop: 205000, cat: 'metro' },
  { match: /Basel/i, city: 'Basel', pop: 175000, cat: 'metro' },
  { match: /Bern\b|BSV Bern/i, city: 'Bern', pop: 135000, cat: 'metro' },
  { match: /Winterthur|Pfadi/i, city: 'Winterthur', pop: 115000, cat: 'stronghold' },
  { match: /Luzern|Lucerne|Kriens/i, city: 'Luzern', pop: 83000, cat: 'stronghold' },
  { match: /St\. Gallen|Otmar/i, city: 'St. Gallen', pop: 76000, cat: 'stronghold' },
  { match: /Thun/i, city: 'Thun', pop: 44000, cat: 'stronghold' },
  { match: /Schaffhausen|Kadetten/i, city: 'Schaffhausen', pop: 37000, cat: 'stronghold' },
  { match: /Aarau|Suhr/i, city: 'Aarau', pop: 22000, cat: 'stronghold' },
];

// ==================== ROMANIA (Liga Națională) ====================
export const ROMANIAN_CITY_RULES: CityRule[] = [
  { match: /Bucure[sș]ti|Bucharest|Dinamo|Steaua|CSM Bucure[sș]ti/i, city: 'Bucharest', pop: 1830000, cat: 'metro' },
  { match: /Constan[tț]a/i, city: 'Constanța', pop: 260000, cat: 'metro' },
  { match: /Timi[sș]oara|Politehnica/i, city: 'Timișoara', pop: 250000, cat: 'metro' },
  { match: /Baia Mare|Minaur/i, city: 'Baia Mare', pop: 108000, cat: 'stronghold' },
  { match: /Turda|Potaissa/i, city: 'Turda', pop: 43000, cat: 'stronghold' },
  { match: /Suceava/i, city: 'Suceava', pop: 84000, cat: 'mid' },
  { match: /Buz[aă]u/i, city: 'Buzău', pop: 103000, cat: 'mid' },
  { match: /Foc[sș]ani/i, city: 'Focșani', pop: 66000, cat: 'mid' },
  { match: /Vaslui/i, city: 'Vaslui', pop: 53000, cat: 'mid' },
  { match: /Bac[aă]u/i, city: 'Bacău', pop: 136000, cat: 'mid' },
  { match: /Sighi[sș]oara/i, city: 'Sighișoara', pop: 23000, cat: 'town' },
];

// ==================== NORTH MACEDONIA (Super League) ====================
export const MACEDONIAN_CITY_RULES: CityRule[] = [
  { match: /Skopje|Vardar|Metalurg|Butel|Prolet|Alkaloid/i, city: 'Skopje', pop: 540000, cat: 'metro' },
  { match: /Bitola|Pelister|Eurofarm/i, city: 'Bitola', pop: 85000, cat: 'stronghold' },
  { match: /Ohrid/i, city: 'Ohrid', pop: 51000, cat: 'stronghold' },
  { match: /Struga/i, city: 'Struga', pop: 38000, cat: 'stronghold' },
  { match: /Kumanovo/i, city: 'Kumanovo', pop: 73000, cat: 'mid' },
  { match: /Prilep/i, city: 'Prilep', pop: 63000, cat: 'mid' },
  { match: /Tikve[sš]|Kavadarci/i, city: 'Kavadarci', pop: 38000, cat: 'mid' },
  { match: /Radovi[sš]/i, city: 'Radoviš', pop: 24000, cat: 'town' },
];

// ==================== SLOVENIA (Liga NLB) ====================
export const SLOVENIAN_CITY_RULES: CityRule[] = [
  { match: /Ljubljana|Slovan/i, city: 'Ljubljana', pop: 295000, cat: 'metro' },
  { match: /Celje|Pivovarna/i, city: 'Celje', pop: 49000, cat: 'stronghold' },
  { match: /Velenje|Gorenje/i, city: 'Velenje', pop: 33000, cat: 'stronghold' },
  { match: /Trebnje|Trimo/i, city: 'Trebnje', pop: 13000, cat: 'stronghold' },
  { match: /Ribnica|Riko/i, city: 'Ribnica', pop: 9500, cat: 'stronghold' },
  { match: /Novo Mesto|Krka/i, city: 'Novo Mesto', pop: 37000, cat: 'mid' },
  { match: /Koper/i, city: 'Koper', pop: 26000, cat: 'mid' },
  { match: /Maribor/i, city: 'Maribor', pop: 96000, cat: 'mid' },
  { match: /Ormo[zž]|Jeruzalem/i, city: 'Ormož', pop: 12000, cat: 'town' },
  { match: /Gradec|Slovenj Gradec/i, city: 'Slovenj Gradec', pop: 17000, cat: 'town' },
  { match: /Dobova/i, city: 'Dobova', pop: 5000, cat: 'town' },
  { match: /Ivan[cč]na Gorica|SVI[SŠ]/i, city: 'Ivančna Gorica', pop: 16000, cat: 'town' },
];

// ==================== ITALY (Serie A Gold) ====================
export const ITALIAN_CITY_RULES: CityRule[] = [
  { match: /Roma|Rome/i, city: 'Rome', pop: 2870000, cat: 'metro' },
  { match: /Milano|Milan/i, city: 'Milan', pop: 1370000, cat: 'metro' },
  { match: /Bologna/i, city: 'Bologna', pop: 390000, cat: 'metro' },
  { match: /Trieste/i, city: 'Trieste', pop: 200000, cat: 'stronghold' },
  { match: /Bolzano|Bozen/i, city: 'Bolzano', pop: 107000, cat: 'stronghold' },
  { match: /Brixen|Bressanone/i, city: 'Bressanone', pop: 23000, cat: 'stronghold' },
  { match: /Meran|Merano/i, city: 'Merano', pop: 41000, cat: 'stronghold' },
  { match: /Fasano|Junior Fasano/i, city: 'Fasano', pop: 39000, cat: 'stronghold' },
  { match: /Conversano/i, city: 'Conversano', pop: 26000, cat: 'stronghold' },
  { match: /Sassari|Raimond/i, city: 'Sassari', pop: 125000, cat: 'mid' },
  { match: /Cassano Magnago/i, city: 'Cassano Magnago', pop: 21000, cat: 'stronghold' },
  { match: /Siracusa|Albatro/i, city: 'Siracusa', pop: 118000, cat: 'mid' },
  { match: /Appiano|Eppan/i, city: 'Appiano sulla Strada del Vino', pop: 15000, cat: 'town' },
  { match: /Carpi/i, city: 'Carpi', pop: 72000, cat: 'mid' },
  { match: /Cologne\b/i, city: 'Cologne (Brescia)', pop: 7500, cat: 'town' },
  { match: /Pressano|Lavis/i, city: 'Lavis', pop: 9000, cat: 'town' },
];

// ==================== ENGLAND (Premier Handball League) ====================
export const ENGLISH_CITY_RULES: CityRule[] = [
  { match: /London|Olympia|GD London/i, city: 'London', pop: 8980000, cat: 'metro' },
  { match: /Manchester/i, city: 'Manchester', pop: 550000, cat: 'metro' },
  { match: /Birmingham/i, city: 'Birmingham', pop: 114000, cat: 'metro' },
  { match: /Nottingham/i, city: 'Nottingham', pop: 330000, cat: 'mid' },
  { match: /Newcastle/i, city: 'Newcastle', pop: 300000, cat: 'mid' },
  { match: /Brighton/i, city: 'Brighton', pop: 290000, cat: 'mid' },
  { match: /Cambridge/i, city: 'Cambridge', pop: 145000, cat: 'mid' },
  { match: /Coventry/i, city: 'Coventry', pop: 345000, cat: 'mid' },
  { match: /Liverpool/i, city: 'Liverpool', pop: 500000, cat: 'metro' },
  { match: /Warrington|Wolves/i, city: 'Warrington', pop: 210000, cat: 'town' },
];

// ==================== UNITED STATES & ECUADOR ====================
export const USA_CITY_RULES: CityRule[] = [
  { match: /New York|NYC/i, city: 'New York City', pop: 8330000, cat: 'metro' },
  { match: /Los Angeles|LA/i, city: 'Los Angeles', pop: 3820000, cat: 'metro' },
  { match: /Chicago/i, city: 'Chicago', pop: 2660000, cat: 'metro' },
  { match: /San Francisco|SF/i, city: 'San Francisco', pop: 808000, cat: 'metro' },
  { match: /Boston/i, city: 'Boston', pop: 650000, cat: 'metro' },
  { match: /Spokane/i, city: 'Spokane', pop: 230000, cat: 'mid' },
];

export const ECUADOR_CITY_RULES: CityRule[] = [
  { match: /Guayaquil/i, city: 'Guayaquil', pop: 2700000, cat: 'metro' },
  { match: /Quito/i, city: 'Quito', pop: 1980000, cat: 'metro' },
  { match: /Cuenca/i, city: 'Cuenca', pop: 640000, cat: 'mid' },
];

export const COUNTRY_RULES_MAP: Record<string, CityRule[]> = {
  DEN: DANISH_CITY_RULES,
  GER: GERMAN_CITY_RULES,
  FRA: FRENCH_CITY_RULES,
  ESP: SPANISH_CITY_RULES,
  SWE: SWEDISH_CITY_RULES,
  CRO: CROATIAN_CITY_RULES,
  POR: PORTUGUESE_CITY_RULES,
  NOR: NORWEGIAN_CITY_RULES,
  HUN: HUNGARIAN_CITY_RULES,
  ISL: ICELANDIC_CITY_RULES,
  POL: POLISH_CITY_RULES,
  AUT: AUSTRIAN_CITY_RULES,
  SUI: SWISS_CITY_RULES,
  ROU: ROMANIAN_CITY_RULES,
  MKD: MACEDONIAN_CITY_RULES,
  SLO: SLOVENIAN_CITY_RULES,
  ITA: ITALIAN_CITY_RULES,
  ENG: ENGLISH_CITY_RULES,
  USA: USA_CITY_RULES,
  ECU: ECUADOR_CITY_RULES,
};

// All rules combined for universal lookup
export const CITY_DEMOGRAPHIC_RULES: CityRule[] = [
  ...DANISH_CITY_RULES,
  ...GERMAN_CITY_RULES,
  ...FRENCH_CITY_RULES,
  ...SPANISH_CITY_RULES,
  ...SWEDISH_CITY_RULES,
  ...CROATIAN_CITY_RULES,
  ...PORTUGUESE_CITY_RULES,
  ...NORWEGIAN_CITY_RULES,
  ...HUNGARIAN_CITY_RULES,
  ...ICELANDIC_CITY_RULES,
  ...POLISH_CITY_RULES,
  ...AUSTRIAN_CITY_RULES,
  ...SWISS_CITY_RULES,
  ...ROMANIAN_CITY_RULES,
  ...MACEDONIAN_CITY_RULES,
  ...SLOVENIAN_CITY_RULES,
  ...ITALIAN_CITY_RULES,
  ...ENGLISH_CITY_RULES,
  ...USA_CITY_RULES,
  ...ECUADOR_CITY_RULES,
];

/**
 * Extracts authentic city demographic data for any European handball club.
 * Prioritizes country-scoped rule matching to prevent cross-border false positives,
 * tests club name first, and gracefully falls back to historic context or cleaned club name.
 */
export const extractClubCity = (
  clubName: string, 
  country: string = 'GER', 
  context?: string
): CityDemographic => {
  const name = clubName || '';
  const desc = context || '';
  const normCountry = normCountryCode(country);
  const countryRules = COUNTRY_RULES_MAP[normCountry] || [];

  // 1. Direct name match within the club's country (highest priority)
  for (const r of countryRules) {
    if (r.match.test(name)) {
      return { cityName: r.city, population: r.pop, category: r.cat };
    }
  }

  // 2. Context/historicContext match within the club's country
  if (desc) {
    for (const r of countryRules) {
      if (r.match.test(desc)) {
        return { cityName: r.city, population: r.pop, category: r.cat };
      }
    }
  }

  // 3. Fallback: match against all other countries by club name ONLY (never context)
  for (const r of CITY_DEMOGRAPHIC_RULES) {
    if (r.match.test(name)) {
      return { cityName: r.city, population: r.pop, category: r.cat };
    }
  }

  // 4. Default fallback cleaner for modded / custom clubs
  const defaultCity = name.replace(/^(HC|SG|THW|SC|TSV|VfL|TBV|Frisch Auf|HSG|HSV|TVB|ThSV|1\. VfL|TuS|HBW|ASV|HSC|HV|Die Eulen|TV|RK|BM|KIF|GOG|USAM|PAUC|MRK|HRK|GRK|IK|IFK|HK|HF|LUGI|BSV|GC|CS|RTV|ALPLA|UHK|BT|SL|CF|FC|AD|AC|GC|UHC)\s+/i, '').trim() || name;
  return { cityName: defaultCity, population: 75000, category: 'mid' };
};
