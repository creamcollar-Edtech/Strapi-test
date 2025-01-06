import { Context } from 'koa';
import quiz from '../controllers/quiz';

const createMultipleQuizzes = async (quizzes) => {
  const createdQuizzes = await Promise.all(
    quizzes.map(async (quiz) => {
      const createdQuiz = await strapi.documents('api::quiz.quiz').create({
        data: {
          title: quiz.title,
          description: quiz.description,
          published: quiz.published,
          max_marks: quiz.max_marks,
          time_limit: quiz.time_limit,
          cut_off_marks: quiz.cut_off_marks,
          questions: quiz.questions,
        },
      });
      return createdQuiz;
    })
  );
  return createdQuizzes;
};

const createQuestions = async (quiz_title, questions) => {
  let quiz_id
  let createdQuestions = {};
  if (quiz_title) {
    const quiz = await strapi.documents('api::quiz.quiz').findMany({
      filters: { title: quiz_title }
    });
    if (quiz.length === 0) {
      throw new Error('Quiz not found');
    }
     quiz_id = quiz[0].id;

    createdQuestions = await Promise.all(
      questions.map(async (question) => {
        const createdQuestion = (await strapi.documents('api::question.question')).create({
          data: {
            text: question.text,
            choices: question.choices,
            correctAnswer: question.correctAnswer,
            max_marks: question.max_marks,
            question_type: question.question_type,
            category: question.category,
            explanation: question.explanation,
            quiz: quiz_id
          },
        });
        return createdQuestion;
      })
    );
  } else {
    createdQuestions = await Promise.all(
      questions.map(async (question) => {
        const createdQuestion = await strapi.documents('api::question.question').create({
          data: {
            text: question.text,
            choices: question.choices,
            correctAnswer: question.correctAnswer,
            max_marks: question.max_marks,
            question_type: question.question_type,
            category: question.category,
            explanation: question.explanation
          },
        });
        return createdQuestion;
      })
    );
  }
  return createdQuestions;
};

const registerUser = async (username, email, password, role) => {
  const user = await strapi.plugins['users-permissions'].services.user.add({
    username,
    email,
    password,
    role,
    confirmed: 1,
    userType: 3
  });
  return user;
};

const checkUserRegistration = async (username, password) => {
  const user = await strapi.query('plugin::users-permissions.user').findOne({
    where: { username },
  });
  if (!user) {
    throw new Error('User not registered');
  }
  const validPassword = await strapi.plugins['users-permissions'].services.user.validatePassword(password, user.password);
  if (!validPassword) {
    throw new Error('Invalid password');
  }
  return user;
};

const assignQuiz = async (quiz_id, user_id, question_type, category) => {
  console.log(quiz_id, user_id, question_type, category)  
  let questions;
  if (question_type && category) {
    questions = await strapi.query('api::question.question').findMany({
      where: {
        question_type: question_type,
        category: category
      }
    });
  } else if (!question_type && category) {
      questions= await strapi.documents('api::question.question').findMany(category);
    console.log("line 113",questions)
  } else if (question_type && !category) {
    questions = await strapi.query('api::question.question').findMany({
      where: {
        question_type: question_type,
      }
    });
  } else {
    throw new Error('Question type or category was not provided');
  }
  if (!questions || questions.length === 0) {
    throw new Error('No questions found for the given criteria');
  } 
  console.log("line 126")
  const question_ids = (questions).map((question) => question.id);
  console.log("IDs",question_ids,quiz_id)
  console.log("line 128")
  await strapi.query('api::quiz.quiz').update({
    where: { id: quiz_id }, 
    data: {                             
      questions: question_ids // array of question IDs
    }
  }); 
  console.log("line 135")
  let assignment = await strapi.query('api::user-quiz-assignment.user-quiz-assignment').findOne({
    where: { 
      quiz: quiz_id, 
      user: user_id
    }
  }); 
  console.log("line 141")
  console.log(assignment)    
  if (!assignment) {
    await strapi.services['api::user-quiz-assignment.user-quiz-assignment'].create({
      data: {
        Quiz_status: 'In_progress',
        startTime: new Date().toISOString(),
        quiz: quiz_id,
        user: user_id,
        question_type: question_ids
      }
    });
  } else {   
    await strapi.services['api::user-quiz-assignment.user-quiz-assignment'].update(
      {
      where:{id:assignment.id}, 
      data: {
        Quiz_status: 'In_progress',
        startTime: new Date().toISOString(),
        quiz: quiz_id,    
        question_type: question_ids
      }
    });
  }
  return { message: `Quiz ${quiz_id} was assigned to the user ${user_id} with questions` };
};

