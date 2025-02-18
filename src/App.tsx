import { useState, useEffect, useMemo, KeyboardEvent } from 'react';
import { TableData, TableList, fetchTables, fetchPaginatedData } from '@/lib/api';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Archive, Search, ChevronLeft, RefreshCw } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from '@/lib/utils';
import { DataTable } from '@/components/data-table';
import { toast } from 'sonner';

// Cache interface
interface TableCache {
  [key: string]: {
    data: TableData[];
    timestamp: number;
    hasNextPage: boolean;
  };
}

function App() {
  const [tables, setTables] = useState<TableList[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<TableData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingSearch, setPendingSearch] = useState('');
  const [sidebarSearchTerm, setSidebarSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [tableCache, setTableCache] = useState<TableCache>({});
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [hasNextPage, setHasNextPage] = useState(true);

  useEffect(() => {
    const loadTables = async () => {
      try {
        const data = await fetchTables();
        setTables(data);
      } catch (error) {
        console.error('Error fetching tables:', error);
        toast.error('Failed to fetch tables');
      }
    };
    loadTables();
  }, []);

  const loadTableData = async (
    tableName: string,
    page: number,
    size: number,
    query: string = '',
    forceRefresh = false
  ) => {
    if (!tableName) return;

    const cacheKey = `${tableName}-${page}-${size}-${query}`;
    const cachedData = tableCache[cacheKey];
    const now = Date.now();
    const cacheExpiry = 20 * 60 * 1000; // 20 minutes

    if (!forceRefresh && cachedData && (now - cachedData.timestamp) < cacheExpiry) {
      setTableData(cachedData.data);
      setHasNextPage(cachedData.hasNextPage);
      return;
    }

    setLoading(true);
    try {
      const response = await fetchPaginatedData(tableName, page + 1, size, query);
      const newData = response.data;
      setTableData(newData);
      
      // Determine if there's a next page by checking if we got a full page of results
      const hasMore = newData.length === size;
      setHasNextPage(hasMore);
      
      // Update cache
      setTableCache(prev => ({
        ...prev,
        [cacheKey]: {
          data: newData,
          hasNextPage: hasMore,
          timestamp: now
        }
      }));

      if (forceRefresh) {
        toast.success('Data refreshed successfully');
      }
    } catch (error) {
      console.error('Error fetching table data:', error);
      toast.error('Failed to fetch table data');
      setHasNextPage(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTableData(selectedTable, pageIndex, pageSize, searchTerm);
  }, [selectedTable, pageIndex, pageSize, searchTerm]);

  const handleRefreshTable = async (tableName: string) => {
    await loadTableData(tableName, pageIndex, pageSize, searchTerm, true);
  };

  const handleSearch = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setSearchTerm(pendingSearch);
      setPageIndex(0); // Reset to first page on new search
    }
  };

  const filteredTables = useMemo(() => {
    if (!sidebarSearchTerm) return tables;
    return tables.filter(table => 
      table.tablename.toLowerCase().includes(sidebarSearchTerm.toLowerCase())
    );
  }, [tables, sidebarSearchTerm]);

  return (
    <ThemeProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar with glassmorphism */}
        <div
          className={cn(
            'backdrop-blur-md bg-background/80 border-r border-border/40 transition-all duration-300 z-20',
            isSidebarCollapsed ? 'w-16' : 'w-64'
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-border/40 px-4">
            <div className={cn('flex items-center gap-2', isSidebarCollapsed && 'hidden')}>
              <Archive className="h-5 w-5" />
              <h2 className="font-semibold">Archived Data</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="h-8 w-8 rounded-full hover:bg-accent"
            >
              <ChevronLeft className={cn(
                'h-4 w-4 transition-transform duration-200',
                isSidebarCollapsed && 'rotate-180'
              )} />
            </Button>
          </div>
          <div className={cn('p-2', isSidebarCollapsed && 'hidden')}>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tables..."
                value={sidebarSearchTerm}
                onChange={(e) => setSidebarSearchTerm(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="p-2">
              {filteredTables.map((table) => (
                <ContextMenu key={table.tablename}>
                  <ContextMenuTrigger>
                    <Button
                      variant={selectedTable === table.tablename ? 'secondary' : 'ghost'}
                      className={cn(
                        'w-full justify-start backdrop-blur-sm hover:bg-accent/50',
                        isSidebarCollapsed ? 'h-10 w-10 p-0' : 'px-2'
                      )}
                      onClick={() => setSelectedTable(table.tablename)}
                    >
                      {!isSidebarCollapsed && (
                        <span className="truncate capitalize">{table.tablename}</span>
                      )}
                    </Button>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-48">
                    <ContextMenuItem
                      onClick={() => handleRefreshTable(table.tablename)}
                      className="cursor-pointer"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh Data
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header with glassmorphism */}
          <div className="flex h-16 items-center justify-between border-b border-border/40 px-6 backdrop-blur-md bg-background/80">
            <h1 className="text-xl font-semibold capitalize">
              {selectedTable || 'Select a table'}
            </h1>
            <div className="flex items-center gap-4">
              <div className="relative max-w-md">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search records... (Press Enter)"
                  value={pendingSearch}
                  onChange={(e) => setPendingSearch(e.target.value)}
                  onKeyDown={handleSearch}
                  className="pl-8 h-9 w-[300px]"
                />
              </div>
              <ThemeToggle />
            </div>
          </div>

          {/* Table Content */}
          <div className="flex-1 p-6 overflow-hidden">
            <div className="h-full rounded-lg border border-border/40 backdrop-blur-sm bg-background/40">
              <DataTable
                data={tableData}
                searchTerm={searchTerm}
                loading={loading}
                pageCount={-1}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={setPageIndex}
                onPageSizeChange={setPageSize}
                hasNextPage={hasNextPage}
              />
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;