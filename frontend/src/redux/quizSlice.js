import { createSlice } from '@reduxjs/toolkit';

const quizSlice = createSlice({
  name: 'quiz',
  initialState: {
    questions: [],
    currentIndex: 0,
    selectedAnswer: null,
    score: 0,
    isCompleted: false,
  },
  reducers: {
    setQuestions: (state, action) => {
      state.questions = action.payload;
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
      if (currentQ && state.selectedAnswer === currentQ.correctAnswerIndex) {
        state.score += 1;
      }

      if (state.currentIndex + 1 < state.questions.length) {
        state.currentIndex += 1;
        state.selectedAnswer = null;
      } else {
        state.isCompleted = true;
      }
    },
    restartQuiz: (state) => {
      state.currentIndex = 0;
      state.selectedAnswer = null;
      state.score = 0;
      state.isCompleted = false;
    },
  },
});

export const { setQuestions, selectOption, submitCurrentAnswer, restartQuiz } = quizSlice.actions;
export default quizSlice.reducer;

