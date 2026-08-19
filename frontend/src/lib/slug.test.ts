import { describe, expect, it } from 'vitest';
import { slugificar } from './slug';

describe('slugificar', () => {
  it('remove apóstrofo em vez de virar hífen', () => {
    expect(slugificar("Hot's Salgados")).toBe('hots-salgados');
  });

  it('remove acentos', () => {
    expect(slugificar('Açaí & Cia')).toBe('acai-cia');
  });

  it('colapsa espaços e pontuação em um único hífen', () => {
    expect(slugificar('Pratinhos da  Quinha!!')).toBe('pratinhos-da-quinha');
  });

  it('remove hífen nas pontas', () => {
    expect(slugificar('-- Padaria --')).toBe('padaria');
  });

  it('lida com aspas curvas e crase', () => {
    expect(slugificar('Maria’s Doces')).toBe('marias-doces');
    expect(slugificar('D`Ávila Burger')).toBe('davila-burger');
  });
});
