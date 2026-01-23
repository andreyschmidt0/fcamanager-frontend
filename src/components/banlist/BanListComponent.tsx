import React, { useState } from 'react';
import apiService from '../../services/api-tauri.service';
import { SubmitButton } from '../common/ActionButton';
import { Copy, CheckCircle } from 'lucide-react';

const BanListComponent: React.FC = () => {
  const [outputText, setOutputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const generateBanList = async () => {
    setLoading(true);
    setError(null);
    setOutputText('');
    
    try {
      const result = await apiService.getWeeklyBanList();
      if (result.success && result.data) {
        const { model1, model2 } = result.data;
        
        let finalOutput = '';
        
        if (model1) {
          finalOutput += '=== MODELO 1: BANIMENTOS GERAIS ===\n\n';
          finalOutput += model1;
          finalOutput += '\n\n';
        }
        
        if (model2) {
          finalOutput += '=== MODELO 2: HACKS / MACROS ===\n\n';
          finalOutput += model2;
        }

        if (!finalOutput) {
            finalOutput = 'Nenhum banimento encontrado para o período.';
        }
        
        setOutputText(finalOutput);
      } else {
        setError(result.error || result.message || 'Erro ao carregar lista de banimentos');
      }
    } catch (err) {
      setError('Erro de conexão ao carregar lista de banimentos');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    }).catch(err => {
      console.error('Falha ao copiar:', err);
    });
  };

  return (
    <div className="space-y-4">
      {error && (
         <div className="bg-red-900/20 border border-red-600 rounded-lg p-3">
           <p className="text-red-400 text-sm">{error}</p>
         </div>
      )}

      <div className="flex justify-end">
          <SubmitButton 
            onClick={generateBanList}
            disabled={loading}
            loading={loading}
            loadingText="Gerando..."
          >
              Gerar lista de Ban
          </SubmitButton>
      </div>

      <div>
          <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-white">
                  Resultado:
              </label>
              <button 
                  onClick={copyToClipboard}
                  disabled={!outputText}
                  className={`flex items-center gap-2 text-xs transition-colors ${!outputText ? 'text-gray-600 cursor-not-allowed' : 'text-green-400 hover:text-green-300'}`}
              >
                  {copySuccess ? <CheckCircle size={14} /> : <Copy size={14} />}
                  {copySuccess ? 'Copiado!' : 'Copiar Texto'}
              </button>
          </div>
          <textarea
              readOnly
              value={outputText}
              rows={20}
              className="w-full px-3 py-2 bg-[#111216] text-green-400 rounded-lg border border-gray-700 font-mono text-xs focus:outline-none"
              placeholder="A lista gerada aparecerá aqui..."
          />
      </div>
    </div>
  );
};

export default BanListComponent;
