import fs from 'fs';
import CSVParse from 'csv-parse';
import path from 'path';
import capitalize from 'lodash/capitalize';
import isArray from 'lodash/isArray';

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

export const stringifyWord = word => isArray(word) ? word.join('|') : word;

/**
 *
 * @param {Array} words
 * @param {Strings} filePath
 */
export const saveWords = (words, filePath) => new Promise((resolve, reject) => {
  const stringContent = words.reduce(
    (content, { foreign, ipa, native }) => content + [stringifyWord(foreign), ipa, stringifyWord(native)].join(',') + '\n',
    '',
  );

  fs.appendFile(
    filePath,
    stringContent,
    err => {
      if(err) {
        console.error(err);

        reject(err);
      } else {
        console.log(`Words saved at ${filePath}`);
        resolve();
      }
    },
  );
});

/**
 *
 * @param {Object} repo
 * @param {String} repo.file
 */
export const getWords = repo => new Promise((resolve, reject) => {
  getWordsFromCSVContent(getCSVContent(repo.file))
    .then(parseWordsArray)
    .then(resolve)
    .catch(reject);
});

export default {
  getWords,
  getRepos,
  saveWords,
};
