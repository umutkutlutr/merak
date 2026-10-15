import { Module } from '@nestjs/common';
import { ContentModule } from '../editorial-content/content.module.js';
import { LiveQuizModule } from '../live-quiz/live-quiz.module.js';
import { QuestionsModule } from '../question-bank/questions.module.js';
import { AdminController } from './admin.controller.js';

@Module({
  imports: [ContentModule, QuestionsModule, LiveQuizModule],
  controllers: [AdminController],
})
export class AdminModule {}
