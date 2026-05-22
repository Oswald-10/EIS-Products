import React, { useEffect, useState } from 'react';

export interface CategoryItem {
  title: string;
  subtitle: string;
  image: string;
  price: string;
  colors?: string[];
  colorOptions?: { name: string; hex: string; image: string }[];
  galleryImages?: string[];
}

export interface CategoryPageProps {
  title: string;
  subtitle: string;
  items: CategoryItem[];
  onBack: () => void;
  slideshowTitle?: string;
  showSlideshow?: boolean;
  secondaryTitle?: string;
  secondaryImages?: string[];
  sampleImages?: string[];
  initialSelectedItemTitle?: string;
}

export function CategoryPage({
  title,
  subtitle,
  items,
  onBack,
  slideshowTitle = 'Sample Finished Products',
  showSlideshow = true,
  secondaryTitle,
  secondaryImages,
  sampleImages,
  initialSelectedItemTitle,
}: CategoryPageProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [secondaryCurrentSlide, setSecondaryCurrentSlide] = useState(0);
  const [selectedItem, setSelectedItem] = useState<CategoryItem | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!initialSelectedItemTitle) {
      return;
    }

    const match = items.find((item) => item.title === initialSelectedItemTitle);
    if (match) {
      setSelectedItem(match);
      setSelectedColor(match.colorOptions?.[0]?.name ?? match.colors?.[0] ?? '');
      setGalleryIndex(0);
    }
  }, [initialSelectedItemTitle, items]);

  const images = sampleImages?.filter((src) => typeof src === 'string') ?? items.map((item) => item.image).filter((src) => typeof src === 'string');
  const secondarySlides = secondaryImages?.filter((src) => typeof src === 'string') ?? [];

  const handleSelectItem = (item: CategoryItem) => {
    setSelectedItem(item);
    setSelectedColor(item.colorOptions?.[0]?.name ?? item.colors?.[0] ?? '');
    setGalleryIndex(0);
  };

  const handleSelectColor = (color: string) => {
    setSelectedColor(color);
  };

  const handleOpenEnlargedImage = (image: string) => {
    setEnlargedImage(image);
  };

  const handleCloseEnlargedImage = () => {
    setEnlargedImage(null);
  };

  const getColorOptions = (item: CategoryItem) => {
    if (item.colorOptions) return item.colorOptions;
    return item.colors?.map((color) => ({ name: color, hex: color, image: item.image })) ?? [];
  };

  const getItemGalleryImages = (item: CategoryItem) => (item.galleryImages && item.galleryImages.length > 0 ? item.galleryImages : [item.image]);
  const selectedGalleryImages = selectedItem ? getItemGalleryImages(selectedItem) : [];
  const showGalleryControls = selectedItem ? selectedGalleryImages.length > 1 && !selectedItem.colorOptions?.length : false;
  const previewImage = selectedItem
    ? selectedItem.colorOptions?.find((option) => option.name === selectedColor)?.image ?? selectedGalleryImages[galleryIndex] ?? selectedItem.image
    : '';

  const handlePrevGallery = () => {
    if (!selectedItem) return;
    setGalleryIndex((prev) => (prev === 0 ? selectedGalleryImages.length - 1 : prev - 1));
  };

  const handleNextGallery = () => {
    if (!selectedItem) return;
    setGalleryIndex((prev) => (prev === selectedGalleryImages.length - 1 ? 0 : prev + 1));
  };

  const handleClosePreview = () => {
    setSelectedItem(null);
    setSelectedColor('');
    setGalleryIndex(0);
  };

  return (
    <main className="caps-page d-flex flex-column min-vh-100">
      <div className="container-lg py-4">
        <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
          <div>
            <p className="text-muted mb-1">{title} collection</p>
            <h1 className="display-5 fw-bold">{title}</h1>
            <p className="text-muted mb-0">{subtitle}</p>
          </div>
          <button className="btn btn-outline-secondary" onClick={onBack}>
            Back to Homepage
          </button>
        </div>
      </div>

      <div className="caps-gallery container-lg flex-grow-1 py-4">
        {selectedItem && (
          <div className="caps-modal-overlay" onClick={handleClosePreview}>
            <div className="caps-modal card border-0 shadow-sm" onClick={(event) => event.stopPropagation()}>
              <button type="button" className="caps-modal-close" onClick={handleClosePreview} aria-label="Close preview">
                ×
              </button>
              <div className="caps-modal-body row gx-0 gy-4 align-items-center">
                <div className="col-12 col-lg-7">
                  <div className="caps-modal-image-card position-relative">
                    <img
                      src={previewImage}
                      alt={`${selectedItem.title} preview`}
                      className="caps-modal-image"
                    />
                    <div className="caps-modal-image-overlay" style={{ backgroundColor: 'transparent' }} />
                    {showGalleryControls && (
                      <>
                        <button
                          type="button"
                          className="caps-slide-control prev"
                          onClick={handlePrevGallery}
                          aria-label="Previous gallery image"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          className="caps-slide-control next"
                          onClick={handleNextGallery}
                          aria-label="Next gallery image"
                        >
                          ›
                        </button>
                        <div
                          className="position-absolute bottom-0 start-50 translate-middle-x text-white px-2 py-1"
                          style={{ background: 'rgba(0, 0, 0, 0.5)', borderRadius: '12px' }}
                        >
                          {galleryIndex + 1} / {selectedGalleryImages.length}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="col-12 col-lg-5">
                  <div className="caps-modal-controls p-2 p-md-4">
                    {getColorOptions(selectedItem).length > 0 && (
                      <div className="caps-modal-section mb-4">
                        <p className="text-uppercase text-muted small mb-2">Colors:</p>
                        <div className="caps-preview-colors">
                          {getColorOptions(selectedItem).map((option) => (
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
                    )}
                    <div className="caps-modal-summary">
                      <h2 className="h4 fw-bold mb-3">{selectedItem.title}</h2>
                      <p className="text-muted mb-0">{selectedItem.subtitle}</p>
                      <p className="fw-bold mt-3 mb-0 fs-5">{selectedItem.price}</p>
                      {selectedColor && <p className="text-muted mt-3">Selected color: <span>{selectedColor}</span></p>}
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
              className={`caps-card card border-0 shadow-sm ${selectedItem?.title === item.title ? 'selected' : ''}`}
              key={item.title}
              role="button"
              tabIndex={0}
              onClick={() => handleSelectItem(item)}
              onKeyPress={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  handleSelectItem(item);
                }
              }}
            >
              <img src={item.image} alt={item.title} className="card-img-top" />
              <div className="card-body text-center d-flex flex-column justify-content-between">
                <div>
                  <h2 className="h5 fw-bold mb-2">{item.title}</h2>
                  <p className="text-muted mb-3">{item.subtitle}</p>
                  <p className="fw-bold mb-3 fs-6">{item.price}</p>
                </div>
                {getColorOptions(item).length > 0 ? (
                  <div className="caps-colors d-flex justify-content-center align-items-center gap-2 mb-0">
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
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showSlideshow && (
        <div className="container-lg py-4">
          <h2 className="text-center mb-2">{slideshowTitle}</h2>
          <div className="position-relative mx-auto" style={{ maxWidth: '900px' }}>
            <div className="position-relative" style={{ height: '500px', backgroundColor: '#f0f0f0', borderRadius: '12px', overflow: 'hidden' }}>
              {images.length > 0 && (
                <img
                  src={images[currentSlide]}
                  alt={`Finished product ${currentSlide + 1}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleOpenEnlargedImage(images[currentSlide])}
                  onKeyPress={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      handleOpenEnlargedImage(images[currentSlide]);
                    }
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'opacity 0.5s ease-in-out',
                    cursor: 'pointer',
                  }}
                  title="Click to enlarge"
                />
              )}
            </div>

            <button
              onClick={() => setCurrentSlide((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
              className="caps-carousel-button caps-carousel-prev"
              aria-label="Previous slide"
            >
              ‹
            </button>

            <button
              onClick={() => setCurrentSlide((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
              className="caps-carousel-button caps-carousel-next"
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
                    padding: 0,
                  }}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {secondarySlides.length > 0 && (
        <div className="container-lg py-4">
          <h2 className="text-center mb-2">{secondaryTitle}</h2>
          <div className="position-relative mx-auto" style={{ maxWidth: '900px' }}>
            <div className="position-relative" style={{ height: '500px', backgroundColor: '#f0f0f0', borderRadius: '12px', overflow: 'hidden' }}>
              <img
                src={secondarySlides[secondaryCurrentSlide]}
                alt={`Finished product ${secondaryCurrentSlide + 1}`}
                role="button"
                tabIndex={0}
                onClick={() => handleOpenEnlargedImage(secondarySlides[secondaryCurrentSlide])}
                onKeyPress={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    handleOpenEnlargedImage(secondarySlides[secondaryCurrentSlide]);
                  }
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'opacity 0.5s ease-in-out',
                  cursor: 'pointer',
                }}
                title="Click to enlarge"
              />
            </div>

            <button
              onClick={() => setSecondaryCurrentSlide((prev) => (prev === 0 ? secondarySlides.length - 1 : prev - 1))}
              className="caps-carousel-button caps-carousel-prev"
              aria-label="Previous slide"
            >
              ‹
            </button>

            <button
              onClick={() => setSecondaryCurrentSlide((prev) => (prev === secondarySlides.length - 1 ? 0 : prev + 1))}
              className="caps-carousel-button caps-carousel-next"
              aria-label="Next slide"
            >
              ›
            </button>

            <div className="d-flex justify-content-center gap-2 mt-4">
              {secondarySlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSecondaryCurrentSlide(index)}
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: index === secondaryCurrentSlide ? '#333' : '#ccc',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s',
                    padding: 0,
                  }}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {enlargedImage && (
        <div
          className="position-fixed top-0 start-0 vw-100 vh-100 d-flex align-items-center justify-content-center p-3"
          style={{ zIndex: 2000, backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
          onClick={handleCloseEnlargedImage}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="position-relative"
            style={{ maxWidth: '95%', maxHeight: '95%' }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="btn btn-light position-absolute top-0 end-0 m-2"
              onClick={handleCloseEnlargedImage}
              aria-label="Close enlarged image"
              style={{ zIndex: 1 }}
            >
              ×
            </button>
            <img
              src={enlargedImage}
              alt="Enlarged finished product"
              style={{ width: '100%', height: 'auto', maxHeight: '90vh', objectFit: 'contain', borderRadius: '12px' }}
            />
          </div>
        </div>
      )}
    </main>
  );
}
