import test from 'node:test';
import assert from 'node:assert/strict';
import { shortcutAction } from '../src/ui/keyboard-shortcuts.ts';
test('explicit shortcut map recognizes only game keys and preserves native Enter/Space', () => {
  for (let i = 1; i <= 8; i++)
    assert.equal(shortcutAction(String(i)), `ingredient-${i - 1}`);
  assert.equal(shortcutAction('B'), 'brew');
  assert.equal(shortcutAction('x'), 'pour-out');
  assert.equal(shortcutAction('p'), 'pause');
  for (const key of [
    '0',
    '9',
    'Enter',
    ' ',
    'Escape',
    'Tab',
    'ArrowDown',
    'constructor',
    '__proto__',
  ])
    assert.equal(shortcutAction(key), undefined);
});
