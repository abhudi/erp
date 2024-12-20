
import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Panel } from 'primereact/panel';
import { classNames } from 'primereact/utils';
import Sidebar from '../Sidebar';
import { Dropdown, DropdownFilterEvent } from 'primereact/dropdown';
import { CustomResponse, PackageItem, Packages, Product, ProductItem, SalesOrder } from '../../types';
import { filter, find, get, groupBy, map, pick, set } from 'lodash';
import { Calendar } from 'primereact/calendar';
import moment from 'moment';
import { useAppContext } from '../../layout/AppWrapper';
import { buildQueryParams } from '../../utils/uitl';
import { GetCall, PostCall, PutCall } from '../../api/ApiKit';
import ERPDropDown from '../ERPDropDown';
import { InputText } from 'primereact/inputtext';
import { MultiSelect } from 'primereact/multiselect';
import { DataTable } from 'primereact/datatable';
import { Column, ColumnBodyOptions } from 'primereact/column';
import { Message } from 'primereact/message';
import { InputSwitch } from 'primereact/inputswitch';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { BlockUI } from 'primereact/blockui';

interface PackageEditorOptions {
    title?: string,
    isVisible: boolean,
    isEdit?: boolean,
    _salesPackage?: any
    salesOrder?: SalesOrder | null,
    onClose: (isLoad: boolean) => void
}

const defaultPackage: Packages = {
    packageId: null,
    soId: null,
    pkgNumber: null,
    companyId: null,
    items: []
}

