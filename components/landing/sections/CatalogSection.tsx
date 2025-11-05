"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight, ShoppingCart } from "lucide-react"

export function CatalogSection() {
  return (
    <section id="catalog" className="relative py-32 bg-gradient-to-b from-zinc-900 to-black">
      <div className="max-w-[1400px] mx-auto px-8 md:px-16">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="text-[56px] md:text-[72px] leading-[0.95] font-light tracking-tight text-white mb-6">
              10,000+ товаров от проверенных{" "}
              <span className="font-normal bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">поставщиков</span>
            </h2>

            <p className="text-lg md:text-xl text-gray-400 mb-10 leading-relaxed font-light">
              Выбирайте товары из нашего каталога или добавляйте своих поставщиков. Все цены актуальны, все поставщики проверены.
            </p>

            <div className="space-y-4 mb-10">
              {[
                { title: "Проверенные поставщики", desc: "Работаем только с надёжными партнёрами" },
                { title: "Актуальные цены в юанях", desc: "Обновляем еженедельно" },
                { title: "Электроника, Мебель, Одежда", desc: "И ещё 15+ категорий товаров" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-normal text-white mb-0.5">{item.title}</div>
                    <div className="text-sm text-gray-500 font-light">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/dashboard/catalog">
              <Button size="lg" className="bg-white text-black hover:bg-gray-100 text-base px-8 py-6 h-auto rounded-full font-normal">
                Открыть каталог
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl">
              {/* Catalog preview */}
              <div className="p-6 space-y-3">
                {[
                  { cat: "Электроника", items: "2,347 товаров", color: "blue" },
                  { cat: "Мебель", items: "1,892 товара", color: "orange" },
                  { cat: "Одежда", items: "3,156 товаров", color: "purple" },
                  { cat: "Строительство", items: "1,423 товара", color: "green" },
                ].map((item, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-12 h-12 bg-${item.color}-500/20 rounded-xl flex items-center justify-center`}>
                        <ShoppingCart className={`w-6 h-6 text-${item.color}-400`} />
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="text-base font-normal text-white mb-1">{item.cat}</div>
                    <div className="text-sm text-gray-500 font-light">{item.items}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
