function Navbar({ title, subtitle, actions }) {
  return (
    <header className="app-navbar">
      <div className="app-navbar-heading">
        <h1 className="app-navbar-title">{title}</h1>
        {subtitle ? <p className="app-navbar-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="app-navbar-actions">{actions}</div> : null}
    </header>
  );
}

export default Navbar;
