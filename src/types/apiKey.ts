export interface ApiKeyEntry {
  key: string;
  status: 'active' | 'exhausted' | 'invalid';
  exhaustedUntil?: number;
}
