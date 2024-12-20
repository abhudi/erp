


import React, { useContext, useState } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { PostCall } from '../../../api/ApiKit';
import { useAppContext } from '../../../layout/AppWrapper';
import { LayoutContext } from '../../../layout/context/layoutcontext';
import { Link, useNavigate } from 'react-router-dom';

const ChangePasswordPage = () => {
    const { isLoading, setAlert, setLoading } = useAppContext();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const { layoutConfig, layoutState } = useContext(LayoutContext);

    const navigate = useNavigate();

    const handleOldPasswordChange = (event: any) => {
        setOldPassword(event.target.value);
    };

    const handleNewPasswordChange = (event: any) => {
        setNewPassword(event.target.value);
    };

    const updatePasswordClick = async () => {
        if (isLoading) {
            return;
        }

        if (oldPassword && newPassword) {
            setLoading(true);
            const response: any = await PostCall('/auth/change-password', { oldPassword, newPassword });
            setLoading(false);
            if (response.code === 'SUCCESS') {
                setAlert('success', 'Password changed successfully!');
                navigate('/login'); 
            } else {
                setAlert('error', response.message);
            }
        } else {
            setAlert('error', 'Please enter both old and new passwords.');
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
                        <img src="/images/301io.png" alt="hyper" height={50} className="mb-3" />
                        <div className="text-900 text-3xl font-medium mb-3">Welcome Back</div>
                        <span className="text-600 font-medium line-height-3">Change password</span>
                    </div>

                    <div>
                        <label htmlFor="oldPassword" className="block text-900 font-medium mb-2">Old Password</label>
                        <InputText
                            id="oldPassword"
                            type="password"
                            placeholder="Old password"
                            className="w-full mb-3"
                            value={oldPassword}
                            onChange={handleOldPasswordChange}
                        />

                        <label htmlFor="newpassword" className="block text-900 font-medium mb-2">New Password</label>
                        <InputText
                            id="newPassword"
                            type="password"
                            placeholder="New password"
                            className="w-full mb-3"
                            value={newPassword}
                            onChange={handleNewPasswordChange}
                        />

                        <div className="flex align-items-center justify-content-between mb-6">
                            <Link to="/login" className="font-medium no-underline ml-2 text-blue-500 text-right cursor-pointer">
                                Back to login?
                            </Link>
                        </div>

                        <Button
                            label="Update password"
                            icon={isLoading ? 'pi pi-spin pi-spinner' : 'pi pi-user'}
                            className="w-full"
                            onClick={updatePasswordClick}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChangePasswordPage;
