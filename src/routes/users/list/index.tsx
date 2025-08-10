import React, { useState, useEffect } from "react";
import { useGo } from "@refinedev/core";
import { 
  CreateButton, 
  DeleteButton, 
  EditButton, 
  List, 
} from "@refinedev/antd";
import { 
  UserOutlined, 
  TeamOutlined, 
  CheckOutlined, 
  CloseOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ShopOutlined,
  EditOutlined
} from "@ant-design/icons";
import { 
  Button,
  Input, 
  Select,
  Space, 
  Table, 
  Tag, 
  Tooltip, 
  Typography, 
  Switch, 
  message,
  Avatar
} from "antd";
import { supabase } from "@/providers/supabaseClient";

const { Text } = Typography;

// Define user interface based on the database schema
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isVerified: boolean;
  isCompany: boolean;
  isOwner: boolean;
  isRenter: boolean;
  created_at: string;
  avatar_url?: string;
  phone?: string;
}

// Role tag component
const RoleTag: React.FC<{ role: string }> = ({ role }) => {
  const color = role === 'admin' ? 'red' : role === 'user' ? 'blue' : 'default';
  return <Tag color={color}>{role.toUpperCase()}</Tag>;
};

// Verification status component
const VerificationStatus: React.FC<{ verified: boolean }> = ({ verified }) => (
  <Tag icon={verified ? <CheckCircleOutlined /> : <CloseCircleOutlined />} color={verified ? 'green' : 'red'}>
    {verified ? 'Verified' : 'Not Verified'}
  </Tag>
);

export const UsersListPage = ({ children }: React.PropsWithChildren) => {
  const go = useGo();
  const [updatingUsers, setUpdatingUsers] = useState<Record<string, boolean>>({});
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<{
    role?: string;
    isVerified?: boolean;
    isCompany?: boolean;
    isOwner?: boolean;
    isRenter?: boolean;
  }>({});
  const [debouncedSearchText, setDebouncedSearchText] = useState('');

  // Debounce search text
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
      // Reset to first page when search text changes
      setPagination(prev => ({ ...prev, current: 1 }));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchText]);

  // Fetch users from Supabase with filters and search
  const fetchUsers = async (currentPage: number, pageSize: number) => {
    setLoading(true);
    try {
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      
      // Build the query
      let query = supabase
        .from('users')
        .select('*', { count: 'exact' });

      // Apply search
      if (debouncedSearchText) {
        query = query.or(`name.ilike.%${debouncedSearchText}%,email.ilike.%${debouncedSearchText}%`);
      }

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key, value);
        }
      });
      
      // Get count with filters applied
      const { count } = await query;
      
      // Add ordering and pagination
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      
      setUsers(data || []);
      setPagination(prev => ({
        ...prev,
        total: count || 0,
        current: currentPage,
        pageSize: pageSize,
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Handle table change (pagination, filters, sorter)
  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    fetchUsers(pagination.current, pagination.pageSize);
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({});
    setSearchText('');
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // Fetch data when filters, search, or pagination changes
  useEffect(() => {
    fetchUsers(pagination.current, pagination.pageSize);
  }, [debouncedSearchText, filters, pagination.pageSize]);

  // Handle verification - can only verify (set to true), not unverify
  const handleVerificationChange = async (userId: string, newStatus: boolean): Promise<boolean> => {
    // If trying to unverify, don't do anything
    if (!newStatus) return false;
    
    const loadingKey = `verify-${userId}`;
    setUpdatingUsers(prev => ({ ...prev, [loadingKey]: true }));
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ isVerified: true })
        .eq('id', userId);

      if (error) throw error;
      
      // Update local state to reflect the change
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, isVerified: true } : user
        )
      );
      
      message.success('User verified successfully');
      
      message.success(`User ${newStatus ? 'verified' : 'unverified'} successfully`);
      return true;
    } catch (error) {
      console.error('Error updating verification status:', error);
      message.error('Failed to update verification status');
      return false;
    } finally {
      setUpdatingUsers(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Table columns
  const columns = React.useMemo(
    () => [
      {
        title: 'User',
        dataIndex: 'name',
        render: (_: any, record: User) => (
          <Space>
            <Avatar src={record.avatar_url} icon={<UserOutlined />} />
            <Text style={{ whiteSpace: 'nowrap' }}>{record.name || 'No Name'}</Text>
          </Space>
        ),
      },
      {
        title: 'Email',
        dataIndex: 'email',
      },
      {
        title: 'Role',
        dataIndex: 'role',
        render: (role: string) => <RoleTag role={role} />,
      },
      {
        title: 'Status',
        dataIndex: 'isVerified',
        render: (isVerified: boolean) => <VerificationStatus verified={isVerified} />,
      },
      {
        title: 'Type',
        render: (_: any, record: User) => (
          <Space size="small">
            {record.isCompany && <Tag icon={<ShopOutlined />}>Company</Tag>}
            {record.isOwner && <Tag icon={<UserOutlined />}>Owner</Tag>}
            {record.isRenter && <Tag icon={<TeamOutlined />}>Renter</Tag>}
          </Space>
        ),
      },
      {
        title: 'Actions',
        dataIndex: 'id',
        render: (id: string, record: User) => (
          <Space>
            <Switch
              checkedChildren={<CheckOutlined />}
              unCheckedChildren={<CloseOutlined />}
              checked={record.isVerified}
              onChange={(checked) => handleVerificationChange(id, checked)}
              loading={updatingUsers[`verify-${id}`]}
              disabled={updatingUsers[`verify-${id}`]}
            />
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => go({ to: `/users/edit/${id}`, type: 'push' })}
              style={{ border: 'none' }}
            />
            <DeleteButton
              hideText
              size="small"
              recordItemId={id}
              resource="users"
            />
          </Space>
        ),
      },
    ],
    [go, updatingUsers]
  );

  return (
    <List
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TeamOutlined style={{ fontSize: 24 }} />
          <Text style={{ fontSize: 24, marginLeft: 8 }}>Users</Text>
        </div>
      }
      breadcrumb={false}
      headerButtons={() => (
        <CreateButton onClick={() => go({ to: '/users/create' })}>
          Create User
        </CreateButton>
      )}
    >
      <div style={{ marginBottom: 16 }}>
        <Space size="middle" style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder="Search by name or email"
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
          <Select
            placeholder="Filter by role"
            allowClear
            style={{ width: 150 }}
            value={filters.role}
            onChange={(value) => handleFilterChange('role', value)}
          >
            <Select.Option value="admin">Admin</Select.Option>
            <Select.Option value="user">User</Select.Option>
          </Select>
          <Select
            placeholder="Verification status"
            allowClear
            style={{ width: 180 }}
            value={filters.isVerified}
            onChange={(value) => handleFilterChange('isVerified', value)}
          >
            <Select.Option value="true">Verified</Select.Option>
            <Select.Option value="false">Not Verified</Select.Option>
          </Select>
          <Select
            placeholder="User type"
            allowClear
            style={{ width: 150 }}
            value={filters.isCompany}
            onChange={(value) => handleFilterChange('isCompany', value === 'true')}
          >
            <Select.Option value="true">Company</Select.Option>
            <Select.Option value="false">Individual</Select.Option>
          </Select>
          <Button onClick={clearAllFilters}>
            Clear filters
          </Button>
        </Space>
      </div>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={users}
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} users`,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        onChange={handleTableChange}
        scroll={{ x: 'max-content' }}
      />
    </List>
  );
};

export default UsersListPage;
