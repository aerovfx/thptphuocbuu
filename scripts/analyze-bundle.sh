#!/bin/bash

# Script to analyze bundle size
# Usage: ./scripts/analyze-bundle.sh

echo "🔍 Analyzing bundle size..."
echo ""
echo "Building with bundle analyzer..."
echo ""

ANALYZE=true npm run build

echo ""
echo "✅ Build complete!"
echo ""
echo "📊 Bundle analysis reports:"
echo "   - Client bundle: .next/analyze/client.html"
echo "   - Server bundle: .next/analyze/server.html"
echo ""
echo "💡 Open these files in your browser to view the analysis"

