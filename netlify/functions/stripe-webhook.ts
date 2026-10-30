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

  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret || !sig) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ received: true, note: 'Webhook received without active stripe/secret' })
    };
  }

  let stripeEvent: Stripe.Event | null = null;
  const rawBody = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;

  if (sig && webhookSecret) {
    try {
      stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err: any) {
      console.warn('Webhook signature verification with secret failed, verifying via Stripe API:', err.message);
    }
  }

  if (!stripeEvent) {
    try {
      const parsed = JSON.parse(rawBody);
      if (parsed.type === 'checkout.session.completed' && parsed.data?.object?.id) {
        const verified = await stripe.checkout.sessions.retrieve(parsed.data.object.id);
        if (verified && (verified.payment_status === 'paid' || verified.status === 'complete')) {
          stripeEvent = {
            ...parsed,
            data: { object: verified }
          } as Stripe.Event;
        }
      }
    } catch (fallbackErr: any) {
      console.error('Webhook payload parsing error:', fallbackErr);
      return { statusCode: 400, body: `Webhook Error: ${fallbackErr.message}` };
    }
  }

  if (!stripeEvent) {
    return { statusCode: 400, body: 'Unable to authenticate Stripe webhook' };
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata || {};

    const brandName = metadata.brandName || 'Official Partner';
    const logoUrl = resolveLogoUrl(metadata.logoUrl || 'tactical_lab');
    const rawLinkUrl = (metadata.linkUrl || '').trim();
    const linkUrl = rawLinkUrl
      ? (rawLinkUrl.startsWith('http://') || rawLinkUrl.startsWith('https://') ? rawLinkUrl : `https://${rawLinkUrl}`)
      : 'https://footballmanagersim.com';
    const packageType = (metadata.packageType as '30_days' | '90_days' | '1_year' | '1_day' | '1_week' | '1_month') || '30_days';
    const tagline = metadata.tagline || brandName;

    const durationDays = packageType === '1_year' || packageType === '1_month' ? 365 : (packageType === '90_days' || packageType === '1_week') ? 90 : 30;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // Auto-filter guard: Non-negotiably block weapons, politics, nudity, drugs, and profanity
    const moderation = validateSponsorContent({ brandName, tagline, linkUrl });
    if (!moderation.isValid) {
      console.warn(`[Netlify Stripe Webhook] Auto-Filter blocked prohibited sponsor: ${moderation.reason}`);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ received: true, autoFiltered: true, blocked: true, reason: moderation.reason })
      };
    }

    if (supabase) {
      try {
        const { data: existing } = await supabase
          .from('press_sponsors')
          .select('id')
          .eq('brand_name', brandName)
          .eq('is_active', true)
          .gt('expires_at', now.toISOString())
          .limit(1);

        if (existing && existing.length > 0) {
          await supabase
            .from('press_sponsors')
            .update({
              logo_url: logoUrl,
              link_url: linkUrl,
              package_type: packageType,
              tagline,
              expires_at: expiresAt.toISOString(),
              is_active: true
            })
            .eq('id', existing[0].id);
          console.log(`[Webhook] Refreshed active sponsor "${brandName}" for ${durationDays} days`);
        } else {
          await supabase.from('press_sponsors').insert({
            brand_name: brandName,
            logo_url: logoUrl,
            link_url: linkUrl,
            package_type: packageType,
            tagline,
            starts_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
            is_active: true
          });
          console.log(`[Webhook] Activated sponsor "${brandName}" for ${durationDays} days`);
        }
      } catch (dbErr: any) {
        console.error('[Webhook] Failed to persist sponsor in database:', dbErr);
      }
    }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ received: true })
  };
};
