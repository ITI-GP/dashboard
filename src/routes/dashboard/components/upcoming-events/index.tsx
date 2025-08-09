import { CalendarOutlined } from "@ant-design/icons";
import { Badge, Card, List } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

import { Text } from "@/components";

interface Event {
  id: string;
  title: string;
  color: string;
  startDate: string;
  endDate: string;
}

export const CalendarUpcomingEvents = () => {
  // Static data for upcoming events
  const upcomingEvents: Event[] = [
    {
      id: "1",
      title: "Team Meeting",
      color: "blue",
      startDate: dayjs().add(1, 'day').hour(10).minute(0).toISOString(),
      endDate: dayjs().add(1, 'day').hour(11).minute(30).toISOString(),
    },
    {
      id: "2",
      title: "Product Demo",
      color: "green",
      startDate: dayjs().add(2, 'days').hour(14).minute(0).toISOString(),
      endDate: dayjs().add(2, 'days').hour(15).minute(0).toISOString(),
    },
    {
      id: "3",
      title: "Sprint Planning",
      color: "purple",
      startDate: dayjs().add(3, 'days').hour(9).minute(0).toISOString(),
      endDate: dayjs().add(3, 'days').hour(10).minute(30).toISOString(),
    },
    {
      id: "4",
      title: "Client Call",
      color: "orange",
      startDate: dayjs().add(4, 'days').hour(13).minute(0).toISOString(),
      endDate: dayjs().add(4, 'days').hour(14).minute(0).toISOString(),
    },
    {
      id: "5",
      title: "Code Review",
      color: "red",
      startDate: dayjs().add(5, 'days').hour(11).minute(0).toISOString(),
      endDate: dayjs().add(5, 'days').hour(12).minute(30).toISOString(),
    },
  ];

  return (
    <Card
      style={{
        height: "100%",
      }}
      headStyle={{ padding: "8px 16px" }}
      // bodyStyle={{
      //   padding: "0 1rem",
      // }}
      title={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <CalendarOutlined />
          <Text size="sm" style={{ marginLeft: ".7rem" }}>
            Upcoming events
          </Text>
        </div>
      }
    >
      <List
        itemLayout="horizontal"
        dataSource={upcomingEvents}
        renderItem={(item: Event) => {
          const renderDate = () => {
            const start = dayjs(item.startDate);
            const end = dayjs(item.endDate);
            
            // If same day, show: MMM D, YYYY h:mm A - h:mm A
            if (start.isSame(end, 'day')) {
              return `${start.format('MMM D, YYYY')} ${start.format('h:mm A')} - ${end.format('h:mm A')}`;
            }
            // If different days, show: MMM D, YYYY h:mm A - MMM D, YYYY h:mm A
            return `${start.format('MMM D, YYYY h:mm A')} - ${end.format('MMM D, YYYY h:mm A')}`;
          };

          return (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Badge
                    color={item.color}
                    style={{
                      opacity: 1,
                      transition: "opacity 0.3s ease-in-out",
                    }}
                    className="show"
                  />
                }
                title={
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text ellipsis={{ tooltip: item.title }}>
                      {item.title}
                    </Text>
                    <Text size="xs" className="secondary">
                      {renderDate()}
                    </Text>
                  </div>
                }
              />
            </List.Item>
          );
        }}
      />
    </Card>
  );
};

const NoEvent = () => (
  <span
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "220px",
    }}
  >
    No Upcoming Event
  </span>
);
