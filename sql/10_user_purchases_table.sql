-- =====================================================
-- TABELA: user_purchases
-- Descrição: Compras realizadas pelos usuários
-- =====================================================

CREATE TABLE IF NOT EXISTS user_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES store_items(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    unit_price INTEGER NOT NULL CHECK (unit_price > 0),
    total_price INTEGER NOT NULL CHECK (total_price > 0),
    discount_applied INTEGER DEFAULT 0,
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true, -- Para itens que podem ser ativados/desativados
    expires_at TIMESTAMP WITH TIME ZONE, -- Para itens temporários
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_purchases_user_id ON user_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_user_purchases_item_id ON user_purchases(item_id);
CREATE INDEX IF NOT EXISTS idx_user_purchases_purchase_date ON user_purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_user_purchases_is_active ON user_purchases(is_active);

-- Função para validar e processar compra
CREATE OR REPLACE FUNCTION process_purchase()
RETURNS TRIGGER AS $$
DECLARE
    user_coins INTEGER;
    item_price INTEGER;
    item_stock INTEGER;
    user_purchase_count INTEGER;
    item_purchase_limit INTEGER;
    item_available BOOLEAN;
BEGIN
    -- Verifica se o item está disponível
    SELECT is_available, stock_quantity, purchase_limit, price
    INTO item_available, item_stock, item_purchase_limit, item_price
    FROM store_items
    WHERE id = NEW.item_id;
    
    IF NOT item_available THEN
        RAISE EXCEPTION 'Item não está disponível para compra';
    END IF;
    
    -- Verifica estoque
    IF item_stock IS NOT NULL AND item_stock < NEW.quantity THEN
        RAISE EXCEPTION 'Estoque insuficiente. Disponível: %', item_stock;
    END IF;
    
    -- Verifica limite de compras por usuário
    SELECT COUNT(*)
    INTO user_purchase_count
    FROM user_purchases
    WHERE user_id = NEW.user_id AND item_id = NEW.item_id;
    
    IF user_purchase_count >= item_purchase_limit THEN
        RAISE EXCEPTION 'Limite de compras atingido para este item';
    END IF;
    
    -- Verifica se o usuário tem moedas suficientes
    SELECT coins INTO user_coins FROM users WHERE id = NEW.user_id;
    
    IF user_coins < NEW.total_price THEN
        RAISE EXCEPTION 'Moedas insuficientes. Necessário: %, Disponível: %', NEW.total_price, user_coins;
    END IF;
    
    -- Deduz moedas do usuário
    UPDATE users
    SET coins = coins - NEW.total_price,
        last_activity_at = NOW()
    WHERE id = NEW.user_id;
    
    -- Atualiza estoque se necessário
    IF item_stock IS NOT NULL THEN
        UPDATE store_items
        SET stock_quantity = stock_quantity - NEW.quantity
        WHERE id = NEW.item_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS process_purchase_trigger ON user_purchases;
CREATE TRIGGER process_purchase_trigger
    BEFORE INSERT ON user_purchases
    FOR EACH ROW
    EXECUTE FUNCTION process_purchase();

-- Função para verificar expiração de itens
CREATE OR REPLACE FUNCTION check_item_expiration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expires_at IS NOT NULL AND NEW.expires_at <= NOW() THEN
        NEW.is_active := false;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_item_expiration_trigger ON user_purchases;
CREATE TRIGGER check_item_expiration_trigger
    BEFORE UPDATE ON user_purchases
    FOR EACH ROW
    EXECUTE FUNCTION check_item_expiration();

-- Comentários
COMMENT ON TABLE user_purchases IS 'Compras realizadas pelos usuários na loja virtual';
COMMENT ON COLUMN user_purchases.unit_price IS 'Preço unitário no momento da compra';
COMMENT ON COLUMN user_purchases.total_price IS 'Preço total pago (unit_price * quantity - discount)';
COMMENT ON COLUMN user_purchases.is_active IS 'Se o item está ativo/equipado pelo usuário';
COMMENT ON COLUMN user_purchases.expires_at IS 'Data de expiração para itens temporários';