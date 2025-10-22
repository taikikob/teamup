import { Link } from "react-router-dom";
import { useNotifications } from "../contexts/NotificationContext";
import { formatDistanceToNow } from "date-fns";
import '../css/InboxPage.css'

function InboxPage() {
  const { notifications, fetchNotifications, loadingNotifications, markAsRead, markAsUnread, updatingIds } = useNotifications();

  return (
    <div className="inbox-page">
      <h1>Inbox</h1>
      <button className="refresh-button" onClick={fetchNotifications} style={{ marginBottom: "1em" }}>
        <img src="/refresh-icon.svg" alt="Refresh" style={{ width: "20px", height: "20px" }} />
      </button>
      <div>
        {loadingNotifications ? (
          <div>Loading notifications...</div>
        ) : notifications.length > 0 ? (
          notifications.map((notif) => (
            <div key={notif.notification_id} className="notification-card">
              <h3>{notif.type}</h3>
              <p>{notif.content}</p>
              <small>
                {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
              </small>
              <button
                className="read-button" 
                onClick={() => notif.is_read ? markAsUnread(notif.notification_id) : markAsRead(notif.notification_id)}
                disabled={updatingIds.has(notif.notification_id)}
              >
                {notif.is_read ? 'Mark as Unread' : 'Mark as Read'}
              </button>
              {notif.type !== 'player_removed' && notif.type !== 'player_comment_added' && notif.type !== 'team_deleted' && (
                <Link to={`/teams/${notif.team_id}/mastery?nodeId=${notif.node_id}&taskId=${notif.task_id}`}>
                  <button className="view-button">View</button>
                </Link>
              )}
              {notif.type === 'player_comment_added' && (
                <Link to={`/teams/${notif.team_id}/mastery?nodeId=${notif.node_id}&taskId=${notif.task_id}&playerId=${notif.sent_from_id}`}>
                  <button className="view-button">View</button>
                </Link>
              )}
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