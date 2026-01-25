import { useEffect, useState } from "react";

function Admin() {
    const [data, setData] = useState({ pending: [], active: [] });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = () => {
        fetch("http://localhost:3000/api/admin/users", { credentials: "include" })
            .then(res => res.json())
            .then(setData)
            .catch(err => console.log(err));
    };

    const approveUser = async (id) => {
        await fetch(`http://localhost:3000/api/admin/approve/${id}`, { method: "POST", credentials: "include" });
        fetchUsers(); // Refresh list
    };

    // NEW: Delete User Function
    const deleteUser = async (id, name) => {
        if(!window.confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) return;
        
        const res = await fetch(`http://localhost:3000/api/admin/user/${id}`, { method: "DELETE", credentials: "include" });
        const data = await res.json();
        
        if(data.success) {
            fetchUsers(); // Refresh list
        } else {
            alert("Error deleting user");
        }
    };

    return (
        <div className="feed">
            <h2>👑 Admin Panel</h2>
            
            <div className="admin-section">
                <h3>⏳ Pending Approvals</h3>
                {data.pending.length === 0 && <p>No pending users.</p>}
                {data.pending.map(u => (
                    <div key={u._id} className="post-card admin-card">
                        <span>{u.username} ({u.fullName})</span>
                        <div>
                            <button onClick={() => approveUser(u._id)} className="approve-btn">✅ Approve</button>
                            <button onClick={() => deleteUser(u._id, u.username)} className="reject-btn">❌ Reject</button>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="admin-section">
                <h3>✅ Active Users</h3>
                {data.active.map(u => (
                    <div key={u._id} className="post-card admin-card">
                        <span>@{u.username}</span>
                        <button onClick={() => deleteUser(u._id, u.username)} className="delete-user-btn">🗑️ Delete User</button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Admin;