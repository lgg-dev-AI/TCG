// src/utils/imageCompressor.ts

/**
 * Comprime y redimensiona imágenes automáticamente en el navegador usando HTML5 Canvas.
 * Reduce el peso de fotos de celular (de 3-8 MB) a 80-150 KB en formato WebP optimizado,
 * manteniendo nitidez cristalina en esquinas, bordes y centrado de las cartas.
 */
export async function compressImage(
  source: File | string,
  maxDimension = 1200,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    const handleLoad = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Redimensionar proporcionalmente si excede la dimensión máxima
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo inicializar el contexto 2D del Canvas.'));
          return;
        }

        // Suavizado de imagen para máxima nitidez de detalles
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(img, 0, 0, width, height);

        // Intentar exportar a WebP (soporte 98%+ de navegadores modernos)
        let outputDataUrl = canvas.toDataURL('image/webp', quality);
        
        // Si el navegador no soporta WebP, exportará PNG por default. En ese caso usamos JPEG.
        if (outputDataUrl.startsWith('data:image/png') && source instanceof File && source.type !== 'image/png') {
          outputDataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(outputDataUrl);
      } catch (err) {
        reject(err);
      }
    };

    img.onload = handleLoad;

    img.onerror = () => {
      reject(new Error('Error al cargar la imagen para compresión.'));
    };

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = (e.target?.result as string) || '';
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo de imagen.'));
      reader.readAsDataURL(source);
    }
  });
}
