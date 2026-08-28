@echo off
setlocal
set "TEMP=%~dp0.temporal"
set "TMP=%TEMP%"
if not exist "%TEMP%" mkdir "%TEMP%"
start "People Analytics Importer" /wait "%~dp0PeopleAnalyticsImporter-Desktop.exe"