const getQuizQuestions = async (quiz_id, user_id, no_of_questions) => {
  let questionIds
  let assignment = await strapi.query('api::user-quiz-assignment.user-quiz-assignment').findOne({
    where: {
      user: user_id,
      quiz: quiz_id,
    }
  });
  if (!assignment) {
    throw new Error('Quiz not found for the user'); 
  } 
  console.log("line 175",assignment.id) 
  let questions = await strapi.query('api::question.question').findMany({
    where: { question_type_assignments: assignment.id }
  });
   
  console.log("questions",questions)
  // Filter out specific question types
  const excludedTypes = ['shortAnswer', 'matching', 'ranking', 'mcqWithNeg', 'surveys'];
  questions = (questions).filter(question => !excludedTypes.includes(question.question_type));

  // Remove duplicate questions based on text
  // const uniqueQuestions = Array.from(new Set(questions.map(q => q.text)))
  //   .map(text => questions.find(q => q.text === text));
    
  let shuffledQuestions = questions.sort(() => 0.5 - Math.random()).map(question => {
    return {
      ...question,    
      choices: question.choices ? question.choices.sort(() => 0.5 - Math.random()) : []
    };
  });

  if (no_of_questions && no_of_questions > 0) {
    shuffledQuestions = shuffledQuestions.slice(0, no_of_questions);
  }
  questionIds = shuffledQuestions.map(question => question.id);
  console.log(questionIds)
  await strapi.documents('api::user-quiz-assignment.user-quiz-assignment').update({
    documentId: assignment.id,
    data: {
      totalQuestions: shuffledQuestions.length,
      question_type: questionIds
    }
  });
  await strapi.documents('api::quiz.quiz').update({
    documentId: quiz_id,
    data: {
      questions: questionIds
    }
  });
  return shuffledQuestions;
};



const validateMCQ = (userAnswer, correctAnswer, maxMarks) => {
  return userAnswer && JSON.stringify(userAnswer.sort()) === JSON.stringify(correctAnswer.sort()) ? maxMarks : 0;
};

const validateMCQWithMoreThanOne = (userAnswer, correctAnswer, maxMarks) => {
  return userAnswer && JSON.stringify(userAnswer.sort()) === JSON.stringify(correctAnswer.sort()) ? maxMarks : 0;
};

const validateTrueFalse = (userAnswer, correctAnswer, maxMarks) => {
  return userAnswer === correctAnswer ? maxMarks : 0;
};

const validateShortAnswer = (userAnswer, correctAnswer, maxMarks) => {
  return typeof userAnswer === 'string' && typeof correctAnswer === 'string' && userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase() ? maxMarks : 0;
};

const validateFillInTheBlanks = (userAnswer, correctAnswer, maxMarks) => {
  if (Array.isArray(correctAnswer)) {
    return correctAnswer.includes(userAnswer.trim().toLowerCase()) ? maxMarks : 0;
  }
  return typeof userAnswer === 'string' && typeof correctAnswer === 'string' && userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase() ? maxMarks : 0;
};

const validateMatching = (userAnswer, correctAnswer, maxMarks) => {
  return JSON.stringify(userAnswer) === JSON.stringify(correctAnswer) ? maxMarks : 0;
};

const validateRanking = (userAnswer, correctAnswer, maxMarks) => {
  return JSON.stringify(userAnswer) === JSON.stringify(correctAnswer) ? maxMarks : 0;
};

const validateOrdering = (userAnswer, correctAnswer, maxMarks) => {
  return JSON.stringify(userAnswer) === JSON.stringify(correctAnswer) ? maxMarks : 0;
};

const validateNumerical = (userAnswer, correctAnswer, maxMarks) => {
  return parseFloat(userAnswer) === parseFloat(correctAnswer) ? maxMarks : 0;
};

const validateSurveys = (userAnswer, correctAnswer, maxMarks) => {
  // Surveys might need custom logic
  return 0;
};

const validatePassage = (userAnswer, correctAnswer, maxMarks) => {
  return typeof userAnswer === 'string' && typeof correctAnswer === 'string' && userAnswer.trim() === correctAnswer.trim() ? maxMarks : 0;
};

const validateEssay = (userAnswer, correctAnswer, maxMarks) => {
  // Essay questions might need manual grading
  return 0;
};

const validateHotspot = (userAnswer, correctAnswer, maxMarks) => {
  // Implement specific logic for Hotspot questions if needed
  return 0;
};

const validateDragAndDrop = (userAnswer, correctAnswer, maxMarks) => {
  // Implement specific logic for Drag and Drop questions if needed
  return 0;
};

