import { useEffect, useRef } from 'react';

interface UseBarcodeScannerOptions {
  onScan: (barcode: string) => void;
  enabled?: boolean;
  minChars?: number;
  maxKeystrokeDeltaMs?: number;
  debounceMs?: number;
}

/**
 * useBarcodeScanner Hook
 * 
 * Captures rapid keystroke bursts from USB barcode scanner guns (HID keyboard wedge).
 * Distinguishes hardware scans (<50ms between keys) from human typing (>100ms).
 * Traps Enter keydown events to prevent accidental form submissions and double-scans.
 */
export function useBarcodeScanner({
  onScan,
  enabled = true,
  minChars = 3,
  maxKeystrokeDeltaMs = 50,
  debounceMs = 1500,
}: UseBarcodeScannerOptions): void {
  const bufferRef = useRef<string[]>([]);
  const lastKeyTimeRef = useRef<number>(0);
  const lastScannedCodeRef = useRef<string>('');
  const lastScanTimestampRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // If user is focused on a standard text input/textarea and manually typing,
      // allow scanner input only if it's rapid or if target is not input
      const target = e.target as HTMLElement | null;
      const isInput = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);

      const now = Date.now();
      const delta = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Enter key indicates end of barcode transmission from scanner gun
      if (e.key === 'Enter') {
        const candidate = bufferRef.current.join('').trim();
        bufferRef.current = [];

        if (candidate.length >= minChars) {
          // Check debounce gate to prevent trigger-bounce double-scanning
          if (
            candidate !== lastScannedCodeRef.current ||
            now - lastScanTimestampRef.current > debounceMs
          ) {
            lastScannedCodeRef.current = candidate;
            lastScanTimestampRef.current = now;
            e.preventDefault();
            e.stopPropagation();
            onScan(candidate);
          } else {
            // Duplicate rejected
            e.preventDefault();
            e.stopPropagation();
          }
        }
        return;
      }

      // If time between characters exceeds threshold and buffer had items,
      // this was slow manual human typing; reset buffer
      if (delta > maxKeystrokeDeltaMs && bufferRef.current.length > 0) {
        bufferRef.current = [];
      }

      // Collect single printable characters
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // If not in an active text input or typing is clearly rapid (<50ms)
        if (!isInput || delta <= maxKeystrokeDeltaMs) {
          bufferRef.current.push(e.key);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [onScan, enabled, minChars, maxKeystrokeDeltaMs, debounceMs]);
}
