create extension if not exists postgis;
create extension if not exists pg_trgm;

create table if not exists ground_code_regions (
  dataset_name text not null,
  source_index integer not null,
  body text not null check (body in ('earth', 'moon', 'mars')),
  region_level integer not null,
  language text not null,
  code text not null,
  name text not null,
  search_code text not null,
  search_name text not null,
  lat double precision not null,
  lng double precision not null,
  population bigint,
  country_code text,
  feature_type text,
  diameter_km double precision,
  source text,
  geom geometry(Point, 4326) not null,
  updated_at timestamptz not null default now(),
  primary key (dataset_name, source_index)
);

create index if not exists ground_code_regions_lookup_idx
  on ground_code_regions (body, region_level, language);

create index if not exists ground_code_regions_dataset_code_idx
  on ground_code_regions (dataset_name, code);

create index if not exists ground_code_regions_geom_idx
  on ground_code_regions using gist (geom);

create index if not exists ground_code_regions_region_1_geom_idx
  on ground_code_regions using gist (geom)
  where dataset_name = 'region-1';

create index if not exists ground_code_regions_region_2_geom_idx
  on ground_code_regions using gist (geom)
  where dataset_name = 'region-2';

create index if not exists ground_code_regions_region_3_geom_idx
  on ground_code_regions using gist (geom)
  where dataset_name = 'region-3';

create index if not exists ground_code_regions_search_code_trgm_idx
  on ground_code_regions using gin (search_code gin_trgm_ops);

create index if not exists ground_code_regions_search_name_trgm_idx
  on ground_code_regions using gin (search_name gin_trgm_ops);
