#!/bin/bash
set -e

echo "============================================"
echo "  MetalX Anchor Deploy Script (Devnet)"
echo "============================================"

# ── Prerequisites Check ──────────────────────────
command -v solana >/dev/null 2>&1 || { echo "❌ solana CLI not found. Install: sh -c \"\$(curl -sSfL https://release.anza.xyz/stable/install)\""; exit 1; }
command -v anchor >/dev/null 2>&1 || { echo "❌ anchor CLI not found. Install: cargo install --git https://github.com/coral-xyz/anchor anchor-cli"; exit 1; }

# ── Configure for Devnet ─────────────────────────
echo "→ Setting cluster to devnet..."
solana config set --url https://api.devnet.solana.com

# ── Check / Create Keypair ───────────────────────
KEYPAIR="$HOME/.config/solana/id.json"
if [ ! -f "$KEYPAIR" ]; then
    echo "→ No keypair found. Generating..."
    solana-keygen new --no-bip39-passphrase -o "$KEYPAIR"
fi

PUBKEY=$(solana address)
echo "→ Deployer: $PUBKEY"

# ── Airdrop SOL ──────────────────────────────────
BALANCE=$(solana balance | awk '{print $1}')
echo "→ Current balance: $BALANCE SOL"

if (( $(echo "$BALANCE < 4" | bc -l) )); then
    echo "→ Requesting airdrop..."
    solana airdrop 5 || echo "⚠ Airdrop may be rate-limited. Fund manually: https://faucet.solana.com"
    sleep 3
fi

# ── Build ────────────────────────────────────────
echo ""
echo "→ Building programs..."
anchor build

# ── Extract Program IDs ──────────────────────────
echo ""
echo "→ Extracting program IDs..."

METAL_MINT_ID=$(solana-keygen pubkey target/deploy/metal_mint-keypair.json)
RESERVE_REGISTRY_ID=$(solana-keygen pubkey target/deploy/reserve_registry-keypair.json)
COMPLIANCE_ENGINE_ID=$(solana-keygen pubkey target/deploy/compliance_engine-keypair.json)

echo "  metal_mint:       $METAL_MINT_ID"
echo "  reserve_registry: $RESERVE_REGISTRY_ID"
echo "  compliance_engine: $COMPLIANCE_ENGINE_ID"

# ── Update Program IDs in Source ─────────────────
echo ""
echo "→ Updating declare_id! in source..."

sed -i "s/declare_id!(\".*\")/declare_id!(\"$METAL_MINT_ID\")/" programs/metal_mint/src/lib.rs
sed -i "s/declare_id!(\".*\")/declare_id!(\"$RESERVE_REGISTRY_ID\")/" programs/reserve_registry/src/lib.rs
sed -i "s/declare_id!(\".*\")/declare_id!(\"$COMPLIANCE_ENGINE_ID\")/" programs/compliance_engine/src/lib.rs

# ── Update Anchor.toml ──────────────────────────
sed -i "s/^metal_mint = .*/metal_mint = \"$METAL_MINT_ID\"/" Anchor.toml
sed -i "s/^reserve_registry = .*/reserve_registry = \"$RESERVE_REGISTRY_ID\"/" Anchor.toml
sed -i "s/^compliance_engine = .*/compliance_engine = \"$COMPLIANCE_ENGINE_ID\"/" Anchor.toml

# ── Rebuild with correct IDs ─────────────────────
echo ""
echo "→ Rebuilding with correct program IDs..."
anchor build

# ── Deploy ───────────────────────────────────────
echo ""
echo "→ Deploying to devnet..."
anchor deploy --provider.cluster devnet

echo ""
echo "============================================"
echo "  ✅ DEPLOYMENT COMPLETE"
echo "============================================"
echo ""
echo "Program IDs (paste these back into Lovable):"
echo ""
echo "  METAL_MINT_PROGRAM_ID=$METAL_MINT_ID"
echo "  RESERVE_REGISTRY_PROGRAM_ID=$RESERVE_REGISTRY_ID"
echo "  COMPLIANCE_ENGINE_PROGRAM_ID=$COMPLIANCE_ENGINE_ID"
echo ""
echo "Next: Run ./scripts/create-mints.sh to create token mints"
echo ""
