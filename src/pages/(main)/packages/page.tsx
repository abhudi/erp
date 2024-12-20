import { useContext, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAppContext } from "../../../layout/AppWrapper";
import { LayoutContext } from "../../../layout/context/layoutcontext";
import { Button } from "primereact/button";
import { ACTIONS, constant } from "../../../utils/constant";
import { CustomResponse, MasterCode, Packages, Vendor } from "../../../types";
import { buildQueryParams, getRowLimitWithScreenHeight } from "../../../utils/uitl";
import { filter, get, groupBy, set, update } from "lodash";
import CustomDataTable, { CustomDataTableRef } from "../../../components/CustomDataTable";
import { DeleteCall, GetCall, GetPdfCall, PutCall } from "../../../api/ApiKit";
import { isMoment } from "moment-timezone";
import moment from "moment";
import { Dropdown } from "primereact/dropdown";
import PackageEditor from "../../../components/Editors/PackageEditor";
import Sidebar from "../../../components/Sidebar";
import { confirmDialog, ConfirmDialog } from "primereact/confirmdialog";
import { Menu } from "primereact/menu";
import { DataTable } from "primereact/datatable";
import { Column, ColumnBodyOptions } from "primereact/column";

const defaultPackage: Packages = {
    packageId: null,
    soId: null,
    pkgNumber: null,
    companyId: null,
    items: []
}

