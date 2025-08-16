import React from 'react';


interface ConfirmationModalProps {
        isOpen: boolean;
        onConfirm: () => void;
        onCancel: () => void;
        title: string;
        description?: string;
        confirmActionText?: string;
        cancelActionText?: string;
      }
  
  
      const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
        isOpen,
        onConfirm,
        onCancel,
        title,
        description,
        confirmActionText = 'Confirm',
        cancelActionText = 'Cancel',
      }) => {
        if (!isOpen) return null;
  
        return (
          <div className='fixed z-50 inset-0 bg-black bg-opacity-50 flex justify-center items-center'>
            <h2>{title}</h2>
            {description && <p>{description}</p>}
            <button onClick={onConfirm}>{confirmActionText}</button>
            <button onClick={onCancel}>{cancelActionText}</button>
          </div>
        );
      };
  
      export default ConfirmationModal;