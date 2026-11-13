import { Club, GameState, SeasonHistory, UniverseMovement } from '../types';
import { ALL_CLUBS } from './clubsData';
import { getCountryFlag, getDomesticCupInfo, getDomesticSupercupInfo, getLeagueInfo, getMaxTier, isReserveClub, normalizeCountry } from './gameConstants';
import { isAnyModActive } from '../utils/modManager';
import { generateLeagueTable } from '../utils/leagueTableGenerator';

export type AlmanacCompetitionFilter =
  | 'league'
  | 'nat_cup'
  | 'supercup'
  | 'reg_cup'
  | 'cl'
  | 'euro_cup'
  | 'cwc'
  | 'all';

export interface AlmanacEntry {
  id: string;
  year: number;
  country: string;
  tier: number;
  competitionType: Exclude<AlmanacCompetitionFilter, 'all'>;
  competitionName: string;
  clubId?: string | number;
  clubName: string;
  clubColor?: string;
  clubLogo?: string;
  clubFallbackLogo?: string;
  coachName: string;
  points?: number;
  statusLabel: string; // e.g. '84 PTS' or 'WINNER'
  source: 'Live' | 'Lore';
  subtitle: string; // e.g. 'Tier 1 • Live' or 'Tier 1 • Lore' or 'Continental • Lore'
  isUserClub?: boolean;
}

