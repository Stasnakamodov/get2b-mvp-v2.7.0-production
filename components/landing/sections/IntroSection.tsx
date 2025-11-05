"use client"

import { motion } from "framer-motion"
import { Users, Shield, Package, ArrowRight, CheckCircle } from "lucide-react"

export function IntroSection() {
  return (
    <section className="relative py-32 bg-white">
      <div className="max-w-[1400px] mx-auto px-8 md:px-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl mb-20"
        >
          <h2 className="text-[56px] md:text-[80px] leading-[0.95] font-light tracking-tight text-black mb-6">
            Мы — <span className="font-normal">платёжный агент</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 leading-relaxed font-light">
            Не просто CRM. Мы берём деньги от вас и переводим поставщику легально.
          </p>
        </motion.div>

        {/* Flow diagram - Clean version */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-zinc-50 border border-zinc-200 rounded-3xl p-12 md:p-16"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
            {/* Your company */}
            <div className="text-center flex-1">
              <div className="w-24 h-24 bg-white border-2 border-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Users className="w-12 h-12 text-blue-600" />
              </div>
              <div className="text-base font-normal text-black">Ваша компания</div>
            </div>

            {/* Arrow */}
            <div className="flex-shrink-0">
              <ArrowRight className="w-8 h-8 text-zinc-400" />
            </div>

            {/* Get2B Agent */}
            <div className="text-center flex-1">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Shield className="w-12 h-12 text-white" />
              </div>
              <div className="text-base font-normal text-black mb-1">Get2B</div>
              <div className="text-sm text-gray-600 font-light">Платёжный агент</div>
            </div>

            {/* Arrow */}
            <div className="flex-shrink-0">
              <ArrowRight className="w-8 h-8 text-zinc-400" />
            </div>

            {/* Supplier */}
            <div className="text-center flex-1">
              <div className="w-24 h-24 bg-white border-2 border-orange-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Package className="w-12 h-12 text-orange-600" />
              </div>
              <div className="text-base font-normal text-black">Поставщик в Китае</div>
            </div>
          </div>

          {/* Benefits */}
          <div className="grid md:grid-cols-4 gap-4 pt-8 border-t border-zinc-200">
            {[
              "Агентский договор",
              "Легальные переводы",
              "Все документы",
              "Защита от блокировок",
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm font-light text-gray-700">{text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
