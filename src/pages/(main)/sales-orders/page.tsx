

import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';

import { Button } from 'primereact/button';
import { useAppContext } from '../../../layout/AppWrapper';
import { LayoutContext } from '../../../layout/context/layoutcontext';
import { MultiSelect } from 'primereact/multiselect';
import { Category, CompanyProductsMapping, CustomResponse, MasterCode, Product, Item, PurchaseItem, PurchaseOrder, Vendor, Warehouse, SalesOrderItem, SalesOrder, Asset } from '../../../types';
import Sidebar from '../../../components/Sidebar';
import { DataTable } from 'primereact/datatable';
import { Column, ColumnBodyOptions } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Panel } from 'primereact/panel';
import CustomPanel from '../../../components/CustomPanel';
import { DeleteCall, GetCall, GetPdfCall, PostCall, PutCall } from '../../../api/ApiKit';
import { filter, find, get, includes, map, set, sumBy } from 'lodash';
import { constant } from '../../../utils/constant';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { InputNumber } from 'primereact/inputnumber';
import moment, { isMoment } from 'moment-timezone';
import { InputTextarea } from 'primereact/inputtextarea';
import { Card } from 'primereact/card';
import { TreeNode } from 'primereact/treenode';
import { Dialog } from 'primereact/dialog';
import { Tooltip } from 'primereact/tooltip';
import { Toast } from 'primereact/toast';
import { FileUpload } from 'primereact/fileupload';
import { buildQueryParams, formatBytes, getRowLimitWithScreenHeight } from '../../../utils/uitl';
import CustomDataTable, { CustomDataTableRef } from '../../../components/CustomDataTable';
import { ProgressSpinner } from 'primereact/progressspinner';
import { SelectButton } from 'primereact/selectbutton';
import { Menu } from 'primereact/menu';
import UploadFile from '../../../components/UploadFile';
import PackageEditor from '../../../components/Editors/PackageEditor';
import MemoizedFileItem from '../../../components/MemoizedFileItem';
import FileView from '../../../components/FileView';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';

const ACTIONS = {
    ADD: 'add',
    EDIT: 'edit',
    VIEW: 'view',
    DELETE: 'delete'
};

const defaultLineItem: PurchaseItem = {
    poId: null,
    poItemId: null,
    companyId: null,
    categoryId: null,
    productId: null,
    gradeId: null,
    isCrossDock: false,
    quantity: 0,
    price: null,
    rowId: null,
    skuId:null,
    internalGrade:null,
    batteryHealthIds:null,
};

const salesOrderDefault: SalesOrder = {
    soId: null,
    soNumber: null,
    vendorId: null,
    companyId: null,
    soDate: null,
    approxDeliveryDate: null,
    statusId: null,
    trackingTypeId: null,
    trackingNumber: null,
    paymentTermsId: null,
    shippingPrice: 0,
    discountType: 'FIXED',
    discountAmount: 0,
    vat: null,
    paid: 0,
    note: '',
    price: 0,
    items: [],
}

