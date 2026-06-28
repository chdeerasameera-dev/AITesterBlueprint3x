// --- App State ---
let build1Data = null;
let build2Data = null;
let build1FileName = '';
let build2FileName = '';

// --- DOM Elements ---
const elApiKeyInput = document.getElementById('gemini-api-key');
const elToggleKeyBtn = document.getElementById('toggle-key-visibility');
const elEyeIcon = document.getElementById('eye-icon');
const elBtnLoadSamples = document.getElementById('btn-load-samples');
const elBtnClear = document.getElementById('btn-clear-workspace');
const elBtnRunAnalysis = document.getElementById('btn-run-analysis');
const elLoadingContainer = document.getElementById('loading-container');
const elLoadingStatus = document.getElementById('loading-status-message');
const elResultsContainer = document.getElementById('analysis-results-container');

// File Upload elements
const elDropZone1 = document.getElementById('drop-zone-1');
const elDropZone2 = document.getElementById('drop-zone-2');
const elFileInput1 = document.getElementById('file-input-1');
const elFileInput2 = document.getElementById('file-input-2');
const elFileInfo1 = document.getElementById('file-info-1');
const elFileInfo2 = document.getElementById('file-info-2');
const elRemoveFile1Btn = document.getElementById('remove-file-1');
const elRemoveFile2Btn = document.getElementById('remove-file-2');

// KPI elements
const elKpiTotal = document.getElementById('kpi-total-specs');
const elKpiPassed = document.getElementById('kpi-passed-specs');
const elKpiPassedPct = document.getElementById('kpi-passed-pct');
const elKpiFlaky = document.getElementById('kpi-flaky-specs');
const elKpiFailed = document.getElementById('kpi-failed-specs');
const elKpiP0Count = document.getElementById('kpi-p0-count');
const elKpiP1Count = document.getElementById('kpi-p1-count');
const elKpiB1Duration = document.getElementById('kpi-b1-duration');
const elKpiB2Duration = document.getElementById('kpi-b2-duration');

// Health score elements
const elHealthSvgFill = document.getElementById('health-svg-fill');
const elHealthPctText = document.getElementById('health-percentage-text');
const elHealthDescText = document.getElementById('health-description-text');

// Tabs and Panels
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');
const elBadgeFlaky = document.getElementById('badge-flaky-count');
const elBadgeFailed = document.getElementById('badge-failed-count');

// Dynamic containers
const elTagsGrid = document.getElementById('tags-success-rates-grid');
const elFlakyTableBody = document.querySelector('#flaky-tests-table tbody');
const elFailuresList = document.getElementById('consistent-failures-list');
const elReportRendered = document.getElementById('report-rendered-content');

// Report action buttons
const elBtnCopyReport = document.getElementById('btn-copy-report');
const elBtnDownloadReport = document.getElementById('btn-download-report');
const elBtnAiRegenerate = document.getElementById('btn-ai-regenerate');

// Charts references
let durationChart = null;
let issuesChart = null;

// --- Initialize App ---
document.addEventListener('DOMContentLoaded', () => {
  // Load saved API key
  const savedKey = localStorage.getItem('gemini_api_key');
  if (savedKey) {
    elApiKeyInput.value = savedKey;
  }

  // Initialize Lucide Icons
  lucide.createIcons();

  // Setup event handlers
  setupKeyToggle();
  setupFileUploadHandlers();
  setupSampleLoader();
  setupTabNavigation();
  setupReportActions();
});

// --- API Key Visibility & Storage ---
function setupKeyToggle() {
  elToggleKeyBtn.addEventListener('click', () => {
    if (elApiKeyInput.type === 'password') {
      elApiKeyInput.type = 'text';
      elEyeIcon.setAttribute('data-lucide', 'eye-off');
    } else {
      elApiKeyInput.type = 'password';
      elEyeIcon.setAttribute('data-lucide', 'eye');
    }
    lucide.createIcons();
  });

  elApiKeyInput.addEventListener('input', (e) => {
    localStorage.setItem('gemini_api_key', e.target.value.trim());
  });
}

