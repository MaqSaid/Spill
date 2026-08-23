# Spill — Submission Readiness Check
# Validates all evaluation criteria are satisfied before submission.
#
# Evaluation Criteria:
#   Application Quality: 40 pts
#   Kiro Usage: 20 pts
#   Documentation: 20 pts
#   Innovation and Potential: 15 pts
#   Presentation: 5 pts

$ErrorActionPreference = "Continue"
$script:passed = 0
$script:failed = 0
$script:warnings = 0

function Check-Pass($description) {
    $script:passed++
    Write-Host "  [PASS] $description" -ForegroundColor Green
}

function Check-Fail($description) {
    $script:failed++
    Write-Host "  [FAIL] $description" -ForegroundColor Red
}

function Check-Warn($description) {
    $script:warnings++
    Write-Host "  [WARN] $description" -ForegroundColor Yellow
}

function Test-FileExists($path, $description) {
    if (Test-Path $path) {
        Check-Pass $description
    } else {
        Check-Fail "$description (missing: $path)"
    }
}

function Test-DirHasFiles($path, $minCount, $description) {
    if (Test-Path $path) {
        $count = (Get-ChildItem $path -File).Count
        if ($count -ge $minCount) {
            Check-Pass "$description ($count files)"
        } else {
            Check-Fail "$description (found $count, need $minCount)"
        }
    } else {
        Check-Fail "$description (directory missing: $path)"
    }
}

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not (Test-Path "$root\README.md")) {
    $root = $PSScriptRoot -replace "\\scripts$", ""
}
if (-not (Test-Path "$root\README.md")) {
    $root = Get-Location
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " SPILL — Submission Readiness Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ─── APPLICATION QUALITY (40 pts) ─────────────────────────────────────────

Write-Host "APPLICATION QUALITY (40 pts)" -ForegroundColor Magenta
Write-Host "─────────────────────────────────────────"

Write-Host "  Core Features:" -ForegroundColor White
Test-FileExists "$root\backend\src\spill\core\use_cases\submit_feedback.py" "SubmitFeedback use case"
Test-FileExists "$root\backend\src\spill\core\use_cases\check_status.py" "CheckStatus use case"
Test-FileExists "$root\backend\src\spill\core\use_cases\manage_submissions.py" "ManageSubmissions use case"
Test-FileExists "$root\frontend\src\pages\SubmitPage.tsx" "Submit page"
Test-FileExists "$root\frontend\src\pages\StatusPage.tsx" "Status page"
Test-FileExists "$root\frontend\src\pages\AdminPage.tsx" "Admin page"

Write-Host "  Encryption (Zero-Knowledge):" -ForegroundColor White
Test-FileExists "$root\frontend\src\services\encryption.ts" "Encryption service (AES-256-GCM + RSA-OAEP)"
Test-FileExists "$root\frontend\src\services\session.ts" "Session service (ephemeral tokens)"
Test-FileExists "$root\frontend\src\components\EncryptionIndicator.tsx" "Encryption status indicator"

Write-Host "  Privacy & Security:" -ForegroundColor White
Test-FileExists "$root\backend\src\spill\adapters\api\middleware.py" "MetadataPurgingMiddleware"
Test-FileExists "$root\backend\src\spill\adapters\api\rate_limiter.py" "Rate limiter middleware"
Test-FileExists "$root\backend\src\spill\core\entities\submission.py" "Domain entity (state machine)"

Write-Host "  Architecture:" -ForegroundColor White
Test-FileExists "$root\backend\src\spill\core\ports\repository.py" "Repository port (Protocol)"
Test-FileExists "$root\backend\src\spill\adapters\db\repository.py" "PostgreSQL adapter"
Test-FileExists "$root\backend\src\spill\adapters\api\app.py" "App factory"

Write-Host "  Testing:" -ForegroundColor White
Test-DirHasFiles "$root\backend\tests\unit" 3 "Backend unit tests"
Test-DirHasFiles "$root\backend\tests\integration" 1 "Backend integration tests"
Test-FileExists "$root\backend\tests\unit\test_hypothesis.py" "Property-based tests (Hypothesis)"
Test-FileExists "$root\frontend\src\test\encryption-roundtrip.test.ts" "Encryption round-trip tests"
Test-FileExists "$root\frontend\src\test\session.test.ts" "Session service tests"
Test-FileExists "$root\frontend\e2e\submission-flow.spec.ts" "E2E tests (Playwright)"

Write-Host "  Infrastructure:" -ForegroundColor White
Test-FileExists "$root\backend\Dockerfile" "Backend Dockerfile"
Test-FileExists "$root\frontend\Dockerfile" "Frontend Dockerfile"
Test-FileExists "$root\docker-compose.yml" "Docker Compose"
Test-FileExists "$root\backend\alembic\versions\001_initial_submissions.py" "Database migration"
Test-FileExists "$root\.github\workflows\ci.yml" "CI/CD pipeline"
Test-FileExists "$root\frontend\package-lock.json" "Package lock file"

Write-Host ""

# ─── KIRO USAGE (20 pts) ──────────────────────────────────────────────────

Write-Host "KIRO USAGE (20 pts)" -ForegroundColor Magenta
Write-Host "─────────────────────────────────────────"

Write-Host "  Specs:" -ForegroundColor White
Test-FileExists "$root\.kiro\specs\requirements.md" "Requirements spec"
Test-FileExists "$root\.kiro\specs\design.md" "Design spec"
Test-FileExists "$root\.kiro\specs\tasks.md" "Tasks spec"

Write-Host "  Steering Files:" -ForegroundColor White
Test-DirHasFiles "$root\.kiro\steering" 8 "Steering files (8+ expected)"

Write-Host "  Agent Hooks:" -ForegroundColor White
Test-DirHasFiles "$root\.kiro\hooks" 8 "Agent hooks (8+ expected)"

Write-Host "  Kiro Usage Documentation:" -ForegroundColor White
Test-FileExists "$root\docs\kiro-usage.md" "Kiro usage narrative"

Write-Host ""

# ─── DOCUMENTATION (20 pts) ───────────────────────────────────────────────

Write-Host "DOCUMENTATION (20 pts)" -ForegroundColor Magenta
Write-Host "─────────────────────────────────────────"

Test-FileExists "$root\README.md" "Project README"
Test-FileExists "$root\docs\threat-model.md" "Threat model"
Test-FileExists "$root\docs\canary-deployment-runbook.md" "Deployment runbook"
Test-DirHasFiles "$root\docs\adr" 3 "Architecture Decision Records"
Test-FileExists "$root\backend\.env.example" "Environment variable template"

# Check README has key sections
if (Test-Path "$root\README.md") {
    $readme = Get-Content "$root\README.md" -Raw
    if ($readme -match "Quick Start") { Check-Pass "README has setup instructions" }
    else { Check-Fail "README missing setup instructions" }
    if ($readme -match "Security Model") { Check-Pass "README has security model" }
    else { Check-Fail "README missing security model" }
    if ($readme -match "Architecture") { Check-Pass "README has architecture section" }
    else { Check-Fail "README missing architecture section" }
    if ($readme -match "Kiro") { Check-Pass "README references Kiro usage" }
    else { Check-Warn "README should reference Kiro usage" }
}

Write-Host ""

# ─── INNOVATION AND POTENTIAL (15 pts) ────────────────────────────────────

Write-Host "INNOVATION AND POTENTIAL (15 pts)" -ForegroundColor Magenta
Write-Host "─────────────────────────────────────────"

Test-FileExists "$root\docs\threat-model.md" "Threat model document"
Test-FileExists "$root\backend\src\spill\adapters\api\rate_limiter.py" "Rate limiting (defense in depth)"

# Check for zero-knowledge implementation
if (Test-Path "$root\backend\src\spill\adapters\api\middleware.py") {
    $middleware = Get-Content "$root\backend\src\spill\adapters\api\middleware.py" -Raw
    if ($middleware -match "0\.0\.0\.0") { Check-Pass "IP override to 0.0.0.0" }
    else { Check-Fail "Missing IP anonymization" }
}

if (Test-Path "$root\frontend\src\services\encryption.ts") {
    $encryption = Get-Content "$root\frontend\src\services\encryption.ts" -Raw
    if ($encryption -match "AES-GCM") { Check-Pass "AES-256-GCM encryption" }
    else { Check-Fail "Missing AES-GCM encryption" }
    if ($encryption -match "RSA-OAEP") { Check-Pass "RSA-OAEP key wrapping" }
    else { Check-Fail "Missing RSA-OAEP key wrapping" }
}

if (Test-Path "$root\backend\src\spill\core\entities\submission.py") {
    $entity = Get-Content "$root\backend\src\spill\core\entities\submission.py" -Raw
    if ($entity -match "frozen=True") { Check-Pass "Immutable domain entities" }
    else { Check-Warn "Domain entities should be immutable" }
    if ($entity -match "transition_status") { Check-Pass "State machine transitions" }
    else { Check-Fail "Missing state machine" }
}

Write-Host ""

# ─── PRESENTATION (5 pts) ─────────────────────────────────────────────────

Write-Host "PRESENTATION (5 pts)" -ForegroundColor Magenta
Write-Host "─────────────────────────────────────────"

Test-FileExists "$root\frontend\src\components\EncryptionIndicator.tsx" "Visual encryption indicator"
Test-FileExists "$root\frontend\tailwind.config.js" "Tailwind CSS configured"

if (Test-Path "$root\frontend\src\App.tsx") {
    $app = Get-Content "$root\frontend\src\App.tsx" -Raw
    if ($app -match "skip.*main.*content") { Check-Pass "Skip-to-content link (accessibility)" }
    else { Check-Warn "Consider adding skip-to-content link" }
    if ($app -match "aria-label") { Check-Pass "ARIA labels present" }
    else { Check-Warn "Consider adding ARIA labels" }
}

Write-Host ""

# ─── COMPETITION SUBMISSION REQUIREMENTS ──────────────────────────────────

Write-Host "COMPETITION SUBMISSION REQUIREMENTS" -ForegroundColor Magenta
Write-Host "─────────────────────────────────────────"

Write-Host "  Required Materials:" -ForegroundColor White
Test-FileExists "$root\docs\project-description.md" "Written project description"
Test-FileExists "$root\README.md" "Complete README"
Test-FileExists "$root\docker-compose.yml" "Working test build (Docker)"

Write-Host "  .kiro Directory (must NOT be gitignored):" -ForegroundColor White
Test-FileExists "$root\.kiro\specs\requirements.md" ".kiro/specs/requirements.md"
Test-FileExists "$root\.kiro\specs\design.md" ".kiro/specs/design.md"
Test-FileExists "$root\.kiro\specs\tasks.md" ".kiro/specs/tasks.md"
Test-DirHasFiles "$root\.kiro\hooks" 1 ".kiro/hooks present"
Test-DirHasFiles "$root\.kiro\steering" 1 ".kiro/steering present"

# Check .kiro is NOT in .gitignore
if (Test-Path "$root\.gitignore") {
    $gitignore = Get-Content "$root\.gitignore" -Raw
    if ($gitignore -match "\.kiro") { Check-Fail ".kiro is in .gitignore (MUST NOT be excluded)" }
    else { Check-Pass ".kiro not excluded from git" }
}

Write-Host "  README Completeness:" -ForegroundColor White
if (Test-Path "$root\README.md") {
    $readme = Get-Content "$root\README.md" -Raw
    if ($readme -match "Usage Instructions") { Check-Pass "README has usage instructions" }
    else { Check-Fail "README missing usage instructions" }
    if ($readme -match "Test Credentials") { Check-Pass "README has test credentials section" }
    else { Check-Fail "README missing test credentials" }
    if ($readme -match "Attribution") { Check-Pass "README has attribution/licenses" }
    else { Check-Fail "README missing attribution" }
    if ($readme -match "Rate Limit") { Check-Pass "README documents rate limits" }
    else { Check-Fail "README missing rate limits" }
    if ($readme -match "API.*Service Costs|Service Costs|No costs") { Check-Pass "README documents API/service costs" }
    else { Check-Fail "README missing API/service costs" }
    if ($readme -match "Team") { Check-Pass "README identifies team members" }
    else { Check-Fail "README missing team identification" }
}

Write-Host "  Project Description:" -ForegroundColor White
if (Test-Path "$root\docs\project-description.md") {
    $desc = Get-Content "$root\docs\project-description.md" -Raw
    if ($desc -match "Problem") { Check-Pass "Description explains problem" }
    else { Check-Fail "Description missing problem statement" }
    if ($desc -match "Solution") { Check-Pass "Description explains solution" }
    else { Check-Fail "Description missing solution" }
    if ($desc -match "Key Features|Features") { Check-Pass "Description lists key features" }
    else { Check-Fail "Description missing key features" }
}

Write-Host "  No Secrets in Repository:" -ForegroundColor White
Test-FileExists "$root\backend\.env.example" ".env.example (not .env)"
$envTracked = git ls-files --cached "backend/.env" 2>$null
if ($envTracked) { Check-Fail "backend/.env is tracked by git (should be gitignored)" }
else { Check-Pass "backend/.env not tracked by git" }
if (Test-Path "$root\frontend\.env") { Check-Fail "frontend/.env exists (should not be committed)" }
else { Check-Pass "No frontend .env committed" }

Write-Host ""
Write-Host "  ACTION ITEMS (Manual):" -ForegroundColor Yellow
Write-Host "    [ ] Record a demo video" -ForegroundColor Yellow
Write-Host "    [ ] Push to a PUBLIC GitHub repository" -ForegroundColor Yellow
Write-Host "    [ ] Verify docker-compose up works end-to-end" -ForegroundColor Yellow

Write-Host ""

# ─── SUMMARY ──────────────────────────────────────────────────────────────

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " RESULTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Passed:   $script:passed" -ForegroundColor Green
Write-Host "  Failed:   $script:failed" -ForegroundColor Red
Write-Host "  Warnings: $script:warnings" -ForegroundColor Yellow
Write-Host ""

$total = $script:passed + $script:failed
$percentage = if ($total -gt 0) { [math]::Round(($script:passed / $total) * 100) } else { 0 }
Write-Host "  Score: $script:passed/$total checks passed ($percentage%)" -ForegroundColor White
Write-Host ""

if ($script:failed -eq 0) {
    Write-Host "  STATUS: READY FOR SUBMISSION" -ForegroundColor Green
    exit 0
} elseif ($script:failed -le 3) {
    Write-Host "  STATUS: NEARLY READY (fix $script:failed issue(s))" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "  STATUS: NOT READY ($script:failed issues to fix)" -ForegroundColor Red
    exit 1
}
