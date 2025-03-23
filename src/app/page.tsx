// app/page.tsx
'use client'; // Mark this as a client component
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

const generateRoomId = (): string => {
  return uuidv4().substring(0, 8);
};

export default function Home() {
  const router = useRouter();

  const handleCreateRoom = () => {
    const roomId = generateRoomId();
    router.push(`/canvas/${roomId}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl mb-4">Welcome to Drawing App</h1>
      <button 
        className="bg-amber-200 px-6 py-3 rounded-lg hover:bg-amber-300 transition-colors"
        onClick={handleCreateRoom}
      >
        Create New Room
      </button>
    </div>
  );
}