import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

/**
 * Hook pour injecter des animations CSS sur web uniquement
 * @param animationId - Identifiant unique pour les animations de cette page
 */
export function useWebAnimations(animationId: string) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = `${animationId}-animations`;
      let styleElement = document.getElementById(styleId) as HTMLStyleElement;
      
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
      
      styleElement.textContent = `
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        [data-${animationId}-header] {
          animation: fadeInUp 0.6s ease-out;
        }
        
        [data-${animationId}-title] {
          animation: fadeInUp 0.6s ease-out 0.1s both;
        }
        
        [data-${animationId}-button] {
          animation: fadeInUp 0.6s ease-out 0.2s both;
        }
        
        [data-${animationId}-section-title] {
          animation: fadeInUp 0.6s ease-out 0.3s both;
        }
        
        [data-${animationId}-card] {
          animation: fadeInUp 0.5s ease-out both;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        [data-${animationId}-card]:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        }
        
        [data-${animationId}-item] {
          animation: fadeInUp 0.5s ease-out both;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        [data-${animationId}-item]:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
        }
        
        [data-${animationId}-empty-state] {
          animation: fadeIn 0.6s ease-out 0.4s both;
        }
        
        [data-${animationId}-loading] {
          animation: fadeIn 0.3s ease-out;
        }
        
        [data-${animationId}-message] {
          animation: fadeInUp 0.4s ease-out;
        }
        
        [data-${animationId}-filter] {
          animation: fadeInUp 0.4s ease-out both;
          transition: transform 0.15s ease;
        }
        
        [data-${animationId}-filter]:hover {
          transform: scale(1.05);
        }
      `;
      
      setIsMounted(true);
    } else {
      setIsMounted(true);
    }
  }, [animationId]);

  return {
    isMounted,
    getDataAttribute: (element: string) => Platform.OS === 'web' ? { [`data-${animationId}-${element}`]: true } : {},
  };
}
