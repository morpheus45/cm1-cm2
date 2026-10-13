#!/bin/bash
# Extract all subjects for a specific level
# Usage: ./extract-level.sh CE1
#        ./extract-level.sh 6e
#        ./extract-level.sh 3e

set -e

LEVEL=$1

if [ -z "$LEVEL" ]; then
  echo "Usage: $0 [LEVEL]"
  echo "Levels: CE1, CE2, CM1, CM2, 6e, 5e, 4e, 3e"
  exit 1
fi

# Validate level
case $LEVEL in
  CE1|CE2|CM1|CM2|6e|5e|4e|3e) ;;
  *)
    echo "Invalid level: $LEVEL"
    echo "Valid levels: CE1, CE2, CM1, CM2, 6e, 5e, 4e, 3e"
    exit 1
    ;;
esac

TARGET="build-$LEVEL"

# Create target directory
mkdir -p "$TARGET/public/contenus"

echo "📦 Extracting $LEVEL..."

# Copy all subject files for this level
for subject in anglais francais mathematiques geographie histoire sciences emc; do
  mkdir -p "$TARGET/public/contenus/$subject"
  if [ -f "public/contenus/$subject/$LEVEL.json" ]; then
    cp "public/contenus/$subject/$LEVEL.json" "$TARGET/public/contenus/$subject/"
    echo "  ✅ $subject/$LEVEL.json"
  else
    echo "  ⚠️  $subject/$LEVEL.json (not found)"
  fi
done

# Copy main files
echo "  📄 Copying main files..."
cp -r public/{*.png,*.svg,manifest.webmanifest} "$TARGET/public/" 2>/dev/null || true
cp index.html "$TARGET/"
cp vite.config.ts "$TARGET/"
cp tsconfig.json "$TARGET/"
cp package.json "$TARGET/"
cp package-lock.json "$TARGET/" 2>/dev/null || true
cp -r src "$TARGET/"

# Copy tailwind config
cp tailwind.config.js "$TARGET/" 2>/dev/null || true
cp postcss.config.js "$TARGET/" 2>/dev/null || true

echo ""
echo "✅ Extracted $LEVEL to $TARGET/"
echo ""
echo "📊 Content for $LEVEL:"
find "$TARGET/public/contenus" -name "*.json" -exec sh -c 'echo "  - $1" && wc -l "$1" | awk "{print \"    Lines: \" \$1}"' _ {} \;

echo ""
echo "Next steps:"
echo "  cd $TARGET"
echo "  npm install"
echo "  npm run build"
echo "  # Deploy dist/ to https://example.com/$LEVEL/"
