#!/bin/bash
set -e

echo "============================================"
echo "  MetalX - Create Token-2022 Mints (Devnet)"
echo "============================================"

command -v spl-token >/dev/null 2>&1 || { echo "❌ spl-token CLI not found. Install: cargo install spl-token-cli"; exit 1; }

DEPLOYER=$(solana address)
echo "→ Authority: $DEPLOYER"
echo ""

# ── Create Token-2022 Mints ─────────────────────

echo "→ Creating xGLD mint (Gold, 6 decimals)..."
xGLD_MINT=$(spl-token create-token --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb --decimals 6 2>&1 | grep "Creating token" | awk '{print $3}')
echo "  xGLD: $xGLD_MINT"

echo "→ Creating xSLV mint (Silver, 6 decimals)..."
xSLV_MINT=$(spl-token create-token --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb --decimals 6 2>&1 | grep "Creating token" | awk '{print $3}')
echo "  xSLV: $xSLV_MINT"

echo "→ Creating xPLT mint (Platinum, 6 decimals)..."
xPLT_MINT=$(spl-token create-token --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb --decimals 6 2>&1 | grep "Creating token" | awk '{print $3}')
echo "  xPLT: $xPLT_MINT"

echo "→ Creating xPLD mint (Palladium, 6 decimals)..."
xPLD_MINT=$(spl-token create-token --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb --decimals 6 2>&1 | grep "Creating token" | awk '{print $3}')
echo "  xPLD: $xPLD_MINT"

echo ""
echo "============================================"
echo "  ✅ MINTS CREATED"
echo "============================================"
echo ""
echo "Token Mint Addresses (paste into Lovable):"
echo ""
echo "  xGLD_MINT=$xGLD_MINT"
echo "  xSLV_MINT=$xSLV_MINT"
echo "  xPLT_MINT=$xPLT_MINT"
echo "  xPLD_MINT=$xPLD_MINT"
echo ""
echo "To mint test supply:"
echo "  spl-token create-account $xGLD_MINT"
echo "  spl-token mint $xGLD_MINT 1000000"
echo ""
