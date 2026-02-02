import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    api.get("/api/admin/audit-logs").then((res) => {
      setLogs(res.items || []);
    });
  }, []);

  return (
    <div>
      <h1>Admin Audit Logs</h1>
      <table>
        <thead>
          <tr>
            <th>Admin</th>
            <th>Method</th>
            <th>Path</th>
            <th>Status</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l._id}>
              <td>{l.adminId?.phone || "-"}</td>
              <td>{l.method}</td>
              <td>{l.path}</td>
              <td>{l.status}</td>
              <td>{new Date(l.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
