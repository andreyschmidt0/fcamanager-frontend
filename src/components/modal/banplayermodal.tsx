import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { X } from 'lucide-react'

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    category: string;
    option: string;
}

const BanPlayerModal = ({ isOpen, onClose, title, category, option }: ModalProps) => {
    
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/75" aria-hidden="true" />
      
      {/* Modal container */}
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="bg-[#111216] border border-black rounded-lg shadow-lg w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-black">
            <DialogTitle className="text-lg font-neofara font-medium text-white">
              {title}
            </DialogTitle>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6">
            <p className="text-gray-300 mb-4">
              Categoria: <span className="text-white font-medium">{category}</span>
            </p>
            <p className="text-gray-300 mb-6">
              Ação: <span className="text-white font-medium">{option}</span>
            </p>
            
            {/* Placeholder para conteúdo específico da ação */}
            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                Conteúdo específico para "{option}" será implementado aqui.
              </p>
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-black">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Confirmar
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

export default BanPlayerModal;