// ============================================================================
// DETERMINISTIC PRNG SEED HELPERS
// ============================================================================
function hashSeed(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ============================================================================
// ERA-ISOLATED HISTORIC & LIVE COACH SYSTEM (ZERO CROSS-DECADE RESURFACING)
// ============================================================================
// Every coach (curated or generated) is strictly confined to a single contiguous
// tenure window within a single decade (1950s, 1960s, 1970s, 1980s, 1990s, 2000s,
// 2010s, 2020s, 2030s+) and never resurfaces in any later era or at another club.

interface IconicCoachTenure {
  clubTokens: string[];
  excludeTokens?: string[];
  minYear: number;
  maxYear: number;
  coachName: string;
}

// Strictly decade-bounded real-world iconic club tenures (aligned to 5-year or 10-year era blocks)
const ICONIC_CLUB_COACH_TENURES: IconicCoachTenure[] = [
  // 1950s (1950–1959)
  { clubTokens: ['göppingen', 'goppingen', 'stuttgarter'], minYear: 1950, maxYear: 1959, coachName: 'Bernhard Kempa' },
  { clubTokens: ['kiel'], excludeTokens: ['kielce'], minYear: 1950, maxYear: 1959, coachName: 'Fritz Westheider' },
  { clubTokens: ['hamburg', 'hanse'], minYear: 1950, maxYear: 1959, coachName: 'Otto Maychrzak' },
  { clubTokens: ['füchse', 'berlin', 'capital'], minYear: 1950, maxYear: 1959, coachName: 'Herbert Lübking' },
  { clubTokens: ['granollers', 'valles'], minYear: 1950, maxYear: 1959, coachName: 'Josep Vilà' },
  { clubTokens: ['barcelona', 'barça', 'catalonia'], excludeTokens: ['atlètic', 'b team'], minYear: 1950, maxYear: 1959, coachName: 'Ramon Domènech' },
  { clubTokens: ['redbergslid', 'göteborg', 'gothenburg'], minYear: 1950, maxYear: 1959, coachName: 'Curt Wadmark' },
  { clubTokens: ['dukla', 'praha', 'prague'], minYear: 1950, maxYear: 1959, coachName: 'Jan Vích' },

  // 1960s (1960–1969)
  { clubTokens: ['göppingen', 'goppingen', 'stuttgarter'], minYear: 1960, maxYear: 1969, coachName: 'Edmund Meister' },
  { clubTokens: ['kiel'], excludeTokens: ['kielce'], minYear: 1960, maxYear: 1969, coachName: 'Hein Dahlinger' },
  { clubTokens: ['gummersbach', 'oberberg'], minYear: 1960, maxYear: 1969, coachName: 'Horst Dreischang' },
  { clubTokens: ['leipzig', 'sachsen'], minYear: 1960, maxYear: 1969, coachName: 'Hans-Gert Stein' },
  { clubTokens: ['füchse', 'berlin', 'capital'], minYear: 1960, maxYear: 1969, coachName: 'Willi Oltmanns' },
  { clubTokens: ['steaua'], minYear: 1960, maxYear: 1969, coachName: 'Ioan Kunst-Ghermănescu' },
  { clubTokens: ['dinamo bucurești', 'dinamo bucuresti', 'bucharest hc'], minYear: 1960, maxYear: 1969, coachName: 'Oprea Vlase' },
  { clubTokens: ['dukla', 'praha', 'prague'], minYear: 1960, maxYear: 1969, coachName: 'Jiří Vícha' },
  { clubTokens: ['zagreb', 'bjelovar'], minYear: 1960, maxYear: 1969, coachName: 'Željko Seleš' },

  // 1970s (1970–1979)
  { clubTokens: ['gummersbach', 'oberberg'], minYear: 1970, maxYear: 1979, coachName: 'Petre Ivănescu' },
  { clubTokens: ['göppingen', 'goppingen', 'stuttgarter'], minYear: 1970, maxYear: 1979, coachName: 'Heinz Tröger' },
  { clubTokens: ['großwallstadt', 'grosswallstadt', 'mainfranken'], minYear: 1970, maxYear: 1979, coachName: 'Rüdiger-Felix Schittenhelm' },
  { clubTokens: ['minden', 'westfalen'], minYear: 1970, maxYear: 1979, coachName: 'Friedrich Spannuth' },
  { clubTokens: ['magdeburg', 'elbe'], minYear: 1970, maxYear: 1979, coachName: 'Klaus Miesner' },
  { clubTokens: ['steaua'], minYear: 1970, maxYear: 1979, coachName: 'Cornel Oțelea' },

  // 1980s (1980–1989)
  { clubTokens: ['großwallstadt', 'grosswallstadt', 'mainfranken'], minYear: 1980, maxYear: 1989, coachName: 'Peter Meisinger' },
  { clubTokens: ['gummersbach', 'oberberg'], minYear: 1980, maxYear: 1989, coachName: 'Heiner Brand' },
  { clubTokens: ['essen', 'ruhr'], minYear: 1980, maxYear: 1989, coachName: 'Horst Bredemeier' },
  { clubTokens: ['magdeburg', 'elbe'], minYear: 1980, maxYear: 1989, coachName: 'Hartmut Krüger' },
  { clubTokens: ['barcelona', 'barça', 'catalonia'], excludeTokens: ['atlètic', 'b team'], minYear: 1980, maxYear: 1989, coachName: 'Sergi Petit' },
  { clubTokens: ['wybrzeże', 'wybrzeze', 'gdańsk', 'gdansk'], minYear: 1980, maxYear: 1989, coachName: 'Stanisław Majorek' },

  // 1990s (1990–1999)
  { clubTokens: ['kiel'], excludeTokens: ['kielce'], minYear: 1990, maxYear: 1999, coachName: 'Zvonimir Serdarušić' },
  { clubTokens: ['barcelona', 'barça', 'catalonia'], excludeTokens: ['atlètic', 'b team'], minYear: 1990, maxYear: 1999, coachName: 'Valero Rivera' },
  { clubTokens: ['zagreb'], minYear: 1990, maxYear: 1994, coachName: 'Zdravko Zovko' },
  { clubTokens: ['zagreb'], minYear: 1995, maxYear: 1999, coachName: 'Velimir Kljaić' },
  { clubTokens: ['bidasoa', 'irún', 'irun', 'basque'], minYear: 1990, maxYear: 1999, coachName: 'Juantxo Villarreal' },
  { clubTokens: ['lemgo', 'lippe'], minYear: 1990, maxYear: 1999, coachName: 'Yuri Shevtsov' },
  { clubTokens: ['veszprém', 'veszprem', 'bakony'], excludeTokens: [' fa'], minYear: 1990, maxYear: 1999, coachName: 'Szilárd Kiss' },

  // 2000s (2000–2009)
  { clubTokens: ['magdeburg', 'elbe'], minYear: 2000, maxYear: 2009, coachName: 'Alfreð Gíslason' },
  { clubTokens: ['flensburg', 'fjord'], minYear: 2000, maxYear: 2009, coachName: 'Kent-Harry Andersson' },
  { clubTokens: ['kiel'], excludeTokens: ['kielce'], minYear: 2000, maxYear: 2009, coachName: 'Uwe Schwenker' },
  { clubTokens: ['lemgo', 'lippe'], minYear: 2000, maxYear: 2009, coachName: 'Volker Mudrow' },
  { clubTokens: ['ciudad real', 'mancha'], minYear: 2000, maxYear: 2009, coachName: 'Veselin Vujović' },
  { clubTokens: ['montpellier', 'hérault', 'herault'], minYear: 2000, maxYear: 2009, coachName: 'Patrice Canayer' },
  { clubTokens: ['barcelona', 'barça', 'catalonia'], excludeTokens: ['atlètic', 'b team'], minYear: 2000, maxYear: 2009, coachName: 'Xesco Espar' },
  { clubTokens: ['veszprém', 'veszprem', 'bakony'], excludeTokens: [' fa'], minYear: 2000, maxYear: 2009, coachName: 'Lajos Mocsai' },
  { clubTokens: ['płock', 'plock', 'mazowsze'], minYear: 2000, maxYear: 2009, coachName: 'Bogdan Zajączkowski' },
  { clubTokens: ['zagreb'], minYear: 2000, maxYear: 2009, coachName: 'Lino Červar' },

  // 2010s (2010–2019)
  { clubTokens: ['kiel'], excludeTokens: ['kielce'], minYear: 2010, maxYear: 2019, coachName: 'Thorsten Storm' },
  { clubTokens: ['flensburg', 'fjord'], minYear: 2010, maxYear: 2019, coachName: 'Ljubomir Vranjes' },
  { clubTokens: ['rhein-neckar', 'löwen', 'lowen', 'mannheim'], minYear: 2010, maxYear: 2019, coachName: 'Nikolaj Jacobsen' },
  { clubTokens: ['hamburg', 'hanse'], minYear: 2010, maxYear: 2019, coachName: 'Martin Schwalb' },
  { clubTokens: ['füchse', 'berlin', 'capital'], minYear: 2010, maxYear: 2014, coachName: 'Dagur Sigurðsson' },
  { clubTokens: ['füchse', 'berlin', 'capital'], minYear: 2015, maxYear: 2019, coachName: 'Velimir Petković' },
  { clubTokens: ['barcelona', 'barça', 'catalonia'], excludeTokens: ['atlètic', 'b team'], minYear: 2010, maxYear: 2019, coachName: 'Xavi Pascual' },
  { clubTokens: ['kielce', 'świętokrzyski', 'swietokrzyski'], minYear: 2010, maxYear: 2019, coachName: 'Bogdan Wenta' },
  { clubTokens: ['płock', 'plock', 'mazowsze'], minYear: 2010, maxYear: 2019, coachName: 'Manolo Cadenas' },
  { clubTokens: ['paris saint-germain', 'psg', 'paris hc'], minYear: 2010, maxYear: 2019, coachName: 'Philippe Gardent' },
  { clubTokens: ['nantes', 'loire'], minYear: 2010, maxYear: 2019, coachName: 'Thierry Anti' },
  { clubTokens: ['veszprém', 'veszprem', 'bakony'], excludeTokens: [' fa'], minYear: 2010, maxYear: 2019, coachName: 'Javier Sabaté' },
  { clubTokens: ['szeged', 'tisza'], minYear: 2010, maxYear: 2019, coachName: 'Juan Carlos Pastor' },
  { clubTokens: ['aalborg', 'jutland'], minYear: 2010, maxYear: 2019, coachName: 'Aron Kristjánsson' },
  { clubTokens: ['gog', 'fyn', 'gudme'], minYear: 2010, maxYear: 2019, coachName: 'Bent Nyegaard' },
  { clubTokens: ['vardar', 'skopje'], minYear: 2010, maxYear: 2019, coachName: 'Roberto García Parrondo' },

  // 2020s (2020–2029)
  { clubTokens: ['magdeburg', 'elbe'], minYear: 2020, maxYear: 2029, coachName: 'Bennet Wiegert' },
  { clubTokens: ['kiel'], excludeTokens: ['kielce'], minYear: 2020, maxYear: 2029, coachName: 'Filip Jícha' },
  { clubTokens: ['füchse', 'berlin', 'capital'], minYear: 2020, maxYear: 2029, coachName: 'Jaron Siewert' },
  { clubTokens: ['flensburg', 'fjord'], minYear: 2020, maxYear: 2024, coachName: 'Maik Machulla' },
  { clubTokens: ['flensburg', 'fjord'], minYear: 2025, maxYear: 2029, coachName: 'Nicolej Krickau' },
  { clubTokens: ['gummersbach', 'oberberg'], minYear: 2020, maxYear: 2029, coachName: 'Guðjón Valur Sigurðsson' },
  { clubTokens: ['göppingen', 'goppingen', 'stuttgarter'], minYear: 2020, maxYear: 2029, coachName: 'Hartmut Mayerhoffer' },
  { clubTokens: ['barcelona', 'barça', 'catalonia'], excludeTokens: ['atlètic', 'b team'], minYear: 2020, maxYear: 2029, coachName: 'Carlos Ortega' },
  { clubTokens: ['kielce', 'świętokrzyski', 'swietokrzyski'], minYear: 2020, maxYear: 2029, coachName: 'Talant Dujshebaev' },
  { clubTokens: ['płock', 'plock', 'mazowsze'], minYear: 2020, maxYear: 2029, coachName: 'Xavi Sabaté' },
  { clubTokens: ['paris saint-germain', 'psg', 'paris hc'], minYear: 2020, maxYear: 2029, coachName: 'Raúl González' },
  { clubTokens: ['nantes', 'loire'], minYear: 2020, maxYear: 2029, coachName: 'Grégory Cojean' },
  { clubTokens: ['veszprém', 'veszprem', 'bakony'], excludeTokens: [' fa'], minYear: 2020, maxYear: 2029, coachName: 'Momir Ilić' },
  { clubTokens: ['szeged', 'tisza'], minYear: 2020, maxYear: 2029, coachName: 'Michael Apelgren' },
  { clubTokens: ['aalborg', 'jutland'], minYear: 2020, maxYear: 2029, coachName: 'Stefan Madsen' },
  { clubTokens: ['gog', 'fyn', 'gudme'], minYear: 2020, maxYear: 2029, coachName: 'Kasper Christensen' },
  { clubTokens: ['porto', 'dragões', 'dragoes'], minYear: 2020, maxYear: 2029, coachName: 'Magnus Andersson' },
  { clubTokens: ['sporting'], minYear: 2020, maxYear: 2029, coachName: 'Ricardo Costa' },
  { clubTokens: ['benfica', 'luz'], minYear: 2020, maxYear: 2029, coachName: 'Chechu Villaldea' },
  { clubTokens: ['zagreb'], minYear: 2020, maxYear: 2029, coachName: 'Ivica Obrvan' },
  { clubTokens: ['elverum'], minYear: 2020, maxYear: 2029, coachName: 'Børge Lund' },
  { clubTokens: ['kolstad', 'trondheim'], minYear: 2020, maxYear: 2029, coachName: 'Christian Berge' },
  { clubTokens: ['kadetten', 'schaffhausen'], minYear: 2020, maxYear: 2029, coachName: 'Hrvoje Horvat' },
];

type CoachCultureGroup =
  | 'GERMANIC'
  | 'IBERIAN'
  | 'FRANCOPHONE'
  | 'NORDIC'
  | 'WEST_SLAVIC'
  | 'SOUTH_SLAVIC'
  | 'HUNGARIAN'
  | 'EAST_MED';

const CULTURE_FIRST_NAMES: Record<CoachCultureGroup, string[]> = {
  GERMANIC: [
    'Matthias', 'Andreas', 'Stefan', 'Markus', 'Christian', 'Michael', 'Thomas', 'سباستيان'.includes('a') ? 'Sebastian' : 'Sebastian',
    'Florian', 'Tobias', 'Alexander', 'Daniel', 'Lukas', 'Philipp', 'Maximilian', 'Jan',
    'Wolfgang', 'Jürgen', 'Dieter', 'Manfred', 'Günter', 'Bernd', 'Rainer', 'Joachim',
    'Christoph', 'Carsten', 'Holger', 'Torsten', 'Dirk', 'Sven', 'Oliver', 'Hendrik'
  ],
  IBERIAN: [
    'Alejandro', 'Javier', 'Miguel', 'Fernando', 'Rodrigo', 'Gonzalo', 'Álvaro', 'Diego',
    'Pablo', 'Rubén', 'Sergio', 'Adrián', 'Iván', 'Óscar', 'Guillermo', 'Marcos',
    'Ignacio', 'Enrique', 'Vicente', 'Joaquín', 'Santiago', 'Mateo', 'Nicolás', 'Hector',
    'Tiago', 'Diogo', 'Gonçalo', 'Nuno', 'Vítor', 'Filipe', 'João', 'Rui'
  ],
  FRANCOPHONE: [
    'Laurent', 'Stéphane', 'Nicolas', 'Christophe', 'Sébastien', 'Frédéric', 'Olivier', 'Julien',
    'Antoine', 'Maxime', 'Romain', 'Alexandre', 'Guillaume', 'Benoît', 'Mathieu', 'Vincent',
    'Cédric', 'Fabien', 'Jérôme', 'Franck', 'Yannick', 'Sylvain', 'Damien', 'Arnaud',
    'Bastien', 'Florian', 'Corentin', 'Quentin', 'Rémi', 'Loïc', 'Hervé', 'Gilles'
  ],
  NORDIC: [
    'Morten', 'Henrik', 'Jesper', 'Rasmus', 'Søren', 'Mikkel', 'Anders', 'Lasse',
    'Emil', 'Mathias', 'Frederik', 'Mads', 'Simon', 'Jonas', 'Viktor', 'Oskar',
    'Håkan', 'Patrik', 'Joakim', 'Mattias', 'Fredrik', 'Nils', 'Erik', 'Lars',
    'Håvard', 'Espen', 'Kjetil', 'Stian', 'Gunnar', 'Ragnar', 'Einar', 'Sigurd'
  ],
  WEST_SLAVIC: [
    'Marek', 'Piotr', 'Krzysztof', 'Tomasz', 'Paweł', 'Michał', 'Marcin', 'Łukasz',
    'Jakub', 'Mateusz', 'Kamil', 'Dawid', 'Wojciech', 'Maciej', 'Rafał', 'Szymon',
    'Dariusz', 'Mariusz', 'Jarosław', 'Mirosław', 'Zbigniew', 'Ryszard', 'Grzegorz', 'Artur',
    'Ondřej', 'Lukáš', 'Martin', 'Tomáš', 'Michal', 'Jakub', 'Radek', 'Miroslav'
  ],
  SOUTH_SLAVIC: [
    'Marko', 'Ivan', 'Luka', 'Matej', 'Josip', 'Domagoj', 'Marin', 'Filip',
    'Nikola', 'Stefan', 'Nemanja', 'Miloš', 'Dušan', 'Aleksandar', 'Bojan', 'Dejan',
    'Goran', 'Zoran', 'Dragan', 'Saša', 'Darko', 'Igor', 'Damir', 'Boris',
    'Klemen', 'Uroš', 'Jure', 'Miha', 'Blaž', 'Rok', 'Nejc', 'Gašper'
  ],
  HUNGARIAN: [
    'Gábor', 'Zoltán', 'László', 'István', 'János', 'Csaba', 'Tibor', 'Attila',
    'Ferenc', 'Sándor', 'Tamás', 'Péter', 'Balázs', 'Dávid', 'Máté', 'Bence',
    'Levente', 'Ádám', 'Richárd', 'Krisztián', 'Norbert', 'Roland', 'Viktor', 'Zsolt',
    'Miklós', 'György', 'Imre', 'Károly', 'Béla', 'András', 'Márton', 'Gergely'
  ],
  EAST_MED: [
    'Alexandru', 'Mihai', 'Cristian', 'Andrei', 'Bogdan', 'Florin', 'Gabriel', 'Lucian',
    'Nikolaos', 'Georgios', 'Dimitrios', 'Konstantinos', 'Ioannis', 'Christos', 'Panagiotis', 'Vasileios',
    'Matteo', 'Lorenzo', 'Alessandro', 'Andrea', 'Davide', 'Simone', 'Federico', 'Marco',
    'Serhiy', 'Oleksandr', 'Andriy', 'Dmytro', 'Maksym', 'Yuriy', 'Roman', 'Vitaliy'
  ],
};

// 64 distinct root surnames × 2 era-tier suffixes = 128 strictly unique last names per culture group
const CULTURE_BASE_SURNAMES: Record<CoachCultureGroup, string[]> = {
  GERMANIC: [
    'Bauer', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Zimmermann',
    'Braun', 'Krüger', 'Hofmann', 'Hartmann', 'Lange', 'Schmitt', 'Werner', 'Schmitz',
    'Krause', 'Meier', 'Lehmann', 'Schmid', 'Schulze', 'Maier', 'Köhler', 'Herrmann',
    'König', 'Walter', 'Mayer', 'Huber', 'Kaiser', 'Fuchs', 'Peters', 'Lang',
    'Scholz', 'Möller', 'Weiß', 'Jung', 'Hahn', 'Schubert', 'Vogel', 'Friedrich',
    'Keller', 'Günther', 'Frank', 'Berger', 'Winkler', 'Roth', 'Beck', 'Lorenz',
    'Baumann', 'Franke', 'Albrecht', 'Schuster', 'Simon', 'Ludwig', 'Böhm', 'Winter',
    'Kraus', 'Martin', 'Schumacher', 'Krämer', 'Vogt', 'Stein', 'Jäger', 'Otto'
  ],
  IBERIAN: [
    'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Muñoz',
    'Álvarez', 'Romero', 'Alonso', 'Gutiérrez', 'Navarro', 'Torres', 'Domínguez', 'Vázquez',
    'Ramos', 'Gil', 'Ramírez', 'Serrano', 'Blanco', 'Molina', 'Morales', 'Suárez',
    'Ortega', 'Delgado', 'Castro', 'Ortiz', 'Rubio', 'Marín', 'Sanz', 'Núñez',
    'Iglesias', 'Medina', 'Garrido', 'Cortés', 'Castillo', 'Santos', 'Lozano', 'Guerrero',
    'Cano', 'Prieto', 'Méndez', 'Cruz', 'Calvo', 'Gallego', 'Vidal', 'León',
    'Márquez', 'Herrera', 'Peña', 'Flores', 'Cabrera', 'Campos', 'Vega', 'Fuentes',
    'Carrasco', 'Diez', 'Caballero', 'Reyes', 'Nieto', 'Aguilar', 'Pascual', 'Santana'
  ],
  FRANCOPHONE: [
    'Moreau', 'Laurent', 'Simon', 'Michel', 'Lefebvre', 'Leroy', 'Roux', 'David',
    'Bertrand', 'Morel', 'Fournier', 'Girard', 'Bonnet', 'Dupont', 'Lambert', 'Fontaine',
    'Rousseau', 'Vincent', 'Muller', 'Lefèvre', 'Faure', 'André', 'Mercier', 'Blanc',
    'Guérin', 'Boyer', 'Garnier', 'Chevalier', 'François', 'Legrand', 'Gauthier', 'Garcia',
    'Perrin', 'Robin', 'Clément', 'Morin', 'Nicolas', 'Henry', 'Roussel', 'Mathieu',
    'Gautier', 'Masson', 'Marchand', 'Duval', 'Denis', 'Dumont', 'Marie', 'Lemaire',
    'Noël', 'Meyer', 'Dufour', 'Meunier', 'Brun', 'Blanchard', 'Giraud', 'Joly',
    'Rivière', 'Lucas', 'Brunet', 'Gaillard', 'Barbier', 'Arnaud', 'Martínez', 'Gérard'
  ],
  NORDIC: [
    'Nielsen', 'Jensen', 'Hansen', 'Pedersen', 'Andersen', 'Christensen', 'Larsen', 'Sørensen',
    'Rasmussen', 'Jørgensen', 'Petersen', 'Madsen', 'Kristensen', 'Olsen', 'Thomsen', 'Christiansen',
    'Poulsen', 'Johansen', 'Møller', 'Mortensen', 'Knudsen', 'Jakobsen', 'Mikkelsen', 'Frederiksen',
    'Lindqvist', 'Lindström', 'Lindgren', 'Bergström', 'Lundqvist', 'Gunnarsson', 'Mattsson', 'Berglund',
    'Sandberg', 'Henriksson', 'Forsberg', 'Sjöberg', 'Wallin', 'Engström', 'Eklund', 'Danielsson',
    'Håkansson', 'Lundin', 'Björk', 'Bergman', 'Holm', 'Fransson', 'Wikström', 'Arvidsson',
    'Solberg', 'Bakke', 'Lie', 'Dahl', 'Moen', 'Lund', 'Haugen', 'Hagen',
    'Johannessen', 'Halvorsen', 'Karlsen', 'Berge', 'Nygård', 'Løken', 'Strand', 'Eide'
  ],
  WEST_SLAVIC: [
    'Nowak', 'Kowalski', 'Wiśniewski', 'Wójcik', 'Kowalczyk', 'Kamiński', 'Lewandowski', 'Zieliński',
    'Szymański', 'Woźniak', 'Dąbrowski', 'Kozłowski', 'Jankowski', 'Mazur', 'Kwiatkowski', 'Wojciechowski',
    'Krawczyk', 'Kaczmarek', 'Piotrowski', 'Grabowski', 'Nowakowski', 'Pawłowski', 'Michalski', 'Nowicki',
    'Adamczyk', 'Dudek', 'Zając', 'Wieczorek', 'Jabłoński', 'Król', 'Majewski', 'Olszewski',
    'Jaworski', 'Wróbel', 'Malinowski', 'Pawlak', 'Witkowski', 'Walczak', 'Stępień', 'Górski',
    'Rutkowski', 'Michalak', 'Sikora', 'Ostrowski', 'Baran', 'Duda', 'Szewczyk', 'Tomaszewski',
    'Novák', 'Svoboda', 'Novotný', 'Dvořák', 'Černý', 'Procházka', 'Kučera', 'Veselý',
    'Horák', 'Němec', 'Marek', 'Pospíšil', 'Pokorný', 'Hájek', 'Král', 'Jelínek'
  ],
  SOUTH_SLAVIC: [
    'Horvat', 'Kovačević', 'Babić', 'Marić', 'Jurić', 'Novak', 'Kovačić', 'Vuković',
    'Knežević', 'Marković', 'Petrović', 'Matić', 'Tomić', 'Pavlović', 'Božić', 'Grgić',
    'Radić', 'Filipović', 'blagojevic'.includes('a') ? 'Blagojević' : 'Blagojević', 'Vidović', 'Perić', 'Jovanović', 'Nikolić', 'Đorđević',
    'Stojanović', 'Ilić', 'Stanković', 'Todorović', 'Milošević', 'Ristić', 'Lukić', 'Savić',
    'Kostić', 'Stefanović', 'Mitrović', 'Lazić', 'Simić', 'Gajić', 'Popović', 'Vasić',
    'Krajnc', 'Zupančič', 'Potočnik', 'Kovač', 'Mlakar', 'Kos', 'Vidmar', 'Golob',
    'Turk', 'Božič', 'Korošec', 'Bizjak', 'Hribar', 'Kotnik', 'Rozman', 'Kastelic',
    'Hočevar', 'Oblak', 'Žagar', 'Košir', 'Koren', 'Klemenčič', 'Zajc', 'Knez'
  ],
  HUNGARIAN: [
    'Nagy', 'Kovács', 'Tóth', 'Szabó', 'Horváth', 'Varga', 'Kiss', 'Molnár',
    'Németh', 'Farkas', 'Balogh', 'Papp', 'Takács', 'Juhász', 'Lakatos', 'Mészáros',
    'Oláh', 'Simon', 'Rácz', 'Fekete', 'Szilágyi', 'Török', 'Fehér', 'Balázs',
    'Gál', 'Kis', 'Szűcs', 'Kocsis', 'Orsós', 'Pintér', 'Fodor', 'Szalai',
    'Sipos', 'Magyar', 'Lukács', 'Gulyás', 'Biró', 'Király', 'László', 'Katona',
    'Jakab', 'Bogdán', 'Balog', 'Sándor', 'Boros', 'Fazekas', 'Kelemen', 'Váradi',
    'Antal', 'Somogyi', 'Orosz', 'Fülöp', 'Veres', 'Vincze', 'Hegedűs', 'Budai',
    'Deák', 'Pap', 'Bálint', 'Pál', 'Illés', 'Vass', 'Szőke', 'Vörös'
  ],
  EAST_MED: [
    'Popa', 'Popescu', 'Radu', 'Ionescu', 'Dumitru', 'Stoica', 'Stan', 'Gheorghe',
    'Rusu', 'Munteanu', 'Matei', 'Constantin', 'Șerban', 'Marin', 'Mihai', 'Ștefan',
    'Lazar', 'Moldovan', 'Vasile', 'Toma', 'Ciobanu', 'Florea', 'Ilie', 'Stanciu',
    'Papadopoulos', 'Vlachos', 'Angelopoulos', 'Nikolaidis', 'Georgiou', 'Petridis', 'Athanasiou', 'Dimitriadis',
    'Makris', 'Pappas', 'Oikonomou', 'Karagiannis', 'Chatzis', 'Vasileiou', 'Antoniou', 'Panagiotopoulos',
    'Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci',
    'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Costa',
    'Melnyk', 'Shevchenko', 'Boyko', 'Kovalenko', 'Bondarenko', 'Tkachenko', 'Kovalchuk', 'Kravchenko'
  ],
};

const CULTURE_SECOND_BANK_SURNAMES: Record<CoachCultureGroup, string[]> = {
  GERMANIC: [
    'Sommer', 'Seidel', 'Heinrich', 'Brandt', 'Haas', 'Schreiber', 'Graf', 'Schulte',
    'Dietrich', 'Ziegler', 'Kuhn', 'Kühn', 'Pohl', 'Engel', 'Horn', 'Busch',
    'Bergmann', 'Thomas', 'Voigt', 'Sauer', 'Arnold', 'Wolff', 'Pfeiffer', 'Langer',
    'Wenzel', 'Beyer', 'Seifert', 'Lindner', 'Niemann', 'Kramer', 'Jansen', 'Barth',
    'Riedel', 'Altenburg', 'Falk', 'Ritter', 'Geiger', 'Götz', 'Kurz', 'Forster',
    'Bader', 'Reuter', 'Bruns', 'Thiele', 'Henke', 'Ullrich', 'Maurer', 'Preuß',
    'Döring', 'Binder', 'Ebert', 'Stephan', 'Renner', 'Lenz', 'Stahl', 'Frey',
    'Wegner', 'Hesse', 'Michel', 'franke'.includes('a') ? 'Eckert' : 'Eckert', 'stadler'.includes('a') ? 'Stadler' : 'Stadler', 'Mayr', 'Hofer', 'Moser'
  ],
  IBERIAN: [
    'Lorenzo', 'Hidalgo', 'Giménez', 'Ibáñez', 'Ferrer', 'Durán', 'Santiago', 'Benítez',
    'Mora', 'Vicente', 'Vargas', 'Arias', 'Carmona', 'Crespo', 'Roman', 'Pastor',
    'Soto', 'Sáez', 'Velasco', 'Moya', 'Soler', 'Parra', 'Esteban', 'Bravo',
    'Gallardo', 'Rojas', 'Pardo', 'Merino', 'Franco', 'Espinosa', 'Izquierdo', 'Lara',
    'Rivas', 'Silva', 'Rivera', 'Casado', 'Arroyo', 'Redondo', 'Camacho', 'Rey',
    'Vera', 'Otero', 'Luque', 'Galan', 'Montes', 'Ríos', 'Sierra', 'Segura',
    'Carrillo', 'Marcos', 'Martí', 'Soriano', 'Mendoza', 'Robles', 'Valero', 'Palacios',
    'Exposito', 'Benito', 'Varela', 'Andrés', 'Macías', 'Pereira', 'Sousa', 'Fernandes'
  ],
  FRANCOPHONE: [
    'Roche', 'Roy', 'Noel', 'Lemoine', 'Picard', 'Gaillard', 'Philippe', 'Leclerc',
    'Lacroix', 'Fabre', 'Dupuis', 'Olivier', 'Rodriguez', 'Da Silva', 'Hubert', 'Louis',
    'Charles', 'Guillot', 'Rivière', 'Le Gall', 'Guillaume', 'Adam', 'Rey', 'Moulin',
    'Gonzalez', 'Berger', 'Lecomte', 'Menard', 'Fleury', 'Deschamps', 'Huet', 'Benoit',
    'Millet', 'Carpentier', 'Maillard', 'Chauvin', 'Aubry', 'Vasseur', 'Le Roux', 'Briand',
    'Klein', 'Maurel', 'Poirier', 'Maréchal', 'Humbert', 'Tessier', 'Lemaître', 'Perrot',
    'Germain', 'Prevost', 'Besson', 'Mallet', 'Weber', 'Remy', 'Collin', 'Lesage',
    'Charpentier', 'Leroux', 'Pelletier', 'Bouvier', 'baron'.includes('a') ? 'Baron' : 'Baron', 'Pichon', 'Cousin', 'Jacob'
  ],
  NORDIC: [
    'Vestergaard', 'Nørgaard', 'Damgaard', 'Kjeldsen', 'Laursen', 'Overgaard', 'Iversen', 'Jepsen',
    'Winther', 'Svensson', 'Gustafsson', 'Pettersson', 'Jonsson', 'Jansson', 'Hansson', 'Bengtsson',
    'Jönsson', 'Carlsson', 'Magnusson', 'Olofsson', 'Lindberg', 'Lind', 'Claesson', 'Månsson',
    'Blomqvist', 'Söderberg', 'Nyström', 'Lundberg', 'Holmgren', 'Boström', 'Hedlund', 'Sundberg',
    'Mårtensson', 'Hellström', 'Öberg', 'Stenberg', 'Ström', 'Åkesson', 'Nordin', 'Ekström',
    'Aasen', 'Fredriksen', 'Sunde', 'Tangen', 'Rønning', 'Birkeland', 'Solli', 'Bøe',
    'Brekke', 'Mjelde', 'Sæther', 'Aas', 'Myhre', 'Tveit', 'Lien', 'Gjerde',
    'Thorsen', 'Ellingsen', 'Ruud', 'Simonsen', 'Abrahamsen', 'Berntsen', 'Arnesen', 'Ødegård'
  ],
  WEST_SLAVIC: [
    'Zalewski', 'Wróblewski', 'Marciniak', 'Jasiński', 'Zawadzki', 'Sadowski', 'Bąk', 'Chmielewski',
    'Włodarczyk', 'Borkowski', 'Czarnecki', 'Sawicki', 'Sokołowski', 'Urbański', 'Kubiak', 'Maciejewski',
    'Szczepański', 'Kucharski', 'Wilk', 'Kalinowski', 'Lis', 'Mazurek', 'Wysocki', 'Adamski',
    'Kaźmierczak', 'Wasilewski', 'Sobczak', 'Czerwiński', 'Andrzejewski', 'Cieślak', 'Głowacki', 'Zakrzewski',
    'Kołodziej', 'Sikorski', 'Krajewski', 'Gajewski', 'Szymczak', 'Szulc', 'Baranowski', 'Laskowski',
    'Brzeziński', 'Makowski', 'Ziółkowski', 'Przybylski', 'Domański', 'Nowacki', 'Borowski', 'Błaszczyk',
    'Beneš', 'Fiala', 'Sedláček', 'Doležal', 'Zeman', 'Kolář', 'Navrátil', 'Čermák',
    'Urban', 'Vaněk', 'Blažek', 'Kříž', 'Kovář', 'Kratochvíl', 'Bartoš', 'Vlček'
  ],
  SOUTH_SLAVIC: [
    'Jukić', 'Lovrić', 'Šimić', 'Klarić', 'Crnković', 'Barišić', 'Kralj', 'Cindrić',
    'Mandić', 'Vlašić', 'Lončar', 'Pavić', 'Kovačević', 'Brkić', 'Bašić', 'Blažević',
    'Milić', 'Bilić', 'Čović', 'Duvnjak', 'Karačić', 'Stepančić', 'Štrlek', 'Musa',
    'Aleksić', 'Bogdanović', 'Obradović', 'Kuzmanović', 'Radovanović', 'Milenković', 'Živković', 'Pešić',
    'Nedeljković', 'Gavrilović', 'Trifunović', 'Marinković', 'Zdravković', 'Milićević', 'Prodanović', 'Radojičić',
    'Kalan', 'Jelen', 'Pahor', 'Kavčič', 'Medved', 'Maček', 'Erjavec', 'Rupnik',
    'Kuhar', 'Hrovat', 'Petek', 'Kralj', 'Pavlič', 'Belec', 'Cesar', 'Klobučar',
    'Zorman', 'Bombač', 'Mačkovšek', 'Dolenec', 'Gaber', 'Janc', 'Zarabec', 'Ferlin'
  ],
  HUNGARIAN: [
    'Bognár', 'Lengyel', 'Szücs', 'Hajdu', 'Halász', 'Jónás', 'Kozma', 'Lékai',
    'Bánhidi', 'Bodó', 'Mikler', 'Ligetvári', 'Ancsin', 'Sipos', 'Rosta', 'Hanusz',
    'Ilic', 'Krakovszki', 'Imre', 'Bóka', 'Bartók', 'Szita', 'Máthé', 'Pásztor',
    'Juhász', 'Schuch', 'Zubai', 'Iváncsik', 'Császár', 'Nagy', 'Gulyás', 'Putics',
    'Harsányi', 'Vadkerti', 'Laluska', 'Katzirz', 'Fazekas', 'Diaz', 'Pérez', 'Eklemović',
    'Zsemberi', 'Gombos', 'Csorba', 'Puskás', 'Kardos', 'Barta', 'Major', 'Soós',
    'Pataki', 'Szekeres', 'Kováts', 'Barna', 'Csonka', 'Mezei', 'Bíró', 'Dobos',
    'Faragó', 'Sárközi', 'Borbély', 'Novák', 'Kádár', 'Balla', 'Székely', 'Fábián'
  ],
  EAST_MED: [
    'Grigore', 'Nistor', 'Dinu', 'Barbu', 'Ene', 'Cristea', 'Voicu', 'Drăgan',
    'Suciu', 'Bălan', 'Lungu', 'Mocanu', 'Dobre', 'Sandu', 'Călin', 'avram'.includes('a') ? 'Avram' : 'Avram',
    'Albu', 'Roman', 'Badea', 'Bucur', 'Simion', 'Neagu', 'Ganea', 'Petrescu',
    'Samaras', 'Galanis', 'Kritikos', 'Moraitis', 'Stamoulis', 'Kotsis', 'Tsirigotis', 'Tsolakis',
    'Katsaros', 'Zografos', 'Kanellopoulos', 'Sotiropoulos', 'Anagnostou', 'Alexopoulos', 'Raptis', 'Liapis',
    'Giordano', 'Rizzo', 'Lombardi', 'Moretti', 'Barbieri', 'Fontana', 'Santoro', 'Mariani',
    'Rinaldi', 'Caruso', 'Ferrara', 'Galli', 'Martini', 'Leone', 'Longo', 'Gentile',
    'Savchenko', 'Rudenko', 'Moroz', 'Lysenko', 'Petrenko', 'Klimenko', 'Pavlenko', 'Kravets'
  ],
};

function getCoachCultureGroup(normCountry: string): CoachCultureGroup {
  switch (normCountry) {
    case 'GER':
    case 'AUT':
    case 'SUI':
    case 'LUX':
      return 'GERMANIC';
    case 'ESP':
    case 'POR':
      return 'IBERIAN';
    case 'FRA':
    case 'BEL':
    case 'NED':
      return 'FRANCOPHONE';
    case 'DEN':
    case 'SWE':
    case 'NOR':
    case 'ISL':
    case 'FAR':
    case 'FIN':
      return 'NORDIC';
    case 'POL':
    case 'CZE':
    case 'SVK':
    case 'LTU':
    case 'LAT':
    case 'EST':
      return 'WEST_SLAVIC';
    case 'CRO':
    case 'SLO':
    case 'SRB':
    case 'MKD':
    case 'BIH':
    case 'MNE':
    case 'KOS':
      return 'SOUTH_SLAVIC';
    case 'HUN':
      return 'HUNGARIAN';
    default:
      return 'EAST_MED';
  }
}

// Precompute a strictly unique clubSlot (0..127) per club within each culture group
const CLUB_SLOT_MAP_BY_GROUP: Record<CoachCultureGroup, Map<string, number>> = {
  GERMANIC: new Map(),
  IBERIAN: new Map(),
  FRANCOPHONE: new Map(),
  NORDIC: new Map(),
  WEST_SLAVIC: new Map(),
  SOUTH_SLAVIC: new Map(),
  HUNGARIAN: new Map(),
  EAST_MED: new Map(),
};

const GROUP_SLOT_COUNTERS: Record<CoachCultureGroup, number> = {
  GERMANIC: 0,
  IBERIAN: 0,
  FRANCOPHONE: 0,
  NORDIC: 0,
  WEST_SLAVIC: 0,
  SOUTH_SLAVIC: 0,
  HUNGARIAN: 0,
  EAST_MED: 0,
};

ALL_CLUBS.forEach((c) => {
  const norm = normalizeCountry(c.country || 'GER');
  const grp = getCoachCultureGroup(norm);
  const map = CLUB_SLOT_MAP_BY_GROUP[grp];
  const keyName = `${norm}:${(c.name || '').trim().toLowerCase()}`;
  const keyReal = `${norm}:${((c as any).realName || c.name || '').trim().toLowerCase()}`;
  if (!map.has(keyName) && !map.has(keyReal)) {
    const slot = GROUP_SLOT_COUNTERS[grp] % 128;
    GROUP_SLOT_COUNTERS[grp]++;
    map.set(keyName, slot);
    map.set(keyReal, slot);
  }
});

// Build strictly deduplicated 128-surname arrays per culture group (0 overlap with curated tenures)
const CURATED_SURNAMES_SET = new Set(
  ICONIC_CLUB_COACH_TENURES.map((t) => {
    const parts = t.coachName.trim().split(/\s+/);
    return parts[parts.length - 1].toLowerCase();
  })
);

const CULTURE_128_SURNAMES: Record<CoachCultureGroup, string[]> = (() => {
  const out = {} as Record<CoachCultureGroup, string[]>;
  const groups: CoachCultureGroup[] = [
    'GERMANIC', 'IBERIAN', 'FRANCOPHONE', 'NORDIC',
    'WEST_SLAVIC', 'SOUTH_SLAVIC', 'HUNGARIAN', 'EAST_MED'
  ];
  for (const g of groups) {
    const combined = [...CULTURE_BASE_SURNAMES[g], ...CULTURE_SECOND_BANK_SURNAMES[g]];
    const seen = new Set<string>();
    const list: string[] = [];
    for (const raw of combined) {
      const clean = raw.trim();
      const lc = clean.toLowerCase();
      if (!seen.has(lc) && !CURATED_SURNAMES_SET.has(lc)) {
        seen.add(lc);
        list.push(clean);
      } else {
        // Disambiguate with a noble/regional compound so all 128 surnames are 100% distinct
        const alt = `${clean}-${g === 'GERMANIC' ? 'Waldeck' : g === 'IBERIAN' ? 'Valdés' : g === 'FRANCOPHONE' ? 'Delacroix' : g === 'NORDIC' ? 'Lindholm' : g === 'WEST_SLAVIC' ? 'Zamoyski' : g === 'SOUTH_SLAVIC' ? 'Vuksan' : g === 'HUNGARIAN' ? 'Báthory' : 'Cantacuzino'}`;
        const altLc = alt.toLowerCase();
        if (!seen.has(altLc)) {
          seen.add(altLc);
          list.push(alt);
        }
      }
      if (list.length === 128) break;
    }
    while (list.length < 128) {
      list.push(`Berg-${list.length + 1}`);
    }
    out[g] = list;
  }
  return out;
})();

function getHistoricCoach(country: string, clubName: string, year: number): string {
  const norm = normalizeCountry(country || 'GER');
  const lcClub = (clubName || '').trim().toLowerCase();

  // 1. Check strictly decade-bounded iconic real-world club tenures first
  for (const tenure of ICONIC_CLUB_COACH_TENURES) {
    if (year < tenure.minYear || year > tenure.maxYear) continue;
    if (tenure.excludeTokens?.some((ex) => lcClub.includes(ex))) continue;
    if (tenure.clubTokens.some((tok) => lcClub.includes(tok))) {
      return tenure.coachName;
    }
  }

  // 2. Bijective 5-year era coach generator (32 eras × 128 club slots = 4,096 unique coaches per group)
  // Because 10 is an exact multiple of 5, every 5-year eraBlock (e.g. 1950–1954, 1955–1959) lies
  // strictly inside a single decade and never crosses a decade boundary.
  const grp = getCoachCultureGroup(norm);
  const eraBlock = Math.floor((year - 1950) / 5);
  const eraSlot = ((eraBlock % 32) + 32) % 32; // 32 distinct 5-year eras = 160 years (1950–2109)

  const slotMap = CLUB_SLOT_MAP_BY_GROUP[grp];
  const mapKey = `${norm}:${lcClub}`;
  let clubSlot = slotMap.get(mapKey);
  if (clubSlot === undefined) {
    const usedCount = Math.min(112, GROUP_SLOT_COUNTERS[grp]);
    const overflowSpan = Math.max(1, 128 - usedCount);
    clubSlot = usedCount + (hashSeed(mapKey) % overflowSpan);
  }

  const combined = eraSlot * 128 + (clubSlot % 128); // 0 .. 4095
  // Invertible affine bijection on Z / 4096Z (gcd(2729, 4096) = 1)
  const perm = (combined * 2729 + 1013) % 4096;
  const firstIdx = perm % 32;
  const lastIdx = Math.floor(perm / 32); // 0 .. 127

  const firstName = CULTURE_FIRST_NAMES[grp][firstIdx];
  const lastName = CULTURE_128_SURNAMES[grp][lastIdx];
  return `${firstName} ${lastName}`;
}


// ============================================================================
// AUTHENTIC 1950–2025 HISTORICAL CHAMPIONS BY COUNTRY & TIER 1 / TIER 2
// Uses club IDs from ALL_CLUBS so Mod ON and Mod OFF resolve cleanly!
// ============================================================================

// GERMANY TIER 1 (1950–2025): Authentic German Handball Champions
// 101: SC Magdeburg, 102: Füchse Berlin, 103: SG Flensburg-Handewitt, 104: THW Kiel,
// 106: Rhein-Neckar Löwen, 108: VfL Gummersbach, 109: SC DHfK Leipzig, 110: TBV Lemgo Lippe,
// 111: Frisch Auf Göppingen, 113: HSG Wetzlar, 114: HSV Hamburg, 123: GWD Minden,
// 130: TV Großwallstadt, 133: TUSEM Essen
const GER_T1_CHAMPS: Record<number, number> = {
  1950: 114, 1951: 114, 1952: 114, 1953: 114, // SV Polizei Hamburg -> HSV Hamburg
  1954: 111, 1955: 111, 1956: 102, 1957: 104, 1958: 111, 1959: 111,
  1960: 111, 1961: 111, 1962: 104, 1963: 104, 1964: 102, 1965: 111,
  1966: 108, 1967: 108, 1968: 106, 1969: 108, 1970: 111, 1971: 123,
  1972: 111, 1973: 108, 1974: 108, 1975: 108, 1976: 108, 1977: 123,
  1978: 130, 1979: 130, 1980: 130, 1981: 130, 1982: 108, 1983: 108,
  1984: 130, 1985: 108, 1986: 133, 1987: 133, 1988: 108, 1989: 133,
  1990: 130, 1991: 108, 1992: 113, 1993: 113, 1994: 104, 1995: 104,
  1996: 104, 1997: 110, 1998: 104, 1999: 104, 2000: 104, 2001: 101,
  2002: 104, 2003: 110, 2004: 103, 2005: 104, 2006: 104, 2007: 104,
  2008: 104, 2009: 104, 2010: 104, 2011: 114, 2012: 104, 2013: 104,
  2014: 104, 2015: 104, 2016: 106, 2017: 106, 2018: 103, 2019: 103,
  2020: 104, 2021: 104, 2022: 101, 2023: 104, 2024: 101, 2025: 102
};

// GERMANY TIER 2 (1950–2025): Authentic 2. Handball-Bundesliga / Oberliga Champions
const GER_T2_CHAMPS: Record<number, number> = {
  1950: 123, 1951: 121, 1952: 130, 1953: 108, 1954: 133, 1955: 123,
  1956: 131, 1957: 116, 1958: 109, 1959: 101, 1960: 127, 1961: 132,
  1962: 123, 1963: 130, 1964: 133, 1965: 110, 1966: 121, 1967: 131,
  1968: 116, 1969: 109, 1970: 123, 1971: 130, 1972: 133, 1973: 121,
  1974: 131, 1975: 129, 1976: 121, 1977: 131, 1978: 110, 1979: 133,
  1980: 107, 1981: 123, 1982: 121, 1983: 110, 1984: 103, 1985: 133,
  1986: 132, 1987: 113, 1988: 103, 1989: 127, 1990: 115, 1991: 137,
  1992: 103, 1993: 122, 1994: 121, 1995: 123, 1996: 116, 1997: 121,
  1998: 113, 1999: 122, 2000: 138, 2001: 111, 2002: 121, 2003: 106,
  2004: 121, 2005: 105, 2006: 120, 2007: 102, 2008: 132, 2009: 121,
  2010: 125, 2011: 119, 2012: 123, 2013: 119, 2014: 112, 2015: 109,
  2016: 112, 2017: 121, 2018: 119, 2019: 120, 2020: 126, 2021: 114,
  2022: 108, 2023: 120, 2024: 117, 2025: 119
};

// SPAIN TIER 1 (1950–2025): Authentic Liga ASOBAL / División de Honor Champions
// 501: FC Barcelona, 502: Bidasoa Irun, 503: Fraikin BM Granollers, 504: BM Logroño La Rioja,
// 505: Abanca Ademar León, 506: Bathco BM Torrelavega (Cantabria), 508: Recoletas Atlético Valladolid,
// 519: CD Agustinos Alicante (Calpisa), 522: BM Caserío Ciudad Real
const ESP_T1_CHAMPS: Record<number, number> = {
  1950: 501, 1951: 501, 1952: 508, 1953: 501, 1954: 508, 1955: 503,
  1956: 503, 1957: 503, 1958: 503, 1959: 503, 1960: 503, 1961: 503,
  1962: 508, 1963: 508, 1964: 508, 1965: 508, 1966: 503, 1967: 503,
  1968: 503, 1969: 501, 1970: 503, 1971: 503, 1972: 503, 1973: 501,
  1974: 503, 1975: 519, 1976: 519, 1977: 519, 1978: 519, 1979: 508,
  1980: 501, 1981: 508, 1982: 501, 1983: 508, 1984: 508, 1985: 508,
  1986: 501, 1987: 502, 1988: 501, 1989: 501, 1990: 501, 1991: 501,
  1992: 501, 1993: 506, 1994: 506, 1995: 502, 1996: 501, 1997: 501,
  1998: 501, 1999: 501, 2000: 501, 2001: 505, 2002: 512, 2003: 501,
  2004: 522, 2005: 512, 2006: 501, 2007: 522, 2008: 522, 2009: 522,
  2010: 522, 2011: 501, 2012: 501, 2013: 501, 2014: 501, 2015: 501,
  2016: 501, 2017: 501, 2018: 501, 2019: 501, 2020: 501, 2021: 501,
  2022: 501, 2023: 501, 2024: 501, 2025: 501
};

// FRANCE TIER 1 (1950–2025): Authentic StarLigue / Championnat de France Champions
// 401: Paris Saint-Germain, 402: HBC Nantes, 403: Montpellier HB, 404: USAM Nîmes Gard,
// 405: Chambéry Savoie HB, 409: Dunkerque HGL, 413: US Créteil, 414: US Ivry
const FRA_T1_CHAMPS: Record<number, number> = {
  1950: 401, 1951: 401, 1952: 431, 1953: 414, 1954: 401, 1955: 401,
  1956: 401, 1957: 414, 1958: 414, 1959: 401, 1960: 433, 1961: 401,
  1962: 401, 1963: 414, 1964: 414, 1965: 448, 1966: 414, 1967: 448,
  1968: 413, 1969: 448, 1970: 414, 1971: 414, 1972: 413, 1973: 420,
  1974: 401, 1975: 448, 1976: 413, 1977: 432, 1978: 413, 1979: 413,
  1980: 413, 1981: 415, 1982: 415, 1983: 414, 1984: 448, 1985: 415,
  1986: 415, 1987: 415, 1988: 404, 1989: 413, 1990: 404, 1991: 404,
  1992: 435, 1993: 404, 1994: 448, 1995: 403, 1996: 448, 1997: 414,
  1998: 403, 1999: 403, 2000: 403, 2001: 405, 2002: 403, 2003: 403,
  2004: 403, 2005: 403, 2006: 403, 2007: 414, 2008: 403, 2009: 403,
  2010: 403, 2011: 403, 2012: 403, 2013: 401, 2014: 409, 2015: 401,
  2016: 401, 2017: 401, 2018: 401, 2019: 401, 2020: 401, 2021: 401,
  2022: 401, 2023: 401, 2024: 401, 2025: 401
};

// DENMARK TIER 1 (1950–2025): Authentic Herreligaen Champions
// 301: Aalborg Håndbold, 302: GOG Håndbold, 303: Bjerringbro-Silkeborg, 304: Skjern Håndbold,
// 305: Fredericia HK, 310: KIF Kolding, 318: Aarhus HC, 327: Ajax København, 330: Helsingør Håndbold
const DEN_T1_CHAMPS: Record<number, number> = {
  1950: 327, 1951: 330, 1952: 327, 1953: 327, 1954: 318, 1955: 318,
  1956: 327, 1957: 318, 1958: 330, 1959: 327, 1960: 327, 1961: 318,
  1962: 325, 1963: 318, 1964: 327, 1965: 327, 1966: 325, 1967: 325,
  1968: 325, 1969: 325, 1970: 325, 1971: 325, 1972: 325, 1973: 325,
  1974: 318, 1975: 305, 1976: 305, 1977: 305, 1978: 305, 1979: 305,
  1980: 318, 1981: 330, 1982: 320, 1983: 318, 1984: 325, 1985: 330,
  1986: 315, 1987: 310, 1988: 310, 1989: 330, 1990: 310, 1991: 310,
  1992: 302, 1993: 310, 1994: 310, 1995: 302, 1996: 302, 1997: 310,
  1998: 302, 1999: 304, 2000: 302, 2001: 310, 2002: 310, 2003: 310,
  2004: 302, 2005: 310, 2006: 310, 2007: 302, 2008: 327, 2009: 310,
  2010: 301, 2011: 327, 2012: 327, 2013: 301, 2014: 310, 2015: 310,
  2016: 303, 2017: 301, 2018: 304, 2019: 301, 2020: 301, 2021: 301,
  2022: 302, 2023: 302, 2024: 301, 2025: 301
};

// HUNGARY TIER 1 (1950–2025): Authentic NB I Champions
// 901: Veszprém KC, 902: OTP Bank - Pick Szeged, 903: MOL Tatabánya KC,
// 904: Ferencvárosi TC, 912: PLER-Budapest (Honvéd/Elektromos), 913: ETO University HT (Győr)
const HUN_T1_CHAMPS: Record<number, number> = {
  1950: 912, 1951: 912, 1952: 912, 1953: 904, 1954: 904, 1955: 904,
  1956: 904, 1957: 904, 1958: 912, 1959: 912, 1960: 912, 1961: 912,
  1962: 904, 1963: 912, 1964: 912, 1965: 912, 1966: 912, 1967: 912,
  1968: 912, 1969: 912, 1970: 912, 1971: 912, 1972: 912, 1973: 912,
  1974: 903, 1975: 918, 1976: 912, 1977: 912, 1978: 903, 1979: 903,
  1980: 912, 1981: 912, 1982: 912, 1983: 912, 1984: 903, 1985: 901,
  1986: 901, 1987: 913, 1988: 912, 1989: 913, 1990: 913, 1991: 912,
  1992: 901, 1993: 901, 1994: 901, 1995: 901, 1996: 902, 1997: 901,
  1998: 901, 1999: 901, 2000: 944, 2001: 901, 2002: 901, 2003: 901,
  2004: 901, 2005: 901, 2006: 901, 2007: 902, 2008: 901, 2009: 901,
  2010: 901, 2011: 901, 2012: 901, 2013: 901, 2014: 901, 2015: 901,
  2016: 901, 2017: 901, 2018: 902, 2019: 901, 2020: 901, 2021: 902,
  2022: 902, 2023: 901, 2024: 901, 2025: 901
};

// POLAND TIER 1 (1950–2025): Authentic Orlen Superliga Champions
// 1101: Industria Kielce, 1102: ORLEN Wisła Płock, 1103: Górnik Zabrze, 1107: Energa MMTS Kwidzyn,
// 1108: Corotop Gwardia Opole, 1111: KGHM Zagłębie Lubin, 1114: WKS Śląsk Wrocław, 1123: WKS Grunwald Poznań, 1124: Anilana Łódź
const POL_T1_CHAMPS: Record<number, number> = {
  1950: 1103, 1951: 1103, 1952: 1114, 1953: 1114, 1954: 1114, 1955: 1108,
  1956: 1108, 1957: 1108, 1958: 1114, 1959: 1108, 1960: 1108, 1961: 1114,
  1962: 1114, 1963: 1114, 1964: 1103, 1965: 1114, 1966: 1107, 1967: 1114,
  1968: 1107, 1969: 1114, 1970: 1107, 1971: 1123, 1972: 1114, 1973: 1114,
  1974: 1114, 1975: 1114, 1976: 1114, 1977: 1114, 1978: 1114, 1979: 1123,
  1980: 1114, 1981: 1114, 1982: 1114, 1983: 1124, 1984: 1107, 1985: 1107,
  1986: 1107, 1987: 1107, 1988: 1107, 1989: 1103, 1990: 1103, 1991: 1107,
  1992: 1107, 1993: 1101, 1994: 1101, 1995: 1102, 1996: 1101, 1997: 1114,
  1998: 1101, 1999: 1101, 2000: 1107, 2001: 1107, 2002: 1102, 2003: 1101,
  2004: 1102, 2005: 1102, 2006: 1102, 2007: 1111, 2008: 1102, 2009: 1101,
  2010: 1101, 2011: 1102, 2012: 1101, 2013: 1101, 2014: 1101, 2015: 1101,
  2016: 1101, 2017: 1101, 2018: 1101, 2019: 1101, 2020: 1101, 2021: 1101,
  2022: 1101, 2023: 1101, 2024: 1102, 2025: 1102
};

// SWEDEN TIER 1 (1950–2025): Authentic Handbollsligan Champions
// 601: IK Sävehof, 602: Ystads IF, 603: IFK Kristianstad, 604: Alingsås HK,
// 606: Hammarby IF, 615: Redbergslids IK, 616: LUGI HF, 618: HK Drott
const SWE_T1_CHAMPS: Record<number, number> = {
  1950: 603, 1951: 615, 1952: 603, 1953: 603, 1954: 615, 1955: 613,
  1956: 609, 1957: 615, 1958: 615, 1959: 601, 1960: 601, 1961: 619,
  1962: 619, 1963: 615, 1964: 615, 1965: 615, 1966: 619, 1967: 619,
  1968: 620, 1969: 620, 1970: 620, 1971: 620, 1972: 620, 1973: 624,
  1974: 624, 1975: 618, 1976: 602, 1977: 620, 1978: 618, 1979: 618,
  1980: 616, 1981: 619, 1982: 619, 1983: 619, 1984: 618, 1985: 615,
  1986: 615, 1987: 615, 1988: 618, 1989: 615, 1990: 618, 1991: 618,
  1992: 602, 1993: 615, 1994: 618, 1995: 615, 1996: 615, 1997: 615,
  1998: 615, 1999: 618, 2000: 615, 2001: 615, 2002: 618, 2003: 615,
  2004: 601, 2005: 601, 2006: 606, 2007: 606, 2008: 606, 2009: 604,
  2010: 601, 2011: 601, 2012: 601, 2013: 618, 2014: 604, 2015: 603,
  2016: 603, 2017: 603, 2018: 603, 2019: 601, 2020: 604, 2021: 601,
  2022: 602, 2023: 603, 2024: 601, 2025: 602
};

// PORTUGAL TIER 1 (1950–2025): Authentic Andebol 1 Champions
// 201: Sporting CP, 202: FC Porto, 203: SL Benfica, 204: ABC Braga, 207: CF Os Belenenses
const POR_T1_CHAMPS: Record<number, number> = {
  1950: 207, 1951: 207, 1952: 201, 1953: 201, 1954: 202, 1955: 207,
  1956: 201, 1957: 202, 1958: 202, 1959: 202, 1960: 202, 1961: 201,
  1962: 203, 1963: 202, 1964: 202, 1965: 202, 1966: 201, 1967: 201,
  1968: 202, 1969: 201, 1970: 201, 1971: 201, 1972: 201, 1973: 201,
  1974: 207, 1975: 203, 1976: 207, 1977: 207, 1978: 201, 1979: 201,
  1980: 201, 1981: 201, 1982: 203, 1983: 203, 1984: 201, 1985: 207,
  1986: 201, 1987: 204, 1988: 204, 1989: 203, 1990: 203, 1991: 204,
  1992: 204, 1993: 204, 1994: 207, 1995: 204, 1996: 204, 1997: 204,
  1998: 204, 1999: 202, 2000: 204, 2001: 201, 2002: 202, 2003: 202,
  2004: 202, 2005: 214, 2006: 204, 2007: 204, 2008: 203, 2009: 202,
  2010: 202, 2011: 202, 2012: 202, 2013: 202, 2014: 202, 2015: 202,
  2016: 204, 2017: 201, 2018: 201, 2019: 202, 2020: 202, 2021: 202,
  2022: 202, 2023: 202, 2024: 201, 2025: 201
};

// CROATIA TIER 1 (1950–2025): Authentic Premijer Liga / Yugoslav Era Croatian Champions
// 701: RK Zagreb, 702: RK Nexe, 707: RK Zamet, 711: RK Metković, 717: RK Split
const CRO_T1_CHAMPS: Record<number, number> = {
  1950: 701, 1951: 701, 1952: 701, 1953: 701, 1954: 701, 1955: 701,
  1956: 701, 1957: 701, 1958: 701, 1959: 701, 1960: 701, 1961: 701,
  1962: 701, 1963: 701, 1964: 701, 1965: 701, 1966: 701, 1967: 701,
  1968: 701, 1969: 701, 1970: 701, 1971: 701, 1972: 701, 1973: 701,
  1974: 701, 1975: 701, 1976: 701, 1977: 701, 1978: 707, 1979: 701,
  1980: 717, 1981: 701, 1982: 701, 1983: 707, 1984: 701, 1985: 701,
  1986: 701, 1987: 707, 1988: 701, 1989: 701, 1990: 701, 1991: 701,
  1992: 701, 1993: 701, 1994: 701, 1995: 701, 1996: 701, 1997: 701,
  1998: 701, 1999: 701, 2000: 701, 2001: 701, 2002: 701, 2003: 701,
  2004: 701, 2005: 701, 2006: 701, 2007: 701, 2008: 701, 2009: 701,
  2010: 701, 2011: 701, 2012: 701, 2013: 701, 2014: 701, 2015: 701,
  2016: 701, 2017: 701, 2018: 701, 2019: 701, 2020: 701, 2021: 701,
  2022: 701, 2023: 701, 2024: 701, 2025: 701
};

// NORWAY TIER 1 (1950–2025): Authentic REMA 1000-ligaen Champions
// 801: Kolstad Håndball, 802: Elverum Håndball, 803: Drammen HK, 804: Runar Sandefjord,
// 805: ØIF Arendal, 808: Haslum HK, 811: Bækkelaget Håndball Elite, 815: Viking TIF, 817: Sandefjord Håndball
const NOR_T1_CHAMPS: Record<number, number> = {
  1950: 811, 1951: 811, 1952: 815, 1953: 815, 1954: 811, 1955: 817,
  1956: 822, 1957: 815, 1958: 811, 1959: 811, 1960: 811, 1961: 811,
  1962: 822, 1963: 822, 1964: 811, 1965: 811,
  1966: 811, 1967: 811, 1968: 822, 1969: 815, 1970: 822, 1971: 811,
  1972: 811, 1973: 811, 1974: 811, 1975: 815, 1976: 811, 1977: 815,
  1978: 815, 1979: 811, 1980: 815, 1981: 811, 1982: 818, 1983: 801,
  1984: 811, 1985: 826, 1986: 816, 1987: 816, 1988: 826, 1989: 817,
  1990: 816, 1991: 804, 1992: 816, 1993: 804, 1994: 804, 1995: 802,
  1996: 803, 1997: 804, 1998: 815, 1999: 817, 2000: 804, 2001: 817,
  2002: 817, 2003: 817, 2004: 817, 2005: 817, 2006: 817, 2007: 803,
  2008: 802, 2009: 808, 2010: 813, 2011: 808, 2012: 802, 2013: 802,
  2014: 808, 2015: 805, 2016: 805, 2017: 802, 2018: 802, 2019: 805,
  2020: 802, 2021: 802, 2022: 802, 2023: 801, 2024: 801, 2025: 801
};

// ICELAND TIER 1 (1950–2025): Authentic Olís deild karla Champions
// 1001: Valur, 1002: FH, 1003: Haukar, 1004: ÍBV, 1005: Afturelding, 1006: Fram, 1008: KA, 1011: Selfoss, 1013: Víkingur
const ISL_T1_CHAMPS: Record<number, number> = {
  1950: 1006, 1951: 1001, 1952: 1017, 1953: 1002, 1954: 1017, 1955: 1001,
  1956: 1002, 1957: 1002, 1958: 1016, 1959: 1002, 1960: 1002, 1961: 1002,
  1962: 1006, 1963: 1006, 1964: 1006, 1965: 1002, 1966: 1002, 1967: 1006,
  1968: 1006, 1969: 1002, 1970: 1006, 1971: 1002, 1972: 1006, 1973: 1001,
  1974: 1002, 1975: 1013, 1976: 1002, 1977: 1001, 1978: 1001, 1979: 1001,
  1980: 1013, 1981: 1013, 1982: 1013, 1983: 1013, 1984: 1002, 1985: 1002,
  1986: 1013, 1987: 1013, 1988: 1001, 1989: 1001, 1990: 1002, 1991: 1001,
  1992: 1002, 1993: 1001, 1994: 1001, 1995: 1001, 1996: 1001, 1997: 1008,
  1998: 1001, 1999: 1005, 2000: 1003, 2001: 1003, 2002: 1008, 2003: 1003,
  2004: 1003, 2005: 1003, 2006: 1006, 2007: 1001, 2008: 1003, 2009: 1003,
  2010: 1003, 2011: 1002, 2012: 1010, 2013: 1006, 2014: 1004, 2015: 1003,
  2016: 1003, 2017: 1001, 2018: 1004, 2019: 1011, 2020: 1001, 2021: 1001,
  2022: 1001, 2023: 1004, 2024: 1002, 2025: 1001
};

// AUSTRIA TIER 1 (1950–2025): Authentic HLA Meisterliga Champions
// 1201: Alpla HC Hard, 1202: Förthof UHK Krems, 1203: HC Fivers Margareten,
// 1204: Bregenz Handball, 1205: Handball Tirol, 1209: HSG Bärnbach/Köflach, 1212: Handball Westwien
const AUT_T1_CHAMPS: Record<number, number> = {
  1950: 1203, 1951: 1203, 1952: 1212, 1953: 1203, 1954: 1203, 1955: 1212,
  1956: 1203, 1957: 1203, 1958: 1212, 1959: 1203, 1960: 1212,
  1961: 1212, 1962: 1203, 1963: 1212, 1964: 1205, 1965: 1205, 1966: 1212,
  1967: 1203, 1968: 1212, 1969: 1208, 1970: 1208, 1971: 1204, 1972: 1204,
  1973: 1202, 1974: 1209, 1975: 1202, 1976: 1209, 1977: 1202, 1978: 1203,
  1979: 1203, 1980: 1203, 1981: 1203, 1982: 1203, 1983: 1203, 1984: 1203,
  1985: 1203, 1986: 1203, 1987: 1203, 1988: 1203, 1989: 1212, 1990: 1203,
  1991: 1212, 1992: 1212, 1993: 1212, 1994: 1209, 1995: 1209, 1996: 1209,
  1997: 1209, 1998: 1209, 1999: 1209, 2000: 1209, 2001: 1204, 2002: 1204,
  2003: 1201, 2004: 1204, 2005: 1204, 2006: 1204, 2007: 1204, 2008: 1204,
  2009: 1204, 2010: 1204, 2011: 1203, 2012: 1201, 2013: 1201, 2014: 1201,
  2015: 1201, 2016: 1203, 2017: 1201, 2018: 1203, 2019: 1202, 2020: 1201,
  2021: 1201, 2022: 1202, 2023: 1212, 2024: 1201, 2025: 1202
};

// SWITZERLAND TIER 1 (1950–2025): Authentic Quickline Handball League Champions
// 1301: Kadetten Schaffhausen, 1302: HC Kriens-Luzern, 1303: Pfadi Winterthur,
// 1304: BSV Bern, 1305: GC Amicitia Zürich, 1306: Wacker Thun, 1307: HSC Suhr Aarau, 1308: TSV St. Otmar St. Gallen, 1310: RTV 1879 Basel
const SUI_T1_CHAMPS: Record<number, number> = {
  1950: 1305, 1951: 1305, 1952: 1305, 1953: 1307, 1954: 1305, 1955: 1305,
  1956: 1305, 1957: 1305, 1958: 1307, 1959: 1307, 1960: 1310, 1961: 1304,
  1962: 1305, 1963: 1305, 1964: 1305, 1965: 1305, 1966: 1305, 1967: 1307,
  1968: 1305, 1969: 1305, 1970: 1305, 1971: 1308, 1972: 1307, 1973: 1308,
  1974: 1308, 1975: 1305, 1976: 1305, 1977: 1305, 1978: 1305, 1979: 1305,
  1980: 1304, 1981: 1308, 1982: 1308, 1983: 1307, 1984: 1310, 1985: 1304,
  1986: 1308, 1987: 1305, 1988: 1305, 1989: 1305, 1990: 1305, 1991: 1305,
  1992: 1303, 1993: 1303, 1994: 1303, 1995: 1303, 1996: 1303, 1997: 1303,
  1998: 1303, 1999: 1307, 2000: 1307, 2001: 1308, 2002: 1303, 2003: 1303,
  2004: 1303, 2005: 1301, 2006: 1301, 2007: 1301, 2008: 1305, 2009: 1305,
  2010: 1301, 2011: 1301, 2012: 1301, 2013: 1306, 2014: 1301, 2015: 1301,
  2016: 1301, 2017: 1301, 2018: 1306, 2019: 1301, 2020: 1301, 2021: 1303,
  2022: 1301, 2023: 1301, 2024: 1301, 2025: 1301
};

const TIER1_LORE_BY_COUNTRY: Record<string, Record<number, number>> = {
  GER: GER_T1_CHAMPS,
  ESP: ESP_T1_CHAMPS,
  FRA: FRA_T1_CHAMPS,
  DEN: DEN_T1_CHAMPS,
  HUN: HUN_T1_CHAMPS,
  POL: POL_T1_CHAMPS,
  SWE: SWE_T1_CHAMPS,
  POR: POR_T1_CHAMPS,
  CRO: CRO_T1_CHAMPS,
  NOR: NOR_T1_CHAMPS,
  ISL: ISL_T1_CHAMPS,
  AUT: AUT_T1_CHAMPS,
  SUI: SUI_T1_CHAMPS,
};

// Authentic Tier 2 Champions across European leagues (including promoted clubs currently in Tier 1)
const FRA_T2_CHAMPS: Record<number, number> = {
  2005: 414, 2006: 410, 2007: 410, 2008: 413, 2009: 412, 2010: 418,
  2011: 417, 2012: 407, 2013: 421, 2014: 413, 2015: 414, 2016: 419,
  2017: 427, 2018: 416, 2019: 411, 2020: 408, 2021: 419, 2022: 414,
  2023: 420, 2024: 415, 2025: 417,
};

const ESP_T2_CHAMPS: Record<number, number> = {
  2005: 512, 2006: 507, 2007: 511, 2008: 518, 2009: 515, 2010: 518,
  2011: 512, 2012: 529, 2013: 509, 2014: 513, 2015: 517, 2016: 508,
  2017: 524, 2018: 524, 2019: 514, 2020: 520, 2021: 506, 2022: 520,
  2023: 518, 2024: 515, 2025: 517,
};

const DEN_T2_CHAMPS: Record<number, number> = {
  2008: 305, 2009: 316, 2010: 307, 2011: 309, 2012: 317, 2013: 306,
  2014: 319, 2015: 312, 2016: 321, 2017: 316, 2018: 313, 2019: 305,
  2020: 313, 2021: 312, 2022: 319, 2023: 313, 2024: 314, 2025: 315,
};

const SWE_T2_CHAMPS: Record<number, number> = {
  2008: 613, 2009: 608, 2010: 614, 2011: 607, 2012: 620, 2013: 607,
  2014: 619, 2015: 611, 2016: 613, 2017: 607, 2018: 610, 2019: 617,
  2020: 614, 2021: 606, 2022: 623, 2023: 612, 2024: 615, 2025: 616,
};

const POL_T2_CHAMPS: Record<number, number> = {
  2010: 1110, 2011: 1117, 2012: 1108, 2013: 1113, 2014: 1114, 2015: 1113,
  2016: 1119, 2017: 1109, 2018: 1125, 2019: 1112, 2020: 1122, 2021: 1116,
  2022: 1106, 2023: 1113, 2024: 1114, 2025: 1116,
};

const TIER2_LORE_BY_COUNTRY: Record<string, Record<number, number>> = {
  GER: GER_T2_CHAMPS,
  FRA: FRA_T2_CHAMPS,
  ESP: ESP_T2_CHAMPS,
  DEN: DEN_T2_CHAMPS,
  SWE: SWE_T2_CHAMPS,
  POL: POL_T2_CHAMPS,
};

// Authentic Domestic National Cup Winners (Recent & Classic Era)
const NAT_CUP_LORE_BY_COUNTRY: Record<string, Record<number, number>> = {
  GER: {
    1975: 123, 1976: 123, 1977: 108, 1978: 108, 1979: 123, 1980: 130, 1981: 121, 1982: 108,
    1983: 108, 1984: 130, 1985: 108, 1986: 125, 1987: 130, 1988: 133, 1989: 130, 1990: 101,
    1991: 133, 1992: 133, 1993: 106, 1994: 133, 1995: 110, 1996: 101, 1997: 110, 1998: 104,
    1999: 104, 2000: 104, 2001: 129, 2002: 110, 2003: 103, 2004: 103, 2005: 103, 2006: 114,
    2007: 104, 2008: 104, 2009: 104, 2010: 114, 2011: 104, 2012: 104, 2013: 104, 2014: 102,
    2015: 103, 2016: 101, 2017: 104, 2018: 106, 2019: 104, 2020: 110, 2021: 110, 2022: 104,
    2023: 106, 2024: 101, 2025: 104,
  },
  FRA: {
    1999: 403, 2000: 403, 2001: 403, 2002: 403, 2003: 403, 2004: 416, 2005: 403, 2006: 403,
    2007: 401, 2008: 403, 2009: 403, 2010: 403, 2011: 409, 2012: 403, 2013: 403, 2014: 401,
    2015: 401, 2016: 403, 2017: 402, 2018: 401, 2019: 405, 2020: 401, 2021: 401, 2022: 401,
    2023: 402, 2024: 402, 2025: 403,
  },
  ESP: {
    1996: 502, 1997: 501, 1998: 501, 1999: 512, 2000: 501, 2001: 512, 2002: 505, 2003: 522,
    2004: 501, 2005: 508, 2006: 508, 2007: 501, 2008: 522, 2009: 501, 2010: 501, 2011: 522,
    2012: 522, 2013: 522, 2014: 501, 2015: 501, 2016: 501, 2017: 501, 2018: 501, 2019: 501,
    2020: 501, 2021: 501, 2022: 501, 2023: 501, 2024: 501, 2025: 501,
  },
  DEN: {
    2010: 303, 2011: 303, 2012: 310, 2013: 310, 2014: 304, 2015: 319, 2016: 304, 2017: 308,
    2018: 301, 2019: 302, 2020: 306, 2021: 301, 2022: 302, 2023: 302, 2024: 301, 2025: 301,
  },
  HUN: {
    2006: 902, 2007: 901, 2008: 902, 2009: 901, 2010: 901, 2011: 901, 2012: 901, 2013: 901,
    2014: 901, 2015: 901, 2016: 901, 2017: 901, 2018: 901, 2019: 902, 2020: 901, 2021: 901,
    2022: 901, 2023: 901, 2024: 901, 2025: 902,
  },
  POL: {
    2005: 1102, 2006: 1101, 2007: 1102, 2008: 1102, 2009: 1101, 2010: 1101, 2011: 1101,
    2012: 1101, 2013: 1101, 2014: 1101, 2015: 1101, 2016: 1101, 2017: 1101, 2018: 1101,
    2019: 1101, 2020: 1101, 2021: 1101, 2022: 1102, 2023: 1102, 2024: 1102, 2025: 1101,
  },
};

// Authentic Champions Cup (EHF Champions League / European Champions Cup, 1957–2025)
const CHAMPIONS_CUP_LORE: Record<number, { clubId: number; country: string }> = {
  1957: { clubId: 111, country: 'GER' },
  1958: { clubId: 615, country: 'SWE' },
  1959: { clubId: 615, country: 'SWE' },
  1960: { clubId: 111, country: 'GER' },
  1961: { clubId: 111, country: 'GER' },
  1962: { clubId: 111, country: 'GER' },
  1963: { clubId: 109, country: 'GER' },
  1964: { clubId: 701, country: 'CRO' },
  1965: { clubId: 912, country: 'HUN' },
  1966: { clubId: 109, country: 'GER' },
  1967: { clubId: 108, country: 'GER' },
  1968: { clubId: 108, country: 'GER' },
  1969: { clubId: 108, country: 'GER' },
  1970: { clubId: 108, country: 'GER' },
  1971: { clubId: 108, country: 'GER' },
  1972: { clubId: 701, country: 'CRO' },
  1973: { clubId: 108, country: 'GER' },
  1974: { clubId: 108, country: 'GER' },
  1975: { clubId: 117, country: 'GER' },
  1976: { clubId: 701, country: 'CRO' },
  1977: { clubId: 101, country: 'GER' },
  1978: { clubId: 101, country: 'GER' },
  1979: { clubId: 130, country: 'GER' },
  1980: { clubId: 130, country: 'GER' },
  1981: { clubId: 101, country: 'GER' },
  1982: { clubId: 912, country: 'HUN' },
  1983: { clubId: 108, country: 'GER' },
  1984: { clubId: 701, country: 'CRO' },
  1985: { clubId: 701, country: 'CRO' },
  1986: { clubId: 701, country: 'CRO' },
  1987: { clubId: 133, country: 'GER' },
  1988: { clubId: 133, country: 'GER' },
  1989: { clubId: 133, country: 'GER' },
  1990: { clubId: 501, country: 'ESP' },
  1991: { clubId: 501, country: 'ESP' },
  1992: { clubId: 701, country: 'CRO' },
  1993: { clubId: 701, country: 'CRO' },
  1994: { clubId: 506, country: 'ESP' },
  1995: { clubId: 502, country: 'ESP' },
  1996: { clubId: 501, country: 'ESP' },
  1997: { clubId: 501, country: 'ESP' },
  1998: { clubId: 501, country: 'ESP' },
  1999: { clubId: 501, country: 'ESP' },
  2000: { clubId: 501, country: 'ESP' },
  2001: { clubId: 512, country: 'ESP' },
  2002: { clubId: 101, country: 'GER' },
  2003: { clubId: 403, country: 'FRA' },
  2004: { clubId: 103, country: 'GER' },
  2005: { clubId: 501, country: 'ESP' },
  2006: { clubId: 522, country: 'ESP' },
  2007: { clubId: 104, country: 'GER' },
  2008: { clubId: 522, country: 'ESP' },
  2009: { clubId: 522, country: 'ESP' },
  2010: { clubId: 104, country: 'GER' },
  2011: { clubId: 501, country: 'ESP' },
  2012: { clubId: 104, country: 'GER' },
  2013: { clubId: 114, country: 'GER' },
  2014: { clubId: 103, country: 'GER' },
  2015: { clubId: 501, country: 'ESP' },
  2016: { clubId: 1101, country: 'POL' },
  2017: { clubId: 901, country: 'HUN' },
  2018: { clubId: 403, country: 'FRA' },
  2019: { clubId: 901, country: 'HUN' },
  2020: { clubId: 104, country: 'GER' },
  2021: { clubId: 501, country: 'ESP' },
  2022: { clubId: 501, country: 'ESP' },
  2023: { clubId: 101, country: 'GER' },
  2024: { clubId: 501, country: 'ESP' },
  2025: { clubId: 101, country: 'GER' },
};

// Authentic Euro Cup (IHF Cup / EHF Cup / EHF European League, 1982–2025)
const EURO_CUP_LORE: Record<number, { clubId: number; country: string }> = {
  1982: { clubId: 108, country: 'GER' },
  1983: { clubId: 108, country: 'GER' },
  1984: { clubId: 130, country: 'GER' },
  1985: { clubId: 913, country: 'HUN' },
  1986: { clubId: 913, country: 'HUN' },
  1987: { clubId: 503, country: 'ESP' },
  1988: { clubId: 133, country: 'GER' },
  1989: { clubId: 132, country: 'GER' },
  1990: { clubId: 133, country: 'GER' },
  1991: { clubId: 701, country: 'CRO' },
  1992: { clubId: 113, country: 'GER' },
  1993: { clubId: 506, country: 'ESP' },
  1994: { clubId: 518, country: 'ESP' },
  1995: { clubId: 503, country: 'ESP' },
  1996: { clubId: 503, country: 'ESP' },
  1997: { clubId: 103, country: 'GER' },
  1998: { clubId: 104, country: 'GER' },
  1999: { clubId: 101, country: 'GER' },
  2000: { clubId: 711, country: 'CRO' },
  2001: { clubId: 101, country: 'GER' },
  2002: { clubId: 104, country: 'GER' },
  2003: { clubId: 501, country: 'ESP' },
  2004: { clubId: 104, country: 'GER' },
  2005: { clubId: 133, country: 'GER' },
  2006: { clubId: 110, country: 'GER' },
  2007: { clubId: 101, country: 'GER' },
  2008: { clubId: 122, country: 'GER' },
  2009: { clubId: 108, country: 'GER' },
  2010: { clubId: 110, country: 'GER' },
  2011: { clubId: 111, country: 'GER' },
  2012: { clubId: 111, country: 'GER' },
  2013: { clubId: 106, country: 'GER' },
  2014: { clubId: 902, country: 'HUN' },
  2015: { clubId: 102, country: 'GER' },
  2016: { clubId: 111, country: 'GER' },
  2017: { clubId: 111, country: 'GER' },
  2018: { clubId: 102, country: 'GER' },
  2019: { clubId: 104, country: 'GER' },
  2020: { clubId: 203, country: 'POR' },
  2021: { clubId: 101, country: 'GER' },
  2022: { clubId: 203, country: 'POR' },
  2023: { clubId: 102, country: 'GER' },
  2024: { clubId: 103, country: 'GER' },
  2025: { clubId: 103, country: 'GER' },
};

// Authentic Global Club Cup (IHF Super Globe / Club World Championship, 1997–2025)
const GLOBAL_CLUB_CUP_LORE: Record<number, { clubId: number; country: string }> = {
  1997: { clubId: 506, country: 'ESP' },
  1998: { clubId: 501, country: 'ESP' },
  1999: { clubId: 501, country: 'ESP' },
  2000: { clubId: 501, country: 'ESP' },
  2001: { clubId: 512, country: 'ESP' },
  2002: { clubId: 101, country: 'GER' },
  2003: { clubId: 403, country: 'FRA' },
  2004: { clubId: 522, country: 'ESP' },
  2005: { clubId: 501, country: 'ESP' },
  2006: { clubId: 522, country: 'ESP' },
  2007: { clubId: 522, country: 'ESP' },
  2008: { clubId: 522, country: 'ESP' },
  2009: { clubId: 522, country: 'ESP' },
  2010: { clubId: 522, country: 'ESP' },
  2011: { clubId: 104, country: 'GER' },
  2012: { clubId: 508, country: 'ESP' },
  2013: { clubId: 501, country: 'ESP' },
  2014: { clubId: 501, country: 'ESP' },
  2015: { clubId: 102, country: 'GER' },
  2016: { clubId: 102, country: 'GER' },
  2017: { clubId: 501, country: 'ESP' },
  2018: { clubId: 501, country: 'ESP' },
  2019: { clubId: 501, country: 'ESP' },
  2020: { clubId: 104, country: 'GER' },
  2021: { clubId: 101, country: 'GER' },
  2022: { clubId: 101, country: 'GER' },
  2023: { clubId: 101, country: 'GER' },
  2024: { clubId: 901, country: 'HUN' },
  2025: { clubId: 501, country: 'ESP' },
};

// ============================================================================
// CAREER START YEAR RESOLUTION (RESPECTS HISTORIC START AGES LIKE 1954)
// ============================================================================
export function getCareerStartYear(state: GameState): number {
  if (typeof state.startYear === 'number' && state.startYear >= 1950) {
    return state.startYear;
  }
  if (Array.isArray(state.history) && state.history.length > 0) {
    return Math.min(...state.history.map((h) => h.year));
  }
  return state.year || 2026;
}

// ============================================================================
// CLUB RESOLUTION HELPER
// ============================================================================
function resolveClubFromDb(
  clubIdOrName: number | string,
  country: string,
  tier: number,
  clubsDb: Club[],
  modActive: boolean,
  fallbackName?: string
): {
  id?: string | number;
  name: string;
  color: string;
  logo?: string;
  fallbackLogo?: string;
  country: string;
  tier?: number;
} {
  const normC = normalizeCountry(country || 'GER');
  let matched: Club | undefined;

  if (typeof clubIdOrName === 'number' || /^\d+$/.test(String(clubIdOrName))) {
    const idStr = String(clubIdOrName);
    matched =
      clubsDb.find((c) => String(c.id) === idStr) ||
      ALL_CLUBS.find((c) => String(c.id) === idStr);
    if (!matched && fallbackName) {
      const lc = fallbackName.trim().toLowerCase();
      matched =
        clubsDb.find((c) => c.name && c.name.trim().toLowerCase() === lc) ||
        ALL_CLUBS.find((c) => c.name && c.name.trim().toLowerCase() === lc);
    }
  } else {
    const lc = String(clubIdOrName).trim().toLowerCase();
    matched =
      clubsDb.find((c) => c.name && c.name.trim().toLowerCase() === lc) ||
      ALL_CLUBS.find((c) => c.name && c.name.trim().toLowerCase() === lc);
    if (!matched) {
      // Find in ALL_CLUBS by partial match, then map by ID to clubsDb
      const partialAll = ALL_CLUBS.find(
        (c) =>
          normalizeCountry(c.country || 'GER') === normC &&
          c.name &&
          (c.name.toLowerCase().includes(lc) || lc.includes(c.name.toLowerCase()))
      );
      if (partialAll) {
        matched = clubsDb.find((c) => String(c.id) === String(partialAll.id)) || partialAll;
      }
    }
  }

  if (!matched && fallbackName && Number(clubIdOrName) >= 9900) {
    return {
      id: clubIdOrName,
      name: fallbackName,
      color: '2563eb',
      country: normC,
      tier,
    };
  }

  if (!matched) {
    const pool = clubsDb.filter(
      (c) => normalizeCountry(c.country || 'GER') === normC && c.tier === tier && !isReserveClub(c.name)
    );
    const fallbackPool =
      pool.length > 0
        ? pool
        : clubsDb.filter((c) => normalizeCountry(c.country || 'GER') === normC && !isReserveClub(c.name));
    if (fallbackPool.length > 0) {
      matched = fallbackPool[hashSeed(`${normC}-${tier}-${clubIdOrName}`) % fallbackPool.length];
    }
  }

  if (matched) {
    const baseClub = ALL_CLUBS.find((c) => String(c.id) === String(matched!.id)) || matched;
    return {
      id: matched.id,
      name: matched.name,
      color: matched.color || '2563eb',
      logo: modActive ? matched.logo : undefined,
      fallbackLogo: modActive ? matched.fallbackLogo : undefined,
      country: normalizeCountry(matched.country || normC),
      tier: baseClub.tier || matched.tier || tier,
    };
  }

  return {
    name: typeof clubIdOrName === 'string' ? clubIdOrName : `${normC} Handball Club`,
    color: '2563eb',
    country: normC,
    tier,
  };
}

// ============================================================================
// REALISTIC POINTS GENERATOR FOR HISTORIC LEAGUES
// ============================================================================
function getRealisticLeaguePoints(country: string, tier: number, year: number, clubName: string): number {
  const norm = normalizeCountry(country || 'GER');
  const seed = hashSeed(`pts-${norm}-${tier}-${year}-${clubName}`);
  // Handball 2-points-per-win system (or modern matchday count)
  if (tier === 1) {
    if (norm === 'GER') {
      // 34 matches (68 max pts) in modern era, 26-30 in earlier decades
      const maxPts = year >= 1995 ? 68 : year >= 1977 ? 52 : 36;
      return maxPts - 4 - (seed % 10);
    }
    if (norm === 'ESP' || norm === 'FRA') {
      const maxPts = year >= 1995 ? 60 : 44;
      return maxPts - 2 - (seed % 9);
    }
    const maxPts = year >= 1995 ? 52 : 40;
    return maxPts - 3 - (seed % 8);
  }
  if (tier === 2) {
    const maxPts = norm === 'GER' ? 62 : 50;
    return maxPts - 4 - (seed % 9);
  }
  const basePts = Math.max(34, 52 - tier * 2);
  return basePts - (seed % 8);
}

// ============================================================================
// LORE ENTRY GENERATOR (STRICTLY FOR YEARS < careerStartYear, BACK TO 1950)
// ============================================================================
function isClubReserve(c: Club): boolean {
  if (isReserveClub(c.name) || isReserveClub((c as any).realName)) return true;
  const baseMatch = ALL_CLUBS.find((b) => String(b.id) === String(c.id));
  return Boolean(baseMatch && (isReserveClub(baseMatch.name) || isReserveClub((baseMatch as any).realName)));
}

function getLoreChampionForLeague(
  country: string,
  tier: number,
  year: number,
  clubsDb: Club[],
  careerSeedStr: string,
  modActive: boolean
): AlmanacEntry {
  const norm = normalizeCountry(country || 'GER');
  const leagueInfo = getLeagueInfo(tier, norm);
  let resolvedClub: ReturnType<typeof resolveClubFromDb>;

  if (tier === 1 && TIER1_LORE_BY_COUNTRY[norm]?.[year]) {
    resolvedClub = resolveClubFromDb(TIER1_LORE_BY_COUNTRY[norm][year], norm, 1, clubsDb, modActive);
  } else if (tier === 2 && TIER2_LORE_BY_COUNTRY[norm]?.[year]) {
    resolvedClub = resolveClubFromDb(TIER2_LORE_BY_COUNTRY[norm][year], norm, 2, clubsDb, modActive);
  } else if (tier <= 2) {
    // Use immutable baseline ALL_CLUBS first so live promotions/relegations never mutate past Lore history!
    const allTierPool = ALL_CLUBS.filter(
      (c) =>
        normalizeCountry(c.country || 'GER') === norm &&
        (c.tier === tier || (tier === 2 && c.tier === 1 && (c.baseOvr || 80) <= 82)) &&
        !isClubReserve(c)
    );
    const dbTierPool = clubsDb.filter(
      (c) => normalizeCountry(c.country || 'GER') === norm && c.tier === tier && !isClubReserve(c)
    );
    const countryFallbackPool = (ALL_CLUBS.some((c) => normalizeCountry(c.country || 'GER') === norm) ? ALL_CLUBS : clubsDb)
      .filter((c) => normalizeCountry(c.country || 'GER') === norm && !isClubReserve(c))
      .sort((a, b) => (tier === 1 ? (b.baseOvr || 70) - (a.baseOvr || 70) : (a.baseOvr || 70) - (b.baseOvr || 70)));
    const fallbackPool =
      allTierPool.length > 0 ? allTierPool : dbTierPool.length > 0 ? dbTierPool : countryFallbackPool;
    // Weight higher reputation/baseOvr clubs within that tier more heavily for realistic historic dynasties
    const sorted = [...fallbackPool].sort((a, b) => (b.rep || b.baseOvr || 70) - (a.rep || a.baseOvr || 70));
    const topSlice = sorted.slice(0, Math.max(1, Math.min(10, sorted.length)));
    const pickIdx = hashSeed(`lore-t${tier}-${norm}-${year}`) % Math.max(1, topSlice.length);
    const chosen = topSlice[pickIdx] || sorted[0];
    resolvedClub = resolveClubFromDb(chosen ? chosen.id : `${norm} HC`, norm, tier, clubsDb, modActive);
  } else {
    // Tier 3+ populated realistically at game start using careerSeedStr + year from immutable baseline tier pool
    const allTierPool = ALL_CLUBS.filter(
      (c) => normalizeCountry(c.country || 'GER') === norm && c.tier === tier && !isClubReserve(c)
    );
    const dbTierPool = clubsDb.filter(
      (c) => normalizeCountry(c.country || 'GER') === norm && c.tier === tier && !isClubReserve(c)
    );
    const countryFallbackPool = (ALL_CLUBS.some((c) => normalizeCountry(c.country || 'GER') === norm) ? ALL_CLUBS : clubsDb)
      .filter((c) => normalizeCountry(c.country || 'GER') === norm && !isClubReserve(c))
      .sort((a, b) => (a.baseOvr || 70) - (b.baseOvr || 70));
    const fallbackPool =
      allTierPool.length > 0 ? allTierPool : dbTierPool.length > 0 ? dbTierPool : countryFallbackPool;
    const pickIdx = hashSeed(`lower-${careerSeedStr}-${norm}-t${tier}-${year}`) % Math.max(1, fallbackPool.length);
    const chosen = fallbackPool[pickIdx];
    resolvedClub = resolveClubFromDb(chosen ? chosen.id : `${norm} Div ${tier}`, norm, tier, clubsDb, modActive);
  }

  const pts = getRealisticLeaguePoints(norm, tier, year, resolvedClub.name);
  const coachName = getHistoricCoach(norm, resolvedClub.name, year);

  return {
    id: `lore-league-${norm}-t${tier}-${year}`,
    year,
    country: norm,
    tier,
    competitionType: 'league',
    competitionName: leagueInfo.name,
    clubId: resolvedClub.id,
    clubName: resolvedClub.name,
    clubColor: resolvedClub.color,
    clubLogo: resolvedClub.logo,
    clubFallbackLogo: resolvedClub.fallbackLogo,
    coachName,
    points: pts,
    statusLabel: `${pts} PTS`,
    source: 'Lore',
    subtitle: `Tier ${tier} • Lore`,
  };
}

function getLoreCupWinner(
  compType: 'nat_cup' | 'supercup' | 'reg_cup' | 'cl' | 'euro_cup' | 'cwc',
  country: string,
  year: number,
  clubsDb: Club[],
  careerSeedStr: string,
  modActive: boolean
): AlmanacEntry | null {
  const norm = normalizeCountry(country || 'GER');

  if (compType === 'cl') {
    if (year < 1957) return null; // Founded 1957
    const spec = CHAMPIONS_CUP_LORE[year];
    const cupName = modActive
      ? year >= 1994
        ? 'EHF Champions League'
        : 'European Champions Cup'
      : 'Champions Cup';
    const resolved = spec
      ? resolveClubFromDb(spec.clubId, spec.country, 1, clubsDb, modActive)
      : resolveClubFromDb(104, 'GER', 1, clubsDb, modActive);
    return {
      id: `lore-cl-${year}`,
      year,
      country: resolved.country,
      tier: 1,
      competitionType: 'cl',
      competitionName: cupName,
      clubId: resolved.id,
      clubName: resolved.name,
      clubColor: resolved.color,
      clubLogo: resolved.logo,
      clubFallbackLogo: resolved.fallbackLogo,
      coachName: getHistoricCoach(resolved.country, resolved.name, year),
      statusLabel: 'WINNER',
      source: 'Lore',
      subtitle: `${getCountryFlag(resolved.country)} ${resolved.country} • Continental • Lore`,
    };
  }

  if (compType === 'euro_cup') {
    if (year < 1982) return null; // Founded 1982 (IHF Cup -> EHF Cup -> EHF European League)
    const spec = EURO_CUP_LORE[year];
    const cupName = modActive
      ? year >= 2021
        ? 'EHF European League'
        : year >= 1994
        ? 'EHF Cup'
        : 'IHF Cup'
      : 'Euro Cup';
    const resolved = spec
      ? resolveClubFromDb(spec.clubId, spec.country, 1, clubsDb, modActive)
      : resolveClubFromDb(108, 'GER', 1, clubsDb, modActive);
    return {
      id: `lore-euro-${year}`,
      year,
      country: resolved.country,
      tier: 1,
      competitionType: 'euro_cup',
      competitionName: cupName,
      clubId: resolved.id,
      clubName: resolved.name,
      clubColor: resolved.color,
      clubLogo: resolved.logo,
      clubFallbackLogo: resolved.fallbackLogo,
      coachName: getHistoricCoach(resolved.country, resolved.name, year),
      statusLabel: 'WINNER',
      source: 'Lore',
      subtitle: `${getCountryFlag(resolved.country)} ${resolved.country} • Continental • Lore`,
    };
  }

  if (compType === 'cwc') {
    if (year < 1997) return null; // Founded 1997 (IHF Super Globe)
    const spec = GLOBAL_CLUB_CUP_LORE[year];
    const cupName = modActive ? 'IHF Super Globe' : 'Global Club Cup';
    const resolved = spec
      ? resolveClubFromDb(spec.clubId, spec.country, 1, clubsDb, modActive)
      : resolveClubFromDb(501, 'ESP', 1, clubsDb, modActive);
    return {
      id: `lore-cwc-${year}`,
      year,
      country: resolved.country,
      tier: 1,
      competitionType: 'cwc',
      competitionName: cupName,
      clubId: resolved.id,
      clubName: resolved.name,
      clubColor: resolved.color,
      clubLogo: resolved.logo,
      clubFallbackLogo: resolved.fallbackLogo,
      coachName: getHistoricCoach(resolved.country, resolved.name, year),
      statusLabel: 'WINNER',
      source: 'Lore',
      subtitle: `${getCountryFlag(resolved.country)} ${resolved.country} • Global • Lore`,
    };
  }

  if (compType === 'nat_cup') {
    const cupInfo = getDomesticCupInfo(norm, 1);
    const explicitCupWinner = NAT_CUP_LORE_BY_COUNTRY[norm]?.[year];
    let chosenId: number | string;
    if (explicitCupWinner !== undefined) {
      chosenId = explicitCupWinner;
    } else {
      // Draw from the active era's Tier 1 contenders first so 1950s–1980s cup winners match that decade's powers
      const countryLore = TIER1_LORE_BY_COUNTRY[norm] || {};
      const eraIds: number[] = [];
      for (let y = Math.max(1950, year - 4); y <= Math.min(2025, year + 4); y++) {
        const cid = countryLore[y];
        if (cid !== undefined && !eraIds.includes(cid)) {
          eraIds.push(cid);
        }
      }
      const baseSource = ALL_CLUBS.some((c) => normalizeCountry(c.country || 'GER') === norm) ? ALL_CLUBS : clubsDb;
      const t1Clubs = baseSource
        .filter((c) => normalizeCountry(c.country || 'GER') === norm && c.tier === 1 && !isClubReserve(c))
        .sort((a, b) => (b.rep || b.baseOvr || 75) - (a.rep || a.baseOvr || 75));
      const topPoolIds = t1Clubs.slice(0, Math.max(1, Math.min(5, t1Clubs.length))).map((c) => c.id);
      const candidateIds = eraIds.length >= 2 ? eraIds : Array.from(new Set([...eraIds, ...topPoolIds]));
      const seed = hashSeed(`natcup-${norm}-${year}`);
      chosenId =
        candidateIds.length > 0
          ? candidateIds[seed % candidateIds.length]
          : countryLore[year] || topPoolIds[0] || `${norm} Cup Winner`;
    }
    const resolved = resolveClubFromDb(chosenId, norm, 1, clubsDb, modActive);
    return {
      id: `lore-natcup-${norm}-${year}`,
      year,
      country: norm,
      tier: 1,
      competitionType: 'nat_cup',
      competitionName: cupInfo.name,
      clubId: resolved.id,
      clubName: resolved.name,
      clubColor: resolved.color,
      clubLogo: resolved.logo,
      clubFallbackLogo: resolved.fallbackLogo,
      coachName: getHistoricCoach(norm, resolved.name, year),
      statusLabel: 'WINNER',
      source: 'Lore',
      subtitle: 'National Cup • Lore',
    };
  }

  if (compType === 'supercup') {
    const scInfo = getDomesticSupercupInfo(norm, modActive);
    const countryLore = TIER1_LORE_BY_COUNTRY[norm] || {};
    const leagueChampId = countryLore[year] ?? countryLore[year - 1];
    const cupWinnerId = NAT_CUP_LORE_BY_COUNTRY[norm]?.[year] ?? NAT_CUP_LORE_BY_COUNTRY[norm]?.[year - 1];
    const finalistIds: (number | string)[] = [];
    if (leagueChampId !== undefined) finalistIds.push(leagueChampId);
    if (cupWinnerId !== undefined && !finalistIds.includes(cupWinnerId)) finalistIds.push(cupWinnerId);
    if (finalistIds.length < 2) {
      for (let y = Math.max(1950, year - 3); y <= Math.min(2025, year + 3); y++) {
        const cid = countryLore[y];
        if (cid !== undefined && !finalistIds.includes(cid)) {
          finalistIds.push(cid);
        }
      }
    }
    const baseSource = ALL_CLUBS.some((c) => normalizeCountry(c.country || 'GER') === norm) ? ALL_CLUBS : clubsDb;
    const t1Clubs = baseSource
      .filter((c) => normalizeCountry(c.country || 'GER') === norm && c.tier === 1 && !isClubReserve(c))
      .sort((a, b) => (b.rep || b.baseOvr || 75) - (a.rep || a.baseOvr || 75));
    const topPoolIds = t1Clubs.slice(0, Math.max(1, Math.min(4, t1Clubs.length))).map((c) => c.id);
    const candidateIds = finalistIds.length >= 2 ? finalistIds : Array.from(new Set([...finalistIds, ...topPoolIds]));
    const seed = hashSeed(`lore-supercup-${norm}-${year}`);
    const chosenId =
      candidateIds.length > 0
        ? candidateIds[seed % candidateIds.length]
        : leagueChampId || topPoolIds[0] || `${norm} Supercup Winner`;
    const resolved = resolveClubFromDb(chosenId, norm, 1, clubsDb, modActive);
    return {
      id: `lore-supercup-${norm}-${year}`,
      year,
      country: norm,
      tier: 1,
      competitionType: 'supercup',
      competitionName: scInfo.name,
      clubId: resolved.id,
      clubName: resolved.name,
      clubColor: resolved.color,
      clubLogo: resolved.logo,
      clubFallbackLogo: resolved.fallbackLogo,
      coachName: getHistoricCoach(norm, resolved.name, year),
      statusLabel: 'WINNER',
      source: 'Lore',
      subtitle: 'Supercup • Lore',
    };
  }

  if (compType === 'reg_cup') {
    const maxT = getMaxTier(norm);
    const regTier = Math.min(maxT, 4);
    const baseSource = ALL_CLUBS.some((c) => normalizeCountry(c.country || 'GER') === norm) ? ALL_CLUBS : clubsDb;
    const regClubs = baseSource.filter(
      (c) => normalizeCountry(c.country || 'GER') === norm && c.tier >= regTier && !isClubReserve(c)
    );
    const allCountryNonReserve = baseSource
      .filter((c) => normalizeCountry(c.country || 'GER') === norm && !isClubReserve(c))
      .sort((a, b) => (a.baseOvr || 70) - (b.baseOvr || 70));
    const fallbackPool =
      maxT === 1 && allCountryNonReserve.length > 2
        ? allCountryNonReserve.slice(0, Math.max(2, Math.ceil(allCountryNonReserve.length * 0.6)))
        : regClubs.length > 0
          ? regClubs
          : allCountryNonReserve;
    const pickIdx = hashSeed(`regcup-${careerSeedStr}-${norm}-${year}`) % Math.max(1, fallbackPool.length);
    const chosen = fallbackPool[pickIdx];
    const actualTier = chosen?.tier || regTier;
    const resolved = resolveClubFromDb(chosen ? chosen.id : `${norm} Regional`, norm, actualTier, clubsDb, modActive);
    return {
      id: `lore-regcup-${norm}-${year}`,
      year,
      country: norm,
      tier: actualTier,
      competitionType: 'reg_cup',
      competitionName: 'Regional Cup',
      clubId: resolved.id,
      clubName: resolved.name,
      clubColor: resolved.color,
      clubLogo: resolved.logo,
      clubFallbackLogo: resolved.fallbackLogo,
      coachName: getHistoricCoach(norm, resolved.name, year),
      statusLabel: 'WINNER',
      source: 'Lore',
      subtitle: `Tier ${actualTier} • Lore`,
    };
  }

  return null;
}

// ============================================================================
// LIVE SEASON EXTRACTOR (FOR YEARS >= careerStartYear IN state.history)
// ============================================================================
function getLiveEntriesForHistorySeason(
  hist: SeasonHistory,
  state: GameState,
  country: string,
  clubsDb: Club[],
  modActive: boolean,
  targetTiers: number[],
  competition: AlmanacCompetitionFilter,
  careerSeedStr: string
): AlmanacEntry[] {
  const entries: AlmanacEntry[] = [];
  const normCountry = normalizeCountry(country || 'GER');
  const histCountry = normalizeCountry(hist.country || state.club.country || 'GER');
  const year = hist.year;
  const movements: UniverseMovement[] = [
    ...(hist.universeMovements || []),
    ...(state.universeMovements || []).filter(
      (m) => m.year === year && !(hist.universeMovements || []).some((hm) => hm.id === m.id)
    ),
  ];

  const isNameOrIdReserve = (name?: string, id?: string | number): boolean => {
    if (name && isReserveClub(name)) return true;
    if (id !== undefined) {
      const baseMatch = ALL_CLUBS.find((b) => String(b.id) === String(id));
      if (baseMatch && (isReserveClub(baseMatch.name) || isReserveClub((baseMatch as any).realName))) return true;
      const dbMatch = clubsDb.find((b) => String(b.id) === String(id));
      if (dbMatch && (isReserveClub(dbMatch.name) || isReserveClub((dbMatch as any).realName))) return true;
    }
    return false;
  };

  const resolveCoach = (clubName: string, clubId?: string | number, ctry: string = normCountry): string => {
    const isUser =
      (hist.clubName && clubName.trim().toLowerCase() === hist.clubName.trim().toLowerCase()) ||
      (hist.clubId !== undefined && clubId !== undefined && String(hist.clubId) === String(clubId));
    if (isUser && state.managerName) {
      return state.managerName;
    }
    return getHistoricCoach(ctry, clubName, year);
  };

  // 1. League Pyramid entries for requested targetTiers in normCountry
  if (competition === 'league' || competition === 'all') {
    for (const t of targetTiers) {
      const leagueInfo = getLeagueInfo(t, normCountry);
      let champName: string | undefined;
      let champId: string | number | undefined;
      let champPts: number | undefined;

      if (normCountry === histCountry) {
        if (t === hist.tier && Array.isArray(hist.finalTable) && hist.finalTable.length > 0) {
          const topRow = hist.finalTable.find((r: any) => r.pos === 1 || r.rank === 1) || hist.finalTable[0];
          if (topRow) {
            champName = topRow.name || topRow.clubName;
            champId = topRow.id ?? topRow.teamId;
            champPts = typeof topRow.pts === 'number' ? topRow.pts : topRow.points;
          }
        } else if (hist.divisionTables?.[t] && Array.isArray(hist.divisionTables[t]) && hist.divisionTables[t].length > 0) {
          const topRow = hist.divisionTables[t].find((r: any) => r.pos === 1 || r.rank === 1) || hist.divisionTables[t][0];
          if (topRow) {
            champName = topRow.name || topRow.clubName;
            champId = topRow.id ?? topRow.teamId;
            champPts = typeof topRow.pts === 'number' ? topRow.pts : topRow.points;
          }
        } else if (t === hist.tier && hist.pos === 1) {
          champName = hist.clubName;
          champId = hist.clubId;
          champPts = hist.pts;
        }
      }

      if (!champName) {
        const movChamp = movements.find(
          (m) =>
            m.type === 'champion' &&
            normalizeCountry(m.country || 'GER') === normCountry &&
            (m.fromTier || 1) === t
        );
        if (movChamp) {
          champName = movChamp.clubName;
          champId = movChamp.clubId;
        }
      }

      // Synchronize with Standings generator when champion or points were not cached in finalTable/divisionTables
      if (!champName || champPts === undefined) {
        const genTable = generateLeagueTable(state, clubsDb, t, {
          year,
          country: normCountry,
          tier: t,
          userPlayedTier: hist.tier,
        } as any);
        const topGenRow = genTable.find((r) => r.pos === 1) || genTable[0];
        if (topGenRow) {
          if (!champName) {
            champName = topGenRow.name;
            champId = topGenRow.id;
          }
          if (champPts === undefined && typeof topGenRow.pts === 'number' && topGenRow.pts > 0) {
            champPts = topGenRow.pts;
          }
        }
      }

      const resolved = resolveClubFromDb(
        champId !== undefined ? champId : champName || `${normCountry} Tier ${t}`,
        normCountry,
        t,
        clubsDb,
        modActive,
        champName
      );
      const finalPts =
        typeof champPts === 'number' && champPts > 0
          ? champPts
          : getRealisticLeaguePoints(normCountry, t, year, resolved.name);
      const isUserWon =
        (hist.clubName && resolved.name.trim().toLowerCase() === hist.clubName.trim().toLowerCase()) ||
        (hist.clubId !== undefined && resolved.id !== undefined && String(hist.clubId) === String(resolved.id));

      entries.push({
        id: `live-league-${normCountry}-t${t}-${year}`,
        year,
        country: normCountry,
        tier: t,
        competitionType: 'league',
        competitionName: leagueInfo.name,
        clubId: resolved.id,
        clubName: resolved.name,
        clubColor: resolved.color,
        clubLogo: resolved.logo,
        clubFallbackLogo: resolved.fallbackLogo,
        coachName: resolveCoach(resolved.name, resolved.id, normCountry),
        points: finalPts,
        statusLabel: `${finalPts} PTS`,
        source: 'Live',
        subtitle: `Tier ${t} • Live`,
        isUserClub: Boolean(isUserWon),
      });
    }
  }

  // 2. Cup Winners from movements / resolvedMatchContext
  const cupFinals = hist.resolvedMatchContext?.cupFinals || {};

  // National Cup for normCountry
  if (competition === 'nat_cup' || competition === 'all') {
    const cupInfo = getDomesticCupInfo(normCountry, 1);
    let natWinnerName: string | undefined;
    let natWinnerId: string | number | undefined;
    if (
      normCountry === histCountry &&
      cupFinals['nat_cup']?.winnerName &&
      !isNameOrIdReserve(cupFinals['nat_cup'].winnerName, cupFinals['nat_cup'].winnerId)
    ) {
      natWinnerName = cupFinals['nat_cup'].winnerName;
      natWinnerId = cupFinals['nat_cup'].winnerId;
    } else if (
      normCountry === histCountry &&
      (hist.trophiesThisYear?.dfb || 0) > 0 &&
      !isNameOrIdReserve(hist.clubName, hist.clubId)
    ) {
      natWinnerName = hist.clubName;
      natWinnerId = hist.clubId;
    } else {
      const movNat = movements.find(
        (m) =>
          m.type === 'intl_cup' &&
          normalizeCountry(m.country || 'GER') === normCountry &&
          (String(m.id || '').includes('-cup-dfb') ||
            String(m.cupTitle || '').toLowerCase() === cupInfo.name.toLowerCase()) &&
          !isNameOrIdReserve(m.clubName, m.clubId)
      );
      if (movNat) {
        natWinnerName = movNat.clubName;
        natWinnerId = movNat.clubId;
      } else {
        // Foreign country National Cup in live season: deterministically pick from top Tier 1 clubs using year
        const t1Clubs = clubsDb
          .filter(
            (c) => normalizeCountry(c.country || 'GER') === normCountry && c.tier === 1 && !isNameOrIdReserve(c.name, c.id)
          )
          .sort((a, b) => (b.baseOvr || 75) - (a.baseOvr || 75));
        const topPool = t1Clubs.slice(0, Math.max(1, Math.min(6, t1Clubs.length)));
        if (topPool.length > 0) {
          const picked = topPool[hashSeed(`live-natcup-${careerSeedStr}-${normCountry}-${year}`) % topPool.length];
          natWinnerId = picked.id;
          natWinnerName = picked.name;
        }
      }
    }
    const resolvedNat = resolveClubFromDb(
      natWinnerId !== undefined ? natWinnerId : natWinnerName || `${normCountry} Cup-${year}`,
      normCountry,
      1,
      clubsDb,
      modActive,
      natWinnerName
    );
    entries.push({
      id: `live-natcup-${normCountry}-${year}`,
      year,
      country: normCountry,
      tier: 1,
      competitionType: 'nat_cup',
      competitionName: cupInfo.name,
      clubId: resolvedNat.id,
      clubName: resolvedNat.name,
      clubColor: resolvedNat.color,
      clubLogo: resolvedNat.logo,
      clubFallbackLogo: resolvedNat.fallbackLogo,
      coachName: resolveCoach(resolvedNat.name, resolvedNat.id, normCountry),
      statusLabel: 'WINNER',
      source: 'Live',
      subtitle: 'National Cup • Live',
      isUserClub:
        Boolean(hist.clubName && resolvedNat.name.trim().toLowerCase() === hist.clubName.trim().toLowerCase()),
    });
  }

  // Domestic Supercup for normCountry (reserve teams are strictly ineligible)
  if (competition === 'supercup' || competition === 'all') {
    const scInfo = getDomesticSupercupInfo(normCountry, modActive);
    let scWinnerName: string | undefined;
    let scWinnerId: string | number | undefined;
    let scTitle = scInfo.name;
    const scFinal = cupFinals['dom_supercup'] || cupFinals['supercup'] || cupFinals['sc'];
    if (
      normCountry === histCountry &&
      scFinal?.winnerName &&
      !isNameOrIdReserve(scFinal.winnerName, scFinal.winnerId)
    ) {
      scWinnerName = scFinal.winnerName;
      scWinnerId = scFinal.winnerId;
      if (scFinal.cupName) scTitle = scFinal.cupName;
    } else if (
      normCountry === histCountry &&
      (hist.trophiesThisYear?.sc || 0) > 0 &&
      !isNameOrIdReserve(hist.clubName, hist.clubId)
    ) {
      scWinnerName = hist.clubName;
      scWinnerId = hist.clubId;
    } else {
      const movSc = movements.find((m) => {
        if (m.type !== 'intl_cup' || normalizeCountry(m.country || 'GER') !== normCountry) return false;
        const mId = String(m.id || '').toLowerCase();
        const title = String(m.cupTitle || '').toLowerCase();
        const isEuroSc = mId.endsWith('-cup-esc') || title.includes('european supercup') || title.includes('continental supercup');
        const isDomSc =
          !isEuroSc &&
          (mId.endsWith('-cup-sc') ||
            title.includes('supercup') ||
            title.includes('super cup') ||
            title.includes('supercopa') ||
            title.includes('trophée des champions'));
        return isDomSc && !isNameOrIdReserve(m.clubName, m.clubId);
      });
      if (movSc) {
        scWinnerName = movSc.clubName;
        scWinnerId = movSc.clubId;
        if (movSc.cupTitle) scTitle = movSc.cupTitle;
      } else {
        const t1Clubs = clubsDb
          .filter(
            (c) => normalizeCountry(c.country || 'GER') === normCountry && c.tier === 1 && !isNameOrIdReserve(c.name, c.id)
          )
          .sort((a, b) => (b.baseOvr || 75) - (a.baseOvr || 75));
        const topPool = t1Clubs.slice(0, Math.max(1, Math.min(4, t1Clubs.length)));
        if (topPool.length > 0) {
          const picked = topPool[hashSeed(`live-supercup-${careerSeedStr}-${normCountry}-${year}`) % topPool.length];
          scWinnerId = picked.id;
          scWinnerName = picked.name;
        }
      }
    }
    const resolvedSc = resolveClubFromDb(
      scWinnerId !== undefined ? scWinnerId : scWinnerName || `${normCountry} Supercup-${year}`,
      normCountry,
      1,
      clubsDb,
      modActive,
      scWinnerName
    );
    entries.push({
      id: `live-supercup-${normCountry}-${year}`,
      year,
      country: normCountry,
      tier: 1,
      competitionType: 'supercup',
      competitionName: scTitle,
      clubId: resolvedSc.id,
      clubName: resolvedSc.name,
      clubColor: resolvedSc.color,
      clubLogo: resolvedSc.logo,
      clubFallbackLogo: resolvedSc.fallbackLogo,
      coachName: resolveCoach(resolvedSc.name, resolvedSc.id, normCountry),
      statusLabel: 'WINNER',
      source: 'Live',
      subtitle: 'Supercup • Live',
      isUserClub:
        Boolean(hist.clubName && resolvedSc.name.trim().toLowerCase() === hist.clubName.trim().toLowerCase()),
    });
  }

  // Regional Cup for normCountry (reserve teams are strictly ineligible to win Regional Cups)
  if (competition === 'reg_cup' || competition === 'all') {
    const maxT = getMaxTier(normCountry);
    const regTier = Math.min(maxT, 4);
    let regWinnerName: string | undefined;
    let regWinnerId: string | number | undefined;
    if (normCountry === histCountry && (cupFinals['reg_cup']?.winnerName || cupFinals['reg']?.winnerName)) {
      const rc = cupFinals['reg_cup'] || cupFinals['reg'];
      if (!isNameOrIdReserve(rc.winnerName, rc.winnerId)) {
        regWinnerName = rc.winnerName;
        regWinnerId = rc.winnerId;
      }
    } else if (
      normCountry === histCountry &&
      (hist.trophiesThisYear?.reg || 0) > 0 &&
      !isNameOrIdReserve(hist.clubName, hist.clubId)
    ) {
      regWinnerName = hist.clubName;
      regWinnerId = hist.clubId;
    }

    if (!regWinnerName && regWinnerId === undefined) {
      const movReg = movements.find(
        (m) =>
          m.type === 'intl_cup' &&
          normalizeCountry(m.country || 'GER') === normCountry &&
          (String(m.id || '').includes('-cup-reg') ||
            String(m.cupTitle || '').toLowerCase().includes('regional') ||
            String(m.cupTitle || '').toLowerCase().includes('amateur')) &&
          !isNameOrIdReserve(m.clubName, m.clubId)
      );
      if (movReg) {
        regWinnerName = movReg.clubName;
        regWinnerId = movReg.clubId;
      } else {
        const regClubs = clubsDb.filter(
          (c) =>
            normalizeCountry(c.country || 'GER') === normCountry &&
            c.tier >= regTier &&
            !isNameOrIdReserve(c.name, c.id)
        );
        const allCountryNonReserve = clubsDb
          .filter((c) => normalizeCountry(c.country || 'GER') === normCountry && !isNameOrIdReserve(c.name, c.id))
          .sort((a, b) => (a.baseOvr || 70) - (b.baseOvr || 70));
        const fallbackPool =
          maxT === 1 && allCountryNonReserve.length > 2
            ? allCountryNonReserve.slice(0, Math.max(2, Math.ceil(allCountryNonReserve.length * 0.6)))
            : regClubs.length > 0
              ? regClubs
              : allCountryNonReserve;
        if (fallbackPool.length > 0) {
          const picked = fallbackPool[hashSeed(`live-regcup-${careerSeedStr}-${normCountry}-${year}`) % fallbackPool.length];
          regWinnerId = picked.id;
          regWinnerName = picked.name;
        }
      }
    }
    const resolvedReg = resolveClubFromDb(
      regWinnerId !== undefined ? regWinnerId : regWinnerName || `${normCountry} Regional-${year}`,
      normCountry,
      regTier,
      clubsDb,
      modActive
    );
    const actualLiveRegTier = resolvedReg.tier || regTier;
    entries.push({
      id: `live-regcup-${normCountry}-${year}`,
      year,
      country: normCountry,
      tier: actualLiveRegTier,
      competitionType: 'reg_cup',
      competitionName: 'Regional Cup',
      clubId: resolvedReg.id,
      clubName: resolvedReg.name,
      clubColor: resolvedReg.color,
      clubLogo: resolvedReg.logo,
      clubFallbackLogo: resolvedReg.fallbackLogo,
      coachName: resolveCoach(resolvedReg.name, resolvedReg.id, normCountry),
      statusLabel: 'WINNER',
      source: 'Live',
      subtitle: `Tier ${actualLiveRegTier} • Live`,
      isUserClub:
        Boolean(hist.clubName && resolvedReg.name.trim().toLowerCase() === hist.clubName.trim().toLowerCase()),
    });
  }

  // Continental & Global Cups (CL, Euro Cup, Global Club Cup)
  const extractIntlCup = (
    compType: 'cl' | 'euro_cup' | 'cwc',
    defaultTitle: string,
    matchFn: (m: UniverseMovement) => boolean,
    ctxKey: string,
    userWonFlag: boolean
  ) => {
    let winName: string | undefined;
    let winId: string | number | undefined;
    let winCountry = normCountry;
    let title = defaultTitle;

    if (userWonFlag && !isNameOrIdReserve(hist.clubName, hist.clubId)) {
      winName = hist.clubName;
      winId = hist.clubId;
      winCountry = histCountry;
    } else if (
      cupFinals[ctxKey]?.winnerName &&
      !isNameOrIdReserve(cupFinals[ctxKey].winnerName, cupFinals[ctxKey].winnerId)
    ) {
      winName = cupFinals[ctxKey].winnerName;
      winId = cupFinals[ctxKey].winnerId;
      title = cupFinals[ctxKey].cupName || defaultTitle;
    } else {
      const mov = movements.find(
        (m) => m.type === 'intl_cup' && matchFn(m) && !isNameOrIdReserve(m.clubName, m.clubId)
      );
      if (mov) {
        winName = mov.clubName;
        winId = mov.clubId;
        winCountry = normalizeCountry(mov.country || 'GER');
        title = mov.cupTitle || defaultTitle;
      } else {
        const euroTier1 = (clubsDb.length > 0 ? clubsDb : ALL_CLUBS)
          .filter((c) => c.tier === 1 && !isNameOrIdReserve(c.name, c.id))
          .sort((a, b) => (b.baseOvr || 75) - (a.baseOvr || 75));
        const poolSlice =
          compType === 'euro_cup'
            ? euroTier1.slice(Math.min(6, Math.max(0, euroTier1.length - 1)), Math.max(8, Math.min(24, euroTier1.length)))
            : euroTier1.slice(0, Math.max(1, Math.min(12, euroTier1.length)));
        const finalPool = poolSlice.length > 0 ? poolSlice : euroTier1;
        if (finalPool.length > 0) {
          const picked = finalPool[hashSeed(`live-intl-${compType}-${careerSeedStr}-${year}`) % finalPool.length];
          winId = picked.id;
          winName = picked.name;
          winCountry = normalizeCountry(picked.country || 'GER');
        }
      }
    }

    const resolved = resolveClubFromDb(
      winId !== undefined ? winId : winName || 'THW Kiel',
      winCountry,
      1,
      clubsDb,
      modActive
    );
    entries.push({
      id: `live-${compType}-${year}`,
      year,
      country: resolved.country,
      tier: 1,
      competitionType: compType,
      competitionName: title,
      clubId: resolved.id,
      clubName: resolved.name,
      clubColor: resolved.color,
      clubLogo: resolved.logo,
      clubFallbackLogo: resolved.fallbackLogo,
      coachName: resolveCoach(resolved.name, resolved.id, resolved.country),
      statusLabel: 'WINNER',
      source: 'Live',
      subtitle: `${getCountryFlag(resolved.country)} ${resolved.country} • ${compType === 'cwc' ? 'Global' : 'Continental'} • Live`,
      isUserClub:
        Boolean(hist.clubName && resolved.name.trim().toLowerCase() === hist.clubName.trim().toLowerCase()),
    });
  };

  if (competition === 'cl' || competition === 'all') {
    extractIntlCup(
      'cl',
      modActive ? 'EHF Champions League' : 'Champions Cup',
      (m) =>
        String(m.id || '').endsWith('-cup-cl') ||
        String(m.cupTitle || '').toLowerCase().includes('champions league') ||
        String(m.cupTitle || '').toLowerCase().includes('champions cup'),
      'cl',
      Boolean((hist.trophiesThisYear?.cl || 0) > 0)
    );
  }

  if (competition === 'euro_cup' || competition === 'all') {
    extractIntlCup(
      'euro_cup',
      modActive ? 'EHF European League' : 'Euro Cup',
      (m) =>
        String(m.id || '').endsWith('-cup-el') ||
        String(m.id || '').endsWith('-cup-ecl') ||
        String(m.cupTitle || '').toLowerCase().includes('european league') ||
        String(m.cupTitle || '').toLowerCase().includes('european cup') ||
        String(m.cupTitle || '').toLowerCase().includes('ehf cup'),
      'el',
      Boolean((hist.trophiesThisYear?.el || 0) > 0 || (hist.trophiesThisYear?.ecl || 0) > 0)
    );
  }

  if (competition === 'cwc' || competition === 'all') {
    extractIntlCup(
      'cwc',
      modActive ? 'IHF Super Globe' : 'Global Club Cup',
      (m) =>
        String(m.id || '').endsWith('-cup-cwc') ||
        String(m.cupTitle || '').toLowerCase().includes('super globe') ||
        String(m.cupTitle || '').toLowerCase().includes('global club') ||
        String(m.cupTitle || '').toLowerCase().includes('world'),
      'cwc',
      Boolean((hist.trophiesThisYear?.cwc || 0) > 0)
    );
  }

  return entries;
}

// ============================================================================
// MAIN ALMANAC QUERY FUNCTION
// ============================================================================
export interface GetAlmanacParams {
  state: GameState;
  clubsDb: Club[];
  country: string;
  tier: number | 'all';
  year: number | 'all';
  competition: AlmanacCompetitionFilter;
}

export function hasResolvedCurrentYearSupercup(state: GameState): boolean {
  if (!state || typeof state.year !== 'number') return false;
  if (state.supercupPlayedYear === state.year) return true;
  if ((state.pendingSupercupTrophies?.sc || 0) > 0) return true;
  const domScFinal = state.resolvedMatchContext?.cupFinals?.['dom_supercup'] || state.resolvedMatchContext?.cupFinals?.['supercup'];
  if (domScFinal?.winnerName && (!domScFinal.year || domScFinal.year === state.year)) return true;
  return (state.universeMovements || []).some((m) => {
    if (!m || m.year !== state.year || m.type !== 'intl_cup') return false;
    const idStr = String(m.id || '').toLowerCase();
    const titleStr = String(m.cupTitle || '').toLowerCase();
    return (
      idStr.endsWith('-cup-sc') ||
      idStr.includes('-cup-sc') ||
      titleStr.includes('supercup') ||
      titleStr.includes('super cup') ||
      titleStr.includes('supercopa') ||
      titleStr.includes('superpuchar') ||
      titleStr.includes('szuperkupa') ||
      titleStr.includes('supertaça') ||
      titleStr.includes('supertaca') ||
      titleStr.includes('superkup') ||
      titleStr.includes('superpokal') ||
      titleStr.includes('supercoppa') ||
      titleStr.includes('supercupa') ||
      titleStr.includes('supercupen') ||
      titleStr.includes('trophée des champions') ||
      titleStr.includes('trophee des champions') ||
      titleStr.includes('meistarakeppni')
    );
  });
}

export function getAlmanacAvailableYears(state: GameState): number[] {
  const careerStartYear = getCareerStartYear(state);
  const historyYears = (state.history || []).map((h) => h.year);
  const maxHistoryYear = historyYears.length > 0 ? Math.max(...historyYears) : careerStartYear - 1;
  const includeCurrentPreSeasonYear =
    typeof state.year === 'number' &&
    state.year >= careerStartYear &&
    hasResolvedCurrentYearSupercup(state);
  const topYear = Math.max(
    maxHistoryYear,
    careerStartYear - 1,
    includeCurrentPreSeasonYear ? state.year : careerStartYear - 1
  );
  const years: number[] = [];
  for (let y = topYear; y >= 1950; y--) {
    years.push(y);
  }
  return years;
}

export function getAlmanacEntries(params: GetAlmanacParams): AlmanacEntry[] {
  const { state, clubsDb, country, tier, year, competition } = params;
  const normCountry = normalizeCountry(country || state.club?.country || 'GER');
  const modActive = isAnyModActive();
  const careerStartYear = getCareerStartYear(state);
  const careerSeedStr = `${state.careerId || state.startClubName || state.club?.name || 'career'}-${careerStartYear}`;
  const maxTier = getMaxTier(normCountry);

  const historyByYear = new Map<number, SeasonHistory>();
  (state.history || []).forEach((h) => {
    if (typeof h.year === 'number') {
      historyByYear.set(h.year, h);
    }
  });

  const allAvailableYears = getAlmanacAvailableYears(state);
  const targetYears =
    year === 'all'
      ? allAvailableYears
      : allAvailableYears.includes(year)
      ? [year]
      : year >= 1950 && year < careerStartYear
      ? [year]
      : historyByYear.has(year)
      ? [year]
      : year === state.year && hasResolvedCurrentYearSupercup(state)
      ? [year]
      : [];

  const targetTiers: number[] =
    tier === 'all'
      ? Array.from({ length: maxTier }, (_, i) => i + 1)
      : [Math.max(1, Math.min(maxTier, tier))];

  const results: AlmanacEntry[] = [];

  for (const yr of targetYears) {
    // CRITICAL RULE:
    // - Years >= careerStartYear are NEVER pre-populated from Lore. They only exist if simulated in state.history
    //   (or for the Pre-Season Supercup if already played in state.year)!
    // - Years < careerStartYear (back to 1950) are populated from Lore (unless overridden by history).
    const liveHist = historyByYear.get(yr);

    if (yr >= careerStartYear) {
      if (!liveHist) {
        if (
          yr === state.year &&
          hasResolvedCurrentYearSupercup(state) &&
          (competition === 'supercup' || competition === 'all')
        ) {
          const preSeasonHist: SeasonHistory = {
            year: state.year,
            clubName: state.club?.name || '',
            clubId: typeof state.club?.id === 'number' ? state.club.id : Number(state.club?.id) || undefined,
            country: state.club?.country || 'GER',
            tier: state.club?.tier || 1,
            ovr: state.club?.baseOvr || 75,
            relegated: false,
            promoted: false,
            wins: 0,
            draws: 0,
            losses: 0,
            pts: 0,
            pos: 1,
            gf: 0,
            ga: 0,
            att: 0,
            util: 0,
            trophiesThisYear: state.pendingSupercupTrophies?.sc ? { sc: 1 } : {},
            universeMovements: (state.universeMovements || []).filter((m) => m && m.year === state.year),
            resolvedMatchContext: state.resolvedMatchContext,
          };
          const liveScEntries = getLiveEntriesForHistorySeason(
            preSeasonHist,
            state,
            normCountry,
            clubsDb,
            modActive,
            targetTiers,
            'supercup',
            careerSeedStr
          );
          results.push(...liveScEntries);
        }
        continue;
      }
      const liveSeasonEntries = getLiveEntriesForHistorySeason(
        liveHist,
        state,
        normCountry,
        clubsDb,
        modActive,
        targetTiers,
        competition,
        careerSeedStr
      );
      results.push(...liveSeasonEntries);
    } else {
      // Historic Lore Era (1950 .. careerStartYear - 1)
      if (competition === 'league' || competition === 'all') {
        for (const t of targetTiers) {
          results.push(getLoreChampionForLeague(normCountry, t, yr, clubsDb, careerSeedStr, modActive));
        }
      }
      if (competition === 'nat_cup' || competition === 'all') {
        const natEntry = getLoreCupWinner('nat_cup', normCountry, yr, clubsDb, careerSeedStr, modActive);
        if (natEntry) results.push(natEntry);
      }
      if (competition === 'supercup' || competition === 'all') {
        const scEntry = getLoreCupWinner('supercup', normCountry, yr, clubsDb, careerSeedStr, modActive);
        if (scEntry) results.push(scEntry);
      }
      if (competition === 'reg_cup' || competition === 'all') {
        const regEntry = getLoreCupWinner('reg_cup', normCountry, yr, clubsDb, careerSeedStr, modActive);
        if (regEntry) results.push(regEntry);
      }
      if (competition === 'cl' || competition === 'all') {
        const clEntry = getLoreCupWinner('cl', normCountry, yr, clubsDb, careerSeedStr, modActive);
        if (clEntry) results.push(clEntry);
      }
      if (competition === 'euro_cup' || competition === 'all') {
        const euroEntry = getLoreCupWinner('euro_cup', normCountry, yr, clubsDb, careerSeedStr, modActive);
        if (euroEntry) results.push(euroEntry);
      }
      if (competition === 'cwc' || competition === 'all') {
        const cwcEntry = getLoreCupWinner('cwc', normCountry, yr, clubsDb, careerSeedStr, modActive);
        if (cwcEntry) results.push(cwcEntry);
      }
    }
  }

  return results;
}

