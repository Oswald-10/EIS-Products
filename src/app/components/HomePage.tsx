import React from 'react';
import { HeroCard } from './HeroCard';
import { GridCard } from './GridCard';

interface HomePageProps {
  cardImages: {
    eisBanner: string;
    caps: string;
    toteBags: string;
    businessCards: string;
    plannersNotebooks: string;
    tShirts: string;
    jackets: string;
    aprons: string;
    tumblers: string;
    pens: string;
  };
}

export function HomePage({ cardImages }: HomePageProps) {
  const navigateToHash = (hash: string) => {
    window.location.hash = hash;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  };

  return (
    <main className="hero-section flex-grow-1">
      <div className="w-100 px-3 py-3">
        <div className="parallax-card" style={{ backgroundImage: `url(${cardImages.eisBanner})` }} />
      </div>

      <div className="w-100 px-3 py-3">
        <div className="row g-3">
          <div className="col-12 col-lg-6">
            <HeroCard
              title="Custom Caps"
              subtitle="Headwear that stands out."
              image={cardImages.caps}
              bgColor="bg-white"
              imageSize="large"
              showActions={false}
              onClick={() => navigateToHash('#capsAndApparel')}
            />
          </div>
          <div className="col-12 col-lg-6">
            <HeroCard
              title="Custom Tote Bags"
              subtitle="Eco-friendly. Customizable."
              image={cardImages.toteBags}
              bgColor="bg-white"
              imageSize="small"
              showActions={false}
              onClick={() => navigateToHash('#umbrellasAndBags')}
            />
          </div>
        </div>
      </div>

      <div className="w-100 px-3 py-3">
        <div className="row g-3">
          <div className="col-12">
            <GridCard
              title="Business Cards & Fliers"
              subtitle="Professional print materials."
              image={cardImages.businessCards}
              variant="short"
              primaryActionLabel="Learn more"
              secondaryActionLabel="Order now"
              primaryActionHref="#"
              secondaryActionHref="#"
              showActions={false}
              onClick={() => navigateToHash('#digital')}
            />
          </div>
        </div>
      </div>

      <div className="w-100 px-3 py-3">
        <div className="row g-3">
          <div className="col-12 col-lg-6">
            <GridCard
              title="Custom Planners & Notebooks"
              subtitle="Organize and capture ideas."
              image={cardImages.plannersNotebooks}
              primaryActionLabel="Learn more"
              secondaryActionLabel="Order now"
              primaryActionHref="#"
              secondaryActionHref="#"
              showActions={false}
              onClick={() => navigateToHash('#notebooksAndPens')}
            />
          </div>
          <div className="col-12 col-lg-6">
            <GridCard
              title="Custom T-Shirts"
              subtitle="Comfortable. Stylish. Unique."
              image={cardImages.tShirts}
              primaryActionLabel="Learn more"
              secondaryActionLabel="Order now"
              primaryActionHref="#"
              secondaryActionHref="#"
              showActions={false}
              onClick={() => navigateToHash('#capsAndApparel')}
            />
          </div>
        </div>
      </div>

      <div className="w-100 px-3 py-3">
        <div className="row g-3">
          <div className="col-12 col-lg-6">
            <GridCard
              title="Custom Jackets"
              subtitle="Professional wear."
              image={cardImages.jackets}
              primaryActionLabel="Learn more"
              secondaryActionLabel="Order now"
              primaryActionHref="#"
              secondaryActionHref="#"
              showActions={false}
              onClick={() => navigateToHash('#capsAndApparel')}
            />
          </div>
          <div className="col-12 col-lg-6">
            <GridCard
              title="Custom Aprons"
              subtitle="For culinary professionals."
              image={cardImages.aprons}
              primaryActionLabel="Learn more"
              secondaryActionLabel="Order now"
              primaryActionHref="#"
              secondaryActionHref="#"
              showActions={false}
              onClick={() => navigateToHash('#capsAndApparel')}
            />
          </div>
        </div>
      </div>

      <div className="w-100 px-3 py-3">
        <div className="row g-3">
          <div className="col-12 col-lg-6">
            <GridCard
              title="Custom Tumblers"
              subtitle="Stay hydrated in style."
              image={cardImages.tumblers}
              primaryActionLabel="Learn more"
              secondaryActionLabel="Order now"
              primaryActionHref="#"
              secondaryActionHref="#"
              showActions={false}
              onClick={() => navigateToHash('#drinkware')}
            />
          </div>
          <div className="col-12 col-lg-6">
            <GridCard
              title="Custom Pens"
              subtitle="Write with style."
              image={cardImages.pens}
              primaryActionLabel="Learn more"
              secondaryActionLabel="Order now"
              primaryActionHref="#"
              secondaryActionHref="#"
              showActions={false}
              onClick={() => navigateToHash('#notebooksAndPens')}
            />
          </div>
        </div>
      </div>

      <footer className="bg-light border-top">
        <div className="px-3 py-3">
          <div className="small text-muted text-center">
            <p className="mb-1">Need help with your order? Contact us for custom printing solutions and bulk discounts.</p>
            <p className="mb-0">Copyright © 2026 Print Philippines. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
