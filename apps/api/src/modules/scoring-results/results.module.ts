import { Module } from '@nestjs/common';
import { ContentModule } from '../editorial-content/content.module.js';
import { QuestionsModule } from '../question-bank/questions.module.js';
import { ResultsService } from './results.service.js';

@Module({
  imports: [ContentModule, QuestionsModule],
  providers: [ResultsService],
  exports: [ResultsService],
})
export class ResultsModule {}
