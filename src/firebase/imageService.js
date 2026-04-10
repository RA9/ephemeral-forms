const MAX_SIZE = 512 * 1024; // 512 KB (base64 inflates ~33%, keep Firestore doc reasonable)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_DIMENSION = 1200;

function resizeImage(file, maxDim) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width <= maxDim && height <= maxDim) {
        // No resize needed — read original
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }
      // Scale down
      if (width > height) {
        height = Math.round(height * (maxDim / width));
        width = maxDim;
      } else {
        width = Math.round(width * (maxDim / height));
        height = maxDim;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      // Use JPEG for smaller output, quality 0.8
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image.')); };
    img.src = url;
  });
}

export async function processImageFile(file) {
  if (!file) throw new Error('No file provided.');
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Only JPEG, PNG, WebP and GIF images are allowed.');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image must be under 5 MB.');
  }

  const dataUrl = await resizeImage(file, MAX_DIMENSION);

  // Check final base64 size
  const base64Length = dataUrl.length - dataUrl.indexOf(',') - 1;
  if (base64Length > MAX_SIZE * 1.37) {
    throw new Error('Image is too large even after resizing. Try a smaller image.');
  }

  return dataUrl;
}
