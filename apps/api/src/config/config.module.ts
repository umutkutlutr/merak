import { Global, Module } from '@nestjs/common';
import { ENV, getEnv } from './env.js';

@Global()
@Module({
  providers: [{ provide: ENV, useFactory: () => getEnv() }],
  exports: [ENV],
})
export class ConfigModule {}