const SalesOrderPage = () => {
    const createMenuRef = useRef<Menu>(null);
    const initializedRef = useRef(false);
    const [searchParams] = useSearchParams();
    const { user, isLoading, setLoading, setScroll, setAlert } = useAppContext();
    const { layoutState } = useContext(LayoutContext);
    const navigate = useNavigate();
    const multiSelectRef = useRef<MultiSelect>(null);
    const containerRef = useRef(null);
    const [isShowSplit, setIsShowSplit] = useState<boolean>(false);
    const [action, setAction] = useState<any>(null);
    const [isSubmitted, setSubmitted] = useState<boolean>(false);
    const [pos, setPOs] = useState<SalesOrder[]>([]);
    const [selectedSO, setSelectedSO] = useState<SalesOrder | null>(null);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(null);
    const [allVendors, setAllVendors] = useState<Vendor[]>([]);
    const [salesOrder, setSalesOrder] = useState<SalesOrder>({ ...salesOrderDefault });
    const [trackings, setTrackings] = useState<MasterCode[]>([]);
    const [statuses, setStatuses] = useState<MasterCode[]>([]);
    const [paid, setPaid] = useState<number>(0);
    const [paymentTerms, setPaymentTerms] = useState<MasterCode[]>([]);
    const [lineItems, setLineItems] = useState<SalesOrderItem[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [isProducLoading, setProductLoading] = useState<boolean>(false);
    const [searchText, setSearchText] = useState<any>('');
    const [visible, setVisible] = useState(false);
    const toast = useRef<Toast>(null);
    const fileUploadRef = useRef<any>(null);
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(getRowLimitWithScreenHeight());
    const [totalRecords, setTotalRecords] = useState<number | undefined>(undefined);
    const dataTableRef = useRef<CustomDataTableRef>(null);
    const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
    const [selectedSOToDelete, setSelectedSOToDelete] = useState<SalesOrder | null>(null);
    const [poId, setPoId] = useState<string | null>(null); // Step 1: Add state for poId
    const [docs, setDocs] = useState<any[]>([]);
    const [isShowImage, setShowImage] = useState<boolean>(false);
    const [assetFile, setAssetFile] = useState<Asset | null>(null);
    const [isPackage, setShowPackage] = useState<boolean>(false)
    const [isShipment, setShowShipment] = useState<boolean>(false);
    const querySoId = searchParams.get('soId');
    const createMenuItems: any[] = [
        {
            label: 'Create Package',
            command: () => setShowPackage(true)
        },
        // {
        //     label: 'Shipment',
        //     command: () => setShowShipment(true)
        // },
        {
            label: 'Convert to PO',
            command: () => convertToPO()
        }
    ]
    useEffect(() => {
        setScroll(false);
        fetchData();
        fetchAllVendors();
        fetchCarriers();
        fetchPOStatus();
        fetchPaymentTerms();
        return () => {
            setScroll(true);
        };
    }, []);

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchProducts(searchText);
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [searchText]);

    useEffect(() => {
        const check = async () => {
            if (!initializedRef.current && querySoId) {
                initializedRef.current = true;
                let sampleSO = { ...salesOrderDefault };
                sampleSO.soId = +querySoId;
                setAction(ACTIONS.VIEW);
                handleClick(sampleSO);
            }
        };
        check();
    }, [querySoId]);

    const handleClick = (_salesOrder?: SalesOrder) => {
        if (_salesOrder) {
            const newUrl = `/sales-orders?soId=${_salesOrder.soId}`;
            navigate(newUrl, { replace: true });
            fetchSoDetails(_salesOrder.soId);
            setIsShowSplit(true);
        }
        else {
            navigate('/sales-orders', { replace: true });
        }
    };

    const updateItem = async (key: string, value: any) => {
        const _so = JSON.parse(JSON.stringify(salesOrder));
        set(_so, key, value);
        setSalesOrder(_so);
    }

    const fetchData = async (params?: any) => {
        if (!params) {
            params = { limit: limit, page: page };
        }
        params.include = 'customer,status';
        const companyId = get(user, 'company.companyId');
        setLoading(true);
        const queryString = buildQueryParams(params);
        const response: CustomResponse = await GetCall(`/company/${companyId}/sales-orders?${queryString}`);
        if (response.code == 'SUCCESS') {
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

    const fetchSoDetails = async (soId: any) => {
        let params: any = {
            filters: {
                soId: soId
            },
            include: 'customer,status,items'
        };
        const companyId = get(user, 'company.companyId');
        setLoading(true);
        const queryString = buildQueryParams(params);
        const response: CustomResponse = await GetCall(`/company/${companyId}/sales-orders?${queryString}`);
        if (response.code == 'SUCCESS') {
            setSalesOrder(response.data[0]);
            getDocs(soId);
        } else {
            setSalesOrder(salesOrderDefault);
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
            setTrackings(response.data);
        } else {
            setTrackings([]);
        }
        setLoading(false);
    };

    const fetchPOStatus = async () => {
        if (!user?.company?.companyId) {
            return;
        }
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${user?.company?.companyId}/master-codes?codeType=${constant.SYSTEM_MSTR_CODE.soStatus}`);
        if (response.code == 'SUCCESS') {
            setStatuses(response.data);
        } else {
            setStatuses([]);
        }
        setLoading(false);
    };

    const fetchPaymentTerms = async () => {
        if (!user?.company?.companyId) {
            return;
        }
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${user?.company?.companyId}/master-codes?codeType=${constant.SYSTEM_MSTR_CODE.paymentTerms}`);
        if (response.code == 'SUCCESS') {
            setPaymentTerms(response.data);
        } else {
            setPaymentTerms([]);
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

    const fetchProducts = async (search = '') => {
        if (!user?.company?.companyId) {
            return;
        }

        setLoading(true);
        setProductLoading(true);
        const response: CustomResponse = await GetCall(`/company/${user?.company?.companyId}/products?search=${search}`);
        if (response.code == 'SUCCESS') {
            setProducts(response.data);
        } else {
            setProducts([]);
        }
        setProductLoading(false);
        setLoading(false);
    };

    const confirmDelete = async () => {
        if (!selectedSOToDelete) return;
        setLoading(true);
        const response: CustomResponse = await DeleteCall(`/company/${user?.company?.companyId}/sales-orders/${selectedSOToDelete.soId}`);
        setLoading(false);
        if (response.code === 'SUCCESS') {
            setIsDeleteDialogVisible(false);
            fetchData();
            setAlert('success', 'Successfully Deleted');
        } else {
            setAlert('error', response.message);
        }
    };

    const convertToPO = () => {
        console.log('convert')
        confirmDialog({
            className: 'confirm-dialog',
            message: "You’re converting the sales order into a purchase order?",
            header: "Confirmation",
            icon: "pi pi-exclamation-triangle text-red",
            position: 'top',
            accept: () => {
                console.log('accept')
            },
        });
    }

    const closeDeleteDialog = () => {
        setIsDeleteDialogVisible(false);
        setSelectedSOToDelete(null);
    };

    const closeIcon = () => {
        setSubmitted(false);
        setIsShowSplit(false);
        setSelectedSO(null);
        setSearchText('')
        setSalesOrder({ ...salesOrderDefault })
        handleClick();
    };
    const openDeleteDialog = (perm: SalesOrder) => {
        setSelectedSOToDelete(perm);
        setIsDeleteDialogVisible(true);
    };
    const onRowSelect = async (perm: SalesOrder, action = ACTIONS.VIEW) => {
        setAction(action);
        await setSelectedSO(perm);
        setDocs([])
        if (action === ACTIONS.DELETE) {
            openDeleteDialog(perm);
        }
        if (action === ACTIONS.EDIT) {
            setSalesOrder(perm);
            setIsShowSplit(true);
            fetchSoDetails(perm.soId)
        }

        if (action === ACTIONS.VIEW) {
            setSalesOrder(perm);
            setIsShowSplit(true);
            handleClick(perm)
        }
    };

    const showAddNew = () => {
        setIsShowSplit(true);
        setSubmitted(false);
        setAction(ACTIONS.ADD);
        setSelectedSO(null);
        fetchProducts();
    };

    const onProductSelect = (skuId: number, isPreSelected: boolean, rowIndex: any) => {
        let product = find(products, { skuId: skuId });
        let _items = [...get(salesOrder, 'items', [])];
        if (!isPreSelected) {
            _items.push({
                soId: null,
                companyId: null,
                quantity: 1,
                price: product.price || 0,
                skuId: skuId,
                product: product
            });
        } else {
            _items[rowIndex].skuId = skuId;
            _items[rowIndex].price = product.price || 0;
            _items[rowIndex].product = product;
        }
        updateItem('items', _items);
    };

    const removeItem = (skuId: any) => {
        if (!skuId) return;
        let _items = [...lineItems];
        _items = _items.filter((item) => item.skuId != skuId);
        updateItem('items', _items);
    };

    const inputChange = async (key: any, value: any, index: any) => {
        let _items = [...lineItems];
        set(_items, `${index}.${key}`, value);
        updateItem('items', _items);
    };

    const onSave = async () => {
        setSubmitted(true);
        if (!salesOrder.vendorId || !salesOrder.soDate || get(salesOrder, 'items', []).length == 0) {
            return;
        }
        setLoading(true);
        if (action == ACTIONS.ADD) {
            const response: CustomResponse = await PostCall(`/company/${user?.company?.companyId}/sales-orders`, salesOrder);
            if (response.code == 'SUCCESS') {
                closeIcon();
                fetchData();
                setAlert('success', 'Add Successfully');
            } else {
                setAlert('error', response.message);
            }
        }
        if (action == ACTIONS.EDIT) {
            const response: CustomResponse = await PutCall(`/company/${user?.company?.companyId}/sales-orders/${selectedSO?.soId}`, salesOrder);
            if (response.code == 'SUCCESS') {
                closeIcon();
                fetchData();
                setAlert('success', 'Updated Successfully');
            } else {
                setAlert('error', response.message);
            }
        }
        setLoading(false);
    };

    const printDoc = async (soId: any) => {
        setLoading(true);
        const response: any = await GetPdfCall(`/company/${user?.company?.companyId}/sales-orders/${soId}/print`);
        if (response && response.code == 'FAILED') {
            setAlert('error', response.message);
        }
        setLoading(false);
    }

    const attacheDocs = async () => {
        setVisible(true)
    }

    const uploadDocs = async (assetIds: any) => {
        let soId = salesOrder.soId;
        if (!soId && selectedSO) {
            soId = selectedSO.soId;
        }
        setLoading(true);
        const response: CustomResponse = await PostCall(`/company/${user?.company?.companyId}/sales-orders/${soId}/docs`, { assetIds });
        if (response.code == 'SUCCESS') {
            fetchData();
            setAlert('success', 'Upload Successfully');
        } else {
            setAlert('error', response.message);
        }
        setLoading(false);
    }

    const getDocs = async (soId: any) => {
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${user?.company?.companyId}/sales-orders/${soId}/docs?include=asset,user`);
        if (response.code == 'SUCCESS') {
            setDocs(response.data)
        } else {
            setAlert('error', response.message);
        }
        setLoading(false);
    }

    const viewImage = (file: Asset) => {
        setShowImage(true);
        setAssetFile(file)
    }

    const deleteDoc = async (file: any) => {
        const sodIds = map([file], 'id')
        console.log('sodIds', sodIds)
        setLoading(true);
        const response: CustomResponse = await DeleteCall(`/company/${user?.company?.companyId}/sales-orders/${salesOrder.soId}/docs`, { sodIds: sodIds });
        if (response.code == 'SUCCESS') {
            getDocs(salesOrder.soId)
        } else {
            setAlert('error', response.message);
        }
        setLoading(false);
    }

    const updateStatus = async (soId: any, masterCodeId: any) => {
        setLoading(true);
        const response: CustomResponse = await PutCall(`/company/${user?.company?.companyId}/sales-orders/${soId}/status/${masterCodeId}`);
        if (response.code == 'SUCCESS') {
            fetchData();
            setAlert('success', 'Status Updated');
        } else {
            setAlert('error', response.message);
        }
        setLoading(false);
    }

    const renderHeader = () => {
        return (
            <div className="flex justify-content-between p-4">
                <span className="p-input-icon-left flex align-items-center">
                    <h4 className="mb-0">Sales Orders</h4>
                </span>
                <span className="flex gap-5">
                    <div className=" ">
                        <Button label="Create SO" size="small" icon="pi pi-plus" className=" mr-2" onClick={showAddNew} />
                    </div>
                </span>
            </div>
        );
    };
    const header = renderHeader();

    const onFilter = (e: any) => {
        if (e) {
            setSearchText(e.filter)
        }
    }

    const renderProduct = (item: SalesOrderItem | null, option: ColumnBodyOptions) => {
        if (item?.skuId) {
            return <div>
                <label className='text-900'>{get(item, 'product.name')}</label><br />
                <span className='text-sm'>SKU: {get(item, 'product.skuId')}</span>
            </div>
        }

        return (
            <Dropdown
                value={item?.skuId}
                filter={true}
                filterClearIcon
                onFilter={onFilter}
                onChange={(e) => onProductSelect(e.value, item?.skuId != null, option.rowIndex)}
                valueTemplate={selectedProductTemplate}
                itemTemplate={productOptionTemplate}
                options={products.filter((item) => !map(get(salesOrder, 'items', []), 'skuId').includes(item.skuId))}
                optionLabel="name"
                optionValue="skuId"
                placeholder="Select a Product"
                className="w-30rem"
            />
        );
    };

    const renderQuantity = (item: SalesOrderItem, option: ColumnBodyOptions) => {
        if (!item?.skuId) {
            return <div style={{ width: 80 }}></div>;
        }
        return (
            <div>
                <InputNumber value={item.quantity} onValueChange={(e) => updateItem(`items.${option.rowIndex}.quantity`, e.value)} inputClassName="text-base w-full" inputStyle={{ width: '80px', textAlign: 'right' }} />
            </div>
        );
    };
    const renderShipmentStatus = (item: SalesOrderItem, option: ColumnBodyOptions) => {
        if (!item?.skuId) {
            return <div style={{ width: 100 }}></div>;
        }
        return (
            <div style={{ width: 80, textAlign: 'left' }}>
                <p>{item.packed || 0} Packed</p>
                <p>{item.shipped || 0} Shipped</p>
            </div>
        );
    };
    const renderRate = (item: SalesOrderItem, option: ColumnBodyOptions) => {
        if (!item?.skuId) {
            return <div style={{ width: 150 }}></div>;
        }
        return (
            <>
                <InputNumber value={item.price} onValueChange={(e) => updateItem(`items.${option.rowIndex}.price`, e.value)} mode="currency" currency="USD" locale="en-US" placeholder="Price" inputClassName="text-base" inputStyle={{ width: '150px', textAlign: 'right' }} />
            </>
        );
    };
    const renderTotal = (item: SalesOrderItem) => {
        if (!item?.skuId) {
            return <></>;
        }
        return item.price * item.quantity;
    };

    const renderCross = (item: SalesOrderItem) => {
        if (!item?.skuId) {
            return <div style={{ width: 50 }}></div>;
        }
        return (
            <div className="flex align-items-center">
                <Button icon="pi pi-times" severity="danger" aria-label="Cancel" size="small" onClick={() => removeItem(get(item, 'skuId', null))} />
            </div>
        );
    };

    const selectedProductTemplate = (option: Product, props: any) => {
        if (option) {
            return (
                <div className="flex align-items-start">
                    <div className="text-base">{option.name}</div>
                </div>
            );
        }

        return <span>{props.placeholder}</span>;
    };

    const productOptionTemplate = (option: Product) => {
        return (
            <div className="flex align-items-start flex-column">
                <div className="text-xs text-grey">{option.skuId}</div>
                <div className="text-base">{option.name}</div>
            </div>
        );
    };

    const renderPOTotal = (option: SalesOrder) => {
        return <>${get(option, 'totalPrice', 0)}</>
    };

    const renderPOBalace = (option: SalesOrder) => {
        return <>${get(option, 'balancePrice', 0)}</>
    };

    const renderVendor = (item: any) => get(item, 'customer.name');
    const renderStatus = (rowData: SalesOrder) => {
        return (
            <Dropdown
                value={rowData.statusId || null}
                options={statuses}
                optionLabel="code"
                optionValue="masterCodeId"
                onChange={(e) => updateStatus(rowData.soId, e.value)}
                className="dropdown-small w-full" checkmark={true}
            />
        );
    };
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

    const getDiscountAmount = (_salesOrder?: SalesOrder) => {
        if (!_salesOrder) {
            _salesOrder = salesOrder;
        }
        let sum = sumBy(get(_salesOrder, 'items', []), (item) => item.quantity * item.price);
        let discountAmount = _salesOrder.discountAmount ? get(_salesOrder, 'discountAmount', 0) : 0 || 0;
        if (_salesOrder.discountType == 'PERCENTAGE') {
            return sum * (discountAmount / 100);
        }
        return discountAmount;
    }

    const calculateTotalPrice = (_salesOrder?: SalesOrder) => {
        if (!_salesOrder) {
            _salesOrder = salesOrder;
        }
        let sum = sumBy(get(_salesOrder, 'items', []), (item) => item.quantity * item.price);
        return sum + (sum * (get(_salesOrder, 'vat', 0) / 100)) - getDiscountAmount(_salesOrder) + get(_salesOrder, 'shippingPrice', 0);
    }

    const calculateBalance = (_salesOrder?: SalesOrder) => {
        if (!_salesOrder) {
            _salesOrder = salesOrder;
        }
        let sum = sumBy(get(_salesOrder, 'items', []), (item) => item.quantity * item.price);
        return sum + (sum * (get(_salesOrder, 'vat', 0) / 100)) - getDiscountAmount(_salesOrder) + get(_salesOrder, 'shippingPrice', 0) - get(_salesOrder, 'paid', 0)
    }

    const salesOrderEditor = (<>
        <div className="grid" ref={containerRef}>
            <div className="field col-4">
                <label htmlFor="name3" className="w-full ">
                    Customer Name<span className='text-red'>*</span>
                </label>
                <div className="w-full">
                    <Dropdown
                        value={salesOrder.vendorId}
                        filter={true}
                        onChange={(e) => updateItem('vendorId', e.value)}
                        options={allVendors}
                        optionLabel="name"
                        optionValue="vendorId"
                        placeholder="Select a Customer"
                        className={`w-full ${isSubmitted && !salesOrder.vendorId ? 'p-invalid' : ''}`}
                        required={true}
                    />
                </div>
            </div>

            <div className="field col-4">
                <label htmlFor="name3" className="w-full ">
                    Sales Order Date<span className='text-red'>*</span>
                </label>
                <div className="w-full">
                    <Calendar appendTo={'self'} value={salesOrder?.soDate ? moment(salesOrder?.soDate).toDate() : null} onChange={(e) => updateItem('soDate', e.value)} placeholder="MM/DD/YYYY" className={`w-full ${isSubmitted && !salesOrder.soDate ? 'p-invalid' : ''}`} showIcon required={true} />
                </div>
            </div>

            <div className="field col-4">
                <label htmlFor="name3" className="w-full">
                    Expected Shipment Date
                </label>
                <div className="w-full">
                    <Calendar appendTo={'self'} value={salesOrder.approxDeliveryDate ? moment(salesOrder.approxDeliveryDate).toDate() : null} onChange={(e) => updateItem('approxDeliveryDate', e.value)} placeholder="MM/DD/YYYY" className="w-full" showIcon required={true} />
                </div>
            </div>

            <div className="field col-4">
                <label htmlFor="name3" className="w-full">
                    Payment Terms
                </label>
                <div className="w-full">
                    <Dropdown
                        value={salesOrder.paymentTermsId}
                        options={paymentTerms}
                        onChange={(e) => updateItem('paymentTermsId', e.value)}
                        optionLabel="code"
                        optionValue="masterCodeId"
                        placeholder="Payment Terms"
                        className={`w-full`}
                    />
                </div>
            </div>

            <div className="field col-4">
                <label htmlFor="name3" className="w-full">
                    Shipping Mode
                </label>
                <div className="w-full">
                    <Dropdown value={salesOrder.trackingTypeId} onChange={(e) => updateItem('trackingTypeId', e.value)} options={trackings} optionLabel="code" optionValue="masterCodeId" placeholder="Shipment carrier" className="w-full" />
                </div>
            </div>

            <div className="field col-4">
                <label htmlFor="name3" className="w-full">
                    Shipping Tracking Number
                </label>
                <div className="w-full">
                    <InputText value={salesOrder?.trackingNumber || ''} onChange={(e) => updateItem('trackingNumber', e.target.value)} placeholder="Tracking Number" className="w-full" />
                </div>
            </div>

            <div className="field col-4">
                <label htmlFor="name3" className="w-full  ">
                    Status<span className='text-red'>*</span>
                </label>
                <div className="w-full">
                    <Dropdown
                        value={salesOrder.statusId}
                        options={statuses}
                        onChange={(e) => updateItem('statusId', e.value)}
                        optionLabel="code"
                        optionValue="masterCodeId"
                        placeholder="Status"
                        className={`w-full ${isSubmitted && !salesOrder.statusId ? 'p-invalid' : ''}`}
                    />
                </div>
            </div>
        </div>
        <div className="mt-4">
            <h5>Line Items</h5>
            <DataTable
                scrollable
                showGridlines
                value={[...get(salesOrder, 'items', []), defaultLineItem]}
                selectionMode="single"
                dataKey="productId"
                className='table-line-item'
                // onSelectionChange={(row: any) => onRowSelect(row.value, 'view')}
                scrollHeight="70%"
                style={{ height: '80%' }}
            >
                <Column field="soDate" header="Product & SKU" body={(data, options: ColumnBodyOptions) => renderProduct(data, options)}></Column>
                <Column field="soDate" header="Quantity" body={renderQuantity} style={{ width: 80, textAlign: 'right' }}></Column>
                <Column field="poNumber" header="Rate" body={renderRate} style={{ width: 150, textAlign: 'right' }}></Column>
                <Column field="poNumber" header="Total" body={renderTotal} style={{ width: 150, textAlign: 'right' }}></Column>
                <Column style={{ width: 30 }} body={renderCross}></Column>
            </DataTable>
            <div className="grid mt-3">
                <div className="col-4 col-offset-8">
                    <div className="flex justify-content-between align-items-baseline">
                        <p className="font-semibold">Total</p>
                        <p className="font-bold">${sumBy(get(salesOrder, 'items', []), (item) => item.quantity * item.price)}</p>
                    </div>
                    <div className="flex justify-content-between align-items-baseline">
                        <p className="font-semibold">VAT %</p>
                        <InputNumber
                            value={salesOrder.vat || 0}
                            onValueChange={(e) => {
                                if (e.value) {
                                    updateItem('vat', e.value);
                                } else {
                                    updateItem('vat', 0);
                                }
                            }}
                            inputClassName="text-base font-bold"
                            inputStyle={{ width: '130px', textAlign: 'end' }}
                        />
                    </div>
                    <div className="flex justify-content-between align-items-baseline">
                        <p className="font-semibold">Shipping Charges</p>
                        <InputNumber
                            value={salesOrder.shippingPrice || 0}
                            onValueChange={(e) => {
                                if (e.value) {
                                    updateItem('shippingPrice', e.value > 0 ? e.value : 0);
                                } else {
                                    updateItem('shippingPrice', 0);
                                }
                            }}
                            inputClassName="text-base font-bold"
                            inputStyle={{ width: '130px', textAlign: 'end' }}
                        />
                    </div>

                    <div className="flex justify-content-between align-items-center">
                        <div className='grid align-items-baseline ml-0'>
                            <p className="font-semibold">Discount</p>
                            <div className='ml-2'>
                                <SelectButton className='p-discount' value={salesOrder.discountType == 'FIXED' ? '$' : '%'} onChange={(e) => updateItem('discountType', e.value == '$' ? 'FIXED' : 'PERCENTAGE')} options={['$', '%']} />
                            </div>
                        </div>
                        <InputNumber
                            value={salesOrder.discountAmount || 0}
                            onValueChange={(e) => {
                                if (e.value) {
                                    updateItem('discountAmount', e.value);
                                } else {
                                    updateItem('discountAmount', 0);
                                }
                            }}
                            inputClassName="text-base font-bold"
                            inputStyle={{ width: '130px', marginBottom: 5, textAlign: 'end' }}
                        />
                    </div>
                    <div className="flex justify-content-between align-items-baseline">
                        <p className="font-bold">Paid</p>
                        <InputNumber
                            value={salesOrder.paid || 0}
                            onValueChange={(e) => {
                                if (e.value) {
                                    updateItem('paid', e.value);
                                } else {
                                    updateItem('paid', 0);
                                }
                            }}
                            inputClassName="text-base font-bold"
                            inputStyle={{ width: '130px', textAlign: 'end' }}
                        />
                    </div>
                    <hr className="mb-3 mx-3 border-top-1 border-none surface-border" />
                    <div className="flex justify-content-between align-items-baseline">
                        <p className="font-semibold">Balance</p>
                        <p className="font-bold">${calculateBalance()}</p>
                    </div>
                </div>
            </div>
            <div className="grid mt-3">
                <h5>Remarks</h5>
                <InputTextarea className="w-full" value={salesOrder.note || ''} onChange={(e) => updateItem('note', e.target.value)} rows={5} cols={30} style={{ resize: 'none' }} />
            </div>
        </div>
    </>);

    const salesOrderView = (<>
        <ConfirmDialog />
        <div className='flex w-full absolute bg-ligthgrey br-top br-bottom z-2' style={{ top: '4rem', left: 0 }}>
            <div className='page-menu-item p-3 pl-5 br-right cursor-pointer' onClick={() => onRowSelect(salesOrder, ACTIONS.EDIT)}><i className="pi pi-pencil"></i> Edit</div>
            <div className='page-menu-item p-3 br-right cursor-pointer' onClick={() => printDoc(salesOrder.soId)}><i className="pi pi-file-pdf"></i> Pdf/Print</div>
            <div className='page-menu-item p-3 br-right cursor-pointer' onClick={attacheDocs}><i className="pi pi-paperclip"></i> Attach Files</div>
            <div className='page-menu-item p-3 br-right cursor-pointer' onClick={(event) => { if (createMenuRef.current) { createMenuRef.current.toggle(event) } }}><i className="pi pi-ellipsis-v"></i></div>
            <Menu model={createMenuItems} popup ref={createMenuRef} id="popup_menu_left" />
        </div>
        <div className='pt-8 pr-2'>
            <div className='grid justify-content-between p-2'>
                <div>
                    <h4>Sales Order</h4>
                    <p>Sales Order# <strong>{salesOrder.soNumber}</strong></p>
                    <p>Order Date <strong>{isMoment(moment(salesOrder.soDate)) ? moment(salesOrder.soDate).format('MM/DD/YYYY') : ''}</strong></p>
                </div>
                <div>
                    <p>Billing Address</p>
                    <p className='text-blue cursor-pointer'><strong>{get(salesOrder, 'customer.name', '')}</strong></p>
                </div>
            </div>
            <div>
                <p>Status <strong>{get(salesOrder, 'status.value')}</strong></p>
            </div>
            <div className="mt-4">
                <h5>Line Items</h5>
                <DataTable
                    scrollable
                    showGridlines
                    value={get(salesOrder, 'items', [])}
                    selectionMode="single"
                    dataKey="productId"
                    className='table-line-item'
                    // onSelectionChange={(row: any) => onRowSelect(row.value, 'view')}
                    scrollHeight="70%"
                    style={{ height: '80%' }}
                >
                    <Column field="soDate" header="Product & SKU" body={(data, options: ColumnBodyOptions) => renderProduct(data, options)}></Column>
                    <Column field="quantity" header="Quantity" style={{ width: 80, textAlign: 'right' }}></Column>
                    <Column field="soDate" header="Status" body={renderShipmentStatus} style={{ width: 80, textAlign: 'right' }}></Column>
                    <Column field="price" header="Rate" style={{ width: 150, textAlign: 'right' }}></Column>
                    <Column field="poNumber" header="Total" body={renderTotal} style={{ width: 150, textAlign: 'right' }}></Column>
                </DataTable>
                <div className="grid mt-3">
                    <div className="col-5 col-offset-7">
                        <div className="flex justify-content-between align-items-baseline">
                            <p className="font-semibold">Sub Total</p>
                            <p className="font-bold">${sumBy(get(salesOrder, 'items', []), (item) => item.quantity * item.price)}</p>
                        </div>
                        {
                            get(salesOrder, 'vat', 0) > 0 && <div className="flex justify-content-between align-items-baseline">
                                <p className="font-semibold">VAT {get(salesOrder, 'vat', 0)}%</p>
                                <p className="font-bold">${sumBy(get(salesOrder, 'items', []), (item) => item.quantity * item.price) * (get(salesOrder, 'vat', 0) / 100)}</p>
                            </div>
                        }

                        <div className="flex justify-content-between align-items-baseline">
                            <p className="font-semibold">Shipping Charges</p>
                            <p className="font-semibold">{salesOrder.shippingPrice}</p>
                        </div>

                        <div className="flex justify-content-between align-items-center">
                            <p className="font-semibold">Discount {salesOrder.discountAmount} {salesOrder.discountType == 'FIXED' ? ' Flat' : '%'}</p>
                            <p className="font-semibold">-{getDiscountAmount(salesOrder)}</p>
                        </div>
                        <hr className=" mx-3 border-top-1 border-none surface-border" />
                        <div className="flex justify-content-between align-items-baseline">
                            <p className="font-semibold">Total</p>
                            <p className="font-bold">${salesOrder.totalPrice || 0}</p>
                        </div>
                        {
                            salesOrder.paid > 0 && <div className="flex justify-content-between align-items-baseline">
                                <p className="font-semibold">Paid</p>
                                <p className="font-semibold">-${salesOrder.paid || 0}</p>
                            </div>
                        }
                        <hr className="mb-3 mx-3 border-top-1 border-none surface-border" />
                        <div className="flex justify-content-between align-items-baseline">
                            <p className="font-semibold">Balance</p>
                            <p className="font-bold">${calculateBalance()}</p>
                        </div>
                    </div>
                </div>
                <div className="mt-3">
                    <h5>Remarks</h5>
                    <p>{salesOrder.note || 'N/A'}</p>
                </div>
                {
                    docs != undefined && docs.length > 0 && <div className="mt-3">
                        <h5>Attachments</h5>
                        <div className='grid mt-2'>
                            {
                                docs.map((file: any) => (
                                    <div key={`file_${file.id}_${get(file, 'asset.name')}`} className='col-4 sm:col-3 lg:col-2 file-item'>
                                        <div className="flex gap-3 flex-column p-2 shadow-2 border-round align-items-center text-center border-round-sm">
                                            <MemoizedFileItem edit={true} key={`file_image_${get(file, 'asset.assetId')}_${get(file, 'asset.name')}`} file={file.asset} onView={() => viewImage(file.asset)} onDelete={() => deleteDoc(file)} />
                                        </div>
                                        <div className="file-info flex flex-column  mb-2">
                                            <p className='m-0 mt-2 sub-desc'>{get(file, 'asset.type', '').toUpperCase()} • {formatBytes(get(file, 'asset.sizeInBytes'))}</p>
                                            <p className='m-0  sub-desc text-overflow-ellipsis' style={{ overflow: 'hidden', width: 110 }}>{get(file, 'asset.name')}</p>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                }

            </div>
        </div>
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
                                filter={true}
                                page={page}
                                limit={limit} // no of items per page
                                totalRecords={totalRecords} // total records from api response
                                isView={true}
                                isEdit={true} // show edit button
                                isDelete={true} // show delete button
                                extraButtons={[
                                    {
                                        icon: 'pi pi-cloud-upload',
                                        onClick: (item) => {
                                            setSelectedSO(item)
                                            setVisible(true)
                                        }
                                    },
                                    {
                                        icon: 'pi pi-file-pdf',
                                        onClick: (item) => {
                                            printDoc(item.soId)
                                        }
                                    }
                                ]}
                                data={pos}
                                columns={[
                                    {
                                        header: 'SO Date',
                                        field: 'soDate',
                                        sortable: true,
                                        style: { minWidth: 120, maxWidth: 120 },
                                        body: (options: any) => isMoment(moment(options.soDate)) ? moment(options.soDate).format('MM/DD/YYYY') : ''
                                    },
                                    {
                                        header: 'SO Number',
                                        field: 'soNumber',
                                        filter: true,
                                        sortable: true,
                                        bodyStyle: { minWidth: 150, maxWidth: 150 },
                                        filterPlaceholder: 'SO Number',
                                        body: (options: any) => (<label className='text-blue cursor-pointer' onClick={() => onRowSelect(options, ACTIONS.VIEW)}>{options.soNumber}</label>)
                                    },
                                    {
                                        header: 'Customer',
                                        field: 'vendorId',
                                        body: renderVendor,
                                        filter: true,
                                        filterElement: vendorDropdown,
                                        filterPlaceholder: 'Search customer'
                                    },
                                    {
                                        header: 'Status',
                                        field: 'statusId',
                                        body: renderStatus,
                                        filter: true,
                                        filterElement: statusDropdown
                                    },
                                    {
                                        header: 'Total',
                                        field: 'total',
                                        body: renderPOTotal
                                    },
                                    {
                                        header: 'Balance',
                                        field: 'balance',
                                        body: renderPOBalace
                                    }
                                ]}
                                onLoad={(params: any) => fetchData(params)}
                                onView={(item: any) => onRowSelect(item, ACTIONS.VIEW)}
                                onEdit={(item: any) => onRowSelect(item, ACTIONS.EDIT)}
                                onDelete={(item: any) => onRowSelect(item, ACTIONS.DELETE)}
                            />
                        </div>
                        <Sidebar
                            isVisible={isShowSplit}
                            action={action}
                            width={ACTIONS.VIEW == action ? '60vw' : undefined}
                            footerTemplate={ACTIONS.VIEW == action ? <></> : undefined}
                            title={`${[ACTIONS.EDIT, ACTIONS.VIEW].includes(action) ? (salesOrder.soNumber ? salesOrder.soNumber : '') : 'New Sales Order'}`}
                            closeIcon={closeIcon}
                            onSave={onSave}
                            content={[ACTIONS.EDIT, ACTIONS.ADD].includes(action) ? salesOrderEditor : salesOrderView}
                        />
                    </div>
                </div>
            </div>
            <PackageEditor
                isVisible={isPackage}
                salesOrder={salesOrder}
                onClose={(isLoad) => {
                    setShowPackage(false);
                    if (isLoad) {
                        fetchSoDetails(salesOrder.soId);
                    }
                }}
            />
            <UploadFile isVisible={visible}
                onSelect={(option: any) => {
                    setVisible(false);
                    if (option && option.length > 0) {
                        let assetIds = option.map((item: any) => ({
                            assetId: item.assetId
                        }))
                        uploadDocs(assetIds);
                    }
                }}
            />
            <FileView isVisible={isShowImage} assetFile={assetFile} onClose={() => setShowImage(false)} />
            <Dialog
                header="Delete confirmation"
                visible={isDeleteDialogVisible}
                style={{ width: layoutState.isMobile ? '90vw' : '50vw' }}
                className="delete-dialog"
                headerStyle={{ backgroundColor: '#ffdddb', color: '#8c1d18' }}
                footer={
                    <div className="flex justify-content-end p-2">
                        <Button label="Cancel" severity="secondary" text onClick={closeDeleteDialog} />
                        <Button label="Delete" severity="danger" onClick={confirmDelete} />
                    </div>
                }
                onHide={closeDeleteDialog}
            >
                {isLoading && (
                    <div className="center-pos">
                        <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                    </div>
                )}
                <div className="flex flex-column w-full surface-border p-3">
                    <div className="flex align-items-center">
                        <i className="pi pi-info-circle text-6xl red" style={{ marginRight: 10 }}></i>
                        <span>
                            This will permanently delete the selected purchase order.
                            <br />
                            Do you still want to delete it? This action cannot be undone.
                        </span>
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default SalesOrderPage;