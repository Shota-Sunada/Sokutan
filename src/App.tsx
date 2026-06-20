import { useState, useRef, useEffect } from 'react';
import 'react-h5-audio-player/lib/styles.css';
import './App.css';
import { books } from './core/books';
import AudioPlayer from 'react-h5-audio-player';
import type { RepeatMode, TrackInfo } from './core/types';
import { IoMdSkipBackward, IoMdSkipForward } from 'react-icons/io';
import { FaPlay, FaExternalLinkAlt } from 'react-icons/fa';

function App() {
  const HISTORY_NUM = 20;

  const [bookId, setBookId] = useState(0);
  const [audioId, setAudioId] = useState(0);
  const [trackNo, setTrackNo] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>((localStorage.getItem('repeatMode') as RepeatMode) || 'off');
  // const [skipSeconds, setSkipSeconds] = useState(Number(localStorage.getItem('skipSeconds') || '3'));
  const skipSeconds = 3;
  const [history, setHistory] = useState(() => {
    const stored = localStorage.getItem('history');
    return stored ? (JSON.parse(stored) as TrackInfo[]) : [];
  });

  const [isModalOpened, setIsModalOpened] = useState(false);

  const audioRef = useRef<AudioPlayer>(null);
  const inputRangeRef = useRef<HTMLInputElement>(null);
  const book = books[bookId];

  const customRepeatStartRef = useRef<HTMLInputElement>(null);
  const customRepeatEndRef = useRef<HTMLInputElement>(null);

  const crs = Number(localStorage.getItem('customRepeatStart') || '1');
  const cre = Number(localStorage.getItem('customRepeatEnd') || `${book.sections.length}`);
  function clamp(x: number) {
    return Math.min(Math.max(x, 1), book.sections.length);
  }

  const [customRepeatStart, setCustomRepeatStart] = useState(clamp(crs));
  const [customRepeatEnd, setCustomRepeatEnd] = useState(clamp(cre));

  function updateRate(rate: number) {
    if (audioRef.current) {
      audioRef.current.audio.current.playbackRate = rate;
    }
    setPlaybackRate(rate);

    const inputRange = inputRangeRef.current;
    if (!inputRange) return;
    const ratio = ((rate - 0.25) / (2.5 - 0.25)) * 100;
    inputRange.style.background = `linear-gradient(90deg, #868686 ${ratio}%, #dddddd ${ratio}%)`;
  }

  function moveTrack(offset: number) {
    //<<と>>でトラック移動する用
    const newTrackNo = trackNo + offset;
    if (newTrackNo < 1) {
      //+1or-1しか想定していない
      setTrackNo(newTrackNo + book.sections.length);
      return;
    }
    if (newTrackNo > book.sections.length) {
      setTrackNo(newTrackNo - book.sections.length);
      return;
    }
    setTrackNo(newTrackNo);
  }

  function skipTime(offset: number) {
    if (audioRef.current) {
      const audio = audioRef.current.audio.current;
      audio.currentTime += offset;
    }
  }

  //リピートの実装
  function handleEnded() {
    if (repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.audio.current.currentTime = 0;
        audioRef.current.audio.current.play();
      }
    } else if (repeatMode === 'all') {
      moveTrack(1);
    } else if (repeatMode === 'custom') {
      //所謂ABリピート
      if (trackNo < customRepeatStart || trackNo > customRepeatEnd) {
        setTrackNo(customRepeatStart);
      } else if (trackNo === customRepeatEnd) {
        setTrackNo(customRepeatStart);
      } else {
        moveTrack(1);
      }
    }
  }

  useEffect(() => {
    const inputRange = inputRangeRef.current;

    //速度変えるinput[type=range]のバーを更新
    function updateRateBar(e: HTMLElementEventMap['input']) {
      const inputRange = inputRangeRef.current;
      if (!inputRange) return;
      const target = e.target as HTMLInputElement | null;
      const value = Number(target?.value ?? inputRange.value);
      const min = Number(inputRange.min);
      const max = Number(inputRange.max);
      const ratio = ((value - min) / (max - min)) * 100;
      inputRange.style.background = `linear-gradient(90deg, #868686 ${ratio}%, #dddddd ${ratio}%)`;
    }

    inputRange?.addEventListener('input', updateRateBar);

    return () => {
      inputRange?.removeEventListener('input', updateRateBar);
    };
  }, []);

  //主にリピート処理のため
  useEffect(() => {
    const audio = audioRef.current?.audio.current;

    //trackNo === 0 : トラック未選択
    if (!audio || trackNo === 0) return;

    audio.playbackRate = playbackRate;

    audio.play().catch(() => {});

    if (audioRef.current && trackNo > 0) {
      audioRef.current.audio.current.playbackRate = playbackRate;
    }
  }, [playbackRate, trackNo]);

  //シーク操作による一時停止防ぐ
  // useEffect(() => {
  //   const audio = audioRef.current?.audio.current;
  //   if (!audio) return;

  //   function handleSeeked() {
  //     // シーク直後に停止している場合は再生を試みる
  //     if (audio && audio.paused) {
  //       audio.play().catch(() => {});
  //     }
  //   }

  //   audio.addEventListener('seeked', handleSeeked);

  //   return () => {
  //     audio.removeEventListener('seeked', handleSeeked);
  //   };
  // }, [bookId, audioId, trackNo]);

  //履歴、最新[HISTORY_NUM]件
  useEffect(() => {
    if (trackNo === 0) return;
    const lastEntry = history[0];
    if (lastEntry && lastEntry.bookId === bookId && lastEntry.audioId === audioId && lastEntry.trackNo === trackNo) {
      return;
    }

    const newEntry: TrackInfo = {
      bookId,
      audioId,
      trackNo,
      bookName: book.title,
      audioName: book.audios[audioId].name,
      trackName: `${trackNo}. ${book.sections[trackNo - 1]}`
    };

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory((prev) => {
      const updated = [newEntry, ...prev];
      const filtered = updated.slice(0, HISTORY_NUM);
      localStorage.setItem('history', JSON.stringify(filtered));
      return filtered;
    });
  }, [bookId, audioId, trackNo, history, book.title, book.audios, book.sections]);

  return (
    <div className="flex flex-col items-center justify-center">
      <p className="text-3xl my-2">速単音声プレイヤー</p>
      <label className="text-lg my-2">
        <span className="mr-2">教材を選択:</span>
        <select
          className="px-2 py-1"
          value={bookId}
          onChange={(e) => {
            setBookId(Number(e.target.value));

            // reset custom repeat value
            if (customRepeatStart < 1) {
              setCustomRepeatStart(1);
            }
            const newMax = books[Number(e.target.value)].sections.length;
            if (customRepeatEnd > newMax) {
              const newEnd = newMax;
              setCustomRepeatEnd(newEnd);
            }

            //一応音声と番号リセット
            setAudioId(0);
            setTrackNo(0);
          }}>
          {books.map((book, index) => (
            <option key={book.title} value={index}>
              {book.title}
            </option>
          ))}
        </select>
      </label>
      <label className="text-lg my-2">
        <span className="mr-2">音声のタイプを選択:</span>
        <select className="px-2 py-1" value={audioId} onChange={(e) => setAudioId(Number(e.target.value))}>
          {book.audios.map((audio, index) => (
            <option key={audio.name} value={index}>
              {audio.name}
            </option>
          ))}
        </select>
      </label>
      {/* a lot of thanks for @tau34 */}
      {/* {trackNo === 0 && (
        <>
          <p className="text-lg mb-4">トラック番号を選択:</p>
          <div className="grid grid-cols-6 gap-2 mb-4">
            {Array.from({ length: book.sections.length }, (_, i) => (
              <button key={i} className={` px-4 py-1`} onClick={() => setTrackNo(i + 1)}>
                {i + 1}
              </button>
            ))}
          </div>
        </>
      )}*/}
      {trackNo > 0 && (
        <>
          <p className="text-lg mb-2">
            No.{trackNo} 「{book.sections[trackNo - 1]}」
          </p>
          {/* <button className="mb-4  px-4 py-1" onClick={() => setTrackNo(0)}>
            トラック番号選択に戻る
          </button> */}
        </>
      )}
      <div className="flex flex-row my-2">
        <div className="mx-1">
          <button onClick={() => setIsModalOpened(!isModalOpened)}>トラックを選択</button>
          {isModalOpened && (
            <>
              <div className="absolute bg-[#00000096] w-full h-full z-700 left-0 right-0 top-0 bottom-0 m-auto" onClick={() => setIsModalOpened(false)}></div>
              <div className="absolute bg-white border border-gray-200 rounded-md w-[80%] h-[80%] z-800 top-0 left-0 bottom-0 right-0 m-auto shadow-xl backdrop-blur-xl overflow-y-scroll p-8">
                <div className="flex justify-center flex-col items-center">
                  <p className="text-xl mb-2">再生するトラックを選択</p>
                  <div className="flex items-center flex-col">
                    {Array.from({ length: book.sections.length }, (_, i) => (
                      <div className="flex flex-row w-full items-center" key={i}>
                        {trackNo == i + 1 ? <FaPlay /> : <span className="mr-1">{i + 1}.</span>}
                        <button
                          key={i}
                          className={`px-4 py-2 m-2`}
                          onClick={() => {
                            setIsModalOpened(false);
                            setTrackNo(i + 1);
                          }}>
                          <span>{book.sections[i]}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="mx-1">
          <a href="https://github.com/Shota-Sunada/Sokutan/wiki/ヘルプページ" target="_blank" referrerPolicy="no-referrer">
            <button className="flex flex-row items-center">
              <span className="mr-2">ヘルプ</span>
              <FaExternalLinkAlt />
            </button>
          </a>
        </div>
      </div>
      {trackNo != 0 && (
        <>
          <div className="w-[80%] mb-3">
            <AudioPlayer
              src={`${book.audios[audioId].url}${trackNo.toString().padStart(2, '0')}.mp3`}
              showJumpControls={false}
              ref={audioRef}
              onEnded={handleEnded}
              onPlay={() => {
                const newStart = Number(customRepeatStartRef.current?.value);
                setCustomRepeatStart(newStart);
                localStorage.setItem('customRepeatStart', `${newStart}`);
                if (customRepeatEnd < newStart) {
                  setCustomRepeatEnd(newStart);
                  localStorage.setItem('customRepeatEnd', `${newStart}`);
                }

                const newEnd = Number(customRepeatEndRef.current?.value);
                setCustomRepeatEnd(newEnd);
                localStorage.setItem('customRepeatEnd', `${newEnd}`);
                if (customRepeatStart > newEnd) {
                  setCustomRepeatStart(newEnd);
                  localStorage.setItem('customRepeatStart', `${newEnd}`);
                }
              }}
            />
          </div>
          <div className="text-lg my-2 flex items-center">
            <button className="mr-3" onClick={() => moveTrack(-1)}>
              <IoMdSkipBackward />
            </button>
            <button className="mr-3 px-4 py-1 mx-1" onClick={() => skipTime(-skipSeconds)}>
              -{skipSeconds}s
            </button>
            <button className="px-4 py-1 mx-1" onClick={() => skipTime(skipSeconds)}>
              +{skipSeconds}s
            </button>
            <button className="ml-3" onClick={() => moveTrack(1)}>
              <IoMdSkipForward />
            </button>
          </div>
          {/* <label className="text-lg mb-4 flex items-center space-x-2">
            <span>スキップする秒数:</span>
            <input
              type="number"
              min="1"
              value={skipSeconds}
              onChange={(e) => {
                const seconds = Number(e.target.value);
                setSkipSeconds(seconds);
                localStorage.setItem('skipSeconds', `${seconds}`);
              }}
              className="px-2 py-1 w-16"
            />
            秒
          </label> */}
          <p className="text-lg my-2">
            再生速度:
            <label>
              <input
                type="number"
                min="0.25"
                max="2.5"
                step="0.05"
                value={playbackRate}
                onChange={(e) => {
                  const rate = Number(e.target.value);
                  updateRate(rate);
                }}
                className="rounded px-2 py-1 w-16 text-right"
              />
              x
            </label>
          </p>
          <input
            type="range"
            min="0.25"
            max="2.5"
            step="0.05"
            value={playbackRate}
            onChange={(e) => {
              const rate = Number(e.target.value);
              updateRate(rate);
            }}
            ref={inputRangeRef}
            className="my-2"
          />
          <div className="flex items-center my-2">
            {[0.8, 1, 1.2, 1.5].map((rate) => (
              <button key={rate} className={`px-4 py-1 mx-1 ${playbackRate === rate ? 'bg-gray-300' : ''}`} onClick={() => updateRate(rate)}>
                {rate}x
              </button>
            ))}
          </div>
          <label className="text-lg my-2">
            <span className="mr-2">リピート:</span>
            <select
              className="px-2 py-1"
              value={repeatMode}
              onChange={(e) => {
                setRepeatMode(e.target.value as RepeatMode);
                localStorage.setItem('repeatMode', e.target.value);
              }}>
              <option value="off">オフ</option>
              <option value="one">これを繰り返す</option>
              <option value="all">全て再生</option>
              <option value="custom">範囲指定</option>
            </select>
          </label>
          <>
            <label className="text-lg my-2">
              {/* <span className="mr-2">開始:</span> */}
              <span className="mr-2">範囲指定:</span>
              <input
                disabled={repeatMode != 'custom'}
                type="number"
                min="1"
                max={book.sections.length}
                value={customRepeatStart}
                ref={customRepeatStartRef}
                onChange={(e) => {
                  setCustomRepeatStart(Number(e.target.value));
                }}
                className="px-2 py-1 w-16 disabled:bg-gray-200"
              />
              {/* <span className="ml-2 mr-2">終了:</span> */}
              <span className="ml-2 mr-2">から</span>
              <input
                disabled={repeatMode != 'custom'}
                type="number"
                min="1"
                max={book.sections.length}
                value={customRepeatEnd}
                ref={customRepeatEndRef}
                onChange={(e) => {
                  setCustomRepeatEnd(Number(e.target.value));
                }}
                className="px-2 py-1 w-16 disabled:bg-gray-200"
              />
            </label>
          </>
        </>
      )}
      <details className="group text-lg my-3 w-[80%] max-w-lg rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-lg font-medium text-slate-700">
          <span>履歴</span>
          <span className="text-sm text-slate-500 transition-transform group-open:rotate-180">Ⅴ</span>
        </summary>
        <div className="my-2 flex flex-col items-center gap-3 text-slate-600">
          {history.length === 0 && <p className="text-sm text-slate-500">再生履歴はありません</p>}
          {history.map((track, index) => (
            <div
              key={index}
              onClick={() => {
                setBookId(track.bookId);
                setAudioId(track.audioId);
                setTrackNo(track.trackNo);
              }}
              className="w-full cursor-pointer rounded-md border border-slate-300 bg-slate-120/100 px-3 py-2 hover:bg-slate-200">
              <p className="text-sm text-slate-500">
                {track.bookName} - {track.audioName}
              </p>
              {track.trackName}
            </div>
          ))}
        </div>
      </details>

      <div className="my-2">
        <a href="https://www.zkai.co.jp/" target="_blank" referrerPolicy="no-referrer">
          <p>このウェブサイトは、非営利及び教育目的で作成されました。</p>
          <p>全ての音声データの権利はZ会に帰属します。</p>
          <p>(この文字をクリックするとZ会のウェブサイトが開きます。)</p>
        </a>
      </div>
    </div>
  );
}

export default App;
