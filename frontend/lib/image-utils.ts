function getExifOrientation(file: File): Promise<number> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const view = new DataView(e.target?.result as ArrayBuffer);
      
      if (view.getUint16(0, false) !== 0xFFD8) {
        resolve(1);
        return;
      }
      
      const length = view.byteLength;
      let offset = 2;
      
      while (offset < length) {
        if (offset + 2 > length) {
          resolve(1);
          return;
        }
        
        const marker = view.getUint16(offset, false);
        offset += 2;
        
        if (marker === 0xFFE1) {
          if (offset + 2 > length) {
            resolve(1);
            return;
          }
          
          const exifLength = view.getUint16(offset, false);
          
          if (offset + exifLength > length) {
            resolve(1);
            return;
          }
          
          if (view.getUint32(offset + 2, false) !== 0x45786966) {
            resolve(1);
            return;
          }
          
          const tiffOffset = offset + 8;
          
          if (tiffOffset + 2 > length) {
            resolve(1);
            return;
          }
          
          const little = view.getUint16(tiffOffset, false) === 0x4949;
          
          if (tiffOffset + 4 > length) {
            resolve(1);
            return;
          }
          
          const ifdOffset = view.getUint32(tiffOffset + 4, little);
          
          if (tiffOffset + ifdOffset + 2 > length) {
            resolve(1);
            return;
          }
          
          const tags = view.getUint16(tiffOffset + ifdOffset, little);
          
          for (let i = 0; i < tags; i++) {
            const entryOffset = tiffOffset + ifdOffset + 2 + (i * 12);
            
            if (entryOffset + 12 > length) {
              break;
            }
            
            if (view.getUint16(entryOffset, little) === 0x0112) {
              resolve(view.getUint16(entryOffset + 8, little));
              return;
            }
          }
          
          resolve(1);
          return;
        } else if ((marker & 0xFF00) !== 0xFF00) {
          break;
        } else {
          if (offset + 2 > length) {
            resolve(1);
            return;
          }
          offset += view.getUint16(offset, false);
        }
      }
      
      resolve(1);
    };
    
    reader.onerror = () => resolve(1);
    reader.readAsArrayBuffer(file.slice(0, 65536));
  });
}

async function normalizeImageOrientation(file: File): Promise<{
  normalizedFile: File;
  previewBase64: string;
}> {
  const orientation = await getExifOrientation(file);
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      let width = img.width;
      let height = img.height;
      
      if (orientation >= 5 && orientation <= 8) {
        [width, height] = [height, width];
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      switch (orientation) {
        case 2:
          ctx.transform(-1, 0, 0, 1, width, 0);
          break;
        case 3:
          ctx.transform(-1, 0, 0, -1, width, height);
          break;
        case 4:
          ctx.transform(1, 0, 0, -1, 0, height);
          break;
        case 5:
          ctx.transform(0, 1, 1, 0, 0, 0);
          break;
        case 6:
          ctx.transform(0, 1, -1, 0, height, 0);
          break;
        case 7:
          ctx.transform(0, -1, -1, 0, height, width);
          break;
        case 8:
          ctx.transform(0, -1, 1, 0, 0, width);
          break;
        default:
          break;
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
