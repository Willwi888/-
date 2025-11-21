import React, { useState } from 'react';

export interface ExportConfig {
  resolution: 'original' | '720p' | '1080p';
  audioBitrate: '128k' | '192k' | '320k';
}

interface ExportSettingsModalProps {
  onConfirm: (config: ExportConfig) => void;
  onCancel: () => void;
}

const ExportSettingsModal: React.FC<ExportSettingsModalProps> = ({ onConfirm, onCancel }) => {
  const [resolution, setResolution] = useState<ExportConfig['resolution']>('original');
  const [audioBitrate, setAudioBitrate] = useState<ExportConfig['audioBitrate']>('192k');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({ resolution, audioBitrate });
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-80 backdrop-blur-sm flex flex-col items-center justify-center z-50 text-white p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-xl font-bold text-white">匯出設定</h3>
          <p className="text-sm text-gray-400 mt-1">調整您的 MV 輸出品質</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Resolution Section */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">影像解析度</label>
            <div className="grid grid-cols-1 gap-3">
              <label className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${resolution === 'original' ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500' : 'bg-gray-700/30 border-gray-600 hover:border-gray-500'}`}>
                <div className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name="resolution" 
                    value="original" 
                    checked={resolution === 'original'} 
                    onChange={() => setResolution('original')}
                    className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-500 focus:ring-blue-500 focus:ring-offset-gray-800"
                  />
                  <div>
                    <span className="block font-medium text-gray-200">原始畫質 (最快)</span>
                    <span className="block text-xs text-gray-400">直接使用螢幕錄製解析度，無需轉檔</span>
                  </div>
                </div>
              </label>
              
              <label className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${resolution === '720p' ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500' : 'bg-gray-700/30 border-gray-600 hover:border-gray-500'}`}>
                <div className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name="resolution" 
                    value="720p" 
                    checked={resolution === '720p'} 
                    onChange={() => setResolution('720p')}
                    className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-500 focus:ring-blue-500 focus:ring-offset-gray-800"
                  />
                  <div>
                    <span className="block font-medium text-gray-200">720p HD (較慢)</span>
                    <span className="block text-xs text-gray-400">適合社群分享，需重新編碼</span>
                  </div>
                </div>
              </label>

              <label className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${resolution === '1080p' ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500' : 'bg-gray-700/30 border-gray-600 hover:border-gray-500'}`}>
                <div className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name="resolution" 
                    value="1080p" 
                    checked={resolution === '1080p'} 
                    onChange={() => setResolution('1080p')}
                    className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-500 focus:ring-blue-500 focus:ring-offset-gray-800"
                  />
                  <div>
                    <span className="block font-medium text-gray-200">1080p Full HD (很慢)</span>
                    <span className="block text-xs text-gray-400">最高畫質，編碼時間較長</span>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Audio Quality Section */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">音訊品質 (Bitrate)</label>
            <div className="flex gap-4">
               <label className="flex-1 cursor-pointer">
                 <input type="radio" name="audio" value="128k" checked={audioBitrate === '128k'} onChange={() => setAudioBitrate('128k')} className="sr-only peer" />
                 <div className="text-center py-2 px-4 rounded-md bg-gray-700 border border-gray-600 text-gray-300 peer-checked:bg-blue-600/20 peer-checked:border-blue-500 peer-checked:text-white transition-all">128k</div>
               </label>
               <label className="flex-1 cursor-pointer">
                 <input type="radio" name="audio" value="192k" checked={audioBitrate === '192k'} onChange={() => setAudioBitrate('192k')} className="sr-only peer" />
                 <div className="text-center py-2 px-4 rounded-md bg-gray-700 border border-gray-600 text-gray-300 peer-checked:bg-blue-600/20 peer-checked:border-blue-500 peer-checked:text-white transition-all">192k</div>
               </label>
               <label className="flex-1 cursor-pointer">
                 <input type="radio" name="audio" value="320k" checked={audioBitrate === '320k'} onChange={() => setAudioBitrate('320k')} className="sr-only peer" />
                 <div className="text-center py-2 px-4 rounded-md bg-gray-700 border border-gray-600 text-gray-300 peer-checked:bg-blue-600/20 peer-checked:border-blue-500 peer-checked:text-white transition-all">320k</div>
               </label>
            </div>
          </div>
        </form>

        <div className="p-6 bg-gray-800/50 border-t border-gray-700 flex justify-end gap-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            取消
          </button>
          <button 
            onClick={handleSubmit}
            className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg shadow-blue-900/20 transition-all"
          >
            開始匯出
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportSettingsModal;