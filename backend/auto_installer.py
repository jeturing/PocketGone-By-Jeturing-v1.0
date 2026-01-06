"""
PocketGone Auto-Installer Module
Automatically detects and installs required penetration testing tools
"""

import os
import subprocess
import platform
import shutil
from typing import Dict, List, Tuple, Optional
from enum import Enum
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class OSType(Enum):
    KALI = "kali"
    UBUNTU = "ubuntu"
    DEBIAN = "debian"
    UNKNOWN = "unknown"


class InstallationStatus(Enum):
    INSTALLED = "installed"
    NOT_INSTALLED = "not_installed"
    INSTALLATION_FAILED = "installation_failed"
    INSTALLING = "installing"


class ToolInstaller:
    """Manages automatic detection and installation of penetration testing tools"""
    
    REQUIRED_TOOLS = {
        "airmon-ng": {
            "package": "aircrack-ng",
            "description": "Monitor mode management",
            "check_command": "airmon-ng --help",
            "required": True
        },
        "airodump-ng": {
            "package": "aircrack-ng",
            "description": "Network scanning",
            "check_command": "airodump-ng --help",
            "required": True
        },
        "aireplay-ng": {
            "package": "aircrack-ng",
            "description": "Packet injection",
            "check_command": "aireplay-ng --help",
            "required": True
        },
        "aircrack-ng": {
            "package": "aircrack-ng",
            "description": "WEP/WPA cracking",
            "check_command": "aircrack-ng --help",
            "required": True
        },
        "wifite": {
            "package": "wifite",
            "description": "Automated WiFi auditing",
            "check_command": "wifite --help",
            "required": True
        },
        "reaver": {
            "package": "reaver",
            "description": "WPS attack tool",
            "check_command": "reaver -h",
            "required": True
        },
        "wash": {
            "package": "reaver",
            "description": "WPS network scanner",
            "check_command": "wash -h",
            "required": True
        },
        "hostapd": {
            "package": "hostapd",
            "description": "Access point daemon",
            "check_command": "hostapd -h",
            "required": True
        },
        "dnsmasq": {
            "package": "dnsmasq",
            "description": "DNS/DHCP server",
            "check_command": "dnsmasq --help",
            "required": True
        },
        "mdk3": {
            "package": "mdk3",
            "description": "Wireless testing tool",
            "check_command": "mdk3 --help",
            "required": False
        },
        "mdk4": {
            "package": "mdk4",
            "description": "Wireless testing tool",
            "check_command": "mdk4 --help",
            "required": False
        }
    }
    
    def __init__(self):
        self.os_type = self._detect_os()
        self.installation_progress = {}
        
    def _detect_os(self) -> OSType:
        """Detect the operating system type"""
        try:
            # Check for Kali Linux
            if os.path.exists("/etc/os-release"):
                with open("/etc/os-release", "r") as f:
                    content = f.read().lower()
                    if "kali" in content:
                        return OSType.KALI
                    elif "ubuntu" in content:
                        return OSType.UBUNTU
                    elif "debian" in content:
                        return OSType.DEBIAN
            
            # Fallback to platform detection
            system = platform.system().lower()
            if "linux" in system:
                return OSType.DEBIAN  # Default to Debian-based
                
        except Exception as e:
            logger.error(f"Error detecting OS: {e}")
        
        return OSType.UNKNOWN
    
    def check_tool(self, tool_name: str) -> Tuple[bool, Optional[str]]:
        """
        Check if a specific tool is installed
        Returns: (is_installed, version_or_error)
        """
        tool_info = self.REQUIRED_TOOLS.get(tool_name)
        if not tool_info:
            return False, "Tool not in required list"
        
        # First check if the command exists
        if not shutil.which(tool_name):
            return False, "Command not found"
        
        # Try to run the check command
        try:
            check_cmd = tool_info.get("check_command", f"{tool_name} --version")
            result = subprocess.run(
                check_cmd.split(),
                capture_output=True,
                timeout=5,
                text=True
            )
            
            # If command runs (even with non-zero exit), tool is installed
            if result.returncode == 0 or result.returncode == 1:
                # Try to extract version
                output = result.stdout + result.stderr
                return True, "Installed"
            
            return False, f"Command failed with code {result.returncode}"
            
        except subprocess.TimeoutExpired:
            return False, "Command timeout"
        except Exception as e:
            return False, str(e)
    
    def get_installation_status(self) -> Dict[str, Dict]:
        """Get installation status of all tools"""
        status = {}
        
        for tool_name, tool_info in self.REQUIRED_TOOLS.items():
            is_installed, message = self.check_tool(tool_name)
            
            status[tool_name] = {
                "installed": is_installed,
                "required": tool_info["required"],
                "description": tool_info["description"],
                "package": tool_info["package"],
                "message": message,
                "status": InstallationStatus.INSTALLED.value if is_installed else InstallationStatus.NOT_INSTALLED.value
            }
        
        return status
    
    def _run_command(self, command: List[str], env: Optional[Dict] = None) -> Tuple[bool, str]:
        """Run a shell command and return success status and output"""
        try:
            # Set DEBIAN_FRONTEND=noninteractive to avoid prompts
            cmd_env = os.environ.copy()
            cmd_env["DEBIAN_FRONTEND"] = "noninteractive"
            if env:
                cmd_env.update(env)
            
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=300,  # 5 minutes timeout
                env=cmd_env
            )
            
            output = result.stdout + result.stderr
            
            if result.returncode == 0:
                return True, output
            else:
                return False, f"Command failed with code {result.returncode}: {output}"
                
        except subprocess.TimeoutExpired:
            return False, "Command timeout after 5 minutes"
        except Exception as e:
            return False, f"Exception: {str(e)}"
    
    def _update_package_list(self) -> bool:
        """Update apt package list"""
        logger.info("Updating package list...")
        success, output = self._run_command(["apt-get", "update", "-y"])
        
        if success:
            logger.info("Package list updated successfully")
        else:
            logger.error(f"Failed to update package list: {output}")
        
        return success
    
    def install_tool(self, tool_name: str) -> Tuple[bool, str]:
        """
        Install a specific tool
        Returns: (success, message)
        """
        tool_info = self.REQUIRED_TOOLS.get(tool_name)
        if not tool_info:
            return False, "Tool not in required list"
        
        # Check if already installed
        is_installed, _ = self.check_tool(tool_name)
        if is_installed:
            return True, "Already installed"
        
        # Check if we're running as root
        if os.geteuid() != 0:
            return False, "Installation requires root privileges"
        
        # Update installation progress
        self.installation_progress[tool_name] = InstallationStatus.INSTALLING.value
        
        package_name = tool_info["package"]
        logger.info(f"Installing {tool_name} (package: {package_name})...")
        
        # Install the package
        success, output = self._run_command([
            "apt-get", "install", "-y", package_name
        ])
        
        if success:
            # Verify installation
            is_installed, message = self.check_tool(tool_name)
            if is_installed:
                logger.info(f"Successfully installed {tool_name}")
                self.installation_progress[tool_name] = InstallationStatus.INSTALLED.value
                return True, "Installation successful"
            else:
                logger.error(f"Installation completed but tool not found: {message}")
                self.installation_progress[tool_name] = InstallationStatus.INSTALLATION_FAILED.value
                return False, f"Installation completed but verification failed: {message}"
        else:
            logger.error(f"Failed to install {tool_name}: {output}")
            self.installation_progress[tool_name] = InstallationStatus.INSTALLATION_FAILED.value
            return False, f"Installation failed: {output}"
    
    def install_all_missing(self, required_only: bool = False) -> Dict[str, Dict]:
        """
        Install all missing tools
        Returns: Dictionary with installation results
        """
        # Check if we're running as root
        if os.geteuid() != 0:
            return {
                "error": "Installation requires root privileges",
                "results": {}
            }
        
        # Update package list first
        self._update_package_list()
        
        results = {}
        status = self.get_installation_status()
        
        # Get list of packages to install (deduplicate)
        packages_to_install = set()
        tools_to_check = []
        
        for tool_name, tool_status in status.items():
            if not tool_status["installed"]:
                if not required_only or tool_status["required"]:
                    packages_to_install.add(tool_status["package"])
                    tools_to_check.append(tool_name)
        
        # Install packages
        for package in packages_to_install:
            logger.info(f"Installing package: {package}")
            success, output = self._run_command([
                "apt-get", "install", "-y", package
            ])
            
            if not success:
                logger.error(f"Failed to install package {package}: {output}")
        
        # Verify installations
        for tool_name in tools_to_check:
            is_installed, message = self.check_tool(tool_name)
            results[tool_name] = {
                "success": is_installed,
                "message": message if is_installed else f"Installation failed: {message}"
            }
        
        return {
            "os_type": self.os_type.value,
            "packages_installed": list(packages_to_install),
            "results": results
        }
    
    def get_missing_tools(self) -> List[str]:
        """Get list of missing required tools"""
        status = self.get_installation_status()
        return [
            tool_name for tool_name, tool_status in status.items()
            if not tool_status["installed"] and tool_status["required"]
        ]


# Singleton instance
_tool_installer = None

def get_tool_installer() -> ToolInstaller:
    """Get or create the ToolInstaller singleton instance"""
    global _tool_installer
    if _tool_installer is None:
        _tool_installer = ToolInstaller()
    return _tool_installer
