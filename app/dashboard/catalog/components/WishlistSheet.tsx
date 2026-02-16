'use client'

import Image from 'next/image'
import { Heart, ShoppingCart, X, Trash2, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { CatalogProduct, WishlistItem } from '@/lib/catalog/types'
import { formatPrice, getProductImage } from '@/lib/catalog/utils'

interface WishlistSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: WishlistItem[]
  onRemove: (productId: string) => void
  onClear: () => void
  onAddToCart: (product: CatalogProduct) => void
}

export function WishlistSheet({
  open,
  onOpenChange,
  items,
  onRemove,
  onClear,
  onAddToCart,
}: WishlistSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500 fill-current" />
            Избранное
            {items.length > 0 && (
              <Badge className="bg-red-500">{items.length}</Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Heart className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>Список избранного пуст</p>
              <p className="text-sm">Нажмите на сердечко, чтобы сохранить товар</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto py-4 space-y-3">
              {items.map(item => {
                const imageUrl = getProductImage(item.product)
                return (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-3 p-3.5 bg-gray-50/80 rounded-xl border border-gray-100"
                  >
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-1">
                        {item.product.name}
                      </h4>
                      <p className="text-sm text-orange-600 font-semibold">
                        {formatPrice(item.product.price, item.product.currency)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs shrink-0 rounded-lg border-orange-200 text-orange-600 hover:bg-orange-50"
                      onClick={() => onAddToCart(item.product)}
                    >
                      <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                      В проект
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                      onClick={() => onRemove(item.product.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>

            <div className="border-t pt-4">
              <Button variant="outline" className="w-full rounded-xl" onClick={onClear}>
                <Trash2 className="w-4 h-4 mr-2" />
                Очистить избранное
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default WishlistSheet
