import React from 'react'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Eye, 
  MessageCircle, 
  ShoppingCart, 
  Star, 
  Package, 
  Clock, 
  DollarSign,
  Building2,
  Plus,
  TrendingUp,
  Award,
  Image as ImageIcon
} from "lucide-react"
import { motion } from "framer-motion"

interface ProductCardProps {
  product: any
  onViewDetails?: (productId: string) => void
  onRequestPrice?: (productId: string) => void
  onContactSupplier?: (supplierId: string) => void
}

// Категории товаров для отображения
const CATEGORIES = {
  "electronics": { name: "Электроника", icon: "💻", color: "bg-blue-50 text-blue-700 border-blue-200" },
  "textiles": { name: "Текстиль", icon: "🧵", color: "bg-purple-50 text-purple-700 border-purple-200" },
  "machinery": { name: "Оборудование", icon: "⚙️", color: "bg-orange-50 text-orange-700 border-orange-200" },
  "furniture": { name: "Мебель", icon: "🪑", color: "bg-amber-50 text-amber-700 border-amber-200" },
  "chemicals": { name: "Химия", icon: "🧪", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "food": { name: "Продукты", icon: "🍎", color: "bg-green-50 text-green-700 border-green-200" }
}

export default function ProductCard({ 
  product, 
  onViewDetails, 
  onRequestPrice, 
  onContactSupplier 
}: ProductCardProps) {
  const category = CATEGORIES[product.category as keyof typeof CATEGORIES] || CATEGORIES.electronics

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
    >
      <Card className="h-full hover:shadow-xl transition-all duration-300 border-gray-200 hover:border-gray-300 bg-white group overflow-hidden">
        {/* Изображение товара */}
        <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
          {(product.images && product.images.length > 0) ? (
            <img 
              src={product.images[0]} 
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                console.error(`❌ ОШИБКА ЗАГРУЗКИ ИЗОБРАЖЕНИЯ ТОВАРА ${product.name}:`, product.images[0]);
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`flex items-center justify-center h-full fallback-icon ${(product.images && product.images.length > 0) ? 'hidden' : ''}`}>
            <ImageIcon className="h-16 w-16 text-gray-300" />
          </div>
          
          {/* Наложение с категорией */}
          <div className="absolute top-3 left-3">
            <Badge variant="outline" className={`${category.color} backdrop-blur-sm bg-white/90`}>
              <span className="mr-1">{category.icon}</span>
              {category.name}
            </Badge>
          </div>
          
          {/* Рейтинг в правом верхнем углу */}
          {product.rating && (
            <div className="absolute top-3 right-3">
              <Badge variant="outline" className="bg-white/90 backdrop-blur-sm border-gray-200">
                <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                <span className="font-medium">{product.rating}</span>
              </Badge>
            </div>
          )}
        </div>

        <CardHeader className="pb-3">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
              {product.name}
            </h3>
            
            {/* Поставщик */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Building2 className="h-4 w-4" />
              <span className="line-clamp-1">{product.supplier || "Поставщик не указан"}</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-4">
          {/* Цена и MOQ */}
          <div className="space-y-2">
            {product.price && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1 text-gray-600">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">Цена</span>
                </div>
                <div className="font-semibold text-gray-900">
                  {product.price}
                </div>
              </div>
            )}
            
            {product.min_order && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1 text-gray-600">
                  <Package className="h-4 w-4" />
                  <span className="text-sm">MOQ</span>
                </div>
                <div className="text-sm text-gray-700">
                  {product.min_order}
                </div>
              </div>
            )}
            
            {product.orders_count && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1 text-gray-600">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm">Заказов</span>
                </div>
                <div className="text-sm text-gray-700">
                  {product.orders_count}
                </div>
              </div>
            )}
          </div>

          {/* Описание */}
          {product.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {product.description}
            </p>
          )}

          {/* Действия */}
          <div className="space-y-2 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails?.(product.id)}
                className="h-9 text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                Подробнее
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRequestPrice?.(product.id)}
                className="h-9 text-xs"
              >
                <DollarSign className="h-3 w-3 mr-1" />
                Цена
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onContactSupplier?.(product.supplier_id)}
                className="h-9 text-xs"
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                Связаться
              </Button>
              <Button
                size="sm"
                onClick={() => onRequestPrice?.(product.id)}
                className="h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-3 w-3 mr-1" />
                В проект
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
} 