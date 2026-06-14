export type Book = {
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
  bookId: number;
  audioId: number;
  trackNo: number;
  bookName: string;
  audioName: string;
  trackName: string;
};
