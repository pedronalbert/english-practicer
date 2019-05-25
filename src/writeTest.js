import compact from 'lodash/compact';
import isArray from 'lodash/isArray';
import clear from 'clear';
import scanf from 'scanf';
import inquirer from 'inquirer';
import colors from 'colors';

import store from './store';

import { start, submitAnswer, nextWord, getValidAnswer } from './actions/writeTestActions';

import { translateModeSelect } from './selects';
import { FOREIGN_TO_NATIVE, NATIVE_TO_FOREIGN } from './constants';

const REPEAT_WRONG_WORDS = 'Repetir preguntas donde me he equivocado';
const REPEAT_WHOLE_TEST = 'Repetir test nuevamente';
const CHANGE_TEST_MODE = 'Cambiar idioma';

const getQuestion = (word, mode) => word[mode === FOREIGN_TO_NATIVE ? 'foreign' : 'native'];

const getPrintableWord = word => isArray(word) ? word.join(', ') : word;

const printQuestion = ({ question, ipa }) =>
  console.log(`${getPrintableWord(question) } ${colors.grey(ipa)}`)

const getAnswer = () => scanf('%S');

const printProgress = ({ correct, wrong, current, total }) =>
  console.log(`Progreso: ${current}/${total}, Correctas: ${colors.green(correct)}, Incorrectas: ${colors.red(wrong)}\n`)

const printPreviousResult = ({ valid, validAnswer, word, answer }, mode) => {
  if(valid) {
    console.log(colors.green('Respuesta Correcta!'));
    printFullWord(word);
    console.log('\n');

  } else {
    console.log(colors.red('Respuesta Incorrecta: '));
    console.log('<Correcto> ' + colors.green(getPrintableWord(validAnswer)) + ' | ' + colors.red(answer || '') + ' <Ingresado> \n');
  }
};

const printFullWord = word => console.log(
  colors.grey.underline('Ingles:'),
  getPrintableWord(word.foreign),
  colors.grey(word.ipa),
  colors.grey.underline('Español:'),
  getPrintableWord(word.native)
);

const printWrongWords = words => {
  console.log(`Lista de palabras incorrectas \n`);

  words.forEach(printFullWord);
};

const endMenu = ({ hasWrongWords }) => new Promise((resolve) => {
  inquirer.prompt([
    {
      name: 'answer',
      type: 'list',
      choices: compact([hasWrongWords && REPEAT_WRONG_WORDS, REPEAT_WHOLE_TEST, CHANGE_TEST_MODE])
    }
  ]).then(({ answer }) => resolve(answer));
});

const getCurrentState = () => {
  const { writeTest: state } = store.getState();

  const mode = state.mode;
  const currentWord = state.selectedWords[state.currentWordIndex];
  const answers = state.answers;
  const lastAnswer = answers.length > 0 ? answers[answers.length - 1] : null;

  return {
    mode,
    words: state.words,
    hasNext: state.currentWordIndex < (state.selectedWords.length - 1),
    currentWordIndex: state.currentWordIndex,
    currentWord,
    currentQuestion: getQuestion(currentWord, mode),
    selectedWords: state.selectedWords,
    lastAnswer: lastAnswer ? {
      ...lastAnswer,
      question: getQuestion(lastAnswer.word, mode),
      validAnswer: getValidAnswer(lastAnswer.word, mode),
    } : null,
    answers,
    counter: {
      correct: answers.filter(({ valid }) => valid).length,
      wrong: answers.filter(({ valid }) => !valid).length,
    },
  };
};

const renderQuestion = () => new Promise((resolve) => {
  const {
    counter,
    lastAnswer,
    currentWordIndex,
    currentWord,
    currentQuestion,
    selectedWords,
    mode,
    hasNext,
  } = getCurrentState();

  clear();
  printProgress({
    ...counter,
    current: currentWordIndex,
    total: selectedWords.length
  });

  if(lastAnswer) printPreviousResult(lastAnswer, mode);

  printQuestion({ question: currentQuestion, ipa: mode === FOREIGN_TO_NATIVE ? currentWord.ipa : '' });

  const answer = getAnswer();

  store.dispatch(submitAnswer({
    word: currentWord,
    answer,
    mode,
  }));

  if(hasNext) {
    store.dispatch(nextWord());

    return renderQuestion();
  } else {
    clear();

    return renderEnding();
  }
});

const renderEnding = () => {
  const {
    answers,
    words,
    counter,
    currentWordIndex,
    selectedWords,
    mode,
  } = getCurrentState();

  const wrongAnswers = answers.filter(({ valid }) => !valid);
  const wrongWords = wrongAnswers.map(({ word }) => word);

  if(wrongAnswers.length) {
    printWrongWords(wrongWords);

    console.log('\n Presiona cualquier tecla para continuar');
    scanf('%d')
  }

  printProgress({
    ...counter,
    current: currentWordIndex,
    total: selectedWords.length
  });

  endMenu({ hasWrongWords: wrongWords.length > 0 })
    .then(answer => {
      switch (answer) {
        case REPEAT_WRONG_WORDS:
          store.dispatch(start({ words, mode, selectedWords: [...wrongWords] }))

          return renderQuestion();
        case REPEAT_WHOLE_TEST:
          store.dispatch(start({ words, mode, selectedWords: words }));

          return renderQuestion();
        case CHANGE_TEST_MODE:
          return translateModeSelect()
            .then(newMode => {
              store.dispatch(start({ words, mode: newMode, selectedWords: words }));

              return renderQuestion()
            });

        default:
          resolve();
      }
    });
};

export default (selectedWords, mode, words) => {
  store.dispatch(start({ words, mode, selectedWords }));

  renderQuestion();
};