export default function PackageEditor({ title = 'New Package', isVisible = false, isEdit = false, _salesPackage = null, salesOrder = null, onClose = (isLoad) => { } }: PackageEditorOptions) {
    const ref = useRef<Panel>(null);
    const { user, isLoading, setLoading, setScroll, setAlert } = useAppContext();
    const [dialogVisible, setDialogVisible] = useState(false);
    const [isSubmitted, setSubmitted] = useState<boolean>(false);
    const [isGrouped, setIsGrouped] = useState<boolean>(true);
    const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
    const [salesPackage, setSalePackage] = useState<Packages>(defaultPackage);
    const [soSearch, setSOSearch] = useState<any>('');
    const [pSearch, setPSearch] = useState<any>('');
    const dropdownRef = useRef<MultiSelect>(null);

    useEffect(() => {
        if (isVisible) {
            if (_salesPackage) {
                setSalePackage(_salesPackage)
            }
            else {
                if (salesOrder) {
                    updateItem('so', salesOrder);
                }
                fetchSo();
            }
            setDialogVisible(true)
        }
        else {
            setSalePackage(defaultPackage)
            setDialogVisible(false)
            setSalePackage(defaultPackage)
        }
    }, [isVisible]);

    useEffect(() => {
        if (_salesPackage) {
            setSalePackage(_salesPackage)
        }
        else {
            setSalePackage(defaultPackage)
        }
    }, [_salesPackage]);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleFilter(soSearch);
        }, 500);

        return () => clearTimeout(timer);
    }, [soSearch]);

    const closeIcon = () => {
        onClose(false);
    }

    const onSave = async () => {
        const companyId = get(user, 'company.companyId');
        const data = map(salesPackage.items, item => pick(item, ['skuId', 'pItemId'])).map((item) => {
            if (item.pItemId) {
                item.pItemId = +item.pItemId
            }
            return item;
        })

        if (data.length == 0 || !salesPackage.soId) {
            return;
        }
        setLoading(true);

        if (salesPackage.packageId) {
            const response: CustomResponse = await PutCall(`/company/${companyId}/sales-orders/${salesPackage.soId}/packaging/${salesPackage.packageId}`, { items: data });
            if (response.code == 'SUCCESS') {
                onClose(true)
                setAlert('success', 'Package updated!')
            } else {
                setAlert('error', response.message)
            }
        }
        else {
            const response: CustomResponse = await PostCall(`/company/${companyId}/sales-orders/${salesPackage.soId}/packaging`, { items: data });
            if (response.code == 'SUCCESS') {
                setAlert('success', 'Package added!')
                onClose(true)
            } else {
                setAlert('error', response.message)
            }
        }
        setLoading(false);
    }

    const updateItem = async (key: string, value: any) => {
        const _package: Packages = JSON.parse(JSON.stringify(salesPackage));
        if (key === 'soId') {
            let so = find(salesOrders, { soId: +value });
            if (so && _package.soId != +value) {
                _package.so = so;
            }
            fetchSoDetails(+value);
        }
        else if (key === 'so') {
            _package.soId = value.soId;
        }
        set(_package, key, value);
        setSalePackage(_package);
    }

    const fetchSo = async (soNumber = '') => {
        let params: any = {
            filters: {},
            limit: 500,
            page: 0,
            include: 'customer'
        };

        if (soNumber) {
            params.filters['soNumber'] = soNumber.toUpperCase();
        }
        const companyId = get(user, 'company.companyId');
        setLoading(true);
        const queryString = buildQueryParams(params);
        const response: CustomResponse = await GetCall(`/company/${companyId}/sales-orders?${queryString}`);
        if (response.code == 'SUCCESS') {
            setSalesOrders(response.data);
        } else {
            setSalesOrders([]);
        }
        setLoading(false);
    }

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
            updateItem('so', response.data[0]);
        } else {
            setAlert('error', response.message);
        }
        setLoading(false);
    };

    const handleFilter = (soSearch: any) => {
        const searchTerm = soSearch.toLowerCase();
        const localMatches = salesOrders.filter((option: SalesOrder) => option?.soNumber && option?.soNumber.toLowerCase().includes(searchTerm.toLowerCase()));
        if (localMatches.length > 0) {
            setSalesOrders(localMatches); // Use local matches if found
        } else {
            fetchSo(searchTerm); // Fallback to server if no local match
        }
    };

    const handleProductSearch = async (barcode: any) => {
        const companyId = get(user, 'company.companyId');
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${companyId}/barcode/${barcode}`);
        if (response.code == 'SUCCESS') {
            setPSearch('')
            if (get(response, 'data.barcodeType') == "PRODUCT_ITEM") {
                onProductSelect(response.data)
            }
            else {
                setAlert('error', 'Please scan valid REID.')
            }
        } else {
            setAlert('error', 'Product not found')
        }
        setLoading(false);
    };

    const handleAutoPackgaging = async () => {
        const companyId = get(user, 'company.companyId');
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${companyId}/sales-orders/${salesPackage.soId}/get-auto-packaging-items`);
        if (response.code == 'SUCCESS') {
            if (response.data && response.data.length > 0) {
                updateItem('items', response.data)
            }
            else {
                setAlert('error', 'No enough stock to fulfill this order')
            }
        } else {
            setAlert('error', response.message)
        }
        setLoading(false);
    };

    const onProductSelect = (pItem: ProductItem) => {
        if (pItem) {
            let _items: PackageItem[] = [...get(salesPackage, 'items', [])];
            let isPresent = find(_items, { pItemId: pItem.pItemId });
            if (!isPresent) {
                _items.push({
                    packageItemId: null,
                    packageId: null,
                    pItemId: pItem.pItemId,
                    soId: salesPackage.soId,
                    companyId: null,
                    skuId: pItem.skuId,
                    price: pItem.product?.price,
                    pItem: pItem
                });
                updateItem('items', _items);
                setAlert('info', 'Added')
            } else {
                setAlert('info', 'Product already added');
            }
        }
    };

    const removeItem = (key: string, value: any) => {
        if (!value) return;
        let _items: any[] = [...get(salesPackage, 'items', [])];
        _items = _items.filter((item) => item[key] != value);
        updateItem('items', _items);
    };

    const renderProduct = (item: PackageItem | null) => {
        if (isGrouped) {
            return <div>
                <label className='text-900'>{get(item, 'pItems.0.pItem.product.name')}</label><br />
                <span className='text-sm'>SKU: {get(item, 'skuId')}</span>
            </div>
        }
        return <div>
            <label className='text-900'>{get(item, 'pItem.product.name')}</label><br />
            <span className='text-sm'>REID: {get(item, 'pItem.REID')}</span>
        </div>
    };

    const renderCross = (item: PackageItem) => {
        if (!item?.skuId) {
            return <div style={{ width: 80 }}></div>;
        }
        return (
            <div className="flex align-items-center">
                <Button icon="pi pi-times" severity="danger" aria-label="Cancel" size="small" onClick={() => removeItem('pItemId', item.pItemId)} />
            </div>
        );
    };

    const renderGroupCross = (item: PackageItem) => {
        if (!item?.skuId) {
            return <div style={{ width: 80 }}></div>;
        }
        return (
            <div className="flex align-items-center">
                <Button icon="pi pi-times" severity="danger" aria-label="Cancel" size="small" onClick={() => removeItem('skuId', get(item, 'skuId', null))} />
            </div>
        );
    };

    const customContent = (
        <span className="p-input-icon-right w-full">
            <IconField>
                <InputIcon className={`pi ${isLoading ? 'pi-spin pi-spinner' : 'pi-search'}`}> </InputIcon>
                <InputText value={soSearch}
                    onChange={(e) => setSOSearch(e.target.value)}
                    placeholder="Search SO #"
                    style={{ width: "100%" }}
                    autoFocus />
            </IconField>
        </span>
    );

    const handleKeyPress = (event: any) => {
        if (event.key === "Enter") {
            console.log("Scanned Value:", event.target.value);
            handleProductSearch(event.target.value)
        }
    };


    const grouped = groupBy(get(salesPackage, 'items', []), 'skuId');
    const groupData = Object.keys(grouped).map((key) => ({
        skuId: key,
        ordered: filter(get(salesPackage, 'so.items', []), { skuId: key }).length > 0 ? get(filter(get(salesPackage, 'so.items', []), { skuId: key }), '0.quantity', 0) : 0,
        packed: grouped[key].length,
        pItems: grouped[key],
    }));

    return (
        <Sidebar
            isVisible={dialogVisible}
            action={isEdit ? 'edit' : 'add'}
            width={'60vw'}
            title={(isEdit) ? salesPackage.pkgNumber : 'New Package' + (salesOrder ? ` - ${salesOrder.soNumber}` : '')}
            closeIcon={closeIcon}
            onSave={onSave}
            content={<>
                <div>
                    {
                        salesOrder == null && <div className="field col-5 p-0">
                            <label htmlFor="name3" className="w-full ">
                                Sales Order<span className='text-red'>*</span>
                            </label>
                            <div className="w-full">
                                <Dropdown
                                    value={salesPackage.soId}
                                    filter
                                    disabled={salesOrder ? true : false}
                                    onChange={(e) => updateItem('soId', e.value)}
                                    options={salesOrders}
                                    optionValue="soId"
                                    optionLabel="soId"
                                    placeholder="Select a Sales Order"
                                    className={`w-full ${isSubmitted && !salesPackage.soId ? 'p-invalid' : ''}`}
                                    required={true}
                                    filterTemplate={customContent}
                                    filterBy='soNumber'
                                    valueTemplate={(option: any) => {
                                        return <>
                                            <small className='small-desc'>{get(salesPackage, 'so.customer.name')}</small>
                                            <p>{get(salesPackage, 'so.soNumber', 'Select a Sales Order')}</p>
                                        </>
                                    }}
                                    itemTemplate={(option) => <>
                                        <small className='small-desc'>{get(option, 'customer.name')}</small>
                                        <p>{get(option, 'soNumber')}</p>
                                    </>}
                                />
                            </div>
                        </div>
                    }

                    {
                        salesPackage.soId && <div className="mt-4">
                            <h5>Line Items</h5>
                            <div className='grid gap-4 align-items-center pl-2 mb-3'>
                                <div className="grid col-5 p-0 m-0">
                                    <div className="w-full">
                                        <IconField>
                                            <InputIcon className={`pi ${isLoading ? 'pi-spin pi-spinner' : 'pi-qrcode'}`}> </InputIcon>
                                            <InputText
                                                value={pSearch}
                                                onChange={(e) => setPSearch(e.target.value)}
                                                onKeyDown={handleKeyPress}
                                                placeholder="Scan or Type REID here..."
                                                className='w-full'
                                                autoFocus />
                                        </IconField>
                                    </div>
                                </div>
                                {
                                    salesPackage.items.length == 0 && <>
                                        <div><span>or</span></div>
                                        <div><Button type="button" label="Auto insert" className="p-button-sm" onClick={handleAutoPackgaging} /></div>
                                    </>
                                }
                            </div>
                            <Message
                                style={{
                                    color: '#696cff'
                                }}
                                className="w-full justify-content-start mb-2"
                                severity="warn"
                                content={<div className="flex align-items-center">
                                    <InputSwitch checked={isGrouped} onChange={(e) => setIsGrouped(e.value)} />
                                    <div className="text-warn ml-2">Show items by product group</div>
                                </div>}
                            />
                            <DataTable
                                scrollable
                                showGridlines
                                value={isGrouped ? groupData : [...get(salesPackage, 'items', [])]}
                                selectionMode="single"
                                dataKey="productId"
                                className='table-line-item'
                                scrollHeight="70%"
                                style={{ height: '80%' }}
                                emptyMessage={'No items added'}
                            >
                                <Column field="soDate" header="Product & SKU" body={(data, options: ColumnBodyOptions) => renderProduct(data)}></Column>
                                {
                                    isGrouped && <Column field="ordered" header="Ordered" style={{ width: 80, textAlign: 'right' }}></Column>
                                }
                                {
                                    isGrouped && <Column field="packed" header="Packed" style={{ width: 80, textAlign: 'right' }}></Column>
                                }
                                <Column style={{ width: 30 }} body={isGrouped ? renderGroupCross : renderCross}></Column>
                            </DataTable>
                        </div>
                    }
                </div>
            </>}
        />
    )
}
