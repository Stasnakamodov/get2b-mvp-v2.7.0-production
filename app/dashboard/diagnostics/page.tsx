"use client"
import React from "react"
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { sendTelegramMessageClient } from "@/lib/telegram-client";
import { useRouter } from "next/navigation";

export default function DiagnosticsPage() {
  const [result, setResult] = useState<string>("");
  const router = useRouter();

  // Тест Telegram
  const handleTestTelegram = async () => {
    setResult("Тестируем отправку в Telegram...");
    try {
      await sendTelegramMessageClient("🧪 Тестовое сообщение из приложения");
      setResult("✅ Тестовое сообщение отправлено! Проверьте Telegram.");
    } catch (error: any) {
      setResult("❌ Ошибка: " + error.message);
    }
  };

  // Тест бота
  const handleTestBot = async () => {
    setResult("Тестируем бота...");
    try {
      const response = await fetch("/api/telegram/test-bot");
      const result = await response.json();
      if (result.success) {
        setResult(`✅ Бот работает!\nИмя: ${result.bot.first_name}\nUsername: @${result.bot.username}`);
      } else {
        setResult(`❌ Ошибка бота: ${result.error}`);
      }
    } catch (error: any) {
      setResult("❌ Ошибка: " + error.message);
    }
  };

  // Установить webhook
  const handleSetWebhook = async () => {
    setResult("Устанавливаем webhook...");
    try {
      const webhookUrl = `${window.location.origin}/api/telegram-webhook`;
      const response = await fetch("/api/telegram/set-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl }),
      });
      const result = await response.json();
      if (result.success) {
        setResult("✅ Webhook успешно установлен!");
      } else {
        setResult("❌ Ошибка установки webhook: " + result.error);
      }
    } catch (error: any) {
      setResult("❌ Ошибка: " + error.message);
    }
  };

  // Проверить webhook
  const handleCheckWebhook = async () => {
    setResult("Проверяем webhook...");
    try {
      const response = await fetch("/api/telegram/set-webhook");
      const result = await response.json();
      if (result.result) {
        const info = result.result;
        setResult(
          `📋 Webhook информация:\nURL: ${info.url || "Не установлен"}\nPending updates: ${info.pending_update_count || 0}\nLast error: ${info.last_error_message || "Нет ошибок"}`
        );
      } else {
        setResult("❌ Ошибка получения информации о webhook");
      }
    } catch (error: any) {
      setResult("❌ Ошибка: " + error.message);
    }
  };

      return (
      <div className="container mx-auto py-4">
      <h1 className="text-3xl font-bold mb-8 text-foreground">Диагностика и отладка</h1>
      <div className="flex flex-wrap gap-4 mb-6">
        <Button variant="destructive" onClick={handleTestTelegram}>✏️ Тест Telegram</Button>
        <Button variant="outline" onClick={handleTestBot}>🤖 Тест Бота</Button>
        <Button variant="outline" onClick={handleSetWebhook}>⚙️ Webhook</Button>
        <Button variant="outline" onClick={handleCheckWebhook}>ℹ️ Проверить</Button>
      </div>
      <div className="bg-muted p-4 rounded-lg border border-border min-h-[80px]">
        <pre className="whitespace-pre-wrap text-sm text-foreground">{result}</pre>
      </div>
      <div className="mt-8 text-muted-foreground text-sm">
        Здесь будут появляться новые инструменты для диагностики и отладки платформы.
      </div>
    </div>
  );
} 