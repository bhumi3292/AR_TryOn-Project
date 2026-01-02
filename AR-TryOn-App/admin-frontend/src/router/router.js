import {
  Login,
  Signup,
  Dashboard,
  AddJewellery,
  JewelleryList,
  EditJewellery,
  Landing,
  ForgotPassword,
  ResetPassword,
  TryOn,
  Cart,
  Checkout,
  PaymentSettings,
  // Add these to imports
  About,
  JewelryDetails,
  LocationSettings,
  Contact,
  Profile,
  Chat,
  PaymentCallback,
} from "../pages";
import { authService } from "../services";

// ... existing imports ...

export const routes = [
  {
    path: "/",
    component: Landing,
    protected: false,
  },
  {
    path: "/jewellery",
    component: JewelleryList,
    protected: false,
  },
  {
    path: "/jewelry",
    component: JewelleryList,
    protected: false,
  },
  {
    path: "/login",
    component: Login,
    protected: false,
  },
  {
    path: "/signup",
    component: Signup,
    protected: false,
  },
  {
    path: "/register",
    component: Signup,
    protected: false,
  },
  {
    path: "/forgot-password",
    component: ForgotPassword,
    protected: false,
  },
  {
    path: "/reset-password",
    component: ResetPassword,
    protected: false,
  },
  {
    path: "/reset-password/:token",
    component: ResetPassword,
    protected: false,
  },
  {
    path: "/try-on/:productId",
    component: TryOn,
    protected: false,
  },
  {
    path: "/about",
    component: About,
    protected: false,
  },
  {
    path: "/contact",
    component: Contact,
    protected: false,
  },
  {
    path: "/payment/esewa/success",
    component: PaymentCallback,
    protected: false,
  },
  {
    path: "/payment/failed",
    component: PaymentCallback,
    protected: false,
  },
  {
    path: "/chat", // Added chat route
    component: Chat,
    protected: true,
  },
  {
    path: "/profile",
    component: Profile,
    protected: true,
  },
  {
    path: "/settings/payment",
    component: PaymentSettings,
    protected: true,
  },
  {
    path: "/settings/location",
    component: LocationSettings,
    protected: true,
  },
  {
    path: "/dashboard",
    component: Dashboard,
    protected: true,
  },
  {
    path: "/seller/dashboard",
    component: Dashboard,
    protected: true,
  },
  {
    path: "/seller/add-product",
    component: AddJewellery,
    protected: true,
  },
  {
    path: "/jewelry/add",
    component: AddJewellery,
    protected: true,
  },
  {
    path: "/jewelry/edit/:id",
    component: EditJewellery,
    protected: true,
  },
  {
    path: "/jewelry/:id",
    component: JewelryDetails,
    protected: false,
  },
  {
    path: "/cart",
    component: Cart,
    protected: true,
  },
  {
    path: "/checkout",
    component: Checkout,
    protected: true,
  },
];

export const getRoute = (path) => {
  // Handle dynamic routes like /jewelry/edit/:id
  const route = routes.find((r) => {
    const pattern = r.path.replace(/:[^/]+/g, "[^/]+");
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(path);
  });

  if (route) {
    // Extract params for dynamic routes
    const paramNames = (route.path.match(/:[^/]+/g) || []).map((p) =>
      p.slice(1),
    );
    const values = path.split("/").filter((p) => p);
    const params = {};
    paramNames.forEach((name, idx) => {
      params[name] = values[values.length - paramNames.length + idx];
    });
    return { ...route, params };
  }

  return null;
};

export const isProtected = (path) => {
  const route = getRoute(path);
  return route ? route.protected : false;
};

export const canAccess = (path) => {
  const route = getRoute(path);
  if (!route) return false;
  if (!route.protected) return true;
  return authService.isAuthenticated();
};

export const navigate = (path) => {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
};

export const navigateTo = (page, params = {}) => {
  const pathMap = {
    home: "/",
    login: "/login",
    signup: "/signup",
    dashboard: "/dashboard",
    "jewelry-list": "/jewelry",
    "jewelry-add": "/jewelry/add",
    "jewelry-edit": `/jewelry/edit/${params.id || ""}`,
    "jewelry-details": `/jewelry/${params.id || ""}`,
  };

  const path = pathMap[page] || "/dashboard";
  navigate(path);
};
