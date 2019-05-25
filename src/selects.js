import inquirer from 'inquirer';

import { TRANSLATE_MODES } from './constants';

export const translateModeSelect = () => new Promise((resolve) => {
  const choices = TRANSLATE_MODES.map(({ text }) => text);

  inquirer.prompt([
    {
      name: 'mode',
      type: 'list',
      message: 'Modo de preguntas',
      choices,
      filter: choice => TRANSLATE_MODES.find(({ text }) => text === choice).value,
    },
  ]).then(({ mode }) => resolve(mode));
});

/**
 * 
 * @param {Array} words 
 */
export const wordsSelect = words => new Promise((resolve) => {
  inquirer.prompt([
    {
      name: 'min_pos',
      type: 'input',
      message: 'Posicion inicial',
      filter: parseInt,
      default: 1
    },
    {
      name: 'max_pos',
      type: 'input',
      message: `Posicion final (max: ${words.length})`,
      filter: parseInt,
      default: words.length,
    },
  ]).then(({ min_pos, max_pos }) => {
    resolve(words.slice(min_pos - 1, max_pos));
  });
});

export const repoSelect = repos => new Promise((resolve, reject) => {
  const options = repos.map(({ name }) => name);

  inquirer.prompt([
    { name: 'repo', type: 'list', message: 'Seleccione un repositorio', choices: options },
  ]).then(({ repo }) => resolve(repo));
});