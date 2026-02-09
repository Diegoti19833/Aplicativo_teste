-- =====================================================
-- SCRIPT CORRIGIDO - FUNÇÕES DA LOJA
-- Ajustado para a estrutura real das tabelas
-- =====================================================

-- Função principal para comprar item da loja
CREATE OR REPLACE FUNCTION purchase_store_item(
    user_id_param UUID,
    item_id_param UUID,
    quantity_param INTEGER DEFAULT 1
)
RETURNS JSON AS $$
DECLARE
    item_record RECORD;
    user_coins INTEGER;
    total_cost INTEGER;
    unit_price INTEGER;
BEGIN
    -- Buscar item da loja
    SELECT * INTO item_record
    FROM store_items 
    WHERE id = item_id_param AND is_available = true;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Item não encontrado ou indisponível');
    END IF;
    
    -- Buscar moedas do usuário
    SELECT COALESCE(coins, 0) INTO user_coins
    FROM users 
    WHERE id = user_id_param;
    
    -- Calcular preços
    unit_price := item_record.price;
    total_cost := unit_price * quantity_param;
    
    -- Verificar se o usuário tem moedas suficientes
    IF user_coins < total_cost THEN
        RETURN json_build_object('success', false, 'error', 'Moedas insuficientes');
    END IF;
    
    -- Processar a compra
    BEGIN
        -- Debitar moedas do usuário
        UPDATE users 
        SET coins = coins - total_cost
        WHERE id = user_id_param;
        
        -- Registrar a compra (usando a estrutura correta da tabela)
        INSERT INTO user_purchases (
            user_id, 
            item_id, 
            quantity, 
            unit_price, 
            total_price, 
            purchase_date
        )
        VALUES (
            user_id_param, 
            item_id_param, 
            quantity_param, 
            unit_price, 
            total_cost, 
            NOW()
        );
        
        RETURN json_build_object(
            'success', true, 
            'message', 'Compra realizada com sucesso',
            'item_name', item_record.name,
            'quantity', quantity_param,
            'unit_price', unit_price,
            'total_cost', total_cost,
            'remaining_coins', user_coins - total_cost
        );
        
    EXCEPTION WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', 'Erro interno ao processar compra: ' || SQLERRM);
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para usar item da loja
CREATE OR REPLACE FUNCTION use_store_item(
    user_id_param UUID,
    item_id_param UUID,
    quantity_param INTEGER DEFAULT 1
)
RETURNS JSON AS $$
DECLARE
    user_item RECORD;
    item_data RECORD;
    remaining_quantity INTEGER;
BEGIN
    -- Verificar se o usuário possui o item
    SELECT * INTO user_item
    FROM user_purchases
    WHERE user_id = user_id_param AND item_id = item_id_param AND is_active = true
    ORDER BY purchase_date DESC
    LIMIT 1;
    
    IF user_item IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Item não encontrado no inventário');
    END IF;
    
    IF user_item.quantity < quantity_param THEN
        RETURN json_build_object('success', false, 'error', 'Quantidade insuficiente');
    END IF;
    
    -- Buscar dados do item
    SELECT * INTO item_data
    FROM store_items
    WHERE id = item_id_param;
    
    -- Calcular quantidade restante
    remaining_quantity := user_item.quantity - quantity_param;
    
    -- Processar uso do item
    BEGIN
        IF remaining_quantity > 0 THEN
            -- Reduzir quantidade no inventário
            UPDATE user_purchases
            SET quantity = remaining_quantity
            WHERE id = user_item.id;
        ELSE
            -- Marcar item como inativo se quantidade chegou a zero
            UPDATE user_purchases
            SET is_active = false, quantity = 0
            WHERE id = user_item.id;
        END IF;
        
        RETURN json_build_object(
            'success', true,
            'message', 'Item usado com sucesso',
            'item_name', item_data.name,
            'quantity_used', quantity_param,
            'remaining_quantity', remaining_quantity
        );
        
    EXCEPTION WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', 'Erro interno ao usar item: ' || SQLERRM);
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para listar itens do usuário
CREATE OR REPLACE FUNCTION get_user_inventory(user_id_param UUID)
RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT COALESCE(json_agg(
            json_build_object(
                'purchase_id', up.id,
                'item_id', si.id,
                'item_name', si.name,
                'item_type', si.item_type,
                'quantity', up.quantity,
                'unit_price', up.unit_price,
                'total_price', up.total_price,
                'purchase_date', up.purchase_date,
                'is_active', up.is_active
            )
        ), '[]'::json)
        FROM user_purchases up
        JOIN store_items si ON up.item_id = si.id
        WHERE up.user_id = user_id_param AND up.is_active = true AND up.quantity > 0
        ORDER BY up.purchase_date DESC
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar se as funções foram criadas
SELECT 'Funções da loja criadas e ajustadas com sucesso!' as status;