// --- Drag & Drop File Uploads ---
function setupFileUploadHandlers() {
  // Drag over effects
  ['dragenter', 'dragover'].forEach(eventName => {
    elDropZone1.addEventListener(eventName, (e) => { e.preventDefault(); elDropZone1.classList.add('dragover'); }, false);
    elDropZone2.addEventListener(eventName, (e) => { e.preventDefault(); elDropZone2.classList.add('dragover'); }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    elDropZone1.addEventListener(eventName, (e) => { e.preventDefault(); elDropZone1.classList.remove('dragover'); }, false);
    elDropZone2.addEventListener(eventName, (e) => { e.preventDefault(); elDropZone2.classList.remove('dragover'); }, false);
  });

  // Handle drops
  elDropZone1.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    handleFileSelected(file, 1);
  });
  elDropZone2.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    handleFileSelected(file, 2);
  });

  // File input click changes
  elDropZone1.addEventListener('click', (e) => {
    if (e.target !== elRemoveFile1Btn && !elRemoveFile1Btn.contains(e.target)) {
      elFileInput1.click();
    }
  });
  elDropZone2.addEventListener('click', (e) => {
    if (e.target !== elRemoveFile2Btn && !elRemoveFile2Btn.contains(e.target)) {
      elFileInput2.click();
    }
  });

  elFileInput1.addEventListener('change', (e) => {
    if (e.target.files.length) handleFileSelected(e.target.files[0], 1);
  });
  elFileInput2.addEventListener('change', (e) => {
    if (e.target.files.length) handleFileSelected(e.target.files[0], 2);
  });

  // Remove files
  elRemoveFile1Btn.addEventListener('click', (e) => {
    e.stopPropagation();
    resetUploadState(1);
  });
  elRemoveFile2Btn.addEventListener('click', (e) => {
    e.stopPropagation();
    resetUploadState(2);
  });

  // Run analysis trigger
  elBtnRunAnalysis.addEventListener('click', runReliabilityAnalysis);
}

function handleFileSelected(file, buildIndex) {
  if (!file) return;
  if (!file.name.endsWith('.json')) {
    alert('Please upload a valid JSON file.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.suites || !Array.isArray(data.suites)) {
        throw new Error('Missing "suites" array in Playwright report.');
      }
      
      if (buildIndex === 1) {
        build1Data = data;
        build1FileName = file.name;
        showFileSelectedUI(1, file.name);
      } else {
        build2Data = data;
        build2FileName = file.name;
        showFileSelectedUI(2, file.name);
      }

      checkReadyToAnalyze();
    } catch (err) {
      alert(`Error parsing JSON file: ${err.message}`);
      resetUploadState(buildIndex);
    }
  };
  reader.readAsText(file);
}

function showFileSelectedUI(buildIndex, name) {
  const elInfo = buildIndex === 1 ? elFileInfo1 : elFileInfo2;
  const elText = elInfo.querySelector('.file-name');
  const elCard = buildIndex === 1 ? elDropZone1 : elDropZone2;

  elText.textContent = name;
  elInfo.classList.remove('hidden');
  elCard.querySelector('.upload-icon-wrapper').style.display = 'none';
  elCard.querySelector('.upload-title').style.display = 'none';
  elCard.querySelector('.upload-desc').style.display = 'none';
}

function resetUploadState(buildIndex) {
  const elInfo = buildIndex === 1 ? elFileInfo1 : elFileInfo2;
  const elCard = buildIndex === 1 ? elDropZone1 : elDropZone2;
  const elInput = buildIndex === 1 ? elFileInput1 : elFileInput2;

  elInput.value = '';
  elInfo.classList.add('hidden');
  elCard.querySelector('.upload-icon-wrapper').style.display = '';
  elCard.querySelector('.upload-title').style.display = '';
  elCard.querySelector('.upload-desc').style.display = '';

  if (buildIndex === 1) {
    build1Data = null;
    build1FileName = '';
  } else {
    build2Data = null;
    build2FileName = '';
  }
  checkReadyToAnalyze();
}

function checkReadyToAnalyze() {
  if (build1Data && build2Data) {
    elBtnRunAnalysis.removeAttribute('disabled');
  } else {
    elBtnRunAnalysis.setAttribute('disabled', 'true');
  }
}

// --- Samples Loading (Offline fallback safe) ---
function setupSampleLoader() {
  elBtnLoadSamples.addEventListener('click', async () => {
    elLoadingContainer.classList.remove('hidden');
    elResultsContainer.classList.add('hidden');
    elLoadingStatus.textContent = 'Fetching workspace files result1.json and result2.json...';
    
    try {
      const res1 = await fetch('result1.json');
      const res2 = await fetch('result2.json');

      if (!res1.ok || !res2.ok) {
        throw new Error('Sample files not found on the local server. Ensure they exist in the root folder.');
      }

      build1Data = await res1.json();
      build2Data = await res2.json();
      build1FileName = 'result1.json';
      build2FileName = 'result2.json';

      showFileSelectedUI(1, 'result1.json');
      showFileSelectedUI(2, 'result2.json');
      checkReadyToAnalyze();

      runReliabilityAnalysis();
    } catch (err) {
      console.warn('Sample files loading failed:', err);
      elLoadingContainer.classList.add('hidden');
      alert(`Could not load samples directly via HTTP fetch (probably due to CORS if opening as file://). \n\nTip: Run a local server (e.g. "npx http-server -p 8080") or Drag & Drop the result1.json and result2.json files directly from the folder!`);
    }
  });

  elBtnClear.addEventListener('click', () => {
    resetUploadState(1);
    resetUploadState(2);
    elResultsContainer.classList.add('hidden');
    elLoadingContainer.classList.add('hidden');
  });
}

