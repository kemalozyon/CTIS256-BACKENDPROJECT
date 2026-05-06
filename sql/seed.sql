-- Seed data for SustainMart.
-- Reference date: 2026-05-03. Some products are intentionally expired so the market
-- dashboard can demonstrate the expired-row highlight, and there are 7 "mag*"
-- products visible to consumers so keyword search ("mag") + 4-per-page pagination
-- can be demoed on two pages.
-- All accounts use password "1234" (bcrypt rounds=10).

SET NAMES utf8mb4;

-- Clean up so the file can be re-applied. Order respects FKs.
DELETE FROM cart_items;
DELETE FROM carts;
DELETE FROM products;
DELETE FROM consumer;
DELETE FROM markets;

-- ---------------------------------------------------------------------------
-- Markets (6 across 3 cities)
-- ---------------------------------------------------------------------------
INSERT INTO markets (id, email, name, password_hash, city, district) VALUES
  ('11111111-1111-1111-1111-111111111111', 'tok@market.com',        'Tok Market',          '$2b$10$kEDm398UcmHTaLo0LnbWc.nLVxh5kSL7ftfcdcvOH/1H03IsMukH2', 'Ankara',   'Bilkent'),
  ('22222222-2222-2222-2222-222222222222', 'cankaya@market.com',    'Çankaya Süpermarket', '$2b$10$kEDm398UcmHTaLo0LnbWc.nLVxh5kSL7ftfcdcvOH/1H03IsMukH2', 'Ankara',   'Çankaya'),
  ('33333333-3333-3333-3333-333333333333', 'bagcilar@migros.com',   'Migros Bağcılar',     '$2b$10$kEDm398UcmHTaLo0LnbWc.nLVxh5kSL7ftfcdcvOH/1H03IsMukH2', 'İstanbul', 'Bağcılar'),
  ('44444444-4444-4444-4444-444444444444', 'kadikoy@carrefour.com', 'Carrefour Kadıköy',   '$2b$10$kEDm398UcmHTaLo0LnbWc.nLVxh5kSL7ftfcdcvOH/1H03IsMukH2', 'İstanbul', 'Kadıköy'),
  ('55555555-5555-5555-5555-555555555555', 'bornova@bim.com',       'BİM Bornova',         '$2b$10$kEDm398UcmHTaLo0LnbWc.nLVxh5kSL7ftfcdcvOH/1H03IsMukH2', 'İzmir',    'Bornova'),
  ('66666666-6666-6666-6666-666666666666', 'konak@sok.com',         'Şok Konak',           '$2b$10$kEDm398UcmHTaLo0LnbWc.nLVxh5kSL7ftfcdcvOH/1H03IsMukH2', 'İzmir',    'Konak');

-- ---------------------------------------------------------------------------
-- Consumers (4 across the same cities/districts)
-- Ayşe shares Tok Market's district -> "same district" badge demo
-- ---------------------------------------------------------------------------
INSERT INTO consumer (id, email, full_name, password_hash, city, district) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ayse@example.com',    'Ayşe Yılmaz',  '$2b$10$kEDm398UcmHTaLo0LnbWc.nLVxh5kSL7ftfcdcvOH/1H03IsMukH2', 'Ankara',   'Bilkent'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'mehmet@example.com',  'Mehmet Demir', '$2b$10$kEDm398UcmHTaLo0LnbWc.nLVxh5kSL7ftfcdcvOH/1H03IsMukH2', 'Ankara',   'Çankaya'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'zeynep@example.com',  'Zeynep Kara',  '$2b$10$kEDm398UcmHTaLo0LnbWc.nLVxh5kSL7ftfcdcvOH/1H03IsMukH2', 'İstanbul', 'Kadıköy'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'can@example.com',     'Can Öztürk',   '$2b$10$kEDm398UcmHTaLo0LnbWc.nLVxh5kSL7ftfcdcvOH/1H03IsMukH2', 'İzmir',    'Bornova');

-- ---------------------------------------------------------------------------
-- Products
-- Expiration buckets relative to 2026-05-03:
--   2026-04-25..2026-05-02 = expired (visible only on market dashboard, highlighted)
--   2026-05-03            = expires today
--   2026-05-04..2026-05-08 = a few days
--   2026-05-10..2026-06-30 = healthy
-- ---------------------------------------------------------------------------

-- Tok Market (Ankara/Bilkent)
INSERT INTO products (id, market_id, title, stock, normal_price, discount_price, exp_date, image_url) VALUES
  ('p1000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Magnum Badem 110ml',          12,  35.00,  22.00, '2026-04-28', NULL),
  ('p1000001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Toblerone Çikolata 100gr',    25, 200.00, 120.00, '2026-05-22', NULL),
  ('p1000001-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Sütaş Süt 1L',                60,  38.00,  28.00, '2026-05-08', NULL),
  ('p1000001-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Pınar Beyaz Peynir 500gr',    18, 145.00,  95.00, '2026-05-15', NULL),
  ('p1000001-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Eti Cin 47gr',                40,  12.50,   7.50, '2026-05-04', NULL);

