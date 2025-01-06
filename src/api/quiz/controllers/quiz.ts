import { factories } from '@strapi/strapi';
import { Context } from 'koa';
import {
  createMultipleQuizzes as createMultipleQuizzesService,
  createQuestions as createQuestionsService,
  registerUser as registerUserService,
  checkUserRegistration as checkUserRegistrationService,
  assignQuiz as assignQuizService,
  getQuizQuestions as getQuizQuestionsService,
  submitQuiz as submitQuizService,
  submitQuizWithNegativeMarks as submitQuizWithNegativeMarksService,
  getQuizScore as getQuizScoreService,
} from '../services/quiz';

const createMultipleQuizzes = async (ctx: Context) => {
  const { quizzes } = ctx.request.body;

  if (!quizzes || !Array.isArray(quizzes)) {
    ctx.throw(400, 'Invalid payload: quizzes should be an array');
  }

  try {
    const createdQuizzes = await createMultipleQuizzesService(quizzes);
    ctx.send({ createdQuizzes });
  } catch (error) {
    ctx.throw(400, error.message);
  }
};

const createQuestions = async (ctx: Context) => {
  try {
    const { quiz_title, questions } = ctx.request.body;

    if (!questions || !Array.isArray(questions)) {
      ctx.throw(400, 'Invalid payload: questions should be an array');
    }

    const createdQuestions = await createQuestionsService(quiz_title, questions);
    ctx.send({ createdQuestions });
  } catch (error) {
    ctx.throw(400, error.message);
  }
};

const registerUser = async (ctx: Context) => {
  const { username, email, password, role } = ctx.request.body;

  try {
    const user = await registerUserService(username, email, password, role);
    ctx.send({ user });
  } catch (error) {
    ctx.throw(400, error.message);
  }
};

const checkUserRegistration = async (ctx: Context) => {
  const { username, password } = ctx.request.body;
  try {
    const user = await checkUserRegistrationService(username, password);
    ctx.send({ user });
  } catch (error) {
    ctx.throw(400, error.message);
  }
};

const assignQuiz = async (ctx: Context) => {
  const { quiz_id, user_id, question_type, category } = ctx.request.body;
  try {
    const result = await assignQuizService(quiz_id, user_id, question_type, category);
    ctx.send(result);
  } catch (error) {
    ctx.throw(400, error.message);
  }
};

const getQuizQuestions = async (ctx: Context) => {
  const { quiz_id, user_id, no_of_questions, include_surveys } = ctx.request.body;
  try {
    const questions = await getQuizQuestionsService(quiz_id, user_id, no_of_questions);
    ctx.send({ questions });
  } catch (error) {
    ctx.throw(400, error.message);
  }
};

const submitQuiz = async (ctx: Context) => {
  const { quiz_id, user_id, answers } = ctx.request.body;
  try {
    const result = await submitQuizService(quiz_id, user_id, answers);
    ctx.send(result);
  } catch (error) {
    ctx.throw(400, error.message);
  }
};

const submitQuizWithNegativeMarks = async (ctx: Context) => {
  const { quiz_title, user_name, answers } = ctx.request.body;
  try {
    const result = await submitQuizWithNegativeMarksService(quiz_title, user_name, answers);
    ctx.send(result);
  } catch (error) {
    ctx.throw(400, error.message);
  }
};

const getQuizScore = async (ctx: Context) => {
  const { quiz_title, user_name } = ctx.request.body;
  try {
    const score = await getQuizScoreService(quiz_title, user_name);
    ctx.send(score);
  } catch (error) {
    ctx.throw(400, error.message);
  }
};

export default factories.createCoreController('api::quiz.quiz', {
  createMultipleQuizzes,
  createQuestions,
  registerUser,
  checkUserRegistration,
  assignQuiz,
  getQuizQuestions,
  submitQuiz,
  submitQuizWithNegativeMarks,
  getQuizScore,
});