// --- Tabs Control ---
function setupTabNavigation() {
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active classes
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      // Add active to current
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-target');
      document.getElementById(targetId).classList.add('active');
    });
  });
}

// --- Playwright JSON Parsing Helpers ---
function extractSpecs(suite, path = []) {
  let specs = [];
  const currentPath = [...path, suite.title].filter(Boolean);
  
  if (suite.specs) {
    suite.specs.forEach(spec => {
      // Collect tags from spec or inherit
      const tags = [...(spec.tags || [])];
      
      specs.push({
        id: spec.id,
        title: spec.title,
        file: spec.file,
        line: spec.line,
        column: spec.column,
        fullTitle: [...currentPath, spec.title].join(' > '),
        tags: tags,
        tests: spec.tests || []
      });
    });
  }
  
  if (suite.suites) {
    suite.suites.forEach(subSuite => {
      specs = specs.concat(extractSpecs(subSuite, currentPath));
    });
  }
  
  return specs;
}

function analyzeSpecs(specs) {
  const resultDetails = [];
  let totalDuration = 0;

  specs.forEach(spec => {
    let hasPass = false;
    let hasFail = false;
    let maxRetries = 0;
    let specDuration = 0;
    const errors = [];

    spec.tests.forEach(test => {
      test.results.forEach(res => {
        specDuration += res.duration || 0;
        if (res.status === 'passed') {
          hasPass = true;
        }
        if (res.status === 'failed' || res.status === 'timedOut') {
          hasFail = true;
        }
        if (res.retry > maxRetries) {
          maxRetries = res.retry;
        }
        if (res.errors) {
          res.errors.forEach(e => {
            if (e.message) errors.push(e.message);
          });
        }
      });
    });

    totalDuration += specDuration;

    // Classification per single run report:
    // - Flaky inside build: passed only after a retry, or has both pass and fail outcomes.
    // - Failed inside build: failed with no pass results.
    // - Passed: passed with no failures and no retries.
    const isFlaky = (hasPass && hasFail) || (hasPass && maxRetries > 0);
    const isFailed = !hasPass && hasFail;
    const isPassed = hasPass && !hasFail && maxRetries === 0;
    const isSkipped = !hasPass && !hasFail;

    let finalStatus = 'passed';
    if (isFlaky) finalStatus = 'flaky';
    else if (isFailed) finalStatus = 'failed';
    else if (isSkipped) finalStatus = 'skipped';

    resultDetails.push({
      id: spec.id,
      title: spec.title,
      fullTitle: spec.fullTitle,
      file: spec.file,
      line: spec.line,
      column: spec.column,
      status: finalStatus,
      tags: spec.tags,
      duration: specDuration,
      errors: errors
    });
  });

  return { details: resultDetails, durationMs: totalDuration };
}

// --- Issue Categorizer (Rule-Based Fallback) ---
function categorizeError(errorMessage) {
  if (!errorMessage) {
    return { type: 'Unclassified Bug', hypothesis: 'Unexpected test assertion failure. Review logs for details.' };
  }
  
  if (errorMessage.includes('TimeoutError') || errorMessage.includes('timeout') || errorMessage.includes('waiting for')) {
    return {
      type: 'Timing / Timeout',
      hypothesis: 'Timeout exceeded during element waiting or page navigation, indicating dynamic load lag or slow asset loading.'
    };
  }
  
  if (errorMessage.includes('Expected: 401') && errorMessage.includes('Received: 500')) {
    return {
      type: 'API Server Error',
      hypothesis: 'Consistent API authentication response mismatch: server returned 500 (Internal Error) instead of 401 (Unauthorized).'
    };
  }

  if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
    return {
      type: 'Server 500 Error',
      hypothesis: 'The backend service encountered an unhandled exception (500) during test execution steps.'
    };
  }
  
  if (errorMessage.includes('expect(') && (errorMessage.includes('toHaveText') || errorMessage.includes('Expected string'))) {
    return {
      type: 'Assertion Mismatch',
      hypothesis: 'Text or metric assertion failure. Expected total or value is out of sync with actual rendered DOM text.'
    };
  }
  
  if (errorMessage.includes('locator') || errorMessage.includes('selector') || errorMessage.includes('not found')) {
    return {
      type: 'Element Missing',
      hypothesis: 'Playwright locator failed to find matching DOM elements. Likely due to structural changes or delayed rendering.'
    };
  }

  return {
    type: 'Assertion Error',
    hypothesis: 'General assertion mismatch. Inspect test parameters and test assertions for regression details.'
  };
}

