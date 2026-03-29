# MetalX Anchor Deployment Guide (Ubuntu)

## Prerequisites

```bash
# 1. Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# 2. Install Solana CLI
sh -c "$(curl -sSfL https://release.anza.xyz/v1.18.26/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# 3. Install Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor avm --force
avm install 0.30.1
avm use 0.30.1

# 4. Install SPL Token CLI
cargo install spl-token-cli

# 5. Verify
solana --version
anchor --version
spl-token --version
```

## Deploy

```bash
# Clone / copy this folder to your Ubuntu server
cd metal-tokenization-anchor

# Run the deploy script
chmod +x scripts/deploy.sh scripts/create-mints.sh
./scripts/deploy.sh

# After programs are deployed, create the token mints
./scripts/create-mints.sh
```

## Output

After deployment you'll get:
- 3 Program IDs (metal_mint, reserve_registry, compliance_engine)
- 4 Token Mint addresses (xGLD, xSLV, xPLT, xPLD)

**Paste these back into Lovable** and I'll wire them into the frontend for live on-chain reads.

## Architecture

```
metal_mint          → Mint/redeem metal-backed SPL Token-2022 tokens
reserve_registry    → Register vaults, submit MPC attestations (3/5 threshold)
compliance_engine   → KYC/AML identity registry, transfer checks, freeze/unfreeze
```

## Test Supply

After creating mints, mint some test tokens:
```bash
spl-token create-account <xGLD_MINT_ADDRESS>
spl-token mint <xGLD_MINT_ADDRESS> 50000000   # 50 oz (6 decimals)
```
