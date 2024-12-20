// const PROD = 'https://dev-api.301io.com/api';
// const LOCAL = 'http://localhost:3000/api'

// const isProd = true;
// export const CONFIG = {
//     BASE_URL: isProd ? PROD : LOCAL,
//     AUT_ERP_USER: 'authERPUser',
//     ERP_AUT_TOKEN: 'ERP_AUT_TOKEN',
//     APP_DOMAIN: isProd ? 'dev.301io.com' : 'erp.301io.com',
//     ASSET_LINK: `https://erp-api-assets.s3.amazonaws.com`
// }
const PROD = 'https://dev-api.301io.com/api';
const LOCAL = 'http://localhost:3000/api'

const isProd = true;
export const CONFIG = {
    BASE_URL: isProd ? PROD : LOCAL,
    AUT_ERP_USER: 'authERPUser',
    ERP_AUT_TOKEN: 'ERP_AUT_TOKEN',
    APP_DOMAIN: isProd ? 'dev.301io.com' : 'erp.301io.com',
    ASSET_LINK: `https://erp-api-assets.s3.amazonaws.com`
}