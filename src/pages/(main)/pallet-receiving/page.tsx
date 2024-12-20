


import React, { useContext, useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { useAppContext } from '../../../layout/AppWrapper';
import { LayoutContext } from '../../../layout/context/layoutcontext';
import { MultiSelect } from 'primereact/multiselect';
import { Pallet, CustomResponse, Roles, PurchaseOrder } from '../../../types';
import { ProgressSpinner } from 'primereact/progressspinner';
import { filter, find, get, groupBy, head, keyBy, map, uniq } from 'lodash';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { FilterMatchMode } from 'primereact/api';
import { DeleteCall, GetCall, PostCall, PutCall } from '../../../api/ApiKit';
import { InputText } from 'primereact/inputtext';
import { EmptyPallet } from '../../../types/forms';
import { Dialog } from 'primereact/dialog';
import { buildQueryParams, getRowLimitWithScreenHeight } from '../../../utils/uitl';
import { Dropdown } from 'primereact/dropdown';
import CustomDataTable, { CustomDataTableRef } from '../../../components/CustomDataTable';
import Sidebar from '../../../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import moment from 'moment-timezone';

const ACTIONS = {
    ADD: 'add',
    EDIT: 'edit',
    VIEW: 'view',
    DELETE: 'delete',
    VIEW_PERMISSIONS: 'view_permissions'
};

const PalletReceivingPage = () => {
    const { user, isLoading, setLoading, setScroll, setAlert } = useAppContext();
    const { layoutState } = useContext(LayoutContext);
    const navigate = useNavigate();
    const multiSelectRef = useRef<MultiSelect>(null);
    const [isShowSplit, setIsShowSplit] = useState<boolean>(false);
    const [isReload, setIsReload] = useState<boolean>(false);

    const [companies, setCompanies] = useState<Pallet[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<Pallet | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });
    const [action, setAction] = useState<any>(null);

    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(getRowLimitWithScreenHeight());
    const [totalRecords, setTotalRecords] = useState<number | undefined>(undefined);
    const [inputValue, setInputValue] = React.useState<string>('');
    const dataTableRef = useRef<CustomDataTableRef>(null);
    const timeoutRef = useRef<number | undefined>(undefined);
    const [receivedPallets, setReceivedPallets] = useState<any>([]);
    const [pos, setPOs] = useState<PurchaseOrder[]>([]);
    const [poSearch, setPOSearch] = useState<any>('');
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [isShowPO, setIsShowPo] = useState<boolean>(false);
    const [poPalletList, setPoPalletList] = useState<any[]>([]);

    useEffect(() => {
        setScroll(false);
        fetchData();
        return () => {
            setScroll(true);
        };
    }, []);
    useEffect(() => {
        const savedCompany = localStorage.getItem('selectedCompany');
        if (savedCompany) {
            setSelectedCompany(JSON.parse(savedCompany));
        }

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const fetchData = async (params?: any) => {
        const companyId = get(user, 'company.companyId');
        // Set default values if params are undefined
        const { sortBy = 'poId', sortOrder = 'asc', ...otherParams } = params || {};
        // Ensure sortOrder is valid ('asc' or 'desc')
        const validSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'asc';

        // Construct query parameters safely
        const queryParams = {
            groupBy: 1,
            sortBy,
            sortOrder: validSortOrder,
            ...otherParams
        };

        const queryString = new URLSearchParams(queryParams).toString();
        setLoading(true);

        try {
            const response: CustomResponse = await GetCall(`/company/${companyId}/pallet-receiving?${queryString}`);
            if (response.code === 'SUCCESS') {
                setCompanies(response.data);
                if (response.total) {
                    setTotalRecords(response.total)
                }
            } else {
                setCompanies([]);
            }
        } catch (error) {
            setCompanies([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchPalletDetails = async (poId: any, params: any = null) => {
        const companyId = get(user, 'company.companyId');
        const queryParams = {
            filters: {
                poId: +poId
            }
        };
        if (params) {
            params.filters['poId'] = +poId;
        }
        const queryString = buildQueryParams(params ? params : queryParams);
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${companyId}/pallet-receiving?${queryString}`);
        if (response.code === 'SUCCESS') {
            setPoPalletList(response.data);
        } else {
            setPoPalletList([]);
        }
        setLoading(false);
    };

    const closeIcon = () => {
        if (isReload) {
            fetchData();
            setIsReload(false);
        }
        setSelectedCompany(null);
        setIsShowSplit(false);
        setAction(null);
        setInputValue('')
        setReceivedPallets([])
        setPoPalletList([])
    };

    const showAddNew = () => {
        setIsShowSplit(true);
        setAction('add');
        setSelectedCompany(null);
        setReceivedPallets([])
        setIsShowPo(false);
        setInputValue('')
    };

    const onNewAdd = async (companyForm: any) => {
        console.log('onNewAdd called with:', companyForm); // Log payload

        const companyId = get(user, 'company.companyId');
        setIsDetailLoading(true);
        setIsShowPo(false);

        const response: CustomResponse = await PostCall(`/company/${companyId}/pallet-receiving`, companyForm);

        if (response.code === 'SUCCESS') {
            setIsReload(true);
            setInputValue(''); // Clear the input field after adding the data
            setIsShowPo(false);
            setReceivedPallets([...receivedPallets, response.data])
        } else {
            if (response.keys && response.keys.length > 0 && response.keys.includes('poNumber')) {
                setIsShowPo(true);
            }
            else {
                setAlert('error', response.message);
            }
        }
        setIsDetailLoading(false);
    };

    const onRowSelect = async (pallet: Pallet, action: any) => {
        await setSelectedCompany(pallet);
        setAction(action);
        setIsShowSplit(true);
        setPoPalletList([])
        fetchPalletDetails(pallet.poId)
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            handleFilter(poSearch);
        }, 500);

        return () => clearTimeout(timer);
    }, [poSearch]);

    const handleFilter = (soSearch: any) => {
        const searchTerm = soSearch.toLowerCase();
        const localMatches = pos.filter((option: PurchaseOrder) => option?.poNumber && option?.poNumber.toLowerCase().includes(searchTerm.toLowerCase()));
        if (localMatches.length > 0) {
            setPOs(localMatches); // Use local matches if found
        } else {
            fetchPO(searchTerm); // Fallback to server if no local match
        }
    };

    const fetchPO = async (poNumber = '') => {
        let params: any = {
            filters: {},
            limit: 500,
            page: 0,
            include: 'vendor'
        };

        if (poNumber) {
            params.filters['poNumber'] = poNumber.toUpperCase();
        }
        const companyId = get(user, 'company.companyId');
        setLoading(true);
        const queryString = buildQueryParams(params);
        const response: CustomResponse = await GetCall(`/company/${companyId}/purchase-orders?${queryString}`);
        if (response.code == 'SUCCESS') {
            setPOs(response.data);
        } else {
            setPOs([]);
        }
        setLoading(false);
    }

    const headerTemplate = (options: any) => {
        const className = `${options.className} justify-content-space-between`;
        return (
            <div className={className}>
                <div className="flex align-items-center gap-2">
                    <div className="ellipsis-container font-bold" style={{ marginLeft: 10, maxWidth: '22vw' }}>
                        {action == ACTIONS.ADD ? 'Receive Pallet' : ''}
                        {action == ACTIONS.EDIT ? 'Edit Pallet' : ''}
                        {action == ACTIONS.VIEW ? get(selectedCompany, 'po.poNumber') : ''}
                    </div>
                </div>
            </div>
        );
    };

    const panelFooterTemplate = () => {
        return (
            <div className="flex justify-content-end p-2">
                {/* {
                    action == ACTIONS.VIEW_PERMISSIONS ? <Button label="Back" severity="secondary" text onClick={() => setAction(ACTIONS.VIEW)} /> : <div></div>
                } */}
                <div>
                    <Button label="Cancel" severity="secondary" text onClick={closeIcon} />
                </div>
            </div>
        );
    };

    const renderHeader = () => {
        return (
            <div className="flex justify-content-between p-4">
                <span className="p-input-icon-left flex align-items-center">
                    <h4 className="mb-0">Pallet Receiving</h4>
                </span>
                <Button label="Pallets" icon="pi pi-plus" size="small" className=" mr-2" onClick={showAddNew} />
            </div>
        );
    };
    const header = renderHeader();

    const handleKeyPress = (event: any) => {
        if (event.key === "Enter") {
            console.log("Scanned Value:", event.target.value);
            if (event.target.value.trim()) {
                const companyForm = {
                    prDate: new Date().toISOString(),
                    vendorOrderRef: event.target.value.trim(),
                    poNumber: '',
                    note: null
                };
                onNewAdd(companyForm); // Call the API with the form data
            }
        }
    };

    const confirmDelete = (pallet: any) => {
        confirmDialog({
            className: 'confirm-dialog',
            message: "Do you really want to delete this pallet?",
            header: "Confirmation",
            icon: "pi pi-exclamation-triangle text-red",
            position: 'top',
            accept: () => deletePallet(pallet)
        });
    }

    const deletePallet = async (pallet: any) => {
        if (!user?.company?.companyId) {
            return;
        }
        setLoading(true);
        const response: CustomResponse = await PostCall(`/company/${user?.company?.companyId}/pallet-receiving/delete`, { palletIds: [pallet.palletId] });
        if (response.code == 'SUCCESS') {
            setIsReload(true);
            setAlert('success', 'Pallet deleted!')
            let _old = [...receivedPallets];
            setReceivedPallets(_old.filter((item: any) => item.palletId != pallet.palletId));
            setPoPalletList(poPalletList.filter((item: any) => item.palletId != pallet.palletId))
        } else {
            setAlert('error', response.message)
        }
        setLoading(false);
    };

    const customContent = (
        <span className="p-input-icon-right w-full">
            <IconField>
                <InputIcon className={`pi ${isLoading ? 'pi-spin pi-spinner' : 'pi-search'}`}> </InputIcon>
                <InputText value={poSearch}
                    onChange={(e) => setPOSearch(e.target.value)}
                    placeholder="Search SO #"
                    style={{ width: "100%" }}
                    autoFocus />
            </IconField>
        </span>
    );

    const addPanel = () => {
        return (
            <>
                <div className='relative col-5 mb-4 p-0'>
                    <InputText value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyPress} placeholder="Enter or scan pallet tracking number" style={{ paddingRight: '30px', width: '100%' }} />
                    <span
                        className="pi pi-qrcode"
                        style={{
                            position: 'absolute',
                            right: '20px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'blue',
                            fontSize: '1.2rem'
                        }}
                    ></span>
                </div>
                <ConfirmDialog appendTo={document.body} />
                {
                    receivedPallets.length > 0 && <CustomDataTable
                        ref={dataTableRef}
                        page={page}
                        limit={limit} // no of items per page
                        totalRecords={receivedPallets.length} // total records from API response
                        isDelete={true} // show delete button
                        data={receivedPallets}
                        columns={[
                            {
                                header: 'Tracking Number',
                                field: 'vendorOrderRef',
                            },
                            {
                                header: 'PO Number',
                                field: 'po.poNumber',
                            },
                            {
                                header: 'Pallet Id',
                                field: 'palletId',
                            }
                        ]}
                        onDelete={(item: any) => confirmDelete(item)}
                    />
                }
            </>
        );
    };

    const palletView = (<>
        <ConfirmDialog appendTo={document.body} />
        <CustomDataTable
            page={0}
            limit={poPalletList.length}
            totalRecords={poPalletList.length}
            isDelete={true}
            data={poPalletList}
            columns={[
                {
                    header: 'Received Date',
                    field: 'prDate',
                    body: (item) => moment(item.prDate).format('MM/DD/YYYY'),
                    filter: true,
                    sortable: true,
                    filterPlaceholder: 'Search PO Number'
                },
                {
                    header: 'PO Number',
                    field: 'poId',
                    body: (item) => get(item, 'po.poNumber'),
                    filter: true,
                    filterPlaceholder: 'Search PO Number'
                },
                {
                    header: 'Pallet Id',
                    field: 'palletId',
                    filter: true,
                    sortable: true,
                    filterPlaceholder: 'Search name'
                }
            ]}
            onLoad={(params: any) => fetchPalletDetails(selectedCompany?.poId, params)}
            onDelete={(item: any) => confirmDelete(item)}
        />
    </>)

    return (
        <>
            <div className="grid">
                <div className="col-12">
                    <div className={`panel-container ${isShowSplit ? (layoutState.isMobile ? 'mobile-split' : 'split') : ''}`}>
                        <div className="left-panel">
                            {header}
                            <CustomDataTable
                                ref={dataTableRef}
                                filter
                                page={page}
                                limit={limit} // no of items per page
                                totalRecords={totalRecords} // total records from api response
                                isView={true}
                                data={companies.map((item: any) => ({
                                    palletCount: item.palletCount, // Pallet count
                                    po: {
                                        poNumber: item.po?.poNumber // Extract PO number safely
                                    },
                                    ...item
                                }))}
                                // provides columns as PrimeReact DataTable
                                columns={[
                                    {
                                        header: 'PO Number',
                                        field: 'po.poNumber',
                                        filter: true,
                                        sortable: true,
                                        filterPlaceholder: 'Search PO Number'
                                    },
                                    {
                                        header: 'No. Of Pallets',
                                        field: 'palletCount',
                                        filter: true,
                                        sortable: true,
                                        filterPlaceholder: 'Search name'
                                    }
                                ]}
                                onLoad={(params: any) => fetchData(params)}
                                onView={(item: any) => onRowSelect(item, 'view')}
                            />
                        </div>
                        <Sidebar
                            isVisible={isShowSplit}
                            headerTemplate={headerTemplate}
                            footerTemplate={panelFooterTemplate}
                            closeIcon={closeIcon}
                            width={'60vw'}
                            content={
                                <>
                                    {isDetailLoading && (
                                        <div className="center-pos">
                                            <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                                        </div>
                                    )}

                                    {/* Edit Roles */}
                                    {(action == ACTIONS.ADD || action == ACTIONS.EDIT) && <div>{addPanel()}</div>}

                                    {action == ACTIONS.VIEW && palletView}
                                </>
                            }
                        />
                    </div>
                </div>
            </div>
            <Dialog
                visible={isShowPO}
                header={'Please provide Purchase Order'}
                position={'top'}
                style={{ width: '30vw' }}
                draggable={false}
                breakpoints={{ '960px': '75vw', '641px': '100vw' }}
                onHide={() => {
                    setSelectedPO(null)
                    setIsShowPo(false)
                }}
                footer={
                    <div className="flex justify-content-end p-2">
                        <Button label="Cancel" severity="secondary" text onClick={() => {
                            setSelectedPO(null)
                            setIsShowPo(false)
                        }} />
                        <Button label="Save" severity="info" onClick={() => {
                            setIsShowPo(false)
                            if (selectedPO?.poNumber) {
                                setSelectedPO(null)
                                const companyForm = {
                                    prDate: new Date().toISOString(),
                                    vendorOrderRef: inputValue.trim(),
                                    poNumber: selectedPO?.poNumber,
                                    note: null
                                };

                                onNewAdd(companyForm);
                            }
                        }} />
                    </div>
                }
            >
                <div className="w-full col-5">
                    <Dropdown
                        value={null}
                        filter
                        onChange={(e) => {
                            let po = find(pos, { poId: e.value });
                            if (po) {
                                setSelectedPO(po);
                            }
                        }}
                        options={pos}
                        optionValue="poId"
                        optionLabel="poNumber"
                        placeholder="Select a Purchase Order"
                        className={`w-full`}
                        required={true}
                        filterTemplate={customContent}
                        filterBy='poNumber'
                        valueTemplate={(option: any) => {
                            return <>
                                <small className='small-desc'>{get(selectedPO, 'vendor.name')}</small>
                                <p>{get(selectedPO, 'poNumber', 'Select a Purchase Order')}</p>
                            </>
                        }}
                        itemTemplate={(option) => <>
                            <small className='small-desc'>{get(option, 'vendor.name')}</small>
                            <p>{get(option, 'poNumber')}</p>
                        </>}
                    />
                </div>
            </Dialog>
        </>
    );
};

export default PalletReceivingPage;
