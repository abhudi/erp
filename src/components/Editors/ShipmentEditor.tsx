
import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Panel } from 'primereact/panel';
import { classNames } from 'primereact/utils';
import Sidebar from '../Sidebar';
import { Dropdown, DropdownFilterEvent } from 'primereact/dropdown';
import { CustomResponse, MasterCode, PackageItem, Packages, Product, ProductItem, SalesOrder, Shipment } from '../../types';
import { filter, find, get, groupBy, map, pick, set } from 'lodash';
import { Calendar } from 'primereact/calendar';
import moment, { isMoment } from 'moment';
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
import { constant } from '../../utils/constant';

interface ShipmentEditorOptions {
    title?: string;
    isVisible: boolean;
    isEdit?: boolean;
    _shipment?: Shipment | null;
    onClose: (isLoad: boolean) => void
}

const defaultShipment: Shipment = {
    shipId: null,
    shipNumber: null,
    soId: null,
    companyId: null,
    packages: [],
    packageIds: [],
    shipmentDate: null,
    approxDeliveryDate: null,
    deliveredDateTime: null,
    trackingTypeId: null,
    trackingId: null,
    trackingUrl: null,
    statusId: null,
    note: ''
}

export default function ShipmentEditor({ title = 'New Shipment', isVisible = false, _shipment = null, isEdit = false, onClose = (isLoad) => { } }: ShipmentEditorOptions) {
    const ref = useRef<Panel>(null);
    const { user, isLoading, setLoading, setScroll, setAlert } = useAppContext();
    const [dialogVisible, setDialogVisible] = useState(false);
    const [isSubmitted, setSubmitted] = useState<boolean>(false);
    const [isGrouped, setIsGrouped] = useState<boolean>(true);
    const [shipment, setShipment] = useState<Shipment>(defaultShipment);
    const [salesOrder, setSalesOrder] = useState<SalesOrder | null>(null);
    const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
    const [soSearch, setSOSearch] = useState<any>('');
    const [pSearch, setPSearch] = useState<any>('');
    const [packages, setPackages] = useState<Packages[]>([]);
    const [trackings, setTrackings] = useState<MasterCode[]>([]);

    useEffect(() => {
        if (isVisible) {
            if (_shipment) {
                setShipment(_shipment)
            }
            else {
                setShipment(defaultShipment)
            }
            setDialogVisible(true)
            fetchSo();
            fetchCarriers();
            setPackages([])
            if (_shipment?.soId) {
                fetchPackages(_shipment.soId)
            }
        }
        else {
            setPackages([])
            setShipment(defaultShipment)
            setDialogVisible(false)
        }
    }, [isVisible]);

    useEffect(() => {
        if (_shipment) {
            setShipment(_shipment)
        }
        else {
            setShipment(defaultShipment)
        }
    }, [_shipment]);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleFilter(soSearch);
        }, 500);

        return () => clearTimeout(timer);
    }, [soSearch]);

    const closeIcon = () => {
        onClose(false);
    }

    const fetchSo = async (soNumber = '') => {
        let params: any = {
            filters: {},
            limit: 500,
            page: 0,
            include: 'customer,having_packages'
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

    const fetchPackages = async (soId: any) => {
        let params: any = {
            filters: {
                soId: +soId
            },
            limit: 500,
            page: 0
        };

        const companyId = get(user, 'company.companyId');
        setLoading(true);
        const queryString = buildQueryParams(params);
        const response: CustomResponse = await GetCall(`/company/${companyId}/packages?${queryString}`);
        if (response.code == 'SUCCESS') {
            setPackages(response.data);
        } else {
            setPackages([]);
        }
        setLoading(false);
    }

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

    const onSave = async () => {
        const companyId = get(user, 'company.companyId');

        if (shipment.packages.length == 0 || !shipment.soId || !isMoment(moment(shipment.shipmentDate))) {
            return;
        }

        setLoading(true);

        let data: any = { ...shipment };

        // remove unwanted data
        if (data.so) {
            delete data.so;
        }

        if (shipment.shipId) {
            const response: CustomResponse = await PutCall(`/company/${companyId}/sales-orders/${shipment.soId}/shipments/${shipment.shipId}`, data);
            if (response.code == 'SUCCESS') {
                onClose(true)
                setAlert('success', 'Shipment updated!')
            } else {
                setAlert('error', response.message)
            }
        }
        else {
            const response: CustomResponse = await PostCall(`/company/${companyId}/sales-orders/${shipment.soId}/shipments`, data);
            if (response.code == 'SUCCESS') {
                setAlert('success', 'Shipment added!')
                onClose(true)
            } else {
                setAlert('error', response.message)
            }
        }
        setLoading(false);
    }

    const updateItem = async (key: string, value: any) => {
        const _package: Shipment = JSON.parse(JSON.stringify(shipment));
        if (key === 'soId') {
            let so = find(salesOrders, { soId: +value });
            if (so && _package.soId != +value) {
                _package.so = so;
            }
            fetchPackages(+value)
        }
        else if (key === 'so') {
            _package.soId = value.soId;
            fetchPackages(+value.soId)
        }
        set(_package, key, value);
        setShipment(_package);
    }

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

    const onProductSelect = (pItem: ProductItem) => {
        if (pItem) {
            let _items: PackageItem[] = [...get(shipment, 'items', [])];
            let isPresent = find(_items, { pItemId: pItem.pItemId });
            if (!isPresent) {
                _items.push({
                    packageItemId: null,
                    packageId: null,
                    pItemId: pItem.pItemId,
                    soId: shipment.soId,
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
        let _items: any[] = [...get(shipment, 'items', [])];
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
            handleProductSearch(event.target.value)
        }
    };

    const grouped = groupBy(get(shipment, 'items', []), 'skuId');
    const groupData = Object.keys(grouped).map((key) => ({
        skuId: key,
        ordered: filter(get(shipment, 'so.items', []), { skuId: key }).length > 0 ? get(filter(get(shipment, 'so.items', []), { skuId: key }), '0.quantity', 0) : 0,
        packed: grouped[key].length,
        pItems: grouped[key],
    }));

    return (
        <Sidebar
            isVisible={dialogVisible}
            action={isEdit ? 'edit' : 'add'}
            width={'60vw'}
            title={(isEdit) ? shipment.shipNumber : title}
            closeIcon={closeIcon}
            onSave={onSave}
            content={<>
                {
                    salesOrder == null && !isEdit && <div className='grid p-0'>
                        <div className='col-6'>
                            <div className="field p-0">
                                <label htmlFor="name3" className="w-full ">
                                    Sales Order<span className='text-red'>*</span>
                                </label>
                                <div className="w-full">
                                    <Dropdown
                                        value={shipment.soId}
                                        filter
                                        disabled={salesOrder ? true : false}
                                        onChange={(e) => updateItem('soId', e.value)}
                                        options={salesOrders}
                                        optionValue="soId"
                                        optionLabel="soId"
                                        placeholder="Select a Sales Order"
                                        className={`w-full ${isSubmitted && shipment.soId ? 'p-invalid' : ''}`}
                                        required={true}
                                        filterTemplate={customContent}
                                        filterBy='soNumber'
                                        valueTemplate={(option: any) => {
                                            return <>
                                                <small className='small-desc'>{get(shipment, 'so.customer.name')}</small>
                                                <p>{get(shipment, 'so.soNumber', 'Select a Sales Order')}</p>
                                            </>
                                        }}
                                        itemTemplate={(option) => <>
                                            <small className='small-desc'>{get(option, 'customer.name')}</small>
                                            <p>{get(option, 'soNumber')}</p>
                                        </>}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                }
                <div className='grid p-0'>
                    <div className='col-6'>
                        <div className="field p-0">
                            <label htmlFor="name3" className="w-full ">
                                Packages<span className='text-red'>*</span>
                            </label>
                            <div className="w-full">
                                <MultiSelect
                                    value={shipment.packageIds}
                                    onChange={(e) => updateItem('packageIds', e.value)}
                                    options={packages}
                                    optionLabel="pkgNumber"
                                    optionValue="packageId"
                                    display="chip"
                                    placeholder="Select packages"
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>
                    <div className='col-6'>
                        <div className="field p-0">
                            <label htmlFor="name3" className="w-full ">
                                Ship Date<span className='text-red'>*</span>
                            </label>
                            <div className="w-full">
                                <Calendar appendTo={'self'} value={shipment?.shipmentDate ? moment(shipment?.shipmentDate).toDate() : null} onChange={(e) => updateItem('shipmentDate', e.value)} placeholder="MM/DD/YYYY" className={`w-full ${isSubmitted && !shipment.shipmentDate ? 'p-invalid' : ''}`} showIcon required={true} />
                            </div>
                        </div>
                    </div>
                    <div className='col-6'>
                        <div className="field p-0">
                            <label htmlFor="name3" className="w-full ">
                                Carrier
                            </label>
                            <div className="w-full">
                                <Dropdown value={shipment.trackingTypeId} onChange={(e) => updateItem('trackingTypeId', e.value)} options={trackings} optionLabel="code" optionValue="masterCodeId" placeholder="Shipment carrier" className="w-full" />
                            </div>
                        </div>
                    </div>
                    <div className='col-6'>
                        <div className="field p-0">
                            <label htmlFor="name3" className="w-full ">
                                Tracking #
                            </label>
                            <div className="w-full">
                                <InputText className="w-full" value={shipment.trackingId} onChange={(e) => updateItem('trackingId', e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <div className='col-6'>
                        <div className="field p-0">
                            <label htmlFor="name3" className="w-full ">
                                Tracking URL
                            </label>
                            <div className="w-full">
                                <InputText className="w-full" value={shipment.trackingUrl} onChange={(e) => updateItem('trackingUrl', e.target.value)} />
                            </div>
                        </div>
                    </div>
                </div>
            </>}
        />
    )
}
