import wordsDB from './wordsDB';
import writeTest from './writeTest';
import { repoSelect, wordsSelect, translateModeSelect } from './selects';

const init = () => {
  wordsDB.getRepos()
    .then(repoSelect)
    .then(wordsDB.getWords)
    .then(wordsSelect)
    .then(words => Promise.all([words, translateModeSelect()]))
    .then(([words, mode]) => writeTest(words, mode, words))
    .catch(console.error);
};

init();

 