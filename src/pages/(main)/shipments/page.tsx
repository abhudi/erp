import React, { useContext, useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../../../layout/AppWrapper';
import { LayoutContext } from '../../../layout/context/layoutcontext';
import { Menu } from 'primereact/menu';
import { MultiSelect } from 'primereact/multiselect';
import CustomDataTable, { CustomDataTableRef } from '../../../components/CustomDataTable';
import { buildQueryParams, getRowLimitWithScreenHeight } from '../../../utils/uitl';
import { flatMap, get, groupBy, map, set } from 'lodash';
import { DeleteCall, GetCall, GetPdfCall, PutCall } from '../../../api/ApiKit';
import { CustomResponse, MasterCode, Shipment, ShipmentItem, Vendor } from '../../../types';
import Sidebar from '../../../components/Sidebar';
import { ACTIONS, constant } from '../../../utils/constant';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Dropdown } from 'primereact/dropdown';
import moment, { isMoment } from 'moment-timezone';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Panel } from 'primereact/panel';
import { Avatar } from 'primereact/avatar';
import { IconField } from 'primereact/iconfield';
import { Badge } from 'primereact/badge';
import ShipmentEditor from '../../../components/Editors/ShipmentEditor';

const defaultShipment: Shipment = {
    shipId: null,
    shipNumber: null,
    soId: null,
    companyId: null,
    packages: [],
    shipmentDate: null,
    approxDeliveryDate: null,
    deliveredDateTime: null,
    trackingTypeId: null,
    trackingId: null,
    trackingUrl: null,
    statusId: null,
    note: ''
}