// --- Main Comparison Engine ---
async function runReliabilityAnalysis() {
  elLoadingContainer.classList.remove('hidden');
  elResultsContainer.classList.add('hidden');
  elLoadingStatus.textContent = 'Parsing build run logs...';

  // Allow layout paint
  await new Promise(resolve => setTimeout(resolve, 300));

  try {
    // 1. Extract specs from both builds
    const rawSpecs1 = build1Data.suites.flatMap(s => extractSpecs(s));
    const rawSpecs2 = build2Data.suites.flatMap(s => extractSpecs(s));

    // 2. Compute individual build statistics
    const build1Results = analyzeSpecs(rawSpecs1);
    const build2Results = analyzeSpecs(rawSpecs2);

    // 3. Cross-reference builds by fullTitle & file to identify Flaky vs Consistent Failures
    const map2 = new Map(build2Results.details.map(d => [d.fullTitle + '::' + d.file, d]));

    const comparisonList = [];
    let flakyCount = 0;
    let consistentFailureCount = 0;
    let consistentPassCount = 0;
    let skippedCount = 0;

    const allTags = new Set();
    const tagStatsMap = {}; // { tag: { total: 0, passed: 0, flaky: 0, failed: 0 } }

    rawSpecs1.forEach(spec1 => {
      // Collect tags
      spec1.tags.forEach(t => allTags.add(t));
    });
    rawSpecs2.forEach(spec2 => {
      spec2.tags.forEach(t => allTags.add(t));
    });

    allTags.forEach(tag => {
      tagStatsMap[tag] = { total: 0, passed: 0, flaky: 0, failed: 0 };
    });

    const processedKeys = new Set();

    build1Results.details.forEach(d1 => {
      const key = d1.fullTitle + '::' + d1.file;
      processedKeys.add(key);

      const d2 = map2.get(key);

      let finalClass = 'passed';
      let errorMsgs = [...d1.errors];

      if (!d2) {
        // Test only exists in Build 1
        if (d1.status === 'failed') finalClass = 'failed';
        else if (d1.status === 'flaky') finalClass = 'flaky';
        else if (d1.status === 'skipped') finalClass = 'skipped';
      } else {
        // Collect errors from both
        errorMsgs = [...errorMsgs, ...d2.errors];

        // Core logic:
        // - FLAKY = non-deterministic: passed in one build and failed in the other, OR passed only after retry in either.
        // - CONSISTENT FAILURE = failed in BOTH builds.
        const eitherFlakyInternally = d1.status === 'flaky' || d2.status === 'flaky';
        const buildMismatch = (d1.status === 'passed' && d2.status === 'failed') || 
                               (d1.status === 'failed' && d2.status === 'passed');

        if (eitherFlakyInternally || buildMismatch) {
          finalClass = 'flaky';
        } else if (d1.status === 'failed' && d2.status === 'failed') {
          finalClass = 'failed';
        } else if (d1.status === 'skipped' || d2.status === 'skipped') {
          finalClass = 'skipped';
        }
      }

      // Increment counters
      if (finalClass === 'flaky') flakyCount++;
      else if (finalClass === 'failed') consistentFailureCount++;
      else if (finalClass === 'passed') consistentPassCount++;
      else if (finalClass === 'skipped') skippedCount++;

      // Populate tag stats
      d1.tags.forEach(tag => {
        tagStatsMap[tag].total++;
        if (finalClass === 'passed') tagStatsMap[tag].passed++;
        else if (finalClass === 'flaky') tagStatsMap[tag].flaky++;
        else if (finalClass === 'failed') tagStatsMap[tag].failed++;
      });

      comparisonList.push({
        title: d1.title,
        fullTitle: d1.fullTitle,
        file: d1.file,
        line: d1.line,
        column: d1.column,
        build1Status: d1.status,
        build2Status: d2 ? d2.status : 'missing',
        finalClass: finalClass,
        errors: errorMsgs,
        tags: d1.tags
      });
    });

    // Check if any specs exist in Build 2 but not in Build 1
    build2Results.details.forEach(d2 => {
      const key = d2.fullTitle + '::' + d2.file;
      if (!processedKeys.has(key)) {
        let finalClass = 'passed';
        if (d2.status === 'failed') finalClass = 'failed';
        else if (d2.status === 'flaky') finalClass = 'flaky';
        else if (d2.status === 'skipped') finalClass = 'skipped';

        if (finalClass === 'flaky') flakyCount++;
        else if (finalClass === 'failed') consistentFailureCount++;
        else if (finalClass === 'passed') consistentPassCount++;
        else if (finalClass === 'skipped') skippedCount++;

        d2.tags.forEach(tag => {
          tagStatsMap[tag].total++;
          if (finalClass === 'passed') tagStatsMap[tag].passed++;
          else if (finalClass === 'flaky') tagStatsMap[tag].flaky++;
          else if (finalClass === 'failed') tagStatsMap[tag].failed++;
        });

        comparisonList.push({
          title: d2.title,
          fullTitle: d2.fullTitle,
          file: d2.file,
          line: d2.line,
          column: d2.column,
          build1Status: 'missing',
          build2Status: d2.status,
          finalClass: finalClass,
          errors: d2.errors,
          tags: d2.tags
        });
      }
    });

    // 4. Update UI KPIs
    const totalSpecs = comparisonList.length;
    elKpiTotal.textContent = totalSpecs;
    elKpiPassed.textContent = consistentPassCount;
    
    const passedPercent = totalSpecs > 0 ? Math.round((consistentPassCount / totalSpecs) * 100) : 0;
    elKpiPassedPct.textContent = `${passedPercent}% of suite`;
    elKpiFlaky.textContent = flakyCount;
    elKpiFailed.textContent = consistentFailureCount;

    // Extract key counts (P0 vs P1)
    let p0Count = 0;
    let p1Count = 0;
    comparisonList.forEach(c => {
      const isP0 = c.tags.some(t => t.toLowerCase() === 'p0');
      const isP1 = c.tags.some(t => t.toLowerCase() === 'p1');
      if (isP0) p0Count++;
      else if (isP1) p1Count++;
    });
    elKpiP0Count.textContent = p0Count;
    elKpiP1Count.textContent = p1Count;

    // Suite execution durations
    const b1Sec = Math.round(build1Results.durationMs / 1000);
    const b2Sec = Math.round(build2Results.durationMs / 1000);
    elKpiB1Duration.textContent = formatDuration(b1Sec);
    elKpiB2Duration.textContent = formatDuration(b2Sec);

    // 5. Update Health Score
    // Health score: Consistent passes + skipped contribute positive. Flaky deducts 5%, Consistent Failure deducts 10%.
    let healthScore = 100;
    if (totalSpecs > 0) {
      healthScore = ((consistentPassCount + skippedCount) / totalSpecs) * 100;
    }
    const roundedHealth = Math.round(healthScore * 10) / 10;
    elHealthPctText.textContent = `${roundedHealth}%`;
    
    // Set circle progress
    const strokeDash = Math.round(roundedHealth);
    elHealthSvgFill.style.strokeDasharray = `${strokeDash}, 100`;

    // Health color code
    if (roundedHealth >= 90) {
      elHealthSvgFill.style.stroke = 'var(--color-success)';
      elHealthPctText.style.color = 'var(--color-success)';
    } else if (roundedHealth >= 75) {
      elHealthSvgFill.style.stroke = 'var(--color-warning)';
      elHealthPctText.style.color = 'var(--color-warning)';
    } else {
      elHealthSvgFill.style.stroke = 'var(--color-danger)';
      elHealthPctText.style.color = 'var(--color-danger)';
    }

    // Health description narrative
    let healthText = `Your test suite shows outstanding reliability at ${roundedHealth}%. `;
    if (flakyCount > 0 || consistentFailureCount > 0) {
      healthText = `Your suite shows reliability of ${roundedHealth}%, with `;
      const issues = [];
      if (flakyCount > 0) issues.push(`${flakyCount} flaky test${flakyCount > 1 ? 's' : ''}`);
      if (consistentFailureCount > 0) issues.push(`${consistentFailureCount} consistent bug${consistentFailureCount > 1 ? 's' : ''}`);
      healthText += issues.join(' and ') + '. Address consistent failures before rerun checks.';
    } else {
      healthText += 'All tests passed consistently across runs.';
    }
    elHealthDescText.textContent = healthText;

    // Badges update
    elBadgeFlaky.textContent = flakyCount;
    elBadgeFailed.textContent = consistentFailureCount;

    // 6. Build Roster Tables & Lists
    buildFlakyTable(comparisonList);
    buildConsistentFailuresList(comparisonList);
    buildTagStatsGrid(tagStatsMap);

    // 7. Update Charts
    updateCharts(b1Sec, b2Sec, consistentPassCount, flakyCount, consistentFailureCount, skippedCount);

    // 8. Generate Report (AI or Local fallback)
    elLoadingStatus.textContent = 'Generating engineering report...';
    await generateReport(comparisonList, flakyCount, consistentFailureCount, totalSpecs, roundedHealth);

    // Hide loader & Show Results
    elLoadingContainer.classList.add('hidden');
    elResultsContainer.classList.remove('hidden');
    
    // Go to overview panel
    document.getElementById('tab-overview').click();

  } catch (err) {
    console.error(err);
    alert(`Reliability analysis failed: ${err.message}`);
    elLoadingContainer.classList.add('hidden');
  }
}

