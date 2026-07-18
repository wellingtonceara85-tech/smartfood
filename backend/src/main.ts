import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

/**
 * Bootstrap técnico do SmartFood (Missão 0007.5, Blueprint Técnico).
 * Nenhum módulo de negócio é registrado aqui — só a fundação (platform/health).
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('SmartFood API')
    .setDescription(
      'API do SmartFood — Identidade & Empresa, Usuários/Auth, Catálogo, Pedidos, Cozinha (Missões 0008-0013).',
    )
    .setVersion('0.1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
  app.get(Logger).log(`SmartFood backend rodando em http://localhost:${port}`);
}

bootstrap();
