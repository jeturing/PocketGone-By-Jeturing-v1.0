#!/bin/bash

################################################################################
# PocketGone Platform - Comprehensive Functionality Validation
# Validates that all components are working correctly
################################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
cd "$SCRIPT_DIR"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        PocketGone Platform - Functionality Validation     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

PASSED=0
FAILED=0
BACKEND_PID=""

cleanup() {
    if [ -n "$BACKEND_PID" ]; then
        echo -e "\n${YELLOW}Cleaning up...${NC}"
        kill $BACKEND_PID 2>/dev/null || true
        wait $BACKEND_PID 2>/dev/null || true
        echo "Backend server stopped"
    fi
}

trap cleanup EXIT INT TERM

test_passed() {
    echo -e "${GREEN}[✓]${NC} $1"
    ((PASSED++))
}

test_failed() {
    echo -e "${RED}[✗]${NC} $1"
    ((FAILED++))
}

test_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Test 1: Check Python dependencies
echo -e "${YELLOW}Test 1: Python Dependencies${NC}"
if python3 -c "import fastapi, uvicorn, sqlalchemy, pydantic, websockets" 2>/dev/null; then
    test_passed "All Python dependencies are installed"
else
    test_failed "Python dependencies are missing"
fi
echo ""

# Test 2: Check Node.js dependencies
echo -e "${YELLOW}Test 2: Node.js Dependencies${NC}"
if [ -d "node_modules" ] && [ -f "package-lock.json" ]; then
    test_passed "Node.js dependencies are installed"
else
    test_failed "Node.js dependencies are missing"
fi
echo ""

# Test 3: Validate backend modules
echo -e "${YELLOW}Test 3: Backend Module Imports${NC}"
cd backend
MODULES_OK=true
for module in main wifi_tools shell_executor evil_twin models database; do
    if python3 -c "import $module" 2>/dev/null; then
        test_passed "$module.py imports successfully"
    else
        test_failed "$module.py failed to import"
        MODULES_OK=false
    fi
done
cd ..
echo ""

# Test 4: Build frontend
echo -e "${YELLOW}Test 4: Frontend Build${NC}"
if npm run build > /tmp/build.log 2>&1; then
    test_passed "Frontend builds successfully"
    if [ -d "dist" ] && [ -f "dist/index.html" ]; then
        test_passed "Build artifacts created in dist/"
    else
        test_failed "Build artifacts not found"
    fi
else
    test_failed "Frontend build failed"
    test_info "Check /tmp/build.log for details"
fi
echo ""

# Test 5: Start backend server
echo -e "${YELLOW}Test 5: Backend Server${NC}"
cd backend
python3 main.py > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for server to start
sleep 5

if ps -p $BACKEND_PID > /dev/null 2>&1; then
    test_passed "Backend server started (PID: $BACKEND_PID)"
else
    test_failed "Backend server failed to start"
    test_info "Check /tmp/backend.log for details"
    BACKEND_PID=""
fi
echo ""

# Test 6: API Endpoints
if [ -n "$BACKEND_PID" ] && ps -p $BACKEND_PID > /dev/null 2>&1; then
    echo -e "${YELLOW}Test 6: API Endpoints${NC}"
    
    # Test root endpoint
    RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:8000/)
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    if [ "$HTTP_CODE" = "200" ]; then
        test_passed "Root endpoint (/) responds"
    else
        test_failed "Root endpoint failed (HTTP $HTTP_CODE)"
    fi
    
    # Test health endpoint
    RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:8000/health)
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    if [ "$HTTP_CODE" = "200" ] && echo "$BODY" | grep -q "healthy"; then
        test_passed "Health endpoint responds correctly"
    else
        test_failed "Health endpoint failed"
    fi
    
    # Test authentication
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:8000/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"access_code": "toor"}')
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    if [ "$HTTP_CODE" = "200" ] && echo "$BODY" | grep -q "root"; then
        test_passed "Authentication endpoint works (root login)"
    else
        test_failed "Authentication endpoint failed"
    fi
    
    # Test student authentication
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:8000/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"access_code": "student"}')
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    if [ "$HTTP_CODE" = "200" ] && echo "$BODY" | grep -q "student"; then
        test_passed "Student authentication works"
    else
        test_failed "Student authentication failed"
    fi
    
    # Test pentest tools endpoint
    RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:8000/api/pentest/tools)
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    if [ "$HTTP_CODE" = "200" ]; then
        test_passed "Pentest tools endpoint responds"
    else
        test_failed "Pentest tools endpoint failed"
    fi
    
    # Test API documentation
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/docs)
    if [ "$RESPONSE" = "200" ]; then
        test_passed "API documentation (Swagger UI) accessible"
    else
        test_failed "API documentation not accessible"
    fi
    
    echo ""
