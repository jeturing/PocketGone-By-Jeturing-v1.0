"""
WiFi Pentesting Tools Integration Module
Provides wrappers for Kali Linux WiFi security tools
"""

import subprocess
import asyncio
import os
import signal
from typing import List, Dict, Optional, Tuple
import netifaces
import psutil
from datetime import datetime

class WifiToolsManager:
    """Manager for WiFi pentesting tools execution"""
    
    def __init__(self):
        self.active_sessions = {}
        self.tools_available = self._check_tools()
    
    def _check_tools(self) -> Dict[str, bool]:
        """Check which pentesting tools are available on the system"""
        tools = {
            'aircrack-ng': 'aircrack-ng',
            'airmon-ng': 'airmon-ng',
            'airodump-ng': 'airodump-ng',
            'aireplay-ng': 'aireplay-ng',
            'wifite': 'wifite',
            'reaver': 'reaver',
            'wash': 'wash',
            'mdk3': 'mdk3',
            'mdk4': 'mdk4',
        }
        
        available = {}
        for tool_name, command in tools.items():
            try:
                result = subprocess.run(
                    ['which', command],
                    capture_output=True,
                    text=True,
                    timeout=2
                )
                available[tool_name] = result.returncode == 0
            except Exception:
                available[tool_name] = False
        
        return available
    
    def get_wireless_interfaces(self) -> List[Dict[str, str]]:
        """Get list of wireless network interfaces"""
        interfaces = []
        try:
            for iface in netifaces.interfaces():
                if iface.startswith('wlan') or iface.startswith('wlp'):
                    addrs = netifaces.ifaddresses(iface)
                    mac = addrs.get(netifaces.AF_LINK, [{}])[0].get('addr', 'Unknown')
                    
                    # Check if interface is in monitor mode
                    monitor_mode = self._check_monitor_mode(iface)
                    
                    interfaces.append({
                        'name': iface,
                        'mac': mac,
                        'monitor_mode': monitor_mode,
                        'status': 'up' if self._is_interface_up(iface) else 'down'
                    })
        except Exception as e:
            print(f"Error getting interfaces: {e}")
        
        return interfaces
    
    def _check_monitor_mode(self, interface: str) -> bool:
        """Check if interface is in monitor mode"""
        try:
            result = subprocess.run(
                ['iwconfig', interface],
                capture_output=True,
                text=True,
                timeout=2
            )
            return 'Mode:Monitor' in result.stdout
        except Exception:
            return False
    
    def _is_interface_up(self, interface: str) -> bool:
        """Check if network interface is up"""
        try:
            result = subprocess.run(
                ['ip', 'link', 'show', interface],
                capture_output=True,
                text=True,
                timeout=2
            )
            return 'UP' in result.stdout
        except Exception:
            return False
    
    async def enable_monitor_mode(self, interface: str) -> Tuple[bool, str]:
        """Enable monitor mode on wireless interface"""
        if not self.tools_available.get('airmon-ng'):
            return False, "airmon-ng not available"
        
        try:
            # Kill interfering processes
            subprocess.run(['airmon-ng', 'check', 'kill'], 
                         capture_output=True, timeout=10)
            
            # Enable monitor mode
            result = subprocess.run(
                ['airmon-ng', 'start', interface],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                # Find new monitor interface name
                monitor_iface = f"{interface}mon"
                if self._is_interface_up(monitor_iface):
                    return True, monitor_iface
                return True, interface
            
            return False, result.stderr
        except Exception as e:
            return False, str(e)
    
    async def disable_monitor_mode(self, interface: str) -> Tuple[bool, str]:
        """Disable monitor mode on wireless interface"""
        if not self.tools_available.get('airmon-ng'):
            return False, "airmon-ng not available"
        
        try:
            result = subprocess.run(
                ['airmon-ng', 'stop', interface],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            return result.returncode == 0, result.stderr if result.returncode != 0 else "Monitor mode disabled"
        except Exception as e:
            return False, str(e)
    
    async def scan_networks(self, interface: str, duration: int = 10) -> List[Dict]:
        """Scan for WiFi networks using airodump-ng"""
        if not self.tools_available.get('airodump-ng'):
            return []
        
        # Ensure interface is in monitor mode
        if not self._check_monitor_mode(interface):
            success, msg = await self.enable_monitor_mode(interface)
            if not success:
                return []
            interface = msg  # New monitor interface name
        
        try:
            # Create temporary file for output
            temp_file = f"/tmp/airodump_{datetime.now().timestamp()}"
            
            # Run airodump-ng
            process = await asyncio.create_subprocess_exec(
                'airodump-ng',
                interface,
                '-w', temp_file,
                '--output-format', 'csv',
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            # Let it scan for specified duration
            await asyncio.sleep(duration)
            
            # Kill the process
            process.terminate()
            await process.wait()
            
            # Parse CSV output
            networks = self._parse_airodump_csv(f"{temp_file}-01.csv")
            
            # Cleanup
            os.system(f"rm -f {temp_file}*")
            
            return networks
        except Exception as e:
            print(f"Error scanning networks: {e}")
            return []
    
    def _parse_airodump_csv(self, csv_file: str) -> List[Dict]:
        """Parse airodump-ng CSV output"""
        networks = []
        try:
            with open(csv_file, 'r') as f:
                lines = f.readlines()
                
            # Find where AP section starts
            for i, line in enumerate(lines):
                if line.startswith('BSSID'):
                    ap_start = i + 1
                    break
            else:
                return networks
            
            # Parse access points
            for line in lines[ap_start:]:
                if not line.strip() or line.startswith('Station'):
                    break
                
                parts = [p.strip() for p in line.split(',')]
                if len(parts) >= 14:
                    networks.append({
                        'bssid': parts[0],
                        'channel': parts[3],
                        'rssi': parts[8],
                        'encryption': parts[5],
                        'cipher': parts[6],
                        'auth': parts[7],
                        'ssid': parts[13]
                    })
        except Exception as e:
            print(f"Error parsing CSV: {e}")
        
        return networks
    
    async def deauth_attack(self, interface: str, target_bssid: str, 
                           client_mac: Optional[str] = None, 
                           count: int = 10) -> Tuple[bool, str]:
        """Perform deauthentication attack"""
        if not self.tools_available.get('aireplay-ng'):
            return False, "aireplay-ng not available"
        
        try:
            cmd = ['aireplay-ng', '--deauth', str(count), '-a', target_bssid]
            
            if client_mac:
                cmd.extend(['-c', client_mac])
            
            cmd.append(interface)
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            return result.returncode == 0, result.stdout + result.stderr
        except Exception as e:
            return False, str(e)
    
    async def capture_handshake(self, interface: str, target_bssid: str, 
                               channel: str, output_file: str,
                               duration: int = 60) -> Tuple[bool, str]:
        """Capture WPA handshake"""
        if not self.tools_available.get('airodump-ng'):
            return False, "airodump-ng not available"
        
        try:
            # Start airodump-ng to capture handshake
            process = await asyncio.create_subprocess_exec(
                'airodump-ng',
                '-c', channel,
                '--bssid', target_bssid,
                '-w', output_file,
                interface,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            # Wait for capture duration
            await asyncio.sleep(duration)
            
            # Terminate capture
            process.terminate()
            await process.wait()
            
            # Check if handshake was captured
            handshake_files = [f for f in os.listdir('/tmp') 
                             if f.startswith(os.path.basename(output_file)) and f.endswith('.cap')]
            
            if handshake_files:
                return True, f"Handshake captured: {handshake_files[0]}"
            
            return False, "No handshake captured"
        except Exception as e:
            return False, str(e)
    
    async def wps_attack_reaver(self, interface: str, target_bssid: str, 
                                channel: str) -> Tuple[bool, str, Optional[str]]:
        """Perform WPS attack using Reaver"""
        if not self.tools_available.get('reaver'):
            return False, "Reaver not available", None
        
        try:
            process = await asyncio.create_subprocess_exec(
                'reaver',
                '-i', interface,
                '-b', target_bssid,
                '-c', channel,
                '-vv',
                '-L',
                '-N',
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            # Store process for management
            session_id = f"reaver_{target_bssid}_{datetime.now().timestamp()}"
            self.active_sessions[session_id] = process
            
            return True, f"Reaver attack started (session: {session_id})", session_id
        except Exception as e:
            return False, str(e), None
    
    async def run_wifite(self, interface: str, target_bssid: Optional[str] = None) -> Tuple[bool, str, Optional[str]]:
        """Run Wifite automated attack"""
        if not self.tools_available.get('wifite'):
            return False, "Wifite not available", None
        
        try:
            cmd = ['wifite', '-i', interface, '--kill']
            
            if target_bssid:
                cmd.extend(['--bssid', target_bssid])
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            session_id = f"wifite_{datetime.now().timestamp()}"
            self.active_sessions[session_id] = process
            
            return True, f"Wifite started (session: {session_id})", session_id
        except Exception as e:
            return False, str(e), None
    
    async def stop_session(self, session_id: str) -> Tuple[bool, str]:
        """Stop an active pentesting session"""
        if session_id not in self.active_sessions:
            return False, "Session not found"
        
        try:
            process = self.active_sessions[session_id]
            process.terminate()
            await process.wait()
            del self.active_sessions[session_id]
            return True, "Session stopped"
        except Exception as e:
            return False, str(e)
    
    def get_session_status(self, session_id: str) -> Dict:
        """Get status of a pentesting session"""
        if session_id not in self.active_sessions:
            return {'status': 'not_found'}
        
        process = self.active_sessions[session_id]
        
        return {
            'status': 'running' if process.returncode is None else 'completed',
            'pid': process.pid,
            'returncode': process.returncode
        }

# Global instance
wifi_tools = WifiToolsManager()
