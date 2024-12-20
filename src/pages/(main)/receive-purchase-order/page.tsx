


import React, { useContext, useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { useAppContext } from '../../../layout/AppWrapper';
import { LayoutContext } from '../../../layout/context/layoutcontext';
import { MultiSelect } from 'primereact/multiselect';
import { CustomResponse, MasterCode, poItem, PurchaseItem, PurchaseOrder, ReceivePurchaseOrder, Vendor } from '../../../types';
import { Dropdown } from 'primereact/dropdown';
import { GetCall, PostCall } from '../../../api/ApiKit';
import { filter, find, get, map, set, sumBy } from 'lodash';
import { constant } from '../../../utils/constant';
import { buildQueryParams, getRowLimitWithScreenHeight } from '../../../utils/uitl';
import CustomDataTable, { CustomDataTableRef } from '../../../components/CustomDataTable';
import { receivepurchaseItem } from '../../../types/forms';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import moment from 'moment-timezone';

const ACTIONS = {
    ADD: 'add',
    EDIT: 'edit',
    VIEW: 'view',
    DELETE: 'delete'
};

const ReceivePurchaseOrderPage = () => {
    const { user, isLoading, setLoading, setScroll, setAlert } = useAppContext();
    const { layoutState } = useContext(LayoutContext);
    const navigate = useNavigate();
    const [pos, setPOs] = useState<ReceivePurchaseOrder[]>([]);
    const [selectedPO, setSelectedPO] = useState<ReceivePurchaseOrder | null>(null);

    const [allVendors, setAllVendors] = useState<Vendor[]>([]);
    const [statuses, setStatuses] = useState<MasterCode[]>([]);
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(getRowLimitWithScreenHeight());
    const [totalRecords, setTotalRecords] = useState<number | undefined>(undefined);
    const dataTableRef = useRef<CustomDataTableRef>(null);

    const [items, setItems] = useState<receivepurchaseItem[]>([]);

    useEffect(() => {
        setScroll(false);
        fetchData();

        fetchAllVendors();
        fetchPOStatus();
        return () => {
            setScroll(true);
        };
    }, []);

    const handleClick = (_po?: any) => {
        if (_po) {
            const newUrl = `/receive-purchase-order/${_po.poId}`;
            navigate(newUrl);
        }
        else {
            navigate('/receive-purchase-order', { replace: true });
        }
    };

    const fetchData = async (params?: any) => {
        if (!params) {
            params = { limit: limit, page: page };
        }
        params.include = 'warehouse,vendor';
        const companyId = get(user, 'company.companyId');
        const queryString = buildQueryParams(params);
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${companyId}/receive-purchase-orders?${queryString}`);
        if (response.code == 'SUCCESS') {
            console.log('158', response.data)
            setPOs(response.data);
            if (response.total) {
                setTotalRecords(response?.total);
            }
        } else {
            setPOs([]);
            setAlert('error', response.message);
        }
        setLoading(false);
    };

    const fetchPOStatus = async () => {
        if (!user?.company?.companyId) {
            return;
        }
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${user?.company?.companyId}/master-codes?codeType=${constant.SYSTEM_MSTR_CODE.poStatus}`);
        if (response.code == 'SUCCESS') {
            setStatuses(response.data);
        } else {
            setStatuses([]);
        }
        setLoading(false);
    };

    const fetchAllVendors = async () => {
        if (!user?.company?.companyId) {
            return;
        }
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${user?.company?.companyId}/vendors?limit=500`);
        if (response.code == 'SUCCESS') {
            setAllVendors(response.data);
        } else {
            setAllVendors([]);
        }
        setLoading(false);
    };

    const receivePoHeader = () => {
        return (
            <div className="flex justify-content-between p-4">
                <span className="p-input-icon-left flex align-items-center">
                    <h4 className="mb-0">Received PO</h4>
                </span>
            </div>
        );
    };
    const receivepoHeader = receivePoHeader();

    const renderVendor = (item: any) => get(item, 'vendor.name');
    const renderStatus = (item: any) => get(item, 'status.code', '');
    const vendorDropdown = (options: any) => (
        <Dropdown
            filter
            value={options.value || null}
            options={allVendors}
            optionLabel="name"
            optionValue="vendorId"
            onChange={(e) => options.filterApplyCallback(e.value)}
            placeholder="Select vendor"
            className="p-column-filter"
            showClear
            style={{ minWidth: '12rem' }}
        />
    );
    const statusDropdown = (options: any) => (
        <Dropdown
            filter
            value={options.value || null}
            options={statuses}
            optionLabel="code"
            optionValue="masterCodeId"
            onChange={(e) => options.filterApplyCallback(e.value)}
            placeholder="Select status"
            className="p-column-filter"
            showClear
            style={{ minWidth: '12rem' }}
        />
    );

    return (
        <>
            <div className="grid">
                <div className="col-12">
                    {receivepoHeader}
                    <div className="upper-panel">
                        <CustomDataTable
                            ref={dataTableRef}
                            filter
                            page={page}
                            limit={limit} // no of items per page
                            totalRecords={totalRecords} // total records from api response
                            extraButtons={[
                                {
                                    icon: 'pi pi-cart-plus text-lg',
                                    onClick: (item) => handleClick(item)
                                }
                            ]}
                            data={pos}
                            columns={[
                                {
                                    header: 'Date',
                                    field: 'poDate',
                                    filter: true,
                                    sortable: true,
                                    bodyStyle: { minWidth: 150, maxWidth: 150 },
                                    body: (item) => moment(item.poDate).format('MM/DD/YYYY')
                                },
                                {
                                    header: 'Vendor',
                                    field: 'vendorId',
                                    body: renderVendor,
                                    filter: true,
                                    filterElement: vendorDropdown,
                                    filterPlaceholder: 'Search vendor'
                                },
                                {
                                    header: 'PO Number',
                                    field: 'poNumber',
                                    filter: true,
                                    sortable: true,
                                    filterPlaceholder: 'PO Number',
                                    body: (item) => <Link to={`/purchase-order?poId=${item.poId}`} className='text-blue'>{item.poNumber}</Link>
                                },
                                {
                                    header: 'Total Ordered',
                                    field: 'totalOrdered'
                                },
                                {
                                    header: 'Total Received',
                                    field: 'totalReceived'
                                },
                                {
                                    header: 'Status',
                                    field: 'statusId',
                                    body: renderStatus,
                                    filter: true,
                                    filterElement: statusDropdown
                                }
                            ]}
                            onLoad={(params: any) => fetchData(params)}
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

export default ReceivePurchaseOrderPage;
