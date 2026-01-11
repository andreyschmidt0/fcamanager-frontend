import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface GachaponItem {
  itemNo?: number;
  productID?: number;
  name: string;
  percentage: number;
  period: number;
  consumeType: number;
  broadcast: boolean;
}

interface Version {
  changeId: number;
  version: number;
  date: string;
  items: GachaponItem[];
}

interface VersionCarouselProps {
  history: Version[];
  originalConfig: GachaponItem[];
  boxType: string;
}

const VersionCarousel: React.FC<VersionCarouselProps> = ({
  history,
  originalConfig,
  boxType
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!history || history.length === 0) {
    return (
      <div className="bg-[#1d1e24] p-4 rounded-lg border border-black">
        <p className="text-gray-400 text-center">Sem histórico de versões</p>
      </div>
    );
  }

  const currentVersion = history[currentIndex];
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < history.length - 1;

  // Calculate changes compared to original
  const getItemKey = (item: GachaponItem) =>
    `${boxType === 'item' ? item.itemNo : item.productID}_${item.period}_${item.consumeType}`;

  const originalMap = new Map(originalConfig.map(item => [getItemKey(item), item]));
  const currentMap = new Map(currentVersion.items.map(item => [getItemKey(item), item]));

  const removed = originalConfig.filter(item => !currentMap.has(getItemKey(item)));
  const added = currentVersion.items.filter(item => !originalMap.has(getItemKey(item)));
  const modified = currentVersion.items.filter(newItem => {
    const key = getItemKey(newItem);
    const oldItem = originalMap.get(key);
    return oldItem && oldItem.percentage !== newItem.percentage;
  });

  const totalPercentage = currentVersion.items.reduce((sum, item) => sum + item.percentage, 0);

  return (
    <div className="bg-[#1d1e24] p-4 rounded-lg border border-black space-y-4">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-white font-bold">Histórico de Versões</h4>
          <p className="text-sm text-gray-400">
            Versão {currentVersion.version} de {history.length}
            {currentVersion.changeId > 1 && ` (Resubmissão ${currentVersion.changeId - 1})`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentIndex(prev => prev - 1)}
            disabled={!canGoPrevious}
            className="p-2 rounded bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-white text-sm min-w-[60px] text-center">
            {currentIndex + 1} / {history.length}
          </span>
          <button
            onClick={() => setCurrentIndex(prev => prev + 1)}
            disabled={!canGoNext}
            className="p-2 rounded bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Version Info */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-gray-400">Data da Versão:</span>
          <p className="text-white">{new Date(currentVersion.date).toLocaleString('pt-BR')}</p>
        </div>
        <div>
          <span className="text-gray-400">Total de Itens:</span>
          <p className="text-white">{currentVersion.items.length}</p>
        </div>
        <div>
          <span className="text-gray-400">Porcentagem Total:</span>
          <p className={totalPercentage === 10000 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
            {(totalPercentage / 100).toFixed(2)}%
          </p>
        </div>
        <div>
          <span className="text-gray-400">ChangeID:</span>
          <p className="text-white">{currentVersion.changeId}</p>
        </div>
      </div>

      {/* Changes Summary */}
      {(added.length > 0 || removed.length > 0 || modified.length > 0) && (
        <div className="bg-[#111216] p-3 rounded border border-gray-700">
          <h5 className="text-white font-bold text-sm mb-2">Comparação com Original</h5>
          <div className="flex gap-4 text-xs">
            {added.length > 0 && (
              <div className="text-green-400">
                + {added.length} adicionado{added.length > 1 ? 's' : ''}
              </div>
            )}
            {removed.length > 0 && (
              <div className="text-red-400">
                - {removed.length} removido{removed.length > 1 ? 's' : ''}
              </div>
            )}
            {modified.length > 0 && (
              <div className="text-yellow-400">
                ~ {modified.length} modificado{modified.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detailed Changes */}
      <div className="space-y-2">
        {removed.length > 0 && (
          <div className="bg-red-900/20 border border-red-600 p-2 rounded">
            <h6 className="text-red-400 font-bold text-xs mb-1">Removidos</h6>
            <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
              {removed.map((item, idx) => (
                <div key={idx} className="text-xs text-gray-300">
                  {item.name} - {(item.percentage / 100).toFixed(2)}%
                </div>
              ))}
            </div>
          </div>
        )}

        {added.length > 0 && (
          <div className="bg-green-900/20 border border-green-600 p-2 rounded">
            <h6 className="text-green-400 font-bold text-xs mb-1">Adicionados</h6>
            <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
              {added.map((item, idx) => (
                <div key={idx} className="text-xs text-gray-300">
                  {item.name} - {(item.percentage / 100).toFixed(2)}%
                </div>
              ))}
            </div>
          </div>
        )}

        {modified.length > 0 && (
          <div className="bg-yellow-900/20 border border-yellow-600 p-2 rounded">
            <h6 className="text-yellow-400 font-bold text-xs mb-1">Modificados</h6>
            <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
              {modified.map((item, idx) => {
                const oldItem = originalMap.get(getItemKey(item));
                return (
                  <div key={idx} className="text-xs text-gray-300">
                    {item.name}: {(oldItem!.percentage / 100).toFixed(2)}% → {(item.percentage / 100).toFixed(2)}%
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VersionCarousel;
