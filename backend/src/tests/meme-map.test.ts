import { expect, test, describe } from 'bun:test';
import { getMemeForSentiment } from '../lib/meme-map';

describe('getMemeForSentiment', () => {
  test('sentiment 0 → crying_jordan', () => {
    expect(getMemeForSentiment(0)).toBe('crying_jordan.jpg');
  });

  test('sentiment 10 → crying_jordan', () => {
    expect(getMemeForSentiment(10)).toBe('crying_jordan.jpg');
  });

  test('sentiment 11 → this_is_fine', () => {
    expect(getMemeForSentiment(11)).toBe('this_is_fine.jpg');
  });

  test('sentiment 20 → this_is_fine', () => {
    expect(getMemeForSentiment(20)).toBe('this_is_fine.jpg');
  });

  test('sentiment 25 → crying_jeremy', () => {
    expect(getMemeForSentiment(25)).toBe('crying_jeremy.jpg');
  });

  test('sentiment 40 → i_have_no_idea', () => {
    expect(getMemeForSentiment(40)).toBe('i_have_no_idea.jpg');
  });

  test('sentiment 50 → drake_hotline (neutral)', () => {
    expect(getMemeForSentiment(50)).toBe('drake_hotline.jpg');
  });

  test('sentiment 60 → stonks', () => {
    expect(getMemeForSentiment(60)).toBe('stonks.jpg');
  });

  test('sentiment 80 → success_kid', () => {
    expect(getMemeForSentiment(80)).toBe('success_kid.jpg');
  });

  test('sentiment 100 → chad_yes', () => {
    expect(getMemeForSentiment(100)).toBe('chad_yes.jpg');
  });

  test('sentiment 90 → chad_yes', () => {
    expect(getMemeForSentiment(90)).toBe('chad_yes.jpg');
  });

  test('all values 0-100 return a non-empty string', () => {
    for (let i = 0; i <= 100; i++) {
      const meme = getMemeForSentiment(i);
      expect(meme).toBeTruthy();
      expect(meme.length).toBeGreaterThan(0);
    }
  });

  test('clamping: sentiment -5 treated as 0', () => {
    expect(getMemeForSentiment(-5)).toBe('crying_jordan.jpg');
  });

  test('clamping: sentiment 150 treated as 100', () => {
    expect(getMemeForSentiment(150)).toBe('chad_yes.jpg');
  });
});
