
import Container from "./Container";
import { Outlet } from "react-router-dom";
import AuthModal from "../Auth/AuthModal";
import Footer from "../footer/Footer";
export default function AppLayout({ children }) {
  return (
    <>
     
      <Outlet />
      <AuthModal />
      <main style={{ padding: "18px 0 40px" }}>
        <Container>{children}</Container>
      </main>
       <Footer />
      
    </>
  );
}
