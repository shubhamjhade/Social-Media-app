import { useEffect, useState } from "react";

function Admin() {
  const [users, setUsers] = useState({ pending: [], active: [] });

  useEffect(() => {
    fetch("http://localhost:3000/api/admin/users", { credentials: "include" })
      .then(res => res.json())
      .then(data => setUsers(data));
  }, []);

  const handleAction = async (id, action) => {
      const url = action === 'approve' ? `/api/admin/approve/${id}` : `/api/admin/user/${id}`;
      const method = action === 'approve' ? 'POST' : 'DELETE';
      if(action === 'delete' && !window.confirm("Confirm delete?")) return;
      
      const res = await fetch(`http://localhost:3000${url}`, { method, credentials: "include" });
      if(res.ok) {
          // Refresh list
          const updated = await fetch("http://localhost:3000/api/admin/users", { credentials: "include" }).then(r=>r.json());
          setUsers(updated);
      }
  };

  return (
    <div>
      <h2 style={{fontSize:'28px', marginBottom:'20px'}}>System Admin</h2>

      {/* PENDING TABLE */}
      <div className="card-panel">
        <h3 style={{color:'#facc15', marginBottom:'15px', paddingBottom:'10px', borderBottom:'1px solid #333'}}>
           ⚠️ Pending Approvals ({users.pending.length})
        </h3>
        <div className="table-responsive">
            <table className="admin-table">
                <thead><tr><th>User</th><th>Mobile</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                {users.pending.length === 0 ? <tr><td colSpan="4" style={{textAlign:'center', color:'#555'}}>No pending users</td></tr> : 
                 users.pending.map(u => (
                    <tr key={u._id}>
                        <td><strong>{u.username}</strong></td>
                        <td>{u.mobile}</td>
                        <td style={{color:'#facc15'}}>WAITING</td>
                        <td>
                            <button onClick={()=>handleAction(u._id, 'approve')} className="admin-btn" style={{background:'#10b981', color:'white'}}>Accept</button>
                            <button onClick={()=>handleAction(u._id, 'delete')} className="admin-btn" style={{background:'#ef4444', color:'white'}}>Reject</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
      </div>

      {/* ACTIVE TABLE */}
      <div className="card-panel">
        <h3 style={{color:'#3b82f6', marginBottom:'15px', paddingBottom:'10px', borderBottom:'1px solid #333'}}>
           ✅ Active Database ({users.active.length})
        </h3>
        <div className="table-responsive">
            <table className="admin-table">
                <thead><tr><th>User</th><th>Mobile</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                {users.active.map(u => (
                    <tr key={u._id}>
                        <td><strong>{u.username}</strong></td>
                        <td>{u.mobile}</td>
                        <td style={{color:'#3b82f6'}}>ACTIVE</td>
                        <td>
                            <button onClick={()=>handleAction(u._id, 'delete')} className="admin-btn" style={{background:'#222', color:'#ef4444', border:'1px solid #333'}}>Delete User</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
export default Admin;