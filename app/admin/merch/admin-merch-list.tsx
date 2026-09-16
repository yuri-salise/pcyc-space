'use client';

import React, { useState, useTransition, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { PriceTag } from '@/components/molecules/price-tag';
import { Pagination } from '@/components/ui/pagination';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { deleteProductAction } from '@/app/actions/products';
import type { Product } from '@/lib/db/schema/products';
import {
  Tote,
  Trash,
  ArrowSquareOut,
  PencilSimple,
  MagnifyingGlass,
  Warning,
  X,
  CircleNotch,
} from '@phosphor-icons/react/dist/ssr';
import { motion, AnimatePresence } from 'motion/react';

interface AdminMerchListProps {
  products: Product[];
}

const PAGE_SIZE = 8;

export function AdminMerchList({ products }: AdminMerchListProps) {
  const [filterTab, setFilterTab] = useState<'ALL' | 'ACTIVE' | 'PREORDER' | 'APPAREL' | 'ACCESSORIES'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 250);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteProductTarget, setDeleteProductTarget] = useState<Product | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  const { success, error } = useToast();

  // Compute counts
  const totalCount = products.length;
  const activeCount = products.filter((p) => p.isAvailable).length;
  const preorderCount = products.filter((p) => p.isPreorder).length;
  const apparelCount = products.filter((p) => (p.category || '').trim().toLowerCase() === 'apparel').length;
  const accessoriesCount = products.filter((p) => (p.category || '').trim().toLowerCase() === 'accessories').length;

  // Filter list with debounced search query and memoization to prevent unnecessary re-filtering
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const cat = (prod.category || '').trim().toLowerCase();
      if (filterTab === 'ACTIVE' && !prod.isAvailable) return false;
      if (filterTab === 'PREORDER' && !prod.isPreorder) return false;
      if (filterTab === 'APPAREL' && cat !== 'apparel') return false;
      if (filterTab === 'ACCESSORIES' && cat !== 'accessories') return false;

      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase();
        const name = prod.name.toLowerCase();
        const slug = prod.slug.toLowerCase();
        const desc = (prod.description || '').toLowerCase();
        return name.includes(q) || slug.includes(q) || desc.includes(q);
      }

      return true;
    });
  }, [products, filterTab, debouncedSearch]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * PAGE_SIZE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + PAGE_SIZE);

  const handleTabChange = (tab: 'ALL' | 'ACTIVE' | 'PREORDER' | 'APPAREL' | 'ACCESSORIES') => {
    setFilterTab(tab);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleDeleteSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!deleteProductTarget) return;

    const formData = new FormData(e.currentTarget);
    startDeleteTransition(async () => {
      const result = await deleteProductAction(formData);
      if (!result.success) {
        error(result.error || 'Unable to update this product.');
        return;
      }
      setDeleteProductTarget(null);
      success(result.message || 'Product removed.');
    });
  };

  return (
    <div className="space-y-4">
      {/* Tabs & Search Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#1b2117] p-2.5 rounded-2xl border border-[#e6dfcb] dark:border-[#323d2b] shadow-2xs">
        <div className="flex items-center gap-1.5 p-1 bg-[#f8f4e3] dark:bg-[#252e1f] rounded-xl overflow-x-auto">
          {(
            [
              { key: 'ALL', label: `All (${totalCount})` },
              { key: 'ACTIVE', label: `Active (${activeCount})` },
              { key: 'PREORDER', label: `Pre-Order (${preorderCount})` },
              { key: 'APPAREL', label: `Apparel (${apparelCount})` },
              { key: 'ACCESSORIES', label: `Accessories (${accessoriesCount})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={`relative px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap z-10 ${
                filterTab === tab.key
                  ? 'text-white dark:text-[#1b2117]'
                  : 'text-[#505748] dark:text-[#a3ab98] hover:text-[#2c3324] dark:hover:text-[#fefcf1]'
              }`}
            >
              {filterTab === tab.key && (
                <motion.div
                  layoutId="adminMerchTab"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  className="absolute inset-0 bg-[#2c3324] dark:bg-[#e0a861] rounded-lg z-[-1] shadow-xs"
                />
              )}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <MagnifyingGlass
            weight="bold"
            className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#707666] dark:text-[#a3ab98]"
          />
          <input
            type="text"
            placeholder="Search merchandise..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[#e6dfcb] dark:border-[#323d2b] bg-[#f8f4e3]/50 dark:bg-[#131710] focus:bg-white dark:focus:bg-[#1b2117] dark:text-[#fefcf1] focus:outline-none focus:ring-1 focus:ring-[#2c3324] dark:focus:ring-[#e0a861]"
          />
        </div>
      </div>

      {/* Merch Table / Card List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-serif">
                Merchandise Inventory ({filteredProducts.length})
              </CardTitle>
              <CardDescription>
                Catalog and inventory management for apparel, accessories, and study materials.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Tote weight="duotone" className="h-10 w-10 text-[#8a9180] mx-auto opacity-70" />
              <p className="text-sm font-semibold text-[#2c3324] dark:text-[#fefcf1]">
                {searchQuery ? 'No matching products found' : 'No items in this category'}
              </p>
              <p className="text-xs text-[#707666] dark:text-[#a3ab98]">
                {searchQuery ? 'Try adjusting your search terms.' : 'Add a new product to populate your catalog.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="divide-y divide-[#e6dfcb] dark:divide-[#323d2b]">
                <AnimatePresence mode="popLayout">
                  {paginatedProducts.map((prod) => {
                    const img =
                      prod.imageUrls && prod.imageUrls.length > 0
                        ? prod.imageUrls[0]
                        : '/images/logo/pcyc-transparent-logo.png';

                    return (
                      <motion.div
                        key={prod.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#f8f4e3]/50 dark:hover:bg-[#252e1f]/50 transition-colors px-3 rounded-xl"
                      >
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className="relative h-14 w-14 rounded-2xl bg-[#f8f4e3] dark:bg-[#252e1f] border border-[#e6dfcb] dark:border-[#323d2b] p-1 shrink-0 overflow-hidden flex items-center justify-center shadow-xs">
                            <Image
                              src={img}
                              alt={prod.name}
                              fill
                              className="object-contain"
                            />
                          </div>

                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-serif font-bold text-base text-[#2c3324] dark:text-[#fefcf1] truncate">
                                {prod.name}
                              </span>
                              <Badge variant="gold" size="sm">
                                {prod.category}
                              </Badge>
                              {prod.isPreorder && (
                                <Badge variant="warning" size="sm">
                                  Pre-Order
                                </Badge>
                              )}
                              <Badge variant={prod.isAvailable ? 'forest' : 'cream'} size="sm">
                                {prod.isAvailable ? 'Active' : 'Hidden'}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-[#707666] dark:text-[#a3ab98]">
                              <PriceTag price={prod.price} />
                              <span>•</span>
                              <span>Stock: {prod.stockQuantity} units</span>
                              <span>•</span>
                              <span className="text-[#9a6423] dark:text-[#f0be7c] font-mono">/merch/{prod.slug}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <Link
                            href={`/admin/merch/${prod.id}/edit`}
                            className="p-2 rounded-lg text-[#505748] dark:text-[#a3ab98] hover:bg-white dark:hover:bg-[#1b2117] hover:text-[#2c3324] dark:hover:text-[#fefcf1] border border-transparent hover:border-[#e6dfcb] dark:hover:border-[#323d2b] transition-all"
                            title="Edit Merchandise Item"
                          >
                            <PencilSimple weight="duotone" className="h-4 w-4" />
                          </Link>

                          <Link
                            href={`/merch/${prod.slug}`}
                            target="_blank"
                            className="p-2 rounded-lg text-[#505748] dark:text-[#a3ab98] hover:bg-white dark:hover:bg-[#1b2117] hover:text-[#2c3324] dark:hover:text-[#fefcf1] border border-transparent hover:border-[#e6dfcb] dark:hover:border-[#323d2b] transition-all"
                            title="Preview product page"
                          >
                            <ArrowSquareOut weight="bold" className="h-4 w-4" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => setDeleteProductTarget(prod)}
                            className="p-2 rounded-lg text-[#c0392b] dark:text-[#ef5350] hover:bg-red-50 dark:hover:bg-red-950/30 border border-transparent hover:border-red-200 dark:hover:border-red-800 transition-all cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash weight="duotone" className="h-4 w-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Universal Pagination */}
              <Pagination
                currentPage={activePage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
                totalItems={filteredProducts.length}
                pageSize={PAGE_SIZE}
                showCount={true}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Modal with archive fallback for products with order history */}
      <AnimatePresence>
        {deleteProductTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setDeleteProductTarget(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative z-10 bg-[#fefcf1] dark:bg-[#1b2117] border-2 border-[#c0392b]/30 dark:border-[#c0392b]/50 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-[#fdf2f2] dark:bg-[#2d1815] text-[#c0392b] dark:text-[#ef5350] border border-[#f5c6cb] dark:border-[#4d201b] shadow-xs">
                    <Warning weight="fill" className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-xl text-[#2c3324] dark:text-[#fefcf1]">
                      Remove Merchandise Item?
                    </h3>
                    <p className="text-xs text-[#707666] dark:text-[#a3ab98]">
                      Deletes unused items or archives items with orders
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteProductTarget(null)}
                  className="text-[#707666] dark:text-[#a3ab98] hover:text-[#2c3324] dark:hover:text-[#fefcf1] p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  <X weight="bold" className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#252e1f] border border-[#e6dfcb] dark:border-[#323d2b] text-xs text-[#505748] dark:text-[#a3ab98] space-y-3">
                <p>
                  You are about to remove{' '}
                  <strong className="text-[#2c3324] dark:text-[#fefcf1] font-bold">
                    {deleteProductTarget.name}
                  </strong>
                  from the catalog.
                </p>
                <p className="text-[#c0392b] dark:text-[#ef5350] font-semibold bg-[#fdf2f2] dark:bg-[#2d1815] p-3 rounded-xl border border-[#f5c6cb] dark:border-[#4d201b] leading-relaxed">
                  ⚠️ Products with existing orders are archived to preserve order history. Products without orders are permanently deleted.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isDeleting}
                  onClick={() => setDeleteProductTarget(null)}
                  className="rounded-xl px-4"
                >
                  Cancel
                </Button>

                <form onSubmit={handleDeleteSubmit}>
                  <input type="hidden" name="productId" value={deleteProductTarget.id} />
                  <Button
                    type="submit"
                    variant="destructive"
                    size="sm"
                    disabled={isDeleting}
                    className="gap-2 rounded-xl px-5 shadow-sm"
                  >
                    {isDeleting ? (
                      <>
                        <CircleNotch weight="bold" className="h-4 w-4 animate-spin" />
                        <span>Removing Product...</span>
                      </>
                    ) : (
                      <>
                        <Trash weight="bold" className="h-4 w-4" />
                        <span>Confirm Remove</span>
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
