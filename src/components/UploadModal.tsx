import React, { useState, useRef } from 'react';
import { CloudUpload, X, FileAudio, Check, Plus, Trash2 } from 'lucide-react';
import { LibrarySong, QueueItem } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmBulkUpload: (newTracks: LibrarySong[]) => void;
  onShowToast: (msg: string) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onConfirmBulkUpload,
  onShowToast,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [defaultCategory, setDefaultCategory] = useState<string>('LOCAL UPLOAD');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files).filter(
      (f) => f.type.startsWith('audio/') || f.name.endsWith('.mp3') || f.name.endsWith('.wav') || f.name.endsWith('.m4a')
    );
    setSelectedFiles((prev) => [...prev, ...fileArray]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadSubmit = () => {
    if (selectedFiles.length === 0) {
      onShowToast('Please select at least one audio file.');
      return;
    }

    const createdTracks: LibrarySong[] = selectedFiles.map((file, idx) => {
      const fileNameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const audioUrl = URL.createObjectURL(file);
      return {
        id: `upload-${Date.now()}-${idx}`,
        title: fileNameWithoutExt,
        artist: 'Uploaded Local Artist',
        dur: '3:30',
        durSeconds: 210,
        type: defaultCategory,
        category: 'LOCAL',
        audioUrl,
        year: '2026',
      };
    });

    onConfirmBulkUpload(createdTracks);
    setSelectedFiles([]);
    onClose();
    onShowToast(`Successfully uploaded ${createdTracks.length} audio tracks in bulk!`);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#1a1c23] border border-[#2c303e] rounded-xl p-6 w-full max-w-lg shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2c303e] pb-3">
          <div className="flex items-center space-x-2">
            <CloudUpload className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-base text-white">Bulk Upload Audio Music Files (MP3 / WAV)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 ${
            isDragging
              ? 'border-orange-500 bg-orange-950/20'
              : 'border-[#2c303e] hover:border-orange-500/60 bg-[#121316]'
          }`}
        >
          <CloudUpload className="w-8 h-8 text-orange-400 animate-bounce" />
          <div className="text-xs font-bold text-gray-200">
            Drag & drop audio files here, or click to browse
          </div>
          <div className="text-[10px] text-slate-400">
            Supports MP3, WAV, AAC, OGG, M4A, FLAC
          </div>
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="audio/*,.mp3,.wav,.ogg,.m4a"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Selected files preview */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between font-semibold text-slate-400">
            <span>Selected Files Preview</span>
            <span className="text-orange-400 font-bold">{selectedFiles.length} files selected</span>
          </div>

          <div className="max-h-36 overflow-y-auto bg-[#121316] border border-[#2c303e] rounded-lg p-2 space-y-1.5 font-mono text-[11px]">
            {selectedFiles.length === 0 ? (
              <div className="text-slate-500 italic py-2 text-center font-sans">
                No files selected yet...
              </div>
            ) : (
              selectedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-[#1a1c23] px-2.5 py-1 rounded border border-[#2c303e]"
                >
                  <div className="flex items-center space-x-2 truncate pr-2">
                    <FileAudio className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    <span className="truncate text-gray-200">{file.name}</span>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-slate-400 text-[10px]">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(idx);
                      }}
                      className="text-slate-400 hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Target Category / Rotation Tag</label>
            <select
              value={defaultCategory}
              onChange={(e) => setDefaultCategory(e.target.value)}
              className="w-full bg-[#121316] border border-[#2c303e] rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-orange-500"
            >
              <option value="LOCAL UPLOAD">LOCAL UPLOAD</option>
              <option value="CLOUD FRESH">CLOUD FRESH</option>
              <option value="CLOUD 2010S">CLOUD 2010S</option>
              <option value="SONG SPONSOR">SONG SPONSOR</option>
              <option value="POP">POP</option>
              <option value="DANCE">DANCE</option>
              <option value="SWEEPER">SWEEPER</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 pt-3 border-t border-[#2c303e]">
          <button
            onClick={onClose}
            className="bg-[#232631] hover:bg-[#2c303e] text-gray-300 px-4 py-2 rounded font-semibold text-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleUploadSubmit}
            disabled={selectedFiles.length === 0}
            className="bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded font-bold text-xs shadow flex items-center space-x-1.5 cursor-pointer"
          >
            <CloudUpload className="w-4 h-4" />
            <span>Upload & Add ({selectedFiles.length})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
