import compact from 'lodash/compact';
import clear from 'clear';
import scanf from 'scanf';
import inquirer from 'inquirer';
import colors from 'colors';

import store from './store';
import { init as mainMenu } from './cli';
import { stringifyWord } from './utils';
import { start, submitAnswer, nextWord, saveToForgottenRepo } from './actions/writeTestActions';
import { translateModeSelect } from './selects';
import { FOREIGN_TO_NATIVE } from './constants';

const REPEAT_WRONG_WORDS = 'Repetir preguntas donde me he equivocado';
const REPEAT_CURRENT_TEST = 'Repetir test (actual)'
const REPEAT_WHOLE_TEST = 'Repetir test (completo)';
const CHANGE_TEST_MODE = 'Cambiar idioma';
const SAVE_TO_REPO = 'Guardar palabras en repo (olvidadas)';
const MAIN_MENU = 'Ir al menu principal';

const getQuestion = (word, mode) => word[mode === FOREIGN_TO_NATIVE ? 'foreign' : 'native'];

const printQuestion = ({ question, ipa }) =>
  console.log(`${stringifyWord(question) } ${colors.grey(ipa)}`)

const getAnswer = () => scanf('%S');

const printProgress = ({ correct, wrong, current, total }) =>
  console.log(`Progreso: ${current}/${total}, Correctas: ${colors.green(correct)}, Incorrectas: ${colors.red(wrong)}\n`)

const printPreviousResult = ({ valid, word, answer }) => {
  if(valid) console.log(colors.green('Resputa Correcta! \n'));
  else console.log(colors.red(`Respuesta Incorrecta! [${answer || ''}]\n`));
 
  printFullWord(word);
  console.log('\n');
};

const printFullWord = word => console.log(
  colors.grey.underline('Ingles:'),
  stringifyWord(word.foreign),
  colors.grey(word.ipa),
  colors.grey.underline('Español:'),
  stringifyWord(word.native)
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
      choices: compact([
        hasWrongWords && REPEAT_WRONG_WORDS,
        REPEAT_CURRENT_TEST,
        REPEAT_WHOLE_TEST,
        CHANGE_TEST_MODE,
        hasWrongWords && SAVE_TO_REPO,
        MAIN_MENU,
      ])
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
    repo: state.repo,
    words: state.words,
    hasNext: state.currentWordIndex < (state.selectedWords.length - 1),
    currentWordIndex: state.currentWordIndex,
    currentWord,
    currentQuestion: getQuestion(currentWord, mode),
    selectedWords: state.selectedWords,
    lastAnswer: lastAnswer ? {
      ...lastAnswer,
      question: getQuestion(lastAnswer.word, mode),
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
    repo,
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
          store.dispatch(start({ words, mode, selectedWords: [...wrongWords], repo }))

          return renderQuestion();
        case REPEAT_CURRENT_TEST:
          store.dispatch(start({ words, mode, selectedWords, repo }))

          return renderQuestion();
        case REPEAT_WHOLE_TEST:
          store.dispatch(start({ words, mode, selectedWords: words, repo }));

          return renderQuestion();
        case CHANGE_TEST_MODE:
          return translateModeSelect()
            .then(newMode => {
              store.dispatch(start({ words, mode: newMode, selectedWords: words, repo }));

              return renderQuestion()
            });
        case SAVE_TO_REPO:
          saveToForgottenRepo({ words: wrongWords, repo });

          return renderEnding();
        case MAIN_MENU:
          return mainMenu()
        default:
          resolve();
      }
    });
};

export default (selectedWords, mode, words, repo) => {
  store.dispatch(start({ words, mode, selectedWords, repo }));

  renderQuestion();
};
