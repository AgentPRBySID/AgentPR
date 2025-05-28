import { add } from '../utils/math';

describe('Basic Math', () => {
  it('adds two numbers correctly', () => {
    expect(add(2, 3)).toBe(5);
  });
});
