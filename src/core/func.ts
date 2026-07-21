import {  sokutan } from './books';
import type { BookId } from './types';

export const GetBook = (bookId: BookId | undefined) => {
  switch (bookId) {
    default:
    case 'sokutan_nyumon':
      return sokutan[0];
    case 'sokutan_hisshu':
      return sokutan[1];
    case 'sokutan_jokyu':
      return sokutan[2];
  }
};
