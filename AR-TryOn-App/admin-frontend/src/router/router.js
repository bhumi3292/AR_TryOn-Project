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
} from "../pages";
import { authService } from "../services";

export const routes = [
  {
    path: "/",
    component: Landing,
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
    path: "/forgot-password",
    component: ForgotPassword,
    protected: false,
  },
  {
    path: "/reset-password/:token",
    component: ResetPassword,
    protected: false,
  },
  {
    path: "/tryon",
    component: TryOn,
    protected: false,
  },
  {
    path: "/dashboard",
    component: Dashboard,
    protected: true,
  },
  {
    path: "/jewelry",
    component: JewelleryList,
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
  };

  const path = pathMap[page] || "/dashboard";
  navigate(path);
};
