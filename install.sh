#!/bin/bash

################################################################################
# PocketGone Platform - Automated Installer
# For ITLA EDU Cybersecurity Classes
# 
# This script installs and configures the complete PocketGone WiFi penetration
# testing platform on a base Linux system (Debian/Ubuntu/Kali).
#
# ⚠️  WARNING: This installs real pentesting tools with root capabilities
# ⚠️  For authorized educational use only in controlled lab environments
################################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PYTHON_VERSION="3.9"
NODE_VERSION="18"
INSTALL_DIR=$(pwd)
LOG_FILE="$INSTALL_DIR/install.log"

################################################################################
# Logging Functions
################################################################################

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1" | tee -a "$LOG_FILE"
}

################################################################################
# Banner
################################################################################

print_banner() {
    clear
    echo -e "${PURPLE}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   ██████╗  ██████╗  ██████╗██╗  ██╗███████╗████████╗ ██████╗ ███╗   ██╗███████╗
║   ██╔══██╗██╔═══██╗██╔════╝██║ ██╔╝██╔════╝╚══██╔══╝██╔════╝ ████╗  ██║██╔════╝
║   ██████╔╝██║   ██║██║     █████╔╝ █████╗     ██║   ██║  ███╗██╔██╗ ██║█████╗  
║   ██╔═══╝ ██║   ██║██║     ██╔═██╗ ██╔══╝     ██║   ██║   ██║██║╚██╗██║██╔══╝  
║   ██║     ╚██████╔╝╚██████╗██║  ██╗███████╗   ██║   ╚██████╔╝██║ ╚████║███████╗
║   ╚═╝      ╚═════╝  ╚═════╝╚═╝  ╚═╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═══╝╚══════╝
║                                                                   ║
║              WiFi Penetration Testing Platform                   ║
║                   ITLA EDU - Automated Installer                 ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    echo ""
}

################################################################################
# Pre-flight Checks
################################################################################

check_root() {
    log_info "Checking root privileges..."
    if [[ $EUID -ne 0 ]]; then
        log_error "This installer must be run as root"
        echo ""
        echo "Please run: sudo bash install.sh"
        exit 1
    fi
    log_success "Running with root privileges"
}

check_internet() {
    log_info "Checking internet connectivity..."
    if ! ping -c 1 google.com &> /dev/null && ! ping -c 1 8.8.8.8 &> /dev/null; then
        log_error "No internet connection detected"
        exit 1
    fi
    log_success "Internet connection verified"
}

detect_os() {
    log_info "Detecting operating system..."
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
        log_success "Detected: $OS $VER"
    else
        log_error "Cannot detect OS version"
        exit 1
    fi
}

check_wireless_adapter() {
    log_info "Checking for wireless adapter..."
    if ! command -v iwconfig &> /dev/null; then
        log_warning "iwconfig not found, will install wireless-tools"
        return
    fi
    
    WIRELESS_INTERFACES=$(iwconfig 2>&1 | grep -o "^\w*" | grep -v "lo\|eth\|Docker" || true)
    if [ -z "$WIRELESS_INTERFACES" ]; then
        log_warning "No wireless adapter detected - tools will still be installed"
    else
        log_success "Wireless adapter(s) detected: $WIRELESS_INTERFACES"
    fi
}

################################################################################
# System Update and Base Dependencies
################################################################################

update_system() {
    log "Updating system packages..."
    apt-get update >> "$LOG_FILE" 2>&1
    log_success "System package list updated"
}

install_base_dependencies() {
    log "Installing base dependencies..."
    
    PACKAGES=(
        "build-essential"
        "git"
        "curl"
        "wget"
        "software-properties-common"
        "apt-transport-https"
        "ca-certificates"
        "gnupg"
        "lsb-release"
        "net-tools"
        "wireless-tools"
        "iw"
        "rfkill"
    )
    
    apt-get install -y "${PACKAGES[@]}" >> "$LOG_FILE" 2>&1
    log_success "Base dependencies installed"
}

################################################################################
# Python Installation
################################################################################

install_python() {
    log "Checking Python installation..."
    
    if command -v python3 &> /dev/null; then
        PYTHON_VER=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
        log_info "Python $PYTHON_VER found"
        
        # Check if version is adequate
        if (( $(echo "$PYTHON_VER >= $PYTHON_VERSION" | bc -l) )); then
            log_success "Python version is adequate"
        else
            log_warning "Python version is too old, installing newer version..."
        fi
    else
        log_info "Python not found, installing..."
    fi
    
    # Install Python and related packages
    apt-get install -y \
        python3 \
        python3-pip \
        python3-dev \
        python3-venv \
        >> "$LOG_FILE" 2>&1
    
    # Update pip
    python3 -m pip install --upgrade pip >> "$LOG_FILE" 2>&1
    
    log_success "Python $(python3 --version | cut -d' ' -f2) installed"
}

