import { createSlice } from '@reduxjs/toolkit';

const quizSlice = createSlice({
  name: 'quiz',
  initialState: {
    questions: [],
    quizTitle: 'Quiz',
    currentIndex: 0,
    selectedAnswer: null,
    score: 0,
    isCompleted: false,
  },
  reducers: {
    setQuestions: (state, action) => {
      if (Array.isArray(action.payload)) {
        state.questions = action.payload;
      } else if (action.payload && Array.isArray(action.payload.questions)) {
        state.questions = action.payload.questions;
        state.quizTitle = action.payload.title || 'Quiz';
      }
      state.currentIndex = 0;
      state.selectedAnswer = null;
      state.score = 0;
      state.isCompleted = false;
    },
    selectOption: (state, action) => {
      state.selectedAnswer = action.payload;
    },
    submitCurrentAnswer: (state) => {
      const currentQ = state.questions[state.currentIndex];
      if (currentQ) {
        const correctIdx = Number(currentQ.correctAnswerIndex);
        const userChoice = Number(state.selectedAnswer);
        if (!isNaN(correctIdx) && userChoice === correctIdx) {
          state.score += 1;
        }
      }

      if (state.currentIndex + 1 < state.questions.length) {
        state.currentIndex += 1;
        state.selectedAnswer = null;
      } else {
        state.isCompleted = true;
      }
    },
    finishQuiz: (state) => {
      const currentQ = state.questions[state.currentIndex];
      if (currentQ && state.selectedAnswer !== null) {
        const correctIdx = Number(currentQ.correctAnswerIndex);
        const userChoice = Number(state.selectedAnswer);
        if (!isNaN(correctIdx) && userChoice === correctIdx) {
          state.score += 1;
        }
      }
      state.isCompleted = true;
    },
    restartQuiz: (state) => {
      state.currentIndex = 0;
      state.selectedAnswer = null;
      state.score = 0;
      state.isCompleted = false;
    },
  },
});

export const { setQuestions, selectOption, submitCurrentAnswer, finishQuiz, restartQuiz } = quizSlice.actions;
export default quizSlice.reducer;

