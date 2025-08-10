import React, { useEffect, useState } from 'react';
import { useForm } from '@refinedev/antd';
import { Form, Input, Button, Select, Switch, message, Card, Avatar, Typography } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, TeamOutlined } from '@ant-design/icons';
import { useGo } from '@refinedev/core';
import { fetchRoles } from './queries';

const { Title, Text } = Typography;
const { Option } = Select;

interface UserFormProps {
  initialValues?: any;
  onFinish: (values: any) => Promise<void>;
  isEditing?: boolean;
  loading?: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({
  initialValues = {},
  onFinish,
  isEditing = false,
  loading = false,
}) => {
  const { formProps, form } = useForm({
    resource: 'users',
    action: isEditing ? 'edit' : 'create',
    id: initialValues?.id,
    redirect: false,
    onMutationSuccess: () => {
      message.success(`User ${isEditing ? 'updated' : 'created'} successfully`);
    },
  });

  const [roles, setRoles] = useState<Array<{value: string, label: string}>>([]);
  const go = useGo();

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const roleOptions = await fetchRoles();
        setRoles(roleOptions);
      } catch (error) {
        console.error('Error loading roles:', error);
      }
    };

    loadRoles();
  }, []);

  const handleSubmit = async (values: any) => {
    try {
      await onFinish(values);
    } catch (error) {
      console.error('Error saving user:', error);
      message.error('Failed to save user');
    }
  };

  return (
    <Card>
      <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
        <div>
          <Avatar 
            size={100} 
            src={initialValues?.avatar_url} 
            icon={<UserOutlined />}
            style={{ fontSize: 48, backgroundColor: '#f0f2f5' }}
          />
        </div>
        <div>
          <Title level={4} style={{ marginBottom: 4 }}>
            {initialValues?.name || 'New User'}
          </Title>
          <Text type="secondary">{initialValues?.email || ''}</Text>
        </div>
      </div>

      <Form
        form={form}
        {...formProps}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={initialValues}
      >
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: 'Please input user name!' }]}
        >
          <Input 
            prefix={<UserOutlined />} 
            placeholder="Full Name" 
            size="large" 
          />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Please input user email!' },
            { type: 'email', message: 'Please enter a valid email!' },
          ]}
        >
          <Input 
            prefix={<MailOutlined />} 
            placeholder="Email" 
            size="large" 
            disabled={isEditing}
          />
        </Form.Item>

        <Form.Item
          label="Phone"
          name="phone"
        >
          <Input 
            prefix={<PhoneOutlined />} 
            placeholder="Phone Number" 
            size="large" 
          />
        </Form.Item>

        <Form.Item
          label="Role"
          name="role"
          rules={[{ required: true, message: 'Please select a role!' }]}
        >
          <Select placeholder="Select role" size="large">
            {roles.map(role => (
              <Option key={role.value} value={role.value}>
                {role.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Account Type"
          style={{ marginBottom: 8 }}
        >
          <Form.Item
            name="isCompany"
            valuePropName="checked"
            style={{ display: 'inline-block', marginRight: 16 }}
          >
            <Switch 
              checkedChildren="Company" 
              unCheckedChildren="Individual"
            />
          </Form.Item>
          <Form.Item
            name="isOwner"
            valuePropName="checked"
            style={{ display: 'inline-block', marginRight: 16 }}
          >
            <Switch 
              checkedChildren="Owner" 
              unCheckedChildren="Not Owner"
            />
          </Form.Item>
          <Form.Item
            name="isRenter"
            valuePropName="checked"
            style={{ display: 'inline-block' }}
          >
            <Switch 
              checkedChildren="Renter" 
              unCheckedChildren="Not Renter"
            />
          </Form.Item>
        </Form.Item>

        <Form.Item
          label="Account Status"
          name="isVerified"
          valuePropName="checked"
        >
          <Switch 
            checkedChildren="Verified" 
            unCheckedChildren="Not Verified"
          />
        </Form.Item>

        <Form.Item style={{ marginTop: 32 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
            >
              Save Changes
            </Button>
            <Button 
              onClick={() => go({ to: '/users' })}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Card>
  );
};
