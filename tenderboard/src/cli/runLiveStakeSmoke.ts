import { loadTenderBoardConfig } from '../live/config.js';
import { loadDotEnvFile } from '../live/dotenv.js';
import { executeOpenStakePosition, executeSlashStake } from '../sui/stakeExecutor.js';

const DEFAULT_STAKE_MIST = '1000000';
const DEFAULT_SLASH_MIST = '100000';

async function main(): Promise<void> {
  loadDotEnvFile();
  const config = loadTenderBoardConfig();
  if (config.mode !== 'sui') {
    throw new Error('Live stake smoke requires TENDERBOARD_MODE=sui.');
  }

  const workerAgentId = config.workerAgentId;
  const opened = await executeOpenStakePosition(
    {
      workerAgentId,
      amountMist: process.env.TENDERBOARD_STAKE_SMOKE_MIST ?? DEFAULT_STAKE_MIST,
    },
    config,
  );
  const slashed = await executeSlashStake(
    {
      positionId: opened.stakePositionId,
      evidenceHash: 'sha256:forged-record-smoke',
      reason: 'demo challenge: forged record did not match Walrus readback',
      slashAmountMist: process.env.TENDERBOARD_SLASH_SMOKE_MIST ?? DEFAULT_SLASH_MIST,
    },
    config,
  );

  console.log(
    JSON.stringify(
      {
        objectType: 'walrusproof.live_stake_slash_smoke.v1',
        ok: true,
        workerAgentId,
        packageId: config.suiPackageId,
        stakePositionId: opened.stakePositionId,
        openedStakeMist: process.env.TENDERBOARD_STAKE_SMOKE_MIST ?? DEFAULT_STAKE_MIST,
        slashedMist: process.env.TENDERBOARD_SLASH_SMOKE_MIST ?? DEFAULT_SLASH_MIST,
        openDigest: opened.digest,
        slashDigest: slashed.digest,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
