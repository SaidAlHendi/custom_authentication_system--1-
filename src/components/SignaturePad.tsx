import React, { useRef, useEffect, useState } from 'react';
import SignaturePad from 'signature_pad';
import { Button } from './ui/button';
import { X, RotateCcw, Download } from 'lucide-react';

interface SignaturePadProps {
  onSave: (signatureData: string) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export function SignaturePadComponent({ onSave, onCancel, isOpen }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'white',
        penColor: 'black',
        minWidth: 1,
        maxWidth: 2.5,
      });

      signaturePadRef.current = signaturePad;

      // Resize canvas to fit container
      const resizeCanvas = () => {
        const container = canvas.parentElement;
        if (container) {
          const rect = container.getBoundingClientRect();
          canvas.width = rect.width - 40; // Account for padding
          canvas.height = 200;
          signaturePad.clear();
        }
      };

      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      return () => {
        window.removeEventListener('resize', resizeCanvas);
        signaturePad.off();
      };
    }
  }, [isOpen]);

  const handleClear = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };

  const handleSave = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      const signatureData = signaturePadRef.current.toDataURL();
      onSave(signatureData);
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Unterschrift hinzufügen</h3>
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
          <canvas
            ref={canvasRef}
            className="w-full h-48 border border-gray-200 rounded cursor-crosshair"
            style={{ touchAction: 'none' }}
          />
        </div>

        <div className="flex gap-2 justify-center">
          <Button
            onClick={handleClear}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Löschen
          </Button>
          
          <Button
            onClick={handleSave}
            size="sm"
            className="flex items-center gap-2"
            disabled={signaturePadRef.current?.isEmpty()}
          >
            <Download className="h-4 w-4" />
            Speichern
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-2">
          Unterschreiben Sie mit dem Finger oder der Maus
        </p>
      </div>
    </div>
  );
} 