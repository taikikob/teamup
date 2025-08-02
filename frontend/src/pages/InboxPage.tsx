import { Link } from "react-router-dom";
import { useNotifications } from "../contexts/NotificationContext";

function InboxPage() {
  const { notifications, fetchNotifications, loadingNotifications } = useNotifications();

  return (
    <div>
      <h1>Inbox</h1>
      <button onClick={fetchNotifications} style={{ marginBottom: "1em" }}>
        {loadingNotifications ? 'Refreshing...' : 'Reload'}
      </button>
      <div>
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div key={notif.notification_id}>
              <h3>{notif.type}</h3>
              <p>{notif.content}</p>
              <small>{notif.created_at}</small>
              <button>{notif.is_read ? 'Mark as Unread' : 'Mark as Read'}</button>
              {notif.type !== 'player_removed' && notif.type !== 'player_comment_added' && (
                <Link to={`/teams/${notif.team_id}/mastery?nodeId=${notif.node_id}&taskId=${notif.task_id}`}>
                  <button>View</button>
                </Link>
              )}
              {notif.type === 'player_comment_added' && (
                <Link to={`/teams/${notif.team_id}/mastery?nodeId=${notif.node_id}&taskId=${notif.task_id}&playerId=${notif.sent_from_id}`}>
                  <button>View</button>
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