import wordsDB from './wordsDB';
import writeTest from './writeTest';
import { repoSelect, wordsSelect, translateModeSelect } from './selects';

const init = () => {
  repoSelect(wordsDB.getRepos())
    .then(wordsDB.getWords)
    .then(wordsSelect)
    .then(words => Promise.all([words, translateModeSelect()]))
    .then(([words, mode]) => writeTest(words, mode, words))
    .then(() => init())
    .catch(console.error);
};

init();

 