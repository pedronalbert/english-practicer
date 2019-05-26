import shuffle from 'lodash/shuffle';
import isString from 'lodash/isString';
import { createAction } from 'redux-actions';
import { FOREIGN_TO_NATIVE } from '../constants';
import wordsDB from '../wordsDB';

export const START_TEST = 'WRITE_TEST/START';
export const SUBMIT_ANSWER = 'WRITE_TEST/SUBMIT_ANSWER';
export const NEXT_WORD = 'WRITE_TEST/NEXT_WORD';

export const getValidAnswer = (word, mode) => word[mode === FOREIGN_TO_NATIVE ? 'native' : 'foreign'];

const validateAnswer = (word, answer, mode) => {
  const validAnswer = getValidAnswer(word, mode);

  return isString(validAnswer) ?
    answer === validAnswer :
    validAnswer.some(cAnswer => cAnswer === answer);
};

export const start = createAction(
  START_TEST,
  ({ mode, words, selectedWords, repo }) => ({
    mode,
    repo,
    words,
    selectedWords: shuffle(selectedWords),
  }),
);

export const submitAnswer = createAction(
  SUBMIT_ANSWER,
  ({ word, answer, mode }) => ({
    valid: validateAnswer(word, answer, mode),
    answer,
    word: { ...word },
  }),
);

export const nextWord = createAction(NEXT_WORD);

export const saveToForgottenRepo = ({ words, repo }) => {
  wordsDB.saveWords(words, repo.file.replace('.csv', ' (olvidadas).csv'));
};
