import { Module } from '@nestjs/common';
import { QuestionsModule } from '../question-bank/questions.module.js';
import { ResultsModule } from '../scoring-results/results.module.js';
import { AnswersService } from './answers.service.js';
import { EngineService } from './engine.service.js';
import { QuizController } from './quiz.controller.js';
import { QuizGateway } from './quiz.gateway.js';
import { SchedulerLeaderService } from './scheduler-leader.service.js';
import { SchedulerService } from './scheduler.service.js';
import { SessionsService } from './sessions.service.js';

@Module({
  imports: [QuestionsModule, ResultsModule],
  controllers: [QuizController],
  providers: [SessionsService, EngineService, AnswersService, QuizGateway, SchedulerLeaderService, SchedulerService],
  exports: [SessionsService, EngineService, AnswersService, SchedulerService, SchedulerLeaderService, QuizGateway],
})
export class LiveQuizModule {}
