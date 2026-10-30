import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const FEEDBACK_RECIPIENT_EMAIL = process.env.FEEDBACK_EMAIL || 'kuehnewilly@gmail.com';

async function dispatchFeedbackEmail(report: {
  reportId: string;
  submittedAt: string;
  type: string;
  title: string;
  description: string;
  stepsToReproduce?: string;
  userContact?: string;
  autoCaptured?: boolean;
  crashReport?: any;
  recentErrors?: any[];
  gameStateSnapshot?: any;
}): Promise<{ delivered: boolean; channel: string }> {
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

  // Server-side zero-API-key email relay to kuehnewilly@gmail.com (email remains strictly hidden on the server)
  try {
    const appOrigin = process.env.APP_URL || 'https://handballmanagersim.com';
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
    const data: any = await formSubmitRes.json().catch(() => ({}));
    if (formSubmitRes.ok && (data.success === 'true' || data.success === true)) {
      return { delivered: true, channel: 'formsubmit-relay' };
    }
    console.info('FormSubmit response:', data?.message || formSubmitRes.status);
    return { delivered: formSubmitRes.ok, channel: 'formsubmit-relay' };
  } catch (err) {
    console.warn('FormSubmit relay fallback:', err);
  }

  return { delivered: false, channel: 'server-log' };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '1mb' }));

  // Feedback & Crash Report endpoint (recipient email is strictly hidden on the backend)
  app.post(['/api/feedback', '/.netlify/functions/feedback'], async (req, res) => {
    try {
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
      } = req.body || {};

      const cleanTitle = String(title || '').trim().slice(0, 200) || 'Untitled Report';
      const cleanDescription = String(description || '').trim().slice(0, 5000);

      if (!cleanTitle && !cleanDescription && !crashReport) {
        return res.status(400).json({ error: 'Report title, description, or crash dump is required.' });
      }

      const reportId = `HMS-${Date.now().toString(36).toUpperCase()}-${Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase()}`;
      const submittedAt = new Date().toISOString();

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

      // Persist report locally on server so no crash or feature request is ever lost
      try {
        const logFile = path.join(process.cwd(), 'feedback-submissions.jsonl');
        fs.appendFileSync(logFile, JSON.stringify(reportRecord) + '\n', 'utf8');
      } catch (fsErr) {
        console.warn('Could not write feedback log file:', fsErr);
      }

      const dispatchResult = await dispatchFeedbackEmail(reportRecord);

      return res.json({
        ok: true,
        reportId,
        submittedAt,
        status: dispatchResult.delivered ? 'dispatched' : 'recorded',
      });
    } catch (error: any) {
      console.error('Error processing feedback report:', error);
      return res.status(500).json({ error: 'Failed to process feedback report' });
    }
  });

  // AI Summary endpoint
  app.post('/api/generate-career-summary', async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
      }

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

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `You are an elite, slightly dramatic sports journalist (like Fabrizio Romano or a top pundit) writing a final career retrospective for a retiring Handball Manager named ${managerName}.
      
      Here are the manager's career stats:
      - Final Club: ${clubName}
      - All Clubs Managed: ${managedClubs?.join(', ') || clubName}
      - Seasons Managed: ${seasons}
      - Matches Played: ${matches}
      - Wins: ${wins} (Win %: ${winPct}%)
      - Total Trophies: ${trophies}
      - Champions League Titles: ${clTrophies}
      - Final Manager Reputation: ${managerRep}/100
      - Final Club Reputation: ${clubRep}/100
      - Final Club Morale: ${morale}%

      Write a short, engaging 2-3 sentence verdict summing up their legacy. 
      If they were highly successful (high win %, many trophies, high rep), praise them as a tactical genius and a legend.
      If they failed quickly (low seasons, low rep, fired/low morale), roast them for being out of their depth.
      If they were mediocre, describe a forgettable, mid-table career.
      
      Do NOT use bullet points or markdown. Keep it to a single paragraph. Make it sound like a real sports journalist.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error('Error generating summary:', error);
      res.status(500).json({ error: 'Failed to generate summary' });
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
