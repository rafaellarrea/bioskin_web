// src/utils/slugify.ts

export function slugify(text: string) {
  return text.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}
