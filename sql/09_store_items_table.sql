-- =====================================================
-- TABELA: store_items
-- Descrição: Itens disponíveis na loja virtual
-- =====================================================

CREATE TABLE IF NOT EXISTS store_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    price INTEGER NOT NULL CHECK (price > 0),
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('avatar', 'theme', 'boost', 'decoration', 'special')),
    item_data JSONB, -- Dados específicos do item (cores, efeitos, etc.)
    rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    is_available BOOLEAN DEFAULT true,
    is_limited BOOLEAN DEFAULT false,
    stock_quantity INTEGER, -- NULL = ilimitado
    purchase_limit INTEGER DEFAULT 1, -- Limite por usuário
    discount_percentage INTEGER DEFAULT 0 CHECK (discount_percentage BETWEEN 0 AND 100),
    available_from TIMESTAMP WITH TIME ZONE,
    available_until TIMESTAMP WITH TIME ZONE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_store_items_type ON store_items(item_type);
CREATE INDEX IF NOT EXISTS idx_store_items_is_available ON store_items(is_available);
CREATE INDEX IF NOT EXISTS idx_store_items_rarity ON store_items(rarity);
CREATE INDEX IF NOT EXISTS idx_store_items_price ON store_items(price);
CREATE INDEX IF NOT EXISTS idx_store_items_available_dates ON store_items(available_from, available_until);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_store_items_updated_at ON store_items;
CREATE TRIGGER update_store_items_updated_at
    BEFORE UPDATE ON store_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Função para calcular preço com desconto
CREATE OR REPLACE FUNCTION get_item_final_price(item_id UUID)
RETURNS INTEGER AS $$
DECLARE
    base_price INTEGER;
    discount INTEGER;
    final_price INTEGER;
BEGIN
    SELECT price, discount_percentage
    INTO base_price, discount
    FROM store_items
    WHERE id = item_id;
    
    final_price := base_price - (base_price * discount / 100);
    
    RETURN final_price;
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON TABLE store_items IS 'Itens disponíveis na loja virtual';
COMMENT ON COLUMN store_items.item_type IS 'Tipo do item: avatar, theme, boost, decoration, special';
COMMENT ON COLUMN store_items.item_data IS 'Dados específicos do item em formato JSON';
COMMENT ON COLUMN store_items.stock_quantity IS 'Quantidade em estoque (NULL = ilimitado)';
COMMENT ON COLUMN store_items.purchase_limit IS 'Limite de compras por usuário';