// --- Render Table for Flaky Tests ---
function buildFlakyTable(comparisonList) {
  elFlakyTableBody.innerHTML = '';
  const flakyList = comparisonList.filter(c => c.finalClass === 'flaky');

  if (flakyList.length === 0) {
    elFlakyTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-dim" style="padding: 2rem;">
          <i data-lucide="smile" style="width: 24px; height: 24px; margin-bottom: 0.5rem; display: block; margin-left: auto; margin-right: auto; color: var(--color-success);"></i>
          No flaky tests detected in this suite.
        </td>
      </tr>
    `;
    lucide.createIcons();
    return;
  }

  flakyList.forEach(item => {
    const tr = document.createElement('tr');
    
    // Categorize error for local hypothesis
    const diagnostic = categorizeError(item.errors.length ? item.errors[0] : '');

    tr.innerHTML = `
      <td class="test-title-cell">${escapeHtml(item.fullTitle)}</td>
      <td class="test-file-cell">${escapeHtml(item.file)}:${item.line}</td>
      <td><span class="status-pill ${item.build1Status.startsWith('pass') ? 'pass' : (item.build1Status === 'skipped' ? 'skipped' : 'fail')}">${item.build1Status.toUpperCase()}</span></td>
      <td><span class="status-pill ${item.build2Status.startsWith('pass') ? 'pass' : (item.build2Status === 'skipped' ? 'skipped' : 'fail')}">${item.build2Status.toUpperCase()}</span></td>
      <td class="hypothesis-cell text-glow-amber">${escapeHtml(diagnostic.hypothesis)}</td>
    `;
    elFlakyTableBody.appendChild(tr);
  });
  lucide.createIcons();
}

// --- Render Accordion for Consistent Failures ---
function buildConsistentFailuresList(comparisonList) {
  elFailuresList.innerHTML = '';
  const failedList = comparisonList.filter(c => c.finalClass === 'failed');

  if (failedList.length === 0) {
    elFailuresList.innerHTML = `
      <div class="text-center card glass text-dim" style="padding: 2rem;">
        <i data-lucide="check-circle" style="width: 28px; height: 28px; margin-bottom: 0.5rem; display: block; margin-left: auto; margin-right: auto; color: var(--color-success);"></i>
        Excellent! No consistent failures detected in either build.
      </div>
    `;
    lucide.createIcons();
    return;
  }

  failedList.forEach((item, index) => {
    const acc = document.createElement('div');
    acc.className = 'failure-accordion';
    
    const diagnostic = categorizeError(item.errors.length ? item.errors[0] : '');
    const cleanErrorLog = item.errors.join('\n\n') || 'No details stack trace provided in run logs.';

    acc.innerHTML = `
      <div class="failure-accordion-header" id="failed-header-${index}">
        <div class="failure-header-left">
          <div class="failure-icon-container">
            <i data-lucide="alert-triangle"></i>
          </div>
          <div class="failure-meta">
            <h4 class="failure-title">${escapeHtml(item.title)}</h4>
            <span class="failure-subtitle">
              File: <code>${escapeHtml(item.file)}:${item.line}</code>
              &bull; Action: <span class="status-pill fail">FAILED IN BOTH</span>
            </span>
          </div>
        </div>
        <div class="failure-header-right">
          <span class="toggle-indicator"><i data-lucide="chevron-down"></i></span>
        </div>
      </div>
      <div class="failure-accordion-content">
        <div class="failure-details-grid">
          <div class="error-diagnostic-bar">
            <div class="diagnostic-label">Probable Root Cause</div>
            <div class="diagnostic-text">${escapeHtml(diagnostic.hypothesis)}</div>
          </div>
          <div class="diagnostic-label">Playwright Terminal Stack Trace</div>
          <pre class="code-log-box"><code>${escapeHtml(cleanErrorLog)}</code></pre>
        </div>
      </div>
    `;

    // Collapsible logic
    acc.querySelector('.failure-accordion-header').addEventListener('click', () => {
      acc.classList.toggle('open');
    });

    elFailuresList.appendChild(acc);
  });
  lucide.createIcons();
}

// --- Render Tags Grid ---
function buildTagStatsGrid(tagStatsMap) {
  elTagsGrid.innerHTML = '';
  
  const tags = Object.keys(tagStatsMap);
  if (tags.length === 0) {
    elTagsGrid.innerHTML = `<p class="text-dim">No specific playwright spec tags discovered in reports.</p>`;
    return;
  }

  tags.forEach(tag => {
    const data = tagStatsMap[tag];
    const pct = data.total > 0 ? Math.round((data.passed / data.total) * 100) : 0;
    
    let progressClass = '';
    if (pct < 75) progressClass = 'danger';
    else if (pct < 95) progressClass = 'warning';

    const row = document.createElement('div');
    row.className = 'tag-rate-row';
    row.innerHTML = `
      <div class="tag-rate-header">
        <span class="tag-badge">@${escapeHtml(tag)}</span>
        <span class="tag-pct-value">${pct}%</span>
      </div>
      <div class="tag-progress-bar-bg">
        <div class="tag-progress-bar-fill ${progressClass}" style="width: ${pct}%"></div>
      </div>
      <div class="tag-meta-sub">
        <span>Passed: <strong>${data.passed}/${data.total}</strong></span>
        <span>Flaky: <strong>${data.flaky}</strong> &bull; Fail: <strong>${data.failed}</strong></span>
      </div>
    `;
    elTagsGrid.appendChild(row);
  });
}

// --- Duration & Issues Charts Renderer ---
function updateCharts(b1Sec, b2Sec, passes, flakes, failures, skips) {
  // Chart 1: Build Duration Comparison
  if (durationChart) durationChart.destroy();
  
  const ctxDuration = document.getElementById('durationChart').getContext('2d');
  durationChart = new Chart(ctxDuration, {
    type: 'bar',
    data: {
      labels: ['Build 1 (Baseline)', 'Build 2 (Comparison)'],
      datasets: [{
        label: 'Duration (seconds)',
        data: [b1Sec, b2Sec],
        backgroundColor: ['rgba(59, 130, 246, 0.5)', 'rgba(168, 85, 247, 0.5)'],
        borderColor: ['#3b82f6', '#a855f7'],
        borderWidth: 2,
        borderRadius: 8,
        barThickness: 50
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#9ca3af' }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#9ca3af' }
        }
      }
    }
  });

  // Chart 2: Issues Distribution
  if (issuesChart) issuesChart.destroy();

  const ctxIssues = document.getElementById('issuesChart').getContext('2d');
  issuesChart = new Chart(ctxIssues, {
    type: 'doughnut',
    data: {
      labels: ['Consistent Pass', 'Flaky Test', 'Consistent Failure', 'Skipped'],
      datasets: [{
        data: [passes, flakes, failures, skips],
        backgroundColor: [
          'rgba(16, 185, 129, 0.5)',
          'rgba(245, 158, 11, 0.5)',
          'rgba(239, 68, 68, 0.5)',
          'rgba(255, 255, 255, 0.1)'
        ],
        borderColor: [
          '#10b981',
          '#f59e0b',
          '#ef4444',
          'rgba(255, 255, 255, 0.07)'
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: '#9ca3af', font: { family: 'Outfit' } }
        }
      },
      cutout: '65%'
    }
  });
}

// --- Report Generation (AI and Fallback Local Analysis) ---
let currentReportText = '';

async function generateReport(comparisonList, flakyCount, failedCount, totalCount, healthPct) {
  const apiKey = elApiKeyInput.value.trim();

  // Create standard text summary representation of the reports
  const flakyList = comparisonList.filter(c => c.finalClass === 'flaky');
  const failedList = comparisonList.filter(c => c.finalClass === 'failed');

  let flakyTextSegment = '';
  if (flakyList.length > 0) {
    flakyList.forEach((t, i) => {
      const diag = categorizeError(t.errors.length ? t.errors[0] : '');
      flakyTextSegment += `${i+1}. ${t.fullTitle}\n   - File: ${t.file}:${t.line}\n   - Build 1 Status: ${t.build1Status}, Build 2 Status: ${t.build2Status}\n   - Error snippet: ${t.errors.length ? t.errors[0].split('\n')[0] : 'N/A'}\n   - Local hypothesis: ${diag.hypothesis}\n`;
    });
  } else {
    flakyTextSegment = 'None detected.\n';
  }

  let failedTextSegment = '';
  if (failedList.length > 0) {
    failedList.forEach((t, i) => {
      const diag = categorizeError(t.errors.length ? t.errors[0] : '');
      failedTextSegment += `${i+1}. ${t.fullTitle}\n   - File: ${t.file}:${t.line}\n   - Build 1 Status: ${t.build1Status}, Build 2 Status: ${t.build2Status}\n   - Error log: ${t.errors.length ? t.errors[0].slice(0, 150) + '...' : 'N/A'}\n   - Local hypothesis: ${diag.hypothesis}\n`;
    });
  } else {
    failedTextSegment = 'None detected.\n';
  }

  // Pre-compiled local engineering report (matches prompt.md perfectly)
  const localReport = `# Playwright Test Runs Reliability Report

**Baseline File (Build 1):** ${build1FileName}
**Comparison File (Build 2):** ${build2FileName}

## 1. FLAKY_TESTS

${flakyList.length > 0 ? flakyList.map((t, idx) => {
  const diag = categorizeError(t.errors.length ? t.errors[0] : '');
  return `* **${t.fullTitle}**
  * *Hypothesis:* Timing issue. ${diag.hypothesis}`;
}).join('\n') : 'No flaky tests identified in this run comparison.'}

## 2. CONSISTENT_FAILURES

${failedList.length > 0 ? failedList.map((t, idx) => {
  const diag = categorizeError(t.errors.length ? t.errors[0] : '');
  return `* **${t.fullTitle}**
  * *Probable Root Cause:* Codebase bug. ${diag.hypothesis} (${t.errors.length ? t.errors[0].split('\n')[0] : 'Error details not found'})`;
}).join('\n') : 'No consistent failures identified. Test outcomes are functional.'}

## 3. RERUN_RECOMMENDATION

${flakyList.length > 0 ? `* **Rerun Required (Flaky Tests):**
${flakyList.map(t => `  - \`${t.fullTitle}\` (Run with command: \`npx playwright test ${t.file} -g "${t.title}"\`)`).join('\n')}` : '* No reruns needed for flaky tests.'}
${failedList.length > 0 ? `* **Send to Engineering (Consistent Bugs):**
${failedList.map(t => `  - \`${t.fullTitle}\` (Needs structural bug ticket or validation fix)`).join('\n')}` : '* No failures need sending to engineering.'}

## 4. SUMMARY

* **Total Spec Comparison Count:** ${totalCount}
* **Consistent Passes:** ${totalCount - flakyCount - failedCount}
* **Flaky Tests Count:** ${flakyCount}
* **Consistent Failures Count:** ${failedCount}
* **Overall Suite Health Score:** ${healthPct}%
* **Suite Health Statement:** The test suite shows a health score of ${healthPct}%. ${failedCount > 0 ? `Engineering must resolve the ${failedCount} consistent codebase regressions immediately.` : ''} ${flakyCount > 0 ? `Quarantine or increase timeouts for the ${flakyCount} identified flaky tests.` : 'No critical flake or failures are active.'}
`;

  // AI-assisted Generation if API Key exists
  if (apiKey) {
    try {
      elLoadingStatus.textContent = 'Calling Gemini AI for senior-level report insights...';
      const promptText = `
You are a senior test reliability engineer. You are given a comparison of two Playwright runs (Build 1 and Build 2) of the same suite.

COMPARISON REPORT DATA:
Build 1: ${build1FileName}
Build 2: ${build2FileName}

List of Identified FLAKY Tests:
${flakyTextSegment}

List of Identified CONSISTENT FAILURES:
${failedTextSegment}

Total Comparison Stats:
- Total tests compared: ${totalCount}
- Consistent passes: ${totalCount - flakyCount - failedCount}
- Flaky tests: ${flakyCount}
- Consistent failures: ${failedCount}
- Suite health score: ${healthPct}%

Definitions you MUST follow:
- FLAKY = non-deterministic result: passed in one build and failed in the other, OR passed only after a retry. Flaky tests need a rerun / quarantine, not a code fix.
- CONSISTENT FAILURE = failed in BOTH builds. A real, reproducible bug, NOT flaky. Needs a fix.

Produce the markdown document exactly structured as follows:
1. FLAKY_TESTS - list test name + a clever, highly technical one-line hypothesis of flake cause (focus on timing, selector race conditions, dataset conflicts, asynchronous execution, or network delays based on the error logs).
2. CONSISTENT_FAILURES - tests failing in both builds, each with a highly technical probable root cause referencing the expected vs received status code (e.g. server returning 500 instead of 401, chart data returning 0 instead of total, etc.).
3. RERUN_RECOMMENDATION - tell which specific tests to rerun (flaky) vs which to send to engineering team (consistent bugs). Offer playwright command line syntax for reruns.
4. SUMMARY - counts of categories + one concise concluding sentence summarizing suite health.

Do not add additional greetings or conversational chatter outside the markdown sections. Return only markdown code.
`;

      const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        })
      });

      if (!aiResponse.ok) {
        throw new Error(`Gemini API Error: Status ${aiResponse.status}`);
      }

      const resJson = await aiResponse.json();
      const aiText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (aiText) {
        currentReportText = aiText;
        elReportRendered.innerHTML = marked.parse(aiText);
        return;
      }
    } catch (apiErr) {
      console.error('Gemini API call failed, falling back to local report:', apiErr);
      alert(`AI report generation failed (${apiErr.message}). Displaying the local rule-based engineering report instead.`);
    }
  }

  // Display Local Report (Fallback)
  currentReportText = localReport;
  elReportRendered.innerHTML = marked.parse(localReport);
}

