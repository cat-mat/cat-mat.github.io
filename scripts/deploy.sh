#!/bin/bash

# Build the project
echo "Building project..."
npm run build

# Copy dist files to root for GitHub Pages deployment
echo "Copying dist files to root directory..."
cp -r dist/* .

echo "Deployment files ready!" 