################################################################################
# Node.js Installation
################################################################################

install_nodejs() {
    log "Checking Node.js installation..."
    
    if command -v node &> /dev/null; then
        NODE_VER=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        log_info "Node.js v$(node --version | cut -d'v' -f2) found"
        
        if (( NODE_VER >= NODE_VERSION )); then
            log_success "Node.js version is adequate"
            return
        else
            log_warning "Node.js version is too old, installing newer version..."
        fi
    fi
    
    # Install Node.js using NodeSource repository
    log_info "Installing Node.js $NODE_VERSION..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - >> "$LOG_FILE" 2>&1
    apt-get install -y nodejs >> "$LOG_FILE" 2>&1
    
    log_success "Node.js $(node --version) and npm $(npm --version) installed"
}

################################################################################
# WiFi Pentesting Tools Installation
################################################################################

install_pentesting_tools() {
    log "Installing WiFi penetration testing tools..."
    
    PENTEST_TOOLS=(
        "aircrack-ng"
        "wifite"
        "reaver"
        "hostapd"
        "dnsmasq"
        "mdk3"
        "mdk4"
        "macchanger"
        "hcxtools"
        "hashcat"
        "john"
        "iptables"
    )
    
    log_info "Installing: ${PENTEST_TOOLS[*]}"
    
    for tool in "${PENTEST_TOOLS[@]}"; do
        log_info "Installing $tool..."
        apt-get install -y "$tool" >> "$LOG_FILE" 2>&1 || {
            log_warning "$tool installation failed or not available, continuing..."
        }
    done
    
    log_success "Pentesting tools installed"
}

