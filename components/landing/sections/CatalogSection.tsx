"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight } from "lucide-react"

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
              4,800+ товаров от проверенных{" "}
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
                    <div className="text-base font-normal text-white mb-1">{item.title}</div>
                    <div className="text-sm text-gray-300 font-light">{item.desc}</div>
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
            <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl scale-110">
              {/* Catalog preview */}
              <div className="p-8 space-y-4">
                {[
                  { cat: "Дом и быт", items: "2,245 товаров", color: "orange", image: "/images/categories/furniture.png", overlay: "bg-black/0" },
                  { cat: "Строительство", items: "856 товаров", color: "green", image: "/images/categories/construction.png", overlay: "bg-black/0" },
                  { cat: "Электроника", items: "500 товаров", color: "blue", image: "/images/categories/electronics.jpg", overlay: "bg-black/0" },
                  { cat: "Здоровье и красота", items: "481 товар", color: "purple", image: "/images/categories/clothing.png", overlay: "bg-black/0" },
                ].map((item, i) => (
                  <div key={i} className="relative border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all group h-40">
                    {/* Background Image */}
                    <img
                      src={item.image}
                      alt={item.cat}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Dark overlay */}
                    <div className={`absolute inset-0 ${item.overlay} group-hover:bg-black/10 transition-colors`}></div>

                    {/* Content */}
                    <div className="relative flex items-center justify-between p-6 h-full">
                      <div>
                        <div className="text-lg font-semibold text-white mb-1">{item.cat}</div>
                        <div className="text-sm text-gray-200 font-light">{item.items}</div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-white/80 group-hover:text-white transition-colors" />
                    </div>
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
