import { readStoredJson, writeStoredJson } from '../storage/localStorage.ts';
import { en } from './locales/en.ts';
import { am } from './locales/am.ts';
import { kk } from './locales/kk.ts';
import { ru } from './locales/ru.ts';
import type {
  Dictionary,
  Language,
  TranslationKey,
  TranslationArguments,
} from './types.ts';

export const LANGUAGE_KEY = 'alchemists-cauldron:language';
export const LANGUAGES = {
  en: 'English',
  am: 'አማርኛ',
  kk: 'Қазақша',
  ru: 'Русский',
} as const;
export const dictionaries: Record<Language, Dictionary> = { en, am, kk, ru };
export const isLanguage = (value: unknown): value is Language =>
  typeof value === 'string' && Object.hasOwn(LANGUAGES, value);
export function loadLanguage(): Language {
  const saved = readStoredJson(LANGUAGE_KEY);
  return isLanguage(saved) ? saved : 'en';
}
let language = loadLanguage();
export const getLanguage = (): Language => language;
export function isTranslationKey(value: string): value is TranslationKey {
  const [group, key, extra] = value.split('.');
  return (
    extra === undefined &&
    Object.hasOwn(en, group) &&
    Object.hasOwn(en[group as keyof Dictionary], key)
  );
}
export function entityKey<G extends 'ingredients' | 'recipes' | 'reactions'>(
  group: G,
  id: string,
): Extract<TranslationKey, `${G}.${string}`> {
  const key = `${group}.${id}`;
  if (!isTranslationKey(key))
    throw new Error(`Unknown localized entity: ${key}`);
  return key as Extract<TranslationKey, `${G}.${string}`>;
}
export function template(
  key: TranslationKey,
  locale: Language = language,
): string {
  const [group, name] = key.split('.') as [keyof Dictionary, string];
  const english = en[group] as Record<string, string>;
  const translated = dictionaries[locale][group] as
    Record<string, string> | undefined;
  return translated?.[name] || english[name];
}
export function t<K extends TranslationKey>(
  key: K,
  ...args: TranslationArguments<K>
): string {
  return interpolate(template(key), args[0] ?? {});
}
function interpolate(
  text: string,
  values: Record<string, string | number>,
): string {
  return text.replace(/\{([^}]+)\}/g, (placeholder, name: string) =>
    String(values[name] ?? placeholder),
  );
}
export const escapeHtml = (value: string): string =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        character
      ]!,
  );

// References are resolved again on every language change, including names inside sentences.
export interface Reference {
  key: TranslationKey;
}
export const ref = (key: TranslationKey): Reference => ({ key });
type Value = string | number | Reference | Reference[];
type BindingValues = Record<string, Value>;
type Binding = { key: TranslationKey; values: BindingValues };
type BindingArguments<K extends TranslationKey> =
  TranslationArguments<K> extends [values: infer V]
    ? [values: { [P in keyof V]: Value }]
    : [values?: BindingValues];
function resolve(binding: Binding): string {
  return interpolate(
    template(binding.key),
    Object.fromEntries(
      Object.entries(binding.values).map(([key, value]) => [
        key,
        Array.isArray(value)
          ? value.map((item) => template(item.key)).join(', ')
          : typeof value === 'object'
            ? template(value.key)
            : value,
      ]),
    ),
  );
}
function metadata(binding: Binding): string {
  return escapeHtml(JSON.stringify(binding));
}
export function textBinding(key: TranslationKey): string {
  return `data-i18n="${metadata({ key, values: {} })}"`;
}
export function message<K extends TranslationKey>(
  key: K,
  ...args: BindingArguments<K>
): string {
  const binding = { key, values: args[0] ?? {} };
  return `<span data-i18n="${metadata(binding)}">${escapeHtml(resolve(binding))}</span>`;
}
export function attribute<K extends TranslationKey>(
  name: 'aria-label' | 'alt' | 'aria-valuetext',
  key: K,
  ...args: BindingArguments<K>
): string {
  const binding = { key, values: args[0] ?? {} };
  return `${name}="${escapeHtml(resolve(binding))}" data-i18n-${name}="${metadata(binding)}"`;
}
export function setMessage<K extends TranslationKey>(
  element: HTMLElement,
  key: K,
  ...args: BindingArguments<K>
): void {
  const binding = { key, values: args[0] ?? {} };
  element.dataset.i18n = JSON.stringify(binding);
  element.textContent = resolve(binding);
}
export function clearMessage(element: HTMLElement): void {
  delete element.dataset.i18n;
  element.textContent = '';
}
export function setAttributeMessage<K extends TranslationKey>(
  element: HTMLElement,
  name: 'aria-label' | 'aria-valuetext',
  key: K,
  ...args: BindingArguments<K>
): void {
  const binding = { key, values: args[0] ?? {} };
  element.setAttribute(`data-i18n-${name}`, JSON.stringify(binding));
  element.setAttribute(name, resolve(binding));
}
function refresh(root: ParentNode): void {
  for (const name of ['text', 'aria-label', 'alt', 'aria-valuetext']) {
    const data = name === 'text' ? 'data-i18n' : `data-i18n-${name}`;
    for (const element of root.querySelectorAll<HTMLElement>(`[${data}]`)) {
      const binding = JSON.parse(element.getAttribute(data)!) as Binding;
      const value = resolve(binding);
      if (name === 'text') {
        if (element.textContent !== value) element.textContent = value;
      } else if (element.getAttribute(name) !== value)
        element.setAttribute(name, value);
    }
  }
  root
    .querySelectorAll<HTMLSelectElement>('[data-language]')
    .forEach((select) => {
      select.value = language;
    });
}
export function setLanguage(next: Language): boolean {
  language = next;
  const stored = writeStoredJson(LANGUAGE_KEY, next);
  document.documentElement.lang = next;
  document.title = t('common.title');
  refresh(document);
  document.dispatchEvent(new Event('languagechange'));
  return stored;
}
export function bindLocalization(root: HTMLElement): () => void {
  document.documentElement.lang = language;
  document.title = t('common.title');
  refresh(root);
  // Render helpers already use the current language. Refresh the detached Start
  // button when the existing game controller restores it after a run.
  const restoreStart = () => refresh(root);
  root.addEventListener('game:exit', restoreStart);
  const change = (event: Event) => {
    const select = event.target;
    if (
      !(select instanceof HTMLSelectElement) ||
      !select.hasAttribute('data-language') ||
      !isLanguage(select.value)
    )
      return;
    const stored = setLanguage(select.value);
    root
      .querySelectorAll<HTMLElement>('[data-language-status]')
      .forEach((status) => {
        if (stored) clearMessage(status);
        else setMessage(status, 'menu.languageError');
      });
  };
  root.addEventListener('change', change);
  return () => {
    root.removeEventListener('game:exit', restoreStart);
    root.removeEventListener('change', change);
  };
}
export function renderLanguageSelector(id: string): string {
  return `<div class="language-setting"><label for="${id}">${message('common.language')}</label><select id="${id}" data-language>${Object.entries(
    LANGUAGES,
  )
    .map(
      ([code, label]) =>
        `<option value="${code}" lang="${code}"${code === language ? ' selected' : ''}>${label}</option>`,
    )
    .join('')}</select><p data-language-status role="status"></p></div>`;
}
