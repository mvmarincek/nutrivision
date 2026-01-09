async function normalizeImageOrientation(file: File): Promise<{
  normalizedFile: File;
  previewBase64: string;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      
      const previewBase64 = canvas.toDataURL('image/jpeg', 0.9);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          
          const normalizedFile = new File(
            [blob],
            file.name.replace(/\.[^/.]+$/, '.jpg'),
            { type: 'image/jpeg', lastModified: Date.now() }
          );
          
          resolve({ normalizedFile, previewBase64 });
        },
        'image/jpeg',
        0.9
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

export { normalizeImageOrientation };
