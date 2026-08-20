create extension if not exists "uuid-ossp";

create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  display_order integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text not null default '',
  price numeric(10,2) not null default 0,
  image_url text,
  variants jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.homepage_images (
  id uuid primary key default uuid_generate_v4(),
  key text not null unique,
  image_url text not null,
  display_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.category_sample_images (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid not null references public.categories(id) on delete cascade,
  image_url text not null,
  display_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.homepage_images enable row level security;
alter table public.category_sample_images enable row level security;

create policy "Public can view active categories"
on public.categories for select
using (is_active = true);

create policy "Public can view active products"
on public.products for select
using (is_active = true);

create policy "Public can view homepage images"
on public.homepage_images for select
using (true);

create policy "Public can view category sample images"
on public.category_sample_images for select
using (true);

create policy "Admins can manage categories"
on public.categories for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Admins can manage products"
on public.products for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Admins can manage homepage images"
on public.homepage_images for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Admins can manage category sample images"
on public.category_sample_images for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create trigger set_public_categories_updated_at
before update on public.categories
for each row
execute procedure public.set_updated_at();

create trigger set_public_products_updated_at
before update on public.products
for each row
execute procedure public.set_updated_at();

create trigger set_public_homepage_images_updated_at
before update on public.homepage_images
for each row
execute procedure public.set_updated_at();

create trigger set_public_category_sample_images_updated_at
before update on public.category_sample_images
for each row
execute procedure public.set_updated_at();

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
