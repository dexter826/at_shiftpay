export const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image()
        image.addEventListener('load', () => resolve(image))
        image.addEventListener('error', (error) => reject(error))
        image.setAttribute('crossOrigin', 'anonymous') // Xử lý lỗi CORS

        image.src = url
    })

export function getRadianAngle(degreeValue: number) {
    return (degreeValue * Math.PI) / 180
}

/**
 * Kích thước ảnh sau khi quay

 */
export function rotateSize(width: number, height: number, rotation: number) {
    const rotRad = getRadianAngle(rotation)

    return {
        width:
            Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
        height:
            Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    }
}

/**
 * Cắt ảnh thành Blob

 */
export async function getCroppedImg(
    imageSrc: string,
    pixelCrop: { x: number; y: number; width: number; height: number },
    rotation = 0,
    flip = { horizontal: false, vertical: false }
): Promise<Blob | null> {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
        return null
    }

    const rotRad = getRadianAngle(rotation)


    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
        image.width,
        image.height,
        rotation
    )

    canvas.width = bBoxWidth
    canvas.height = bBoxHeight


    ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
    ctx.rotate(rotRad)
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1)
    ctx.translate(-image.width / 2, -image.height / 2)


    ctx.drawImage(image, 0, 0)


    const data = ctx.getImageData(
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height
    )


    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height


    ctx.putImageData(data, 0, 0)


    return new Promise((resolve) => {
        const MAX_SIZE = 512;

        let targetWidth = pixelCrop.width;
        let targetHeight = pixelCrop.height;

        if (targetWidth > MAX_SIZE || targetHeight > MAX_SIZE) {
            if (targetWidth > targetHeight) {
                targetHeight = (MAX_SIZE / targetWidth) * targetHeight;
                targetWidth = MAX_SIZE;
            } else {
                targetWidth = (MAX_SIZE / targetHeight) * targetWidth;
                targetHeight = MAX_SIZE;
            }
        }

        const resizeCanvas = document.createElement('canvas');
        resizeCanvas.width = targetWidth;
        resizeCanvas.height = targetHeight;
        const resizeCtx = resizeCanvas.getContext('2d');
        
        if (resizeCtx) {
            resizeCtx.drawImage(canvas, 0, 0, pixelCrop.width, pixelCrop.height, 0, 0, targetWidth, targetHeight);
            resizeCanvas.toBlob((file) => {
                resolve(file);
            }, 'image/jpeg', 0.8);

        } else {
            canvas.toBlob((file) => {
                resolve(file);
            }, 'image/jpeg', 0.8);
        }
    })
}

