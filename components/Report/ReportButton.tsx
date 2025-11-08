'use client';

import { useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import ReportModal from './ReportModal';

export default function ReportButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="floating-button w-16 h-16 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition shadow-xl"
        aria-label="Signaler un vendeur"
      >
        <FaPlus className="text-2xl" />
      </button>

      <ReportModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
