#!/bin/bash

################################################################################
# PocketGone Platform - Verification Script
# Verifies that the installation completed successfully
################################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        PocketGone Platform - Installation Verification    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

ERRORS=0
WARNINGS=0

check_command() {
    if command -v "$1" &> /dev/null; then
        echo -e "${GREEN}[✓]${NC} $1 is installed"
        return 0
    else
        echo -e "${RED}[✗]${NC} $1 is NOT installed"
        ((ERRORS++))
        return 1
    fi
}

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}[✓]${NC} $1 exists"
        return 0
    else
        echo -e "${RED}[✗]${NC} $1 is MISSING"
        ((ERRORS++))
        return 1
    fi
}

check_directory() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}[✓]${NC} $1 exists"
        return 0
    else
        echo -e "${RED}[✗]${NC} $1 is MISSING"
        ((ERRORS++))
        return 1
    fi
}

check_optional() {
    if command -v "$1" &> /dev/null; then
        echo -e "${GREEN}[✓]${NC} $1 is installed"
        return 0
    else
        echo -e "${YELLOW}[!]${NC} $1 is not installed (optional)"
        ((WARNINGS++))
        return 1
    fi
}

echo -e "${YELLOW}Checking System Requirements...${NC}"
echo ""

# Check Python
echo "Python:"
check_command python3
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
    echo "  Version: $PYTHON_VERSION"
fi
check_command pip3
echo ""

# Check Node.js
echo "Node.js:"
check_command node
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "  Version: $NODE_VERSION"
fi
check_command npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "  Version: $NPM_VERSION"
fi
echo ""

# Check Pentesting Tools
echo -e "${YELLOW}Checking Pentesting Tools...${NC}"
echo ""

echo "Aircrack-ng Suite:"
check_command airmon-ng
check_command airodump-ng
check_command aireplay-ng
check_command aircrack-ng
echo ""

echo "WiFi Attack Tools:"
check_command wifite
check_command reaver
check_optional mdk3
check_optional mdk4
echo ""

echo "Network Services:"
check_command hostapd
check_command dnsmasq
check_command iptables
echo ""

# Check Application Files
echo -e "${YELLOW}Checking Application Files...${NC}"
echo ""

echo "Backend:"
check_directory "backend"
check_file "backend/main.py"
check_file "backend/requirements.txt"
check_file "backend/wifi_tools.py"
check_file "backend/shell_executor.py"
check_file "backend/evil_twin.py"
check_directory "backend/venv"
echo ""

echo "Frontend:"
check_file "package.json"
check_file "vite.config.ts"
check_file "App.tsx"
check_directory "components"
check_directory "node_modules"
echo ""

echo "Documentation:"
check_file "README.md"
check_file "INSTALLATION_GUIDE.md"
check_file "IMPLEMENTATION_SUMMARY.md"
check_file "API_TESTING.md"
check_file "GUI_IMPLEMENTATION.md"
check_file "AIRGEDDON_IMPLEMENTATION.md"
echo ""

# Check Scripts
echo -e "${YELLOW}Checking Quick Start Scripts...${NC}"
echo ""
check_file "install.sh"
check_file "start-pocketgone.sh"
check_file "stop-pocketgone.sh"
check_file "pocketgone-service.sh"
echo ""

# Check Services
echo -e "${YELLOW}Checking System Services...${NC}"
echo ""
if [ -f /etc/systemd/system/pocketgone-backend.service ]; then
    echo -e "${GREEN}[✓]${NC} pocketgone-backend.service exists"
else
    echo -e "${YELLOW}[!]${NC} pocketgone-backend.service not found (optional)"
    ((WARNINGS++))
fi

if [ -f /etc/systemd/system/pocketgone-frontend.service ]; then
    echo -e "${GREEN}[✓]${NC} pocketgone-frontend.service exists"
else
    echo -e "${YELLOW}[!]${NC} pocketgone-frontend.service not found (optional)"
    ((WARNINGS++))
fi
echo ""

# Check Wireless Interfaces
echo -e "${YELLOW}Checking Wireless Interfaces...${NC}"
echo ""
if command -v iwconfig &> /dev/null; then
    WIRELESS_INTERFACES=$(iwconfig 2>&1 | grep -o "^\w*" | grep -v "lo\|eth\|Docker" || true)
    if [ -z "$WIRELESS_INTERFACES" ]; then
        echo -e "${YELLOW}[!]${NC} No wireless interfaces detected"
        ((WARNINGS++))
    else
        echo -e "${GREEN}[✓]${NC} Wireless interfaces found:"
        for iface in $WIRELESS_INTERFACES; do
            echo "    - $iface"
        done
    fi
else
    echo -e "${RED}[✗]${NC} iwconfig not available"
    ((ERRORS++))
fi
echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  Verification Summary                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Installation is complete.${NC}"
    echo ""
    echo "You can now start the platform with:"
    echo "  ./start-pocketgone.sh"
    echo ""
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ Installation complete with $WARNINGS warning(s).${NC}"
    echo ""
    echo "The platform should work, but some optional features may be unavailable."
    echo ""
else
    echo -e "${RED}✗ Installation incomplete: $ERRORS error(s), $WARNINGS warning(s).${NC}"
    echo ""
    echo "Please review the errors above and re-run the installer:"
    echo "  sudo bash install.sh"
    echo ""
fi

# Exit with appropriate code
if [ $ERRORS -gt 0 ]; then
    exit 1
else
    exit 0
fi
