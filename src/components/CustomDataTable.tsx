
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Button } from 'primereact/button';
import { DataTable, DataTableBaseProps, DataTableFilterEvent, DataTablePageEvent, DataTableValueArray } from 'primereact/datatable';
import { Column, ColumnProps } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';

interface ColumnItem extends ColumnProps {
    dbField?: string
}

interface ExtraButton {
    icon: any,
    onClick?: (item: any) => void
}

interface CustomTableOption extends DataTableBaseProps<DataTableValueArray> {
    title?: string,
    data: any[],
    limit: number,
    page: number,
    columns: ColumnItem[],
    tree?: boolean,
    filter?: boolean,
    include?: string[],
    isEdit?: boolean,
    isDelete?: boolean,
    isView?: boolean,
    extraButtons?: ExtraButton[],
    onLoad?: (item: any) => void,
    onView?: (item: any) => void,
    onEdit?: (item: any) => void,
    onDelete?: (item: any) => void
}

export interface CustomDataTableRef {
    refreshData: () => any,
    getCurrentPagerState: () => any,
    updatePagination: (page: any) => any,
    updatePaginationAfterDelete: (key: string, rowId: any) => void;
}

const CustomDataTable = forwardRef<CustomDataTableRef, CustomTableOption>((props: CustomTableOption, ref?: any) => {
    const [lazyParams, setLazyParams] = useState<any>({
        first: 0,
        rows: 10,
        page: 1,
        sortField: undefined,
        sortOrder: undefined,
        filters: {}
    });

    const [tableHeight, setTableHeight] = useState('30rem');

    useImperativeHandle(ref, () => ({
        getCurrentPagerState: () => {
            return lazyParams
        },
        refreshData: () => {
            setLazyParams({ ...lazyParams })
        },
        updatePagination: (page: number) => {
            setLazyParams({
                ...lazyParams,
                page: page,
                first: page * props.limit,
            })
        },
        updatePaginationAfterDelete: (key: string, rowId: number) => {
            const updatedData = props.data.filter((item) => item[key] !== rowId);
            if (updatedData.length === 0 && props.page > 0) {
                setLazyParams({
                    ...lazyParams,
                    page: props.page - 1,
                    first: (props.page - 1) * props.limit,
                })
            } else {
                setLazyParams({ ...lazyParams })
            }
        }
    }));


    const calculateTableHeight = () => {
        const headerHeight = 250;
        const availableHeight = window.innerHeight - headerHeight - (props.header ? 50 : 0);
        setTableHeight(`${availableHeight}px`);
    };

    useEffect(() => {
        calculateTableHeight();
        window.addEventListener('resize', calculateTableHeight);
        return () => {
            window.removeEventListener('resize', calculateTableHeight);
        };
    }, []);

    useEffect(() => {
        loadDataFromServer();
    }, [lazyParams]);

    const loadDataFromServer = async () => {
        const params = {
            page: lazyParams.page || 1,
            limit: props.limit,
            sortBy: lazyParams.sortField,
            sortOrder: lazyParams.sortOrder === 1 ? 'asc' : 'desc',
            filters: convertFiltersToQueryParams(lazyParams.filters),
            include: props.include || []
        };
        if (props.onLoad) {
            props.onLoad(params)
        }
    }

    const convertFiltersToQueryParams = (filters: any) => {
        const filterParams: any = {};
        if (filters) {
            Object.keys(filters).forEach((filterField) => {
                filterParams[filterField] = filters[filterField].value || '';
            });
        }
        return filterParams;
    };

    const headerTemplate = (options: any) => {
        return <div></div>
    }

    const onPage = (event: DataTablePageEvent) => {
        setLazyParams({
            ...lazyParams,
            first: event.first,
            rows: event.rows,
            page: event.page ? event.page + 1 : 1
        });
    };

    const onFilter = (event: DataTableFilterEvent) => {
        setLazyParams({
            ...event,
            first: 0
        });
    }

    const renderActions = (item: any) => {
        return (
            <div className='flex'>
                {
                    props?.extraButtons && props?.extraButtons?.length > 0 && props.extraButtons.map((btn: ExtraButton, index: any) => <Button key={`ExtraButton${index}`} type="button" icon={btn.icon} className="p-button-sm p-button-text" onClick={() => btn.onClick && btn.onClick(item)} />)
                }
                {
                    props.isView && <Button type="button" icon={'pi pi-eye'} className="p-button-sm p-button-text" onClick={() => props.onView && props.onView(item)} />
                }
                {
                    props.isEdit && <Button type="button" icon={'pi pi-pencil'} className="p-button-sm p-button-text" onClick={() => props.onEdit && props.onEdit(item)} />
                }
                {
                    props.isDelete && <Button type="button" icon={'pi pi-trash'} className="p-button-sm p-button-text" style={{ color: 'red' }} onClick={() => props.onDelete && props.onDelete(item)} />
                }
            </div>
        )
    }

    const getCurrentParams = () => {
        return lazyParams
    };

    // console.log('lazyParams', lazyParams)
    return (
        <div className='card erp-table-container'>
            <DataTable
                lazy
                paginator
                scrollable
                removableSort
                {...props}
                totalRecords={props.totalRecords || 0}
                first={lazyParams.first}
                rows={props.limit}
                value={props.data}
                filterDisplay={props.filter ? 'row' : undefined}
                className='erp-table'
                pageLinkSize={3}
                scrollHeight={tableHeight}
                onPage={onPage}
                onFilter={onFilter}
                onSort={onFilter}
                sortField={lazyParams.sortField}
                sortOrder={lazyParams.sortOrder}
                tableStyle={{ minWidth: '30rem' }}
                paginatorTemplate={'CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink'}
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords}">
                {
                    props.columns.map((item: ColumnProps, index: any) => <Column key={index} {...item}></Column>)
                }
                {
                    (props.isEdit || props.isView || props.isDelete || props.extraButtons?.length) && <Column alignFrozen="right" frozen body={renderActions} ></Column>
                }
            </DataTable>
        </div>
    )
});

export default CustomDataTable;

