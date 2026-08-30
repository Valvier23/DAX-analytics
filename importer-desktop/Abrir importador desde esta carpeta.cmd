@echo off
setlocal
set "KIT_DIR=%~dp0..\"
set "TEMP=%KIT_DIR%.temporal"
set "TMP=%TEMP%"
if not exist "%TEMP%" mkdir "%TEMP%"
start "People Analytics Importer" /wait "%KIT_DIR%PeopleAnalyticsImporter-Desktop.exe"
