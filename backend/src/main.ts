import 'reflect-metadata';
import './pg-utc'; // fechas timestamp en UTC; antes de cualquier conexión
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json } from 'express';
async function bootstrap(){const app=await NestFactory.create(AppModule); app.setGlobalPrefix('api'); app.enableCors({origin:process.env.CORS_ORIGIN?.split(',')||true}); await app.listen(process.env.PORT||3000);} bootstrap();
