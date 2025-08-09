import React from "react";
import { SettingOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Popover, Skeleton, Space } from "antd";

import { CustomAvatar } from "../../custom-avatar";
import { Text } from "../../text";
import { AccountSettings } from "../account-settings";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export const CurrentUser = () => {
  const [opened, setOpened] = React.useState(false);
  const { user, loading } = useCurrentUser();

  const content = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Text
        strong
        style={{
          padding: "12px 20px",
        }}
      >
        {user?.name || 'User'}
      </Text>
      <div style={{ padding: '8px 16px' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {user?.email || 'No email'}
        </Text>
      </div>
      <div style={{ borderTop: '1px solid #f0f0f0', margin: '4px 0' }} />
      <div style={{ padding: '4px' }}>
        <Button
          style={{ textAlign: 'left', width: '100%' }}
          icon={<SettingOutlined />}
          type="text"
          block
          onClick={() => setOpened(true)}
        >
          Account settings
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Popover
        placement="bottomRight"
        content={content}
        trigger="click"
        // overlayInnerStyle={{ padding: 0 }}
        // overlayStyle={{ zIndex: 999 }}
      >
        {loading ? (
          <Skeleton.Avatar active size="default" shape="circle" />
        ) : (
          <Space align="center" size="small">
            <CustomAvatar
              name={user?.name || 'User'}
              src={user?.avatar_url || undefined}
              size="default"
              style={{ cursor: 'pointer' }}
            />
            <Text strong style={{ marginLeft: 8 }}>
              {user?.name || 'User'}
            </Text>
          </Space>
        )}
      </Popover>
      {user && (
        <AccountSettings
          opened={opened}
          setOpened={setOpened}
          userId={user.id}
        />
      )}
    </>
  );
};
