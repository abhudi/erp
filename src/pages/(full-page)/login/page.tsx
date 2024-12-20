import React, { useContext, useEffect, useState } from 'react';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { get } from 'lodash';
import { useAppContext } from '../../../layout/AppWrapper';
import { Link, useNavigate } from 'react-router-dom';
import { PostCall } from '../../../api/ApiKit';
import { setAuthData } from '../../../utils/cookies';
import { LayoutContext } from '../../../layout/context/layoutcontext';

const LoginPage = () => {
    const { isLoading, setAlert, setLoading, setUser, setAuthToken, setDisplayName } = useAppContext();
    const [email, setEmail] = useState('sky@gmail.com');
    const [password, setPassword] = useState('erp3001');
    const [checked, setChecked] = useState(false);
    const { layoutConfig, layoutState } = useContext(LayoutContext);

    const navigate = useNavigate();

    const handleEmail = (event: any) => {
        setEmail(event.target.value);
    };

    const handlePassword = (event: any) => {
        setPassword(event.target.value);
    };

    const handleCheckboxChange = (e: any) => {
        setChecked(e.checked); // Update checked state
    };

    const loginClick = async () => {
        if (isLoading) {
            return;
        }

        if (email && password) {
            setLoading(true);
            const resoponse: any = await PostCall('/auth/sign-in', { email, password });
            setLoading(false);
            if (resoponse.code == 'SUCCESS') {
                console.log('login success');
                setAlert('success', 'Login success!!');
                setUser(resoponse.data);
                setAuthToken(resoponse.token);
                setAuthData(resoponse.token, resoponse.refreshToken, resoponse.data);
            } else if (resoponse.code == 'RESET_PASSWORD') {
                console.log('res', resoponse);
                setDisplayName(resoponse.name);
                setAlert('success', 'Please reset you password');
                navigate(`/reset-password?resetToken=${resoponse.resetToken}`);
            } else {
                setAlert('error', resoponse.message);
            }
        }
    };

    const containerClassName = classNames('surface-ground flex align-items-center justify-content-center min-h-screen  overflow-hidden', { 'p-input-filled': layoutConfig.inputStyle === 'filled' });
    return (
        <div className={containerClassName}>
            <div className="flex align-items-center justify-between w-full h-screen">
                <div className="img-box hidden md:flex justify-content-center align-items-center w-1/2 h-full">
                    <img src="/images/login.svg" alt="Login" className="w-full h-full object-cover" />
                </div>

                <div>
                    <div className="surface-card p-4 shadow-2 border-round w-full" style={{ minWidth: layoutState.isMobile ? 0 : 400 }}>
                        <div className="text-center mb-5">
                            {/* <img src="/images/301io.png" alt="hyper" height={50} className="mb-3" /> */}
                            <div className="text-900 text-3xl font-medium mb-3">Welcome Back</div>
                            {/* <span className="text-600 font-medium line-height-3">Don't have an account?</span> */}
                            {/* <a className="font-medium no-underline ml-2 text-blue-500 cursor-pointer">Create today!</a> */}
                        </div>

                        <div>
                            <label htmlFor="userEmail" className="block text-900 font-medium mb-2">
                                Email Address
                            </label>
                            <InputText id="userEmail" value={email} type="text" placeholder="Email address" className="w-full mb-3" onChange={handleEmail} />

                            <div className="flex align-items-center justify-content-between mb-2">
                                <div className="flex align-items-center">
                                    <label htmlFor="userPassword" className="block text-900 font-medium ">
                                        Password
                                    </label>
                                </div>
                                <Link to="/forgot-userPassword" className="font-bold no-underline ml-2 text-pink-500 text-right cursor-pointer">
                                    Forgot your userPassword?
                                </Link>
                            </div>
                            <InputText id="userPassword" value={password} type="userPassword" placeholder="Password" className="w-full mb-3" onChange={handlePassword} />

                            <div className="flex flex-wrap justify-content-left gap-3 mb-2">
                                <div className="flex align-items-center mb-2">
                                    <Checkbox
                                        inputId="rememberme"
                                        name="rememberme"
                                        value="rememberme"
                                        onChange={handleCheckboxChange}
                                        checked={checked} // Make sure `checked` is a boolean
                                        className="p-checkbox-checked:bg-pink-500"
                                        style={{ width: '25px', height: '20px' }}
                                    />
                                    <label htmlFor="ingredient1" className="ml-2">
                                        Remember Me
                                    </label>
                                </div>
                            </div>

                            <Button label="Login" icon={isLoading ? 'pi pi-spin pi-spinner' : 'pi pi-user'} className="w-full" onClick={loginClick} />

                            <div className="flex align-items-center justify-content-center mb-6 mt-3 ">
                                <Link to="/forgot-userPassword" className="font-medium no-underline ml-2  text-center cursor-pointer">
                                    <label className="" htmlFor="">
                                        Dont have an Account?
                                    </label>
                                    <span className="text-pink-500 font-bold"> Sign Up Here</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
