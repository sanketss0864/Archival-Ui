import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnFiltersState,
  VisibilityState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Filter, Settings2 } from 'lucide-react';
import { TableData } from '@/lib/api';
import { useMemo, useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

interface DataTableProps {
  data: TableData[];
  searchTerm: string;
  loading?: boolean;
  pageCount: number;
  pageIndex: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  hasNextPage: boolean;
}

type FilterValue = {
  value: string;
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith';
};

const operatorOptions = [
  { label: 'Contains', value: 'contains' },
  { label: 'Equals', value: 'equals' },
  { label: 'Starts with', value: 'startsWith' },
  { label: 'Ends with', value: 'endsWith' },
];

const pageSizeOptions = [
  { label: '5 per page', value: '5' },
  { label: '10 per page', value: '10' },
  { label: '20 per page', value: '20' },
  { label: '50 per page', value: '50' },
];

export function DataTable({
  data = [],
  searchTerm,
  loading,
  pageCount,
  pageIndex,
  pageSize,
  onPageChange,
  onPageSizeChange,
  hasNextPage,
}: DataTableProps) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];

    const sampleRow = data[0];
    if (!sampleRow) return [];

    const fieldColumns: ColumnDef<TableData>[] = sampleRow.fielddata.map((field) => ({
      accessorFn: (row) => row.fielddata.find((f) => f.fieldname === field.fieldname)?.Value,
      header: ({ column }) => {
        return (
          <div className="flex items-center justify-between">
            <span>{field.fieldname}</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 p-0 hover:bg-accent">
                  <Filter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Filter {field.fieldname}</h4>
                    <p className="text-sm text-muted-foreground">
                      Enter a value to filter this column
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Select
                      value={(column.getFilterValue() as FilterValue)?.operator || 'contains'}
                      onValueChange={(value) => {
                        column.setFilterValue((prev: FilterValue) => ({
                          operator: value,
                          value: prev?.value || '',
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select operator" />
                      </SelectTrigger>
                      <SelectContent>
                        {operatorOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder={`Filter ${field.fieldname}...`}
                      value={(column.getFilterValue() as FilterValue)?.value || ''}
                      onChange={(event) =>
                        column.setFilterValue((prev: FilterValue) => ({
                          operator: prev?.operator || 'contains',
                          value: event.target.value,
                        }))
                      }
                      className="h-8"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        );
      },
      id: field.fieldname,
      filterFn: (row, columnId, filterValue: FilterValue) => {
        const value = row.getValue(columnId) as string;
        if (!value || !filterValue?.value) return true;
        
        const searchValue = filterValue.value.toLowerCase();
        const cellValue = value.toLowerCase();

        switch (filterValue.operator) {
          case 'contains':
            return cellValue.includes(searchValue);
          case 'equals':
            return cellValue === searchValue;
          case 'startsWith':
            return cellValue.startsWith(searchValue);
          case 'endsWith':
            return cellValue.endsWith(searchValue);
          default:
            return true;
        }
      },
    }));

    return [
      {
        accessorKey: 'Id',
        header: ({ column }) => {
          return (
            <div className="flex items-center justify-between">
              <span>ID</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 p-0 hover:bg-accent">
                    <Filter className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Filter ID</h4>
                      <p className="text-sm text-muted-foreground">
                        Enter a value to filter this column
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <Select
                        value={(column.getFilterValue() as FilterValue)?.operator || 'contains'}
                        onValueChange={(value) => {
                          column.setFilterValue((prev: FilterValue) => ({
                            operator: value,
                            value: prev?.value || '',
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select operator" />
                        </SelectTrigger>
                        <SelectContent>
                          {operatorOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Filter ID..."
                        value={(column.getFilterValue() as FilterValue)?.value || ''}
                        onChange={(event) =>
                          column.setFilterValue((prev: FilterValue) => ({
                            operator: prev?.operator || 'contains',
                            value: event.target.value,
                          }))
                        }
                        className="h-8"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          );
        },
        cell: ({ row }) => (
          <div className="font-mono text-sm">{row.getValue('Id')}</div>
        ),
        filterFn: (row, columnId, filterValue: FilterValue) => {
          const value = row.getValue(columnId) as string;
          if (!value || !filterValue?.value) return true;
          
          const searchValue = filterValue.value.toLowerCase();
          const cellValue = value.toLowerCase();

          switch (filterValue.operator) {
            case 'contains':
              return cellValue.includes(searchValue);
            case 'equals':
              return cellValue === searchValue;
            case 'startsWith':
              return cellValue.startsWith(searchValue);
            case 'endsWith':
              return cellValue.endsWith(searchValue);
            default:
              return true;
          }
        },
      },
      ...fieldColumns,
    ];
  }, [data]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter: searchTerm,
      columnFilters,
      columnVisibility,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    pageCount,
    manualPagination: true,
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border/40">
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Settings2 className="mr-2 h-4 w-4" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table.getAllColumns().map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex-1 overflow-auto custom-scrollbar">
        <Table>
          <TableHeader className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-12">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: pageSize }).map((_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: columns.length }).map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-accent/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between p-4 border-t border-border/40">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-muted-foreground">
            Page {pageIndex + 1}
          </div>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-8 w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(pageIndex - 1)}
            disabled={pageIndex === 0}
            className="h-8 w-8 rounded-full"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(pageIndex + 1)}
            disabled={!hasNextPage}
            className="h-8 w-8 rounded-full"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}