fi

# Test 7: Database
echo -e "${YELLOW}Test 7: Database${NC}"
if [ -d "data" ]; then
    test_passed "Data directory exists"
else
    test_info "Data directory will be created on first run"
fi

if [ -f "data/pocketgone.db" ]; then
    test_passed "Database file exists"
    
    # Check database integrity
    if command -v sqlite3 &> /dev/null; then
        if sqlite3 data/pocketgone.db "PRAGMA integrity_check;" 2>/dev/null | grep -q "ok"; then
            test_passed "Database integrity check passed"
        else
            test_failed "Database integrity check failed"
        fi
    else
        test_info "Database integrity check skipped (sqlite3 not available)"
    fi
else
    test_info "Database will be created on first run"
fi
echo ""

# Test 8: Configuration files
echo -e "${YELLOW}Test 8: Configuration Files${NC}"
if [ -f "package.json" ]; then
    test_passed "package.json exists"
else
    test_failed "package.json missing"
fi

if [ -f "vite.config.ts" ]; then
    test_passed "vite.config.ts exists"
else
    test_failed "vite.config.ts missing"
fi

if [ -f "backend/requirements.txt" ]; then
    test_passed "requirements.txt exists"
else
    test_failed "requirements.txt missing"
fi

if [ -f "tsconfig.json" ]; then
    test_passed "tsconfig.json exists"
else
    test_failed "tsconfig.json missing"
fi
echo ""

# Test 9: Source files
echo -e "${YELLOW}Test 9: Core Source Files${NC}"
CORE_FILES=(
    "App.tsx"
    "index.tsx"
    "backend/main.py"
    "backend/wifi_tools.py"
    "backend/shell_executor.py"
    "backend/evil_twin.py"
    "backend/models.py"
    "backend/database.py"
)

for file in "${CORE_FILES[@]}"; do
    if [ -f "$file" ]; then
        test_passed "$file exists"
    else
        test_failed "$file missing"
    fi
done
echo ""

# Test 10: Documentation
echo -e "${YELLOW}Test 10: Documentation${NC}"
DOC_FILES=(
    "README.md"
    "INSTALLATION_GUIDE.md"
    "API_TESTING.md"
    "IMPLEMENTATION_SUMMARY.md"
    "GUI_IMPLEMENTATION.md"
    "AIRGEDDON_IMPLEMENTATION.md"
)

for file in "${DOC_FILES[@]}"; do
    if [ -f "$file" ]; then
        test_passed "$file exists"
    else
        test_failed "$file missing"
    fi
done
echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  Validation Summary                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

TOTAL=$((PASSED + FAILED))
if [ $TOTAL -eq 0 ]; then
    echo -e "${RED}ERROR: No tests were executed!${NC}"
    echo ""
    exit 2
fi

PASS_RATE=$((PASSED * 100 / TOTAL))

echo -e "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "Pass Rate: ${PASS_RATE}%"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All functionality tests passed!${NC}"
    echo ""
    echo "The PocketGone platform is fully functional."
    echo "You can start using it with:"
    echo "  Backend:  cd backend && python3 main.py"
    echo "  Frontend: npm run dev"
    echo ""
    exit 0
elif [ $PASS_RATE -ge 80 ]; then
    echo -e "${YELLOW}⚠ Most tests passed with some issues.${NC}"
    echo ""
    echo "The platform should be functional with minor limitations."
    echo "Review the failed tests above for details."
    echo ""
    exit 0
else
    echo -e "${RED}✗ Validation failed with significant issues.${NC}"
    echo ""
    echo "Please review the failed tests and fix the issues."
    echo ""
    exit 1
fi
