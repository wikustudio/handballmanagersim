import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
