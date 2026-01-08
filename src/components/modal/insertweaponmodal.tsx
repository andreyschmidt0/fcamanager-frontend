import React, { useState } from 'react';
import BaseModal from '../common/BaseModal';
import { CancelButton, SubmitButton } from '../common/ActionButton';
import { Copy, CheckCircle } from 'lucide-react';

interface InsertWeaponModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InsertWeaponModal: React.FC<InsertWeaponModalProps> = ({ isOpen, onClose }) => {
  const [inputText, setInputText] = useState('');
  const [sqlOutput, setSqlOutput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    setErrorMessage('');
    setCopySuccess(false);
  };

  const parseValue = (val: string) => {
    if (!val) return '0';
    // Remove inline comments like // 460
    val = val.split('//')[0].trim();
    // Check if string (surrounded by quotes)
    if (val.startsWith('"') && val.endsWith('"')) {
      // Remove outer quotes and remove any single quotes inside (e.g., "Baron's" -> N'Barons')
      const content = val.slice(1, -1).replace(/'/g, "");
      return `N'${content}'`;
    }
    return val;
  };

  const generateSql = () => {
    setErrorMessage('');
    setSqlOutput('');
    setCopySuccess(false);

    if (!inputText.trim()) {
      setErrorMessage('Por favor, cole o texto formatado.');
      return;
    }

    try {
      const lines = inputText.split('\n');
      const products: Record<string, string>[] = [];
      const items: Record<string, string>[] = [];
      
      let currentSection: Record<string, string> | null = null;
      let currentType: 'product' | 'item' | null = null;

      for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        if (line.startsWith('[') && line.endsWith(']')) {
            if (currentSection) {
                if (currentType === 'product') products.push(currentSection);
                else if (currentType === 'item') items.push(currentSection);
            }
            currentSection = {};
            const sectionName = line.slice(1, -1).toLowerCase(); // Case-insensitive
            if (sectionName.startsWith('product')) {
                currentType = 'product';
            } else if (sectionName.startsWith('iteminfo')) {
                currentType = 'item';
            } else {
                currentType = null;
                currentSection = null;
            }
        } else if (currentSection && line.includes('=')) {
            const [key, ...valueParts] = line.split('=');
            const value = valueParts.join('=').trim();
            currentSection[key.trim()] = value;
        }
      }
      // Push the last one
      if (currentSection) {
         if (currentType === 'product') products.push(currentSection);
         else if (currentType === 'item') items.push(currentSection);
      }

      if (products.length === 0 && items.length === 0) {
        setErrorMessage('Nenhum dado válido encontrado. Verifique o formato.');
        return;
      }

      let sql = '';

      // Generate CBT_ItemInfo INSERT
      if (items.length > 0) {
        sql += `INSERT INTO dbo.CBT_ItemInfo (\n`;
        sql += `    ItemNo, Name, ItemType, Detailtype, Functioninfo, OptionType, SlotNum, GPUnlock, NXUnlock, ClanUnlock, ItemGrade, Category, WeaponSet\n`;
        sql += `) VALUES\n`;
        
        const itemValues = items.map(item => {
           const name = parseValue(item['Name']);
           const itemNo = parseValue(item['ItemNo']);
           const itemType = parseValue(item['Itemtype'] || item['ItemType']);
           const detailType = parseValue(item['Detailtype'] || item['DetailType'] || '0');
           const functionInfo = parseValue(item['Functioninfo'] || item['FunctionInfo'] || '0');
           const optionType = parseValue(item['OptionType'] || '0');
           const slotNum = parseValue(item['SlotNum'] || item['Slot'] || '0');
           const gpUnlock = parseValue(item['GP_Unlock'] || item['GPUnlock'] || '0');
           const nxUnlock = parseValue(item['NX_Unlock'] || item['NXUnlock'] || '0');
           const clanUnlock = parseValue(item['UnlockClanExp'] || item['ClanUnlock'] || '0'); 
           const itemGrade = parseValue(item['ItemGrade'] || '0');
           const category = '0'; 
           const weaponSet = '0'; 

           return `(${itemNo}, ${name}, ${itemType}, ${detailType}, ${functionInfo}, ${optionType}, ${slotNum}, ${gpUnlock}, ${nxUnlock}, ${clanUnlock}, ${itemGrade}, ${category}, ${weaponSet})`;
        });
        sql += itemValues.join(',\n') + ';\n\n';
      }

      // Group products by ProductName
      const groupedProducts: Record<string, typeof products> = {};
      products.forEach(prod => {
          // Normalize name by removing quotes for the key if present, though parseValue adds N'...' we want the raw name for grouping or the display name
          let rawName = prod['ProductName'];
          if (rawName && rawName.startsWith('"') && rawName.endsWith('"')) {
              rawName = rawName.slice(1, -1);
          }
          if (!groupedProducts[rawName]) {
              groupedProducts[rawName] = [];
          }
          groupedProducts[rawName].push(prod);
      });

      // Generate CBT_ProductInfo INSERT
      if (products.length > 0) {
        sql += `INSERT INTO dbo.CBT_ProductInfo (\n`;
        sql += `    ProductID, ProductName, SaleType, Price, SalePrice, BonusGP, ItemNum, ItemNo00, ConsumeType00, Period00, ItemNo01, ConsumeType01, \n`;
        sql += `	Period01, ItemNo02, ConsumeType02, Period02, ItemNo03, ConsumeType03, Period03, ItemNo04, ConsumeType04, Period04, ActivationUnlock, InboxGift\n`;
        sql += `) VALUES\n`;

        const productBlocks: string[] = [];

        Object.keys(groupedProducts).forEach(name => {
            const group = groupedProducts[name];
            const groupValues = group.map(prod => {
                const productID = parseValue(prod['ProductID']);
                const productName = parseValue(prod['ProductName']);
                const saleType = parseValue(prod['SaleType']);
                const price = parseValue(prod['Price']);
                const salePrice = parseValue(prod['SalePrice']);
                const bonusGP = parseValue(prod['BonusGP']);
                const itemNum = parseValue(prod['Itemnum'] || prod['ItemNum']);
                const itemNo0 = parseValue(prod['ItemNo0']);
                const consumeType0 = parseValue(prod['Consumetype0']);
                const period0 = parseValue(prod['Period0']);
                const activationUnlock = parseValue(prod['ActivationUnlock']);
                const inboxGift = parseValue(prod['InboxGift']);
                
                const zeros = '0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0';
                return `(${productID}, ${productName}, ${saleType}, ${price}, ${salePrice}, ${bonusGP}, ${itemNum}, ${itemNo0}, ${consumeType0}, ${period0}, ${zeros}, ${activationUnlock}, ${inboxGift})`;
            });
            // Add comment header for the group
            productBlocks.push(`-- ${name}\n` + groupValues.join(',\n'));
        });
        
        sql += productBlocks.join(',\n') + ';\n\n';

        // Generate CBT_ProductInfo_ShopView INSERT
        sql += `INSERT INTO dbo.CBT_ProductInfo_ShopView (ProductID, ShopView) VALUES\n`;
        
        const shopViewBlocks: string[] = [];

        Object.keys(groupedProducts).forEach(name => {
            const group = groupedProducts[name];
            const groupValues = group.map(prod => {
                 const productID = parseValue(prod['ProductID']);
                 return `(${productID}, 1)`;
            });
             shopViewBlocks.push(`-- ${name}\n` + groupValues.join(', ')); // Joined by comma space for compactness or comma newline
        });

        sql += shopViewBlocks.join(',\n') + ';';
      }

      setSqlOutput(sql);

    } catch (err) {
      console.error(err);
      setErrorMessage('Erro ao converter. Verifique o formato do texto.');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlOutput).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
    });
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="INSERIR ARMA"
      maxWidth="3xl"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Cole o texto formatado aqui:
          </label>
          <textarea
            value={inputText}
            onChange={handleInputChange}
            rows={12}
            className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none transition-colors font-mono text-xs"
            placeholder="[ProductXXXX]..."
          />
        </div>

        {errorMessage && (
           <div className="bg-red-900/20 border border-red-600 rounded-lg p-3">
             <p className="text-red-400 text-sm">{errorMessage}</p>
           </div>
        )}

        <div className="flex justify-end">
            <SubmitButton onClick={generateSql}>
                Converter em SQL
            </SubmitButton>
        </div>

        {sqlOutput && (
            <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-white">
                        Resultado SQL:
                    </label>
                    <button 
                        onClick={copyToClipboard}
                        className="flex items-center gap-2 text-xs text-green-400 hover:text-green-300 transition-colors"
                    >
                        {copySuccess ? <CheckCircle size={14} /> : <Copy size={14} />}
                        {copySuccess ? 'Copiado!' : 'Copiar SQL'}
                    </button>
                </div>
                <textarea
                    readOnly
                    value={sqlOutput}
                    rows={12}
                    className="w-full px-3 py-2 bg-[#111216] text-green-400 rounded-lg border border-gray-700 font-mono text-xs"
                />
            </div>
        )}

        <div className="flex justify-end pt-4">
           <CancelButton onClick={onClose}>
             Fechar
           </CancelButton>
        </div>
      </div>
    </BaseModal>
  );
};

export default InsertWeaponModal;
