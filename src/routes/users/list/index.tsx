import React, { useState } from "react";
import { useGo } from "@refinedev/core";
import { 
  CreateButton, 
  DeleteButton, 
  EditButton, 
  FilterDropdown, 
  List, 
  useTable 
} from "@refinedev/antd";
import { getDefaultFilter } from "@refinedev/core";
import { 
  SearchOutlined, 
  UserOutlined, 
  TeamOutlined, 
  CheckOutlined, 
  CloseOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ShopOutlined
} from "@ant-design/icons";
import { 
  Input, 
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

  // Handle verification status change
  const handleVerificationChange = async (userId: string, newStatus: boolean): Promise<boolean> => {
    const loadingKey = `verify-${userId}`;
    setUpdatingUsers(prev => ({ ...prev, [loadingKey]: true }));
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ isVerified: newStatus })
        .eq('id', userId);

      if (error) throw error;
      
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
            <EditButton
              hideText
              size="small"
              recordItemId={id}
              onClick={() => go({ to: `/users/edit/${id}` })}
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
      <Table
        rowKey="id"
        columns={columns}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} users`,
        }}
        // Add your data source here or use useTable hook
        // dataSource={users}
        // loading={loading}
      />
    </List>
  );
};

export default UsersListPage;
