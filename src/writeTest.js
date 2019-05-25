import shuffle from 'lodash/shuffle';
import clear from 'clear';
import scanf from 'scanf';
import inquirer from 'inquirer';
import colors from 'colors';

import { translateModeSelect } from './selects';
import { ENGLISH_TO_SPANISH } from './constants';

const REPEAT_WRONG_WORDS = 'Repetir preguntas donde me he equivocado';
const REPEAT_WHOLE_TEST = 'Repetir test nuevamente';
const CHANGE_TEST_MODE = 'Cambiar idioma';
const MAIN_MENU = 'Ir al menu principal';

const shuffleWords = words => shuffle(words);

const printQuestion = (word, mode) => 
  console.log(mode === ENGLISH_TO_SPANISH ? `${word.english} ${colors.grey(word.ipa)}` : `${word.spanish}`);

const getAnswer = () => scanf('%s');

const validateAnswer = (word, mode, answer) =>
  answer === (mode === ENGLISH_TO_SPANISH ? word.spanish : word.english);

const printProgress = ({ correct, wrong, current, total }) =>
  console.log(`Progreso: ${current}/${total}, Correctas: ${colors.green(correct)}, Incorrectas: ${colors.red(wrong)}\n`)

const printPreviousResult = ({ valid, word, answer }, mode) => {
  if(valid) {
    console.log(colors.green('Respuesta Correcta!\n'));
    console.log(colors.grey(word.ipa));
  } else {
    console.log(colors.red('Respuesta Incorrecta: '));
    console.log('<Correcto> ' + colors.green(mode === ENGLISH_TO_SPANISH ? word.spanish : word.english) + ' | ' + colors.red(answer) + ' <Ingresado> \n');
  }
};

const printWrongWords = words => console.log(`Lista de palabras incorrectas\n
${words.map(word => `Ingles: ${word.english} ${word.ipa}, Español: ${word.spanish}`).join('\n')}
`);

const endMenu = () => new Promise((resolve) => {
  inquirer.prompt([
    {
      name: 'answer',
      type: 'list',
      choices: [REPEAT_WRONG_WORDS, REPEAT_WHOLE_TEST, CHANGE_TEST_MODE, MAIN_MENU],
    }
  ]).then(({ answer }) => resolve(answer));
});

const init = (words, mode, allWords) => new Promise((resolve) => {
  let answers = [];
  let counter = { correct: 0, wrong: 0 };

  shuffleWords(words).forEach((word, index) => {
    clear();
    printProgress({ ...counter, current: index + 1, total: words.length });

    if(answers.length) printPreviousResult(answers[answers.length - 1], mode);

    printQuestion(word, mode);

    const answer = getAnswer();
    const valid = validateAnswer(word, mode, answer);

    if(valid) counter.correct++
    else counter.wring++

    answers.push({ valid, word, answer });
  });

  clear();

  const wrongAnswers = answers.filter(({ valid }) => !valid);
  const wrongWords = wrongAnswers.map(({ word }) => word);

  if(wrongAnswers.length) {
    printWrongWords(wrongWords);

    console.log('\n Presiona cualquier tecla para continuar');
    scanf('%d')
  }

  printProgress({ ...counter, current: words.length, total: words.length });

  endMenu()
    .then(answer => {
      switch (answer) {
        case REPEAT_WRONG_WORDS:
          return init(wrongWords, mode, allWords);
        case REPEAT_WHOLE_TEST:
          return init(allWords, mode, allWords);
        case CHANGE_TEST_MODE:
          return translateModeSelect()
            .then(newMode => init(allWords, newMode, allWords))
        default:
          resolve();
      }
    });

});

export default init;
