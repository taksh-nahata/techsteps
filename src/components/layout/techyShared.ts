/** Shared Techy staircase geometry — indices 0,3,4,6,7,8 in a 3×3 grid, rotated −45° on bottom-left pivot. */
export const TECHY_VISIBLE = [0, 3, 4, 6, 7, 8] as const;
export const TECHY_PIVOT = '32% 72%';
export const TECHY_ROTATE_DEG = -45;

/** Outer box for static marks (Logo, TechyMark). */
export function techyOuterBox(gridPx: number): number {
  return Math.round(gridPx * 1.3);
}

/** Circle diameter that fully contains the rotated staircase silhouette. */
export function techyCircleSize(gridPx: number): number {
  return Math.round(gridPx * 1.48);
}

export const TECHY_TILE_RADIUS: Record<number, string> = {
  0: '38% 28% 32% 42%',
  3: '30% 40% 35% 28%',
  4: '42% 32% 28% 38%',
  6: '28% 38% 42% 32%',
  7: '35% 30% 40% 28%',
  8: '40% 28% 35% 32%',
};

export const TECHY_COLORS = {
  idle: ['#c2502e', '#d98a2b'] as [string, string],
  listening: ['#c2502e', '#e07a4f'] as [string, string],
  thinking: ['#b8791f', '#d98a2b'] as [string, string],
  speaking: ['#9f3d20', '#c2502e'] as [string, string],
  happy: ['#2e6a63', '#4a8a82'] as [string, string],
  excited: ['#d98a2b', '#f4b942'] as [string, string],
  concerned: ['#9a7b5c', '#b89a78'] as [string, string],
};

export function techyColorForState(
  emotion: string,
  isListening: boolean,
  isSpeaking: boolean,
  isThinking: boolean
): [string, string] {
  if (isListening) return TECHY_COLORS.listening;
  if (isThinking) return TECHY_COLORS.thinking;
  if (isSpeaking) return TECHY_COLORS.speaking;
  if (emotion === 'happy') return TECHY_COLORS.happy;
  if (emotion === 'excited') return TECHY_COLORS.excited;
  if (emotion === 'concerned') return TECHY_COLORS.concerned;
  return TECHY_COLORS.idle;
}
