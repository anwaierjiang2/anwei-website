import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// 定义产品类型
interface Product {
  _id: string;
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  originalPrice: number;
  category: string;
  tags: string[];
  images: {
    main?: string;
    gallery?: string[];
  };
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  salesCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  taobaoLink: string;
}

interface ProductImageCarouselProps {
  product: Product;
}

const ProductImageCarousel: React.FC<ProductImageCarouselProps> = ({ product }) => {
  // 获取所有可用图片，主图优先
  const allImages: string[] = [];
  if (product.images.main) {
    allImages.push(product.images.main);
  }
  if (product.images.gallery && product.images.gallery.length > 0) {
    allImages.push(...product.images.gallery);
  }
  
  // 多张图片实现轮播效果
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // 图片加载状态
  const [imageLoaded, setImageLoaded] = useState<boolean[]>([]);
  const [errorImages, setErrorImages] = useState<boolean[]>([]);
  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);
  
  // 初始化图片加载状态
  useEffect(() => {
    setImageLoaded(Array(allImages.length).fill(false));
    setErrorImages(Array(allImages.length).fill(false));
  }, [allImages.length]);
  
  // 图片切换效果
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(prevIndex => 
        prevIndex === allImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);
    
    return () => clearInterval(interval);
  }, [allImages.length]);
  
  // 处理图片加载成功
  const handleImageLoad = (index: number) => {
    setImageLoaded(prev => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
  };
  
  // 处理图片加载失败
  const handleImageError = (index: number) => {
    setErrorImages(prev => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
    
    // 自动尝试使用备用图片
    setTimeout(() => {
      if (errorImages[index]) {
        // 如果是相对路径的本地上传图片，可以尝试使用绝对路径
        if (allImages[index]?.startsWith('/')) {
          const img = imgRefs.current[index];
          if (img) {
            // 尝试使用完整URL（假设服务器运行在5000端口）
            img.src = `http://localhost:5000${allImages[index]}`;
          }
        } else {
          // 如果是外部图片或占位图，可以尝试使用产品ID生成新的占位图
          const img = imgRefs.current[index];
          if (img) {
            img.src = `https://picsum.photos/400/300?random=${product._id}-fallback-${index}`;
          }
        }
      }
    }, 500);
  };
  
  // 验证图片URL格式
  const validateImageUrl = (url: string): string => {
    // 如果已经是完整URL，直接返回
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // 处理相对路径的图片
    if (url.startsWith('/')) {
      // 在开发环境，确保使用正确的服务器地址
      if (process.env.NODE_ENV === 'development') {
        return `http://localhost:5000${url}`;
      }
      // 在生产环境，使用相对路径
      return url;
    }
    
    // 其他情况，尝试作为相对路径处理
    return `/uploads/${url}`;
  };
  
  // 如果没有图片，使用占位图
  if (allImages.length === 0) {
    return (
      <div className="relative h-48 overflow-hidden bg-dark-900">
        <img
          src={`https://picsum.photos/400/300?random=${product._id}`}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>
    );
  }
  
  // 如果只有一张图片，直接显示
  if (allImages.length === 1) {
    const imageUrl = validateImageUrl(allImages[0]);
    
    return (
      <div className="relative h-48 overflow-hidden bg-dark-900">
        <img
          ref={el => imgRefs.current[0] = el}
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onLoad={() => handleImageLoad(0)}
          onError={() => handleImageError(0)}
        />
        {/* 加载指示器 */}
        {!imageLoaded[0] && !errorImages[0] && (
          <div className="absolute inset-0 flex items-center justify-center bg-dark-900/70">
            <div className="w-10 h-10 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
          </div>
        )}
        {/* 错误提示 */}
        {errorImages[0] && (
          <div className="absolute inset-0 flex items-center justify-center bg-dark-900/70">
            <span className="text-white/80">图片加载失败</span>
          </div>
        )}
      </div>
    );
  }
  
  // 多张图片的轮播实现
  return (
    <div className="relative h-48 overflow-hidden bg-dark-900">
      {allImages.map((image, index) => {
        const imageUrl = validateImageUrl(image);
        
        return (
          <motion.img
            key={index}
            ref={el => imgRefs.current[index] = el}
            src={imageUrl}
            alt={`${product.name} 图片 ${index + 1}`}
            className={`absolute w-full h-full object-cover transition-transform duration-500 group-hover:scale-110`}
            initial={false}
            animate={{
              opacity: index === currentImageIndex ? 1 : 0,
              zIndex: index === currentImageIndex ? 1 : 0,
              transition: {
                opacity: { duration: 0.5 }
              }
            }}
            onLoad={() => handleImageLoad(index)}
            onError={() => handleImageError(index)}
          />
        );
      })}
      {/* 图片指示器 */}
      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1.5">
        {allImages.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
            onClick={() => setCurrentImageIndex(index)}
          />
        ))}
      </div>
      {/* 加载指示器 - 针对当前显示的图片 */}
      {!imageLoaded[currentImageIndex] && !errorImages[currentImageIndex] && (
        <div className="absolute inset-0 flex items-center justify-center bg-dark-900/40">
          <div className="w-8 h-8 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default ProductImageCarousel;