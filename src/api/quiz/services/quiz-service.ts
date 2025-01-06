import { factories } from '@strapi/strapi';
import { Context } from 'koa';

const registerUserService = async (ctx: Context) => {
  const { username, email, password, role } = ctx.request.body;

  try {
    const user = await strapi.plugins['users-permissions'].services.user.add({
      username,
      email,
      password,
      role,
      confirmed: 1,
      userType: "student"
    });

    ctx.send({ user });
  } catch (error) {
    ctx.throw(400, error.message);
  }
};

const checkUserRegistrationService = async (ctx: Context) => {
  const { username, password } = ctx.request.body;

  try {
    const user = await strapi.query('plugin::users-permissions.user').findOne({
      where: { username: username },
    });

    if (!user) {
      ctx.throw(404, 'User not registered');
    }

    const validPassword = await strapi.plugins['users-permissions'].services.user.validatePassword(
      password,
      user.password
    );

    if (!validPassword) {
      ctx.throw(401, 'Invalid password');
    }

    ctx.send({ user });
  } catch (error) {
    ctx.throw(400, error.message);
  }
};

const assignQuizService = async (ctx: Context) => {
  const { quiz_title, user_name } = ctx.request.body;
  const quiz = await strapi.query('api::quiz.quiz').findOne({
    where: {
      title: quiz_title
    }
  });
  const quiz_id = quiz.id;
  const user = await strapi.query('plugin::users-permissions.user').findOne({
    where: {
      username: user_name
    }
  });
  const user_id = user.id;
  try {
    await strapi.services['api::user-quiz-assignment.user-quiz-assignment'].create({
      data: {
        Quiz_status: 'In_progress',
        startTime: new Date().toISOString(),
        quiz: quiz_id,
        user: user_id
      }
    });
    ctx.send({ message: `Quiz ${quiz_id} was assigned to the user ${user_id}` });
  } catch (err) {
    ctx.throw(err);
  }
};


const getQuizQuestionsService = async (ctx: Context) => {
  const { quiz_title, user_name } = ctx.request.body;
  const quiz = await strapi.query('api::quiz.quiz').findOne({
    where: {
      title: quiz_title
    }
  });
  const quiz_id = quiz.id;
  const user = await strapi.query('plugin::users-permissions.user').findOne({
    where: {
      username: user_name
    }
  });
  const user_id = user.id;
  try {
    const assignment = await strapi.query('api::user-quiz-assignment.user-quiz-assignment').findOne({
      where: {
        user: user_id,
        quiz: quiz_id
      },
    });
    if (!assignment) {
      ctx.throw(404, 'Quiz not found for the user');
    }
    const questions = await strapi.query('api::question.question').findMany({
      where: { quiz: quiz_id },
    });
    ctx.send({ questions });
  } catch (error) {
    ctx.throw(400, error.message);
  }
};


const submitQuizService = async (ctx: Context) => {
  const { quiz_title, user_name, answers } = ctx.request.body;

  const quiz = await strapi.query('api::quiz.quiz').findOne({
    where: {
      title: quiz_title,
    },
  });
  if (!quiz) {
    ctx.throw(404, 'Quiz not found');
  }
  const quiz_id = quiz.id;

  const user = await strapi.query('plugin::users-permissions.user').findOne({
    where: {
      username: user_name,
    },
  });
  if (!user) {
    ctx.throw(404, 'User not found');
  }
  const user_id = user.id;

  try {
    const assignment = await strapi.query('api::user-quiz-assignment.user-quiz-assignment').findOne({
      where: {
        user: user_id,
        quiz: quiz_id,
      },
    });

    if (!assignment) {
      ctx.throw(404, 'Quiz not found for the user');
    }

    const questions = await strapi.query('api::question.question').findMany({
      where: { quiz: quiz_id },
    });

    if (!questions || questions.length === 0) {
      ctx.throw(404, 'No questions found for the quiz');
    }
    let correctAnswers = 0;
    const totalQuestions = questions.length;
    questions.forEach((question) => {
      if (answers[question.id] === question.correctAnswer) {
        correctAnswers += 1;
      }
    });
    const quizDetails = await strapi.query('api::user-quiz-assignment.user-quiz-assignment').update({
      where: { user: user_id, quiz: quiz_id },
      data: {
        Quiz_status: 'Finished',
        completionTime: new Date().toISOString(),
        totalQuestions,
        correctAnswers,
      },
    });
    ctx.send({
      correctAnswers: quizDetails.correctAnswers,
      totalQuestions: quizDetails.totalQuestions,
    });
  } catch (error) {
    ctx.throw(400, error.message);
  }
};


const getQuizScoreService = async (ctx: Context) => {
  const { quiz_title, user_name } = ctx.request.body;
  const quiz = await strapi.query('api::quiz.quiz').findOne({
    where: {
      title: quiz_title,
    },
  });
  if (!quiz) {
    ctx.throw(404, 'Quiz not found');
  }
  const quiz_id = quiz.id;
  const user = await strapi.query('plugin::users-permissions.user').findOne({
    where: {
      username: user_name,
    },
  });
  if (!user) {
    ctx.throw(404, 'User not found');
  }
  const user_id = user.id;
  if (!user_id || !quiz_id) {
    ctx.throw(400, 'Both user_id and quiz_id are required');
  }
  try {
    const score = await strapi.query('api::user-quiz-assignment.user-quiz-assignment').findOne({
      where: { user: user_id, quiz: quiz_id },
    });

    if (!score) {
      ctx.throw(404, 'Score not found for the user');
    }
    ctx.send({ correctAnswers: score.correctAnswers, totalQuestions: score.totalQuestions });
  } catch (error) {
    console.error(`Error fetching quiz score: ${error.message}`);
    ctx.throw(400, error.message);
  }
};

// export default {
//   registerUserService,
//   checkUserRegistrationService,
//   assignQuizService,
//   getQuizQuestionsService,
//   submitQuizService,
//   getQuizScoreService
// };
export default factories.createCoreService('api::quiz.quiz', {
    registerUserService,
    checkUserRegistrationService,
    assignQuizService,
    getQuizQuestionsService,
    submitQuizService,
    getQuizScoreService
});