import React, { useRef } from 'react';
import { Paperclip } from 'lucide-react';

interface AttachmentMenuProps {
  onUpload?: (file: File) => void;
  isLoading?: boolean;
}

export default function AttachmentMenu({ onUpload, isLoading = false }: AttachmentMenuProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <label className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.md"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && onUpload) onUpload(file);
          if (inputRef.current) inputRef.current.value = '';
        }}
        className="hidden"
        disabled={isLoading}
      />
      <Paperclip className="w-4 h-4" />
    </label>
  );
}
