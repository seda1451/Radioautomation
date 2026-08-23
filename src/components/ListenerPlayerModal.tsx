import React, { useState } from 'react';
import { Radio, X, Volume2, VolumeX, Play, Square, Send, MessageCircle, Heart, Music } from 'lucide-react';
import { QueueItem } from '../types';
import { audioEngine } from '../services/audioEngine';

interface ListenerPlayerModalProps {
  isOpen: boolean;
  currentTrack: QueueItem | null;
  onClose: () => void;
  onSubmitRequest: (sender: string, location: string, message: string, song?: string) => void;
  onShowToast: (msg: string) => void;
}

export const ListenerPlayerModal: React.FC<ListenerPlayerModalProps> = ({
  isOpen,
  currentTrack,
  onClose,
  onSubmitRequest,
  onShowToast,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [senderName, setSenderName] = useState('');
  const [location, setLocation] = useState('');
  const [messageText, setMessageText] = useState('');
  const [requestedSongText, setRequestedSongText] = useState('');
  const [likeCount, setLikeCount] = useState(148);
  const [hasLiked, setHasLiked] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !messageText.trim()) {
      onShowToast('Please enter your name and message');
      return;
    }
    onSubmitRequest(senderName, location || 'Web Listener', messageText, requestedSongText);
    setMessageText('');
    setRequestedSongText('');
    onShowToast('Message & Song Request sent to Studio Presenter!');
  };

  const handleLike = () => {
    if (!hasLiked) {
      setLikeCount((c) => c + 1);
      setHasLiked(true);
      onShowToast('Thanks for liking the track! ❤️');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#12141a] border border-[#2c303e] rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5 text-gray-200">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-[#2c303e] pb-3">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="font-bold text-xs tracking-wider text-red-400">LIVE BROADCAST STREAM</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Player Card */}
        <div className="bg-[#181b24] border border-[#2a2f3e] rounded-xl p-5 text-center space-y-4 shadow-inner">
          <div className="w-24 h-24 mx-auto rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg border border-white/10">
            <Radio className="w-10 h-10 text-white" />
          </div>

          <div>
            <div className="text-xs font-mono text-indigo-400 font-bold uppercase tracking-wider">
              NOW PLAYING ON CLOUD RADIO 98.5 FM
            </div>
            <h3 className="text-lg font-extrabold text-white mt-1 truncate">
              {currentTrack?.title || 'Studio Live Playout'}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 truncate">
              {currentTrack?.artist || 'Cloud Radio Playout'}
            </p>
          </div>

          <div className="flex items-center justify-center space-x-4 pt-2">
            <button
              type="button"
              onClick={handleLike}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition cursor-pointer ${
                hasLiked
                  ? 'bg-rose-950/80 border-rose-600 text-rose-300'
                  : 'bg-[#101217] border-[#2c303e] text-slate-300 hover:border-rose-500'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>{likeCount} Likes</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const active = audioEngine.isAudioActive();
                if (active) {
                  audioEngine.pausePlayout();
                  setIsPlaying(false);
                } else {
                  audioEngine.resumePlayout();
                  setIsPlaying(true);
                }
              }}
              className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-md cursor-pointer"
            >
              {isPlaying ? <Square className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
            </button>
          </div>
        </div>

        {/* Send Song Request / Studio Shoutout Form */}
        <form onSubmit={handleSubmit} className="space-y-2.5 text-xs">
          <div className="font-bold text-white flex items-center space-x-1.5">
            <MessageCircle className="w-3.5 h-3.5 text-teal-400" />
            <span>Send Shoutout or Song Request to Presenter</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              required
              placeholder="Your Name"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="bg-[#181b24] border border-[#2c303e] rounded p-2 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
            <input
              type="text"
              placeholder="Your City (e.g. Praha)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-[#181b24] border border-[#2c303e] rounded p-2 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <input
            type="text"
            placeholder="Requested Song Title & Artist (Optional)"
            value={requestedSongText}
            onChange={(e) => setRequestedSongText(e.target.value)}
            className="w-full bg-[#181b24] border border-[#2c303e] rounded p-2 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />

          <textarea
            rows={2}
            required
            placeholder="Write your greeting or shoutout for the live show..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="w-full bg-[#181b24] border border-[#2c303e] rounded p-2 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />

          <button
            type="submit"
            className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 rounded-lg shadow flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Live Message to Radio Host</span>
          </button>
        </form>
      </div>
    </div>
  );
};
