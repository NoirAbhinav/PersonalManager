-- migrations/011_seed_categories.sql
-- +goose Up
INSERT INTO categories (name, color, is_system) VALUES
    ('Food & Dining',   '#EF4444', true),
    ('Transport',       '#3B82F6', true),
    ('Shopping',        '#8B5CF6', true),
    ('Utilities',       '#F59E0B', true),
    ('Entertainment',   '#EC4899', true),
    ('Health',          '#10B981', true),
    ('Transfers',       '#6B7280', true),
    ('Others',          '#9CA3AF', true);

INSERT INTO category_rules (category_id, keyword)
SELECT id, keyword FROM categories, unnest(ARRAY[
    'zomato', 'swiggy', 'eatclub', 'dominos', 'mcdonalds', 'kfc', 'subway',
    'blinkit', 'zepto', 'instamart'
]) AS keyword
WHERE name = 'Food & Dining' AND is_system = true;

INSERT INTO category_rules (category_id, keyword)
SELECT id, keyword FROM categories, unnest(ARRAY[
    'uber', 'ola', 'rapido', 'irctc', 'redbus', 'makemytrip', 'indigo',
    'airasia', 'spicejet'
]) AS keyword
WHERE name = 'Transport' AND is_system = true;

INSERT INTO category_rules (category_id, keyword)
SELECT id, keyword FROM categories, unnest(ARRAY[
    'amazon', 'flipkart', 'myntra', 'meesho', 'ajio', 'nykaa', 'snapdeal'
]) AS keyword
WHERE name = 'Shopping' AND is_system = true;

INSERT INTO category_rules (category_id, keyword)
SELECT id, keyword FROM categories, unnest(ARRAY[
    'jio', 'airtel', 'bsnl', 'vodafone', 'electricity', 'broadband',
    'bescom', 'tata power'
]) AS keyword
WHERE name = 'Utilities' AND is_system = true;

INSERT INTO category_rules (category_id, keyword)
SELECT id, keyword FROM categories, unnest(ARRAY[
    'netflix', 'spotify', 'primevideo', 'hotstar', 'bookmyshow', 'youtube',
    'apple', 'steam'
]) AS keyword
WHERE name = 'Entertainment' AND is_system = true;

INSERT INTO category_rules (category_id, keyword)
SELECT id, keyword FROM categories, unnest(ARRAY[
    'apollo', 'medplus', 'pharmeasy', '1mg', 'netmeds', 'practo', 'cult'
]) AS keyword
WHERE name = 'Health' AND is_system = true;

-- +goose Down
DELETE FROM category_rules;
DELETE FROM categories WHERE is_system = true;