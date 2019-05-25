import update from 'immutability-helper';
import typeToReducer from 'type-to-reducer';

import {
  START_TEST,
  SUBMIT_ANSWER,
  NEXT_WORD,
} from '../../actions/writeTestActions';

const initState = {
  mode: null,
  words: [],
  selectedWords: [],
  answers: [],
  currentWordIndex: 0,
};

const reducer = typeToReducer({
  [START_TEST]: (state, { payload: { mode, words, selectedWords }}) => ({
    ...initState,
    mode,
    words,
    selectedWords,
  }),

  [SUBMIT_ANSWER]: (state, { payload: { valid, mode, answer, word }}) => update(state, {
    lastAnswer: { $set: { valid, answer, word }},
    answers: { $push: [{ valid, word, answer }] },
  }),

  [NEXT_WORD]: (state) => ({
    ...state,
    currentWordIndex: state.currentWordIndex + 1,
  }),
}, initState);


export default reducer;
