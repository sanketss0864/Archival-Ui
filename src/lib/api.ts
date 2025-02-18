export interface TableList {
  tablename: string;
}

export interface FieldData {
  fieldname: string;
  Value: string;
  DataType: string;
}

export interface TableData {
  Id: string;
  fielddata: FieldData[];
}

export interface PaginatedResponse {
  data: TableData[];
  total: number;
  page: number;
  pageSize: number;
}

const TABLE_LIST_API = "https://prod-13.centralindia.logic.azure.com:443/workflows/ad04b0c6abf041aeb949c8fa5ccfde70/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=slzxfq1JlVpxeLuaXC9o7JxDQtcdUcuTAH-3bx2F8e8";
const PAGINATED_API = "https://prod-10.centralindia.logic.azure.com:443/workflows/823c78670469402c8d7699c066599f0e/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=z-H_EeX3KOKZ67WvmVNzP3PMg2ZjAYZlleb0FwYVg0c";

export async function fetchTables(): Promise<TableList[]> {
  try {
    const response = await fetch(TABLE_LIST_API, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching tables:', error);
    throw error;
  }
}

export async function fetchPaginatedData(
  tablename: string,
  page: number,
  itemsize: number,
  query: string = ""
): Promise<PaginatedResponse> {
  try {
    const response = await fetch(PAGINATED_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tablename,
        page,
        itemsize,
        query,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // If the response is an array, wrap it in our PaginatedResponse format
    if (Array.isArray(data)) {
      return {
        data,
        total: data.length,
        page,
        pageSize: itemsize
      };
    }

    return data;
  } catch (error) {
    console.error('Error fetching paginated data:', error);
    throw error;
  }
}