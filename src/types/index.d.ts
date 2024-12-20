import React, { ReactNode } from 'react';
import {
    Page,
    AppBreadcrumbProps,
    Breadcrumb,
    BreadcrumbItem,
    MenuProps,
    MenuModel,
    AppSubMenuProps,
    LayoutConfig,
    LayoutState,
    AppBreadcrumbState,
    Breadcrumb,
    LayoutContextProps,
    MailContextProps,
    MenuContextProps,
    ChatContextProps,
    TaskContextProps,
    AppConfigProps,
    NodeRef,
    AppTopbarRef,
    MenuModelItem,
    AppMenuItemProps,
    AppMenuItem
} from './layout';

type ChildContainerProps = {
    children: ReactNode;
};

type User = {
    userId: number;
    firstName: string;
    lastName: string;
    displayName: string;
    email: string;
    phone?: string;
    countryCode?: string;
    gender?: string;
    profile?: string;
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
    isSuperAdmin?: boolean;
    isAdmin?: boolean;
    company?: {
        domain: string;
        companyId: string;
        name: string;
    };
    userRole?: string;
    permissions: any[];
};

type CustomResponse = {
    code: string;
    message: string;
    data: any;
    total?: number;
    filters?: any;
    page?: any;
    search?: any;
    totalPages?: any;
    keys?: any[]
};

type AppContextType = {
    displayName: any;
    setDisplayName: (name: any) => void;
    user: any;
    setUser: (user: any) => void;
    company: any;
    setCompany: (company: any) => void;
    isLoading: boolean;
    setLoading: (loading: boolean) => void;
    signOut: () => void;
    setAlert: (type: string, message: string) => void;
    authToken: any;
    setAuthToken: (token: any) => void;
    isScroll: boolean;
    setScroll: (loading: boolean) => void;
    selectedSubLocation: any;
    setSelectedSubLocation: (selectedSubLocation: any) => void;
};

interface Routes {
    routeId: string;
    method: string;
    path: string;
    desc?: string;
}

interface Permissions {
    permissionId: any;
    module: string;
    permission: string;
    desc?: string;
}
interface Roles {
    roleId: any;
    name: string;
    desc?: string;
}

interface Company {
    companyId: number;
    subdomain: string;
    name: string;
    ownerId: number;
    logo?: string;
    pocName?: string;
    pocnumber?: string;
    altPOCName?: string;
    altPOCnumber?: string;
    einnumber?: string;
    gstnumber?: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
    roleId?: number;
    desc?: string;
    owner?: {
        userId: number;
        email: string;
        firstName: string;
        lastName: string;
    };
}

interface CompanyRole {
    companyId: number;
    name: string;
    isActive: boolean;
    createdAt?: any;
    updatedAt?: any;
    roleId?: number;
    desc: any;
}

interface CompanyUser {
    companyUserId?: number;
    companyId?: number;
    createdAt?: string;
    updatedAt?: string;
    roleId?: number;
    user?: {
        companyUserId?: number;
        displayName: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: number;
        countryCode: string;
        isActive: boolean;
        location: string;
        userId: number;
        profile: string;
    };
    roles?: any;
}

