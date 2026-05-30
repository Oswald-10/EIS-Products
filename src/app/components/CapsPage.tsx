import React, { useState } from 'react';

interface CapColorOption {
  name: string;
  hex: string;
  image: string;
}

interface CapItem {
  title: string;
  subtitle: string;
  image: string;
  colors?: string[];
  colorOptions?: CapColorOption[];
  price: string;
}

interface CapsPageProps {
  items: CapItem[];
  onBack: () => void;
}

export function CapsPage({ items, onBack }: CapsPageProps) {
  const [selectedCap, setSelectedCap] = useState<CapItem | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [currentSlide, setCurrentSlide] = useState(0);

  const images = Object.entries(import.meta.glob('/src/assets/images/capsAndApparel/caps/sample/*.{png,jpg,jpeg}', { eager: true }) as Record<string, { default: string }>)
    .map(([_, module]) => (module as any).default)
    .filter(img => typeof img === 'string');

  const handleSelectCap = (item: CapItem) => {
    setSelectedCap(item);
    setSelectedColor(item.colorOptions?.[0]?.name ?? item.colors?.[0] ?? '');
  };

  const handleSelectColor = (color: string) => {
    setSelectedColor(color);
  };

  const getColorOptions = (item: CapItem) => {
    if (item.colorOptions) return item.colorOptions;
    return item.colors?.map((color) => ({ name: color, hex: color, image: item.image })) ?? [];
  };

  const previewImage = selectedCap
    ? selectedCap.colorOptions?.find((option) => option.name === selectedColor)?.image ?? selectedCap.image
    : '';

  const handleClosePreview = () => {
    setSelectedCap(null);
    setSelectedColor('');
  };

  return (
    <main className="caps-page d-flex flex-column min-vh-100">
      <div className="container-lg py-4">
        <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
          <div>
            <p className="text-muted mb-1">Caps collection</p>
            <h1 className="display-5 fw-bold">Check Custom Caps</h1>
            <p className="text-muted mb-0">Browse our cap styles and see all available colors and pricing.</p>
          </div>
          <button className="btn btn-outline-secondary" onClick={onBack}>
            Back to Homepage
          </button>
        </div>
      </div>

      <div className="caps-gallery container-lg flex-grow-1 py-4">
        {selectedCap && (
          <div className="caps-modal-overlay" onClick={handleClosePreview}>
            <div className="caps-modal card border-0 shadow-sm" onClick={(event) => event.stopPropagation()}>
              <button type="button" className="caps-modal-close" onClick={handleClosePreview} aria-label="Close preview">
                ×
              </button>
              <div className="caps-modal-body row gx-0 gy-4 align-items-center">
                <div className="col-12 col-lg-7">
                  <div className="caps-modal-image-card">
                    <img
                      src={previewImage}
                      alt={`${selectedCap.title} preview`}
                      className="caps-modal-image"
                    />
                    <div className="caps-modal-image-overlay" style={{ backgroundColor: 'transparent' }} />
                  </div>
                </div>
                <div className="col-12 col-lg-5">
                  <div className="caps-modal-controls p-4">
                    <div className="caps-modal-section mb-4">
                        <p className="text-uppercase text-muted small mb-2">Colors:</p>
                        <div className="caps-preview-colors">
                        {getColorOptions(selectedCap).map((option) => (
                          <button
                            key={option.name}
                            type="button"
                            aria-label={`Select ${option.name}`}
                            className={`caps-preview-color-dot ${selectedColor === option.name ? 'active' : ''}`}
                            style={{ backgroundColor: option.hex }}
                            onClick={() => handleSelectColor(option.name)}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="caps-modal-summary">
                      <h2 className="h4 fw-bold mb-3">{selectedCap.title}</h2>
                      <p className="text-muted mb-3">{selectedCap.subtitle}</p>
                      <p className="text-muted mb-0">Selected color: <span>{selectedColor}</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="caps-grid">
          {items.map((item) => (
            <div
              className={`caps-card card border-0 shadow-sm ${selectedCap?.title === item.title ? 'selected' : ''}`}
              key={item.title}
              role="button"
              tabIndex={0}
              onClick={() => handleSelectCap(item)}
              onKeyPress={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  handleSelectCap(item);
                }
              }}
            >
              <img src={item.image} alt={item.title} className="card-img-top" />
              <div className="card-body text-center">
                <h2 className="h5 fw-bold mb-2">{item.title}</h2>
                <div className="caps-colors d-flex justify-content-center align-items-center gap-2 mb-2">
                  <span className="text-muted small">Available colors</span>
                  <div className="d-flex gap-1">
                    {getColorOptions(item).map((option) => (
                      <span
                        key={option.name}
                        className="caps-color-dot"
                        title={option.name}
                        style={{ backgroundColor: option.hex }}
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
        <h2 className="text-center mb-2">Sample Finished Products</h2>
        <div className="position-relative mx-auto" style={{ maxWidth: '900px' }}>
          {/* Main Image Display */}
          <div className="position-relative" style={{ height: '500px', backgroundColor: '#f0f0f0', borderRadius: '12px', overflow: 'hidden' }}>
            {images.length > 0 && (
              <img
                src={images[currentSlide]}
                alt={`Finished product ${currentSlide + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'opacity 0.5s ease-in-out'
                }}
              />
            )}
          </div>

          {/* Navigation Arrows */}
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

          {/* Dot Indicators */}
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