verify_tools() {
    log "Verifying installed tools..."
    
    REQUIRED_TOOLS=(
        "airmon-ng"
        "airodump-ng"
        "aireplay-ng"
        "aircrack-ng"
        "wifite"
        "reaver"
        "hostapd"
        "dnsmasq"
    )
    
    MISSING_TOOLS=()
    
    for tool in "${REQUIRED_TOOLS[@]}"; do
        if command -v "$tool" &> /dev/null; then
            log_success "$tool installed"
        else
            log_warning "$tool not found"
            MISSING_TOOLS+=("$tool")
        fi
    done
    
    if [ ${#MISSING_TOOLS[@]} -gt 0 ]; then
        log_warning "Some tools are missing: ${MISSING_TOOLS[*]}"
        log_warning "The platform will work but some features may be unavailable"
    else
        log_success "All required tools verified"
    fi
}

################################################################################
# Backend Installation
################################################################################

install_backend() {
    log "Setting up Python backend..."
    
    cd "$INSTALL_DIR/backend" || exit 1
    
    # Create virtual environment
    log_info "Creating Python virtual environment..."
    python3 -m venv venv >> "$LOG_FILE" 2>&1
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Upgrade pip in venv
    pip install --upgrade pip >> "$LOG_FILE" 2>&1
    
    # Install Python dependencies
    log_info "Installing Python dependencies..."
    pip install -r requirements.txt >> "$LOG_FILE" 2>&1
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        log_info "Creating .env configuration file..."
        cp .env.example .env
    fi
    
    # Create data directory
    mkdir -p ../data
    
    deactivate
    
    log_success "Backend setup complete"
}

################################################################################
# Frontend Installation
################################################################################

install_frontend() {
    log "Setting up React frontend..."
    
    cd "$INSTALL_DIR" || exit 1
    
    # Install npm dependencies
    log_info "Installing Node.js dependencies (this may take a few minutes)..."
    npm install >> "$LOG_FILE" 2>&1
    
    log_success "Frontend setup complete"
}

################################################################################
# System Services Configuration
################################################################################

create_systemd_services() {
    log "Creating systemd services..."
    
    # Backend service
    cat > /etc/systemd/system/pocketgone-backend.service << EOF
[Unit]
Description=PocketGone Backend API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR/backend
Environment="PATH=$INSTALL_DIR/backend/venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
ExecStart=$INSTALL_DIR/backend/venv/bin/python main.py
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF

    # Frontend service
    cat > /etc/systemd/system/pocketgone-frontend.service << EOF
[Unit]
Description=PocketGone Frontend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
Environment="PATH=/usr/bin:/usr/local/bin"
ExecStart=/usr/bin/npm run dev -- --host 0.0.0.0
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF

    # Reload systemd
    systemctl daemon-reload >> "$LOG_FILE" 2>&1
    
    log_success "Systemd services created"
}

################################################################################
# Firewall Configuration
################################################################################

configure_firewall() {
    log "Configuring firewall rules..."
    
    if command -v ufw &> /dev/null; then
        log_info "Configuring UFW firewall..."
        
        # Allow SSH
        ufw allow 22/tcp >> "$LOG_FILE" 2>&1
        
        # Allow backend API
        ufw allow 8000/tcp >> "$LOG_FILE" 2>&1
        
        # Allow frontend
        ufw allow 5173/tcp >> "$LOG_FILE" 2>&1
        
        log_success "Firewall rules configured"
    else
        log_warning "UFW not found, skipping firewall configuration"
    fi
}

################################################################################
# Quick Start Scripts
################################################################################

create_start_scripts() {
    log "Creating quick start scripts..."
    
    # Start script
    cat > "$INSTALL_DIR/start-pocketgone.sh" << 'EOF'
#!/bin/bash

echo "Starting PocketGone Platform..."

# Get the directory where the script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Start backend
echo "Starting backend..."
cd "$DIR/backend"
source venv/bin/activate
python main.py &
BACKEND_PID=$!
echo "Backend started (PID: $BACKEND_PID)"

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "Starting frontend..."
cd "$DIR"
npm run dev -- --host 0.0.0.0 &
FRONTEND_PID=$!
echo "Frontend started (PID: $FRONTEND_PID)"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║             PocketGone Platform Started                   ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  Backend API:  http://localhost:8000                      ║"
echo "║  API Docs:     http://localhost:8000/docs                 ║"
echo "║  Frontend UI:  http://localhost:5173                      ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  Default Credentials:                                     ║"
echo "║    Admin:    root / toor                                  ║"
echo "║    Student:  student / student                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Press Ctrl+C to stop both services"
echo ""

# Wait for user interrupt
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit 0" INT TERM

wait
EOF

    chmod +x "$INSTALL_DIR/start-pocketgone.sh"
    
    # Stop script
    cat > "$INSTALL_DIR/stop-pocketgone.sh" << 'EOF'
#!/bin/bash

echo "Stopping PocketGone Platform..."

# Stop backend
pkill -f "python main.py" || echo "Backend not running"

# Stop frontend
pkill -f "vite" || echo "Frontend not running"

echo "PocketGone Platform stopped"
EOF

    chmod +x "$INSTALL_DIR/stop-pocketgone.sh"
    
    # Service control script
    cat > "$INSTALL_DIR/pocketgone-service.sh" << 'EOF'
#!/bin/bash

case "$1" in
    start)
        echo "Starting PocketGone services..."
        systemctl start pocketgone-backend
        systemctl start pocketgone-frontend
        systemctl status pocketgone-backend --no-pager
        systemctl status pocketgone-frontend --no-pager
        ;;
    stop)
        echo "Stopping PocketGone services..."
        systemctl stop pocketgone-backend
        systemctl stop pocketgone-frontend
        ;;
    restart)
        echo "Restarting PocketGone services..."
        systemctl restart pocketgone-backend
        systemctl restart pocketgone-frontend
        ;;
    status)
        systemctl status pocketgone-backend --no-pager
        systemctl status pocketgone-frontend --no-pager
        ;;
    enable)
        echo "Enabling PocketGone services on boot..."
        systemctl enable pocketgone-backend
        systemctl enable pocketgone-frontend
        ;;
    disable)
        echo "Disabling PocketGone services on boot..."
        systemctl disable pocketgone-backend
        systemctl disable pocketgone-frontend
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|enable|disable}"
        exit 1
        ;;
esac
EOF

    chmod +x "$INSTALL_DIR/pocketgone-service.sh"
    
    log_success "Quick start scripts created"
}

################################################################################
# Network Interface Setup
################################################################################

setup_network_interfaces() {
    log "Setting up network interfaces..."
    
    # Check if wireless adapter needs to be unblocked
    if command -v rfkill &> /dev/null; then
        log_info "Unblocking wireless interfaces..."
        rfkill unblock wifi >> "$LOG_FILE" 2>&1 || log_warning "Could not unblock WiFi"
        rfkill unblock all >> "$LOG_FILE" 2>&1 || log_warning "Could not unblock all devices"
    fi
    
    # Restart NetworkManager if present
    if systemctl is-active --quiet NetworkManager; then
        log_info "Restarting NetworkManager..."
        systemctl restart NetworkManager >> "$LOG_FILE" 2>&1 || log_warning "Could not restart NetworkManager"
    fi
    
    log_success "Network interfaces configured"
}

################################################################################
# Database Initialization
################################################################################

