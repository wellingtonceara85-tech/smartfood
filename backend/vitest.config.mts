import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// unplugin-swc: Vitest usa esbuild por padrão, que não aplica os transforms de
// decorators/metadata que o NestJS (DI, @Injectable, @Module, etc.) exige em runtime.
export default defineConfig({
  test: {
    root: './',
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts'],
    globals: true,
    environment: 'node',
    // Garante .env carregado antes de todo arquivo de teste — Vitest compartilha o worker/
    // process.env entre arquivos, então um teste isolado não pode depender de outro arquivo
    // ter carregado o .env como efeito colateral (ex.: via ConfigModule.forRoot()).
    setupFiles: ['dotenv/config'],
  },
  plugins: [swc.vite()],
});