-- Çankaya Süpermarket (Ankara/Çankaya)
INSERT INTO products (id, market_id, title, stock, normal_price, discount_price, exp_date, image_url) VALUES
  ('p2000002-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Magnum Klasik 110ml',         22,  35.00,  19.50, '2026-05-05', NULL),
  ('p2000002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Magnolia Cheesecake 400gr',    6, 180.00,  99.00, '2026-05-03', NULL),
  ('p2000002-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'Doğal Yumurta 30''lu',        35, 110.00,  78.00, '2026-05-10', NULL),
  ('p2000002-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'Lavaş Ekmek 500gr',           50,  25.00,  14.00, '2026-05-04', NULL),
  ('p2000002-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', 'Tahin Helvası 250gr',         15,  95.00,  65.00, '2026-05-25', NULL);

-- Migros Bağcılar (İstanbul/Bağcılar)
INSERT INTO products (id, market_id, title, stock, normal_price, discount_price, exp_date, image_url) VALUES
  ('p3000003-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'Magnum Double Caramel 88ml',  28,  38.00,  24.00, '2026-05-06', NULL),
  ('p3000003-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'Cappy Portakal Suyu 1L',      20,  35.00,  18.00, '2026-05-02', NULL),
  ('p3000003-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 'Yörsan Lor Peyniri 250gr',    14,  65.00,  42.00, '2026-05-07', NULL),
  ('p3000003-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', 'Eti Karam Bitter 60gr',       40,  28.00,  18.00, '2026-05-20', NULL),
  ('p3000003-0000-0000-0000-000000000005', '33333333-3333-3333-3333-333333333333', 'Doritos Acılı 113gr',         45,  32.00,  22.00, '2026-06-01', NULL);

-- Carrefour Kadıköy (İstanbul/Kadıköy)
INSERT INTO products (id, market_id, title, stock, normal_price, discount_price, exp_date, image_url) VALUES
  ('p4000004-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 'Magnolia Vanilla Cake 350gr',  8, 160.00,  95.00, '2026-05-05', NULL),
  ('p4000004-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444444', 'Maggi Tavuk Bulyon 60gr',     32,  24.00,  16.00, '2026-05-25', NULL),
  ('p4000004-0000-0000-0000-000000000003', '44444444-4444-4444-4444-444444444444', 'Algida Cornetto 90ml',        30,  25.00,  14.00, '2026-05-04', NULL),
  ('p4000004-0000-0000-0000-000000000004', '44444444-4444-4444-4444-444444444444', 'Ülker Halley 6''lı',          25,  35.00,  22.00, '2026-05-15', NULL),
  ('p4000004-0000-0000-0000-000000000005', '44444444-4444-4444-4444-444444444444', 'Coca-Cola 1L',                80,  40.00,  28.00, '2026-06-15', NULL);

-- BİM Bornova (İzmir/Bornova)
INSERT INTO products (id, market_id, title, stock, normal_price, discount_price, exp_date, image_url) VALUES
  ('p5000005-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555555', 'Magnum Almond Reserve 90ml',  18,  42.00,  26.00, '2026-05-08', NULL),
  ('p5000005-0000-0000-0000-000000000002', '55555555-5555-5555-5555-555555555555', 'Sek Süt 1L',                  22,  35.00,  22.00, '2026-05-01', NULL),
  ('p5000005-0000-0000-0000-000000000003', '55555555-5555-5555-5555-555555555555', 'Kavurma 500gr',                6, 280.00, 195.00, '2026-05-12', NULL),
  ('p5000005-0000-0000-0000-000000000004', '55555555-5555-5555-5555-555555555555', 'Reis Pirinç 1kg',             50,  95.00,  65.00, '2026-05-30', NULL),
  ('p5000005-0000-0000-0000-000000000005', '55555555-5555-5555-5555-555555555555', 'Kayısı Marmelat 380gr',       20,  55.00,  38.00, '2026-06-10', NULL);

-- Şok Konak (İzmir/Konak)
INSERT INTO products (id, market_id, title, stock, normal_price, discount_price, exp_date, image_url) VALUES
  ('p6000006-0000-0000-0000-000000000001', '66666666-6666-6666-6666-666666666666', 'Magic Tahin Halvası 200gr',   12,  78.00,  52.00, '2026-05-06', NULL),
  ('p6000006-0000-0000-0000-000000000002', '66666666-6666-6666-6666-666666666666', 'Beypazarı Maden Suyu 6x500ml', 60, 45.00,  32.00, '2026-08-15', NULL),
  ('p6000006-0000-0000-0000-000000000003', '66666666-6666-6666-6666-666666666666', 'Tat Domates Salçası 700gr',   28,  65.00,  45.00, '2026-05-20', NULL),
  ('p6000006-0000-0000-0000-000000000004', '66666666-6666-6666-6666-666666666666', 'Misis Kuru Üzüm 200gr',       22,  48.00,  32.00, '2026-05-15', NULL),
  ('p6000006-0000-0000-0000-000000000005', '66666666-6666-6666-6666-666666666666', 'Eti Maximus Çikolata 70gr',   15,  25.00,  16.00, '2026-04-30', NULL);

-- ---------------------------------------------------------------------------
-- A pre-populated cart for Ayşe so the cart UI has something to show on first
-- login. Items mix same-district (Tok Market, Ankara/Bilkent) and same-city
-- (Çankaya, Ankara/Çankaya).
-- ---------------------------------------------------------------------------
INSERT INTO carts (id, consumer_id) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

INSERT INTO cart_items (id, cart_id, product_id, quantity) VALUES
  ('i0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'p1000001-0000-0000-0000-000000000002', 2), -- Toblerone
  ('i0000001-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000001', 'p1000001-0000-0000-0000-000000000003', 1), -- Sütaş Süt
  ('i0000001-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000001', 'p2000002-0000-0000-0000-000000000001', 3); -- Magnum Klasik
