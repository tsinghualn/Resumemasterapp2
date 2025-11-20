#!/bin/bash
# Script to fix template overflow issues across all template files

# Replace all instances of fixed width with responsive approach
# Pattern 1: Basic white/colored background
find components/templates -name "*.tsx" -type f -exec sed -i.bak \
  's/className="\([^"]*\)" style={{ width: '\''8\.5in'\'', minHeight: '\''11in'\'', margin: '\''0 auto'\'' }}/className="\1 max-w-full w-full mx-auto overflow-hidden" style={{ maxWidth: '\''8.5in'\'' }}/g' {} \;

# Pattern 2: Inline padding with fixed width  
find components/templates -name "*.tsx" -type f -exec sed -i.bak \
  's/className="\([^"]*\)p-\([0-9]*\)" style={{ width: '\''8\.5in'\'', minHeight: '\''11in'\'', margin: '\''0 auto'\'' }}/className="\1p-\2 max-w-full w-full mx-auto overflow-hidden" style={{ maxWidth: '\''8.5in'\'' }}/g' {} \;

# Clean up backup files
find components/templates -name "*.bak" -type f -delete

echo "✅ Template overflow fixes applied to all template files"
echo "📝 Review changes before committing"
