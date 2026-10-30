import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { validateSponsorContent } from '../../src/utils/sponsorModeration';
import { resolveLogoUrl } from '../../src/utils/sponsorPresets';

const DEFAULT_SUPABASE_URL = 'https://grrhlhhinmjglnvmmbzb.supabase.co';

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? new Stripe(stripeKey) : null;

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = (supabaseUrl && supabaseServiceRoleKey)
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null;

export const handler = async (event: any) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { sessionId, brandName, logoUrl, linkUrl, packageType, tagline } = JSON.parse(event.body || '{}');

    let verifiedBrand = brandName;
    let verifiedLogo = logoUrl;
    let verifiedLink = linkUrl;
    let verifiedPackage = packageType || '30_days';
    let verifiedTagline = tagline || brandName;

    const isFreeCommunity = verifiedPackage === 'free_48h';

    if (!isFreeCommunity) {
      if (!stripe || !sessionId || sessionId.startsWith('test_session_')) {
        return {
          statusCode: 403,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Missing or invalid Stripe payment session' })
        };
      }
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.payment_status !== 'paid' && session.status !== 'complete') {
          return {
            statusCode: 403,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Stripe payment has not been completed' })
          };
        }
        const meta = session.metadata || {};
        if (meta.brandName) verifiedBrand = meta.brandName;
        if (meta.logoUrl) verifiedLogo = meta.logoUrl;
        if (meta.linkUrl) verifiedLink = meta.linkUrl;
        if (meta.packageType) verifiedPackage = meta.packageType;
        if (meta.tagline) verifiedTagline = meta.tagline;
      } catch (err: any) {
        console.warn('Could not verify Stripe session:', err.message);
        return {
          statusCode: 403,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Stripe session validation failed' })
        };
      }
    }

    if (!verifiedBrand) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid or missing sponsor brand data' })
      };
    }

    // Auto-filter guard: Non-negotiably block weapons, politics, nudity, drugs, and profanity
    const moderation = validateSponsorContent({
      brandName: verifiedBrand,
      tagline: verifiedTagline,
      linkUrl: verifiedLink
    });
    if (!moderation.isValid) {
      console.warn(`[Confirm Session] Auto-Filter blocked prohibited sponsor: ${moderation.reason}`);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: moderation.reason, autoFiltered: true, blocked: true })
      };
    }

    const durationDays = isFreeCommunity
      ? 2
      : (verifiedPackage === '1_year' || verifiedPackage === '1_month' ? 365 : (verifiedPackage === '90_days' || verifiedPackage === '1_week') ? 90 : 30);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const finalResolvedLogo = resolveLogoUrl(verifiedLogo);

    const newSponsor = {
      brand_name: verifiedBrand,
      logo_url: finalResolvedLogo,
      link_url: verifiedLink && verifiedLink.startsWith('http') ? verifiedLink : `https://${verifiedLink || ''}`,
      package_type: verifiedPackage,
      tagline: verifiedTagline,
      starts_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      is_active: true
    };

    if (supabase) {
      try {
        const { data: existing } = await supabase
          .from('press_sponsors')
          .select('id')
          .eq('brand_name', verifiedBrand)
          .eq('is_active', true)
          .gt('expires_at', now.toISOString())
          .limit(1);

        if (existing && existing.length > 0) {
          await supabase
            .from('press_sponsors')
            .update(newSponsor)
            .eq('id', existing[0].id);
        } else {
          if (isFreeCommunity) {
            const { count: freeCount, error: freeCountErr } = await supabase
              .from('press_sponsors')
              .select('id', { count: 'exact', head: true })
              .eq('is_active', true)
              .eq('package_type', 'free_48h')
              .gt('expires_at', now.toISOString());

            if (!freeCountErr && typeof freeCount === 'number' && freeCount >= 2) {
              return {
                statusCode: 409,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  error: 'Community Spotlight (48h free trial) slots are currently at full capacity (2/2 active slots). Please wait for a trial slot to expire or choose an Official Partner package.'
                })
              };
            }
          } else {
            const { count: paidCount, error: paidCountErr } = await supabase
              .from('press_sponsors')
              .select('id', { count: 'exact', head: true })
              .eq('is_active', true)
              .neq('package_type', 'free_48h')
              .gt('expires_at', now.toISOString());

            if (!paidCountErr && typeof paidCount === 'number' && paidCount >= 18) {
              return {
                statusCode: 409,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  error: 'The Press Conference Wall is currently at full capacity (18/18 active paid slots).'
                })
              };
            }
          }

          await supabase.from('press_sponsors').insert(newSponsor);
        }
      } catch (e: any) {
        console.warn('Supabase upsert warning:', e.message);
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ success: true, sponsor: newSponsor })
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Confirmation failed' })
    };
  }
};
