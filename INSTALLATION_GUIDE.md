# PocketGone Platform - Installation Guide

Complete guide for installing and deploying the PocketGone WiFi Penetration Testing Platform on a base Linux system.

⚠️ **WARNING**: This platform contains real penetration testing capabilities. For authorized educational use only in controlled lab environments.

## Table of Contents

- [System Requirements](#system-requirements)
- [Automated Installation](#automated-installation)
- [Manual Installation](#manual-installation)
- [Post-Installation](#post-installation)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)
- [Uninstallation](#uninstallation)

---

## System Requirements

### Hardware Requirements

**Minimum:**
- CPU: 2 cores
- RAM: 2 GB
- Storage: 10 GB free space
- Network: Wireless adapter with monitor mode support

**Recommended:**
- CPU: 4+ cores
- RAM: 4+ GB
- Storage: 20+ GB free space
- Network: Multiple wireless adapters for testing

### Supported Operating Systems

- **Kali Linux** 2020.1+ (Recommended)
- **Ubuntu** 20.04 LTS or newer
- **Debian** 10 (Buster) or newer
- **Parrot Security OS** 4.11+

### Wireless Adapter Requirements

Your wireless adapter must support **monitor mode** for pentesting features to work.

**Recommended Chipsets:**
- Atheros AR9271
- Ralink RT3070
- Realtek RTL8812AU
- Intel WiFi 6 AX200/AX210 (with proper drivers)

**Check Monitor Mode Support:**
```bash
# Check if adapter supports monitor mode
iw list | grep -A 10 "Supported interface modes" | grep monitor
```

---

## Automated Installation

The automated installer handles everything from system updates to service configuration.

### Step 1: Download or Clone Repository

```bash
# Clone from GitHub
git clone https://github.com/jcarvajalantigua/PocketGone-By-Jeturing-v1.0.git
cd PocketGone-By-Jeturing-v1.0

# Or if you already have the files
cd /path/to/PocketGone-By-Jeturing-v1.0
```

### Step 2: Run Automated Installer

```bash
# Make installer executable (if not already)
chmod +x install.sh

# Run installer with root privileges
sudo bash install.sh
```

### What the Installer Does

The automated installer performs the following tasks:

1. **Pre-flight Checks**
   - Verifies root privileges
   - Checks internet connectivity
   - Detects operating system
   - Checks for wireless adapters

2. **System Updates**
   - Updates package lists
   - Installs base dependencies
   - Installs build tools

3. **Runtime Installation**
   - Installs Python 3.9+ with pip
   - Installs Node.js 18+ with npm
   - Sets up virtual environments

4. **Pentesting Tools**
   - Installs aircrack-ng suite
   - Installs Wifite, Reaver
   - Installs hostapd, dnsmasq
   - Installs mdk3, mdk4
   - Verifies tool installation

5. **Application Setup**
   - Installs Python backend dependencies
   - Installs React frontend dependencies
   - Creates database
   - Configures environment variables

6. **System Services**
   - Creates systemd services
   - Configures firewall rules
   - Sets up network interfaces
   - Creates quick start scripts

### Installation Time

- **Fast Connection**: 10-15 minutes
- **Slow Connection**: 20-30 minutes
- **First Time**: May take longer due to package downloads

---

## Manual Installation

If you prefer manual installation or need to customize the process:

### Step 1: System Update

```bash
sudo apt update
sudo apt upgrade -y
```

### Step 2: Install Base Dependencies

```bash
sudo apt install -y \
    build-essential \
    git \
    curl \
    wget \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    net-tools \
    wireless-tools \
    iw \
    rfkill
```

### Step 3: Install Python 3.9+

```bash
# Install Python
sudo apt install -y python3 python3-pip python3-dev python3-venv

# Upgrade pip
python3 -m pip install --upgrade pip
```

### Step 4: Install Node.js 18+

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 5: Install Pentesting Tools

```bash
sudo apt install -y \
    aircrack-ng \
    wifite \
    reaver \
    hostapd \
    dnsmasq \
    mdk3 \
    mdk4 \
    macchanger \
    hcxtools \
    iptables
```

### Step 6: Setup Backend

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Create data directory
mkdir -p ../data

# Deactivate virtual environment
deactivate
```

### Step 7: Setup Frontend

```bash
cd ..  # Back to root directory

# Install npm dependencies
npm install
```

### Step 8: Initialize Database

```bash
cd backend
source venv/bin/activate

python3 << 'EOF'
from database import init_db
init_db()
print("Database initialized")
EOF

deactivate
```

---

## Post-Installation

### Verify Installation

```bash
# Check Python version
python3 --version

# Check Node.js version
node --version

# Check tools
airmon-ng --version
wifite --version
reaver -h
```

### Configure Wireless Adapter

```bash
# List wireless interfaces
iwconfig

# Unblock WiFi if blocked
sudo rfkill unblock wifi
sudo rfkill unblock all

# Restart NetworkManager
sudo systemctl restart NetworkManager
```

### Test Installation

```bash
# Quick test - start services manually
./start-pocketgone.sh
```

Access the platform:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## Usage

### Starting the Platform

**Option 1: Manual Start (Development)**
```bash
./start-pocketgone.sh
```

**Option 2: Using Systemd Services (Production)**
```bash
# Start services
./pocketgone-service.sh start

# Check status
./pocketgone-service.sh status

# Enable on boot
./pocketgone-service.sh enable
```

### Stopping the Platform

**Manual:**
```bash
./stop-pocketgone.sh
```

**Systemd:**
```bash
./pocketgone-service.sh stop
```

### Default Credentials

| User    | Username | Password | Access Level |
|---------|----------|----------|--------------|
| Admin   | `root`   | `toor`   | Full system root access |
| Student | `student`| `student`| Supervised user access |

⚠️ **Change these credentials** in production environments!

### Accessing the Platform

1. **Open your browser**
2. **Navigate to**: `http://localhost:5173` (or your server IP)
3. **Login** with credentials above
4. **Select a pentesting tab**:
   - 🛡️ **WiFi Attacks** - Individual attack tools
   - 🌐 **Evil Twin** - Rogue AP creation
   - 💻 **Terminal** - Command execution
   - 🎯 **Airgeddon** - Complete attack suite

### Remote Access

To access from another machine on the network:

```bash
# Find your IP address
ip addr show

# Access using:
http://YOUR_IP:5173
```

Make sure firewall allows connections:
```bash
sudo ufw allow 5173/tcp
sudo ufw allow 8000/tcp
```

---

## Troubleshooting

### Installation Issues

**Problem**: "Permission denied" error
```bash
# Solution: Run with sudo
sudo bash install.sh
```

**Problem**: "No internet connection"
```bash
# Solution: Check network
ping google.com

# Try different DNS
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf
```

**Problem**: Python or Node.js version too old
```bash
# Solution: The installer handles this automatically
# If manual install, use newer repositories
```

### Runtime Issues

**Problem**: Backend won't start
```bash
# Check logs
cd backend
source venv/bin/activate
python main.py

# Check for missing dependencies
pip install -r requirements.txt
```

**Problem**: Frontend won't start
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Start manually
npm run dev -- --host 0.0.0.0
```

**Problem**: No wireless adapter detected
```bash
# Check if adapter is present
iwconfig
lsusb
lspci | grep -i wireless

# Unblock WiFi
sudo rfkill unblock wifi

# Restart NetworkManager
sudo systemctl restart NetworkManager
```

**Problem**: Monitor mode won't enable
```bash
# Kill interfering processes
sudo airmon-ng check kill

# Enable monitor mode manually
sudo airmon-ng start wlan0

# Check status
iwconfig
```

**Problem**: Database errors
```bash
cd backend
source venv/bin/activate

# Reinitialize database
rm -f ../data/pocketgone.db
python3 -c "from database import init_db; init_db()"
```

### Permission Issues

**Problem**: "Operation not permitted"
```bash
# Solution: Always run backend as root
sudo python main.py

# Or use systemd service
./pocketgone-service.sh start
```

### Network Issues

**Problem**: Cannot access from browser
```bash
# Check if services are running
ps aux | grep python
ps aux | grep node

# Check ports
sudo netstat -tlnp | grep -E '5173|8000'

# Check firewall
sudo ufw status
sudo ufw allow 5173/tcp
sudo ufw allow 8000/tcp
```

### Tool-Specific Issues

**Problem**: Aircrack-ng tools not found
```bash
# Reinstall aircrack-ng
sudo apt install --reinstall aircrack-ng
```

**Problem**: Hostapd won't start
```bash
# Stop NetworkManager temporarily
sudo systemctl stop NetworkManager

# Or add interface to unmanaged list
# Edit /etc/NetworkManager/NetworkManager.conf
```

---

## Uninstallation

To completely remove PocketGone:

```bash
# Stop services
./pocketgone-service.sh stop
./pocketgone-service.sh disable

# Remove systemd services
sudo rm /etc/systemd/system/pocketgone-backend.service
sudo rm /etc/systemd/system/pocketgone-frontend.service
sudo systemctl daemon-reload

# Remove application files
cd ..
sudo rm -rf PocketGone-By-Jeturing-v1.0

# Optional: Remove pentesting tools
sudo apt remove --purge aircrack-ng wifite reaver hostapd dnsmasq mdk3 mdk4

# Optional: Remove Python and Node.js
# (Only if not needed for other purposes)
# sudo apt remove python3 nodejs
```

---

## Security Considerations

### Legal Warning

⚠️ **IMPORTANT**: This platform contains real penetration testing tools.

- **Only use** on networks you own or have explicit written authorization to test
- **Illegal use** can result in criminal prosecution
- **Designed for** educational purposes in controlled lab environments
- **Requires** supervision by qualified cybersecurity instructors

### Secure Deployment

1. **Change default credentials** immediately
2. **Use strong passwords** for all accounts
3. **Deploy on isolated network** for lab use
4. **Enable firewall** to restrict access
5. **Keep system updated** with security patches
6. **Monitor logs** regularly
7. **Disable remote access** unless necessary
8. **Use VPN** for remote administration

### Educational Use Guidelines

- Supervised laboratory environment only
- Written authorization for all testing activities
- Clear ethical guidelines for students
- Proper documentation of all activities
- Controlled network infrastructure
- No testing on production networks
- Regular security audits

---

## Support and Documentation

### Documentation Files

- **README.md** - Platform overview and features
- **INSTALLATION_GUIDE.md** - This file
- **IMPLEMENTATION_SUMMARY.md** - Technical details
- **API_TESTING.md** - API endpoint examples
- **GUI_IMPLEMENTATION.md** - Interface documentation
- **AIRGEDDON_IMPLEMENTATION.md** - Airgeddon suite guide

### Getting Help

1. **Check documentation** in this repository
2. **Review logs**: `install.log` and backend logs
3. **Check API docs**: http://localhost:8000/docs
4. **Verify tools**: Run verification commands above

### Log Files

- Installation log: `install.log`
- Backend logs: Check terminal output or systemd journal
- System logs: `/var/log/syslog`

```bash
# View backend logs
journalctl -u pocketgone-backend -f

# View frontend logs
journalctl -u pocketgone-frontend -f
```

---

## Educational Institution Information

**Designed for**: ITLA EDU Cybersecurity Classes

This platform is specifically designed for educational use in cybersecurity courses at Instituto Tecnológico de Las Américas (ITLA).

**Instructor Authorization Required**

---

## License and Disclaimer

This software is provided for **educational purposes only**. The developers assume no liability for misuse or damage caused by this software. Users are solely responsible for compliance with all applicable laws and regulations.

**Use at your own risk. Always obtain proper authorization before testing.**

---

## Changelog

### Version 1.0.0 (Initial Release)
- Complete automated installer
- Full backend and frontend setup
- All pentesting tools integration
- Visual GUI interfaces
- Comprehensive documentation
- Systemd service integration
- Quick start scripts

---

**Installation Guide - PocketGone Platform v1.0**
*For ITLA EDU Cybersecurity Classes*
