import React from "react";

import { CreateButton, DeleteButton, EditButton, FilterDropdown, List, useTable } from "@refinedev/antd";
import { getDefaultFilter, type HttpError, useGo } from "@refinedev/core";

import { SearchOutlined, UserOutlined, TeamOutlined, ShopOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { Input, Space, Table, Tag, Tooltip, Typography, Switch, message } from "antd";
import { useState } from "react";
import { supabase } from "@/providers/supabaseClient";

// Type for verification status update
interface VerificationUpdate {
  is_verified: boolean;
}

import { CustomAvatar, PaginationTotal, Text } from "@/components";

interface Company {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  isVerified?: boolean;
  role?: string;
  isOwner?: boolean;
  isRenter?: boolean;
  created_at: string;
}

const VerificationToggle: React.FC<{
  isVerified: boolean;
  companyId: string;
  onVerificationChange: (companyId: string, newStatus: boolean) => Promise<boolean>;
}> = ({ isVerified, companyId, onVerificationChange }) => {
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(isVerified);

  const handleChange = async (checked: boolean) => {
    setLoading(true);
    try {
      const success = await onVerificationChange(companyId, checked);
      if (success) {
        setCurrentStatus(checked);
      }
    } catch (error) {
      console.error('Error updating verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space>
      <Switch
        checkedChildren={<CheckOutlined />}
        unCheckedChildren={<CloseOutlined />}
        checked={currentStatus}
        onChange={handleChange}
        loading={loading}
        disabled={loading}
      />
      <Tag color={currentStatus ? 'green' : 'red'}>
        {currentStatus ? 'Verified' : 'Not Verified'}
      </Tag>
    </Space>
  );
};

export const CompanyListPage = ({ children }: React.PropsWithChildren) => {
  const go = useGo();

  const [updatingCompanies, setUpdatingCompanies] = useState<Record<string, boolean>>({});

  const handleVerificationChange = async (companyId: string, newStatus: boolean): Promise<boolean> => {
    const loadingKey = `verify-${companyId}`;
    setUpdatingCompanies(prev => ({ ...prev, [loadingKey]: true }));
    
    try {
      console.log('Fetching company data for ID:', companyId);
      // 1. First, get the current company data
      const { data: companyData, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', companyId)
        .single();

      if (fetchError) {
        console.error('Error fetching company data:', fetchError);
        throw new Error(`Failed to fetch company data: ${fetchError.message}`);
      }

      console.log('Updating verification status to:', newStatus);
      
      // Only update the verification record if it exists
      if (companyData.verification_id) {
        console.log('Updating verification record:', companyData.verification_id);
        const { error: verificationError } = await supabase
          .from('verification')
          .update({ 
            status: newStatus ? 'APPROVED' : 'REJECTED',
            updated_at: new Date().toISOString()
          })
          .eq('id', companyData.verification_id);

        if (verificationError) {
          console.error('Verification update error:', verificationError);
          throw verificationError;
        }
      }
      
      message.success(`Company ${newStatus ? 'verified' : 'unverified'} successfully`);
      return true;
    } catch (error) {
      console.error('Error in verification update:', {
        error,
        companyId,
        newStatus,
        timestamp: new Date().toISOString()
      });
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unknown error occurred';
      
      message.error(`Verification update failed: ${errorMessage}`);
      return false;
    } finally {
      setUpdatingCompanies(prev => {
        const newState = { ...prev };
        delete newState[loadingKey];
        return newState;
      });
    }
  };

  const { tableProps, filters } = useTable<Company, HttpError, Company>({
    resource: "users",
    filters: {
      permanent: [
        {
          field: "isCompany",
          operator: "eq",
          value: true,
        },
      ],
      initial: [
        {
          field: "name",
          operator: "contains",
          value: undefined,
        },
      ],
    },
    sorters: {
      initial: [
        {
          field: "created_at",
          order: "desc",
        },
      ],
    },
    pagination: {
      pageSize: 12,
    },
  });

  return (
    <div className="page-container">
      <List
        breadcrumb={false}
        headerButtons={() => {
          return (
            <CreateButton
              onClick={() => {
                // modal is a opening from the url (/companies/new)
                // to open modal we need to navigate to the create page (/companies/new)
                // we are using `go` function because we want to keep the query params
                go({
                  to: {
                    resource: "companies",
                    action: "create",
                  },
                  options: {
                    keepQuery: true,
                  },
                  type: "replace",
                });
              }}
            />
          );
        }}
      >
        <Table
          {...tableProps}
          loading={tableProps.loading}
            pagination={{
              ...tableProps.pagination,
              pageSizeOptions: ["12", "24", "48", "96"],
              showTotal: (total) => (
                <PaginationTotal total={total} entityName="companies" />
              ),
            }}
            rowKey="id"
          >
          <Table.Column<Company>
            dataIndex="name"
            title="Company"
            defaultFilteredValue={getDefaultFilter("name", filters)}
            filterIcon={<SearchOutlined />}
            filterDropdown={(props) => (
              <FilterDropdown {...props}>
                <Input placeholder="Search Company" />
              </FilterDropdown>
            )}
            render={(_, record) => (
              <Space>
                {record.avatarUrl ? (
                  <CustomAvatar
                    shape="square"
                    name={record.name}
                    src={record.avatarUrl}
                  />
                ) : (
                  <div style={{
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#1890ff',
                    borderRadius: '4px'
                  }}>
                    <ShopOutlined style={{ color: '#fff', fontSize: '16px' }} />
                  </div>
                )}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Text strong>{record.name}</Text>
                    {record.isVerified && (
                      <Tooltip title="Verified Company">
                        <span style={{ color: '#52c41a' }}>✓</span>
                      </Tooltip>
                    )}
                  </div>
                  <Text type="secondary">{record.email}</Text>
                </div>
              </Space>
            )}
          />
          <Table.Column<Company>
            title="Type"
            dataIndex="role"
            render={(role: string) => (
              <Tag color={role === 'admin' ? 'red' : 'blue'}>
                {role?.toUpperCase() || 'COMPANY'}
              </Tag>
            )}
          />
          <Table.Column<Company>
            title="Account Type"
            render={(_, record) => (
              <Space size="small">
                {record.isOwner && (
                  <Tooltip title="Vehicle Owner">
                    <Tag icon={<UserOutlined />} color="green">Owner</Tag>
                  </Tooltip>
                )}
                {record.isRenter && (
                  <Tooltip title="Renter">
                    <Tag icon={<TeamOutlined />} color="blue">Renter</Tag>
                  </Tooltip>
                )}
              </Space>
            )}
          />
          <Table.Column<Company>
            title="Verification Status"
            dataIndex="isVerified"
            render={(isVerified: boolean, record: Company) => (
              <VerificationToggle 
                isVerified={isVerified} 
                companyId={record.id} 
                onVerificationChange={handleVerificationChange}
              />
            )}
          />
          <Table.Column<Company>
            title="Created At"
            dataIndex="created_at"
            render={(date) => new Date(date).toLocaleDateString()}
          />
          <Table.Column<Company>
            fixed="right"
            title="Actions"
            render={(_, record) => (
              <Space>
                <EditButton hideText size="small" recordItemId={record.id} />
                <DeleteButton hideText size="small" recordItemId={record.id} />
              </Space>
            )}
          />
          </Table>
      </List>
      {children}
    </div>
  );
};
