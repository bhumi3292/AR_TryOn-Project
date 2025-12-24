import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AddJewellery from "./pages/AddJewellery";
import JewelleryList from "./pages/JewelleryList";
import EditJewellery from "./pages/EditJewellery";
import TryOn from "./pages/TryOn";
import ARTest from "./pages/ARTest";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/jewelry" element={<JewelleryList />} />
        <Route path="/jewellery" element={<JewelleryList />} />
        <Route path="/jewelry/add" element={<AddJewellery />} />
        <Route path="/jewelry/edit/:id" element={<EditJewellery />} />
        <Route path="/add-jewelry" element={<AddJewellery />} />
        <Route path="/tryon" element={<TryOn />} />
        <Route path="/ar-test" element={<ARTest />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </BrowserRouter>
  );
}