// --- Report Actions Setup ---
function setupReportActions() {
  // Copy to clipboard
  elBtnCopyReport.addEventListener('click', () => {
    navigator.clipboard.writeText(currentReportText)
      .then(() => {
        const originalText = elBtnCopyReport.innerHTML;
        elBtnCopyReport.innerHTML = '<i data-lucide="check" class="btn-icon-left"></i> Copied!';
        lucide.createIcons();
        setTimeout(() => {
          elBtnCopyReport.innerHTML = originalText;
          lucide.createIcons();
        }, 2000);
      })
      .catch(err => {
        alert('Could not copy report text: ', err);
      });
  });

  // Download Markdown
  elBtnDownloadReport.addEventListener('click', () => {
    const blob = new Blob([currentReportText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Playwright_Suite_Reliability_Report.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // AI Regenerate
  elBtnAiRegenerate.addEventListener('click', async () => {
    const apiKey = elApiKeyInput.value.trim();
    if (!apiKey) {
      alert('Please enter your Gemini API Key in the settings panel to enable AI analysis!');
      return;
    }
    
    // We rerun the analysis to trigger AI report regeneration
    await runReliabilityAnalysis();
  });
}

// --- General Utilities ---
function formatDuration(sec) {
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const remainder = sec % 60;
  return remainder > 0 ? `${min}m ${remainder}s` : `${min}m`;
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
