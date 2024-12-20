import { get } from "lodash";
import { removeAuthData } from "../utils/cookies";

const parseError = async (error: any) => {
    console.log('error', error.code)
    if (error.response && error.response.data && error.response.data.code) {
        error.code = error.response.data.code;
        if (error.response.data.code === 'AUTH_FAILED') {
            return await authFailed();
        }
        if (get(error, 'response.data.message') || get(error, 'response.data.error')) {
            let msg = get(error, 'response.data.message') ? get(error, 'response.data.message') : get(error, 'response.data.error');
            return { code: error.response.data.code, msg: msg };
        }
        else {
            return { code: error.response.data.code, msg: 'Failed to reach server' };
        }
    }
    else if (error.code === 'AUTH_FAILED') {
        return await authFailed();
    }
    return {
        code: 'TIMEOUT',
        msg: 'Timeout'
    };;
}


const authFailed = async () => {
    await removeAuthData()
    return {
        code: 'AUTH_FAILED',
        msg: 'AUTH_FAILED'
    };
}

export {
    parseError,
    authFailed
}