interface CompanyMaster {
    codeTypeId: number;
    companyId: number;
    codeType: string;
    desc: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

interface CompanySubLocation {
    locationId?: number;
    warehouseId?: number;
    name: string;
    location: string;
    description: string;
    zip: string;
    data?: {
        locationId: number;
        name: string;
        location: string;
        phone: string;
        zip: string;
    };
    warehouse: {
        name: string;
    }
}
interface Warehouse {
    warehouseId?: number;
    companyId?: number;
    name: string;
    location: string;
    phone: string;
    zip: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    description: string;
    data?: any;
}
interface CompanyRack {
    rackId?: number;
    warehouseId?: number;
    locationId?: number;
    sku: string;
    desc: string;
    rackTypeId: number;
    isActive: boolean;
    warehouse?: {
        locationId: number;
        name: string;
        location: string;
    };
    rows?: any;
    rackType?: {
        code: string;
        value: string;
        masterCodeId: number | null;
    };
    data?: {
        locationId: number;
        name: string;
        location: string;
        desc: string;
        racktype: string;
        noOfRows: any;
        value: string;
        masterCodeId: number;
    };
}
interface CompanyBin {
    binId?: number;
    rackId?: number;
    capacityId?: number;
    sku: string;
    rowId: number;
    isActive: boolean;
    warehouseId: number;
    warehouse?: {
        warehouseId: number;
        sku: string;
        location: string;
        desc: string;
        rackTypeId: number;
    };
    rows?: any;
    binCapacity?: {
        masterCodeId: number;
        value: string;
    };
    data?: {
        rackType: string;
        noOfRows: any;
        value: string;
        masterCodeId: number;
        noOfBins: number;
    };
}
interface CompanyProductsMapping {
    catAttrId: number;
    categoryId: number | null;
    companyId: number | null;
    codeTypeId: number | null;
    selectionType: string;
    isSKUEnabled: boolean;
    isSKURank: number | null;
    sampleValue: string;
    isActive: boolean;
    category: {
        categoryId: number;
        name: string;
    };
    codeType: {
        codeTypeId: number;
        codeType: string;
    };
}
interface Category {
    categoryId?: number;
    companyId?: number;
    parentId?: number;
    name: string;
    desc: string;
    label: string;
    key: number;
    children?: Category[{
        categoryId: number;
        companyId: number;
        parentId: number;
        name: string;
        isActive: boolean;
        key: number;
        desc: string;
        label: string;
        children?: [
            {
                categoryId: number;
                companyId: number;
                parentId: number;
                name: string;
                isActive: boolean;
                key: number;
                label: string;
                desc: string;
            }
        ];
    }];
    isActive: boolean;
    data?: any;
}
interface Category {
    categoryId?: number;
    companyId?: number;
    parentId?: number;
    category:string;
    name: string;
    label: string;
    key: number;
    children?: Category[{
        categoryId: number;
        companyId: number;
        parentId: number;
        name: string;
        isActive: boolean;
        key: number;
        label: string;
        children?: [
            {
                categoryId: number;
                companyId: number;
                parentId: number;
                name: string;
                isActive: boolean;
                key: number;
                label: string;
            }
        ];
    }];
    isActive: boolean;
    data?: any;
}

interface Asset {
    assetId: number;
    companyId?: number;
    name: string;
    type: string;
    location: string;
    sizeInBytes: number;
    assetType: string;
    sizeType?: string;
    height?: number;
    width?: number;
    isExternal?: boolean;
    createdAt?: any;
    updatedAt?: any;
    usedIn?: any;
}

interface MasterCode {
    value: any;
    code: string;
    codeTypeId: number;
    masterCodeId?: number;
    companyId?: number;
    name?: string;
    codeType: string;
    desc: string;
    isActive: boolean;
    codeType: {
        codeType: string;
        codeTypeId: number;
    };
    data?: any;
}
interface Make {
    masterCodeId: number;
    companyId: number;
    codeTypeId: number;
    code: string;
    value: string;
    desc: string;
    codeType: {
        codeType: string;
        codeTypeId: number;
    };
    // data?: any;
    name: string;
    isActive: boolean;
}
interface Vendor {
    [x: string]: any;
    vendorId: number | null;
    name: string;
    note: string;
    name: string;
    aliasName: string;
    companyName: string;
    profile: string | null;
    phone: string;
    email: string;
    isSupplier: boolean;
    fax: string;
    countryCode: string | null;
    currency: string | null;
    website: string;
    warehouseIds: [];
    paymentTerms: [];
    categoryIds: [];
    pocs: [
        {
            firstName: string;
            lastName: string;
            email: string;
            phone: string;
            countryCode: string;
            gender: string;
        }
    ];
    addresses: [
        {
            type: string;
            address1: string;
            address2: string;
            city: string;
            state: string;
            zip: string;
            country: string;
        }
    ];
    note: string;
    gradings: [
        {
            grade: string;
            desc: string;
            processId: string;
            isCrossDock: boolean;
            isScreenDamage: boolean;
            rmaPercentage: string;
        }
    ];
}
interface Customer {
    [x: string]: any;
    vendorId: number | null;
    name: string;
    note: string;
    name: string;
    aliasName: string;
    companyName: string;
    profile: string | null;
    phone: string;
    email: string;
    fax: string;
    isCustomer: boolean;
    isSupplier: boolean;
    countryCode: string | null;
    currency: string | null;
    website: string;
    warehouseIds: [];
    paymentTerms: [];
    categoryIds: [];
    pocs: [
        {
            firstName: string;
            lastName: string;
            email: string;
            phone: string;
            countryCode: string;
            gender: string;
        }
    ];
    addresses: [
        {
            type: string;
            address1: string;
            address2: string;
            city: string;
            state: string;
            zip: string;
            country: string;
        }
    ];
    note: string;
    gradings: [
        {
            grade: string;
            desc: string;
            processId: string;
            isCrossDock: boolean;
            isScreenDamage: boolean;
            rmaPercentage: string;
        }
    ];
}
interface UploadedFile {
    name: string;
    size: number;
    type: string;
}
interface Address {
    type: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
}
interface ContactPerson {
    contactPersonName: string | undefined;
    contactPersonEmail: string | undefined;
    contactPersonPhone: string | undefined;
    name: string;
    phone: string;
    email: string;
}
interface CreateSKU {
    // index:number
    catAttrId: number;
    categoryId: number | null;
    codeType: {
        codeType: string;
        codeTypeId: number | null;
        codes: [
            {
                masterCodeId: number | null;
                value: string;
            }
        ];
    };
    isSKURank: number;
    selectionType: string;
}

interface NewSku {
    catAttrId: number | null;
    categoryId: number | null;
    codeType: {
        codeType: string;
        codeTypeId: number | null;
        codes: [
            {
                masterCodeId: number | null;
                value: string;
            }
        ];
    };
    isSKURank: number;
    selectionType: string;
}
interface CategoryOption {
    label: string;
    key: string;
}

interface SKUOption {
    sku: string;
    skuId: string;
}
interface PurchaseOrder {
    [x: string]: any;
    poId: number | null;
    poNumber: any | null;
    companyId: number | null;
    warehouseId: number | null;
    vendorId: number | null;
    categoryIds: number[] | null;
    poDate: string | null;
    approxDeliveryDate: string | null;
    trackingTypeId: number | null;
    trackingId: string | null;
    statusId: number | null;
    note: string | null;
    quantity: number;
    totalPrice: any;
    paid: any;
}

interface PurchaseItem {
    categoryId: number | null;
    poId: number | null;
    poItemId: number | null;
    companyId: number | null;
    productId: number | null;
    gradeId: number | null;
    isCrossDock: boolean | null;
    quantity: number;
    price: any;
    rowId: any;
    skuId:any;
    internalGrade:any;
    batteryHealthIds:any;
}
interface ReceivePurchaseOrder {
    poId: number | null;
    poNumber: number | null;
    companyId: number | null;
    warehouseId: number | null;
    vendorId: number | null;
    categoryIds: number[] | null;
    poDate: string | null;
    approxDeliveryDate: string | null;
    trackingTypeId: number | null;
    trackingId: string | null;
    statusId: number | null;
    note: string | null;
    totalReceived: any;
    quantity: number;
    totalPrice: any;
    paid: any;
    vendor: {
        name: any;
    };
    status: {
        code: any;
    }
    receivedQuantity: number | null;
    items: [
        {
            [x: string]: number;
            product: {
                name: string | null;
                quantity: number | null;
                receivedQuantity: number | null;
            }
        }
    ]
}

type poItem = {
    product: {
        category: { name: string };
        sku: string;
    };
    binId: string;
    REID: string;
    skuId: string;
};

interface Asset {
    productAssetId: number;
    productId: number;
    assetId: number;
    asset: any;
}
interface ProductAttribute {
    productAttrId: number;
    productId: number;
    catAttrId: number | null;
    attrName: string;
    value: string;
}

interface group {
    pgId: number;
    name: string;
}

interface Product {
    assets?: Asset[];
    attributes?: ProductAttribute[];
    categoryId: number;
    category?: Category;
    companyId: number;
    compareAtPrice: number;
    group?: group | null;
    isActive?: boolean;
    name: string;
    pgId: number;
    price: number;
    productId: number;
    sku: string;
    skuId: string;
    unit?: MasterCode;
    unitId: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface ProductItem {
    pItemId: any;
    companyId: any;
    REID: any;
    poId: any;
    poItemId: any;
    productId: any;
    skuId: any;
    warehouseId: any;
    locationId: any;
    rackId: any;
    rowId: any;
    binId: any;
    statusId: any;
    isAvail: any;
    product: Product;
    rack?: any;
    row?: any;
    location?: Location;
    warehouse?: Warehouse;
    createdAt?: string;
    updatedAt?: string;
}

interface FileUpload {
    name: string;
    size: number;
    objectURL: string; // for displaying the image preview
}
type Grading = {
    grade: string;
    desc: string;
    processId: number | null;
    isCrossDock: boolean;
    isScreenDamage: boolean;
    rmaPercentage: number | null;
};

type Pallet = {
    poId: number;
    palletIds: string;
    palletId: [];
    po: [
        {
            poNumber: string;
        }
    ];
    palletCount: number;
};
type GradeTobin = {
    binGradeId?: number;
    grade: Grade;
    masterCodeId?: number;
    code: string;
    desc: string;
};

interface Item {
    poTrackId: number;
    trackingNumber: string;
}

export interface SalesOrderItem {
    soId: number | null;
    companyId: number | null;
    soId: number | null;
    skuId: number | null;
    quantity: number;
    price: any;
    packed?: any;
    shipped?: any;
    createdAt?: any;
    updatedAt?: any;
    product?: any
}
export interface SalesOrder {
    soId: number | null;
    soNumber: string | null;
    vendorId: number | null;
    companyId: number | null;
    soDate: string | null;
    approxDeliveryDate: string | null;
    statusId: number | null;
    trackingTypeId: number | null;
    trackingNumber: string | null;
    paymentTermsId: number | null;
    shippingPrice: any;
    discountType: any;
    discountAmount: any;
    vat: any;
    paid: any;
    note: string | null;
    price: any;
    totalPrice?: any;
    finalTotalPrice?: any;
    items: SalesOrderItem[],
    createdAt?: any;
    updatedAt?: any;
}
export interface EstimatesItem {
    eItemId: number | null;
    companyId: number | null;
    soId: number | null;
    skuId: any;
    quantity: number;
    price: any;
    isCrossDock: boolean;
    batteryHealth: any;
    internalGrade: any;
    createdAt?: any;
    updatedAt?: any;
    product?: any;
    margin?: any;
    unitPrice?: any;
    itemCounts?: any;

}
export interface Estimates {
    customer: any;
    soDate: any;
    soId: number | null;
    estimateId: number | null;
    soNumber: string | null;
    vendorId: number | null;
    quoteAmount: number | null;
    shippingTypeId: number | null;
    shippingCost: number | null;
    companyId: number | null;
    estimateDate: string | null;
    approxDeliveryDate: string | null;
    batteryHealthIds: any;
    trackingTypeId: number | null;
    trackingNumber: string | null;
    paymentTermsId: any;
    shippingPrice: any;
    discountType: any;
    discountAmount: any;
    isCrossDock: boolean;
    totalMargin: any;
    vat: any;
    paid: any;
    note: string | null;
    price: any;
    items: EstimatesItem[],
    internalGrade: any;
    createdAt?: any;
    updatedAt?: any;
    totalAmount: any;
    skuId: any;
    totalPrice:any;
    isConvertedToSales:boolean;
}

export interface PackageItem {
    packageItemId: number | null | undefined;
    packageId: number | null | undefined;
    soId: number | null | undefined;
    companyId: number | null | undefined;
    pItemId: number | null | undefined;
    skuId: number | null | undefined;
    price: any;
    pItem: ProductItem;
    createdAt?: any;
    updatedAt?: any;
}

export interface Packages {
    packageId: number | null | undefined;
    pkgNumber: string | null;
    soId: number | null | undefined;
    statusId?: number | null | undefined;
    companyId: number | null | undefined;
    items: PackageItem[],
    so?: SalesOrder | null;
    createdAt?: any;
    updatedAt?: any;
}

export interface ShipmentItem {
    id: any,
    shipId: number,
    packageId: number,
    pkgNumber?: any,
    package?: Packages
}

export interface Shipment {
    shipId: number | null | undefined;
    shipNumber: string | null;
    companyId: number | null | undefined;
    soId: number | null | undefined;
    so?: SalesOrder | null;
    shipmentDate: any,
    approxDeliveryDate: any,
    deliveredDateTime: any,
    trackingTypeId: any,
    trackingId: any,
    trackingUrl: any,
    statusId: any,
    note: any,
    packageIds?: any[],
    packages: ShipmentItem[],
    createdAt?: any;
    updatedAt?: any;
}

export interface ReceiveGroupItems {
    categoryId: any,
    category: any,
    skuId: any,
    sku: any,
    ordered: any,
    received: any
}

export type {
    Page,
    AppBreadcrumbProps,
    Breadcrumb,
    BreadcrumbItem,
    MenuProps,
    MenuModel,
    LayoutConfig,
    LayoutState,
    Breadcrumb,
    LayoutContextProps,
    MailContextProps,
    MenuContextProps,
    ChatContextProps,
    TaskContextProps,
    AppConfigProps,
    NodeRef,
    AppTopbarRef,
    AppMenuItemProps,
    ChildContainerProps,
    CustomEvent,
    AppMenuItem,
    CustomResponse,
    AppContextType,
    Routes,
    Permissions,
    RolePermission,
    CompanyUser,
    Roles,
    Company,
    CompanySubLocation,
    CompanyMaster,
    CompanyRole,
    Warehouse,
    CompanyRack,
    CompanyProductsMapping,
    CompanyBin,
    Asset,
    MasterCode,
    Category,
    Make,
    Vendor,
    ContactPerson,
    Address,
    CreateSKU,
    PurchaseOrder,
    PurchaseItem,
    Product,
    NewSku,
    Grading,
    UploadedFile,
    Pallet,
    GradeTobin,
    ReceivePurchaseOrder,
    CategoryOption,
    SKUOption,
    Item,
    poItem,
    Customer,
    Estimates
};
