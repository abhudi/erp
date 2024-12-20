import { CONFIG } from "../config/config";

export const validateSubdomain = (subdomain: string) => {
    const subdomainLower = subdomain.toLowerCase();
    const subdomainRegex = /^[a-z0-9-]{3,63}$/;

    // List of reserved subdomain names (lowercase)
    const reservedNames = ['admin', 'user', 'erp', 'localhost', 'local', 'login', 'reset', 'change', 'example'];

    // Check if the subdomain matches the regex
    if (!subdomainRegex.test(subdomain)) {
        return false;
    }

    // Check if the subdomain does not start or end with a hyphen
    if (subdomainLower.startsWith('-') || subdomainLower.endsWith('-')) {
        return false;
    }

    // Check if the subdomain is one of the reserved names
    if (reservedNames.includes(subdomainLower)) {
        return false;
    }

    return true;
};

export const validateName = (firstName: string, key?: string) => {
    const namePattern = /^[a-zA-Z\s'-.]+$/;
    if (typeof firstName !== 'string' || firstName.trim() === '') {
        return false;
    }
    if (!namePattern.test(firstName)) {
        return false;
    }
    return true;
};
export const validatePhoneNumber = (phoneNumber: string) => {
    const phonePattern = /^[0-9]{10}$/; // Pattern that allows only 10 digits
    if (typeof phoneNumber !== 'string' || phoneNumber.trim() === '') {
        return false;
    }
    if (!phonePattern.test(phoneNumber)) {
        return false;
    }
    return true;
};
export const validateZipNumber = (phoneNumber: string) => {
    const phonePattern = /^[0-9]{5,6}$/; // Pattern that allows only 10 digits
    if (typeof phoneNumber !== 'string' || phoneNumber.trim() === '') {
        return false;
    }
    if (!phonePattern.test(phoneNumber)) {
        return false;
    }
    return true;
};
export const validateCountryCode = (countryCode: string) => {
    const countryCodePattern = /^\+[0-9]{1,3}$/; // Pattern that allows + followed by 1 to 3 digits
    if (typeof countryCode !== 'string' || countryCode.trim() === '') {
        return false;
    }
    if (!countryCodePattern.test(countryCode)) {
        return false;
    }
    return true;
};

export const validateEmail = (email: string) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof email !== 'string' || email.trim() === '') {
        return false;
    }
    if (!emailPattern.test(email)) {
        return false;
    }
    return true;
};
export const validateNumberOfRacks = (noOfRacks: number) => {
    if (typeof noOfRacks !== 'string' || noOfRacks <= 0) {
        return false; // Invalid if not a positive number
    }
    if (noOfRacks > 50) {
        return false; // Invalid if more than 50
    }
    return true; // Valid
};

export const formatBytes = (bytes = 0, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const parseYouTubeID = (url: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[7].length === 11 ? match[7] : null;
};

export const formatString = (str = '') => {
    return str
        .toLowerCase() // Convert to lowercase
        .replace(/_/g, ' ') // Replace underscores with spaces
        .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize the first letter of each word
};

export const generateRandomId = () => {
    const timestamp = Date.now(); // Current timestamp in milliseconds
    const randomNum = Math.floor(Math.random() * 1000000); // Generate a random number
    return `${timestamp}-${randomNum}`;
};

// Function to get the logo URL
export const getCompanyLogo = (logo: string | undefined, fallback: string = '/images/301io.png') => {
    // Return fallback if logo is not defined
    if (!logo) {
        return fallback;
    }

    // Check if logo contains 'http' and return accordingly
    return logo.includes('http') ? logo : `${CONFIG.ASSET_LINK}${logo}`;
};

export const filterArray = (data: any[], filters: any) => {
    return data.filter((item) => {
        // Check global filter first
        if (filters.global && filters.global.value) {
            const globalValue = filters.global.value.toLowerCase();
            if (filters.global.matchMode === 'contains') {
                const containsGlobal = Object.values(item).some((value) => String(value).toLowerCase().includes(globalValue));
                if (!containsGlobal) return false;
            }
        }

        // Check field-specific filters
        for (const key in filters) {
            if (key === 'global') continue; // Skip global filter here

            const filter = filters[key];
            const itemValue = String(item[key] || '').toLowerCase();
            const filterValue = filter.value.toLowerCase();

            switch (filter.matchMode) {
                case 'contains':
                    if (!itemValue.includes(filterValue)) return false;
                    break;
                case 'startsWith':
                    if (!itemValue.startsWith(filterValue)) return false;
                    break;
                default:
                    return false;
            }
        }
        return true;
    });
};

export const buildQueryParams = (params: any) => {
    const query = new URLSearchParams();

    query.append('limit', (params.limit ? params.limit : 10) || 10);
    query.append('page', (params.page ? params.page : 1) || 1);

    for (const filterField in params.filters) {
        if (params.filters[filterField]) {
            query.append(`filters.${filterField}`, params.filters[filterField]);
        }
    }

    if (typeof params.include == 'object') {
        query.append('include', params.include.join(','));
    } else if (typeof params.include == 'string') {
        query.append('include', params.include);
    }

    for (const key in params) {
        if (Object.prototype.hasOwnProperty.call(params, key)) {
            const element = params[key];
            if (!['include', 'filters', 'limit', 'page'].includes(key) && element) {
                query.append(`${key}`, element);
            }
        }
    }

    return query.toString();
};

export const getRowLimitWithScreenHeight = ({ headerHeight = 250, footerHeight = 50 } = { headerHeight: 250, footerHeight: 50 }) => {
    const availableHeight = window.innerHeight - headerHeight - footerHeight;
    return Math.max(Math.floor(availableHeight / 50), 10);
};

export const validateString = (firstName: string, key?: string) => {
    const namePattern = /^[a-zA-Z0-9\-_()]+( [a-zA-Z0-9\-_()]+)*$/;
    if (typeof firstName !== 'string' || firstName.trim() === '') {
        return false;
    }
    if (!namePattern.test(firstName)) {
        return false;
    }
    return true;
};
