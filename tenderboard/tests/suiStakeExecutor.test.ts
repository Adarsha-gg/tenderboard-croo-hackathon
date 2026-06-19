import { describe, expect, it } from 'vitest';
import type { TenderBoardConfig } from '../src/live/types.js';
import {
  buildOpenStakePositionCliArgs,
  buildSlashStakeCliArgs,
  parseStakePositionObjectId,
} from '../src/sui/stakeExecutor.js';
import { textToHexBytes } from '../src/sui/anchorExecutor.js';

describe('Sui reputation stake executor', () => {
  it('builds a PTB that opens a worker stake position with SUI', () => {
    const args = buildOpenStakePositionCliArgs(
      { workerAgentId: 'sui_opportunity_scout', amountMist: '1000000' },
      sampleConfig(),
    );

    expect(args.slice(0, 6)).toEqual(['client', '--client.config', 'client.yaml', 'ptb', '--make-move-vec', '<u8>']);
    expect(args).toContain('[115,117,105,95,111,112,112,111,114,116,117,110,105,116,121,95,115,99,111,117,116]');
    expect(args).toContain('--split-coins');
    expect(args).toContain('[1000000]');
    expect(args).toContain('--move-call');
    expect(args).toContain('0xpackage::reputation_stake::open_position');
    expect(args.at(-1)).toBe('--json');
  });

  it('builds a challenge slash call with evidence hash and reason encoded as bytes', () => {
    const args = buildSlashStakeCliArgs(
      {
        positionId: '0xstake',
        evidenceHash: 'sha256:evidence',
        reason: 'forged Walrus record',
        slashAmountMist: '100000',
      },
      sampleConfig(),
    );
    const moveArgs = args.slice(args.indexOf('--args') + 1, args.indexOf('--gas-budget'));

    expect(args).toContain('challenge_and_slash');
    expect(moveArgs).toEqual([
      '0xstake',
      textToHexBytes('sha256:evidence'),
      textToHexBytes('forged Walrus record'),
      '100000',
    ]);
  });

  it('extracts the created StakePosition id from Sui JSON output', () => {
    const objectId = parseStakePositionObjectId(
      {
        objectChanges: [
          { type: 'created', objectType: '0xpackage::other::Thing', objectId: '0xnope' },
          { type: 'created', objectType: '0xpackage::reputation_stake::StakePosition', objectId: '0xstake' },
        ],
      },
      sampleConfig(),
    );

    expect(objectId).toBe('0xstake');
  });
});

function sampleConfig(): TenderBoardConfig {
  return {
    suiPackageId: '0xpackage',
    suiClientConfig: 'client.yaml',
  } as TenderBoardConfig;
}
