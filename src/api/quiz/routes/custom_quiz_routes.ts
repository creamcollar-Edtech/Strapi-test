export default {
  config: {
    find: {
      policies: [],
      middlewares: [],
    },
    findOne: {
      policies: [],
      middlewares: [],
    },
    create: {
      policies: [],
      middlewares: [],
    },
    update: {
      policies: [],
      middlewares: [],
    },
    delete: {
      policies: [],
      middlewares: [],
    },
  },
  routes: [
    {
      method: 'POST',
      path: '/createQuiz',
      handler: 'api::quiz.quiz.createMultipleQuizzes',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/createQuestions',
      handler: 'api::quiz.quiz.createQuestions',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/register',
      handler: 'api::quiz.quiz.registerUser',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/login',
      handler: 'api::quiz.quiz.checkUserRegistration',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/assign-user',
      handler: 'api::quiz.quiz.assignQuiz',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/start-quiz',
      handler: 'api::quiz.quiz.getQuizQuestions',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/submit-quiz',
      handler: 'api::quiz.quiz.submitQuiz',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/submit-quiz-negative-marks',
      handler: 'api::quiz.quiz.submitQuizWithNegativeMarks',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/quiz-score',
      handler: 'api::quiz.quiz.getQuizScore',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
