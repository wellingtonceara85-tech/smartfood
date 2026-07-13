import { Test } from '@nestjs/testing';
import { HealthCheckService } from '@nestjs/terminus';
import { describe, expect, it, vi } from 'vitest';
import { HealthController } from './health.controller';
import { PrismaHealthIndicator } from './prisma-health.indicator';

describe('HealthController', () => {
  it('delega para o HealthCheckService com o indicador de Prisma', async () => {
    const healthCheckResult = { status: 'ok', info: {}, error: {}, details: {} };
    const check = vi.fn().mockResolvedValue(healthCheckResult);
    const isHealthy = vi.fn();

    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: { check } },
        { provide: PrismaHealthIndicator, useValue: { isHealthy } },
      ],
    }).compile();

    const controller = moduleRef.get(HealthController);
    const result = await controller.check();

    expect(check).toHaveBeenCalledTimes(1);
    expect(result).toBe(healthCheckResult);
  });
});
