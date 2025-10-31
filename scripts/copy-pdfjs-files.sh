#!/bin/bash
# Copy PDF.js static files from node_modules to public directory
# This script should be run after npm install

set -e  # Exit on error

echo "📄 Copying PDF.js static files..."

# Create directories if they don't exist
mkdir -p public/pdfjs/cmaps
mkdir -p public/pdfjs/standard_fonts
mkdir -p public/pdfjs/wasm

# Check if source directories exist
if [ ! -d "node_modules/react-pdf/node_modules/pdfjs-dist" ]; then
  echo "❌ Error: pdfjs-dist not found in node_modules"
  echo "   Please run 'npm install' first"
  exit 1
fi

# Copy cMaps (for font support and non-Latin characters)
echo "  → Copying cMaps..."
cp -r node_modules/react-pdf/node_modules/pdfjs-dist/cmaps/* public/pdfjs/cmaps/

# Copy standard fonts
echo "  → Copying standard fonts..."
cp -r node_modules/react-pdf/node_modules/pdfjs-dist/standard_fonts/* public/pdfjs/standard_fonts/

# Copy WASM files (for JPX/JPEG2000 image decoding)
echo "  → Copying WASM files..."
cp node_modules/react-pdf/node_modules/pdfjs-dist/wasm/openjpeg.wasm public/pdfjs/wasm/
cp node_modules/react-pdf/node_modules/pdfjs-dist/wasm/openjpeg_nowasm_fallback.js public/pdfjs/wasm/
cp node_modules/react-pdf/node_modules/pdfjs-dist/wasm/qcms_bg.wasm public/pdfjs/wasm/

# Count files
CMAP_COUNT=$(ls public/pdfjs/cmaps/ | wc -l | tr -d ' ')
FONT_COUNT=$(ls public/pdfjs/standard_fonts/ | wc -l | tr -d ' ')
WASM_COUNT=$(ls public/pdfjs/wasm/ | wc -l | tr -d ' ')

echo "✅ PDF.js files copied successfully:"
echo "   - cMaps: $CMAP_COUNT files"
echo "   - Standard fonts: $FONT_COUNT files"
echo "   - WASM files: $WASM_COUNT files"
