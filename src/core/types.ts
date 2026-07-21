export type Book = {
  id: string;
  title: string;
  audios: AudioSource[];
  sections: string[];
};

export type AudioSource = {
  name: string;
  url: string;
};

export type RepeatMode = 'off' | 'one' | 'all' | 'custom';

export type TrackInfo = {
  bookId: BookId | undefined;
  audioId: number;
  trackNo: number;
  bookName: string;
  audioName: string;
  trackName: string;
};

export type BookId = 'sokutan_nyumon' | 'sokutan_hisshu' | 'sokutan_jokyu';
