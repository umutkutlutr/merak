import { Global, Module } from '@nestjs/common';
import { AuthGuard } from './auth.guard.js';
import { JwtVerifier } from './jwt-verifier.js';
import { RolesGuard } from './roles.guard.js';
import { ProfilesModule } from '../profiles/profiles.module.js';

@Global()
@Module({
  imports: [ProfilesModule],
  providers: [JwtVerifier, AuthGuard, RolesGuard],
  exports: [JwtVerifier, AuthGuard, RolesGuard],
})
export class IdentityModule {}
