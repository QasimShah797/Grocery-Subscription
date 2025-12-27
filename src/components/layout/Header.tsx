import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { ShoppingBag, User, LogOut, Menu, X, Leaf, Settings, ClipboardList, Bike } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const { user, signOut, isAdmin, isRider } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Check if we're on admin or rider pages
  const isOnAdminPages = location.pathname.startsWith('/admin');
  const isOnRiderPages = location.pathname.startsWith('/rider');

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-200">
              <Leaf className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold text-foreground">
              Fresh<span className="text-primary">Box</span>
            </span>
          </Link>

          {/* Desktop Navigation - Hide for admins on main site */}
          {!isAdmin && !isOnAdminPages && !isOnRiderPages && (
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/products" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                Products
              </Link>
              {user && (
                <>
                  <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                    My Subscription
                  </Link>
                  <Link to="/orders" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                    Orders
                  </Link>
                </>
              )}
            </nav>
          )}

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {/* For admins - only show Admin and Orders buttons */}
                {isAdmin ? (
                  <>
                    {!isOnAdminPages && (
                      <Link to="/admin">
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4" />
                          Admin
                        </Button>
                      </Link>
                    )}
                    <Link to="/orders">
                      <Button variant="outline" size="sm">
                        <ClipboardList className="w-4 h-4" />
                        Orders
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    {/* For riders - show Rider button */}
                    {isRider && !isOnRiderPages && (
                      <Link to="/rider">
                        <Button variant="outline" size="sm">
                          <Bike className="w-4 h-4" />
                          Rider
                        </Button>
                      </Link>
                    )}
                    {/* For regular users - show Orders and Dashboard */}
                    {!isOnRiderPages && (
                      <>
                        <Link to="/orders">
                          <Button variant="outline" size="sm">
                            <ClipboardList className="w-4 h-4" />
                            Orders
                          </Button>
                        </Link>
                        <Link to="/dashboard">
                          <Button variant="outline" size="sm">
                            <ShoppingBag className="w-4 h-4" />
                            Dashboard
                          </Button>
                        </Link>
                      </>
                    )}
                  </>
                )}
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button variant="default" size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-slide-up">
            <nav className="flex flex-col gap-2">
              {/* For admins - only show Admin and Orders */}
              {isAdmin ? (
                <>
                  {!isOnAdminPages && (
                    <Link
                      to="/admin"
                      className="px-4 py-2 rounded-lg hover:bg-muted transition-colors text-primary font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <Link
                    to="/orders"
                    className="px-4 py-2 rounded-lg hover:bg-muted transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Orders
                  </Link>
                </>
              ) : (
                <>
                  {/* For regular users and riders */}
                  {!isOnRiderPages && (
                    <>
                      <Link
                        to="/products"
                        className="px-4 py-2 rounded-lg hover:bg-muted transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Products
                      </Link>
                      {user && (
                        <>
                          <Link
                            to="/dashboard"
                            className="px-4 py-2 rounded-lg hover:bg-muted transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            My Subscription
                          </Link>
                          <Link
                            to="/orders"
                            className="px-4 py-2 rounded-lg hover:bg-muted transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Order History
                          </Link>
                        </>
                      )}
                    </>
                  )}
                  {isRider && !isOnRiderPages && (
                    <Link
                      to="/rider"
                      className="px-4 py-2 rounded-lg hover:bg-muted transition-colors text-primary font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Rider Dashboard
                    </Link>
                  )}
                </>
              )}
              <hr className="my-2 border-border" />
              {user ? (
                <button
                  className="px-4 py-2 text-left rounded-lg hover:bg-muted transition-colors text-destructive"
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    to="/auth"
                    className="px-4 py-2 rounded-lg hover:bg-muted transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/auth?mode=signup"
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
