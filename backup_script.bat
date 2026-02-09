@echo off
echo ========================================
echo        BACKUP AUTOMATICO GAMEPOP
echo ========================================

set DATA=%date:~6,4%-%date:~3,2%-%date:~0,2%
set HORA=%time:~0,2%-%time:~3,2%-%time:~6,2%
set BACKUP_NAME=GamePop_Backup_%DATA%_%HORA%

echo Criando backup em: %BACKUP_NAME%

REM Criar pasta de backup
mkdir "C:\Backups\%BACKUP_NAME%" 2>nul

REM Copiar arquivos importantes (excluindo node_modules)
echo Copiando arquivos...
xcopy "C:\Users\TI\Downloads\GamePop\*" "C:\Backups\%BACKUP_NAME%\" /E /I /H /Y /EXCLUDE:backup_exclude.txt

echo.
echo ========================================
echo Backup concluido com sucesso!
echo Local: C:\Backups\%BACKUP_NAME%
echo ========================================
pause