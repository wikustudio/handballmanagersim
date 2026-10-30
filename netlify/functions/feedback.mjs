const FEEDBACK_RECIPIENT_EMAIL = process.env.FEEDBACK_EMAIL || 'kuehnewilly@gmail.com';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wzoalrpjjxacjcxyveln.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || 'sb_publishable_VObfts_vuIo_Dqh3Nc_UIQ_QAgotrSb';

async function saveFeedbackToSupabase(report) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/handball_feedback`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        report_id: report.reportId,
        category: report.type,
        title: report.title,
        description: report.description,
        steps_to_reproduce: report.stepsToReproduce || null,
        user_contact: report.userContact || null,
        auto_captured: Boolean(report.autoCaptured),
        crash_message: report.crashReport?.message || null,
        crash_stack: report.crashReport?.stack || report.crashReport?.componentStack || null,
        game_state: {
          snapshot: report.gameStateSnapshot || null,
          crashReport: report.crashReport || null,
          recentErrors: report.recentErrors || [],
        },
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function dispatchFeedbackEmail(report) {
  const categoryLabel =
    report.type === 'crash'
      ? 'CRASH REPORT'
      : report.type === 'feature'
      ? 'FEATURE REQUEST'
      : 'BUG / FIX REPORT';

  const subject = `[Handball Manager Sim] [${categoryLabel}] ${report.title} (${report.reportId})`;

  const textLines = [
    `Report ID: ${report.reportId}`,
    `Submitted At: ${report.submittedAt}`,
    `Category: ${categoryLabel}${report.autoCaptured ? ' (Auto-Captured)' : ''}`,
    `Title: ${report.title}`,
    `User Contact: ${report.userContact || 'Not provided'}`,
    '',
    '--- DESCRIPTION ---',
    report.description || 'No additional description provided.',
  ];

  if (report.stepsToReproduce) {
    textLines.push('', '--- STEPS TO REPRODUCE ---', report.stepsToReproduce);
  }

  if (report.crashReport) {
    textLines.push(
      '',
      '--- CAPTURED CRASH / ERROR DUMP ---',
      `Timestamp: ${report.crashReport.timestamp || 'N/A'}`,
      `Source: ${report.crashReport.source || 'runtime'}`,
      `Message: ${report.crashReport.message || 'Unknown error'}`,
      report.crashReport.stack ? `Stack Trace:\n${report.crashReport.stack}` : '',
      report.crashReport.componentStack
        ? `Component Stack:\n${report.crashReport.componentStack}`
        : ''
    );
  }

  if (report.gameStateSnapshot) {
    textLines.push(
      '',
      '--- GAME STATE DIAGNOSTIC SNAPSHOT ---',
      JSON.stringify(report.gameStateSnapshot, null, 2)
    );
  }

  if (Array.isArray(report.recentErrors) && report.recentErrors.length > 0) {
    textLines.push(
      '',
      '--- RECENT SESSION ERRORS ---',
      JSON.stringify(report.recentErrors.slice(0, 5), null, 2)
    );
  }

  const plainBody = textLines.filter(Boolean).join('\n');

  try {
    const appOrigin = process.env.URL || process.env.APP_URL || 'https://handballmanagersim.com';
    const formSubmitRes = await fetch(
      `https://formsubmit.co/ajax/${FEEDBACK_RECIPIENT_EMAIL}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Origin: appOrigin,
          Referer: `${appOrigin}/`,
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
        body: JSON.stringify({
          _subject: subject,
          _template: 'box',
          _captcha: 'false',
          report_id: report.reportId,
          category: categoryLabel,
          title: report.title,
          description: report.description,
          user_contact: report.userContact || 'Anonymous',
          crash_message: report.crashReport?.message || 'None',
          crash_stack: report.crashReport?.stack || 'None',
          game_state: report.gameStateSnapshot
            ? JSON.stringify(report.gameStateSnapshot)
            : 'Not attached',
          full_report: plainBody,
        }),
      }
    );

    const data = await formSubmitRes.json().catch(() => ({}));
    if (formSubmitRes.ok && (data.success === 'true' || data.success === true)) {
      return { delivered: true, channel: 'formsubmit-relay' };
    }
    console.info('FormSubmit response:', data?.message || formSubmitRes.status);
    return { delivered: formSubmitRes.ok, channel: 'formsubmit-relay' };
  } catch (err) {
    console.warn('FormSubmit relay error:', err);
    return { delivered: false, channel: 'function-log' };
  }
}

export const handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const parsedBody = event.body ? JSON.parse(event.body) : {};
    const {
      type = 'bug',
      title = '',
      description = '',
      stepsToReproduce,
      userContact,
      autoCaptured = false,
      crashReport = null,
      recentErrors = [],
      gameStateSnapshot = null,
      reportId: incomingReportId,
      submittedAt: incomingSubmittedAt,
      skipSupabaseInsert = false,
    } = parsedBody;

    const cleanTitle = String(title || '').trim().slice(0, 200) || 'Untitled Report';
    const cleanDescription = String(description || '').trim().slice(0, 5000);

    if (!cleanTitle && !cleanDescription && !crashReport) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Report title, description, or crash dump is required.' }),
      };
    }

    const reportId =
      incomingReportId ||
      `HMS-${Date.now().toString(36).toUpperCase()}-${Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase()}`;
    const submittedAt = incomingSubmittedAt || new Date().toISOString();

    const reportRecord = {
      reportId,
      submittedAt,
      type: ['crash', 'bug', 'feature'].includes(type) ? type : 'bug',
      title: cleanTitle,
      description: cleanDescription,
      stepsToReproduce: stepsToReproduce ? String(stepsToReproduce).slice(0, 2000) : undefined,
      userContact: userContact ? String(userContact).slice(0, 150) : undefined,
      autoCaptured: Boolean(autoCaptured),
      crashReport,
      recentErrors: Array.isArray(recentErrors) ? recentErrors.slice(0, 10) : [],
      gameStateSnapshot,
    };

    // Log in Netlify function logs as durable backup
    console.info('[HMS Feedback Report]', JSON.stringify(reportRecord));

    const [supabaseSaved, dispatchResult] = await Promise.all([
      skipSupabaseInsert ? Promise.resolve(true) : saveFeedbackToSupabase(reportRecord),
      dispatchFeedbackEmail(reportRecord),
    ]);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        reportId,
        submittedAt,
        status: dispatchResult.delivered
          ? 'dispatched'
          : supabaseSaved
          ? 'saved_to_supabase'
          : 'recorded',
      }),
    };
  } catch (error) {
    console.error('Error processing feedback report in Netlify function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to process feedback report' }),
    };
  }
};
