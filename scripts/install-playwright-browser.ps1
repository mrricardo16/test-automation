$ErrorActionPreference = 'Stop'

# Playwright 1.58+ Chromium downloads use the Chrome for Testing path.
# This mirror preserves the builds/cft/... suffix expected by Playwright.
$Env:PLAYWRIGHT_DOWNLOAD_HOST = 'https://cdn.npmmirror.com/binaries/playwright'

try {
  npx playwright install chromium
}
finally {
  Remove-Item Env:PLAYWRIGHT_DOWNLOAD_HOST -ErrorAction SilentlyContinue
}
