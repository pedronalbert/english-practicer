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
  [START_TEST]: (_, { payload: { mode, words, selectedWords }}) => update(initState, {
    mode: { $set: mode },
    words: { $set: words },
    selectedWords: { $set: selectedWords },
  }),

  [SUBMIT_ANSWER]: (state, { payload: { valid, answer, word }}) => update(state, {
    lastAnswer: { $set: { valid, answer, word }},
    answers: { $push: [{ valid, word, answer }] },
  }),

  [NEXT_WORD]: (state) => update(state, {
    currentWordIndex: { $apply: index => index + 1 },
  }),
}, initState);


export default reducer;
