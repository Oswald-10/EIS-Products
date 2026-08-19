import React, { useEffect, useState } from 'react';
import { Navigation } from './components/Navigation';
import { HeroCard } from './components/HeroCard';
import { GridCard } from './components/GridCard';
import { HomePage } from './components/HomePage';
import { DrinkwarePage } from './components/DrinkwarePage';
import { KitchenwarePage } from './components/KitchenwarePage';
import { UmbrellasAndBagsPage } from './components/UmbrellasAndBagsPage';
import { CapsAndApparelPage } from './components/CapsAndApparelPage';
import { NotebooksAndPensPage } from './components/NotebooksAndPensPage';
import { AccessoriesPage } from './components/AccessoriesPage';
import { DigitalAndLargeFormatPage } from './components/DigitalAndLargeFormatPage';
import { SetsAndBundlesPage } from './components/SetsAndBundlesPage';
import { InfoPage } from './components/InfoPage';
import { AboutUsPage } from './components/AboutUsPage';
import { CategoryPage } from './components/CategoryPage';
import { AdminPanel } from '../components/AdminPanel';
import { buildPublicCategoryList, readCatalogData, writeCatalogData, ensureCanonicalCategories, getProductsForCategory, getCategoryBySlug, type CatalogData } from '../lib/cms';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const imageModules = import.meta.glob('/src/assets/images/**/*.{png,jpg,jpeg,webp}', { eager: true }) as Record<string, { default: string }>;
const localImages = Object.fromEntries(
  Object.entries(imageModules).map(([path, module]) => {
    const key = path
      .replace(/^\/src\/assets\/images\//, '')
      .replace(/\.(png|jpe?g|webp)$/, '');
    return [key, module.default];
  }),
) as Record<string, string>;

const cardImages = {
  eisBanner: localImages['eisshop'] ?? 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1080&q=80',
  caps: localImages['capsAndApparel/caps/caps'] ?? localImages['capsAndApparel/caps'] ?? 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1080&q=80',
  toteBags: localImages['umbrellasAndBags/totebag/toteBags'] ?? localImages['umbrellasAndBags/totebag/toteBags'] ?? 'https://images.unsplash.com/photo-1523299337142-7e2b1f8d3098?auto=format&fit=crop&w=1080&q=80',
  businessCards: localImages['bundle/businesscard/businesscard'] ?? 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1080&q=80',
  plannersNotebooks: localImages['notebooksAndPens/planner/plannersNotebooks'] ?? 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=1080&q=80',
  tShirts: localImages['capsAndApparel/shirt/tShirts'] ?? 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1080&q=80',
  jackets: localImages['capsAndApparel/jacket/jackets'] ?? 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=1080&q=80',
  aprons: localImages['capsAndApparel/apron/aprons'] ?? 'https://images.unsplash.com/photo-1545235613-7c2f2b0fe8ca?auto=format&fit=crop&w=1080&q=80',
  tumblers: localImages['drinkware/tumbler/tumblers'] ?? 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1080&q=80',
  pens: localImages['notebooksAndPens/pen/pens'] ?? 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1080&q=80',
  kitchenware: localImages['kitchenware/Wooden Lunchbox'] ?? 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1080&q=80',
  accessories: localImages['accessories/Wooden Mirror'] ?? 'https://images.unsplash.com/photo-1523266542201-5f22b135f879?auto=format&fit=crop&w=1080&q=80',
};

const imageFor = (path: string, fallback: string) => localImages[path] ?? fallback;

const colorFromFilename = (rawName: string) => {
  const candidate = rawName.split(' ').pop()?.toLowerCase() ?? '';
  const validColors = new Set([
    'black',
    'white',
    'blue',
    'red',
    'gray',
    'grey',
    'green',
    'maroon',
    'pink',
    'yellow',
    'orange',
    'violet',
    'navy',
    'brown',
    'cream',
    'beige',
    'tan',
  ]);
  return validColors.has(candidate) ? candidate : '#888';
};

const getColorOptionsFromFolder = (folderPath: string) => {
  return Object.keys(localImages)
    .filter((key) => key.startsWith(`${folderPath}/`))
    .sort()
    .map((key) => {
      const fileName = key.slice(folderPath.length + 1);
      const rawName = fileName.replace(/\.(png|jpe?g|webp)$/i, '').replace(/_/g, ' ');
      // Normalize names like 'gcap navy blue' -> 'navy blue' and remove leading 'half' used in some filenames
      const cleaned = rawName.replace(/^gcap[\s-_]?/i, '').replace(/^half[\s-_]+/i, '').replace(/\bhalf\b/ig, '').trim();
      const displayName = cleaned
        .split(/\s+/)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ');
      return {
        name: displayName,
        hex: colorFromFilename(cleaned),
        image: localImages[key],
      };
    });
};

const firstImageInFolder = (folderPath: string, fallback: string) => {
  const images = Object.keys(localImages)
    .filter((key) => key.startsWith(`${folderPath}/`))
    .sort()
    .map((key) => localImages[key]);
  return images[0] ?? fallback;
};

const imageKeyByUrl = new Map(Object.entries(localImages).map(([key, value]) => [value, key]));

const getRouteFromLocation = () => {
  if (typeof window === 'undefined') {
    return 'home';
  }

  const pathname = window.location.pathname;
  const hash = window.location.hash;

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return 'admin';
  }

  if (hash) {
    return hash.replace(/^#/, '') || 'home';
  }

  if (pathname && pathname !== '/') {
    return pathname.replace(/^\//, '').replace(/\//g, '-');
  }

  return 'home';
};

const getGalleryImagesFromImageUrl = (imageUrl: string) => {
  const imageKey = imageKeyByUrl.get(imageUrl);
  if (!imageKey) {
    return [imageUrl];
  }

  const lastSlash = imageKey.lastIndexOf('/');
  const folderPath = lastSlash === -1 ? '' : imageKey.slice(0, lastSlash);
  if (!folderPath) {
    return [imageUrl];
  }

  const galleryImages = Object.keys(localImages)
    .filter((key) => key.startsWith(`${folderPath}/`))
    .sort()
    .map((key) => localImages[key]);

  return galleryImages.length > 0 ? galleryImages : [imageUrl];
};

type SearchEntry = {
  title: string;
  page: string;
  pageLabel: string;
  item: {
    title: string;
    subtitle: string;
    image: string;
    price: string;
    colors?: string[];
    colorOptions?: { name: string; hex: string; image: string }[];
  };
};

const categories = {
  drinkware: [
    {
      title: '150ML Pocket Thermos',
      subtitle: 'Compact thermos for on-the-go.',
      image: firstImageInFolder('drinkware/150mL Pocket Thermos', cardImages.tumblers),
      price: 'PHP 300',
    },
    {
      title: '250ML Pocket Thermos',
      subtitle: 'Portable thermos for daily use.',
      image: firstImageInFolder('drinkware/250mL Pocket Thermos', cardImages.tumblers),
      price: 'PHP 325',
    },
    {
      title: '350ML Stainless Mug',
      subtitle: 'Durable stainless steel mug.',
      image: firstImageInFolder('drinkware/350mL Stainless Mug', cardImages.tumblers),
      price: 'PHP 400',
    },
    {
      title: '350ML Egg Mug',
      subtitle: 'Egg-shaped mug with custom printing.',
      image: firstImageInFolder('drinkware/350mL Egg Mug', cardImages.tumblers),
      price: 'PHP 400',
    },
    {
      title: '500ML Tyeso w/ Flat Top',
      subtitle: 'Thermos with flat top lid.',
      image: firstImageInFolder('drinkware/500mL Tyeso w Flat Top', cardImages.tumblers),
      price: 'PHP 450',
    },
    {
      title: '530ML Tyeso w/ Lock',
      subtitle: 'Secure thermos with locking lid.',
      image: firstImageInFolder('drinkware/530mL Tyeso w Lock', cardImages.tumblers),
      price: 'PHP 400',
    },
    {
      title: '750ML Tyeso w/ Lock',
      subtitle: 'Large thermos with secure lock.',
      image: firstImageInFolder('drinkware/750mL Tyeso w Lock', cardImages.tumblers),
      price: 'PHP 500',
    },
    {
      title: '750ML Tyeso w/ Nozzle',
      subtitle: 'Thermos with convenient nozzle.',
      image: firstImageInFolder('drinkware/750mL Tyeso w Nozzle', cardImages.tumblers),
      price: 'PHP 450',
    },
    {
      title: '750ML Tyeso Bowling',
      subtitle: 'Fun bowling-themed thermos.',
      image: firstImageInFolder('drinkware/750mL Tyeso Bowling', cardImages.tumblers),
      price: 'PHP 555',
    },
    {
      title: '600ML STR w/ Handle',
      subtitle: 'Straight tumbler with handle.',
      image: firstImageInFolder('drinkware/600mL STR w Handle', cardImages.tumblers),
      price: 'PHP 450',
    },
    {
      title: '900ML STR w/ Handle',
      subtitle: 'Large straight tumbler with handle.',
      image: firstImageInFolder('drinkware/900mL STR w Handle', cardImages.tumblers),
      price: 'PHP 500',
    },
    {
      title: '1200ML STR Tumbler',
      subtitle: 'Extra large straight tumbler.',
      image: firstImageInFolder('drinkware/1200mL STR Tumbler', cardImages.tumblers),
      price: 'PHP 555',
    },
    {
      title: '600ML Frosted Tumbler',
      subtitle: 'Frosted tumbler for cool drinks.',
      image: firstImageInFolder('drinkware/600mL Frosted Plastic Tumbler', cardImages.tumblers),
      price: 'PHP 150',
    },
    {
      title: '8oz Hip Flask',
      subtitle: 'Compact hip flask.',
      image: firstImageInFolder('drinkware/8oz Hip Flask', cardImages.tumblers),
      price: 'PHP 200',
    },
    {
      title: 'Hip Flask Set',
      subtitle: 'Hip flask set with accessories.',
      image: firstImageInFolder('drinkware/8oz Hip Flask Set', cardImages.tumblers),
      price: 'PHP 375 | PHP 400',
    },
    {
      title: 'Beer Mug',
      subtitle: 'Classic beer mug.',
      image: firstImageInFolder('drinkware/Beer Mug', cardImages.tumblers),
      price: 'PHP 450',
    },
    {
      title: 'Wooden Tumbler',
      subtitle: 'Wooden finish tumbler.',
      image: firstImageInFolder('drinkware/Wooden Tumbler', cardImages.tumblers),
      price: 'PHP 500 | PHP 450',
    },
    {
      title: '350ML Wooden Mug',
      subtitle: 'Natural wooden mug.',
      image: firstImageInFolder('drinkware/350mL Wooden Mug', cardImages.tumblers),
      price: 'PHP 350',
    },
  ],
  kitchenware: [
    {
      title: 'Wooden Lunch Box',
      subtitle: 'Wooden lunch box with secure lid.',
      image: firstImageInFolder('kitchenware/Wooden Lunchbox', cardImages.kitchenware),
      price: 'PHP 350 | PHP 400 | PHP 450',
    },
    {
      title: '5Pcs Coaster Set',
      subtitle: 'Set of five stylish coasters.',
      image: firstImageInFolder('kitchenware/5-Piece Coaster Set', cardImages.kitchenware),
      price: 'PHP 550',
    },
    {
      title: 'Cheese Board Set',
      subtitle: 'Cheese board set with serving tools.',
      image: firstImageInFolder('kitchenware/Cheese Board Set', cardImages.kitchenware),
      price: 'PHP 400',
    },
    {
      title: 'Cutlery Set w/ Case',
      subtitle: 'Portable cutlery set with protective case.',
      image: firstImageInFolder('kitchenware/Cutlery Set w Case', cardImages.kitchenware),
      price: 'PHP 175',
    },
    {
      title: 'Cutlery Set w/ Pouch',
      subtitle: 'Cutlery set with pouch.',
      image: firstImageInFolder('kitchenware/Cutlery Set w Canvas Pouch', cardImages.kitchenware),
      price: 'PHP 150',
    },
    {
      title: 'Wooden Utensils',
      subtitle: 'Wooden utensils for everyday kitchen use.',
      image: firstImageInFolder('kitchenware/Wooden Utensils with Canvas Pouch', cardImages.kitchenware),
      price: 'PHP 225',
    },
    {
      title: 'Cheese Knives Set',
      subtitle: 'Cheese knives set for entertaining.',
      image: firstImageInFolder('kitchenware/Cheese Knives Set w Box', cardImages.kitchenware),
      price: 'PHP 400',
    },
    {
      title: 'Bottle Opener',
      subtitle: 'Bottle opener for beverages.',
      image: firstImageInFolder('kitchenware/Keychain Bottle Opener', cardImages.kitchenware),
      price: 'PHP 60 | PHP 80',
    },
    {
      title: 'Wooden Bottle Opener',
      subtitle: 'Premium wooden bottle opener.',
      image: firstImageInFolder('kitchenware/Wooden Bottle Opener', cardImages.kitchenware),
      price: 'PHP 80 | PHP 120',
    },
    {
      title: 'Vacuum Flask Set',
      subtitle: 'Insulated flask set for hot and cold drinks.',
      image: imageFor('kitchenware/10 - Vacuum Flask Set', cardImages.kitchenware),
      price: 'PHP 450',
    },
  ],
  umbrellas: [
    {
      title: 'Two Fold Umbrella',
      subtitle: 'Compact two-fold umbrella for easy storage.',
      image: firstImageInFolder('umbrellasAndBags/Two Fold Umbrella', cardImages.toteBags),
      price: 'PHP 300',
    },
    {
      title: 'Golf Umbrella',
      subtitle: 'Large golf umbrella for outdoor use.',
      image: firstImageInFolder('umbrellasAndBags/Golf Umbrella', cardImages.toteBags),
      price: 'PHP 350',
    },
    {
      title: 'Foldable Umbrella',
      subtitle: 'Compact foldable umbrella.',
      image: firstImageInFolder('umbrellasAndBags/Foldable Umbrella', cardImages.toteBags),
      price: 'PHP 250',
    },
  ],
  toteBags: [
    {
      title: 'Drawstring Bag',
      subtitle: 'Lightweight drawstring bag.',
      image: firstImageInFolder('umbrellasAndBags/Drawstring Bag', cardImages.toteBags),
      price: 'PHP 180',
    },
    {
      title: 'Duffle Bag',
      subtitle: 'Spacious duffle bag for travel.',
      image: firstImageInFolder('umbrellasAndBags/Duffle Bag', cardImages.toteBags),
      price: 'PHP 600',
    },
    {
      title: 'Solid Tote Bag',
      subtitle: 'Sturdy solid tote bag.',
      image: firstImageInFolder('umbrellasAndBags/solid totebag', cardImages.toteBags),
      price: 'PHP 350',
      colorOptions: [
        { name: 'Olive Green', hex: '#808000', image: localImages['umbrellasAndBags/solid totebag/18'] },
        { name: 'Lavender', hex: '#E6E6FA', image: localImages['umbrellasAndBags/solid totebag/19'] },
        { name: 'Dark Gray', hex: '#4A4A4A', image: localImages['umbrellasAndBags/solid totebag/20'] },
        { name: 'Burgundy', hex: '#800020', image: localImages['umbrellasAndBags/solid totebag/21'] },
        { name: 'Navy Blue', hex: '#000080', image: localImages['umbrellasAndBags/solid totebag/22'] },
        { name: 'Light Gray', hex: '#D3D3D3', image: localImages['umbrellasAndBags/solid totebag/23'] },
        { name: 'Lime Green', hex: '#32CD32', image: localImages['umbrellasAndBags/solid totebag/24'] },
        { name: 'Army Green', hex: '#4B5320', image: localImages['umbrellasAndBags/solid totebag/25'] },
        { name: 'Beige', hex: '#F5F5DC', image: localImages['umbrellasAndBags/solid totebag/26'] },
        { name: 'Rust', hex: '#B7410E', image: localImages['umbrellasAndBags/solid totebag/27'] },
        { name: 'Dark Brown', hex: '#654321', image: localImages['umbrellasAndBags/solid totebag/28'] },
        { name: 'Mustard Yellow', hex: '#FFDB58', image: localImages['umbrellasAndBags/solid totebag/29'] },
        { name: 'Camel', hex: '#C19A6B', image: localImages['umbrellasAndBags/solid totebag/30'] },
        { name: 'Taupe', hex: '#483C32', image: localImages['umbrellasAndBags/solid totebag/31'] },
        { name: 'Red', hex: '#FF0000', image: localImages['umbrellasAndBags/solid totebag/32'] },
        { name: 'Fuchsia', hex: '#FF00FF', image: localImages['umbrellasAndBags/solid totebag/33'] },
        { name: 'Yellow', hex: '#FFFF00', image: localImages['umbrellasAndBags/solid totebag/34'] },
        { name: 'Light Pink', hex: '#FFB6C1', image: localImages['umbrellasAndBags/solid totebag/35'] },
        { name: 'Dusty Pink', hex: '#DCAE96', image: localImages['umbrellasAndBags/solid totebag/36'] },
        { name: 'Teal', hex: '#008080', image: localImages['umbrellasAndBags/solid totebag/37'] },
        { name: 'Mint Green', hex: '#98FF98', image: localImages['umbrellasAndBags/solid totebag/38'] },
        { name: 'Orange', hex: '#FFA500', image: localImages['umbrellasAndBags/solid totebag/39'] },
        { name: 'Purple', hex: '#800080', image: localImages['umbrellasAndBags/solid totebag/40'] },
        { name: 'Royal Blue', hex: '#4169E1', image: localImages['umbrellasAndBags/solid totebag/41'] },
        { name: 'Khaki', hex: '#F0E68C', image: localImages['umbrellasAndBags/solid totebag/42'] },
        { name: 'Kelly Green', hex: '#4CBB17', image: localImages['umbrellasAndBags/solid totebag/43'] },
        { name: 'Cyan', hex: '#00FFFF', image: localImages['umbrellasAndBags/solid totebag/44'] },
        { name: 'Sky Blue', hex: '#87CEEB', image: localImages['umbrellasAndBags/solid totebag/45'] },
      ],
    },
    {
      title: 'Combi Tote Bag',
      subtitle: 'Combination tote bag with panels.',
      image: firstImageInFolder('umbrellasAndBags/combi totebag', cardImages.toteBags),
      price: 'PHP 300',
      colorOptions: [
        { name: 'Magenta', hex: '#FF00FF', image: localImages['umbrellasAndBags/combi totebag/1'] },
        { name: 'Yellow', hex: '#FFFF00', image: localImages['umbrellasAndBags/combi totebag/2'] },
        { name: 'Orange', hex: '#FFA500', image: localImages['umbrellasAndBags/combi totebag/3'] },
        { name: 'Army Green', hex: '#4B5320', image: localImages['umbrellasAndBags/combi totebag/4'] },
        { name: 'Light Pink', hex: '#FFB6C1', image: localImages['umbrellasAndBags/combi totebag/5'] },
        { name: 'Mauve', hex: '#E0B0FF', image: localImages['umbrellasAndBags/combi totebag/6'] },
        { name: 'Emerald', hex: '#50C878', image: localImages['umbrellasAndBags/combi totebag/7'] },
        { name: 'Red', hex: '#FF0000', image: localImages['umbrellasAndBags/combi totebag/8'] },
        { name: 'Blue', hex: '#0000FF', image: localImages['umbrellasAndBags/combi totebag/9'] },
        { name: 'Sky Blue', hex: '#87CEEB', image: localImages['umbrellasAndBags/combi totebag/10'] },
        { name: 'Royal Blue', hex: '#4169E1', image: localImages['umbrellasAndBags/combi totebag/11'] },
        { name: 'Lavender', hex: '#E6E6FA', image: localImages['umbrellasAndBags/combi totebag/12'] },
        { name: 'Teal', hex: '#008080', image: localImages['umbrellasAndBags/combi totebag/13'] },
        { name: 'Cyan', hex: '#00FFFF', image: localImages['umbrellasAndBags/combi totebag/14'] },
        { name: 'Terracotta', hex: '#E2725B', image: localImages['umbrellasAndBags/combi totebag/15'] },
        { name: 'Camel', hex: '#C19A6B', image: localImages['umbrellasAndBags/combi totebag/16'] },
        { name: 'Taupe', hex: '#483C32', image: localImages['umbrellasAndBags/combi totebag/17'] },
        { name: 'Beige', hex: '#F5F5DC', image: localImages['umbrellasAndBags/combi totebag/18'] },
        { name: 'Light Gray', hex: '#D3D3D3', image: localImages['umbrellasAndBags/combi totebag/19'] },
        { name: 'Olive', hex: '#808000', image: localImages['umbrellasAndBags/combi totebag/20'] },
        { name: 'Light Purple', hex: '#D8BFD8', image: localImages['umbrellasAndBags/combi totebag/21'] },
        { name: 'Mustard', hex: '#FFDB58', image: localImages['umbrellasAndBags/combi totebag/22'] },
        { name: 'Maroon', hex: '#800000', image: localImages['umbrellasAndBags/combi totebag/23'] },
        { name: 'Navy Blue', hex: '#000080', image: localImages['umbrellasAndBags/combi totebag/24'] },
        { name: 'Lime Green', hex: '#32CD32', image: localImages['umbrellasAndBags/combi totebag/25'] },
        { name: 'Brown', hex: '#8B4513', image: localImages['umbrellasAndBags/combi totebag/26'] },
        { name: 'Khaki', hex: '#F0E68C', image: localImages['umbrellasAndBags/combi totebag/27'] },
        { name: 'Dark Gray', hex: '#4A4A4A', image: localImages['umbrellasAndBags/combi totebag/28'] },
      ],
    },
    {
      title: '2 Tone Tote Bag',
      subtitle: 'Two-tone tote bag for bold branding.',
      image: firstImageInFolder('umbrellasAndBags/2tone totebag', cardImages.toteBags),
      price: 'PHP 380',
      colorOptions: [
        { name: 'Red', hex: '#FF0000', image: localImages['umbrellasAndBags/2tone totebag/29'] },
        { name: 'Light Pink', hex: '#FFB6C1', image: localImages['umbrellasAndBags/2tone totebag/30'] },
        { name: 'Mauve', hex: '#E0B0FF', image: localImages['umbrellasAndBags/2tone totebag/31'] },
        { name: 'Green', hex: '#008000', image: localImages['umbrellasAndBags/2tone totebag/32'] },
        { name: 'Emerald', hex: '#50C878', image: localImages['umbrellasAndBags/2tone totebag/33'] },
        { name: 'Sky Blue', hex: '#87CEEB', image: localImages['umbrellasAndBags/2tone totebag/34'] },
        { name: 'Mint Green', hex: '#98FF98', image: localImages['umbrellasAndBags/2tone totebag/35'] },
        { name: 'Army Green', hex: '#4B5320', image: localImages['umbrellasAndBags/2tone totebag/36'] },
        { name: 'Cyan', hex: '#00FFFF', image: localImages['umbrellasAndBags/2tone totebag/37'] },
        { name: 'Yellow', hex: '#FFFF00', image: localImages['umbrellasAndBags/2tone totebag/38'] },
        { name: 'Royal Blue', hex: '#4169E1', image: localImages['umbrellasAndBags/2tone totebag/39'] },
        { name: 'Lime Green', hex: '#32CD32', image: localImages['umbrellasAndBags/2tone totebag/40'] },
        { name: 'Magenta', hex: '#FF00FF', image: localImages['umbrellasAndBags/2tone totebag/41'] },
        { name: 'Orange', hex: '#FFA500', image: localImages['umbrellasAndBags/2tone totebag/42'] },
        { name: 'Olive', hex: '#808000', image: localImages['umbrellasAndBags/2tone totebag/43'] },
        { name: 'Lavender', hex: '#E6E6FA', image: localImages['umbrellasAndBags/2tone totebag/44'] },
        { name: 'Charcoal', hex: '#36454F', image: localImages['umbrellasAndBags/2tone totebag/45'] },
        { name: 'Dark Brown', hex: '#654321', image: localImages['umbrellasAndBags/2tone totebag/46'] },
        { name: 'Beige', hex: '#F5F5DC', image: localImages['umbrellasAndBags/2tone totebag/47'] },
        { name: 'Maroon', hex: '#800000', image: localImages['umbrellasAndBags/2tone totebag/48'] },
        { name: 'Navy Blue', hex: '#000080', image: localImages['umbrellasAndBags/2tone totebag/49'] },
        { name: 'Light Gray', hex: '#D3D3D3', image: localImages['umbrellasAndBags/2tone totebag/50'] },
        { name: 'Khaki Green', hex: '#BDB76B', image: localImages['umbrellasAndBags/2tone totebag/51'] },
        { name: 'Taupe', hex: '#483C32', image: localImages['umbrellasAndBags/2tone totebag/52'] },
        { name: 'Terracotta', hex: '#E2725B', image: localImages['umbrellasAndBags/2tone totebag/53'] },
        { name: 'Camel', hex: '#C19A6B', image: localImages['umbrellasAndBags/2tone totebag/54'] },
        { name: 'Indigo', hex: '#4B0082', image: localImages['umbrellasAndBags/2tone totebag/55'] },
        { name: 'Mustard Yellow', hex: '#FFDB58', image: localImages['umbrellasAndBags/2tone totebag/56'] },
      ],
    },
    {
      title: 'Leather Tote Bag',
      subtitle: 'Premium leather-style tote bag.',
      image: firstImageInFolder('umbrellasAndBags/leather totebag', cardImages.toteBags),
      price: 'PHP 650',
      colorOptions: [
        { name: 'Camel', hex: '#C19A6B', image: localImages['umbrellasAndBags/leather totebag/46'] },
        { name: 'Charcoal', hex: '#36454F', image: localImages['umbrellasAndBags/leather totebag/47'] },
        { name: 'Deep Teal', hex: '#014D4E', image: localImages['umbrellasAndBags/leather totebag/48'] },
        { name: 'Ivory', hex: '#FFFFF0', image: localImages['umbrellasAndBags/leather totebag/49'] },
        { name: 'Light Pink', hex: '#FFB6C1', image: localImages['umbrellasAndBags/leather totebag/50'] },
        { name: 'Beige', hex: '#F5F5DC', image: localImages['umbrellasAndBags/leather totebag/51'] },
        { name: 'Dusty Rose', hex: '#C08081', image: localImages['umbrellasAndBags/leather totebag/52'] },
        { name: 'Gray', hex: '#808080', image: localImages['umbrellasAndBags/leather totebag/53'] },
        { name: 'Mint Green', hex: '#98FF98', image: localImages['umbrellasAndBags/leather totebag/54'] },
        { name: 'Magenta', hex: '#FF00FF', image: localImages['umbrellasAndBags/leather totebag/55'] },
        { name: 'Terracotta', hex: '#E2725B', image: localImages['umbrellasAndBags/leather totebag/56'] },
        { name: 'Green', hex: '#008000', image: localImages['umbrellasAndBags/leather totebag/57'] },
        { name: 'Yellow', hex: '#FFD700', image: localImages['umbrellasAndBags/leather totebag/58'] },
        { name: 'Navy Blue', hex: '#000080', image: localImages['umbrellasAndBags/leather totebag/59'] },
        { name: 'Plum', hex: '#8E4585', image: localImages['umbrellasAndBags/leather totebag/60'] },
        { name: 'Sky Blue', hex: '#87CEEB', image: localImages['umbrellasAndBags/leather totebag/61'] },
      ],
    },
  ],
  caps: [
    {
      title: 'Cotton Cap',
      subtitle: 'Clean cotton cap for everyday wear.',
      image: firstImageInFolder('capsAndApparel/caps/cottoncap', cardImages.caps),
      price: 'PHP 200',
      colorOptions: getColorOptionsFromFolder('capsAndApparel/caps/cottoncap'),
    },
    {
      title: 'Acid Washed Caps',
      subtitle: 'Acid washed cap with vintage appeal.',
      image: firstImageInFolder('capsAndApparel/caps/acidwashedcap', cardImages.caps),
      price: 'PHP 225',
      colorOptions: getColorOptionsFromFolder('capsAndApparel/caps/acidwashedcap'),
    },
    {
      title: 'Corduroy Hat',
      subtitle: 'Corduroy hat with premium texture.',
      image: firstImageInFolder('capsAndApparel/caps/corduroycap', cardImages.caps),
      price: 'PHP 225',
      colorOptions: getColorOptionsFromFolder('capsAndApparel/caps/corduroycap'),
    },
    {
      title: '1 Tone Trucker Cap',
      subtitle: 'Structured 1 tone trucker cap with mesh back.',
      image: firstImageInFolder('capsAndApparel/caps/trucker1cap', cardImages.caps),
      price: 'PHP 225',
      colorOptions: getColorOptionsFromFolder('capsAndApparel/caps/trucker1cap'),
    },
    {
      title: '2 Tone Trucker Cap',
      subtitle: 'Structured 2 tone trucker cap with mesh back.',
      image: firstImageInFolder('capsAndApparel/caps/trucker2cap', cardImages.caps),
      price: 'PHP 225',
      colorOptions: getColorOptionsFromFolder('capsAndApparel/caps/trucker2cap'),
    },
    {
      title: 'Corduroy Bucket Hat',
      subtitle: 'Corduroy Bucket hat with premium texture.',
      image: firstImageInFolder('capsAndApparel/caps/corduroybh', cardImages.caps),
      price: 'PHP 225',
      colorOptions: getColorOptionsFromFolder('capsAndApparel/caps/corduroybh'),
    },
    {
      title: 'Acid Washed Bucket Hat',
      subtitle: 'Acid washed bucket hat with vintage appeal.',
      image: firstImageInFolder('capsAndApparel/caps/acidwashedbh', cardImages.caps),
      price: 'PHP 225',
      colorOptions: getColorOptionsFromFolder('capsAndApparel/caps/acidwashedbh'),
    },
    {
      title: 'Cotton Bucket Hat',
      subtitle: 'Comfortable cotton bucket hat.',
      image: firstImageInFolder('capsAndApparel/caps/cottonbh', cardImages.caps),
      price: 'PHP 225',
      colorOptions: getColorOptionsFromFolder('capsAndApparel/caps/cottonbh'),
    },
    {
      title: 'Golf Cap',
      subtitle: 'Classic golf cap for outdoor events.',
      image: firstImageInFolder('capsAndApparel/caps/golfcap', cardImages.caps),
      price: 'PHP 225',
      colorOptions: getColorOptionsFromFolder('capsAndApparel/caps/golfcap'),
    },
  ],
  shirts: [
    {
      title: 'Round Neck Shirt',
      subtitle: 'Classic round neck shirt for everyday wear.',
      image: imageFor('capsAndApparel/shirt/4', cardImages.tShirts),
      price: 'PHP 325',
    },
    {
      title: 'Round Dri-Fit Shirt',
      subtitle: 'Breathable dri-fit shirt for active use.',
      image: imageFor('capsAndApparel/shirt/tShirts', cardImages.tShirts),
      price: 'PHP 375',
    },
    {
      title: 'Honeycomb Polo Shirt',
      subtitle: 'Honeycomb polo shirt for a smart look.',
      image: imageFor('capsAndApparel/polo shirt/0', cardImages.tShirts),
      price: 'PHP 425',
      colorOptions: [
        { name: 'Teal', hex: '#008080', image: imageFor('capsAndApparel/polo shirt/1', cardImages.tShirts) },
        { name: 'Black', hex: '#000000', image: imageFor('capsAndApparel/polo shirt/2', cardImages.tShirts) },
        { name: 'Mustard Yellow', hex: '#FFDB58', image: imageFor('capsAndApparel/polo shirt/3', cardImages.tShirts) },
        { name: 'Orange', hex: '#FFA500', image: imageFor('capsAndApparel/polo shirt/4', cardImages.tShirts) },
        { name: 'White', hex: '#FFFFFF', image: imageFor('capsAndApparel/polo shirt/5', cardImages.tShirts) },
        { name: 'Royal Blue', hex: '#4169E1', image: imageFor('capsAndApparel/polo shirt/6', cardImages.tShirts) },
        { name: 'Navy Blue', hex: '#000080', image: imageFor('capsAndApparel/polo shirt/7', cardImages.tShirts) },
        { name: 'Yellow', hex: '#FFFF00', image: imageFor('capsAndApparel/polo shirt/8', cardImages.tShirts) },
        { name: 'Hot Pink', hex: '#FF69B4', image: imageFor('capsAndApparel/polo shirt/9', cardImages.tShirts) },
        { name: 'Red', hex: '#FF0000', image: imageFor('capsAndApparel/polo shirt/10', cardImages.tShirts) },
        { name: 'Turquoise', hex: '#40E0D0', image: imageFor('capsAndApparel/polo shirt/11', cardImages.tShirts) },
        { name: 'Purple', hex: '#800080', image: imageFor('capsAndApparel/polo shirt/12', cardImages.tShirts) },
        { name: 'Cream', hex: '#FFFDD0', image: imageFor('capsAndApparel/polo shirt/13', cardImages.tShirts) },
        { name: 'Maroon', hex: '#800000', image: imageFor('capsAndApparel/polo shirt/14', cardImages.tShirts) },
        { name: 'Sky Blue', hex: '#87CEEB', image: imageFor('capsAndApparel/polo shirt/15', cardImages.tShirts) },
        { name: 'Sapphire Blue', hex: '#0F52BA', image: imageFor('capsAndApparel/polo shirt/16', cardImages.tShirts) },
        { name: 'Emerald Green', hex: '#50C878', image: imageFor('capsAndApparel/polo shirt/17', cardImages.tShirts) },
      ],
    },
  ],
  aprons: [
    {
      title: 'Apron',
      subtitle: 'Durable custom apron for kitchen or catering staff.',
      image: imageFor('capsAndApparel/apron/aprons', cardImages.aprons),
      price: 'PHP 450',
    },
  ],
  hoodies: [
    {
      title: 'Hoodies',
      subtitle: 'Cozy hoodies with custom branding options.',
      image: imageFor('capsAndApparel/hoodie/hoodie', cardImages.tShirts),
      price: 'PHP 700',
    },
  ],
  jackets: [
    {
      title: 'Corporate Jacket',
      subtitle: 'Professional jacket suitable for corporate uniforms.',
      image: imageFor('capsAndApparel/jacket/Corporate Jacket', cardImages.jackets),
      price: 'PHP 900',
    },
  ],
  notebooks: [
    {
      title: 'A5 Moleskin Notebook',
      subtitle: 'Premium notebook with a stylish cover.',
      image: firstImageInFolder('notebooksAndPens/A5 Moleskin Notebook', cardImages.plannersNotebooks),
      price: 'PHP 200 | PHP 225',
    },
    {
      title: 'A5 Notebook w/ Pen',
      subtitle: 'Notebook with included pen.',
      image: firstImageInFolder('notebooksAndPens/A5 Notebook w Pen', cardImages.plannersNotebooks),
      price: 'PHP 275',
    },
    {
      title: 'Pocket Notebook',
      subtitle: 'Compact notebook for notes on the go.',
      image: firstImageInFolder('notebooksAndPens/Pocket Notebook', cardImages.plannersNotebooks),
      price: 'PHP 125',
    },
    {
      title: 'Phone Stand',
      subtitle: 'Desk phone stand for easy viewing.',
      image: firstImageInFolder('notebooksAndPens/Phone Stand', cardImages.plannersNotebooks),
      price: 'PHP 70',
    },
  ],
  pens: [
    {
      title: 'Bamboo Pen',
      subtitle: 'Eco-friendly bamboo pen.',
      image: firstImageInFolder('notebooksAndPens/Bamboo Pen', cardImages.pens),
      price: 'PHP 50',
    },
    {
      title: 'Golf Pen w/ Case',
      subtitle: 'Premium golf pen with case.',
      image: firstImageInFolder('notebooksAndPens/Golf Pen w Case', cardImages.pens),
      price: 'PHP 400',
    },
    {
      title: 'Silver Plastic Pen',
      subtitle: 'Classic silver plastic pen.',
      image: firstImageInFolder('notebooksAndPens/Silver Plastic Pen', cardImages.pens),
      price: 'PHP 35',
    },
    {
      title: 'Retractable Metal Pen',
      subtitle: 'Retractable metal pen.',
      image: firstImageInFolder('notebooksAndPens/Retractable Metal Pen', cardImages.pens),
      price: 'PHP 60',
    },
    {
      title: 'Plastic Pen w/ Stylus',
      subtitle: 'Pen with stylus for touchscreens.',
      image: firstImageInFolder('notebooksAndPens/Plastic Pen w Stylus', cardImages.pens),
      price: 'PHP 35',
    },
    {
      title: 'Gold Metal Pen',
      subtitle: 'Premium gold metal pen.',
      image: firstImageInFolder('notebooksAndPens/Gold Metal Pen', cardImages.pens),
      price: 'PHP 60',
    },
    {
      title: 'Plastic Pen w/ Sleeves',
      subtitle: 'Pen with protective sleeves.',
      image: firstImageInFolder('notebooksAndPens/Plastic Pen w Sleeves', cardImages.pens),
      price: 'PHP 50',
    },
    {
      title: 'Sign Pen w/ Case',
      subtitle: 'Signature pen with case.',
      image: firstImageInFolder('notebooksAndPens/Sign Pen w Case', cardImages.pens),
      price: 'PHP 275',
    },
    {
      title: 'Desk Pen',
      subtitle: 'Professional desk pen.',
      image: firstImageInFolder('notebooksAndPens/Desk Pen', cardImages.pens),
      price: 'PHP 80',
    },
  ],
  planners: [],
  accessories: [
    {
      title: 'Wooden Mirror',
      subtitle: 'Wooden mirror with custom engraving.',
      image: firstImageInFolder('accessories/Wooden Mirror', cardImages.accessories),
      price: 'PHP 80',
    },
    {
      title: 'Wooden Lamp',
      subtitle: 'Decorative wooden lamp.',
      image: firstImageInFolder('accessories/Wooden Lamp', cardImages.accessories),
      price: 'PHP 225',
    },
    {
      title: 'Wooden Keychain',
      subtitle: 'Wooden keychain accessory.',
      image: firstImageInFolder('accessories/Wooden Keychain', cardImages.accessories),
      price: 'PHP 80',
    },
    {
      title: 'Wooden Clock',
      subtitle: 'Wooden clock with custom engraving.',
      image: firstImageInFolder('accessories/Wooden Clock', cardImages.accessories),
      price: 'PHP 300 | PHP 375',
    },
    {
      title: 'Wooden Hairbrush',
      subtitle: 'Natural wooden hairbrush.',
      image: firstImageInFolder('accessories/Wooden Hairbrush', cardImages.accessories),
      price: 'PHP 120 | PHP 180',
    },
    {
      title: 'Wooden Comb',
      subtitle: 'Stylish wooden comb.',
      image: firstImageInFolder('accessories/Wooden Comb', cardImages.accessories),
      price: 'PHP 80',
    },
    {
      title: 'Wooden USB w/ Case',
      subtitle: 'Wooden USB drive with case.',
      image: firstImageInFolder('accessories/Wooden USB Flash drive with Case (8GB)', cardImages.accessories),
      price: 'PHP 400',
    },
    {
      title: 'USB w/ Metal Case',
      subtitle: 'Metal USB drive with case.',
      image: firstImageInFolder('accessories/USB Flash drive with Metal Case (8GB)', cardImages.accessories),
      price: 'PHP 500',
    },
    {
      title: 'Compact Mirror',
      subtitle: 'Portable compact mirror.',
      image: firstImageInFolder('accessories/Compact Mirror', cardImages.accessories),
      price: 'PHP 120',
    },
    {
      title: 'Foldable Fan',
      subtitle: 'Foldable fan for travel.',
      image: firstImageInFolder('accessories/Foldable Fans', cardImages.accessories),
      price: 'PHP 45',
    },
    {
      title: 'Mini Fan',
      subtitle: 'Compact mini fan.',
      image: firstImageInFolder('accessories/Mini Portable Fans', cardImages.accessories),
      price: 'PHP 150',
    },
    {
      title: 'Chess Board',
      subtitle: 'Chess board set for events.',
      image: firstImageInFolder('accessories/Chess Board w Wine Accessories', cardImages.accessories),
      price: 'PHP 400',
    },
    {
      title: 'Card Holder',
      subtitle: 'Card holder accessory.',
      image: firstImageInFolder('accessories/Card Holder', cardImages.accessories),
      price: 'PHP 200',
    },
    {
      title: 'Canvas Pouch',
      subtitle: 'Canvas pouch for essentials.',
      image: firstImageInFolder('accessories/8.5 x 3.5 inches Canvas Pouch', cardImages.accessories),
      price: 'PHP 120',
    },
    {
      title: 'PVC Bag Tag',
      subtitle: 'PVC bag tag for bags.',
      image: firstImageInFolder('accessories/PVC Bag Tag', cardImages.accessories),
      price: 'PHP 225',
    },
    {
      title: 'Acrylic Nameplate',
      subtitle: 'Professional acrylic nameplate.',
      image: firstImageInFolder('accessories/Acrylic Name Plate', cardImages.accessories),
      price: 'PHP 120',
    },
    {
      title: 'Acrylic Keychain',
      subtitle: 'Acrylic keychain accessory.',
      image: firstImageInFolder('accessories/Acrylic Keychain', cardImages.accessories),
      price: 'PHP 80',
    },
    {
      title: 'Lanyard',
      subtitle: 'Custom lanyard for badges.',
      image: firstImageInFolder('accessories/Lanyard', cardImages.accessories),
      price: 'PHP 80',
    },
    {
      title: 'Leather Mouse Pad',
      subtitle: 'Premium leather mouse pad.',
      image: firstImageInFolder('accessories/Leather Mouse Pad', cardImages.accessories),
      price: 'PHP 180',
    },
    {
      title: 'Button Pins',
      subtitle: 'Custom button pins.',
      image: firstImageInFolder('accessories/Button Pins', cardImages.accessories),
      price: 'PHP 20',
    },
  ],
  digital: [
    {
      title: 'Stickers',
      subtitle: 'Custom stickers for labels, packaging, and promos.',
      image: firstImageInFolder('digitalAndLargeFormat/Sticker', cardImages.businessCards),
      price: 'PHP 5',
    },
    {
      title: 'Box',
      subtitle: 'Custom printed boxes for packaging and gift items.',
      image: firstImageInFolder('digitalAndLargeFormat/Box', cardImages.businessCards),
      price: 'PHP 10',
    },
    {
      title: 'Flyers',
      subtitle: 'Promotional flyers with digital printing options.',
      image: firstImageInFolder('digitalAndLargeFormat/Flyers', cardImages.businessCards),
      price: 'PHP 15',
    },
    {
      title: 'Envelope',
      subtitle: 'Custom envelopes for special mailings and stationery.',
      image: firstImageInFolder('digitalAndLargeFormat/Envelope', cardImages.businessCards),
      price: 'PHP 30',
    },
    {
      title: 'Tarpaulin',
      subtitle: 'Outdoor tarpaulins for large format signage and events.',
      image: firstImageInFolder('digitalAndLargeFormat/Tarpaulin', cardImages.businessCards),
      price: 'PHP 30',
    },
    {
      title: 'Sintra Board',
      subtitle: 'Rigid Sintra board printing for signboards and displays.',
      image: firstImageInFolder('digitalAndLargeFormat/Sintra Board', cardImages.businessCards),
      price: 'PHP 45',
    },
    {
      title: 'Folder',
      subtitle: 'Presentation folders with full-color printing.',
      image: firstImageInFolder('digitalAndLargeFormat/Folder', cardImages.businessCards),
      price: 'PHP 100',
    },
    {
      title: 'Roll Up Banner',
      subtitle: 'Retractable roll-up banners for events and promotions.',
      image: firstImageInFolder('digitalAndLargeFormat/Roll Up Banner', cardImages.businessCards),
      price: 'PHP 120',
    },
    {
      title: 'Notebook',
      subtitle: 'Branded notebooks with custom covers.',
      image: firstImageInFolder('digitalAndLargeFormat/Notebook', cardImages.businessCards),
      price: 'PHP 150',
    },
    {
      title: 'Notepads',
      subtitle: 'Compact notepads for office use and giveaways.',
      image: firstImageInFolder('digitalAndLargeFormat/Notepads', cardImages.businessCards),
      price: 'PHP 150',
    },
    {
      title: 'Paper Fans',
      subtitle: 'Printed paper fans for events and outdoor promos.',
      image: firstImageInFolder('digitalAndLargeFormat/Paper Fans', cardImages.businessCards),
      price: 'PHP 150',
    },
    {
      title: 'Brochure',
      subtitle: 'Marketing brochures with full-color printing.',
      image: firstImageInFolder('digitalAndLargeFormat/Brochure', cardImages.businessCards),
      price: 'PHP 250',
    },
    {
      title: 'Business Cards',
      subtitle: 'Professional business cards for branding.',
      image: firstImageInFolder('digitalAndLargeFormat/Business Cards', cardImages.businessCards),
      price: 'PHP 600',
    },
  ],
  setsAndBundles: [
    {
      title: 'Bundle 1',
      subtitle: 'Planner, 650ml tumbler, 350ml egg mug, and sprayer bottle.',
      image: firstImageInFolder('bundle/Bundle 1', cardImages.businessCards),
      price: 'PHP 1,300',
    },
    {
      title: 'Bundle 2',
      subtitle: '650ml tumbler and 350ml mug.',
      image: firstImageInFolder('bundle/Bundle 2', cardImages.businessCards),
      price: 'PHP 920',
    },
    {
      title: 'Bundle 3',
      subtitle: '500ml tumbler, 350ml egg mug, sprayer bottle, spoon, and fork.',
      image: firstImageInFolder('bundle/Bundle 3', cardImages.businessCards),
      price: 'PHP 1,250',
    },
    {
      title: 'Bundle 4',
      subtitle: 'Mug and box with logo.',
      image: firstImageInFolder('bundle/Bundle 4', cardImages.businessCards),
      price: 'PHP 470',
    },
    {
      title: 'Bundle 5',
      subtitle: 'Notebook, mug, and ballpen.',
      image: firstImageInFolder('bundle/Bundle 5', cardImages.businessCards),
      price: 'PHP 760',
    },
    {
      title: 'Bundle 6',
      subtitle: 'Planner, ballpen, and tumbler.',
      image: firstImageInFolder('bundle/Bundle 6', cardImages.businessCards),
      price: 'PHP 860',
    },
    {
      title: 'Bundle 7',
      subtitle: 'Egg mug, sprayer bottle, and customized box.',
      image: firstImageInFolder('bundle/Bundle 7', cardImages.businessCards),
      price: 'PHP 5',
    },
    {
      title: 'Bundle 8',
      subtitle: 'Planner, 650ml tumbler, bamboo mug, sprayer bottle, and box w/ logo.',
      image: firstImageInFolder('bundle/Bundle 8', cardImages.businessCards),
      price: 'PHP 680',
    },
    {
      title: 'Bundle 9',
      subtitle: 'Open-dated journal, bag tag, mousepad, egg mug, 800ml tumbler, foldable umbrella, sprayer bottle, bucket hat, ballpen, and tote bag.',
      image: firstImageInFolder('bundle/Bundle 9', cardImages.businessCards),
      price: 'PHP 2,500',
    },
    {
      title: 'Bundle 10',
      subtitle: '650ml tumbler, egg mug, sprayer bottle, and customized box.',
      image: firstImageInFolder('bundle/Bundle 10', cardImages.businessCards),
      price: 'PHP 1,150',
    },
    {
      title: 'Bundle 11',
      subtitle: '650ml tumbler and customized box.',
      image: firstImageInFolder('bundle/Bundle 11', cardImages.businessCards),
      price: 'PHP 600',
    },
    {
      title: 'Bundle 12',
      subtitle: '350ml coffee mug and customized box.',
      image: firstImageInFolder('bundle/Bundle 12', cardImages.businessCards),
      price: 'PHP 500',
    },
    {
      title: 'Bundle 13',
      subtitle: '1100ml tumbler, tote bag, and customized box.',
      image: firstImageInFolder('bundle/Bundle 13', cardImages.businessCards),
      price: 'PHP 910',
    },
    {
      title: 'Bundle 14',
      subtitle: '600ml tumbler and customized box.',
      image: firstImageInFolder('bundle/Bundle 14', cardImages.businessCards),
      price: 'PHP 600',
    },
    {
      title: 'Bundle 15',
      subtitle: '350ml coffee mug, ballpen, and customized bag.',
      image: firstImageInFolder('bundle/Bundle 15', cardImages.businessCards),
      price: 'PHP 560',
    },
    {
      title: 'Bundle Set',
      subtitle: 'Bundle set with curated items.',
      image: firstImageInFolder('bundle/Bundle Set', cardImages.businessCards),
      price: 'PHP 1,175',
    },
    {
      title: 'Bundle w/ Ribbon',
      subtitle: 'Bundle packaged with ribbon.',
      image: firstImageInFolder('bundle/Bundle w Ribbon', cardImages.businessCards),
      price: 'PHP 1,500',
    },
  ],
};







































const initialCatalogData: CatalogData = readCatalogData(categories);

const categoriesWithGallery = Object.fromEntries(
  Object.entries(categories).map(([categoryKey, items]) => [
    categoryKey,
    items.map((item) => ({
      ...item,
      galleryImages: getGalleryImagesFromImageUrl(item.image),
    })),
  ]),
) as Record<string, Array<{
  title: string;
  subtitle: string;
  image: string;
  price: string;
  colors?: string[];
  colorOptions?: { name: string; hex: string; image: string }[];
  galleryImages?: string[];
}>>;

// Merged category items
const drinkwareItems = categoriesWithGallery.drinkware;
const kitchenwareAllItems = categoriesWithGallery.kitchenware;
const umbrellasAndBagsItems = [...categoriesWithGallery.umbrellas, ...categoriesWithGallery.toteBags];
const capsAndApparelItems = [...categoriesWithGallery.caps, ...categoriesWithGallery.shirts, ...categoriesWithGallery.aprons, ...categoriesWithGallery.hoodies, ...categoriesWithGallery.jackets];
const notebooksAndPensItems = [...categoriesWithGallery.notebooks, ...categoriesWithGallery.pens, ...categoriesWithGallery.planners];
const accessoriesAllItems = categoriesWithGallery.accessories;
const digitalItems = categoriesWithGallery.digital;
const setsAndBundlesItems = categoriesWithGallery.setsAndBundles;

const allSearchItems: SearchEntry[] = [
  ...drinkwareItems.map((item) => ({ title: item.title, page: 'drinkware', pageLabel: 'Drinkware', item })),
  ...kitchenwareAllItems.map((item) => ({ title: item.title, page: 'kitchenware', pageLabel: 'Kitchenware', item })),
  ...umbrellasAndBagsItems.map((item) => ({ title: item.title, page: 'umbrellasAndBags', pageLabel: 'Umbrellas & Bags', item })),
  ...capsAndApparelItems.map((item) => ({ title: item.title, page: 'capsAndApparel', pageLabel: 'Caps & Apparel', item })),
  ...notebooksAndPensItems.map((item) => ({ title: item.title, page: 'notebooksAndPens', pageLabel: 'Notebooks & Pens', item })),
  ...accessoriesAllItems.map((item) => ({ title: item.title, page: 'accessories', pageLabel: 'Accessories', item })),
  ...digitalItems.map((item) => ({ title: item.title, page: 'digital', pageLabel: 'Digital & Large Format', item })),
  ...setsAndBundlesItems.map((item) => ({ title: item.title, page: 'setsAndBundles', pageLabel: 'Sets & Bundles', item })),
];

export default function App() {
  const [catalogData, setCatalogData] = useState<CatalogData>(() => initialCatalogData);
  const [page, setPage] = useState<string>(() => getRouteFromLocation());
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchSelectedItemTitle, setSearchSelectedItemTitle] = useState('');

  const publicCategories = buildPublicCategoryList(catalogData);

  useEffect(() => {
    const updatePage = () => setPage(getRouteFromLocation());
    window.addEventListener('hashchange', updatePage);
    window.addEventListener('popstate', updatePage);
    return () => {
      window.removeEventListener('hashchange', updatePage);
      window.removeEventListener('popstate', updatePage);
    };
  }, []);

  useEffect(() => {
    if (searchSelectedItemTitle) {
      setSearchSelectedItemTitle('');
    }
  }, [page]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [page]);

  // Fetch live catalog from Supabase when configured and merge into catalogData.
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    let mounted = true;

    (async () => {
      try {
        const { data: categories, error: catErr } = await supabase
          .from('categories')
          .select('*')
          .order('display_order', { ascending: true });

        const { data: products, error: prodErr } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: true });

        if (catErr) throw catErr;
        if (prodErr) throw prodErr;

        const mappedCategories = (categories ?? []).map((c: any) => ({
          id: String(c.id),
          name: c.name,
          slug: c.slug,
          display_order: c.display_order ?? 1,
          is_active: Boolean(c.is_active),
          created_at: c.created_at,
          updated_at: c.updated_at,
        }));

        const mappedProducts = (products ?? []).map((p: any) => ({
          id: String(p.id),
          category_id: String(p.category_id),
          name: p.name,
          slug: p.slug,
          description: p.description ?? '',
          price: Number(p.price ?? 0),
          image_url: p.image_url ?? '',
          variants: p.variants ?? [],
          is_active: Boolean(p.is_active),
          created_at: p.created_at,
          updated_at: p.updated_at,
        }));

        const newCatalog = ensureCanonicalCategories({
          categories: mappedCategories,
          products: mappedProducts,
          homepageImages: catalogData.homepageImages ?? [],
          categorySampleImages: catalogData.categorySampleImages ?? [],
          updated_at: new Date().toISOString(),
        });

        if (mounted) {
          setCatalogData(newCatalog);
          try { writeCatalogData(newCatalog); } catch { /* ignore */ }
        }
      } catch (err) {
        // keep using legacy/local catalog if Supabase fetch fails
        // eslint-disable-next-line no-console
        console.error('Failed to load Supabase catalog', err);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const navigateToHash = (hash: string) => {
    const normalized = hash.startsWith('#') ? hash : `#${hash}`;
    window.location.hash = normalized;
    window.history.pushState({}, '', window.location.pathname + normalized);
    setPage(hash.replace(/^#/, '') || 'home');
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  };

  const openSearch = () => {
    setSearchOpen(true);
    setSearchTerm('');
  };

  const openInfoPage = () => {
    navigateToHash('info');
  };

  const closeSearch = () => {
    setSearchOpen(false);
  };

  const handleSearchSelect = (selected: { title: string; page: string }) => {
    setSearchOpen(false);
    setSearchTerm('');
    setSearchSelectedItemTitle(selected.title);
    navigateToHash(selected.page);
  };

  const filteredSearchItems = searchTerm.trim()
    ? allSearchItems.filter((entry) => entry.title.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  const searchOverlay = searchOpen ? (
    <div
      className="position-fixed top-0 start-0 vw-100 vh-100 bg-dark bg-opacity-50 d-flex justify-content-center align-items-start p-3"
      style={{ zIndex: 1500, paddingTop: '70px' }}
      onClick={closeSearch}
    >
      <div
        className="card shadow-sm w-100"
        style={{ maxWidth: '680px' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="card-body">
          <div className="d-flex gap-2 align-items-center mb-3">
            <input
              className="form-control"
              type="text"
              placeholder="Search item name..."
              value={searchTerm}
              autoFocus
              onChange={(event) => setSearchTerm(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && filteredSearchItems.length > 0) {
                  handleSearchSelect(filteredSearchItems[0]);
                }
              }}
            />
            <button type="button" className="btn btn-outline-secondary" onClick={closeSearch} aria-label="Close search">
              ×
            </button>
          </div>
          <div className="list-group">
            {filteredSearchItems.length > 0 ? (
              filteredSearchItems.map((entry) => (
                <button
                  key={`${entry.page}-${entry.title}`}
                  type="button"
                  className="list-group-item list-group-item-action d-flex justify-content-between align-items-start"
                  onClick={() => handleSearchSelect(entry)}
                >
                  <div>
                    <div className="fw-bold">{entry.title}</div>
                    <small className="text-muted">{entry.pageLabel}</small>
                  </div>
                  <span className="badge bg-primary rounded-pill">Select</span>
                </button>
              ))
            ) : searchTerm.trim() ? (
              <div className="list-group-item text-muted">No items found for "{searchTerm}".</div>
            ) : (
              <div className="list-group-item text-muted">Type to search for a product name.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  ) : null;

  // Merge admin-overrides for homepage images (if present in catalogData) with the default cardImages
  const effectiveCardImages = { ...cardImages } as Record<string, string>;
  if (catalogData.homepageImages && Array.isArray(catalogData.homepageImages)) {
    for (const hp of catalogData.homepageImages) {
      if (hp && hp.key && typeof hp.image_url === 'string' && hp.image_url) {
        effectiveCardImages[hp.key] = hp.image_url;
      }
    }
  }

  let pageContent = <HomePage cardImages={effectiveCardImages} />;

  if (page === 'admin') {
    pageContent = (
      <AdminPanel
        catalogData={catalogData}
        onCatalogChange={setCatalogData}
        onBackToSite={() => {
          window.history.pushState({}, '', '/');
          setPage('home');
          window.location.hash = '#home';
        }}
        cardImages={cardImages}
      />
    );
  } else if (['drinkware','kitchenware','umbrellasAndBags','capsAndApparel','notebooksAndPens','accessories','digital','setsAndBundles'].includes(page)) {
    const cat = getCategoryBySlug(catalogData, page);
    if (cat) {
      const products = getProductsForCategory(catalogData, cat.id);
      const items = products.map((product) => {
        const variants = product.variants ?? [];
        const colorOptions = variants.length > 0
          ? variants
              .slice()
              .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
              .map((v) => ({ name: v.name, hex: colorFromFilename(v.name), image: v.image_url }))
          : undefined;

        const galleryImages = variants.length > 0 ? variants.map((v) => v.image_url) : [product.image_url || cardImages.eisBanner];

        return {
          title: product.name,
          subtitle: product.description,
          image: product.image_url || (variants[0] && variants[0].image_url) || cardImages.eisBanner,
          price: `PHP ${Number(product.price).toLocaleString('en-US')}`,
          galleryImages,
          colorOptions,
        };
      });

      if (page === 'drinkware') pageContent = <DrinkwarePage items={items} onBack={() => navigateToHash('home')} initialSelectedItemTitle={searchSelectedItemTitle} />;
      else if (page === 'kitchenware') pageContent = <KitchenwarePage items={items} onBack={() => navigateToHash('home')} initialSelectedItemTitle={searchSelectedItemTitle} />;
      else if (page === 'umbrellasAndBags') pageContent = <UmbrellasAndBagsPage items={items} onBack={() => navigateToHash('home')} initialSelectedItemTitle={searchSelectedItemTitle} />;
      else if (page === 'capsAndApparel') pageContent = <CapsAndApparelPage items={items} onBack={() => navigateToHash('home')} initialSelectedItemTitle={searchSelectedItemTitle} />;
      else if (page === 'notebooksAndPens') pageContent = <NotebooksAndPensPage items={items} onBack={() => navigateToHash('home')} initialSelectedItemTitle={searchSelectedItemTitle} />;
      else if (page === 'accessories') pageContent = <AccessoriesPage items={items} onBack={() => navigateToHash('home')} initialSelectedItemTitle={searchSelectedItemTitle} />;
      else if (page === 'digital') pageContent = <DigitalAndLargeFormatPage items={items} onBack={() => navigateToHash('home')} initialSelectedItemTitle={searchSelectedItemTitle} />;
      else if (page === 'setsAndBundles') pageContent = <SetsAndBundlesPage items={items} onBack={() => navigateToHash('home')} initialSelectedItemTitle={searchSelectedItemTitle} />;
    }
  } else if (page === 'about') {
    pageContent = <AboutUsPage />;
  } else if (page === 'info') {
    pageContent = <InfoPage image={localImages['info eis'] ?? cardImages.eisBanner} />;
  } else {
    const dynamicCategory = publicCategories.find((category) => category.slug === page);
    // Guard: never override the explicit 'home' (or 'about'/'admin') route with a dynamic category
    if (page !== 'home' && page !== 'about' && page !== 'admin' && dynamicCategory && catalogData.products.length > 0) {
      const itemsForCategory = catalogData.products
        .filter((product) => product.category_id === dynamicCategory.id && product.is_active)
        .map((product) => {
            const variants = product.variants ?? [];
            const colorOptions = variants.length > 0
              ? variants
                  .slice()
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((v) => ({ name: v.name, hex: colorFromFilename(v.name), image: v.image_url }))
              : undefined;

            const galleryImages = variants.length > 0 ? variants.map((v) => v.image_url) : [product.image_url || cardImages.eisBanner];

            return {
              title: product.name,
              subtitle: product.description,
              image: product.image_url || (variants[0] && variants[0].image_url) || cardImages.eisBanner,
              price: `PHP ${Number(product.price).toLocaleString('en-US')}`,
              galleryImages,
              colorOptions,
            };
          });

      pageContent = (
        <CategoryPage
          title={dynamicCategory.name}
          subtitle="Browse products in this category."
          items={itemsForCategory}
          onBack={() => navigateToHash('home')}
        />
      );
    }
  }

  if (page === 'admin') {
    return pageContent;
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navigation categories={publicCategories} onSearchOpen={openSearch} onPhoneClick={openInfoPage} />
      {searchOverlay}
      {pageContent}
    </div>
  );
}
