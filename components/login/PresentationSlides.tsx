"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence, Variants } from "framer-motion"
import { ArrowLeft, ArrowRight, Download, Check } from "lucide-react"

const EASE = [0.16, 1, 0.3, 1] as const
const TOTAL_SLIDES = 6

const slideVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 30 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -30 }),
}

export function PresentationSlides() {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(TOTAL_SLIDES - 1, next))
      setDirection(clamped > index ? 1 : -1)
      setIndex(clamped)
    },
    [index]
  )

  const next = useCallback(() => goTo(index + 1), [index, goTo])
  const prev = useCallback(() => goTo(index - 1), [index, goTo])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next()
      else if (e.key === "ArrowLeft") prev()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [next, prev])

  return (
    <div className="relative h-full w-full overflow-hidden">
      <a
        href="/Get2B_FichList.pdf"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute right-6 top-6 z-20 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-gray-400 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
      >
        <Download className="h-3 w-3" />
        PDF
      </a>

      <div className="relative flex h-full w-full flex-col">
        <div className="relative flex-1 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={index}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease: EASE }}
              className="absolute inset-0 overflow-y-auto"
            >
              <div className="flex min-h-full items-center justify-center px-8 py-12 md:px-14 md:py-16">
                <SlideContent index={index} />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative z-10 flex items-center justify-between border-t border-white/5 px-8 py-5 md:px-14">
          <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-gray-500 tabular-nums">
            {String(index + 1).padStart(2, "0")} / {String(TOTAL_SLIDES).padStart(2, "0")}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`Слайд ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-6 bg-white" : "w-1.5 bg-white/20 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>
            <div className="mx-1 h-5 w-px bg-white/10" />
            <button
              type="button"
              onClick={prev}
              disabled={index === 0}
              aria-label="Предыдущий слайд"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-400 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:bg-white/5 disabled:hover:text-gray-400"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={next}
              disabled={index === TOTAL_SLIDES - 1}
              aria-label="Следующий слайд"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-black transition-all hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SlideContent({ index }: { index: number }) {
  switch (index) {
    case 0:
      return <SlideCover />
    case 1:
      return <SlideAbout />
    case 2:
      return <SlideModel />
    case 3:
      return <SlideCashFlow />
    case 4:
      return <SlideFeatures />
    case 5:
      return <SlideDealTimeline />
    default:
      return null
  }
}

function SlideHeader({ eyebrow }: { eyebrow: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE }}
      className="mb-6 text-[10px] font-medium uppercase tracking-[0.22em] text-gray-500"
    >
      {eyebrow}
    </motion.p>
  )
}

const GRADIENT_TEXT = "bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent"

function SlideCover() {
  return (
    <div className="w-full max-w-3xl">
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
        className="mb-8 text-[11px] font-medium uppercase tracking-[0.22em] text-gray-500"
      >
        Фич-лист платформы · 2026
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: EASE, delay: 0.2 }}
        className="mb-8 text-[44px] font-light leading-[0.95] tracking-tight text-white md:text-5xl lg:text-[64px]"
      >
        Онлайн-сервис
        <span className={`block font-normal ${GRADIENT_TEXT}`}>
          сопровождения закупок
        </span>
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.35 }}
        className="max-w-xl text-base font-light leading-relaxed text-gray-400 md:text-lg"
      >
        Импортные товары и расчёты в одном окне: каталог верифицированных
        поставщиков, номинальный счёт и закрывающие документы — всё, что нужно
        для B2B-сделки.
      </motion.p>
    </div>
  )
}

function SlideAbout() {
  const cards = [
    {
      title: "Функции агента",
      body: "Посредник между юрлицами-резидентами РФ и поставщиками товаров. Действует от своего имени либо по поручению Принципала — всегда за его счёт и в его интересах.",
    },
    {
      title: "Расчёты и вознаграждение",
      body: "Участвует в расчётах, не приобретая прав собственности на товар. Средства Принципалов проходят через номинальный счёт и отражаются обособленно.",
    },
  ]
  return (
    <div className="w-full max-w-3xl">
      <SlideHeader eyebrow="Слайд 02 · О компании" />
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.12 }}
        className="mb-6 text-[32px] font-light leading-[1.05] tracking-tight text-white md:text-[40px]"
      >
        B2B-агент по{" "}
        <span className={`font-normal ${GRADIENT_TEXT}`}>главе 52 ГК РФ</span>
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.22 }}
        className="mb-8 max-w-xl text-sm font-light leading-relaxed text-gray-400 md:text-base"
      >
        Филиал иностранного юрлица, аккредитованный в РФ. Взаимодействие с
        клиентами через собственный онлайн-сервис — от приёма заявок до
        закрывающих документов.
      </motion.p>
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        {cards.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.32 + i * 0.08 }}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm"
          >
            <h3 className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-white">
              <span className="h-1 w-1 rounded-full bg-orange-400" />
              {c.title}
            </h3>
            <p className="text-[13px] font-light leading-relaxed text-gray-400">
              {c.body}
            </p>
          </motion.div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.55 }}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-gray-400 backdrop-blur-sm"
      >
        ст. 1005–1011 ГК РФ
      </motion.div>
    </div>
  )
}

function SlideModel() {
  const steps = [
    "Принципал размещает заявку на товар",
    "Поставщики направляют коммерческие предложения",
    "Принципал выбирает оптимальное предложение",
    "Get2B оформляет и сопровождает сделку",
    "Товар поставляется напрямую Принципалу",
  ]
  const benefits = [
    "База верифицированных поставщиков",
    "Сравнение предложений в одном окне",
    "Гарантия исполнения обязательств",
    "Эскроу через номинальный счёт",
    "Валютный контроль под ключ",
    "Полный комплект закрывающих документов",
  ]
  return (
    <div className="w-full max-w-3xl">
      <SlideHeader eyebrow="Слайд 03 · Модель работы" />
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.12 }}
        className="mb-8 text-[32px] font-light leading-[1.05] tracking-tight text-white md:text-[40px]"
      >
        Онлайн-сервис ={" "}
        <span className={`font-normal ${GRADIENT_TEXT}`}>обратный аукцион</span>
      </motion.h2>
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.2em] text-gray-500">
            Сценарий
          </p>
          <ol className="space-y-3">
            {steps.map((s, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.55, ease: EASE, delay: 0.25 + i * 0.08 }}
                className="flex gap-3"
              >
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[11px] font-semibold tabular-nums text-gray-300">
                  {i + 1}
                </span>
                <span className="text-[13px] font-light leading-snug text-gray-300">
                  {s}
                </span>
              </motion.li>
            ))}
          </ol>
        </div>
        <div>
          <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.2em] text-gray-500">
            Что получает Принципал
          </p>
          <ul className="space-y-2.5">
            {benefits.map((b, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.55, ease: EASE, delay: 0.35 + i * 0.06 }}
                className="flex gap-2.5"
              >
                <Check className="h-4 w-4 shrink-0 translate-y-0.5 text-orange-400" />
                <span className="text-[13px] font-light leading-snug text-gray-300">
                  {b}
                </span>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function SlideCashFlow() {
  const arrows = [
    {
      d: "M 240 300 L 350 300",
      label: "1. Оплата товара (₽)",
      lx: 325,
      ly: 250,
      anchor: "middle" as const,
      delay: 0.9,
      dashed: false,
    },
    {
      d: "M 550 300 L 660 300",
      label: "2. Валюта поставщику",
      lx: 575,
      ly: 250,
      anchor: "middle" as const,
      delay: 1.05,
      dashed: false,
    },
    {
      d: "M 450 258 L 450 120",
      label: "3. Удержание комиссии",
      lx: 462,
      ly: 195,
      anchor: "start" as const,
      delay: 1.2,
      dashed: false,
    },
    {
      d: "M 800 335 C 800 650, 100 650, 100 335",
      label: "4. Поставка товара",
      lx: 450,
      ly: 625,
      anchor: "middle" as const,
      delay: 1.4,
      dashed: true,
    },
    {
      d: "M 340 120 Q 190 140 130 278",
      label: "5. Отчёт агента + УПД",
      lx: 25,
      ly: 160,
      anchor: "start" as const,
      delay: 1.55,
      dashed: true,
    },
  ]
  const chips = [
    ["Владелец", "Get2B · агент"],
    ["Режим", "Обособленный"],
    ["Выручка", "Только комиссия"],
  ]
  return (
    <div className="w-full max-w-4xl">
      <SlideHeader eyebrow="Слайд 04 · Денежные потоки" />
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.12 }}
        className="mb-4 text-[28px] font-light leading-[1.05] tracking-tight text-white md:text-[36px]"
      >
        Номинальный счёт{" "}
        <span className={`font-normal ${GRADIENT_TEXT}`}>по принципу эскроу</span>
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.22 }}
        className="mb-6 max-w-xl text-sm font-light leading-relaxed text-gray-400"
      >
        Средства Принципала хранятся обособленно и уходят Поставщику только
        после выполнения условий сделки. Статьи 860.1–860.6 ГК РФ.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.3 }}
        className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4 md:p-6"
      >
        <svg
          viewBox="0 0 900 670"
          className="h-auto w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <marker
              id="arrow-solid"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M 0 0 L 10 3 L 0 6 z" fill="rgb(148 163 184)" />
            </marker>
            <marker
              id="arrow-dashed"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M 0 0 L 10 3 L 0 6 z" fill="rgb(251 146 60)" />
            </marker>
            <radialGradient id="nominal-fill" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgb(251 146 60)" stopOpacity="0.55" />
              <stop offset="100%" stopColor="rgb(251 146 60)" stopOpacity="0.12" />
            </radialGradient>
          </defs>

          {arrows.map((a, i) => (
            <g key={i}>
              <motion.path
                d={a.d}
                stroke={a.dashed ? "rgb(251 146 60 / 0.75)" : "rgb(148 163 184 / 0.7)"}
                strokeWidth="1.8"
                fill="none"
                strokeDasharray={a.dashed ? "5 5" : undefined}
                markerEnd={a.dashed ? "url(#arrow-dashed)" : "url(#arrow-solid)"}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  pathLength: { duration: 0.9, ease: "easeInOut", delay: a.delay },
                  opacity: { duration: 0.2, delay: a.delay },
                }}
              />
              <motion.text
                x={a.lx}
                y={a.ly}
                fill={a.dashed ? "rgb(251 191 128)" : "rgb(203 213 225)"}
                fontSize="13"
                fontWeight="500"
                textAnchor={a.anchor}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, ease: "easeOut", delay: a.delay + 0.5 }}
              >
                {a.label}
              </motion.text>
            </g>
          ))}

          <motion.g
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.45 }}
          >
            <rect
              x="330"
              y="70"
              width="240"
              height="50"
              rx="10"
              fill="rgb(24 24 27)"
              stroke="rgb(255 255 255 / 0.15)"
              strokeWidth="1.5"
            />
            <text
              x="450"
              y="101"
              fill="white"
              fontSize="16"
              fontWeight="600"
              textAnchor="middle"
            >
              Get2B · Агент
            </text>
          </motion.g>

          <motion.g
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ transformOrigin: "450px 300px" }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.6 }}
          >
            <ellipse
              cx="450"
              cy="300"
              rx="100"
              ry="42"
              fill="url(#nominal-fill)"
              stroke="rgb(251 146 60 / 0.7)"
              strokeWidth="1.5"
            />
            <text
              x="450"
              y="297"
              fill="white"
              fontSize="15"
              fontWeight="600"
              textAnchor="middle"
            >
              Номинальный
            </text>
            <text
              x="450"
              y="315"
              fill="white"
              fontSize="15"
              fontWeight="600"
              textAnchor="middle"
            >
              счёт
            </text>
          </motion.g>

          <motion.g
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.7 }}
          >
            <rect
              x="20"
              y="275"
              width="220"
              height="50"
              rx="10"
              fill="rgb(255 255 255 / 0.05)"
              stroke="rgb(255 255 255 / 0.18)"
              strokeWidth="1.5"
            />
            <text
              x="130"
              y="306"
              fill="rgb(226 232 240)"
              fontSize="14"
              fontWeight="500"
              textAnchor="middle"
            >
              Принципал · Покупатель
            </text>
          </motion.g>

          <motion.g
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.8 }}
          >
            <rect
              x="660"
              y="275"
              width="220"
              height="50"
              rx="10"
              fill="rgb(255 255 255 / 0.05)"
              stroke="rgb(255 255 255 / 0.18)"
              strokeWidth="1.5"
            />
            <text
              x="770"
              y="306"
              fill="rgb(226 232 240)"
              fontSize="14"
              fontWeight="500"
              textAnchor="middle"
            >
              Поставщик
            </text>
          </motion.g>
        </svg>
      </motion.div>

      <div className="flex flex-wrap gap-2">
        {chips.map(([k, v], i) => (
          <motion.div
            key={k}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE, delay: 1.9 + i * 0.08 }}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] backdrop-blur-sm"
          >
            <span className="text-gray-500">{k}: </span>
            <span className="font-medium text-gray-200">{v}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function SlideFeatures() {
  const modules = [
    {
      title: "ЛК Принципала",
      items: [
        "KYC/AML верификация",
        "Заявки на закупку",
        "Выбор КП от поставщиков",
        "Архив сделок и документов",
      ],
    },
    {
      title: "ЛК Поставщика",
      items: [
        "Верификация контрагента",
        "Каталог товаров и цен",
        "Размещение КП по заявкам",
        "Уведомления о новых заявках",
      ],
    },
    {
      title: "Документы",
      items: [
        "Агентский договор автоматом",
        "ЭДО: счета, УПД, накладные",
        "Отчёт агента и акт услуг",
        "Хранение и выгрузка",
      ],
    },
    {
      title: "Расчётный модуль",
      items: [
        "Выставление счетов",
        "Приём на номинальный счёт",
        "Платежи поставщику",
        "Уведомления о движении средств",
      ],
    },
  ]
  return (
    <div className="w-full max-w-3xl">
      <SlideHeader eyebrow="Слайд 05 · Функциональные возможности" />
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.12 }}
        className="mb-8 text-[32px] font-light leading-[1.05] tracking-tight text-white md:text-[40px]"
      >
        Четыре модуля{" "}
        <span className={`font-normal ${GRADIENT_TEXT}`}>одного сервиса</span>
      </motion.h2>
      <div className="grid gap-3 md:grid-cols-2">
        {modules.map((m, i) => (
          <motion.div
            key={m.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.25 + i * 0.09 }}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm"
          >
            <div className="mb-3 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400" />
              <h3 className="text-sm font-semibold text-white">{m.title}</h3>
            </div>
            <ul className="space-y-1.5">
              {m.items.map((it) => (
                <li
                  key={it}
                  className="flex gap-2 text-[12.5px] font-light leading-snug text-gray-400"
                >
                  <span className="text-gray-600">·</span>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function SlideDealTimeline() {
  const steps = [
    { t: "Агентский договор", s: "Get2B ↔ Принципал", color: "blue" },
    { t: "Заявка на платформе", s: "Принципал размещает заявку", color: "blue" },
    { t: "Коммерческие предложения", s: "Поставщики подают КП", color: "blue" },
    { t: "Выбор предложения", s: "Принципал акцептует КП", color: "blue" },
    { t: "Счёт на оплату", s: "Товар + агентская комиссия", color: "purple" },
    { t: "Оплата через номинальный счёт", s: "Принципал → Get2B", color: "purple" },
    { t: "Платёж поставщику", s: "Get2B → Поставщик", color: "orange" },
    { t: "Поставка товара", s: "Поставщик → Принципал", color: "orange" },
    { t: "Закрывающие документы", s: "Отчёт агента, УПД, акт", color: "purple" },
  ] as const

  const dotClass = (c: string) =>
    c === "blue"
      ? "bg-blue-400"
      : c === "purple"
        ? "bg-purple-400"
        : "bg-orange-400"

  return (
    <div className="w-full max-w-2xl">
      <SlideHeader eyebrow="Слайд 06 · Схема типовой сделки" />
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.12 }}
        className="mb-8 text-[32px] font-light leading-[1.05] tracking-tight text-white md:text-[40px]"
      >
        От договора{" "}
        <span className={`font-normal ${GRADIENT_TEXT}`}>до УПД</span>
      </motion.h2>
      <div className="relative">
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 1.2, ease: EASE, delay: 0.3 }}
          style={{ transformOrigin: "top" }}
          className="absolute left-[11px] top-1 h-[calc(100%-8px)] w-px bg-gradient-to-b from-blue-400/50 via-purple-400/50 to-orange-400/50"
        />
        <ul className="space-y-2.5">
          {steps.map((step, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: EASE, delay: 0.35 + i * 0.07 }}
              className="relative flex items-center gap-4 pl-7"
            >
              <span className="absolute left-0 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-zinc-950 text-[10px] font-semibold tabular-nums text-white">
                {i + 1}
              </span>
              <div className="flex flex-1 items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2 backdrop-blur-sm">
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-white">
                    {step.t}
                  </div>
                  <div className="text-[11px] font-light text-gray-500">
                    {step.s}
                  </div>
                </div>
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass(step.color)}`}
                />
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  )
}
