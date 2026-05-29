import { useInfiniteQuery } from "@tanstack/react-query"
import { queryClient } from "./queryClient"
import { getMessages } from "../services/chatService"
import type { ChatMessage } from "../types/chat"

const MSGS_KEY = "messages"

export function useMessagesInfiniteQuery(conversationId: string | number | null | undefined) {
  return useInfiniteQuery({
    queryKey: [MSGS_KEY, conversationId],
    queryFn: async ({ pageParam = 0 }) => {
      const res = await getMessages(conversationId!, 30, pageParam)
      return { items: res.data.items, hasMore: res.data.has_more }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (!lastPage.hasMore) return undefined
      return (lastPageParam as number) + lastPage.items.length
    },
    enabled: !!conversationId && conversationId !== 0,
    staleTime: 30_000,
  })
}

export function flattenMessages(pages: { items: ChatMessage[]; hasMore: boolean }[] | undefined): ChatMessage[] {
  if (!pages || pages.length === 0) return []
  return [...pages].reverse().flatMap(p => [...p.items].reverse())
}

export function msgQueryKey(conversationId: string | number) {
  return [MSGS_KEY, conversationId] as const
}

export function prependMessageToCache(conversationId: string | number, msg: ChatMessage) {
  queryClient.setQueryData<{
    pages: { items: ChatMessage[]; hasMore: boolean }[]
    pageParams: unknown[]
  }>(msgQueryKey(conversationId), (old) => {
    if (!old) return old
    const pages = [...old.pages]
    // Prepend to first page
    pages[0] = { ...pages[0], items: [msg, ...pages[0].items] }
    return { ...old, pages }
  })
}

export function updateMessageInCache(
  conversationId: string | number,
  predicate: (m: ChatMessage) => boolean,
  updater: (m: ChatMessage) => ChatMessage,
) {
  queryClient.setQueryData<{
    pages: { items: ChatMessage[]; hasMore: boolean }[]
    pageParams: unknown[]
  }>(msgQueryKey(conversationId), (old) => {
    if (!old) return old
    const pages = old.pages.map((page) => ({
      ...page,
      items: page.items.map((m) => (predicate(m) ? updater(m) : m)),
    }))
    return { ...old, pages }
  })
}
