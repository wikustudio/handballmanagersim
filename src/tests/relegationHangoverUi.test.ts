import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Relegation Hangover UI Fix', () => {
  it('SimulatingOverlay.tsx excludes newly relegated teams from finishedInRelegationDanger & isRelegationSeason', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/SimulatingOverlay.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.ok(
      content.includes('const finishedInRelegationDanger = Boolean(lastHist && !lastHist.relegated && !lastHist.promoted && lastHist.pos >= relegationLine);'),
      'SimulatingOverlay must exclude lastHist.relegated and lastHist.promoted from finishedInRelegationDanger'
    );
    assert.ok(
      content.includes('const isNewlyRelegated = Boolean(lastHist && lastHist.relegated);'),
      'SimulatingOverlay must define isNewlyRelegated'
    );
    assert.ok(
      content.includes('!isNewlyRelegated && !isProvenTopHalf && ('),
      'SimulatingOverlay must exclude isNewlyRelegated from isRelegationSeason'
    );
  });

  it('Dashboard.tsx excludes newly relegated teams from finishedInRelegationDanger & isRelegationDanger', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/Dashboard.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.ok(
      content.includes('lastSameClubHist && !lastSameClubHist.relegated && !lastSameClubHist.promoted && lastSameClubHist.pos >= relegationLine'),
      'Dashboard must exclude relegated and promoted seasons from finishedInRelegationDanger'
    );
    assert.ok(
      content.includes('const isNewlyRelegated = Boolean(lastSameClubHist && lastSameClubHist.relegated);'),
      'Dashboard must define isNewlyRelegated'
    );
    assert.ok(
      content.includes('!isNewlyRelegated &&') && content.includes('!isProvenTopHalf'),
      'Dashboard must exclude isNewlyRelegated and isProvenTopHalf from isRelegationDanger'
    );
  });
});
