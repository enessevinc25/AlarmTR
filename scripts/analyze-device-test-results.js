#!/usr/bin/env node
/**
 * Device Test Results Analyzer
 * 
 * Analyzes DEVICE_TEST_RESULTS.md and generates FINAL_GO_NO_GO.md
 * 
 * Usage: node scripts/analyze-device-test-results.js
 */

const fs = require('fs');
const path = require('path');

const TEST_RESULTS_FILE = path.join(__dirname, '..', 'DEVICE_TEST_RESULTS.md');
const FINAL_REPORT_FILE = path.join(__dirname, '..', 'FINAL_GO_NO_GO.md');
const READINESS_REPORT_FILE = path.join(__dirname, '..', 'RELEASE_READINESS_REPORT.md');

// P0 Critical test cases (must all pass for public release)
const P0_TEST_CASES = [
  'AND-12-1', // Onboarding & Permissions Flow (Android 12)
  'AND-12-2', // Stop Search & Alarm Creation (Android 12)
  'AND-12-3', // Background Location Tracking (Android 12)
  'AND-13-1', // Notification Permission (Android 13)
  'AND-14-1', // Foreground Service & Location (Android 14)
  'IOS-16-1', // Onboarding & Location Permission (iOS 16)
  'IOS-16-2', // Stop Search & Alarm Creation (iOS 16)
  'IOS-16-3', // Background Location Tracking (iOS 16)
];

function parseTestResults(content) {
  const results = {
    p0Tests: {},
    p1Tests: {},
    p2Tests: {},
    overallStatus: null,
    totalTests: 0,
    passed: 0,
    failed: 0,
    pending: 0,
  };

  // Extract overall status
  const overallStatusMatch = content.match(/\*\*Overall Status:\*\*\s*(⚠️\s*\*\*PENDING\*\*|✅\s*\*\*PASS\*\*|❌\s*\*\*FAIL\*\*)/);
  if (overallStatusMatch) {
    if (overallStatusMatch[1].includes('PASS')) results.overallStatus = 'PASS';
    else if (overallStatusMatch[1].includes('FAIL')) results.overallStatus = 'FAIL';
    else results.overallStatus = 'PENDING';
  }

  // Extract test case results
  const testCaseRegex = /####\s+([A-Z]+-\d+-\d+)\s+-[^\n]+\n\*\*Status:\*\*\s*(⚠️\s*\*\*PENDING\*\*|✅\s*\*\*PASS\*\*|❌\s*\*\*FAIL\*\*)[^\n]*\n\*\*Priority:\*\*\s*(P0|P1|P2)/g;
  let match;
  
  while ((match = testCaseRegex.exec(content)) !== null) {
    const testCaseId = match[1];
    const status = match[2].includes('PASS') ? 'PASS' : (match[2].includes('FAIL') ? 'FAIL' : 'PENDING');
    const priority = match[3];
    
    const testResult = {
      id: testCaseId,
      status: status,
      priority: priority,
    };
    
    if (priority === 'P0') {
      results.p0Tests[testCaseId] = testResult;
    } else if (priority === 'P1') {
      results.p1Tests[testCaseId] = testResult;
    } else if (priority === 'P2') {
      results.p2Tests[testCaseId] = testResult;
    }
    
    results.totalTests++;
    if (status === 'PASS') results.passed++;
    else if (status === 'FAIL') results.failed++;
    else results.pending++;
  }

  // Extract issues
  const issues = {
    p0: [],
    p1: [],
    p2: [],
  };

  // Extract P0 issues
  const p0IssuesRegex = /### Critical Issues \(P0\)\s*\n\n((?:1\.\s*\*\*[^\n]+\*\*[^\n]*\n(?:[^\n]*\n)*)+)/;
  const p0IssuesMatch = content.match(p0IssuesRegex);
  if (p0IssuesMatch) {
    const issuesText = p0IssuesMatch[1];
    const issueMatches = issuesText.matchAll(/\d+\.\s*\*\*([^\*]+)\*\*\s*\n\s*-\s*Description:\s*([^\n]+)/g);
    for (const issueMatch of issueMatches) {
      issues.p0.push({
        title: issueMatch[1].trim(),
        description: issueMatch[2].trim(),
      });
    }
  }

  // Extract P1 issues
  const p1IssuesRegex = /### High Priority Issues \(P1\)\s*\n\n((?:1\.\s*\*\*[^\n]+\*\*[^\n]*\n(?:[^\n]*\n)*)+)/;
  const p1IssuesMatch = content.match(p1IssuesRegex);
  if (p1IssuesMatch) {
    const issuesText = p1IssuesMatch[1];
    const issueMatches = issuesText.matchAll(/\d+\.\s*\*\*([^\*]+)\*\*\s*\n\s*-\s*Description:\s*([^\n]+)/g);
    for (const issueMatch of issueMatches) {
      issues.p1.push({
        title: issueMatch[1].trim(),
        description: issueMatch[2].trim(),
      });
    }
  }

  results.issues = issues;
  return results;
}

