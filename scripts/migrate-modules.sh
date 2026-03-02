#!/bin/bash
# ============================================================
# Optimile ERP – Module Migration Script
# ============================================================
# This script copies all component files from the 5 original
# modules into the unified project structure.
#
# USAGE: bash scripts/migrate-modules.sh <path-to-extracted-zips>
# Example: bash scripts/migrate-modules.sh ~/Downloads
# ============================================================

set -e

SOURCE_DIR="${1:-.}"
DEST_DIR="src/modules"

echo "╔════════════════════════════════════════════════╗"
echo "║   Optimile ERP – Module Migration             ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# ── TMS Module ──
if [ -d "$SOURCE_DIR/optimile-tms-main" ]; then
  echo "→ Migrating TMS module..."
  mkdir -p "$DEST_DIR/tms"
  cp -r "$SOURCE_DIR/optimile-tms-main/components" "$DEST_DIR/tms/"
  cp -r "$SOURCE_DIR/optimile-tms-main/pages" "$DEST_DIR/tms/"
  cp -r "$SOURCE_DIR/optimile-tms-main/context" "$DEST_DIR/tms/"
  cp "$SOURCE_DIR/optimile-tms-main/types.ts" "$DEST_DIR/tms/" 2>/dev/null || true
  cp "$SOURCE_DIR/optimile-tms-main/constants.ts" "$DEST_DIR/tms/" 2>/dev/null || true
  cp "$SOURCE_DIR/optimile-tms-main/Optimile.svg" "$DEST_DIR/tms/" 2>/dev/null || true
  echo "  ✓ TMS: $(find $DEST_DIR/tms -name '*.tsx' -o -name '*.ts' | wc -l) files"
else
  echo "  ⚠ TMS source not found at $SOURCE_DIR/optimile-tms-main"
fi

# ── Fleet Control Module ──
if [ -d "$SOURCE_DIR/optimile-fleet-control-main" ]; then
  echo "→ Migrating Fleet Control module..."
  mkdir -p "$DEST_DIR/fleet-control"
  cp -r "$SOURCE_DIR/optimile-fleet-control-main/components" "$DEST_DIR/fleet-control/"
  cp -r "$SOURCE_DIR/optimile-fleet-control-main/pages" "$DEST_DIR/fleet-control/"
  cp -r "$SOURCE_DIR/optimile-fleet-control-main/services" "$DEST_DIR/fleet-control/"
  cp "$SOURCE_DIR/optimile-fleet-control-main/types.ts" "$DEST_DIR/fleet-control/" 2>/dev/null || true
  cp "$SOURCE_DIR/optimile-fleet-control-main/customer_logo.jpeg" "$DEST_DIR/fleet-control/" 2>/dev/null || true
  echo "  ✓ Fleet Control: $(find $DEST_DIR/fleet-control -name '*.tsx' -o -name '*.ts' | wc -l) files"
else
  echo "  ⚠ Fleet Control source not found"
fi

# ── AMS Module ──
if [ -d "$SOURCE_DIR/optimile-ams---foundation-main" ]; then
  echo "→ Migrating AMS module..."
  mkdir -p "$DEST_DIR/ams"
  cp -r "$SOURCE_DIR/optimile-ams---foundation-main/components" "$DEST_DIR/ams/"
  cp -r "$SOURCE_DIR/optimile-ams---foundation-main/services" "$DEST_DIR/ams/"
  cp "$SOURCE_DIR/optimile-ams---foundation-main/types.ts" "$DEST_DIR/ams/" 2>/dev/null || true
  echo "  ✓ AMS: $(find $DEST_DIR/ams -name '*.tsx' -o -name '*.ts' | wc -l) files"
else
  echo "  ⚠ AMS source not found"
fi

# ── Finance Module ──
if [ -d "$SOURCE_DIR/optimile-financial-management-main" ]; then
  echo "→ Migrating Finance module..."
  mkdir -p "$DEST_DIR/finance"
  cp -r "$SOURCE_DIR/optimile-financial-management-main/components" "$DEST_DIR/finance/"
  cp -r "$SOURCE_DIR/optimile-financial-management-main/services" "$DEST_DIR/finance/"
  cp "$SOURCE_DIR/optimile-financial-management-main/types.ts" "$DEST_DIR/finance/" 2>/dev/null || true
  cp "$SOURCE_DIR/optimile-financial-management-main/mockData.ts" "$DEST_DIR/finance/" 2>/dev/null || true
  cp "$SOURCE_DIR/optimile-financial-management-main/customer_logo.jpeg" "$DEST_DIR/finance/" 2>/dev/null || true
  echo "  ✓ Finance: $(find $DEST_DIR/finance -name '*.tsx' -o -name '*.ts' | wc -l) files"
else
  echo "  ⚠ Finance source not found"
fi

# ── Tyre Intelligence (merged INTO fleet-control) ──
if [ -d "$SOURCE_DIR/optimile-tyre-intelligence-main" ]; then
  echo "→ Migrating Tyre Intelligence → Fleet Control..."
  mkdir -p "$DEST_DIR/fleet-control/tyre-intelligence"
  cp -r "$SOURCE_DIR/optimile-tyre-intelligence-main/components" "$DEST_DIR/fleet-control/tyre-intelligence/"
  cp "$SOURCE_DIR/optimile-tyre-intelligence-main/types.ts" "$DEST_DIR/fleet-control/tyre-intelligence/" 2>/dev/null || true
  cp "$SOURCE_DIR/optimile-tyre-intelligence-main/mockData.ts" "$DEST_DIR/fleet-control/tyre-intelligence/" 2>/dev/null || true
  echo "  ✓ Tyre Intelligence: $(find $DEST_DIR/fleet-control/tyre-intelligence -name '*.tsx' -o -name '*.ts' | wc -l) files merged into Fleet Control"
else
  echo "  ⚠ Tyre Intelligence source not found"
fi

echo ""
echo "════════════════════════════════════════════════"
echo "Migration complete! Total files:"
find "$DEST_DIR" -name '*.tsx' -o -name '*.ts' | wc -l
echo ""
echo "Next steps:"
echo "  1. Run: npm install"
echo "  2. Run: npm run dev"
echo "  3. Update imports in module files to use @shared/* paths"
echo "════════════════════════════════════════════════"
