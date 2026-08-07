'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Loader2, X, ArrowRight } from 'lucide-react';
import { searchProducts, Product } from '@/lib/supabase/queries/products';

interface SearchBarProps {
  locale: string;
  placeholder?: string;
  buttonText?: string;
  showButton?: boolean;
  autoFocus?: boolean;
  className?: string;
  inputClassName?: string;
  onSearchSubmit?: (query: string) => void;
}

export function SearchBar({
  locale,
  placeholder = 'Məhsul axtar...',
  buttonText = 'Axtar',
  showButton = true,
  autoFocus = false,
  className = '',
  inputClassName = '',
  onSearchSubmit
}: SearchBarProps) {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);

  const router = useRouter();
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Debounced live search
  React.useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults([]);
      setIsOpen(false);
      setIsLoading(false);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setIsOpen(true);

    const timer = setTimeout(async () => {
      try {
        const data = await searchProducts(trimmed, locale, 8);
        setResults(data);
        setHasSearched(true);
      } catch (err) {
        console.error('Autocomplete search exception:', err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, locale]);

  // Click outside listener
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsOpen(false);
    if (onSearchSubmit) {
      onSearchSubmit(trimmed);
    }
    router.push(`/${locale}/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSelectProduct = () => {
    setIsOpen(false);
    if (onSearchSubmit) {
      onSearchSubmit(query);
    }
  };

  const emptyMsg = locale === 'en' 
    ? 'No products found' 
    : locale === 'ru' 
    ? 'Товары не найдены' 
    : 'Nəticə tapılmadı';

  const searchingMsg = locale === 'en'
    ? 'Searching...'
    : locale === 'ru'
    ? 'Поиск...'
    : 'Axtarılır...';

  const seeAllMsg = locale === 'en'
    ? 'See all results'
    : locale === 'ru'
    ? 'Посмотреть все результаты'
    : 'Bütün nəticələri göstər';

  return (
    <div ref={containerRef} className={`relative flex items-center w-full ${className}`}>
      <form onSubmit={handleSubmit} className="relative flex items-center w-full">
        <Search className="absolute left-3.5 h-4 w-4 text-[#9CA3AF] pointer-events-none z-10" />
        
        <input
          type="search"
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim().length >= 2) setIsOpen(true);
          }}
          className={`w-full pl-10 ${showButton ? 'pr-24' : 'pr-9'} py-2.5 bg-[#F6F6F8] border border-[#E5E7EB] rounded-xl text-sm text-[#17181C] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#D8232A] focus:bg-white transition-all ${inputClassName}`}
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            className={`absolute ${showButton ? 'right-24' : 'right-3'} p-1 text-[#9CA3AF] hover:text-[#17181C] cursor-pointer`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {showButton && (
          <button
            type="submit"
            className="absolute right-2 px-4 py-1.5 bg-[#D8232A] hover:bg-[#B31B21] text-white text-xs font-black rounded-lg transition-colors cursor-pointer h-[34px] flex items-center justify-center shrink-0"
          >
            {buttonText}
          </button>
        )}
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-xl shadow-2xl z-[99999] overflow-hidden max-h-[420px] flex flex-col divide-y divide-[#F3F4F6] dark:divide-border animate-in fade-in slide-in-from-top-1 duration-150">
          {isLoading ? (
            <div className="p-4 flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-[#D8232A]" />
              <span>{searchingMsg}</span>
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="overflow-y-auto max-h-[340px] divide-y divide-[#F3F4F6] dark:divide-border">
                {results.map((product) => {
                  const productUrl = `/${locale}/product/${product.slug || product.id}`;
                  return (
                    <Link
                      key={product.id}
                      href={productUrl}
                      onClick={handleSelectProduct}
                      className="flex items-center gap-3 p-3 hover:bg-[#F9FAFB] dark:hover:bg-muted/50 transition-colors cursor-pointer group"
                    >
                      <div className="relative w-11 h-11 bg-white border border-[#E5E7EB] rounded-lg p-1 shrink-0 overflow-hidden flex items-center justify-center">
                        <Image
                          src={product.image_url}
                          alt={product.title || product.name || 'Product'}
                          fill
                          sizes="44px"
                          className="object-contain p-0.5 group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-[#17181C] dark:text-foreground group-hover:text-[#D8232A] transition-colors truncate">
                          {product.title || product.name}
                        </h4>
                        {product.brand && (
                          <p className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">
                            {product.brand}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-black text-[#D8232A]">
                          {product.price_azn} AZN
                        </div>
                        {product.compare_at_price_azn && product.compare_at_price_azn > product.price_azn && (
                          <div className="text-[10px] text-muted-foreground line-through font-semibold">
                            {product.compare_at_price_azn} AZN
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>

              <Link
                href={`/${locale}/search?q=${encodeURIComponent(query.trim())}`}
                onClick={handleSelectProduct}
                className="p-3 bg-[#FFF5F5] hover:bg-[#FFEBEB] text-[#D8232A] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>{seeAllMsg}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </>
          ) : (
            hasSearched && (
              <div className="p-4 text-center text-xs font-semibold text-muted-foreground">
                {emptyMsg}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
