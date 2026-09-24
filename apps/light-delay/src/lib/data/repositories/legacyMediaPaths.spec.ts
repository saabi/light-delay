import { describe, expect, it } from 'vitest';
import { globKeyToCatalogPath } from './generationPlans';

describe('legacy media path adapter', () => {
 it.each([
  '$project-static/assets/example.png',
  '../../../../static/assets/example.png',
  '/workspace/static/assets/example.png',
  'C:\\workspace\\static\\assets\\example.png'
 ])('preserves the public catalog path for %s', key => {
  expect(globKeyToCatalogPath(key)).toBe('/assets/example.png');
 });
 it('ignores paths outside the canonical media root', () => {
  expect(globKeyToCatalogPath('/workspace/other/example.png')).toBeNull();
 });
});
