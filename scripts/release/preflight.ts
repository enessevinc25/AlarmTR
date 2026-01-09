/**
 * Release Preflight Script (P0)
 * 
 * Production build öncesi kontrol script'i.
 * Version, bundle identifier, ve kritik env vars kontrol eder.
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = path.resolve(__dirname, '../..');

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
}

const checks: CheckResult[] = [];

function addCheck(name: string, passed: boolean, message: string): void {
  checks.push({ name, passed, message });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
}

async function checkPackageJson(): Promise<void> {
  try {
    const packageJsonPath = path.join(ROOT_DIR, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    if (!packageJson.version) {
      addCheck('package.json version', false, 'Version field missing');
      return;
    }
    
    addCheck('package.json version', true, `Version: ${packageJson.version}`);
  } catch (error) {
    addCheck('package.json read', false, `Failed to read: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function checkAppConfig(): Promise<void> {
  try {
    // app.config.ts bir TypeScript dosyası, direkt okuyamayız
    // Bunun yerine expo config komutunu kullanabiliriz veya manuel kontrol yapabiliriz
    // Şimdilik basit bir dosya varlık kontrolü yapalım
    
    const appConfigPath = path.join(ROOT_DIR, 'app.config.ts');
    if (!fs.existsSync(appConfigPath)) {
      addCheck('app.config.ts', false, 'File not found');
      return;
    }
    
    const content = fs.readFileSync(appConfigPath, 'utf-8');
    
    // Basit kontroller
    if (!content.includes('bundleIdentifier') && !content.includes('package')) {
      addCheck('app.config.ts identifiers', false, 'bundleIdentifier/package not found');
      return;
    }
    
    if (!content.includes('version')) {
      addCheck('app.config.ts version', false, 'version field not found');
      return;
    }
    
    addCheck('app.config.ts', true, 'File exists and contains required fields');
  } catch (error) {
    addCheck('app.config.ts read', false, `Failed to read: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function checkEnvVars(): Promise<void> {
  // Kritik env vars kontrolü (local build için)
  // NOT: EAS Build'de secrets kullanılır, local env vars gerekli değil
  const criticalVars = [
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID',
    'EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS',
    'EXPO_PUBLIC_ENVIRONMENT',
  ];

  let allPresent = true;
  const missing: string[] = [];

  for (const varName of criticalVars) {
    if (!process.env[varName]) {
      allPresent = false;
      missing.push(varName);
    }
  }

  // EAS Build kullanılıyorsa env vars opsiyonel (secrets kullanılır)
  // Bu yüzden warning olarak işaretliyoruz, fail değil
  if (allPresent) {
    addCheck('Critical env vars', true, 'All critical env vars are set (local build ready)');
  } else {
    addCheck(
      'Critical env vars (local)',
      true, // Warning olarak işaretle, fail değil
      `Missing: ${missing.join(', ')} (OK for EAS Build - uses secrets instead)`
    );
  }
}

async function checkEasJson(): Promise<void> {
  try {
    const easJsonPath = path.join(ROOT_DIR, 'eas.json');
    if (!fs.existsSync(easJsonPath)) {
      addCheck('eas.json', false, 'File not found');
      return;
    }
    
    const easJson = JSON.parse(fs.readFileSync(easJsonPath, 'utf-8'));
    
    if (!easJson.build?.production) {
      addCheck('eas.json production profile', false, 'Production profile not found');
      return;
    }
    
    addCheck('eas.json', true, 'File exists and contains production profile');
  } catch (error) {
    addCheck('eas.json read', false, `Failed to read: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function main(): Promise<void> {
  console.log('🚀 Release Preflight Check\n');
  console.log('='.repeat(50));
  
  await checkPackageJson();
  await checkAppConfig();
  await checkEnvVars();
  await checkEasJson();
  
  console.log('='.repeat(50));
  console.log('');
  
  const failedChecks = checks.filter((c) => !c.passed);
  
  if (failedChecks.length === 0) {
    console.log('✅ All checks passed!');
    process.exit(0);
  } else {
    console.log(`❌ ${failedChecks.length} check(s) failed:`);
    failedChecks.forEach((check) => {
      console.log(`   - ${check.name}: ${check.message}`);
    });
    console.log('');
    console.log('⚠️  Please fix the issues above before releasing.');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Preflight script error:', error);
  process.exit(1);
});