function checkAllP0TestsPass(results) {
  const p0TestIds = Object.keys(results.p0Tests);
  
  if (p0TestIds.length === 0) {
    return { allPass: false, reason: 'No P0 test cases found in results' };
  }

  const failedP0Tests = p0TestIds.filter(id => results.p0Tests[id].status === 'FAIL');
  const pendingP0Tests = p0TestIds.filter(id => results.p0Tests[id].status === 'PENDING');

  if (pendingP0Tests.length > 0) {
    return { allPass: false, reason: `P0 test cases still pending: ${pendingP0Tests.join(', ')}` };
  }

  if (failedP0Tests.length > 0) {
    return { allPass: false, reason: `P0 test cases failed: ${failedP0Tests.join(', ')}` };
  }

  return { allPass: true, reason: 'All P0 test cases passed' };
}

function generateFinalReport(results, p0Check) {
  const date = new Date().toISOString().split('T')[0];
  const time = new Date().toTimeString().split(' ')[0];

  let decision = 'NO-GO';
  let decisionReason = '';
  let recommendations = [];

  if (p0Check.allPass) {
    decision = 'GO';
    decisionReason = 'All P0 critical test cases passed. Physical device testing completed successfully.';
  } else {
    decisionReason = p0Check.reason;
    recommendations.push('Fix all P0 test case failures before public release');
    recommendations.push('Re-run device tests after fixes');
  }

  // Check for P0 issues
  if (results.issues.p0.length > 0) {
    decision = 'NO-GO';
    decisionReason += ` Found ${results.issues.p0.length} P0 critical issues.`;
    recommendations.push(`Resolve ${results.issues.p0.length} P0 critical issues`);
  }

  const report = `# Final GO/NO-GO Decision
## LastStop Alarm TR - Public Production Release

**Date:** ${date} ${time}  
**Version:** 1.1.0  
**Decision Maker:** Automated Analysis based on Device Test Results

---

## Decision

### ${decision === 'GO' ? '✅ **GO for Public Release**' : '❌ **NO-GO for Public Release**'}

**Decision:** **${decision === 'GO' ? 'GO' : 'NO-GO'}**

**Reasoning:**
${decisionReason}

---

## Test Results Summary

**Total Test Cases:** ${results.totalTests}  
**Passed:** ${results.passed}  
**Failed:** ${results.failed}  
**Pending:** ${results.pending}

**P0 Critical Test Cases:**
${Object.keys(results.p0Tests).map(id => {
  const test = results.p0Tests[id];
  const icon = test.status === 'PASS' ? '✅' : (test.status === 'FAIL' ? '❌' : '⚠️');
  return `- ${icon} **${id}** - ${test.status}`;
}).join('\n')}

**P0 Test Status:** ${p0Check.allPass ? '✅ **ALL PASS**' : '❌ **FAILURES FOUND**'}

---

## Critical Issues

${results.issues.p0.length > 0 ? `### P0 Critical Issues (${results.issues.p0.length})

${results.issues.p0.map((issue, idx) => `${idx + 1}. **${issue.title}**
   - ${issue.description}`).join('\n\n')}

` : '**No P0 critical issues found.** ✅'}

${results.issues.p1.length > 0 ? `### P1 High Priority Issues (${results.issues.p1.length})

${results.issues.p1.map((issue, idx) => `${idx + 1}. **${issue.title}**
   - ${issue.description}`).join('\n\n')}

` : ''}

---

## Recommendations

${recommendations.length > 0 ? recommendations.map((rec, idx) => `${idx + 1.}. ${rec}`).join('\n') : '- ✅ All requirements met for public release'}

${decision === 'GO' ? `
### Next Steps (GO)
1. ✅ Proceed with public release
2. ✅ Submit to Play Store (Android)
3. ✅ Submit to App Store (iOS)
4. ✅ Monitor production metrics and user feedback
` : `
### Next Steps (NO-GO)
1. ❌ Do not proceed with public release
2. ⚠️ Fix all P0 test failures and critical issues
3. ⚠️ Re-run device tests after fixes
4. ⚠️ Re-evaluate GO/NO-GO decision after fixes
`}

---

## References

- **Device Test Plan:** \`DEVICE_TEST_PLAN.md\`
- **Device Test Results:** \`DEVICE_TEST_RESULTS.md\`
- **Release Readiness Report:** \`RELEASE_READINESS_REPORT.md\`

---

**Report Generated:** ${date} ${time}  
**Analysis Script:** \`scripts/analyze-device-test-results.js\`
`;

  return report;
}

