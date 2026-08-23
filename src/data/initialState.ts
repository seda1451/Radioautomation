import { QueueItem, LibrarySong, CustomPlaylist, CartItem, ProgramClock } from '../types';

export const INITIAL_PLAYLIST: QueueItem[] = [];

export const INITIAL_LIBRARY: LibrarySong[] = [
  { id: 'lib-1', title: 'Blinding Lights', artist: 'The Weeknd', dur: '3:20', durSeconds: 200, type: 'POP', category: 'MUSIC', year: '2020', bpm: 171, key: 'F minor', camelotKey: '4A', energyLevel: 9, introSec: 14, segueSec: 195, fadeSec: 199 },
  { id: 'lib-2', title: 'As It Was', artist: 'Harry Styles', dur: '2:47', durSeconds: 167, type: 'POP', category: 'MUSIC', year: '2022', bpm: 174, key: 'A major', camelotKey: '11B', energyLevel: 8, introSec: 8, segueSec: 162, fadeSec: 166 },
  { id: 'lib-3', title: 'Levitating', artist: 'Dua Lipa', dur: '3:23', durSeconds: 203, type: 'DANCE', category: 'MUSIC', year: '2020', bpm: 124, key: 'B minor', camelotKey: '10A', energyLevel: 9, introSec: 12, segueSec: 198, fadeSec: 202 },
  { id: 'lib-4', title: 'Flowers', artist: 'Miley Cyrus', dur: '3:20', durSeconds: 200, type: 'POP', category: 'MUSIC', year: '2023', bpm: 118, key: 'A minor', camelotKey: '8A', energyLevel: 7, introSec: 10, segueSec: 194, fadeSec: 199 },
  { id: 'lib-5', title: 'Anti-Hero', artist: 'Taylor Swift', dur: '3:21', durSeconds: 201, type: 'POP', category: 'MUSIC', year: '2022', bpm: 97, key: 'E major', camelotKey: '12B', energyLevel: 6, introSec: 7, segueSec: 195, fadeSec: 200 },
  { id: 'lib-6', title: 'Watermelon Sugar', artist: 'Harry Styles', dur: '2:54', durSeconds: 174, type: 'POP', category: 'MUSIC', year: '2019', bpm: 95, key: 'A minor', camelotKey: '8A', energyLevel: 7, introSec: 9, segueSec: 168, fadeSec: 173 },
  { id: 'lib-7', title: 'Stay With Me', artist: 'Sam Smith', dur: '2:52', durSeconds: 172, type: 'POP', category: 'MUSIC', year: '2014', bpm: 84, key: 'C major', camelotKey: '8B', energyLevel: 5, introSec: 4, segueSec: 166, fadeSec: 170 },
  { id: 'lib-8', title: 'Bad Guy', artist: 'Billie Eilish', dur: '3:14', durSeconds: 194, type: 'ALT', category: 'MUSIC', year: '2019', bpm: 135, key: 'G minor', camelotKey: '6A', energyLevel: 8, introSec: 14, segueSec: 188, fadeSec: 193 },
  { id: 'lib-9', title: 'Starboy', artist: 'The Weeknd ft. Daft Punk', dur: '3:50', durSeconds: 230, type: 'POP', category: 'MUSIC', year: '2016', bpm: 186, key: 'G major', camelotKey: '9B', energyLevel: 9, introSec: 16, segueSec: 224, fadeSec: 229 },
  { id: 'lib-10', title: 'Good 4 U', artist: 'Olivia Rodrigo', dur: '2:58', durSeconds: 178, type: 'ROCK', category: 'MUSIC', year: '2021', bpm: 167, key: 'F# minor', camelotKey: '11A', energyLevel: 10, introSec: 8, segueSec: 172, fadeSec: 177 },
  { id: 'lib-11', title: 'Station Sweeper 98.5', artist: 'Cloud Radio Imaging', dur: '0:05', durSeconds: 5, type: 'SWEEPER', category: 'JINGLE' },
  { id: 'lib-12', title: 'Hourly News Stinger', artist: 'TMG Broadcast Production', dur: '0:08', durSeconds: 8, type: 'NEWS', category: 'JINGLE' },
];

export const INITIAL_CUSTOM_PLAYLISTS: CustomPlaylist[] = [];

export const INITIAL_CARTS: CartItem[] = [];

export const INITIAL_PROGRAM_CLOCKS: ProgramClock[] = [
  {
    id: 'clk-1',
    name: 'Morning Drive Format',
    hourRange: '06:00 - 10:00',
    slots: [
      { minute: 0, category: 'STATION ID & NEWS', description: 'Top of Hour News & Time Check', color: 'bg-blue-600' },
      { minute: 5, category: 'CLOUD FRESH', description: 'Upbeat High Energy Current', color: 'bg-amber-600' },
      { minute: 15, category: 'SPONSOR BLOCK', description: 'Commercial break #1 (2 mins)', color: 'bg-pink-600' },
      { minute: 18, category: 'CLOUD 2010S', description: 'Gold / Recurrent Power Song', color: 'bg-indigo-600' },
      { minute: 30, category: 'TRAFFIC & WEATHER', description: 'Voice Track Weather update', color: 'bg-teal-600' },
      { minute: 33, category: 'CLOUD FRESH', description: 'Chart Buster Song', color: 'bg-amber-600' },
      { minute: 45, category: 'SPONSOR BLOCK', description: 'Commercial break #2 (2 mins)', color: 'bg-pink-600' },
      { minute: 50, category: 'POP RECURRENT', description: 'Familiar Crowd Pleaser', color: 'bg-emerald-600' },
    ],
  },
  {
    id: 'clk-2',
    name: 'Afternoon Non-Stop Hits',
    hourRange: '14:00 - 18:00',
    slots: [
      { minute: 0, category: 'STATION ID', description: 'Top of Hour Jingle', color: 'bg-blue-600' },
      { minute: 2, category: 'CLOUD FRESH', description: 'Power Current Song', color: 'bg-amber-600' },
      { minute: 20, category: 'SWEEPER', description: 'Station Branding Sweeper', color: 'bg-purple-600' },
      { minute: 21, category: 'CLOUD FRESH', description: 'Hot Dance Track', color: 'bg-amber-600' },
      { minute: 40, category: 'SPONSOR BLOCK', description: 'Commercial break (2 mins)', color: 'bg-pink-600' },
      { minute: 44, category: 'CLOUD 2010S', description: 'Throwback Hit', color: 'bg-indigo-600' },
    ],
  },
];