const questionTypeValidators = {
  'mcq': validateMCQ,
  'mcqWithMoreThanOne': validateMCQWithMoreThanOne,
  'true/false': validateTrueFalse,
  'shortAnswer': validateShortAnswer,
  'fillInTheBlanks': validateFillInTheBlanks,
  'matching': validateMatching,
  'ranking': validateRanking,
  'ordering': validateOrdering,
  'numerical': validateNumerical,
  'surveys': validateSurveys,
  'passage': validatePassage,
  'essay': validateEssay,
  'hotspot': validateHotspot,
  'dragAndDrop': validateDragAndDrop,
  // Add other question types as needed
};

const validateAnswer = (userAnswer, correctAnswer, questionType, maxMarks) => {
  switch (questionType) {
    case 'mcq':
      return userAnswer && JSON.stringify(userAnswer) === JSON.stringify(correctAnswer[0]) ? maxMarks : 0;
    case 'mcqWithMoreThanOne':
      return userAnswer && JSON.stringify(userAnswer.sort()) === JSON.stringify(correctAnswer.sort()) ? maxMarks : 0;
    case 'true/false':   
      return userAnswer === correctAnswer[0] ? maxMarks : 0;
    case 'shortAnswer':
      return typeof userAnswer === 'string' && typeof correctAnswer === 'string' && userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase() ? maxMarks : 0;
    case 'fillInTheBlanks':
      if (Array.isArray(correctAnswer)) {
        return correctAnswer.includes(userAnswer.trim().toLowerCase()) ? maxMarks : 0;
      }
      return typeof userAnswer === 'string' && typeof correctAnswer === 'string' && userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase() ? maxMarks : 0;
    case 'matching':
    case 'ranking':
    case 'ordering':
      return JSON.stringify(userAnswer) === JSON.stringify(correctAnswer) ? maxMarks : 0;
    case 'numerical':
      return parseFloat(userAnswer) === parseFloat(correctAnswer[0]) ? maxMarks : 0;
    default:
      return 0;
  }
};


const calculateSecuredMarks = (questions, answers) => {
  let securedMarks = 0;
  let totalMarks = 0;
  let totalNegativeMarks = 0;
  let correctAnswers = 0;
  questions.forEach((question) => {
    const userAnswer = answers[question.id];
    if (userAnswer === undefined) {
      return; // Skip if no answer is provided for the question
    }
    const maxMarks = question.max_marks || 1; // Default to 1 if max_marks is not provided
    if (validateAnswer(userAnswer, question.correctAnswer, question.question_type, maxMarks)) {
      securedMarks += maxMarks;
      correctAnswers += 1;
    } else if (question.negative_mark) {
      totalNegativeMarks += question.negative_mark;
    }
    totalMarks += maxMarks;
  });
  return { securedMarks, totalMarks, totalNegativeMarks, correctAnswers };
};


const submitQuiz = async (quiz_id, user_id, answers) => {
  const assignment = await strapi.query('api::user-quiz-assignment.user-quiz-assignment').findOne({
    where: { user: user_id, quiz: quiz_id }
  });
  if (!assignment) {
    throw new Error('Quiz not found for the user');
  }

  const questions = await strapi.query('api::question.question').findMany({
    where: { quiz: quiz_id }
  });
  if (!questions || questions.length === 0) {
    throw new Error('No questions found for the quiz');
  }

  const { securedMarks, totalMarks, totalNegativeMarks, correctAnswers } = calculateSecuredMarks(questions, answers);
  console.log(questions)
  const updatedAssignment = await strapi.query('api::user-quiz-assignment.user-quiz-assignment').update({
    where: { id: assignment.id },
    data: {
      Quiz_status: 'Finished',
      completionTime: new Date().toISOString(),
      totalQuestions: questions.length,
      correctAnswers,
      securedMarks,
      totalMarks,
      totalNegativeMarks
    }
  });

  if (!updatedAssignment) {
    throw new Error('Failed to update the quiz assignment');
  }

  return {
    securedMarks: updatedAssignment.securedMarks.toString(),
    totalMarks: totalMarks,
    totalQuestions: updatedAssignment.totalQuestions.toString(),
    totalNegativeMarks: totalNegativeMarks,
    correctAnswers: correctAnswers
  };
};

