"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight } from "lucide-react"

export function CTASection() {
  return (
    <section className="relative py-32 overflow-hidden bg-gradient-to-b from-zinc-900 to-black">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

      <div className="max-w-[1400px] mx-auto px-8 md:px-16 relative z-10">
        <div className="max-w-3xl mx-auto text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="text-[56px] md:text-[80px] leading-[0.95] font-light tracking-tight mb-6">
              Готовы начать{" "}
              <span className="font-normal bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
                закупки?
              </span>
            </h2>
            <p className="text-lg md:text-xl mb-12 text-gray-400 font-light leading-relaxed">
              Создайте первую заявку за 5 минут
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/dashboard/catalog">
                <Button
                  size="lg"
                  className="bg-white text-black hover:bg-gray-100 text-base px-8 py-6 h-auto rounded-full font-normal"
                >
                  Открыть каталог
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  className="bg-transparent border border-white/20 text-white hover:bg-white/5 text-base px-8 py-6 h-auto rounded-full font-light backdrop-blur-sm"
                >
                  Создать закупку
                </Button>
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-500 font-light">
              {["Без скрытых комиссий", "Поддержка 24/7", "Первая сделка бесплатно"].map((text, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
