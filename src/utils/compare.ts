// Kiểm tra object

const isObject = (item: any): boolean => {
    return (item && typeof item === 'object' && !Array.isArray(item));
};

// So sánh sâu (Deep compare)

export const areValuesEqual = (val1: any, val2: any): boolean => {
    // Trim chuỗi
    if (typeof val1 === 'string' && typeof val2 === 'string') {
        return val1.trim() === val2.trim();
    }

    // So sánh trực tiếp
    if (val1 === val2) return true;

    // Khác loại hoặc null
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

    // Không bằng
    return false;
};
