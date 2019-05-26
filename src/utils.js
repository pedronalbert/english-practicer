import isArray from 'lodash/isArray';

export const stringifyWord = word => isArray(word) ? word.join(', ') : word;
