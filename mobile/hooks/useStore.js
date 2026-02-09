import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useStore() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [userItems, setUserItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStoreItems = async () => {
    try {
      setLoading(true)
      setError(null)

      // Buscar todos os itens da loja disponíveis
      const { data: itemsData, error: itemsError } = await supabase
        .from('store_items')
        .select('*')
        .eq('is_available', true)
        .order('price', { ascending: true })

      if (itemsError) throw itemsError

      setItems(itemsData || [])

      // Se o usuário estiver logado, buscar seus itens comprados
      if (user) {
        const { data: userItemsData, error: userItemsError } = await supabase
          .from('user_purchases')
          .select(`
            *,
            item:store_items(*)
          `)
          .eq('user_id', user.id)

        if (userItemsError) throw userItemsError

        setUserItems(userItemsData || [])
      }
    } catch (err) {
      console.error('Erro ao buscar itens da loja:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const purchaseItem = async (itemId) => {
    if (!user) return { success: false, error: 'Usuário não logado' }

    try {
      const { data, error } = await supabase.rpc('purchase_store_item', {
        user_id_param: user.id,
        item_id_param: itemId
      })

      if (error) throw error

      // Atualizar a lista de itens do usuário
      await fetchStoreItems()

      return { success: true, data }
    } catch (err) {
      console.error('Erro ao comprar item:', err)
      return { success: false, error: err.message }
    }
  }

  const hasItem = (itemId) => {
    return userItems.some(ui => ui.item_id === itemId)
  }

  const getItemsByCategory = (category) => {
    return items.filter(item => item.category === category)
  }

  const getAvailableItems = () => {
    // Retorna itens que o usuário ainda não possui
    return items.filter(item => !hasItem(item.id))
  }

  const getPurchasedItems = () => {
    // Retorna itens que o usuário já possui
    return userItems.map(ui => ui.item)
  }

  const getItemPrice = (itemId) => {
    const item = items.find(i => i.id === itemId)
    return item ? item.price : 0
  }

  const canAffordItem = (itemId, userCoins) => {
    const price = getItemPrice(itemId)
    return userCoins >= price
  }

  // Função para usar um item (se aplicável)
  const useItem = async (itemId) => {
    if (!user) return { success: false, error: 'Usuário não logado' }

    try {
      const { data, error } = await supabase.rpc('use_store_item', {
        user_id_param: user.id,
        item_id_param: itemId
      })

      if (error) throw error

      // Atualizar a lista de itens do usuário
      await fetchStoreItems()

      return { success: true, data }
    } catch (err) {
      console.error('Erro ao usar item:', err)
      return { success: false, error: err.message }
    }
  }

  const getItemUsageCount = (itemId) => {
    const userItem = userItems.find(ui => ui.item_id === itemId)
    return userItem ? userItem.usage_count : 0
  }

  useEffect(() => {
    fetchStoreItems()
  }, [user])

  return {
    items,
    userItems,
    loading,
    error,
    purchaseItem,
    hasItem,
    getItemsByCategory,
    getAvailableItems,
    getPurchasedItems,
    getItemPrice,
    canAffordItem,
    useItem,
    getItemUsageCount,
    refetch: fetchStoreItems
  }
}
