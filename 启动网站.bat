@echo off
chcp 65001 >nul
echo ========================================
echo    巴伦旅游 - 网站启动器
echo ========================================
echo.

:: Check if ngrok exists
if exist "%~dp0ngrok\ngrok.exe" goto :HAVE_NGROK
if exist "%~dp0ngrok.exe" goto :HAVE_NGROK_SIMPLE

echo [步骤1] 正在启动网站服务器...
echo.
START /B "" node server.js
echo 服务器已启动！访问地址：http://localhost:3023
echo.
echo [注意] 未检测到 ngrok.exe
echo 如需对外发布，请按以下步骤：
echo  1. 访问 https://ngrok.com/download 下载 ngrok
echo  2. 解压后将 ngrok.exe 放到本目录
echo  3. 再次运行本脚本
echo.
echo 现在可以直接在浏览器打开 http://localhost:3023
echo ========================================
pause
exit /b

:HAVE_NGROK_SIMPLE
set NGROK_PATH=%~dp0ngrok.exe
goto :START_NGROK

:HAVE_NGROK
set NGROK_PATH=%~dp0ngrok\ngrok.exe

:START_NGROK
echo [步骤1] 正在启动网站服务器...
START /B "" node server.js
timeout /t 3 /nobreak >nul
echo 服务器已启动 ✓
echo.

echo [步骤2] 正在启动 ngrok 隧道...
echo 生成公网地址后会自动打开浏览器...
START /B "" "%NGROK_PATH%" http 3023 --log=stdout > "%~dp0ngrok.log"
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo  本地访问: http://localhost:3023
echo  ngrok 日志: ngrok.log
echo  管理后台: http://localhost:3023/admin.html
echo ========================================
echo.
echo 提示：打开新命令行窗口执行以下命令可查看公网地址：
echo    findstr "url=" ngrok.log
echo.
pause

