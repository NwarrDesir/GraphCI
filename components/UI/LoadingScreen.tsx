'use client';

export default function LoadingScreen({ message = 'Chargement...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black">
      <div className="loader mb-4"></div>
      <p className="text-white text-sm">{message}</p>
    </div>
  );
}
