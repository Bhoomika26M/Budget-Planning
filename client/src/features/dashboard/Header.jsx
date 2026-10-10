import { useEffect, useRef, useState } from "react";
import AddTransactionModal from "./AddTransactionModal";

function Header() {
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const profileRef = useRef(null);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const handleSignOut = () => {
    // For now, just close the menu.
    // Authentication/logout can be connected later.
    setShowProfileMenu(false);

    console.log("Sign out clicked");
  };

  return (
    <>
      <header className="header">
        <div className="header-title">
          <h1>Dashboard</h1>
          <p>Welcome back, chandana 👋</p>
        </div>

        <div className="search-box">
          <span>⌕</span>
          <input
            type="text"
            placeholder="Search..."
          />
        </div>

        <div className="header-actions">

          <button
            className="transaction-btn"
            onClick={() =>
              setShowTransactionModal(true)
            }
          >
            + Add Transaction
          </button>

          <button className="icon-btn">
            ◐
          </button>

          <button className="icon-btn">
            ♧
          </button>

          {/* Profile */}
          <div
            className="profile-wrapper"
            ref={profileRef}
          >
            <button
              className="profile-btn"
              onClick={() =>
                setShowProfileMenu(
                  !showProfileMenu
                )
              }
            >
              <span className="profile-avatar">
                C
              </span>

              chandana

              <span
                className={`profile-arrow ${
                  showProfileMenu
                    ? "profile-arrow-open"
                    : ""
                }`}
              >
                ⌄
              </span>
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="profile-dropdown">

                <div className="profile-dropdown-user">
                  <strong>chandana</strong>
                  <span>
                    chandana@gmail.com
                  </span>
                </div>

                <div className="profile-dropdown-divider" />

                <button
                  className="profile-menu-item"
                  onClick={() => {
                    console.log(
                      "View Profile clicked"
                    );
                    setShowProfileMenu(false);
                  }}
                >
                  <span className="menu-icon">
                    ♙
                  </span>
                  <span>View Profile</span>
                </button>

                <button
                  className="profile-menu-item"
                  onClick={() => {
                    console.log(
                      "Settings clicked"
                    );
                    setShowProfileMenu(false);
                  }}
                >
                  <span className="menu-icon">
                    ⚙
                  </span>
                  <span>Settings</span>
                </button>

                <div className="profile-dropdown-divider" />

                <button
                  className="profile-menu-item sign-out"
                  onClick={handleSignOut}
                >
                  <span className="menu-icon">
                    ↪
                  </span>
                  <span>Sign Out</span>
                </button>

              </div>
            )}
          </div>
        </div>
      </header>

      {showTransactionModal && (
        <AddTransactionModal
          onClose={() =>
            setShowTransactionModal(false)
          }
        />
      )}
    </>
  );
}

export default Header;