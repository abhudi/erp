


import { Avatar } from 'primereact/avatar';
import React, { useContext, useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { LayoutContext } from '../../../layout/context/layoutcontext';
import Link, { useNavigate } from 'react-router-dom';
import { PostCall, GetCall } from '../../../api/ApiKit';
import { useAppContext } from '../../../layout/AppWrapper';
import { ScrollPanel } from 'primereact/scrollpanel';
import { Panel } from 'primereact/panel';
import { CustomResponse, Routes } from '../../../types';
import RightSidePanel from '../../../components/RightSidePanel';

const UserProfilePage = () => {
    const navigate = useNavigate();
    const { isLoading, setAlert, setLoading, setScroll } = useAppContext();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confpassword, setconfpassword] = useState('');
    const { layoutConfig, layoutState } = useContext(LayoutContext);
    const [isPanelVisible, setPanelVisible] = useState<boolean | null>(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [user, setUser] = useState<any>(null);


    useEffect(() => {
        fetchData();
        setScroll(false);

        return () => {
            setScroll(true);
        };
    }, []);

    const [tableData1, setTableData1] = useState([
        { label: 'Display Name', value: '' },
        { label: 'First Name', value: '' },
        { label: 'Email', value: '' },
    ]);

    const [tableData2, setTableData2] = useState([
        { label: 'Role Name', value: '' },
        { label: 'Last Name', value: '' },
        { label: 'Phone', value: '' },
    ]);


    const fetchData = async () => {
        setLoading(true);
        const response: CustomResponse = await GetCall('/auth/profile');
        setLoading(false);

        if (response.code === 'SUCCESS') {
            const user = response.data;
            setUser(user);
            setTableData1([
                { label: 'Display Name', value: user.displayName },
                { label: 'First Name', value: user.firstName || 'N/A' },
                { label: 'Email', value: user.email || 'N/A' },
            ]);

            setTableData2([
                { label: 'Role Name', value: user.userRole },
                { label: 'Last Name', value: user.lastName || 'N/A' },
                { label: 'Phone', value: user.phone || 'N/A' },
            ]);




        } else {
            setUser([]);
        }
    };

    const Table = ({ data }: any) => (
        <table className="min-w-full border-collapse">
            <tbody className="bg-white">
                {data.map((row: any, index: any) => (
                    <tr key={index}>
                        <th className="px-4 py-3 text-left text-xs font-medium font-bold text-gray-500 uppercase tracking-wider" style={{ borderTop: '1px solid #d1d5db' }}>
                            {row.label}
                        </th>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900" style={{ borderTop: '1px solid #d1d5db' }}>
                            {row.value}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    // Change password
    const handleOldPasswordChange = (event: any) => {
        setOldPassword(event.target.value);
    };

    const handleNewPasswordChange = (event: any) => {
        const password = event.target.value;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && password.length >= 8) {
            setNewPassword(event.target.value);
        } else {

            setAlert('error', "Password must contain at least one uppercase letter, one lowercase letter, one number, one special character, and be at least 8 characters long.");
        }
    };

    const handleConfPasswordChange = (event: any) => {
        setconfpassword(event.target.value);
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
        {
            'p-input-filled': layoutConfig.inputStyle === 'filled',

        }
    );

    const openNew = () => {
        setPanelVisible(true);
    };

    const closeIcon = () => {
        setPanelVisible(null);
    };

    const headerTemplate = (options: any) => {
        const className = `${options.className} justify-content-space-between`;
        return (
            <div className={className}>
                <div className="flex align-items-center ">
                    <p className='sub-heading'>Change Password</p>
                </div>
            </div>
        );
    };

    const panelFooterTemplate = () => {
        return (
            <div className="c-border flex justify-content-end p-2">
                <Button label="Cancel" severity="secondary" text onClick={closeIcon} />
            </div>
        );
    };

    return (
        <div className="grid">
            <div className="col-12">
                <div className={`panel-container ${selectedProduct ? (layoutState.isMobile ? 'mobile-split' : 'split') : ''}`}>
                    {!layoutState.isMobile || !isPanelVisible ? (
                        <div className="left-panel">
                            <div className="flex justify-content-between p-4">
                                <span className="p-input-icon-left flex align-items-center">
                                    <h4 className='mb-0'>Profile</h4>
                                </span>
                            </div>
                            <div className="flex items-center gap-4 p-4">
                                <Avatar image="/images/profile.png" size="xlarge" shape="circle" />
                                <div>
                                    <h3 className="text-xl font-semibold">{user?.displayName || 'John Doe'}</h3>
                                    <p className="text-sm text-gray-500">{user?.userRole || 'admin'}</p>
                                </div>
                            </div>

                            <div className="w-full p-4 bg-white shadow-lg rounded-lg border border-gray-200">
                                <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center mb-6">
                                    <h5 className="m-0 text-lg font-semibold">About Me</h5>
                                    <div className='flex gap-5'>
                                        <span className="block mt-2 md:mt-0 p-input-icon-left">
                                            <Button label="Change Password" severity="secondary" onClick={openNew} />
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-wrap lg:flex-nowrap">
                                    <div className="w-full lg:w-1/2 p-0">
                                        <div className="overflow-x-auto">
                                            <Table data={tableData1} />
                                        </div>
                                    </div>
                                    <div className="w-full lg:w-1/2 p-0 lg:pl-4">
                                        <div className="overflow-x-auto">
                                            <Table data={tableData2} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    <RightSidePanel
                        isVisible={isPanelVisible!}
                        headerTemplate={headerTemplate}
                        footerTemplate={panelFooterTemplate}
                        closeIcon={closeIcon}
                        width={'30vw'}
                        content={<div>
                            <label htmlFor="oldPassword" className="block text-900 font-medium mb-2">Old Password</label>
                            <InputText
                                id="oldPassword"
                                type="password"  // Correct type
                                placeholder="Old password"
                                className="w-full mb-3"
                                value={oldPassword}
                                onChange={handleOldPasswordChange}
                            />

                            <label htmlFor="newPassword" className="block text-900 font-medium mb-2">New Password</label>
                            <InputText
                                id="newPassword"
                                type="password"  // Correct type
                                placeholder="New password"
                                className="w-full mb-3"
                                value={newPassword}
                                onChange={handleNewPasswordChange}
                            />

                            <label htmlFor="confPassword" className="block text-900 font-medium mb-2">Confirm Password</label>
                            <InputText
                                id="confPassword"
                                type="password"  // Ensure type is set to "password"
                                placeholder="Confirm password"
                                className="w-full mb-3"
                                value={confpassword}
                                onChange={handleConfPasswordChange}
                            />


                            <Button
                                label="Update password"
                                icon={isLoading ? 'pi pi-spin pi-spinner' : 'pi pi-user'}
                                className="w-full"
                                onClick={updatePasswordClick}
                            />
                        </div>}
                    />
                </div>
            </div>
        </div>
    );
};
export default UserProfilePage;