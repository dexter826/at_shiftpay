/**
 * Kiểm tra xem một giá trị có phải là object và không phải null.
 */
const isObject = (item: any): boolean => {
    return (item && typeof item === 'object' && !Array.isArray(item));
};

/**
 * So sánh sâu hai giá trị, hỗ trợ trim() cho chuỗi và xử lý object/mảng.
 */
export const areValuesEqual = (val1: any, val2: any): boolean => {
    // Trường hợp chuỗi: trim trước khi so sánh
    if (typeof val1 === 'string' && typeof val2 === 'string') {
        return val1.trim() === val2.trim();
    }

    // Trường hợp primitive khác hoặc cùng reference
    if (val1 === val2) return true;

    // Nếu một trong hai là null hoặc không thuộc cùng loại (object/array/primitive)
    if (val1 === null || val2 === null || typeof val1 !== typeof val2) return false;

    // So sánh mảng
    if (Array.isArray(val1) && Array.isArray(val2)) {
        if (val1.length !== val2.length) return false;
        for (let i = 0; i < val1.length; i++) {
            if (!areValuesEqual(val1[i], val2[i])) return false;
        }
        return true;
    }

    // So sánh Object
    if (isObject(val1) && isObject(val2)) {
        const keys1 = Object.keys(val1);
        const keys2 = Object.keys(val2);

        if (keys1.length !== keys2.length) return false;

        for (const key of keys1) {
            if (!Object.prototype.hasOwnProperty.call(val2, key)) return false;
            if (!areValuesEqual(val1[key], val2[key])) return false;
        }
        return true;
    }

    // Các trường hợp khác (undefined, number, boolean đã check ở val1 === val2)
    return false;
};
