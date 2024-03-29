import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

require('dotenv').config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: [process.env.FRONTEND_CLIENT],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed HTTP methods
    credentials: true, // Allow credentials (cookies, headers, etc.)
  });

  //backend server
  await app.listen(8080);
}
bootstrap();
