import { Module } from '@nestjs/common';
import { ContentModule } from '../editorial-content/content.module.js';
import { LearningModule } from '../learning-progress/learning.module.js';
import { LiveQuizModule } from '../live-quiz/live-quiz.module.js';
import { HomeController } from './home.controller.js';

@Module({ imports: [ContentModule, LearningModule, LiveQuizModule], controllers: [HomeController] })
export class HomeModule {}
