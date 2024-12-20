// 

import React, { useContext, useState } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { LayoutContext } from '../../../layout/context/layoutcontext';
import { useAppContext } from '../../../layout/AppWrapper';
import { Link, useNavigate } from 'react-router-dom';
import { PostCall } from '../../../api/ApiKit';

const ForgotPasswordPage = () => {
    const { isLoading, setAlert, setLoading } = useAppContext(); 
    const [email, setEmail] = useState('');
    const { layoutConfig, layoutState } = useContext(LayoutContext);

    const location = useNavigate();

    const handleEmail = (event: any) => {
        setEmail(event.target.value);
    };

    const resetPasswordClick = async () => {
        if (isLoading) {
            return;
        }

        if (email) {
            setLoading(true);
            const response: any = await PostCall('/auth/forgot-password', { email });
            setLoading(false);
            if (response.code == 'SUCCESS') {
                console.log('reset password email sent');
                setAlert('success', 'Password reset email sent successfully!');
            } else {
                setAlert('error', response.message);
            }
        } else {
            setAlert('error', 'Please enter your email.');
        }
    };

    const containerClassName = classNames(
        'surface-ground flex align-items-center justify-content-center min-h-screen  overflow-hidden',
        { 'p-input-filled': layoutConfig.inputStyle === 'filled' }
    );

    return (
        <div className={containerClassName}>
            <div className="flex align-items-center justify-content-center w-60rem">
                <div className="surface-card p-4 shadow-2 border-round w-full" style={{ minWidth: layoutState.isMobile ? 0 : 400 }}>
                    <div className="text-center mb-5">
                        {/* <img src="/images/301io.png" alt="hyper" height={50} className="mb-3" /> */}
                        <div className="text-900 text-3xl font-medium mb-3">Welcome Back</div>
                        <span className="text-600 font-medium line-height-3">Forgot password</span>
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-900 font-medium mb-2">Email</label>
                        <InputText
                            id="email"
                            type="text"
                            placeholder="Email address"
                            className="w-full mb-3"
                            value={email}
                            onChange={handleEmail}
                        />

                        <div className="flex align-items-center justify-content-between mb-6">
                            <Link to="/login" className="font-medium no-underline ml-2 text-blue-500 text-right cursor-pointer">
                                Back to login?
                            </Link>
                        </div>

                        <Button
                            label="Reset password"
                            icon={isLoading ? 'pi pi-spin pi-spinner' : 'pi pi-user'}
                            className="w-full"
                            onClick={resetPasswordClick}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;