function updateReleaseReadinessReport(results, p0Check) {
  let content = fs.readFileSync(READINESS_REPORT_FILE, 'utf8');

  // Update Executive Summary decision
  if (p0Check.allPass && results.issues.p0.length === 0) {
    // Change CONDITIONAL GO to GO for Public Release
    content = content.replace(
      /### 🟡 \*\*CONDITIONAL GO\*\*.*?\*\*Conditional GO for Public Release\*\*/s,
      `### ✅ **GO for Public Release**

**Recommendation:** **APPROVED FOR PUBLIC PRODUCTION RELEASE** - All P0 critical test cases passed, physical device testing completed successfully.`
    );
  }

  // Add device test results to risk register if there are failures
  if (!p0Check.allPass || results.issues.p0.length > 0) {
    const riskRegisterSection = content.match(/(### P0 - Critical \(Must Fix Before Production\)\s*\n\n\|.*?\|.*?\|)/s);
    if (riskRegisterSection) {
      let newRisks = '\n';
      
      // Add failed P0 tests
      const failedP0Tests = Object.keys(results.p0Tests).filter(id => results.p0Tests[id].status === 'FAIL');
      failedP0Tests.forEach((testId, idx) => {
        const test = results.p0Tests[testId];
        newRisks += `| **P0-DT-${idx + 1}** | **Device test ${testId} failed** | Yüksek - Critical functionality not verified on physical device | Yüksek | Fix issue and re-run device test ${testId} | \`DEVICE_TEST_RESULTS.md\` | 🔴 **OPEN** |\n`;
      });

      // Add P0 issues
      results.issues.p0.forEach((issue, idx) => {
        newRisks += `| **P0-ISSUE-${idx + 1}** | **${issue.title}** | Yüksek - ${issue.description} | Yüksek | Fix critical issue | \`DEVICE_TEST_RESULTS.md\` | 🔴 **OPEN** |\n`;
      });

      content = content.replace(
        /(### P0 - Critical \(Must Fix Before Production\)\s*\n\n\|.*?\|.*?\|)/s,
        `$1${newRisks}`
      );
    }
  }

  fs.writeFileSync(READINESS_REPORT_FILE, content, 'utf8');
}

// Main execution
try {
  console.log('Reading DEVICE_TEST_RESULTS.md...');
  const testResultsContent = fs.readFileSync(TEST_RESULTS_FILE, 'utf8');

  // Check if file is still template
  if (testResultsContent.includes('_[Test execution date]_') || testResultsContent.includes('⚠️ **PENDING**')) {
    console.log('⚠️  WARNING: DEVICE_TEST_RESULTS.md appears to be still in template state.');
    console.log('   Please fill in test results before running this analysis.');
    process.exit(1);
  }

  console.log('Parsing test results...');
  const results = parseTestResults(testResultsContent);

  console.log('Checking P0 test cases...');
  const p0Check = checkAllP0TestsPass(results);

  console.log('Generating FINAL_GO_NO_GO.md...');
  const finalReport = generateFinalReport(results, p0Check);
  fs.writeFileSync(FINAL_REPORT_FILE, finalReport, 'utf8');

  console.log('Updating RELEASE_READINESS_REPORT.md...');
  updateReleaseReadinessReport(results, p0Check);

  console.log('\n✅ Analysis complete!');
  console.log(`   Decision: ${p0Check.allPass && results.issues.p0.length === 0 ? 'GO' : 'NO-GO'}`);
  console.log(`   Report: ${FINAL_REPORT_FILE}`);
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

