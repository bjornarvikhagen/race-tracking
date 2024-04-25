import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const useAdminAuth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // make sure user is admin, if not redirect to home
    if (localStorage.getItem("admin") !== "true") {
      navigate("/");
    }
  }, [navigate]); // include navigate in the dependency array to prevent stale closure

  return;
};

export default useAdminAuth;
