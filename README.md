# MetalX — Metal Tokenization & Traceability Platform

A Solana / Anchor platform that turns physical precious-metal reserves into
fully-backed on-chain tokens **and** tracks each physical batch end-to-end
through its chain of custody. It pairs an institutional tokenization stack
(mint / redeem against attested vault reserves) with a provenance layer that
records every custody hop from mine to vault on chain.

> Metals supported: Gold (`xGLD`), Silver (`xSLV`), Platinum (`xPLT`),
> Palladium (`xPLD`) — all as SPL **Token-2022** mints.

---

## Architecture

MetalX follows an **off-chain-decide / on-chain-settle** split, consistent
with the sibling critical-metal traceability repos:

- **Off chain** holds the full commercial payload — assay certificates, LBMA
  bar serials, shipping manifests, KYC dossiers.
- **On chain** holds only the tamper-evident essentials — token supply,
  reserve attestations (with a 3/5 MPC threshold), batch custody, and a
  **SHA-256 hash** committing to each off-chain payload.

```
┌──────────────┐   Pyth Hermes    ┌───────────────────────────────────────┐
│  Physical    │  price feeds     │            Frontend (Vite/React)       │
│  Layer       │◀────────────────▶│  Explorer · Mine Ops · Vault · Trace   │
│ mines/vaults │                  └──────────────┬────────────────────────┘
└──────┬───────┘                                 │ RPC reads (web3.js)
       │ assay / attest                          │  + wallet adapters
       ▼                                         ▼
┌────────────────────────── Solana programs (Anchor 0.30.1) ──────────────┐
│  metal_mint         initialize_mint · mint_tokens · redeem_tokens · pause│
│  reserve_registry   register_vault · submit/cosign_attestation           │
│                     record_provenance · transfer_custody   ◀── NEW       │
│  compliance_engine  register_identity · check_transfer · freeze/revoke   │
└──────────────────────────────────────────────────────────────────────────┘
```

### On-chain programs (`programs/`)

| Program | Responsibility | Key instructions |
|---|---|---|
| `metal_mint` | Mint/redeem metal-backed SPL Token-2022 tokens against reserves | `initialize_mint`, `mint_tokens`, `redeem_tokens`, `set_paused` |
| `reserve_registry` | Register vaults, submit MPC-threshold reserve attestations, **track batch provenance & custody** | `register_vault`, `submit_attestation`, `cosign_attestation`, `record_provenance`, `transfer_custody` |
| `compliance_engine` | KYC/AML identity registry and transfer gating | `register_identity`, `check_transfer`, `freeze_account`, `unfreeze_account`, `revoke_identity` |

**Provenance model** (in `reserve_registry`): a `Batch` PDA is seeded by
`[b"batch", batch_id]`. `record_provenance` writes the genesis custody event
(metal, quantity, origin, first custodian, payload hash). `transfer_custody`
appends an authenticated custody hop — only the current custodian may sign,
and a monotonically increasing `transfer_count` gives every batch a
verifiable hop index. Both emit events (`ProvenanceEvent`,
`CustodyTransferEvent`) for indexers to consume over RPC.

### Frontend (`src/`)

React + Vite + Tailwind + shadcn/ui, with Solana wallet adapters (Phantom,
Solflare). Four routes:

- **Explorer** (`/`) — market cap, backing ratio, live token cards.
- **Mine Operations** (`/mine`) — inventory, mint & redeem request flows.
- **Vault Dashboard** (`/vault`) — vault balances, attestations, deliveries.
- **Traceability** (`/traceability`) — per-batch chain-of-custody timeline.

#### Three-tier data fallback

Live network data degrades gracefully so the app is always runnable:

| Tier | Source | When |
|---|---|---|
| **Live** | Pyth Hermes (`use-pyth-prices`), on-chain token supply (`use-token-supply`), batch PDAs (`use-provenance`) | RPC/feeds reachable & program deployed |
| **Cache** | last good result in `sessionStorage` | transient RPC failure |
| **Mock** | bundled sample data (`src/lib/mock-data.ts`) | offline / before deploy |

The UI shows an honest badge (`Live` / `Cache` / `Mock`) for each tier so
you can always tell what you're looking at.

---

## Quick start (frontend, offline)

```bash
npm install
npm run dev      # http://localhost:8080  — runs fully on mock data
npm test         # vitest — provenance & PDA-derivation unit tests
npm run build    # production build
```

No cluster, wallet, or deployed program is required to explore the app — it
starts in the **mock** tier.

## Building & deploying the programs

Requires the Solana + Anchor toolchain (see `DEPLOY_README.md`).

```bash
cargo check --workspace          # fast syntax/type check without the SBF toolchain
anchor build                     # build the three programs
./scripts/deploy.sh              # deploy to devnet; rewrites declare_id!/Anchor.toml
./scripts/create-mints.sh        # create the four Token-2022 mints
```

After deployment, paste the printed program ids and mint addresses into
`src/lib/program-ids.ts` to switch the frontend from mock to live.

> **Note:** `src/lib/program-ids.ts` currently contains sample deployed
> addresses while `Anchor.toml` and each program's `declare_id!` still hold
> the `1111…1111` placeholder. `scripts/deploy.sh` reconciles all three on a
> real deploy.

---

## Repository layout

```
programs/            Anchor programs (Rust)
  metal_mint/        mint/redeem Token-2022
  reserve_registry/  vaults, attestations, batch provenance/custody
  compliance_engine/ KYC/AML identity + transfer gating
src/
  pages/             Explorer, MineOperations, VaultDashboard, Traceability
  hooks/             use-pyth-prices, use-token-supply, use-provenance, use-solana
  lib/               mock-data, provenance (3-tier loader), program-ids
  test/              vitest unit tests (provenance + PDA derivation)
scripts/             deploy.sh, create-mints.sh
```

## Propagation decisions (OnChain wave B)

- **Row 9 (deny-as-audit-event) — ADOPTED.** The compliance engine's
  transfer gate (`programs/compliance_engine/src/lib.rs`,
  `check_transfer`) denied non-compliant movements — sender/receiver not
  KYC-approved, account frozen — but only via bare `require!` error codes,
  leaving no structured record of *who* was denied *why*. Every denial now
  emits a typed `ComplianceDenied` event (sender, receiver, reason,
  non-compliant party, timestamp) before returning the error, so refused
  transfers persist as first-class audit records in the failed
  transaction's program logs — queryable for compliance reporting instead
  of an opaque Anchor error. Verified with `cargo check` (zero errors);
  the repo has no Rust test harness or CI to extend.

---

## License

MIT.
