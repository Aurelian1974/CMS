import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { userMenuPreferencesApi } from '@/api/endpoints/userMenuPreferences.api'

export const menuFavoritesKeys = {
  all: ['userMenuPreferences'] as const,
}

/// Favoritele sidebar-ului ale utilizatorului curent, persistate în BD.
/// `staleTime` mare — se schimbă doar din acțiunea directă a utilizatorului,
/// nu are sens să se refetch-eze des.
export const useMenuFavorites = () =>
  useQuery({
    queryKey: menuFavoritesKeys.all,
    queryFn: userMenuPreferencesApi.get,
    staleTime: 5 * 60 * 1000,
  })

/// Salvează noua listă de favorite (ordinea din array e ordinea de afișare).
/// Update optimist — sidebar-ul nu trebuie să aștepte round-trip-ul de rețea
/// pentru un toggle de stea sau o reordonare.
export const useUpsertMenuFavorites = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (favoriteRoutes: string[]) => userMenuPreferencesApi.upsert({ favoriteRoutes }),
    onMutate: async (favoriteRoutes) => {
      await queryClient.cancelQueries({ queryKey: menuFavoritesKeys.all })
      const previous = queryClient.getQueryData(menuFavoritesKeys.all)
      queryClient.setQueryData(menuFavoritesKeys.all, { favoriteRoutes })
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(menuFavoritesKeys.all, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: menuFavoritesKeys.all })
    },
  })
}
