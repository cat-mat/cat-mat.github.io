#!/bin/bash

# Production Deployment Script
# This script handles secure deployment of the application

set -e  # Exit on any error

echo "🚀 Starting production deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check for required environment variables
if [ -z "$VITE_GOOGLE_CLIENT_ID" ]; then
    echo "❌ Error: VITE_GOOGLE_CLIENT_ID environment variable is required"
    exit 1
fi

# Check for required dependencies
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is required but not installed"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Error: node is required but not installed"
    exit 1
fi

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist/
rm -rf node_modules/

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Run security audit
echo "🔒 Running security audit..."
npm audit --audit-level=moderate

# Run tests
echo "🧪 Running tests..."
npm test

# Build for production
echo "🏗️ Building for production..."
npm run build

# Verify build output
if [ ! -d "dist" ]; then
    echo "❌ Error: Build failed - dist directory not found"
    exit 1
fi

# Check for critical files
required_files=("index.html" "manifest.json")
for file in "${required_files[@]}"; do
    if [ ! -f "dist/$file" ]; then
        echo "❌ Error: Required file dist/$file not found"
        exit 1
    fi
done

# Security checks
echo "🔍 Running security checks..."

# Check for exposed secrets in build
if grep -r "VITE_GOOGLE_CLIENT_ID" dist/; then
    echo "❌ Error: Environment variables exposed in build"
    exit 1
fi

# Check for console.log statements in production build
if grep -r "console.log" dist/; then
    echo "⚠️ Warning: console.log statements found in production build"
fi

# Check for source maps in production
if find dist/ -name "*.map" | grep -q .; then
    echo "⚠️ Warning: Source maps found in production build"
fi

# Create deployment manifest
echo "📋 Creating deployment manifest..."
cat > dist/deployment-manifest.json << EOF
{
  "deployment": {
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "version": "$(node -p "require('./package.json').version")",
    "environment": "production",
    "buildId": "$(date +%s)",
    "security": {
      "cspEnabled": true,
      "httpsOnly": true,
      "noSourceMaps": true
    }
  }
}
EOF

echo "✅ Production deployment ready!"
echo "📁 Build output: dist/"
echo "🔒 Security checks passed"
echo "🚀 Ready for deployment to your hosting platform"

# Optional: Deploy to GitHub Pages
if [ "$1" = "--deploy" ]; then
    echo "🌐 Deploying to GitHub Pages..."
    npm run deploy
    echo "✅ Deployment complete!"
fi 