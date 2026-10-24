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

  it('MatchdayActionDock.tsx excludes newly relegated teams from finishedInRelegationDanger & isRelegationFight', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/MatchdayActionDock.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.ok(
      content.includes('const finishedInRelegationDanger = Boolean(lastHist && !lastHist.relegated && !lastHist.promoted && lastHist.pos >= relegationLine);'),
      'MatchdayActionDock must exclude lastHist.relegated and lastHist.promoted from finishedInRelegationDanger'
    );
    assert.ok(
      content.includes('const isNewlyRelegated = Boolean(lastHist && lastHist.relegated);'),
      'MatchdayActionDock must define isNewlyRelegated'
    );
    assert.ok(
      content.includes('!isNewlyRelegated && !isProvenTopHalf && ('),
      'MatchdayActionDock must exclude isNewlyRelegated from isRelegationFight'
    );
  });
});
