import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import crypto from 'crypto';
import * as dotenv from 'dotenv';
dotenv.config();



import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { validateSponsorContent } from './src/utils/sponsorModeration';
import { encodeSafeLogoForMetadata, resolveLogoUrl } from './src/utils/sponsorPresets';

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? new Stripe(stripeKey) : null;

const DEFAULT_SUPABASE_URL = 'https://grrhlhhinmjglnvmmbzb.supabase.co';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseServer = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Stripe webhook requires raw body for signature verification
  app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripe || !webhookSecret || !sig) {
      return res.status(200).json({ received: true, note: 'Webhook received without active stripe/secret' });
    }

    let event: Stripe.Event | null = null;
    if (sig && webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        console.warn('Signature verification with configured secret failed, verifying via Stripe API:', err.message);
      }
    }

    // Direct Stripe API verification fallback: guarantees valid payment even if whsec signing secret is new/different
    if (!event) {
      try {
        const rawString = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body);
        const parsed = JSON.parse(rawString);
        if (parsed.type === 'checkout.session.completed' && parsed.data?.object?.id) {
          const verified = await stripe.checkout.sessions.retrieve(parsed.data.object.id);
          if (verified && (verified.payment_status === 'paid' || verified.status === 'complete')) {
            event = {
              ...parsed,
              data: { object: verified }
            } as Stripe.Event;
          }
        }
      } catch (parseErr: any) {
        console.error('Webhook verification error:', parseErr.message);
        return res.status(400).send(`Webhook Error: ${parseErr.message}`);
      }
    }

    if (!event) {
      return res.status(400).send('Unable to verify Stripe webhook authenticity');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata || {};
      const { brandName, logoUrl, linkUrl, packageType, tagline } = metadata;

      if (brandName && packageType && supabaseServer) {
        const moderation = validateSponsorContent({ brandName, tagline, linkUrl });
        if (!moderation.isValid) {
          console.warn(`[Stripe Webhook] Blocked prohibited content: ${moderation.reason}`);
          return res.json({ received: true, blocked: true, reason: moderation.reason });
        }

        const durationDays = packageType === '1_year' || packageType === '1_month' ? 365 : (packageType === '90_days' || packageType === '1_week') ? 90 : 30;
        const now = new Date();
        const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
        const resolvedLogo = resolveLogoUrl(logoUrl);
        const normalizedWebhookLink = linkUrl
          ? (linkUrl.startsWith('http://') || linkUrl.startsWith('https://') ? linkUrl : `https://${linkUrl}`)
          : 'https://footballmanagersim.com';

        try {
          const { data: existing } = await supabaseServer
            .from('press_sponsors')
            .select('id')
            .eq('brand_name', brandName)
            .eq('is_active', true)
            .gt('expires_at', now.toISOString())
            .limit(1);

          if (existing && existing.length > 0) {
            await supabaseServer
              .from('press_sponsors')
              .update({
                logo_url: resolvedLogo,
                link_url: normalizedWebhookLink,
                package_type: packageType,
                tagline: tagline || brandName,
                expires_at: expiresAt.toISOString(),
                is_active: true
              })
              .eq('id', existing[0].id);
            console.log(`[Stripe Webhook] Refreshed active sponsor: ${brandName} (${packageType})`);
          } else {
            await supabaseServer.from('press_sponsors').insert({
              brand_name: brandName,
              logo_url: resolvedLogo,
              link_url: normalizedWebhookLink,
              package_type: packageType,
              tagline: tagline || brandName,
              starts_at: now.toISOString(),
              expires_at: expiresAt.toISOString(),
              is_active: true,
            });
            console.log(`[Stripe Webhook] Successfully recorded sponsor: ${brandName} (${packageType})`);
          }
        } catch (dbErr) {
          console.error('[Stripe Webhook] Error writing sponsor to Supabase:', dbErr);
        }
      }
    }

    res.json({ received: true });
  });

  // Informative endpoint for browser/GET requests to /api/stripe-webhook
  app.get('/api/stripe-webhook', (req, res) => {
    res.json({
      status: 'active',
      service: 'Football Manager Sim Stripe Webhook Handler',
      method: 'POST',
      acceptedEvent: 'checkout.session.completed',
      message: 'This endpoint processes automated server-to-server webhook notifications directly from Stripe.'
    });
  });

  app.use(express.json());

  // API routes FIRST
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasStripe: Boolean(stripe),
      hasSupabase: Boolean(supabaseServer)
    });
  });

  // Create Stripe Checkout Session
  app.post('/api/create-checkout-session', async (req, res) => {
    try {
      const {
        packageType = '1_day',
        brandName,
        logoUrl,
        linkUrl,
        tagline,
        slotNumber,
        origin
      } = req.body;

      if (!brandName || !linkUrl) {
        return res.status(400).json({ error: 'brandName and linkUrl are required' });
      }

      const moderation = validateSponsorContent({ brandName, tagline, linkUrl });
      if (!moderation.isValid) {
        return res.status(400).json({ error: moderation.reason });
      }

      if (supabaseServer) {
        const nowIso = new Date().toISOString();
        if (packageType === 'free_48h') {
          const { count: freeCount, error: freeErr } = await supabaseServer
            .from('press_sponsors')
            .select('id', { count: 'exact', head: true })
            .eq('is_active', true)
            .eq('package_type', 'free_48h')
            .gt('expires_at', nowIso);

          if (!freeErr && typeof freeCount === 'number' && freeCount >= 2) {
            return res.status(409).json({
              error: 'Community Spotlight (48h free trial) slots are currently at full capacity (2/2 active slots). Please wait for a trial slot to expire or choose an Official Partner package.'
            });
          }
        } else {
          const { count: paidCount, error: countErr } = await supabaseServer
            .from('press_sponsors')
            .select('id', { count: 'exact', head: true })
            .eq('is_active', true)
            .neq('package_type', 'free_48h')
            .gt('expires_at', nowIso);

          if (!countErr && typeof paidCount === 'number' && paidCount >= 18) {
            return res.status(409).json({
              error: 'The Press Conference Wall is currently at full capacity (18/18 active paid slots). Please check back once an active sponsor slot expires.'
            });
          }
        }
      }

      const clientOrigin = origin || req.headers.origin || 'http://localhost:3000';
      const packages: Record<string, { name: string; amount: number; days: number }> = {
        '30_days': { name: '30-Day Official Partner Slot', amount: 99, days: 30 },
        '90_days': { name: '90-Day Seasonal Headline Partner Slot', amount: 249, days: 90 },
        '1_year': { name: '1-Year Annual Executive Partner Slot', amount: 499, days: 365 },
        // Legacy aliases
        '1_day': { name: '30-Day Official Partner Slot', amount: 99, days: 30 },
        '1_week': { name: '90-Day Seasonal Headline Partner Slot', amount: 249, days: 90 },
        '1_month': { name: '1-Year Annual Executive Partner Slot', amount: 499, days: 365 }
      };

      const selectedPkg = packages[packageType] || packages['30_days'];
      const safeMetadataLogo = encodeSafeLogoForMetadata(logoUrl);

      if (stripe) {
        const metadata: Record<string, string> = {
          brandName: String(brandName).substring(0, 100),
          logoUrl: safeMetadataLogo,
          linkUrl: String(linkUrl || '').substring(0, 400),
          packageType: String(packageType),
          tagline: String(tagline || brandName).substring(0, 150)
        };
        if (slotNumber) {
          metadata.slotNumber = String(slotNumber);
        }

        const slotParam = slotNumber ? `&slot=${encodeURIComponent(String(slotNumber))}` : '';
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'payment',
          line_items: [
            {
              price_data: {
                currency: 'eur',
                product_data: {
                  name: selectedPkg.name,
                  description: `Football Manager Sim - Press Conference Wall Placement (${selectedPkg.days} day${selectedPkg.days > 1 ? 's' : ''}) for ${brandName}`,
                  images: logoUrl && logoUrl.startsWith('http') && !logoUrl.startsWith('data:') ? [logoUrl] : undefined
                },
                unit_amount: selectedPkg.amount
              },
              quantity: 1
            }
          ],
          metadata,
          success_url: `${clientOrigin}/?view=leaderboard&sponsor_status=success&session_id={CHECKOUT_SESSION_ID}&brand=${encodeURIComponent(brandName)}&pkg=${packageType}${slotParam}&link=${encodeURIComponent(linkUrl)}&logo=${encodeURIComponent(safeMetadataLogo)}`,
          cancel_url: `${clientOrigin}/?view=leaderboard&sponsor_status=cancelled`
        });

        return res.json({ checkoutUrl: session.url, sessionId: session.id, isLiveStripe: true });
      } else {
        // Fallback demo mode when STRIPE_SECRET_KEY is not yet populated
        const mockSessionId = `test_session_${Date.now()}`;
        const slotParam = slotNumber ? `&slot=${encodeURIComponent(String(slotNumber))}` : '';
        const demoCheckoutUrl = `${clientOrigin}/?view=leaderboard&sponsor_status=success&session_id=${mockSessionId}&brand=${encodeURIComponent(brandName)}&logo=${encodeURIComponent(safeMetadataLogo)}&link=${encodeURIComponent(linkUrl)}&pkg=${packageType}${slotParam}&demo=true`;
        return res.json({
          checkoutUrl: demoCheckoutUrl,
          sessionId: mockSessionId,
          isLiveStripe: false,
          note: 'Stripe API key not configured; redirected via test preview flow'
        });
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ error: error.message || 'Failed to initialize payment session' });
    }
  });

  // Verify and activate sponsor after Stripe return
  app.post('/api/confirm-sponsor-session', async (req, res) => {
    try {
      const { sessionId, brandName, logoUrl, linkUrl, packageType, tagline } = req.body;

      let verifiedBrand = brandName;
      let verifiedLogo = logoUrl;
      let verifiedLink = linkUrl;
      let verifiedPackage = packageType || '30_days';
      let verifiedTagline = tagline || brandName;

      // Free 48h community spotlight bypasses Stripe
      const isFreeCommunity = packageType === 'free_48h';

      if (!isFreeCommunity) {
        if (stripe) {
          if (!sessionId || sessionId.startsWith('test_session_')) {
            return res.status(403).json({ error: 'Missing or invalid Stripe payment session' });
          }

          try {
            const session = await stripe.checkout.sessions.retrieve(sessionId);
            if (session.payment_status !== 'paid' && session.status !== 'complete') {
              return res.status(403).json({ error: 'Stripe payment has not been completed' });
            }

            if (session.metadata) {
              verifiedBrand = session.metadata.brandName || verifiedBrand;
              verifiedLogo = session.metadata.logoUrl || verifiedLogo;
              verifiedLink = session.metadata.linkUrl || verifiedLink;
              verifiedPackage = session.metadata.packageType || verifiedPackage;
              verifiedTagline = session.metadata.tagline || verifiedBrand;
            }
          } catch (sErr: any) {
            console.warn('Could not verify Stripe session:', sErr.message);
            return res.status(403).json({ error: 'Stripe session validation failed' });
          }
        }
      }

      if (!verifiedBrand) {
        return res.status(400).json({ error: 'Invalid or missing sponsor brand data' });
      }

      const moderation = validateSponsorContent({
        brandName: verifiedBrand,
        tagline: verifiedTagline,
        linkUrl: verifiedLink
      });
      if (!moderation.isValid) {
        return res.status(400).json({ error: moderation.reason });
      }

      const durationDays = isFreeCommunity
        ? 2
        : (verifiedPackage === '1_year' || verifiedPackage === '1_month' ? 365 : (verifiedPackage === '90_days' || verifiedPackage === '1_week') ? 90 : 30);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
      const finalResolvedLogo = resolveLogoUrl(verifiedLogo);
      const normalizedVerifiedLink = verifiedLink
        ? (verifiedLink.startsWith('http://') || verifiedLink.startsWith('https://') ? verifiedLink : `https://${verifiedLink}`)
        : 'https://footballmanagersim.com';

      const sponsorData = {
        brand_name: verifiedBrand,
        logo_url: finalResolvedLogo,
        link_url: normalizedVerifiedLink,
        package_type: verifiedPackage,
        tagline: verifiedTagline,
        starts_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        is_active: true
      };

      if (supabaseServer) {
        try {
          const { data: existing } = await supabaseServer
            .from('press_sponsors')
            .select('id')
            .eq('brand_name', verifiedBrand)
            .eq('is_active', true)
            .gt('expires_at', now.toISOString())
            .limit(1);

          if (existing && existing.length > 0) {
            const { data, error } = await supabaseServer
              .from('press_sponsors')
              .update(sponsorData)
              .eq('id', existing[0].id)
              .select('*')
              .single();

            if (!error && data) {
              return res.json({ success: true, sponsor: data });
            }
          } else {
            // Enforce two-pool slot limits: max 2 active free_48h slots, max 18 active paid slots
            if (isFreeCommunity) {
              const { count: freeCount, error: freeCountErr } = await supabaseServer
                .from('press_sponsors')
                .select('id', { count: 'exact', head: true })
                .eq('is_active', true)
                .eq('package_type', 'free_48h')
                .gt('expires_at', now.toISOString());

              if (!freeCountErr && typeof freeCount === 'number' && freeCount >= 2) {
                return res.status(409).json({
                  error: 'Community Spotlight (48h free trial) slots are currently at full capacity (2/2 active slots). Please wait for a trial slot to expire or choose an Official Partner package.'
                });
              }
            } else {
              const { count: paidCount, error: paidCountErr } = await supabaseServer
                .from('press_sponsors')
                .select('id', { count: 'exact', head: true })
                .eq('is_active', true)
                .neq('package_type', 'free_48h')
                .gt('expires_at', now.toISOString());

              if (!paidCountErr && typeof paidCount === 'number' && paidCount >= 18) {
                return res.status(409).json({
                  error: 'The Press Conference Wall is currently at full capacity (18/18 active paid slots).'
                });
              }
            }

            const { data, error } = await supabaseServer
              .from('press_sponsors')
              .insert(sponsorData)
              .select('*')
              .single();

            if (!error && data) {
              return res.json({ success: true, sponsor: data });
            }
          }
        } catch (dbErr) {
          console.warn('Supabase insertion error on confirmation:', dbErr);
        }
      }

      // Return verified sponsor for local client activation
      return res.json({
        success: true,
        sponsor: {
          id: `confirmed-${Date.now()}`,
          ...sponsorData,
          created_at: now.toISOString()
        }
      });
    } catch (error: any) {
      console.error('Error confirming sponsor session:', error);
      res.status(500).json({ error: error.message || 'Confirmation failed' });
    }
  });

  // Authenticated Highscore Submission with Salted Signature Verification
  const HIGHSCORE_SALT = 'FMS_AUTHENTICATED_LEADERBOARD_SALT_2026_V1';

  app.post('/api/submit-highscore', async (req, res) => {
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
      } = req.body;

      if (!managerName || !clubName || typeof score !== 'number') {
        return res.status(400).json({ error: 'Invalid score payload structure' });
      }

      // Verify salted hash signature
      const normClub = String(clubName || '').trim().toLowerCase();
      const normManager = String(managerName || '').trim().toLowerCase();
      const expectedSig = crypto
        .createHash('sha256')
        .update(`${score}:${normClub}:${normManager}:${HIGHSCORE_SALT}`)
        .digest('hex');

      if (!signature || signature !== expectedSig) {
        return res.status(403).json({ error: 'Highscore rejected: signature mismatch / unauthenticated payload' });
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
        return res.status(403).json({ error: 'Highscore rejected: non-finite or non-integer career metrics' });
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
        return res.status(403).json({
          error: 'Highscore rejected: failed server-side mathematical plausibility check against per-season ceilings'
        });
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

      return res.json({ success: true, highscore: record });
    } catch (err: any) {
      console.error('Highscore submission exception:', err);
      res.status(500).json({ error: err.message || 'Internal error' });
    }
  });

  app.post('/api/generate-career-summary', async (req, res) => {
    try {
      const {
        managerName,
        clubName,
        managedClubs,
        seasons,
        matches,
        wins,
        winPct,
        trophies,
        clTrophies,
        managerRep,
        clubRep,
        morale
      } = req.body;


      let summary = "";
      if (seasons < 5) {
          summary = `After a mere ${seasons} seasons across clubs like ${managedClubs.slice(0, 3).join(', ')}, ${managerName} packed their bags. A short-lived managerial stint that left fans scratching their heads. Their final days at ${clubName} were marred by a dressing room morale of ${morale}/100, proving they couldn't handle the heat of top-flight football.

Whether they pursue a career in television punditry or simply fade into obscurity, the streets won't remember this ${winPct}% win rate legacy.`;
      } else if (clTrophies >= 3 && winPct > 60) {
          summary = `${managerName} retires as an undisputed legend of the game. Delivering ${trophies} total trophies—including an incredible ${clTrophies} Champions League titles—they built an absolute dynasty. Finishing at ${clubName} with a ${winPct}% win rate and a peak manager reputation of ${managerRep}/100, their name will be sung in the terraces for decades.

Leaving behind a pristine dressing room atmosphere (Morale: ${morale}/100), the tactical genius steps away at the absolute pinnacle of world football. Pundits and fans alike agree: we may never see a maestro like ${managerName} again.`;
      } else if (trophies >= 10) {
          summary = `A glittering, silverware-laden career comes to an end! ${managerName} steps down after ${seasons} grueling seasons, having collected an impressive ${trophies} pieces of silverware. They depart ${clubName} leaving behind a rock-solid legacy and a dressing room morale of ${morale}/100.

While they had their critics over the years, a ${winPct}% career win rate speaks for itself. ${managerName} leaves the dugout with their head held high and a well-deserved reputation of ${managerRep}/100.`;
      } else if (winPct >= 50) {
          summary = `A highly respectable managerial run concludes. Over ${seasons} seasons and ${matches} matches, ${managerName} secured ${wins} victories (${winPct}% win rate). While they may not have shattered every historical record, their steady hand at ${clubName} leaves the club in a respectable position.

They walk away with ${trophies} trophies in the cabinet and a dressing room morale sitting at ${morale}/100. ${managerName} will be remembered as a pragmatic, dependable manager who always put the club first.`;
      } else {
          summary = `It was a bumpy, turbulent ride. ${managerName} closes out a ${seasons}-season career with a somewhat challenging ${winPct}% win rate. Despite the struggles and only ${trophies} trophies to show for it, the rollercoaster journey across clubs like ${managedClubs.slice(0, 3).join(', ')} won't be easily forgotten.

Walking out of the ${clubName} facilities for the final time, the dressing room morale lingers at ${morale}/100. It wasn't always pretty, but ${managerName} undeniably brought drama to the touchline.`;
      }

      res.json({ text: summary });
    } catch (error) {
      console.error("Error generating summary:", error);
      res.status(500).json({ error: 'Failed to generate summary' });
    }
  });

  // Feedback & Crash Report submission endpoint (recipient email kept strictly server-side, no API key required)
  const FEEDBACK_RECIPIENT_EMAIL = 'kuehnewilly@gmail.com';
  app.post('/api/feedback', async (req, res) => {
    try {
      const { type, subject, title, description, contactEmail, diagnostics, crashReport, crashLogs, timestamp } = req.body || {};
      const reportTypeLabel = type === 'feature' ? 'Feature Request' : 'Bug / Crash Report';
      const emailSubject = subject || `[FMS v2.2 ${reportTypeLabel}] ${title || 'Untitled Report'}`;
      const submittedAt = timestamp || new Date().toISOString();

      const crashSummary = crashReport
        ? `${crashReport.context || 'Crash'}: ${crashReport.message || 'Unknown error'}${
            crashReport.clubName ? ` (${crashReport.clubName}, Tier ${crashReport.tier}, Year ${crashReport.year}, Phase: ${crashReport.seasonPhase})` : ''
          }${crashReport.stack ? `\n\nStack:\n${crashReport.stack}` : ''}`
        : 'None';

      const payloadSummary = {
        to: FEEDBACK_RECIPIENT_EMAIL,
        type: reportTypeLabel,
        subject: emailSubject,
        title: title || 'Untitled Report',
        contactEmail: contactEmail || 'anonymous',
        description: description || '(No additional details provided)',
        diagnostics: diagnostics || '(No diagnostics attached)',
        crashSummary,
        crashCount: Array.isArray(crashLogs) ? crashLogs.length : (crashReport ? 1 : 0),
        timestamp: submittedAt
      };

      console.log(`[Feedback Report Routed to ${FEEDBACK_RECIPIENT_EMAIL}]:`, payloadSummary);

      // Deliver email directly to kuehnewilly@gmail.com without requiring an API key via FormSubmit AJAX
      let emailDelivered = false;
      try {
        const originHeader = req.headers.origin || 'https://footballmanagersim.com';
        const refererHeader = req.headers.referer || `${originHeader}/`;

        const formSubmitPayload: Record<string, string> = {
          _subject: emailSubject,
          _template: 'table',
          _captcha: 'false',
          Report_Type: reportTypeLabel,
          Summary: title || 'Untitled Report',
          User_Email: contactEmail || 'anonymous',
          Description: description || '(No additional details provided)',
          Diagnostics: diagnostics || '(No diagnostics attached)',
          Crash_Details: crashSummary,
          Timestamp: submittedAt
        };
        if (contactEmail && String(contactEmail).includes('@')) {
          formSubmitPayload._replyto = String(contactEmail).trim();
        }

        const relayRes = await fetch(`https://formsubmit.co/ajax/${FEEDBACK_RECIPIENT_EMAIL}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': originHeader,
            'Referer': refererHeader,
            'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (compatible; FootballManagerSim/2.2)'
          },
          body: JSON.stringify(formSubmitPayload)
        });

        emailDelivered = relayRes.ok;
      } catch (relayErr) {
        console.warn('FormSubmit relay warning:', relayErr);
      }

      res.json({ ok: true, delivered: emailDelivered });
    } catch (err) {
      console.error('Error recording feedback:', err);
      res.status(500).json({ error: 'Failed to record feedback' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
