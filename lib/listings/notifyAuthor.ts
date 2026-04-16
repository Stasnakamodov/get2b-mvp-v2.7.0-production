import { logger } from '@/src/shared/lib/logger'

/**
 * Sends a Telegram notification to the listing author when a supplier contacts them.
 *
 * Current state (MVP): there is no user→telegram_chat_id linkage in the database.
 * Until that storage is added, this function performs a graceful skip — the in-app
 * unread_count badge in ChatHub still surfaces the contact (Q5 in the interview).
 *
 * Future work (out of scope here): add `users.telegram_chat_id` (or a dedicated
 * link table), expose UI in /dashboard/profile to link via /start in the chat bot,
 * then wire ChatBotService.sendMessage(chatId, ...) below.
 */
export async function notifyListingAuthorAboutContact(params: {
  authorUserId: string
  listingTitle: string
  supplierCompanyName: string
  roomId: string
}): Promise<void> {
  logger.info(
    `[listings/notify] contact for "${params.listingTitle}" from ${params.supplierCompanyName} → ` +
      `room ${params.roomId} (author ${params.authorUserId}); telegram link not configured, skipping`
  )
}
