import { useEffect, useRef, memo } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  output: string[];
  className?: string;
}

export const Terminal = memo(function Terminal({ output, className = '' }: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const lastOutputLengthRef = useRef(0);

  // Initialize terminal
  useEffect(() => {
    if (!containerRef.current) return;

    const terminal = new XTerm({
      theme: {
        background: '#0d0d0d',
        foreground: '#e5e5e5',
        cursor: '#a78bfa',
        cursorAccent: '#0d0d0d',
        black: '#0d0d0d',
        red: '#ff5555',
        green: '#50fa7b',
        yellow: '#f1fa8c',
        blue: '#6272a4',
        magenta: '#ff79c6',
        cyan: '#8be9fd',
        white: '#f8f8f2',
        brightBlack: '#6272a4',
        brightRed: '#ff6e6e',
        brightGreen: '#69ff94',
        brightYellow: '#ffffa5',
        brightBlue: '#d6acff',
        brightMagenta: '#ff92df',
        brightCyan: '#a4ffff',
        brightWhite: '#ffffff',
      },
      fontFamily: 'JetBrains Mono, Menlo, Monaco, "Courier New", monospace',
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'bar',
      scrollback: 5000,
      convertEol: true,
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    terminal.open(containerRef.current);

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Delay fit() to ensure terminal is fully initialized
    // This fixes the "Cannot read properties of undefined (reading 'dimensions')" error
    requestAnimationFrame(() => {
      try {
        fitAddon.fit();
      } catch {
        // Ignore fit errors during initialization
      }
    });

    // Write welcome message
    terminal.writeln('\x1b[1;35m╭─────────────────────────────────────╮\x1b[0m');
    terminal.writeln('\x1b[1;35m│\x1b[0m   \x1b[1;36mJoyixir Terminal\x1b[0m                  \x1b[1;35m│\x1b[0m');
    terminal.writeln('\x1b[1;35m╰─────────────────────────────────────╯\x1b[0m');
    terminal.writeln('');

    // Handle resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      terminal.dispose();
    };
  }, []);

  // Write new output
  useEffect(() => {
    if (!terminalRef.current) return;

    // Only write new output since last render
    const newOutput = output.slice(lastOutputLengthRef.current);
    for (const line of newOutput) {
      // Parse ANSI colors or use simple coloring
      const coloredLine = colorizeOutput(line);
      terminalRef.current.write(coloredLine);
    }
    lastOutputLengthRef.current = output.length;
  }, [output]);

  return (
    <div
      ref={containerRef}
      className={`h-full w-full overflow-hidden bg-[#0d0d0d] ${className}`}
    />
  );
});

// Simple colorizer for common terminal output patterns
function colorizeOutput(text: string): string {
  // Already has ANSI codes
  if (text.includes('\x1b[')) {
    return text;
  }

  // Color npm output patterns
  if (text.startsWith('$')) {
    return `\x1b[1;32m${text}\x1b[0m`; // Green for commands
  }

  if (text.includes('error') || text.includes('Error') || text.includes('ERR!')) {
    return `\x1b[31m${text}\x1b[0m`; // Red for errors
  }

  if (text.includes('warning') || text.includes('Warning') || text.includes('WARN')) {
    return `\x1b[33m${text}\x1b[0m`; // Yellow for warnings
  }

  if (text.includes('success') || text.includes('Success') || text.includes('✓') || text.includes('done')) {
    return `\x1b[32m${text}\x1b[0m`; // Green for success
  }

  if (text.startsWith('added') || text.includes('packages')) {
    return `\x1b[36m${text}\x1b[0m`; // Cyan for package info
  }

  return text;
}
