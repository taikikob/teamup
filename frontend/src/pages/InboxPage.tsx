import { useState, useEffect } from "react";
import type { notification } from "../types/notification";
import { Link } from "react-router-dom";

function InboxPage() {
  const [notifications, setNotifications] = useState<notification[]>([]);
  // fetch all notifications for the user here
  const fetchNotification = async () => {
    // Make an API call to fetch notifications for this user
    const response = await fetch(`http://localhost:3000/api/notif`, {
        method: 'GET',
        credentials: 'include',
    });
    if (response.ok) {
        const data = await response.json();
        setNotifications(data);
    } else {
        console.error('Failed to fetch notifications');
    }
  };

  useEffect(() => {
    fetchNotification();
  },[])

  return (
    <div>
      <h1>Inbox</h1>
      <div>
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div key={notif.notification_id}>
              <h3>{notif.type}</h3>
              <p>{notif.content}</p>
              <small>{notif.created_at}</small>
              <button>{notif.is_read ? 'Mark as Unread' : 'Mark as Read'}</button>
              <Link to={`/teams/${notif.team_id}/mastery?nodeId=${notif.node_id}&taskId=${notif.task_id}`}>
                <button>View</button>
              </Link>
              <hr />
            </div>
          ))
        ) : (
          <div>No notifications</div>
        )}
      </div>
    </div>
  );
}
export default InboxPage;