@echo off

REM Build the project
echo Building project...
npm run build

REM Copy dist files to root for GitHub Pages deployment
echo Copying dist files to root directory...
xcopy dist\* . /E /Y

echo Deployment files ready! 