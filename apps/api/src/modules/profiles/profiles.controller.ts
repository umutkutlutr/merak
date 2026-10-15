import { Body, Controller, Get, Patch } from '@nestjs/common';
import { UpdateProfileInputSchema, type MeResponse, type UpdateProfileInput } from '@merak/contracts';
import { ZodValidationPipe } from '../../common/zod.pipe.js';
import { CurrentUser } from '../identity/auth.guard.js';
import type { AuthUser } from '../identity/jwt-verifier.js';
import { ProfilesService } from './profiles.service.js';

@Controller('me')
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  /** First call after login creates the profile (a random default username; never derived from the e-mail). */
  @Get()
  async me(@CurrentUser() user: AuthUser): Promise<MeResponse> {
    return this.profiles.ensureProfile(user);
  }

  @Patch()
  async update(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(UpdateProfileInputSchema)) body: UpdateProfileInput,
  ) {
    await this.profiles.ensureProfile(user);
    return { profile: await this.profiles.update(user.userId, body) };
  }
}
