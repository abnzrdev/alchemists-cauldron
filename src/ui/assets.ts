export const asset = (name: string, extension = 'svg'): string =>
  `${import.meta.env.BASE_URL}assets/${name}.${extension}`;
