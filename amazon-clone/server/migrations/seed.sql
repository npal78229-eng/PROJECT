-- ==========================================================
-- Amazon Clone - Seed Data (Categories, Users, Products)
-- ==========================================================

-- Insert sample categories
INSERT INTO categories (id, name, parent_id) VALUES
(1, 'Electronics', NULL),
(2, 'Computers & Accessories', 1),
(3, 'Smart Home & Audio', 1),
(4, 'Clothing & Fashion', NULL),
(5, 'Home & Kitchen', NULL),
(6, 'Books & Media', NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert sample seller user (password: Password123!)
-- Hash generated with bcrypt rounds=10 for 'Password123!'
INSERT INTO users (id, name, email, password_hash, role) VALUES
(1, 'Amazon Official Store', 'seller@amazonclone.com', '$2b$10$wN9Q7bK4eR.t5GkUuL3Hae9h2t1i2W5m.mJ4FvN9Q7bK4eR.t5GkU', 'seller'),
(2, 'Demo Customer', 'customer@example.com', '$2b$10$wN9Q7bK4eR.t5GkUuL3Hae9h2t1i2W5m.mJ4FvN9Q7bK4eR.t5GkU', 'customer')
ON CONFLICT (id) DO NOTHING;

-- Reset identity sequence if needed
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- Insert 12 sample products across categories
INSERT INTO products (id, seller_id, category_id, title, description, price, stock, images, rating, num_reviews) VALUES
(1, 1, 2, 'Noise-Cancelling Wireless Headphones Pro', 'Active noise cancellation with 40-hour battery life, spatial audio, and premium memory foam ear cushions.', 199.99, 45, ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'], 4.8, 128),
(2, 1, 2, 'Ultra-Slim 14-inch Laptop (16GB RAM, 512GB SSD)', 'Lightweight aluminum unibody, vibrant FHD IPS display, blazing fast performance for productivity and coding.', 749.99, 20, ARRAY['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80'], 4.6, 94),
(3, 1, 2, 'Ergonomic Wireless Mechanical Keyboard', 'Tactile hot-swappable switches with RGB backlighting and Bluetooth multi-device pairing.', 89.99, 60, ARRAY['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80'], 4.7, 72),
(4, 1, 3, 'Smart Voice-Controlled Speaker with Alexa', 'Room-filling balanced audio with smart home automation hub built right in.', 49.99, 150, ARRAY['https://images.unsplash.com/photo-1543512214-318c7553f230?w=800&q=80'], 4.5, 310),
(5, 1, 3, '4K Ultra HD Streaming Media Player', 'Cinematic 4K streaming with Dolby Vision, HDR10+, and Wi-Fi 6 support.', 39.99, 85, ARRAY['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80'], 4.4, 215),
(6, 1, 4, 'Men''s Classic Waterproof Winter Parka', 'Windproof and water-resistant winter coat with faux-fur lined hood and fleece insulation.', 119.50, 35, ARRAY['https://images.unsplash.com/photo-1539533018447-63fcce667823?w=800&q=80'], 4.3, 56),
(7, 1, 4, 'Premium Leather Minimalist Slim Wallet', 'RFID-blocking slim front-pocket bifold crafted from genuine full-grain leather.', 29.99, 110, ARRAY['https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80'], 4.7, 189),
(8, 1, 5, 'Programmable Stainless Steel Coffee Maker', 'Brew up to 12 cups of fresh coffee with programmable 24-hour timer and auto-pause.', 69.99, 40, ARRAY['https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&q=80'], 4.6, 88),
(9, 1, 5, 'Non-Stick Ceramic Cookware Set (10-Piece)', 'Toxin-free nonstick pots and pans set suitable for induction, gas, and electric stovetops.', 149.00, 25, ARRAY['https://images.unsplash.com/photo-1584990347449-37ec0e3c5443?w=800&q=80'], 4.8, 64),
(10, 1, 6, 'Designing Data-Intensive Applications', 'The definitive guide to the architecture, storage engines, distributed consensus, and scalability of modern databases.', 38.50, 75, ARRAY['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80'], 4.9, 430),
(11, 1, 6, 'Clean Code: A Handbook of Agile Software Craftsmanship', 'A must-read handbook of agile software engineering principles, patterns, and refactoring techniques.', 42.00, 50, ARRAY['https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=800&q=80'], 4.7, 312),
(12, 1, 2, '27-inch 4K UHD IPS Designer Monitor', 'Ultra-sharp 3840x2160 resolution with 99% sRGB color accuracy and USB-C 65W power delivery.', 349.99, 18, ARRAY['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80'], 4.6, 83)
ON CONFLICT (id) DO NOTHING;

SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
