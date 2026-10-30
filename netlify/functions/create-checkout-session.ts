import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { validateSponsorContent } from '../../src/utils/sponsorModeration';
import { encodeSafeLogoForMetadata } from '../../src/utils/sponsorPresets';

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
    const {
      packageType = '30_days',
      brandName,
      logoUrl = '',
      linkUrl,
      tagline,
      slotNumber,
      origin = 'https://footballmanagersim.com'
    } = JSON.parse(event.body || '{}');

    if (!brandName || !linkUrl) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'brandName and linkUrl are required' })
      };
    }

    const moderation = validateSponsorContent({ brandName, tagline, linkUrl });
    if (!moderation.isValid) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: moderation.reason, autoFiltered: true })
      };
    }

    // Two-Pool Capacity Check: Up to 18 active paid sponsors, max 2 active free_48h sponsors
    if (supabase) {
      const nowIso = new Date().toISOString();
      if (packageType === 'free_48h') {
        const { count: freeCount, error: freeErr } = await supabase
          .from('press_sponsors')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true)
          .eq('package_type', 'free_48h')
          .gt('expires_at', nowIso);

        if (!freeErr && typeof freeCount === 'number' && freeCount >= 2) {
          return {
            statusCode: 409,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              error: 'Community Spotlight (48h free trial) slots are currently at full capacity (2/2 active slots). Please wait for a trial slot to expire or choose an Official Partner package.'
            })
          };
        }
      } else {
        const { count: paidCount, error: countErr } = await supabase
          .from('press_sponsors')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true)
          .neq('package_type', 'free_48h')
          .gt('expires_at', nowIso);

        if (!countErr && typeof paidCount === 'number' && paidCount >= 18) {
          return {
            statusCode: 409,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              error: 'The Press Conference Wall is currently at full capacity (18/18 active paid slots). No new slots can be purchased until an active slot expires.'
            })
          };
        }
      }
    }

    if (!stripe) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Stripe secret key is not configured on the server' })
      };
    }

    const packages: Record<string, { name: string; amount: number; days: number }> = {
      '30_days': { name: '30-Day Official Partner Slot', amount: 99, days: 30 },
      '90_days': { name: '90-Day Seasonal Headline Partner Slot', amount: 249, days: 90 },
      '1_year': { name: '1-Year Annual Executive Partner Slot', amount: 499, days: 365 },
      '1_day': { name: '30-Day Official Partner Slot', amount: 99, days: 30 },
      '1_week': { name: '90-Day Seasonal Headline Partner Slot', amount: 249, days: 90 },
      '1_month': { name: '1-Year Annual Executive Partner Slot', amount: 499, days: 365 }
    };

    const selectedPkg = packages[packageType] || packages['30_days'];
    const safeMetadataLogo = encodeSafeLogoForMetadata(logoUrl);

    const metadata: Record<string, string> = {
      brandName: String(brandName).substring(0, 100),
      logoUrl: safeMetadataLogo,
      linkUrl: String(linkUrl).substring(0, 400),
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
              description: `Football Manager Sim - Press Placement (${selectedPkg.days} day${selectedPkg.days > 1 ? 's' : ''}) for ${brandName}`,
              images: logoUrl && logoUrl.startsWith('http') && !logoUrl.startsWith('data:') ? [logoUrl] : undefined
            },
            unit_amount: selectedPkg.amount
          },
          quantity: 1
        }
      ],
      metadata,
      success_url: `${origin}/?view=leaderboard&sponsor_status=success&session_id={CHECKOUT_SESSION_ID}&brand=${encodeURIComponent(
        brandName
      )}&pkg=${packageType}${slotParam}&link=${encodeURIComponent(linkUrl)}&logo=${encodeURIComponent(safeMetadataLogo)}`,
      cancel_url: `${origin}/?view=leaderboard&sponsor_status=cancelled`
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ checkoutUrl: session.url, sessionId: session.id, isLiveStripe: true })
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Failed to create checkout session' })
    };
  }
};
