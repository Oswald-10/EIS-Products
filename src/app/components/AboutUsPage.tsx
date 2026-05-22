import React from 'react';

const aboutUsImages = [
  new URL('../../assets/images/aboutus/3.png', import.meta.url).href,
  new URL('../../assets/images/aboutus/4.png', import.meta.url).href,
  new URL('../../assets/images/aboutus/1.png', import.meta.url).href,
  new URL('../../assets/images/aboutus/2.png', import.meta.url).href,
  new URL('../../assets/images/aboutus/5.png', import.meta.url).href,
];

export function AboutUsPage() {
  return (
    <main className="flex-grow-1">
      <div className="container-lg py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-xl-10">
            <section className="mb-5" style={{ marginTop: '4rem' }}>
              <h1 className="h2 fw-bold text-center mb-4">About Us</h1>
              <div className="row g-4">
                <div className="col-12 col-md-6">
                  <div className="card border-0 shadow-sm overflow-hidden" style={{ minHeight: '360px' }}>
                    <img
                      src={aboutUsImages[0]}
                      className="card-img-top h-100 w-100"
                      alt="About us"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="card border-0 shadow-sm overflow-hidden" style={{ minHeight: '360px' }}>
                    <img
                      src={aboutUsImages[1]}
                      className="card-img-top h-100 w-100"
                      alt="About us"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-dark" />

            <section className="my-5">
              <h2 className="h3 fw-bold text-center mb-4">Mission &amp; Vision</h2>
              <div className="row g-4">
                <div className="col-12 col-md-6">
                  <div className="card border-0 shadow-sm overflow-hidden" style={{ minHeight: '360px' }}>
                    <img
                      src={aboutUsImages[2]}
                      className="card-img-top h-100 w-100"
                      alt="Mission and vision"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="card border-0 shadow-sm overflow-hidden" style={{ minHeight: '360px' }}>
                    <img
                      src={aboutUsImages[3]}
                      className="card-img-top h-100 w-100"
                      alt="Mission and vision"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-dark" />

            <section className="mt-5">
              <h2 className="h3 fw-bold text-center mb-4">About the Owner</h2>
              <div className="row g-4 justify-content-center">
                <div className="col-12 col-lg-10">
                  <div className="card border-0 shadow-sm overflow-hidden" style={{ minHeight: '440px' }}>
                    <img
                      src={aboutUsImages[4]}
                      className="card-img-top h-100 w-100"
                      alt="About the owner"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}