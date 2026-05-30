import React, { useState } from 'react';

interface ToteBagItem {
  title: string;
  subtitle: string;
  image: string;
  colors: string[];
  price: string;
}

interface ToteBagsPageProps {
  items: ToteBagItem[];
  onBack: () => void;
}

export function ToteBagsPage({ items, onBack }: ToteBagsPageProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const images = Object.entries(import.meta.glob('/src/assets/images/umbrellasAndBags/totebag/*.{png,jpg,jpeg}', { eager: true }) as Record<string, { default: string }>)
    .map(([_, module]) => (module as any).default)
    .filter((img) => typeof img === 'string');

  return (
    <main className="tote-bags-page d-flex flex-column min-vh-100">
      <div className="container-lg py-4">
        <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
          <div>
            <p className="text-muted mb-1">Tote bags collection</p>
            <h1 className="display-5 fw-bold">Shop Custom Tote Bags</h1>
            <p className="text-muted mb-0">Browse our tote bag styles and see all available colors and pricing.</p>
          </div>
          <button className="btn btn-outline-secondary" onClick={onBack}>
            Back to Homepage
          </button>
        </div>
      </div>

      <div className="tote-bags-gallery container-lg flex-grow-1 py-4">
        <div className="tote-bags-grid">
          {items.map((item) => (
            <div className="tote-bags-card card border-0 shadow-sm" key={item.title}>
              <img src={item.image} alt={item.title} className="card-img-top" />
              <div className="card-body text-center">
                <h2 className="h5 fw-bold mb-2">{item.title}</h2>
                <div className="tote-bags-colors d-flex justify-content-center align-items-center gap-2 mb-2">
                  <span className="text-muted small">Available colors</span>
                  <div className="d-flex gap-1">
                    {item.colors.map((color) => (
                      <span
                        key={color}
                        className="tote-bags-color-dot"
                        title={color}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container-lg py-4">
        <h2 className="text-center mb-2">Sample Finished Tote Bags</h2>
        <div className="position-relative mx-auto" style={{ maxWidth: '900px' }}>
          <div className="position-relative" style={{ height: '500px', backgroundColor: '#f0f0f0', borderRadius: '12px', overflow: 'hidden' }}>
            {images.length > 0 && (
              <img
                src={images[currentSlide]}
                alt={`Finished tote bag ${currentSlide + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'opacity 0.5s ease-in-out'
                }}
              />
            )}
          </div>

          <button
            onClick={() => setCurrentSlide((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
            style={{
              position: 'absolute',
              left: '-60px',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: 'none',
              color: 'white',
              padding: '12px 16px',
              fontSize: '24px',
              cursor: 'pointer',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.3s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.3)')}
            aria-label="Previous slide"
          >
            ‹
          </button>

          <button
            onClick={() => setCurrentSlide((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
            style={{
              position: 'absolute',
              right: '-60px',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: 'none',
              color: 'white',
              padding: '12px 16px',
              fontSize: '24px',
              cursor: 'pointer',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.3s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.3)')}
            aria-label="Next slide"
          >
            ›
          </button>

          <div className="d-flex justify-content-center gap-2 mt-4">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: index === currentSlide ? '#333' : '#ccc',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s',
                  padding: 0
                }}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}