const PackagesPage = () => {
    const [searchParams] = useSearchParams();
    const { user, isLoading, setLoading, setScroll, setAlert } = useAppContext();
    const { layoutState } = useContext(LayoutContext);
    const navigate = useNavigate();

    const [isShowSplit, setIsShowSplit] = useState<boolean>(false);
    const [action, setAction] = useState<any>(null);
    const [isSubmitted, setSubmitted] = useState<boolean>(false);
    const [soSearch, setSOSearch] = useState<any>('');
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(getRowLimitWithScreenHeight());
    const [totalRecords, setTotalRecords] = useState<number | undefined>(undefined);
    const dataTableRef = useRef<CustomDataTableRef>(null);

    const [salesPackage, setSalePackage] = useState<Packages>(defaultPackage);
    const [salesPackages, setSalePackages] = useState<Packages[]>([]);
    const [isPackage, setShowPackage] = useState<boolean>(false)
    const [isShipment, setShowShipment] = useState<boolean>(false);

    const [allVendors, setAllVendors] = useState<Vendor[]>([]);
    const [carriers, setCarriers] = useState<MasterCode[]>([]);
    const [statuses, setStatuses] = useState<MasterCode[]>([]);

    const createMenuRef = useRef<Menu>(null);
    const createMenuItems: any[] = [
        {
            label: 'Delete Package',
            icon: 'pi pi-trash',
            command: () => {
                confirmDelete()
            }
        }
    ];

    const queryPackageId = searchParams.get('packageId');
    const initializedRef = useRef(false);
    useEffect(() => {
        const check = async () => {
            if (!initializedRef.current && queryPackageId) {
                initializedRef.current = true;
                let sampleSO = { ...defaultPackage };
                sampleSO.packageId = +queryPackageId;
                setAction(ACTIONS.VIEW);
                handleClick(sampleSO);
            }
        };
        check();
    }, [queryPackageId]);

    const showAddNew = () => {
        setSubmitted(false);
        setShowPackage(true)
        setSalePackage(defaultPackage);
    };

    useEffect(() => {
        fetchData();
        fetchAllVendors();
        fetchCarriers();
        fetchPKGStatus();

        setScroll(false);
        return () => {
            setScroll(true);
        };
    }, []);

    const handleClick = (_salePackage?: Packages) => {
        if (_salePackage) {
            const newUrl = `/packages?packageId=${_salePackage.packageId}`;
            navigate(newUrl, { replace: true });
            fetchPackageDetails(_salePackage.packageId);
            setIsShowSplit(true);
        }
        else {
            navigate('/packages', { replace: true });
        }
    };

    const fetchData = async (params?: any) => {
        if (!params) {
            params = { limit: limit, page: page };
        }
        params.include = 'so';
        const companyId = get(user, 'company.companyId');
        setLoading(true);
        const queryString = buildQueryParams(params);
        const response: CustomResponse = await GetCall(`/company/${companyId}/packages?${queryString}`);
        if (response.code == 'SUCCESS') {
            setSalePackages(response.data);
            if (response.total) {
                setTotalRecords(response?.total);
            }
        } else {
            setSalePackages([]);
            setAlert('error', response.message);
        }
        setLoading(false);
    };

    const fetchPackageDetails = async (packageId: any) => {
        let params: any = {
            filters: {
                packageId: packageId
            },
            include: 'so,items,so.items'
        };
        const companyId = get(user, 'company.companyId');
        setLoading(true);
        const queryString = buildQueryParams(params);
        const response: CustomResponse = await GetCall(`/company/${companyId}/packages?${queryString}`);
        if (response.code == 'SUCCESS') {
            setSalePackage(response.data[0]);
        } else {
            setSalePackage(defaultPackage);
            setAlert('error', response.message);
        }
        setLoading(false);
    };

    const fetchAllVendors = async () => {
        if (!user?.company?.companyId) {
            return;
        }
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${user?.company?.companyId}/vendors?filters.vendorType=isCustomer&limit=500`);
        if (response.code == 'SUCCESS') {
            setAllVendors(response.data);
        } else {
            setAllVendors([]);
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

    const fetchPKGStatus = async () => {
        if (!user?.company?.companyId) {
            return;
        }
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${user?.company?.companyId}/master-codes?codeType=${constant.SYSTEM_MSTR_CODE.pckStatus}`);
        if (response.code == 'SUCCESS') {
            setStatuses(response.data);
        } else {
            setStatuses([]);
        }
        setLoading(false);
    };

    const confirmDelete = (_salesPackage?: Packages) => {
        if (!_salesPackage) {
            _salesPackage = salesPackage;
        }
        confirmDialog({
            className: 'confirm-dialog',
            message: "Do you really want to delete this Package?",
            header: "Confirmation",
            icon: "pi pi-exclamation-triangle text-red",
            position: 'top',
            accept: () => {
                if (_salesPackage) {
                    deletePackage(_salesPackage)
                }
            },
        });
    }
    const deletePackage = async (_salesPackage: Packages) => {
        if (!user?.company?.companyId) {
            return;
        }
        setLoading(true);
        const response: CustomResponse = await DeleteCall(`/company/${user?.company?.companyId}/sales-orders/${_salesPackage.soId}/packaging/${_salesPackage.packageId}`);
        if (response.code == 'SUCCESS') {
            setShowPackage(false);
            setIsShowSplit(false);
            fetchData()
            setAlert('success', 'Package deleted!')
        } else {
            setAlert('error', response.message)
        }
        setLoading(false);
    };

    const printDoc = async (packageId: any) => {
        setLoading(true);
        const response: any = await GetPdfCall(`/company/${user?.company?.companyId}/packages/${packageId}/print`);
        console.log('response', response)
        if (response && response.code == 'FAILED') {
            setAlert('error', response.message);
        }
        setLoading(false);
    }

    const onRowSelect = async (perm: Packages, action = ACTIONS.VIEW) => {
        setAction(action);
        await setSalePackage(perm);
        if (action === ACTIONS.DELETE) {
            setShowPackage(true);
        }
        if (action === ACTIONS.EDIT) {
            setShowPackage(true);
            fetchPackageDetails(perm.packageId)
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

    const updateStatus = async (pack: Packages, masterCodeId: any) => {
        setLoading(true);
        const response: CustomResponse = await PutCall(`/company/${user?.company?.companyId}/packaging/${pack.packageId}/status/${masterCodeId}`);
        if (response.code == 'SUCCESS') {
            fetchData();
            setAlert('success', 'Status Updated');
        } else {
            setAlert('error', response.message);
        }
        setLoading(false);
    }

    const renderStatus = (rowData: Packages) => {
        return (
            <Dropdown
                value={rowData.statusId || null}
                options={statuses}
                optionLabel="code"
                optionValue="masterCodeId"
                onChange={(e) => updateStatus(rowData, e.value)}
                className="dropdown-small w-full" checkmark={true}
            />
        );
    };

    const renderVendor = (item: any) => get(item, 'so.customer.name');
    const vendorDropdown = (options: any) => (
        <Dropdown
            filter={true}
            value={options.value || null}
            options={allVendors}
            optionLabel="name"
            optionValue="vendorId"
            onChange={(e) => options.filterApplyCallback(e.value)}
            placeholder="Select customer"
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
            placeholder="Select status"
            className="p-column-filter"
            showClear
            style={{ minWidth: '12rem' }}
        />
    );

    const renderProduct = (item: Packages | null) => {
        return <div>
            <label className='text-900'>{get(item, 'pItems.0.pItem.product.name')}</label><br />
            <span className='text-sm'>SKU: {get(item, 'skuId')}</span>
        </div>
    };

    const grouped = groupBy(get(salesPackage, 'items', []), 'skuId');
    const groupData = Object.keys(grouped).map((key) => ({
        skuId: key,
        quantity: grouped[key].length,
        pItems: grouped[key],
    }));
    const packageView = (<>
        <div className='flex w-full absolute bg-ligthgrey br-top br-bottom z-2' style={{ top: '4rem', left: 0 }}>
            <div className='page-menu-item p-3 pl-5 br-right cursor-pointer' onClick={() => onRowSelect(salesPackage, ACTIONS.EDIT)}><i className="pi pi-pencil"></i> Edit</div>
            <div className='page-menu-item p-3 br-right cursor-pointer' onClick={() => printDoc(salesPackage?.packageId)}><i className="pi pi-file-pdf"></i> Pdf/Print</div>
            <div className='page-menu-item p-3 br-right cursor-pointer' onClick={(event) => { if (createMenuRef.current) { createMenuRef.current.toggle(event) } }}><i className="pi pi-ellipsis-v"></i></div>
            <Menu model={createMenuItems} popup ref={createMenuRef} id="popup_menu_left" />
        </div>
        <div className='pt-8 pr-2'>
            <div className='grid justify-content-between p-2'>
                <div>
                    <h4>PACKAGE</h4>
                    <p>Package # <strong>{salesPackage.pkgNumber}</strong></p>
                </div>
            </div>
            <div className="my-5">
                <table className="normal-table py-2">
                    <tr>
                        <td>
                            <div className="font-bold mb-1">Package#</div>
                            <div>{salesPackage.pkgNumber}</div>
                        </td>
                        <td>
                            <div className="font-bold mb-1">Order Date</div>
                            <div>{moment(get(salesPackage, 'so.soDate')).format('MM/DD/YYYY')}</div>
                        </td>
                        <td>
                            <div className="font-bold mb-1">Package Date</div>
                            <div>{moment(get(salesPackage, 'createdAt')).format('MM/DD/YYYY')}</div>
                        </td>
                        <td>
                            <div className="font-bold mb-1">Sales Order#</div>
                            <div><Link to={`/sales-orders?soId=${salesPackage.soId}`} className='text-blue cursor-pointer'>{get(salesPackage, 'so.soNumber', '')}</Link></div>
                        </td>
                        <td>
                            <div className="font-bold mb-1">Total Qty</div>
                            <div>{get(salesPackage, 'items', []).length}</div>
                        </td>
                    </tr>
                </table>
            </div>
            <div>
                <p>Billing Address</p>
                <p className='text-blue cursor-pointer'><strong>{get(salesPackage, 'so.customer.name', '')}</strong></p>
            </div>
            <div className="mt-4">
                <h5>Line Items</h5>
                <DataTable
                    scrollable
                    showGridlines
                    value={groupData}
                    selectionMode="single"
                    dataKey="productId"
                    className='table-line-item'
                    // onSelectionChange={(row: any) => onRowSelect(row.value, 'view')}
                    scrollHeight="70%"
                    style={{ height: '80%' }}
                >
                    <Column field="skuId" header="Product & SKU" body={(data) => renderProduct(data)}></Column>
                    <Column field="quantity" header="Quantity" style={{ width: 80, textAlign: 'right' }}></Column>
                </DataTable>
            </div>
        </div>
    </>)

    return (
        <>
            <div className="grid">
                <div className="col-12">
                    <div className={`panel-container ${isShowSplit ? (layoutState.isMobile ? 'mobile-split' : 'split') : ''}`}>
                        <div className="left-panel">
                            <div className="flex justify-content-between p-4">
                                <span className="p-input-icon-left flex align-items-center">
                                    <h4 className="mb-0">Packages</h4>
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
                                            printDoc(item.packageId)
                                        }
                                    }
                                ]}
                                data={salesPackages}
                                columns={[
                                    {
                                        header: 'Package Date',
                                        field: 'createdAt',
                                        sortable: true,
                                        style: { minWidth: 120, maxWidth: 120 },
                                        body: (options: Packages) => isMoment(moment(options.createdAt)) ? moment(options.createdAt).format('MM/DD/YYYY') : ''
                                    },
                                    {
                                        header: 'PKG Number',
                                        field: 'pkgNumber',
                                        filter: true,
                                        sortable: true,
                                        bodyStyle: { minWidth: 150, maxWidth: 150 },
                                        filterPlaceholder: 'PKG Number',
                                        body: (options: any) => (<label className='text-blue cursor-pointer' onClick={() => onRowSelect(options, ACTIONS.VIEW)}>{options.pkgNumber}</label>)
                                    },
                                    {
                                        header: 'Customer',
                                        field: 'vendorId',
                                        body: renderVendor,
                                        filter: true,
                                        filterElement: vendorDropdown,
                                        filterPlaceholder: 'Search customer'
                                    },
                                    // {
                                    //     header: 'Status',
                                    //     field: 'statusId',
                                    //     body: renderStatus,
                                    //     filter: true,
                                    //     filterElement: statusDropdown
                                    // }
                                ]}
                                onLoad={(params: any) => fetchData(params)}
                                onView={(item: any) => onRowSelect(item, ACTIONS.VIEW)}
                                onEdit={(item: any) => onRowSelect(item, ACTIONS.EDIT)}
                                onDelete={(item: any) => confirmDelete(item)}
                            />

                            <Sidebar
                                isVisible={isShowSplit}
                                action={action}
                                width={'60vw'}
                                footerTemplate={ACTIONS.VIEW == action ? <></> : undefined}
                                title={salesPackage?.pkgNumber}
                                closeIcon={closeIcon}
                                content={packageView}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <ConfirmDialog appendTo={document.body} />
            <PackageEditor
                isVisible={isPackage}
                _salesPackage={salesPackage?.packageId ? salesPackage : null}
                isEdit={salesPackage?.packageId ? true : false}
                salesOrder={salesPackage?.so}
                onClose={(isLoad) => {
                    setShowPackage(false);
                    if (isLoad) {
                        fetchData()
                    }
                }}
            />
        </>
    );
};

export default PackagesPage;
