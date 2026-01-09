# Transit-API Testleri
# Ciktilar: qa-reports/transit-api-build.txt, transit-api-tests.txt, transit-api-docker-build.txt

# UTF-8 encoding ayarlari
$OutputEncoding = [System.Text.UTF8Encoding]::new()
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
chcp 65001 | Out-Null

$ErrorActionPreference = "Continue"
$reportsDir = "qa-reports"
$transitApiDir = "transit-api"

Write-Host "=== Transit-API Testleri Baslatiliyor ===" -ForegroundColor Cyan

Push-Location $transitApiDir

try {
    # 1. npm ci
    Write-Host "1/4 npm ci calistiriliyor..." -ForegroundColor Yellow
    npm ci 2>&1 | Tee-Object -FilePath "..\$reportsDir\transit-api-npm-ci.txt"
    
    # 2. Build
    Write-Host "2/4 Build calistiriliyor..." -ForegroundColor Yellow
    npm run build 2>&1 | Tee-Object -FilePath "..\$reportsDir\transit-api-build.txt"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Transit-API Build PASS" -ForegroundColor Green
        "PASS" | Out-File -FilePath "..\$reportsDir\transit-api-build.status.txt" -Encoding utf8
    } else {
        Write-Host "[FAIL] Transit-API Build FAIL" -ForegroundColor Red
        "FAIL" | Out-File -FilePath "..\$reportsDir\transit-api-build.status.txt" -Encoding utf8
        Pop-Location
        return
    }
    
    # 3. Tests
    Write-Host "3/4 Testler calistiriliyor..." -ForegroundColor Yellow
    npm test 2>&1 | Tee-Object -FilePath "..\$reportsDir\transit-api-tests.txt"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Transit-API Tests PASS" -ForegroundColor Green
        "PASS" | Out-File -FilePath "..\$reportsDir\transit-api-tests.status.txt" -Encoding utf8
    } else {
        Write-Host "[FAIL] Transit-API Tests FAIL" -ForegroundColor Red
        "FAIL" | Out-File -FilePath "..\$reportsDir\transit-api-tests.status.txt" -Encoding utf8
    }
    
    # 4. Docker Build (opsiyonel)
    Write-Host "4/4 Docker build kontrol ediliyor..." -ForegroundColor Yellow
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        docker build -t alarmtr-transit-api:qa . 2>&1 | Tee-Object -FilePath "..\$reportsDir\transit-api-docker-build.txt"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Docker Build PASS" -ForegroundColor Green
            "PASS" | Out-File -FilePath "..\$reportsDir\transit-api-docker-build.status.txt" -Encoding utf8
        } else {
            Write-Host "[FAIL] Docker Build FAIL" -ForegroundColor Red
            "FAIL" | Out-File -FilePath "..\$reportsDir\transit-api-docker-build.status.txt" -Encoding utf8
        }
    } else {
        Write-Host "[WARN] Docker bulunamadi, SKIP" -ForegroundColor Yellow
        "SKIP" | Out-File -FilePath "..\$reportsDir\transit-api-docker-build.status.txt" -Encoding utf8
    }
    
} catch {
    Write-Host "[FAIL] Transit-API Test ERROR: $_" -ForegroundColor Red
    "ERROR: $_" | Out-File -FilePath "..\$reportsDir\transit-api-tests.status.txt" -Encoding utf8
} finally {
    Pop-Location
}

Write-Host "=== Transit-API Testleri Tamamlandi ===" -ForegroundColor Cyan
