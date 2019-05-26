import fs from 'fs';
import CSVParse from 'csv-parse';
import path from 'path';
import capitalize from 'lodash/capitalize';

import { REPOS_FOLDER } from './constants';

export const getRepos = () => new Promise((resolve) => {
  fs.readdir(REPOS_FOLDER, (error, files) => {
    if(error) return reject(`Can't load repositories from ./${REPOS_FOLDER}`);

    resolve(files.map(
      file => ({
        name: capitalize(file.replace('.csv', '')),
        file: path.join(REPOS_FOLDER, file) 
      }),
    ));
  });
});

/**
 * 
 * @param {String} path Path to file
 */
const getCSVContent = path => fs.readFileSync(path).toString();

/**
 * 
 * @param {Array} wordsArray Array of words from CSV content
 */
const parseWordsArray = wordsArray => wordsArray.map(([foreign, ipa, native]) => ({
  foreign: foreign.includes('|') ? foreign.split('|') : foreign,
  ipa,
  native: native.includes('|') ? native.split('|') : native,
}));


/**
 * 
 * @param {String} CSVContent  CSV words content
 */
const getWordsFromCSVContent = CSVContent => new Promise((resolve, reject) => {
  const parser = CSVParse({ delimeter: ',' }, (err, results) => {
    if(err) reject(err)
    else resolve(results);
  });

  parser.write(CSVContent);
  parser.end();
});

/**
 * 
 * @param {String} name Repo name
 */
const getRepoByName = name => new Promise((resolve, reject) => {
  getRepos()
    .then(repos => find(({ name: cName }) => cName === name))
    .then(repo => repo ? resolve(repo) : reject(`Repo ${name} not found`));
});

/**
 * 
 * @param {String} name Repo name
 */
export const getWords = name => new Promise((resolve, reject) => {
  getRepoByName(name)
    .then(({ file }) => getCSVContent(path.join(__dirname, `../data/${file}`)))
    .then(getWordsFromCSVContent)
    .then(parseWordsArray)
    .then(resolve)
    .catch(reject);
});

export default {
  getWords,
  getRepos,
};
