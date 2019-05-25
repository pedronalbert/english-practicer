import compact from 'lodash/compact';
import clear from 'clear';
import scanf from 'scanf';
import inquirer from 'inquirer';
import colors from 'colors';

import store from './store';

import { start, submitAnswer, nextWord } from './actions/writeTestActions';

import { translateModeSelect } from './selects';
import { ENGLISH_TO_SPANISH, SPANISH_TO_ENGLISH } from './constants';

const REPEAT_WRONG_WORDS = 'Repetir preguntas donde me he equivocado';
const REPEAT_WHOLE_TEST = 'Repetir test nuevamente';
const CHANGE_TEST_MODE = 'Cambiar idioma';

const printQuestion = (word, mode) => 
  console.log(mode === ENGLISH_TO_SPANISH ? `${word.english} ${colors.grey(word.ipa)}` : `${word.spanish}`);

const getAnswer = () => scanf('%s');

const printProgress = ({ correct, wrong, current, total }) =>
  console.log(`Progreso: ${current}/${total}, Correctas: ${colors.green(correct)}, Incorrectas: ${colors.red(wrong)}\n`)

const printPreviousResult = ({ valid, word, answer }, mode) => {
  if(valid) {
    console.log(colors.green('Respuesta Correcta!'));
    console.log(mode === SPANISH_TO_ENGLISH  ? colors.grey(word.ipa) : '' + '\n');
  } else {
    console.log(colors.red('Respuesta Incorrecta: '));
    console.log('<Correcto> ' + colors.green(mode === ENGLISH_TO_SPANISH ? word.spanish : word.english) + ' | ' + colors.red(answer) + ' <Ingresado> \n');
  }
};

const printWrongWords = words => console.log(`Lista de palabras incorrectas\n
${words.map(word => `Ingles: ${word.english} ${word.ipa}, Español: ${word.spanish}`).join('\n')}
`);

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

  return {
    mode: state.mode,
    words: state.words,
    hasNext: state.currentWordIndex < (state.selectedWords.length - 1),
    currentWordIndex: state.currentWordIndex,
    currentWord: state.selectedWords[state.currentWordIndex],
    selectedWords: state.selectedWords,
    lastAnswer: state.answers.length ? state.answers[state.answers.length - 1] : null,
    answers: state.answers,
    counter: {
      correct: state.answers.filter(({ valid }) => valid).length,
      wrong: state.answers.filter(({ valid }) => !valid).length,
    },
  };
};

const renderQuestion = () => new Promise((resolve) => {
  const {
    counter,
    lastAnswer,
    currentWordIndex,
    currentWord,
    selectedWords,
    mode,
    hasNext,
    answers,
  } = getCurrentState();

  clear();
  printProgress({
    ...counter,
    current: currentWordIndex,
    total: selectedWords.length
  });

  if(lastAnswer) printPreviousResult(lastAnswer, mode);

  printQuestion(currentWord, mode);

  const answer = getAnswer();

  store.dispatch(submitAnswer({ word: currentWord, answer, mode }));

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
