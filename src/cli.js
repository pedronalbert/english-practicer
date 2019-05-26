import wordsDB from './wordsDB';
import writeTest from './writeTest';
import { repoSelect, wordsSelect, translateModeSelect } from './selects';

export const init = () => {
  wordsDB.getRepos()
    .then(repoSelect)
    .then(repo => Promise.all([repo, wordsDB.getWords(repo)]))
    .then(([repo, words]) => Promise.all([repo, wordsSelect(words)]))
    .then(([repo, words]) => Promise.all([repo, words, translateModeSelect()]))
    .then(([repo, words, mode]) => writeTest(words, mode, words, repo))
    .catch(console.error);
};

init();

 