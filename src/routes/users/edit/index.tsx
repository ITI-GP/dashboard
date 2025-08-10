import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '@refinedev/core';
import { Spin, Result, Button } from 'antd';
import { PageHeader } from '@ant-design/pro-layout';
import { LeftOutlined } from '@ant-design/icons';
import { fetchUserById, updateUser } from './queries';
import { UserForm } from './form';

export const UserEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const { open } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const userData = await fetchUserById(id);
        setUser(userData);
      } catch (error) {
        console.error('Error loading user:', error);
        open?.({
          type: 'error',
          message: 'Error',
          description: 'Failed to load user data',
        });
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [id, open]);

  const handleFinish = async (values: any) => {
    if (!id) return;
    
    try {
      setSaving(true);
      // Only send the fields that can be updated
      const updateData = {
        name: values.name,
        phone: values.phone,
        role: values.role,
        isVerified: values.isVerified,
        isCompany: values.isCompany,
        isOwner: values.isOwner,
        isRenter: values.isRenter,
      };
      
      await updateUser(id, updateData);
      
      // Show success message
      open?.({
        type: 'success',
        message: 'Success',
        description: 'User updated successfully',
      });
      
      // Navigate back to users list
      navigate('/users');
    } catch (error) {
      console.error('Error updating user:', error);
      open?.({
        type: 'error',
        message: 'Error',
        description: 'Failed to update user',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return (
      <Result
        status="404"
        title="User Not Found"
        subTitle="Sorry, the user you are looking for does not exist."
        extra={
          <Button type="primary" onClick={() => navigate('/users')}>
            Back to Users
          </Button>
        }
      />
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <PageHeader
        title="Edit User"
        onBack={() => window.history.back()}
        backIcon={<LeftOutlined />}
        style={{ padding: 0, marginBottom: 24 }}
      />
      
      <UserForm
        initialValues={{
          ...user,
          // Map database fields to form field names
          isVerified: user.is_verified,
          isCompany: user.is_company,
          isOwner: user.is_owner,
          isRenter: user.is_renter,
        }}
        onFinish={handleFinish}
        isEditing={true}
        loading={saving}
      />
    </div>
  );
};

export default UserEditPage;
