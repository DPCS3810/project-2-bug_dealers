export const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image()
        image.addEventListener('load', () => resolve(image))
        image.addEventListener('error', (error) => reject(error))
        image.setAttribute('crossOrigin', 'anonymous')
        image.src = url
    })

export function getRadianAngle(degreeValue) {
    return (degreeValue * Math.PI) / 180
}

export function rotateSize(width, height, rotation) {
    const rotRad = getRadianAngle(rotation)
    return {
        width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
        height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    }
}

/**
 * Cropping for react-image-crop
 * @param {string} imageSrc - base64/blob url
 * @param {object} pixelCrop - { x, y, width, height }
 * @param {number} rotation - degrees
 * @param {object} flip - { horizontal, vertical }
 */
export async function getCroppedImg(
    imageSrc,
    pixelCrop,
    rotation = 0,
    flip = { horizontal: false, vertical: false }
) {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
        return null
    }

    const rotRad = getRadianAngle(rotation)

    // Calculate bounding box of the rotated image
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
        image.width,
        image.height,
        rotation
    )

    // set canvas size to match the bounding box
    canvas.width = bBoxWidth
    canvas.height = bBoxHeight

    // translate canvas context to a central location to allow rotating and flipping around the center
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
    ctx.rotate(rotRad)
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1)
    ctx.translate(-image.width / 2, -image.height / 2)

    // draw rotated image
    ctx.drawImage(image, 0, 0)

    // croppedAreaPixels values are bounding-box relative
    // If no crop is defined, return the whole (rotated) image
    if (!pixelCrop || !pixelCrop.width || !pixelCrop.height) {
        return new Promise((resolve) => {
            canvas.toBlob((file) => {
                resolve(file)
            }, 'image/jpeg')
        })
    }

    // extract the cropped image using these values
    const data = ctx.getImageData(
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height
    )

    // set canvas width to final desired crop size - this will clear existing context
    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    // paste generated rotate image at the top left corner
    ctx.putImageData(data, 0, 0)

    // As Blob
    return new Promise((resolve, reject) => {
        canvas.toBlob((file) => {
            resolve(file)
        }, 'image/jpeg')
    })
}

export async function applyFilters(imageSrc, adjustments) {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;

    // Apply CSS filters
    const { brightness = 100, contrast = 100, saturation = 100, blur = 0 } = adjustments;
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px)`;

    ctx.drawImage(image, 0, 0);

    // Apply sharpness if needed
    if (adjustments.sharpness && adjustments.sharpness > 0) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const sharpened = applySharpen(imageData, adjustments.sharpness / 100);
        ctx.putImageData(sharpened, 0, 0);
    }

    // Apply vignette if needed
    if (adjustments.vignette && adjustments.vignette > 0) {
        applyVignette(ctx, canvas.width, canvas.height, adjustments.vignette / 100);
    }

    return new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg');
    });
}

function applySharpen(imageData, amount) {
    const data = imageData.data;
    const w = imageData.width;
    const h = imageData.height;
    const output = new ImageData(w, h);

    // Sharpening kernel
    const kernel = [
        0, -amount, 0,
        -amount, 1 + 4 * amount, -amount,
        0, -amount, 0
    ];

    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            for (let c = 0; c < 3; c++) {
                let sum = 0;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = ((y + ky) * w + (x + kx)) * 4 + c;
                        const kidx = (ky + 1) * 3 + (kx + 1);
                        sum += data[idx] * kernel[kidx];
                    }
                }
                const idx = (y * w + x) * 4 + c;
                output.data[idx] = Math.max(0, Math.min(255, sum));
            }
            const idx = (y * w + x) * 4;
            output.data[idx + 3] = 255; // Alpha
        }
    }

    return output;
}

function applyVignette(ctx, width, height, amount) {
    const gradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.max(width, height) / 2
    );

    gradient.addColorStop(0, `rgba(0, 0, 0, 0)`);
    gradient.addColorStop(0.5, `rgba(0, 0, 0, ${amount * 0.3})`);
    gradient.addColorStop(1, `rgba(0, 0, 0, ${amount * 0.8})`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
}
