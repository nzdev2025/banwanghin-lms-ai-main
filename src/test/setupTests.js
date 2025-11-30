import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Provide minimal browser APIs used in components
if (!navigator.clipboard) {
  navigator.clipboard = { writeText: vi.fn() };
} else {
  navigator.clipboard.writeText = vi.fn();
}

// Silence alert dialogs in tests
if (!window.alert) {
  window.alert = vi.fn();
} else {
  window.alert = vi.fn();
}
