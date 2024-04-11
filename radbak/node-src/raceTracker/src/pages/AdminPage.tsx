import CreateRoute from "../components/CreateRoute";
import useAdminAuth from "../hooks/useAdminAuth";

const AdminPage = () => {
  useAdminAuth();

  return <CreateRoute />;
};

export default AdminPage;