initialize_database() {
    log "Initializing database..."
    
    cd "$INSTALL_DIR/backend" || exit 1
    
    # Activate virtual environment and run database initialization
    source venv/bin/activate
    
    # The database will be automatically created on first run
    python3 << 'PYEOF' >> "$LOG_FILE" 2>&1
import sys
sys.path.insert(0, '.')
from database import init_db
init_db()
print("Database initialized successfully")
PYEOF
    
    deactivate
    
    log_success "Database initialized"
}

################################################################################
# Post-Installation Information
################################################################################

print_post_install_info() {
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                                   ║${NC}"
    echo -e "${GREEN}║           Installation Complete! 🎉                              ║${NC}"
    echo -e "${GREEN}║                                                                   ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}Quick Start Commands:${NC}"
    echo ""
    echo -e "  ${YELLOW}Manual Start:${NC}"
    echo -e "    ./start-pocketgone.sh"
    echo ""
    echo -e "  ${YELLOW}Using Systemd:${NC}"
    echo -e "    ./pocketgone-service.sh start    # Start services"
    echo -e "    ./pocketgone-service.sh stop     # Stop services"
    echo -e "    ./pocketgone-service.sh restart  # Restart services"
    echo -e "    ./pocketgone-service.sh status   # Check status"
    echo -e "    ./pocketgone-service.sh enable   # Enable on boot"
    echo ""
    echo -e "${CYAN}Access URLs:${NC}"
    echo ""
    echo -e "  ${BLUE}Frontend UI:${NC}    http://localhost:5173"
    echo -e "  ${BLUE}Backend API:${NC}    http://localhost:8000"
    echo -e "  ${BLUE}API Docs:${NC}       http://localhost:8000/docs"
    echo ""
    echo -e "${CYAN}Default Credentials:${NC}"
    echo ""
    echo -e "  ${RED}Admin:${NC}      root / toor      ${YELLOW}(full root access)${NC}"
    echo -e "  ${GREEN}Student:${NC}    student / student ${YELLOW}(supervised access)${NC}"
    echo ""
    echo -e "${CYAN}Important Files:${NC}"
    echo ""
    echo -e "  Installation log:    $LOG_FILE"
    echo -e "  Backend config:      $INSTALL_DIR/backend/.env"
    echo -e "  Database:            $INSTALL_DIR/data/pocketgone.db"
    echo ""
    echo -e "${RED}⚠️  Security Warnings:${NC}"
    echo ""
    echo -e "  ${YELLOW}•${NC} This platform has real pentesting capabilities"
    echo -e "  ${YELLOW}•${NC} Only use in authorized, controlled lab environments"
    echo -e "  ${YELLOW}•${NC} Requires explicit authorization for all testing"
    echo -e "  ${YELLOW}•${NC} Educational use only - ITLA EDU cybersecurity classes"
    echo ""
    echo -e "${CYAN}Documentation:${NC}"
    echo ""
    echo -e "  README.md                      - Platform overview"
    echo -e "  IMPLEMENTATION_SUMMARY.md      - Feature details"
    echo -e "  API_TESTING.md                 - API examples"
    echo -e "  GUI_IMPLEMENTATION.md          - Interface guide"
    echo -e "  AIRGEDDON_IMPLEMENTATION.md    - Airgeddon suite guide"
    echo ""
    echo -e "${GREEN}Installation completed successfully!${NC}"
    echo ""
}

################################################################################
# Cleanup Function
################################################################################

cleanup_on_error() {
    log_error "Installation failed!"
    log_error "Check the log file for details: $LOG_FILE"
    exit 1
}

################################################################################
# Main Installation Flow
################################################################################

main() {
    # Set up error handling
    trap cleanup_on_error ERR
    
    # Print banner
    print_banner
    
    # Start logging
    log "=== PocketGone Platform Installation Started ==="
    log "Installation directory: $INSTALL_DIR"
    log "Log file: $LOG_FILE"
    
    # Pre-flight checks
    check_root
    check_internet
    detect_os
    check_wireless_adapter
    
    # System updates
    update_system
    install_base_dependencies
    
    # Language runtimes
    install_python
    install_nodejs
    
    # Pentesting tools
    install_pentesting_tools
    verify_tools
    
    # Application setup
    install_backend
    install_frontend
    
    # Database
    initialize_database
    
    # System configuration
    create_systemd_services
    configure_firewall
    setup_network_interfaces
    
    # Helper scripts
    create_start_scripts
    
    # Finish
    log_success "=== Installation Complete ==="
    print_post_install_info
}

################################################################################
# Execute Main
################################################################################

# Run main installation
main "$@"
