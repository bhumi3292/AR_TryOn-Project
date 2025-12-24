import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { authService } from "../services/authService";
import { FaUser, FaShoppingBag, FaSearch, FaInstagram, FaFacebook, FaTwitter } from "react-icons/fa";
import { HiMenuAlt3, HiX } from "react-icons/hi";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(authService.isAuthenticated());
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onStorage = () => setLoggedIn(authService.isAuthenticated());
    window.addEventListener("storage", onStorage);

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    setLoggedIn(false);
    window.location.href = "/";
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Try-On", path: "/tryon" },
    { name: "Shop", path: "/jewellery" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[var(--bg-deep)]/95 shadow-[0_4px_30px_rgba(0,0,0,0.5)] py-3' : 'bg-transparent py-5'}`}>
      <div className="container mx-auto px-6 flex items-center justify-between">

        {/* LOGO */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full border border-[var(--gold-primary)] flex items-center justify-center relative overflow-hidden group-hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all">
            <div className="absolute inset-0 bg-[var(--gold-primary)] opacity-10"></div>
            <span className="text-[var(--gold-primary)] font-serif font-bold text-lg tracking-wider">AR</span>
          </div>
          <span className="hidden sm:block text-2xl font-serif text-white tracking-widest group-hover:text-[var(--gold-primary)] transition-colors duration-300">
            LUXE<span className="text-[var(--gold-primary)]">JEWEL</span>
          </span>
        </Link>

        {/* DESKTOP NAV LINKS */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className="relative text-[var(--gold-soft)] hover:text-[var(--gold-light)] font-medium text-sm tracking-widest uppercase py-2 transition-colors duration-300 group"
            >
              {link.name}
              <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[var(--gold-primary)] transition-all duration-300 group-hover:w-full"></span>
            </Link>
          ))}
        </div>

        {/* ICONS & ACTIONS */}
        <div className="flex items-center gap-6">

          {/* SEARCH BAR (Expandable) */}
          <div className={`hidden md:flex items-center border border-[var(--gold-primary)] rounded-full px-3 py-1 transition-all duration-300 ${searchOpen ? 'w-64 bg-black/50' : 'w-10 bg-transparent border-transparent'}`}>
            <button onClick={() => setSearchOpen(!searchOpen)} className="text-[var(--gold-primary)] focus:outline-none hover:text-[var(--gold-light)]">
              <FaSearch />
            </button>
            <input
              type="text"
              placeholder="Search..."
              className={`bg-transparent border-none outline-none text-white text-sm ml-2 w-full placeholder-[var(--text-muted)] ${searchOpen ? 'block' : 'hidden'}`}
            />
          </div>

          {/* CART */}
          <button className="relative text-[var(--gold-primary)] hover:text-[var(--gold-light)] transition-colors">
            <FaShoppingBag size={20} />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--gold-soft)] text-black text-[10px] font-bold rounded-full flex items-center justify-center">2</span>
          </button>

          {/* PROFILE */}
          {loggedIn ? (
            <div className="flex items-center gap-4">
              <Link to="/jewelry/add" className="hidden md:flex items-center gap-2 text-xs font-bold tracking-widest text-[var(--gold-primary)] border border-[var(--gold-primary)] px-4 py-2 rounded-full hover:bg-[var(--gold-primary)] hover:text-black transition-all shadow-[0_0_10px_rgba(212,175,55,0.2)]">
                ADD PRODUCT
              </Link>

              <div className="relative group">
                <button className="text-[var(--gold-primary)] hover:text-[var(--gold-light)]">
                  <FaUser size={20} />
                </button>
                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-4 w-48 bg-[var(--bg-card)] border border-[var(--gold-dim)] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 backdrop-blur-xl">
                  <Link to="/jewelry/add" className="md:hidden block px-4 py-3 text-sm text-[var(--gold-soft)] hover:bg-[var(--gold-dim)] hover:text-[var(--gold-primary)]">Add Product</Link>
                  <Link to="/profile" className="block px-4 py-3 text-sm text-[var(--gold-soft)] hover:bg-[var(--gold-dim)] hover:text-[var(--gold-primary)]">Profile</Link>
                  <button onClick={handleLogout} className="block w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-900/10">Logout</button>
                </div>
              </div>
            </div>
          ) : (
            <Link to="/login" className="text-[var(--gold-primary)] hover:text-[var(--gold-light)] font-medium text-sm uppercase tracking-wider">
              Login
            </Link>
          )}

          {/* MOBILE MENU BTN */}
          <button className="md:hidden text-[var(--gold-primary)] text-2xl" onClick={() => setIsMenuOpen(true)}>
            <HiMenuAlt3 />
          </button>
        </div>

      </div>

      {/* MOBILE MENU OVERLAY */}
      <div className={`fixed inset-0 bg-black/95 z-50 transition-transform duration-500 ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full p-8 md:p-12">
          <div className="flex justify-end mb-8">
            <button onClick={() => setIsMenuOpen(false)} className="text-[var(--gold-primary)] text-3xl hover:rotate-90 transition-transform">
              <HiX />
            </button>
          </div>

          <div className="flex flex-col space-y-6 flex-1 items-center justify-center">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className="text-2xl font-serif text-[var(--gold-soft)] hover:text-white transition-colors tracking-widest uppercase"
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex justify-center gap-8 mt-12 mb-8">
            <FaInstagram className="text-[var(--gold-primary)] text-xl cursor-pointer hover:text-white transition-colors" />
            <FaFacebook className="text-[var(--gold-primary)] text-xl cursor-pointer hover:text-white transition-colors" />
            <FaTwitter className="text-[var(--gold-primary)] text-xl cursor-pointer hover:text-white transition-colors" />
          </div>
        </div>
      </div>
    </nav>
  );
}
