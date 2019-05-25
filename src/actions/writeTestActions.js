import shuffle from 'lodash/shuffle';
import { createAction } from 'redux-actions';

import { ENGLISH_TO_SPANISH } from '../constants';

export const START_TEST = 'WRITE_TEST/START';
export const SUBMIT_ANSWER = 'WRITE_TEST/SUBMIT_ANSWER';
export const NEXT_WORD = 'WRITE_TEST/NEXT_WORD';

const validateAnswer = (word, answer, mode) =>
  answer === (mode === ENGLISH_TO_SPANISH ? word.spanish : word.english);

export const start = createAction(
  START_TEST,
  ({ mode, words, selectedWords }) => ({
    mode,
    words,
    selectedWords: shuffle(selectedWords),
  }),
);

export const submitAnswer = createAction(
  SUBMIT_ANSWER,
  ({ word, answer, mode }) => ({
    valid: validateAnswer(word, answer, mode),
    mode,
    answer,
    word: { ...word },
  }),
);

export const nextWord = createAction(NEXT_WORD);
