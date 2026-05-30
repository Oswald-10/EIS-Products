import React from 'react';

interface InfoPageProps {
  image: string;
}

export function InfoPage({ image }: InfoPageProps) {
  return (
    <main className="flex-grow-1 d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', paddingTop: '70px', backgroundColor: '#ffffff' }}>
      <img
        src={image}
        alt="Info EIS"
        style={{
          width: '100%',
          maxWidth: '1600px',
          maxHeight: 'calc(100vh - 70px)',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </main>
  );
}
