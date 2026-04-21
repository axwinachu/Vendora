import "../styles/header.css";

export default function Header({ user }) {
  return (
    <div className="header">
      <h2>👋 Hi {user?.email || "User"}</h2>
      <p>📍 {user?.district || "Select location"}</p>
    </div>
  );
}