import CreateRoute from "../components/CreateRoute/CreateRoute";
import useAdminAuth from "../hooks/useAdminAuth";

const AdminPage = () => {
  useAdminAuth();

  return <CreateRoute />;
};

export default AdminPage;