const ShipmentsPage = () => {
    const initializedRef = useRef(false);
    const [searchParams] = useSearchParams();
    const { user, isLoading, setLoading, setScroll, setAlert } = useAppContext();
    const { layoutState } = useContext(LayoutContext);
    const navigate = useNavigate();
    const multiSelectRef = useRef<MultiSelect>(null);
    const containerRef = useRef(null);
    const [isShowSplit, setIsShowSplit] = useState<boolean>(false);
    const [isEditor, setEditor] = useState<boolean>(false);
    const [action, setAction] = useState<any>(null);
    const [isSubmitted, setSubmitted] = useState<boolean>(false);
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(getRowLimitWithScreenHeight());
    const [totalRecords, setTotalRecords] = useState<number | undefined>(undefined);
    const dataTableRef = useRef<CustomDataTableRef>(null);

    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [shipment, setShipmentDetails] = useState<Shipment>(defaultShipment);
    const [allVendors, setAllVendors] = useState<Vendor[]>([]);
    const [carriers, setCarriers] = useState<MasterCode[]>([]);
    const [statuses, setStatuses] = useState<MasterCode[]>([]);

    const panelRef = useRef<Panel>(null);
    const createMenuRef = useRef<Menu>(null);
    const createMenuItems: any[] = [
        {
            label: 'Delete Shipment',
            icon: 'pi pi-trash',
            command: () => {
                confirmDelete()
            }
        }
    ];

    useEffect(() => {
        fetchData();
        fetchCarriers();
        fetchShipStatus();

        setScroll(false);
        return () => {
            setScroll(true);
        };
    }, []);

    const handleClick = (_salePackage?: Shipment) => {
        if (_salePackage) {
            const newUrl = `/shipments?shipId=${_salePackage.shipId}`;
            navigate(newUrl, { replace: true });
            fetchShipDetails(_salePackage.shipId);
            setIsShowSplit(true);
        }
        else {
            navigate('/shipments', { replace: true });
        }
    };

    const showAddNew = () => {
        setSubmitted(false);
        setEditor(true);
        setShipmentDetails(defaultShipment);
    };

    const fetchData = async (params?: any) => {
        if (shipment.shipId) {
            fetchShipDetails(shipment.shipId)
        }

        if (!params) {
            params = { limit: limit, page: page };
        }
        params.include = 'so,status,trackingType,packages';
        const companyId = get(user, 'company.companyId');
        setLoading(true);
        const queryString = buildQueryParams(params);
        const response: CustomResponse = await GetCall(`/company/${companyId}/shipments?${queryString}`);
        if (response.code == 'SUCCESS') {
            setShipments(response.data);
            if (response.total) {
                setTotalRecords(response?.total);
            }
        } else {
            setShipments([]);
            setAlert('error', response.message);
        }
        setLoading(false);
    };

    const fetchShipDetails = async (shipId: any) => {
        let params: any = {
            filters: {
                shipId: +shipId
            },
            include: 'so,status,trackingType,packages,packages.items'
        };
        const companyId = get(user, 'company.companyId');
        setLoading(true);
        const queryString = buildQueryParams(params);
        const response: CustomResponse = await GetCall(`/company/${companyId}/shipments/${shipId}?${queryString}`);
        if (response.code == 'SUCCESS') {
            if (get(response.data[0], 'packages', []).length > 0) {
                set(response.data[0], 'packageIds', map(get(response.data[0], 'packages', []), 'packageId'))
            }
            setShipmentDetails(response.data[0]);
        } else {
            setShipmentDetails(defaultShipment);
            setAlert('error', response.message);
        }
        setLoading(false);
    };

    const fetchCarriers = async () => {
        if (!user?.company?.companyId) {
            return;
        }
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${user?.company?.companyId}/master-codes?codeType=${constant.SYSTEM_MSTR_CODE.shippingCarrier}`);
        if (response.code == 'SUCCESS') {
            setCarriers(response.data);
        } else {
            setCarriers([]);
        }
        setLoading(false);
    };

    const fetchShipStatus = async () => {
        if (!user?.company?.companyId) {
            return;
        }
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${user?.company?.companyId}/master-codes?codeType=${constant.SYSTEM_MSTR_CODE.shipStatus}`);
        if (response.code == 'SUCCESS') {
            setStatuses(response.data);
        } else {
            setStatuses([]);
        }
        setLoading(false);
    };

    const confirmDelete = (_salesPackage?: Shipment) => {
        if (!_salesPackage) {
            _salesPackage = shipment;
        }
        confirmDialog({
            className: 'confirm-dialog',
            message: "Do you really want to delete this Shipment?",
            header: "Confirmation",
            icon: "pi pi-exclamation-triangle text-red",
            position: 'top',
            accept: () => {
                if (_salesPackage) {
                    deleteShipment(_salesPackage)
                }
            },
        });
    }
    const deleteShipment = async (_salesPackage: Shipment) => {
        if (!user?.company?.companyId) {
            return;
        }
        setLoading(true);
        const response: CustomResponse = await DeleteCall(`/company/${user?.company?.companyId}/sales-orders/${_salesPackage.soId}/shipments/${_salesPackage.shipId}`);
        if (response.code == 'SUCCESS') {
            setIsShowSplit(false);
            fetchData()
            setAlert('success', 'Shipment deleted!')
        } else {
            setAlert('error', response.message)
        }
        setLoading(false);
    };

    const printDoc = async (shipId: any) => {
        setLoading(true);
        const response: any = await GetPdfCall(`/company/${user?.company?.companyId}/shipments/${shipId}/print`);
        if (response && response.code == 'FAILED') {
            setAlert('error', response.message);
        }
        setLoading(false);
    }

    const onRowSelect = async (perm: Shipment, action = ACTIONS.VIEW) => {
        setAction(action);
        if (action === ACTIONS.DELETE) {
            setIsShowSplit(true);
        }
        if (action === ACTIONS.EDIT) {
            setEditor(true);
            fetchShipDetails(perm.shipId)
        }

        if (action === ACTIONS.VIEW) {
            setIsShowSplit(true);
            handleClick(perm)
        }
    };

    const closeIcon = () => {
        setSubmitted(false);
        setIsShowSplit(false);
        handleClick();
    };

    const updateStatus = async (ship: Shipment, masterCodeId: any) => {
        setLoading(true);
        const response: CustomResponse = await PutCall(`/company/${user?.company?.companyId}/sales-orders/${ship.soId}/shipments/${ship.shipId}/status/${masterCodeId}`);
        if (response.code == 'SUCCESS') {
            fetchData();
            setAlert('success', 'Status Updated');
        } else {
            setAlert('error', response.message);
        }
        setLoading(false);
    }

    const renderStatus = (rowData: any) => {
        return (
            <Dropdown
                value={rowData.soStatusId || null}
                options={statuses}
                optionLabel="code"
                optionValue="masterCodeId"
                onChange={(e) => updateStatus(rowData, e.value)}
                className="dropdown-small w-full" checkmark={true}
            />
        );
    };
    const filterCarrierDropdown = (options: any) => (
        <Dropdown
            filter={true}
            value={options.value || null}
            options={carriers}
            optionLabel="code"
            optionValue="masterCodeId"
            onChange={(e) => options.filterApplyCallback(e.value)}
            placeholder="Select carrier"
            className="p-column-filter"
            showClear
            style={{ minWidth: '12rem' }}
        />
    );

    const statusDropdown = (options: any) => (
        <Dropdown
            filter={true}
            value={options.value || null}
            options={statuses}
            optionLabel="code"
            optionValue="masterCodeId"
            onChange={(e) => options.filterApplyCallback(e.value)}
            placeholder="Select Status"
            className="p-column-filter"
            showClear
            style={{ minWidth: '12rem' }}
        />
    );

    const renderProduct = (item: Shipment | null) => {
        return <div>
            <label className='text-900'>{get(item, 'pItems.0.pItem.product.name')}</label><br />
            <span className='text-sm'>SKU: {get(item, 'skuId')}</span>
        </div>
    };

    const grouped = groupBy(flatMap(get(shipment, 'packages', []), obj => get(obj, 'package.items', [])), 'skuId');
    const groupData = Object.keys(grouped).map((key) => ({
        skuId: key,
        quantity: grouped[key].length,
        pItems: grouped[key],
    }));

    const headerTemplate = (options: any) => {
        const className = `${options.className} justify-content-space-between`;

        return (
            <div className={className} onClick={() => panelRef.current?.toggle(undefined)}>
                <div className="flex align-items-center gap-2">
                    <span className="font-bold">Packages <Badge value={get(shipment, 'packages', []).length}></Badge></span>
                </div>
                <div>
                    {options.togglerElement}
                </div>
            </div>
        );
    };

    const shippingView = (<div>
        <div className='flex w-full absolute bg-ligthgrey br-top br-bottom z-2' style={{ top: '4rem', left: 0 }}>
            <div className='page-menu-item p-3 pl-5 br-right cursor-pointer' onClick={() => onRowSelect(shipment, ACTIONS.EDIT)}><i className="pi pi-pencil"></i> Edit</div>
            <div className='page-menu-item p-3 br-right cursor-pointer' onClick={() => printDoc(shipment?.shipId)}><i className="pi pi-file-pdf"></i> Pdf/Print</div>
            <div className='page-menu-item p-3 br-right cursor-pointer' onClick={(event) => { if (createMenuRef.current) { createMenuRef.current.toggle(event) } }}><i className="pi pi-ellipsis-v"></i></div>
            <Menu model={createMenuItems} popup ref={createMenuRef} id="popup_menu_left" />
        </div>
        <div className='my-7 pr-2'>
            <div className='grid justify-content-between p-2 mb-2'>
                <div>
                    <p>Billing Address</p>
                    <p className='text-blue cursor-pointer'><strong>{get(shipment, 'so.customer.name', '')}</strong></p>
                </div>
                <div className='text-right'>
                    <h4>Shipment</h4>
                    <p>Shipment # <strong>{shipment.shipNumber}</strong></p>
                </div>
            </div>

            <Panel ref={panelRef} collapsed={true} headerTemplate={headerTemplate} className='mb-4 bg-white ship-pkg-items' collapseIcon={<IconField className='pi pi-angle-down' />} expandIcon={<IconField className='pi pi-angle-right' />} toggleable>
                <div className="m-0 p-2">
                    <table className="w-full">
                        <DataTable
                            value={get(shipment, 'packages', [])}
                            style={{ height: '80%' }}
                        >
                            <Column header="Package #" field='package.pkgNumber' />
                            <Column header="Order Date" field='package.createdAt' body={(option) => moment(shipment.shipmentDate).format('MM/DD/YYYY')} />
                            <Column header="Total Qty" field='package.pkgNumbe' body={(option) => get(option, 'package.items', []).length} />
                        </DataTable>
                    </table>
                </div>
            </Panel>

            <div>
                <i className='pi pi-truck text-base'></i><span className='ml-3 font-bold text-lg'>Shipment Details</span>
                <div className='card mt-2 p-4'>
                    <div className='grid align-item-center'>
                        <p className='col-3 mb-0'>Date of Shipment:</p>
                        <p className='col-3 mb-0'>{moment(shipment.shipmentDate).format('MM/DD/YYYY')}</p>
                    </div>
                    {
                        isMoment(shipment.deliveredDateTime) ? <div className='grid'>
                            <p className='col-3 mb-0'>Delivered Date:</p>
                            <p className='col-3 mb-0'>{moment(shipment.deliveredDateTime).format('MM/DD/YYYY hh:mm A')}</p>
                        </div> : <></>
                    }
                    <div className='grid'>
                        <p className='col-3 mb-0'>Carrier:</p>
                        <p className='col-3 mb-0'>{get(shipment, 'trackingType.value')}</p>
                    </div>
                    <div className='grid'>
                        <p className='col-3 mb-0'>Tracking Status:</p>
                        <p className='col-3 mb-0'>{get(shipment, 'status.value')}</p>
                    </div>
                    <div className='grid'>
                        <p className='col-3 mb-0'>Tracking #:</p>
                        <p className='col-3 mb-0'><a href={shipment.trackingUrl} target='__blank' className='text-blue cursor-pointer'>{shipment.trackingId}</a></p>
                    </div>
                </div>
            </div>
            <div className="mt-4">
                <h5>Line Items</h5>
                <DataTable
                    scrollable
                    showGridlines
                    value={groupData}
                    selectionMode="single"
                    dataKey="productId"
                    scrollHeight="70%"
                    style={{ height: '80%' }}
                >
                    <Column header='#' body={(option, { rowIndex }) => rowIndex + 1} style={{ width: 50 }}></Column>
                    <Column field="skuId" header="Product & SKU" body={(data) => renderProduct(data)}></Column>
                    <Column field="quantity" header="Quantity" style={{ width: 80, textAlign: 'right' }}></Column>
                </DataTable>
            </div>
        </div>
    </div>)

    return (
        <>
            <div className="grid">
                <div className="col-12">
                    <div className={`panel-container ${isShowSplit ? (layoutState.isMobile ? 'mobile-split' : 'split') : ''}`}>
                        <div className="left-panel">
                            <div className="flex justify-content-between p-4">
                                <span className="p-input-icon-left flex align-items-center">
                                    <h4 className="mb-0">Shipments</h4>
                                </span>
                                <span className="flex gap-5">
                                    <div className=" ">
                                        <Button label="New" icon="pi pi-plus" size="small" className=" mr-2" onClick={showAddNew} />
                                    </div>
                                </span>
                            </div>
                            <CustomDataTable
                                ref={dataTableRef}
                                filter={true}
                                page={page}
                                limit={limit} // no of items per page
                                totalRecords={totalRecords} // total records from api response
                                isView={true}
                                isEdit={true} // show edit button
                                isDelete={true} // show delete button
                                extraButtons={[
                                    {
                                        icon: 'pi pi-file-pdf',
                                        onClick: (item) => {
                                            printDoc(item.shipId)
                                        }
                                    }
                                ]}
                                data={shipments}
                                columns={[
                                    {
                                        header: 'Date',
                                        field: 'shipmentDate',
                                        sortable: true,
                                        style: { minWidth: 120, maxWidth: 120 },
                                        body: (options: any) => isMoment(moment(options.soDate)) ? moment(options.soDate).format('MM/DD/YYYY') : ''
                                    },
                                    {
                                        header: 'Shipment #',
                                        field: 'shipNumber',
                                        filter: true,
                                        sortable: true,
                                        bodyStyle: { minWidth: 150, maxWidth: 150 },
                                        filterPlaceholder: 'SHP Number',
                                        body: (options: any) => (<label className='text-blue cursor-pointer' onClick={() => onRowSelect(options, ACTIONS.VIEW)}>{options.shipNumber}</label>)
                                    },
                                    {
                                        header: 'Customer',
                                        field: 'vendorName',
                                        filter: true,
                                        filterPlaceholder: 'Customer',
                                        bodyStyle: { minWidth: 150, maxWidth: 150 }
                                    },
                                    {
                                        header: 'Package #',
                                        field: 'pkgNumber',
                                        filter: true,
                                        sortable: true,
                                        bodyStyle: { minWidth: 150, maxWidth: 150 },
                                        filterPlaceholder: 'Package #',
                                        body: (options: any) => (<label className='w-full block overflow-hidden text-overflow-ellipsis white-space-nowrap' title={options.pkgNumber}>{options.pkgNumber}</label>)
                                    },
                                    {
                                        header: 'Carrier',
                                        field: 'trackingTypeId',
                                        filter: true,
                                        sortable: true,
                                        bodyStyle: { minWidth: 150, maxWidth: 150 },
                                        filterPlaceholder: 'Carrier',
                                        body: (options: any) => options.trackingType || '',
                                        filterElement: filterCarrierDropdown
                                    },
                                    {
                                        header: 'Tracking #',
                                        field: 'trackingId',
                                        filter: true,
                                        sortable: true,
                                        bodyStyle: { minWidth: 150, maxWidth: 150 },
                                        filterPlaceholder: 'Tracking #',
                                        body: (options: any) => (<a href={options.trackingUrl} target='__blank' className='text-blue cursor-pointer'>{options.trackingId}</a>)
                                    },
                                    {
                                        header: 'Status',
                                        field: 'soStatusId',
                                        body: renderStatus,
                                        filter: true,
                                        filterElement: statusDropdown
                                    }
                                ]}
                                onLoad={(params: any) => fetchData(params)}
                                onView={(item: any) => onRowSelect(item, ACTIONS.VIEW)}
                                onEdit={(item: any) => onRowSelect(item, ACTIONS.EDIT)}
                                onDelete={(item: any) => confirmDelete(item)}
                            />
                        </div>
                        <Sidebar
                            isVisible={isShowSplit}
                            action={action}
                            width={'60vw'}
                            footerTemplate={ACTIONS.VIEW == action ? <></> : undefined}
                            title={shipment.shipNumber}
                            closeIcon={closeIcon}
                            content={shippingView}
                        />
                    </div>
                </div>
            </div>
            <ConfirmDialog appendTo={document.body} />
            <ShipmentEditor
                isVisible={isEditor}
                isEdit={shipment.shipId ? true : false}
                _shipment={shipment.shipId ? shipment : null}
                onClose={(isLoad: boolean) => {
                    setEditor(false);
                    if (isLoad) {
                        fetchData();
                    }
                }}
            />
        </>
    );
};

export default ShipmentsPage;