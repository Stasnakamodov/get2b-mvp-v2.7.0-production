"use client"

import { CreditCard, FileText, Shield, Search, Package } from "lucide-react"
import { Card } from "@/components/ui/card"

const features = [
  {
    icon: CreditCard,
    title: "Удобные международные платежи",
    description: "Безопасные и быстрые транзакции с поставщиками по всему миру"
  },
  {
    icon: FileText,
    title: "Полное документарное сопровождение",
    description: "Подготовка всех необходимых документов для импорта и таможенного оформления"
  },
  {
    icon: Shield,
    title: "Юридическая и налоговая безопасность",
    description: "Полное соблюдение законодательства и налоговых требований"
  },
  {
    icon: Package,
    title: "Каталог товаров",
    description: "Доступ к широкому каталогу проверенных товаров от надежных поставщиков"
  },
  {
    icon: Search,
    title: "Поиск клиентов",
    description: "Инструменты для поиска и проверки надежных партнеров и клиентов"
  }
]

export function AboutSection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Кто мы такие
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Get2B — это комплексная платформа для международной торговли,
            которая упрощает все этапы работы с зарубежными поставщиками
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card
                key={index}
                className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/50"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  {/* Icon */}
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-semibold">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <p className="text-lg text-muted-foreground">
            Мы делаем международную торговлю проще, безопаснее и доступнее для бизнеса любого масштаба
          </p>
        </div>
      </div>
    </section>
  )
}
