import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedPriceProps {
  price: number;
  className?: string;
}

export function AnimatedPrice({ price, className }: AnimatedPriceProps) {
  const [displayPrice, setDisplayPrice] = useState(price || 0);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (price && price !== displayPrice && price > 0) {
      setIsUpdating(true);
      setDisplayPrice(price);
      
      const timer = setTimeout(() => {
        setIsUpdating(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [price]);

  if (!displayPrice || displayPrice === 0) {
    return <span className="font-mono font-medium text-gray-400">-</span>;
  }

  return (
    <motion.span 
      className={cn(
        "font-mono font-semibold transition-all duration-500",
        className || "text-gray-800",
        isUpdating ? "text-amber-600" : ""
      )}
      animate={{ 
        scale: isUpdating ? 1.02 : 1
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {displayPrice.toLocaleString()}원
    </motion.span>
  );
}

export default AnimatedPrice;