const submitQuizWithNegativeMarks = async (quiz_title, user_name, answers) => {
  const quiz = await strapi.query('api::quiz.quiz').findOne({
    where: { title: quiz_title }
  });
  if (!quiz) {
    throw new Error('Quiz not found');
  }
  const quiz_id = quiz.id;
  const user = await strapi.query('plugin::users-permissions.user').findOne({
    where: { username: user_name }
  });
  if (!user) {
    throw new Error('User not found');
  }
  const user_id = user.id;

  const assignment = await strapi.query('api::user-quiz-assignment.user-quiz-assignment').findOne({
    where: { user: user_id, quiz: quiz_id }
  });
  if (!assignment) {
    throw new Error('Quiz not found for the user');
  }
  const questions = await strapi.query('api::question.question').findMany({
    where: { quiz: quiz_id }
  });
  if (!questions || questions.length === 0) {
    throw new Error('No questions found for the quiz');
  }
  let securedMarks = 0;
  let totalNegativeMarks = 0;
  const totalQuestions = questions.length;
  let totalMarks = 0;
  questions.forEach((question) => {
    let negativeMarks = 0;
    switch (question.question_type) {
      case 'mcq':
      case 'mcqWithMoreThanOne':
        if (answers[question.id] && answers[question.id].sort().toString() === question.correctAnswer.sort().toString()) {
          securedMarks += question.max_marks;
        } else {
          negativeMarks = calculateNegativeMarks(question, answers[question.id] || []);
          securedMarks -= negativeMarks;
          totalNegativeMarks += negativeMarks;
        }
        break;
      case 'true/false':
        if (answers[question.id] === question.correctAnswer) {
          securedMarks += question.max_marks;
        }
        break;
      case 'Short Answer':
      case 'Fill in the Blanks':
        if (answers[question.id].trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()) {
          securedMarks += question.max_marks;
        }
        break;
      case 'Matching':
      case 'Ranking':
      case 'Ordering':
        if (JSON.stringify(answers[question.id]) === JSON.stringify(question.correctAnswer)) {
          securedMarks += question.max_marks;
        }
        break;
      case 'Numerical':
        if (parseFloat(answers[question.id]) === parseFloat(question.correctAnswer)) {
          securedMarks += question.max_marks;
        }
        break;
      case 'surveys':
        // if (answers[question.id] && answers[question.id].trim() === question.correctAnswer.trim()) {
        //   securedMarks += question.max_marks;
        // }
        break;
      case 'passage':
        if (answers[question.id] && answers[question.id].trim() === question.correctAnswer.trim()) {
          securedMarks += question.max_marks;
        }
        break;
      case 'Essay':
        // Essay questions might need manual grading
        break;
      case 'Hotspot':
      case 'Drag and Drop':
        // Implement specific logic for these types if needed
        break;
      default:
        break;
    }
    totalMarks += question.max_marks;
  });
  const quizDetails = await strapi.query('api::user-quiz-assignment.user-quiz-assignment').update({
    where: { user: user_id, quiz: quiz_id },
    data: {
      Quiz_status: 'Finished',
      completionTime: new Date().toISOString(),
      totalQuestions,
      securedMarks,
      totalMarks,
      totalNegativeMarks
    }
  });
  return {
    securedMarks: quizDetails.securedMarks,
    totalMarks: totalMarks,
    totalQuestions: quizDetails.totalQuestions,
    totalNegativeMarks: quizDetails.totalNegativeMarks
  };
};

const calculateNegativeMarks = (question, userAnswer) => {
  let negativeMarks = 0;
  if (question.question_type === 'mcq' || question.question_type === 'mcqWithMoreThanOne') {
    const correctAnswers = question.correctAnswer;
    const totalCorrect = correctAnswers.length;
    const totalIncorrect = question.choices.length - totalCorrect;

    const correctSelected = userAnswer.filter(answer => correctAnswers.includes(answer)).length;
    const incorrectSelected = userAnswer.filter(answer => !correctAnswers.includes(answer)).length;

    const incorrectRatio = incorrectSelected / totalIncorrect;
    negativeMarks = incorrectRatio * question.max_marks;
  }
  return negativeMarks;
};

const getQuizScore = async (quiz_title, user_name) => {
  const quiz = await strapi.query('api::quiz.quiz').findOne({
    where: { title: quiz_title }
  });
  if (!quiz) {
    throw new Error('Quiz not found');
  }
  const quiz_id = quiz.id;
  const user = await strapi.query('plugin::users-permissions.user').findOne({
    where: { username: user_name }
  });
  if (!user) {
    throw new Error('User not found');
  }
  const user_id = user.id;
  if (!user_id || !quiz_id) {
    throw new Error('Both user_id and quiz_id are required');
  }
  const score = await strapi.query('api::user-quiz-assignment.user-quiz-assignment').findOne({
    where: { user: user_id, quiz: quiz_id }
  });
  if (!score) {
    throw new Error('Score not found for the user');
  }
  return { securedMarks: score.securedMarks, totalMarks: score.totalMarks, totalQuestions: score.totalQuestions };
};

export {
  createMultipleQuizzes,
  createQuestions,
  registerUser,
  checkUserRegistration,
  assignQuiz,
  getQuizQuestions,
  submitQuiz,
  submitQuizWithNegativeMarks,
  getQuizScore,
};
