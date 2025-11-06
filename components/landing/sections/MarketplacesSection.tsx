"use client"

import React from 'react'
import Image from 'next/image'

/**
 * Профессиональная секция с бегущей лентой логотипов маркетплейсов
 *
 * ОСОБЕННОСТИ:
 * - Бесконечная горизонтальная прокрутка (CSS анимация)
 * - Пауза при наведении
 * - Градиенты по краям
 * - Адаптивность
 * - Половинная высота стандартного блока (py-16)
 */
export function MarketplacesSection() {
  const marketplaces = [
    { name: 'Wildberries', logo: '/images/marketplaces/wildberries.svg' },
    { name: 'Ozon', logo: '/images/marketplaces/ozon.svg' },
    { name: 'Яндекс.Маркет', logo: '/images/marketplaces/yandex-market.svg' },
    { name: 'Alibaba', logo: '/images/marketplaces/alibaba.svg' },
    { name: '1688.com', logo: '/images/marketplaces/1688.svg' },
    { name: 'Taobao', logo: '/images/marketplaces/taobao.svg' },
    { name: 'Trendyol', logo: '/images/marketplaces/trendyol.svg' },
    { name: 'Hepsiburada', logo: '/images/marketplaces/hepsiburada.svg' },
    // Добавим остальные когда будут готовы SVG
    // { name: 'Tmall', logo: '/images/marketplaces/tmall.svg' },
  ]

  return (
    <section className="relative py-16 bg-gradient-to-b from-black to-zinc-900 overflow-hidden">
      <style jsx>{`
        @keyframes scrollBoomerang {
          0% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(-33.333%);
          }
          100% {
            transform: translateX(0);
          }
        }

        .animate-scroll {
          animation: scrollBoomerang 60s ease-in-out infinite;
        }

        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Заголовок */}
      <div className="max-w-[1400px] mx-auto px-8 md:px-16 mb-12">
        <h3 className="text-2xl md:text-3xl font-light text-white/80 text-center">
          Помощь в поисках товаров и поставщиков
        </h3>
        <p className="text-center text-white/50 mt-4 text-sm md:text-base">
          Делаем работу селлеров на ведущих площадках проще и эффективнее
        </p>
      </div>

      {/* Бегущая лента */}
      <div className="relative">
        {/* Контейнер с overflow hidden для скрытия выходящих элементов */}
        <div className="overflow-hidden">
          <div className="flex animate-scroll">
            {/* Дублируем массив 3 раза для бумеранг-эффекта */}
            {[...marketplaces, ...marketplaces, ...marketplaces].map((marketplace, index) => (
              <div
                key={`${marketplace.name}-${index}`}
                className="flex-shrink-0 relative mx-4 md:mx-6 w-[120px] md:w-[160px] h-[60px] md:h-[80px]"
              >
                <Image
                  src={marketplace.logo}
                  alt={`${marketplace.name} логотип`}
                  fill
                  className="object-contain opacity-70 transition-all duration-300 hover:opacity-100 hover:scale-110"
                  sizes="(max-width: 768px) 120px, 160px"
                  priority={index < 8}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Градиенты по краям для плавного исчезновения */}
        <div className="absolute top-0 left-0 w-24 md:w-40 h-full bg-gradient-to-r from-zinc-900 via-zinc-900/80 to-transparent pointer-events-none z-10" />
        <div className="absolute top-0 right-0 w-24 md:w-40 h-full bg-gradient-to-l from-zinc-900 via-zinc-900/80 to-transparent pointer-events-none z-10" />
      </div>

    </section>
  )
}
