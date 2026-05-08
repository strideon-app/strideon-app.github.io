const PACE_REGEX = /^(\d{1,2}):([0-5]\d)$/;

export function parsePace(value: string): number | null {
  const match = value.trim().match(PACE_REGEX);
  if (!match) return null;
  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  return minutes * 60 + seconds;
}

export function formatPace(totalSeconds: number | null | undefined): string {
  if (totalSeconds == null || totalSeconds < 0) return "";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
