# WalrusProofMarketReceipts

Sui Move receipt registry for WalrusProof Market proof receipts.

The full receipt and worker evidence should be stored on Walrus. This package stores the compact on-chain pointer by emitting `ReceiptAnchored` events.

## Publish

```bash
sui client publish
```

After publish, copy:

- package id to `SUI_PACKAGE_ID`
- shared `Registry` object id to `SUI_RECEIPT_REGISTRY_ID`

## Testnet Deployment

```text
Package:  0x87a14a921a1ced0d2fd410ed0d6285d1722efabaf304d6a169971b902f6152c9
Registry: 0x62b35a579149dcf50127e68f4ad00107e72df975ed57993ab5d825e0400fa1bb
Deployer: 0xb401ec7dde816354d0745fbba538674c51e5f7bcbb3816305df538f32d9c7727
Smoke anchor tx: 3Yr14XHTAGLvHVa6RABeFsPXbxe2DRhhW5qZjRmhgmz8
```

## Anchor

From the TypeScript app:

```bash
npm run sui:anchor-plan <run-id> <walrus-blob-id>
```

Then run the generated `sui client call`.

Do not claim deployed Sui anchoring until this package has been published and at least one receipt has been anchored on testnet or mainnet.
