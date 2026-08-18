import { describe, expect, it } from 'vitest';
import { formatarTempoDecorrido } from './tempo';

describe('formatarTempoDecorrido', () => {
  const agora = new Date('2026-08-17T12:00:00');

  it('menos de 1 minuto mostra "agora mesmo"', () => {
    expect(formatarTempoDecorrido('2026-08-17T11:59:30', agora)).toBe('agora mesmo');
  });

  it('minutos', () => {
    expect(formatarTempoDecorrido('2026-08-17T11:45:00', agora)).toBe('há 15 min');
  });

  it('horas e minutos', () => {
    expect(formatarTempoDecorrido('2026-08-17T10:35:00', agora)).toBe('há 1h 25');
  });

  it('horas exatas sem minutos', () => {
    expect(formatarTempoDecorrido('2026-08-17T10:00:00', agora)).toBe('há 2h');
  });

  it('dias', () => {
    expect(formatarTempoDecorrido('2026-08-14T12:00:00', agora)).toBe('há 3 dias');
  });

  it('1 dia no singular', () => {
    expect(formatarTempoDecorrido('2026-08-16T10:00:00', agora)).toBe('há 1 dia');
  });
});
