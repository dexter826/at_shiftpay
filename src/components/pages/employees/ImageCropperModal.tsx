import React, { useState } from 'react';
import Cropper from 'react-easy-crop';
import { Modal } from '../../ui/Modal';
import Button from '../../ui/Button';
import { getCroppedImg } from '../../../utils/cropImage';
import { useThemeStyles } from '../../../hooks/useThemeStyles';

interface ImageCropperModalProps {
    isOpen: boolean;
    onClose: () => void;
    image: string;
    onCropComplete: (file: File) => void;
}

const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
    isOpen,
    onClose,
    image,
    onCropComplete
}) => {
    const { textMutedClass, skeletonBgClass } = useThemeStyles();
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropAreaComplete = (_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleConfirm = async () => {
        try {
            const croppedImage = await getCroppedImg(image, croppedAreaPixels);
            if (croppedImage) {
                const file = new File([croppedImage], 'avatar.jpg', { type: 'image/jpeg' });
                onCropComplete(file);
                onClose();
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Modal
            title="Sửa hình ảnh"
            isOpen={isOpen}
            onClose={onClose}
            footer={
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={onClose} className="flex-1">
                        Hủy
                    </Button>
                    <Button onClick={handleConfirm} className="flex-1">
                        Xong
                    </Button>
                </div>
            }
        >
            <div className="space-y-4">
                <div className={`relative w-full h-64 ${skeletonBgClass} rounded-lg overflow-hidden`}>
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={onCropChange}
                        onCropComplete={onCropAreaComplete}
                        onZoomChange={onZoomChange}
                    />
                </div>

                <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                        <span className={textMutedClass}>Phóng to</span>
                        <span className={textMutedClass}>{Math.round(zoom * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-label="Phóng to"
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className={`w-full h-2 ${skeletonBgClass} rounded-lg appearance-none cursor-pointer accent-primary`}
                    />
                </div>

                <p className={`text-xs ${textMutedClass} text-center`}>
                    Kéo hình ảnh để canh chỉnh vùng hiển thị
                </p>
            </div>
        </Modal>
    );
};

export default ImageCropperModal;
