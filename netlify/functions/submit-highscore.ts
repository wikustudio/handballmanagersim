import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://grrhlhhinmjglnvmmbzb.supabase.co';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseServer = (supabaseUrl && supabaseServiceRoleKey)
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null;

const HIGHSCORE_SALT = 'FMS_AUTHENTICATED_LEADERBOARD_SALT_2026_V1';

export const handler = async (event: any) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const {
      managerName,
      clubName,
      score,
      trophies,
      seasonsPlayed = 35,
      trophiesWon = trophies ?? 0,
      careerWins = 0,
      date,
      start_tier,
      signature
    } = JSON.parse(event.body || '{}');

    if (!managerName || !clubName || typeof score !== 'number') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid score payload structure' })
      };
    }

    // Verify salted hash signature
    const normClub = String(clubName || '').trim().toLowerCase();
    const normManager = String(managerName || '').trim().toLowerCase();
    const expectedSig = crypto
      .createHash('sha256')
      .update(`${score}:${normClub}:${normManager}:${HIGHSCORE_SALT}`)
      .digest('hex');

    if (!signature || signature !== expectedSig) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Highscore rejected: signature mismatch / unauthenticated payload' })
      };
    }

    // Server-side mathematical plausibility check:
    // Verify score, seasonsPlayed, trophiesWon, and careerWins are finite integers within realistic per-season ceilings
    const numScore = Number(score);
    const numSeasons = Number(seasonsPlayed ?? 35);
    const numTrophies = Number(trophiesWon ?? trophies ?? 0);
    const numWins = Number(careerWins ?? 0);

    const areFiniteIntegers =
      Number.isFinite(numScore) && Number.isInteger(numScore) &&
      Number.isFinite(numSeasons) && Number.isInteger(numSeasons) &&
      Number.isFinite(numTrophies) && Number.isInteger(numTrophies) &&
      Number.isFinite(numWins) && Number.isInteger(numWins);

    if (!areFiniteIntegers) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Highscore rejected: non-finite or non-integer career metrics' })
      };
    }

    // Realistic per-season ceilings (Standard Career max = 35 seasons; up to 6 trophies/season, 45 wins/season, 65,000 pts/season)
    const withinSeasonBounds = numSeasons >= 1 && numSeasons <= 35;
    const maxPlausibleTrophies = Math.min(210, numSeasons * 6);
    const maxPlausibleWins = numSeasons * 45;
    const maxPlausibleScore = Math.min(2000000, numSeasons * 65000);

    if (
      !withinSeasonBounds ||
      numScore < 0 || numScore > maxPlausibleScore ||
      numTrophies < 0 || numTrophies > maxPlausibleTrophies ||
      numWins < 0 || numWins > maxPlausibleWins
    ) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Highscore rejected: failed server-side mathematical plausibility check against per-season ceilings'
        })
      };
    }

    const safeScore = Math.max(0, Math.min(2000000, Math.round(numScore)));
    const safeTrophies = Math.max(0, Math.min(210, Math.round(numTrophies)));
    const safeManager = String(managerName).trim().slice(0, 50);
    const safeClub = String(clubName).trim().slice(0, 50);
    const safeDate = date || new Date().toISOString();
    const safeTier = typeof start_tier === 'number' ? Math.max(1, Math.min(11, start_tier)) : 1;

    const record = {
      managerName: safeManager,
      clubName: safeClub,
      score: safeScore,
      trophies: safeTrophies,
      date: safeDate,
      start_tier: safeTier
    };

    if (supabaseServer) {
      try {
        const { error } = await supabaseServer.from('highscores').insert(record);
        if (error) {
          console.warn('Supabase service_role highscore insert error:', error.message);
        }
      } catch (dbErr) {
        console.warn('Supabase highscore db exception:', dbErr);
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ success: true, highscore: record })
    };
  } catch (err: any) {
    console.error('Highscore submission exception:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Internal error' })
    };
  }
};
