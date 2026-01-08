const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;
const UPLOAD_URL = 'https://api.imgbb.com/1/upload';

export const imageService = {
    /**
     * Upload file lên ImgBB
     * @param file File ảnh cần upload
     * @returns URL ảnh đã upload
     */
    uploadImage: async (file: File): Promise<string> => {
        if (!IMGBB_API_KEY) {
            throw new Error('Chưa cấu hình VITE_IMGBB_API_KEY trong .env');
        }

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch(`${UPLOAD_URL}?key=${IMGBB_API_KEY}`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Lỗi khi upload ảnh lên ImgBB');
            }

            const result = await response.json();
            return result.data.url;
        } catch (error) {
            console.error('ImgBB Upload Error:', error);
            throw error;
        }
    },
};
