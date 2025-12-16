"""
Web Terminal and Shell Execution Module
Provides secure shell command execution with privilege management
"""

import asyncio
import os
import pty
import select
import subprocess
import struct
import fcntl
import termios
from typing import Optional, Dict
import uuid

class TerminalSession:
    """Manages a terminal session with PTY support"""
    
    def __init__(self, session_id: str, user: str = "root", shell: str = "/bin/bash"):
        self.session_id = session_id
        self.user = user
        self.shell = shell
        self.master_fd = None
        self.slave_fd = None
        self.process = None
        self.running = False
        
    async def start(self):
        """Start the terminal session"""
        try:
            # Create PTY
            self.master_fd, self.slave_fd = pty.openpty()
            
            # Set terminal size
            self._set_winsize(80, 24)
            
            # Start shell process
            if self.user == "root":
                # Run as root
                cmd = [self.shell]
            else:
                # Run as specific user
                cmd = ["sudo", "-u", self.user, self.shell]
            
            self.process = await asyncio.create_subprocess_exec(
                *cmd,
                stdin=self.slave_fd,
                stdout=self.slave_fd,
                stderr=self.slave_fd,
                preexec_fn=os.setsid
            )
            
            # Make master_fd non-blocking
            flags = fcntl.fcntl(self.master_fd, fcntl.F_GETFL)
            fcntl.fcntl(self.master_fd, fcntl.F_SETFL, flags | os.O_NONBLOCK)
            
            self.running = True
            return True
        except Exception as e:
            print(f"Error starting terminal: {e}")
            return False
    
    def _set_winsize(self, cols: int, rows: int):
        """Set terminal window size"""
        if self.master_fd:
            winsize = struct.pack("HHHH", rows, cols, 0, 0)
            fcntl.ioctl(self.master_fd, termios.TIOCSWINSZ, winsize)
    
    async def write(self, data: str):
        """Write data to terminal"""
        if self.master_fd and self.running:
            try:
                os.write(self.master_fd, data.encode())
            except Exception as e:
                print(f"Error writing to terminal: {e}")
    
    async def read(self, timeout: float = 0.1) -> Optional[str]:
        """Read data from terminal"""
        if not self.master_fd or not self.running:
            return None
        
        try:
            # Use select to check if data is available
            ready, _, _ = select.select([self.master_fd], [], [], timeout)
            if ready:
                data = os.read(self.master_fd, 1024)
                return data.decode('utf-8', errors='ignore')
        except Exception as e:
            if "Bad file descriptor" not in str(e):
                print(f"Error reading from terminal: {e}")
        
        return None
    
    def resize(self, cols: int, rows: int):
        """Resize terminal window"""
        self._set_winsize(cols, rows)
    
    async def stop(self):
        """Stop the terminal session"""
        self.running = False
        
        if self.process:
            try:
                self.process.terminate()
                await asyncio.wait_for(self.process.wait(), timeout=2)
            except asyncio.TimeoutError:
                self.process.kill()
                await self.process.wait()
        
        if self.master_fd:
            try:
                os.close(self.master_fd)
            except:
                pass
        
        if self.slave_fd:
            try:
                os.close(self.slave_fd)
            except:
                pass
    
    def is_alive(self) -> bool:
        """Check if terminal session is still alive"""
        return self.running and self.process and self.process.returncode is None


class ShellExecutor:
    """Manages shell command execution with privilege control"""
    
    def __init__(self):
        self.active_terminals: Dict[str, TerminalSession] = {}
    
    async def create_terminal(self, user: str = "root") -> str:
        """Create a new terminal session"""
        session_id = str(uuid.uuid4())
        terminal = TerminalSession(session_id, user=user)
        
        if await terminal.start():
            self.active_terminals[session_id] = terminal
            return session_id
        else:
            raise Exception("Failed to start terminal session")
    
    def get_terminal(self, session_id: str) -> Optional[TerminalSession]:
        """Get terminal session by ID"""
        return self.active_terminals.get(session_id)
    
    async def close_terminal(self, session_id: str) -> bool:
        """Close a terminal session"""
        terminal = self.active_terminals.get(session_id)
        if terminal:
            await terminal.stop()
            del self.active_terminals[session_id]
            return True
        return False
    
    async def execute_command(self, command: str, user: str = "root", 
                             timeout: int = 30) -> Dict[str, any]:
        """Execute a single command and return output"""
        try:
            if user == "root":
                cmd = ["bash", "-c", command]
            else:
                cmd = ["sudo", "-u", user, "bash", "-c", command]
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            try:
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(),
                    timeout=timeout
                )
                
                return {
                    "success": process.returncode == 0,
                    "returncode": process.returncode,
                    "stdout": stdout.decode('utf-8', errors='ignore'),
                    "stderr": stderr.decode('utf-8', errors='ignore')
                }
            except asyncio.TimeoutError:
                process.kill()
                await process.wait()
                return {
                    "success": False,
                    "returncode": -1,
                    "stdout": "",
                    "stderr": "Command timed out"
                }
        except Exception as e:
            return {
                "success": False,
                "returncode": -1,
                "stdout": "",
                "stderr": str(e)
            }
    
    async def execute_airgeddon(self, interface: str) -> str:
        """Launch Airgeddon tool"""
        try:
            # Check if airgeddon is available
            check = await self.execute_command("which airgeddon", user="root")
            if not check["success"] or not check["stdout"].strip():
                return None
            
            airgeddon_path = check["stdout"].strip()
            
            # Create a terminal session for airgeddon
            session_id = await self.create_terminal(user="root")
            terminal = self.get_terminal(session_id)
            
            if terminal:
                # Launch airgeddon
                await terminal.write(f"{airgeddon_path}\n")
                await asyncio.sleep(0.5)
                
                # Select interface (automated input)
                await terminal.write(f"{interface}\n")
                
                return session_id
            
            return None
        except Exception as e:
            print(f"Error launching airgeddon: {e}")
            return None
    
    async def cleanup_inactive_terminals(self):
        """Clean up terminated terminal sessions"""
        to_remove = []
        for session_id, terminal in self.active_terminals.items():
            if not terminal.is_alive():
                to_remove.append(session_id)
        
        for session_id in to_remove:
            await self.close_terminal(session_id)

# Global instance
shell_executor = ShellExecutor()
