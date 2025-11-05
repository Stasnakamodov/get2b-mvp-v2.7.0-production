"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle, BarChart, MessageCircle } from "lucide-react"

export function CRMSection() {
  return (
    <section className="relative py-32 bg-white">
      <div className="max-w-[1400px] mx-auto px-8 md:px-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-[56px] md:text-[80px] leading-[0.95] font-light tracking-tight text-black mb-6">
            CRM система + <span className="font-normal">поддержка 24/7</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 leading-relaxed font-light">
            Управляйте закупками онлайн. Персональный менеджер для каждой сделки.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* CRM Features */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-zinc-50 border border-zinc-200 rounded-3xl p-8"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <BarChart className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-normal mb-4">CRM Dashboard</h3>
            <div className="space-y-3">
              {[
                "История всех сделок",
                "Статусы в реальном времени",
                "Шаблоны проектов",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-light text-gray-700">{item}</span>
                </div>
              ))}
            </div>
            <Link href="/dashboard" className="inline-block mt-6">
              <Button size="sm" className="bg-black text-white hover:bg-gray-800 rounded-full">
                Попробовать CRM
              </Button>
            </Link>
          </motion.div>

          {/* Telegram Support */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-zinc-50 border border-zinc-200 rounded-3xl p-8"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
              <MessageCircle className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-2xl font-normal mb-4">Telegram менеджер</h3>
            <div className="space-y-3">
              {[
                "Одобрение спецификаций",
                "Загрузка чеков об оплате",
                "Ответы в течение часа",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-light text-gray-700">{item}</span>
                </div>
              ))}
            </div>
            <Button size="sm" className="bg-black text-white hover:bg-gray-800 rounded-full mt-6">
              <MessageCircle className="mr-2 h-4 w-4" />
              Написать
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
