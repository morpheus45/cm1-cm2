#!/bin/bash
# Extract specific subject and levels
# Usage: ./extract-subject.sh francais CE1 CE2 CM1 CM2 6e
#        ./extract-subject.sh mathematiques CE1-CE2
#        ./extract-subject.sh anglais ALL

set -e

SUBJECT=$1
shift
LEVELS=$@

if [ -z "$SUBJECT" ] || [ -z "$LEVELS" ]; then
  echo "Usage: $0 [SUBJECT] [LEVELS...]"
  echo ""
  echo "Subjects: anglais, francais, mathematiques, geographie, histoire, sciences, emc"
  echo ""
  echo "Levels: CE1, CE2, CM1, CM2, 6e, 5e, 4e, 3e (or ALL)"
  echo ""
  echo "Examples:"
  echo "  $0 francais CE1 CE2 CM1"
  echo "  $0 mathematiques ALL"
  echo "  $0 anglais 6e 5e 4e 3e"
  exit 1
fi

# Validate subject
case $SUBJECT in
  anglais|francais|mathematiques|geographie|histoire|sciences|emc) ;;
  *)
    echo "Invalid subject: $SUBJECT"
    exit 1
    ;;
esac

# Handle ALL levels
if [ "$LEVELS" = "ALL" ]; then
  LEVELS="CE1 CE2 CM1 CM2 6e 5e 4e 3e"
fi

TARGET="build-$SUBJECT-${LEVELS// /-}"

# Create target directory
mkdir -p "$TARGET/public/contenus/$SUBJECT"

echo "📦 Extracting $SUBJECT for levels: $LEVELS"

# Copy subject files for specified levels
for level in $LEVELS; do
  if [ -f "public/contenus/$SUBJECT/$level.json" ]; then
    cp "public/contenus/$SUBJECT/$level.json" "$TARGET/public/contenus/$SUBJECT/"
    echo "  ✅ $SUBJECT/$level.json"
  else
    echo "  ⚠️  $SUBJECT/$level.json (not found)"
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
echo "✅ Extracted $SUBJECT ($LEVELS) to $TARGET/"
echo ""
echo "📊 Content extracted:"
find "$TARGET/public/contenus" -name "*.json" -exec sh -c 'echo "  - $1" && python3 -c "import json; f=open(\"$1\"); d=json.load(f); print(f\"    Niveau: {d.get(\\\"niveau\\\")}, Trimestres: {len(d.get(\\\"trimestres\\\", {}))}\")" 2>/dev/null || echo "    (parse error)"' _ {} \;

echo ""
echo "Next steps:"
echo "  cd $TARGET"
echo "  npm install"
echo "  npm run build"
echo "  # Deploy dist/ to https://example.com/$SUBJECT/"
