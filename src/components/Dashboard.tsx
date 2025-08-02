type User = {
  _id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  active: boolean;
  isTempPassword: boolean;
};

interface DashboardProps {
  user: User;
}

export default function Dashboard({ user }: DashboardProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Welcome Back!</h3>
            <p className="text-blue-700">
              Hello, <strong>{user.name}</strong>! You are logged in as a <strong>{user.role}</strong>.
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-2">Account Status</h3>
            <p className="text-green-700">
              Your account is <strong>active</strong> and ready to use.
            </p>
          </div>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h4 className="text-sm font-semibold text-yellow-800 mb-2">⚠️ Security Notice</h4>
          <p className="text-xs text-yellow-700">
            This is a demonstration authentication system that stores passwords in plaintext. 
            This is extremely insecure and should never be used in production applications. 
            Always use proper password hashing (like bcrypt) in real applications.
          </p>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900">Profile Management</h4>
              <p className="text-sm text-gray-600 mt-1">
                Update your name and change your password in the Profile section.
              </p>
            </div>
            {user.role === "admin" && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">Admin Dashboard</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Manage users, create accounts, and reset passwords.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
