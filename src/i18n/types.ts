import type { en } from './locales/en.ts';

export type Dictionary = {
  [Group in keyof typeof en]: { [Key in keyof (typeof en)[Group]]: string };
};
export type TranslationKey = {
  [Group in keyof Dictionary]: `${Group}.${keyof Dictionary[Group] & string}`;
}[keyof Dictionary];
export type Language = 'en' | 'am' | 'kk' | 'ru';
type English<K extends TranslationKey> = K extends `${infer G}.${infer P}`
  ? G extends keyof typeof en
    ? P extends keyof (typeof en)[G]
      ? (typeof en)[G][P] & string
      : never
    : never
  : never;
type Placeholders<S extends string> =
  S extends `${string}{${infer P}}${infer Rest}`
    ? P | Placeholders<Rest>
    : never;
export type Values<K extends TranslationKey> = Record<
  Placeholders<English<K>>,
  string | number
>;
export type TranslationArguments<K extends TranslationKey> = [
  Placeholders<English<K>>,
] extends [never]
  ? [values?: Values<K>]
  : [values: Values<K>];
