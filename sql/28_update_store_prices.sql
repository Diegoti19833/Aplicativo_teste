-- Update prices for the store items to match the new lowered values

UPDATE store_items
SET price = 10
WHERE name = 'Dobro de Pontos (24h)';

UPDATE store_items
SET price = 20
WHERE name = 'Congelar Sequência';

UPDATE store_items
SET price = 15
WHERE name = 'Vida Extra';

UPDATE store_items
SET price = 50
WHERE name = 'Certificado Pro';

UPDATE store_items
SET price = 25
WHERE name = 'Boost de Aula';

UPDATE store_items
SET price = 30
WHERE name = 'Theme Especial';

-- Output success message
SELECT 'Prices updated successfully!' as message;
