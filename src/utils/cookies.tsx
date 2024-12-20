import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

const options = {
    path: '/',
    sameSite: 'None'
};

const isTokenValid = (userToken: string) => {
    if (!userToken) return false;
    const decoded = jwtDecode(userToken);
    if (decoded && decoded.exp) {
        const currentTime = Date.now() / 1000; // Convert to seconds
        return decoded && decoded.exp > currentTime ? decoded : false; // Check if the token is expired
    }
    return false;
};

const getDomain = (): string => {
    const hostname = window.location.host;
    if (hostname.indexOf('localhost') > -1) {
        return hostname;
    }
    const parts = hostname.split('.');
    if (parts.length > 2) {
        return `${parts.slice(-2).join('.')}`;
    }
    return `${parts.join('.')}`;
};

const setAuthData = (token: string, refreshToken: string, userDetails: any) => {
    const domain: string = getDomain();
    const option: any = {
        path: '/',
        secure: true,
        sameSite: 'None'
    };

    if (domain.indexOf('localhost') == -1) {
        option.domain = `.${domain}`;
    }
    Cookies.set('authToken', token, option);
    Cookies.set('authRefreshToken', refreshToken, option);
    Cookies.set('userDetails', JSON.stringify(userDetails), option);
};

const setUserDetails = (userDetails: any) => {
    const domain: string = getDomain();
    const option: any = {
        path: '/',
        secure: true,
        sameSite: 'None'
    };

    if (domain.indexOf('localhost') == -1) {
        option.domain = `.${domain}`;
    }
    Cookies.set('userDetails', JSON.stringify(userDetails), option);
};

const getAuthToken = (): string => {
    return Cookies.get('authToken') || '';
};

const getRefreshToken = (): string | undefined => {
    return Cookies.get('authRefreshToken');
};

const getUserDetails = (): any => {
    const domain = getDomain();
    const userDetails = Cookies.get('userDetails');
    return userDetails ? JSON.parse(userDetails) : null;
};

const removeAuthData = () => {
    const domain: string = getDomain();
    const option: any = {
        path: '/',
        secure: true,
        sameSite: 'None'
    };

    if (domain.indexOf('localhost') == -1) {
        option.domain = `.${domain}`;
    }
    Cookies.remove('authToken', option);
    Cookies.remove('authRefreshToken', option);
    Cookies.remove('userDetails', option);
};

export {
    isTokenValid,
    setAuthData,
    setUserDetails,
    getAuthToken,
    getRefreshToken,
    getUserDetails,
    removeAuthData
};
