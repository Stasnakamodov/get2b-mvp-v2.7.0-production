# ПРОМПТ ДЛЯ НОВОГО ЧАТА

Скопируй и вставь это в новый чат:

---

Мне нужно исправить функционал корзины в B2B каталоге. Сейчас корзина работает плохо - после добавления товара не показывает другие товары того же поставщика.

## Текущая проблема:
1. Добавляю товар в корзину от поставщика А
2. ВСЕ остальные товары становятся "Недоступно" (даже от поставщика А!)
3. Не вижу другие товары этого поставщика
4. Очень плохой UX

## Что должно быть:
После добавления товара в корзину:
1. Автоматически показывать ТОЛЬКО товары активного поставщика
2. Или хотя бы выделить/сгруппировать товары активного поставщика
3. Четко объяснить почему другие недоступны

## Файлы проекта:
```
/Users/user/Desktop/godplisgomvp-forvercel/
├── app/dashboard/catalog/page.tsx
├── components/catalog/ProductGridByCategory.tsx
├── src/features/cart-management/hooks/useCart.ts
```

## Текущая логика блокировки (useCart.ts):
```typescript
if (cart.length === 0 || activeSupplier === supplierId) {
  setActiveSupplier(supplierId)
  return true  // добавляем
} else {
  return false  // блокируем
}
```

## В ProductGridByCategory.tsx (строка 661):
```typescript
isDisabled={activeSupplier !== null &&
  product.supplier_name !== activeSupplier &&
  product.supplier_company_name !== activeSupplier &&
  !isProductInCart(product.id)}
```

## Нужно реализовать:

### ВАРИАНТ 1 (предпочтительный):
После добавления товара в корзину:
1. Функция `filterProducts()` должна фильтровать по `activeSupplier`
2. Показывать кнопку "Показать всех поставщиков" с предупреждением
3. Добавить счетчик товаров активного поставщика

### ВАРИАНТ 2:
Сгруппировать товары по поставщикам, выделить активного

### API для фильтрации:
`/api/catalog/products-by-category?supplier_id=XXX`

Поля товара:
- supplier_id
- supplier_name
- supplier_company_name

## Стек:
Next.js 15, React 18, TypeScript, Tailwind CSS, FSD архитектура

Помоги исправить эту проблему. Начни с анализа текущего кода и предложи решение.

---

**ВАЖНО:** В новом чате сначала попроси показать содержимое файлов если нужно, особенно `ProductGridByCategory.tsx` строки 250-290 где происходит фильтрация.