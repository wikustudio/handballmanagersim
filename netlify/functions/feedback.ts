const FEEDBACK_RECIPIENT_EMAIL = 'kuehnewilly@gmail.com';

export const handler = async (event: any) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { type, subject, title, description, contactEmail, diagnostics, crashReport, crashLogs, timestamp } = body;

    const reportTypeLabel = type === 'feature' ? 'Feature Request' : 'Bug / Crash Report';
    const emailSubject = subject || `[FMS v2.2 ${reportTypeLabel}] ${title || 'Untitled Report'}`;
    const submittedAt = timestamp || new Date().toISOString();

    const crashSummary = crashReport
      ? `${crashReport.context || 'Crash'}: ${crashReport.message || 'Unknown error'}${
          crashReport.clubName ? ` (${crashReport.clubName}, Tier ${crashReport.tier}, Year ${crashReport.year}, Phase: ${crashReport.seasonPhase})` : ''
        }${crashReport.stack ? `\n\nStack:\n${crashReport.stack}` : ''}`
      : 'None';

    console.log(`[Feedback Report Routed to ${FEEDBACK_RECIPIENT_EMAIL}]:`, {
      to: FEEDBACK_RECIPIENT_EMAIL,
      type: reportTypeLabel,
      subject: emailSubject,
      title: title || 'Untitled Report',
      contactEmail: contactEmail || 'anonymous',
      crashCount: Array.isArray(crashLogs) ? crashLogs.length : (crashReport ? 1 : 0),
      timestamp: submittedAt
    });

    let emailDelivered = false;
    try {
      const headers = event.headers || {};
      const originHeader = headers.origin || headers.Origin || 'https://footballmanagersim.com';
      const refererHeader = headers.referer || headers.Referer || `${originHeader}/`;

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
          'User-Agent': headers['user-agent'] || 'Mozilla/5.0 (compatible; FootballManagerSim/2.2)'
        },
        body: JSON.stringify(formSubmitPayload)
      });

      emailDelivered = relayRes.ok;
    } catch (relayErr) {
      console.warn('FormSubmit relay warning:', relayErr);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ ok: true, delivered: emailDelivered })
    };
  } catch (err: any) {
    console.error('Error recording feedback:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to record feedback' })
    };
  }
};
