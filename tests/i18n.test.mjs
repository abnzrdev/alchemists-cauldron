import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dictionaries,
  template,
  t,
  message,
  attribute,
  ref,
  entityKey,
  loadLanguage,
  LANGUAGE_KEY,
  isLanguage,
  isTranslationKey,
  setLanguage,
  setMessage,
  clearMessage,
} from '../src/i18n/index.ts';
import { INGREDIENTS } from '../src/data/ingredients.ts';
import { RECIPES } from '../src/data/recipes.ts';
import { REACTIONS } from '../src/data/reactions.ts';

const placeholders = (value) =>
  [...value.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]).sort();

test('all four dictionaries have identical keys and placeholders, with no untranslated English', () => {
  for (const [locale, dictionary] of Object.entries(dictionaries)) {
    assert.deepEqual(
      Object.keys(dictionary).sort(),
      Object.keys(dictionaries.en).sort(),
    );
    for (const [group, entries] of Object.entries(dictionaries.en)) {
      assert.deepEqual(
        Object.keys(dictionary[group]).sort(),
        Object.keys(entries).sort(),
      );
      for (const [name, english] of Object.entries(entries)) {
        const translated = dictionary[group][name];
        assert.ok(translated.trim(), `${locale}: ${group}.${name}`);
        assert.deepEqual(
          placeholders(translated),
          placeholders(english),
          `${locale}: ${group}.${name}`,
        );
        if (locale !== 'en')
          assert.notEqual(translated, english, `${locale}: ${group}.${name}`);
      }
    }
  }
});

test('every canonical ingredient, recipe and reaction has a localized presentation name', () => {
  for (const [group, items] of [
    ['ingredients', INGREDIENTS],
    ['recipes', RECIPES],
    ['reactions', REACTIONS],
  ]) {
    assert.equal(Object.keys(dictionaries.en[group]).length, items.length);
    for (const item of items) {
      assert.equal(template(entityKey(group, item.id), 'en'), item.name);
      for (const locale of ['am', 'kk', 'ru'])
        assert.ok(template(entityKey(group, item.id), locale));
    }
  }
  assert.equal(isTranslationKey('common.title.extra'), false);
  assert.equal(isTranslationKey('common.noSuchKey'), false);
  assert.throws(() => entityKey('recipes', 'missing'));
});

test('missing or empty translations fall back to English', () => {
  const original = dictionaries.ru.common.title;
  try {
    delete dictionaries.ru.common.title;
    assert.equal(template('common.title', 'ru'), dictionaries.en.common.title);
    dictionaries.ru.common.title = '';
    assert.equal(template('common.title', 'ru'), dictionaries.en.common.title);
  } finally {
    dictionaries.ru.common.title = original;
  }
});

test('preferences tolerate missing, invalid, corrupted and inaccessible storage', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  try {
    for (const [raw, expected] of [
      [null, 'en'],
      ['"am"', 'am'],
      ['"kk"', 'kk'],
      ['"ru"', 'ru'],
      ['"xx"', 'en'],
      ['{}', 'en'],
      ['{broken', 'en'],
    ]) {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: {
          getItem: (key) => {
            assert.equal(key, LANGUAGE_KEY);
            return raw;
          },
        },
      });
      assert.equal(loadLanguage(), expected);
    }
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('denied');
      },
    });
    assert.equal(loadLanguage(), 'en');
    for (const value of [null, 'EN', 'toString', {}, 1])
      assert.equal(isLanguage(value), false);
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete globalThis.localStorage;
  }
});

test('language changes update bindings in place, resolve nested names and only write a preference', () => {
  const storageDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'localStorage',
  );
  const documentDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'document',
  );
  const writes = [];
  const bound = {
    dataset: {},
    textContent: '',
    getAttribute() {
      return this.dataset.i18n;
    },
  };
  const doc = {
    documentElement: { lang: 'en' },
    title: '',
    querySelectorAll: (selector) => (selector === '[data-i18n]' ? [bound] : []),
    dispatchEvent() {},
  };
  try {
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: doc,
    });
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: { setItem: (...args) => writes.push(args) },
    });
    setMessage(bound, 'menu.saved', {
      difficulty: ref('common.hard'),
      score: 300,
      time: '01:23',
    });
    const identity = bound;
    for (const locale of ['am', 'kk', 'ru', 'en']) {
      assert.equal(setLanguage(locale), true);
      assert.equal(doc.documentElement.lang, locale);
      assert.equal(doc.title, dictionaries[locale].common.title);
      assert.equal(bound, identity);
      assert.ok(bound.textContent.includes(dictionaries[locale].common.hard));
      assert.ok(bound.textContent.includes('01:23'));
      assert.ok(bound.textContent.includes('300'));
      assert.equal(
        t('game.lives', { count: 0, total: 3 }),
        dictionaries[locale].game.lives
          .replace('{count}', '0')
          .replace('{total}', '3'),
      );
    }
    assert.ok(writes.every(([key]) => key === LANGUAGE_KEY));
    globalThis.localStorage.setItem = () => {
      throw new Error('full');
    };
    assert.equal(setLanguage('ru'), false);
    assert.equal(doc.documentElement.lang, 'ru');
    assert.ok(bound.textContent.includes(dictionaries.ru.common.hard));
    setLanguage('en');
    clearMessage(bound);
    assert.equal(bound.textContent, '');
    assert.equal(bound.dataset.i18n, undefined);
    assert.ok(
      message('game.success', {
        points: 100,
        seconds: 15,
        maximum: 180,
      }).includes('+100 points'),
    );
    assert.ok(
      !message('game.outOfStock', { name: '<script>' }).includes('<script>'),
    );
    assert.ok(
      attribute('aria-label', 'game.outOfStock', {
        name: '" onfocus="bad',
      }).includes('&quot;'),
    );
  } finally {
    if (storageDescriptor)
      Object.defineProperty(globalThis, 'localStorage', storageDescriptor);
    else delete globalThis.localStorage;
    if (documentDescriptor)
      Object.defineProperty(globalThis, 'document', documentDescriptor);
    else delete globalThis.document;
  }
});
