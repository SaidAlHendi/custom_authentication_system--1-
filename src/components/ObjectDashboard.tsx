import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

type User = {
  _id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  active: boolean;
  isTempPassword: boolean;
};

type ObjectType = {
  _id: string;
  title: string;
  address: {
    street: string;
    zipCode: string;
    city: string;
    additional?: string;
  };
  floor?: number;
  room?: string;
  status: "entwurf" | "freigegeben" | "in_überprüfung" | "zurückgewiesen" | "abgeschlossen" | "gelöscht";
  creatorName: string;
  assignedUsers: Array<{ id: string; name: string }>;
  _creationTime: number;
};

interface ObjectDashboardProps {
  user: User;
  token: string;
  onEditObject: (objectId: string) => void;
}

const statusLabels = {
  entwurf: "Entwurf",
  freigegeben: "Freigegeben",
  in_überprüfung: "In Überprüfung",
  zurückgewiesen: "Zurückgewiesen",
  abgeschlossen: "Abgeschlossen",
  gelöscht: "Gelöscht",
};

const statusColors = {
  entwurf: "bg-gray-100 text-gray-800 border-gray-300",
  freigegeben: "bg-blue-100 text-blue-800 border-blue-300",
  in_überprüfung: "bg-yellow-100 text-yellow-800 border-yellow-300",
  zurückgewiesen: "bg-red-100 text-red-800 border-red-300",
  abgeschlossen: "bg-green-100 text-green-800 border-green-300",
  gelöscht: "bg-red-100 text-red-800 border-red-300",
};

export default function ObjectDashboard({ user, token, onEditObject }: ObjectDashboardProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Create object form
  const [newObjectTitle, setNewObjectTitle] = useState("");
  const [newObjectStreet, setNewObjectStreet] = useState("");
  const [newObjectZipCode, setNewObjectZipCode] = useState("");
  const [newObjectCity, setNewObjectCity] = useState("");
  const [newObjectAdditional, setNewObjectAdditional] = useState("");
  const [newObjectFloor, setNewObjectFloor] = useState("");
  const [newObjectRoom, setNewObjectRoom] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const objects = useQuery(api.objects.getObjects, { 
    token, 
    search: search.length >= 3 ? search : undefined,
    statusFilter: statusFilter || undefined,
    userFilter: userFilter || undefined,
  });

  const users = useQuery(api.objects.getAllUsers, { token });
  const createObject = useMutation(api.objects.createObject);
  const updateObjectStatus = useMutation(api.objects.updateObjectStatus);
  const deleteObject = useMutation(api.objects.deleteObject);

  const handleCreateObject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createObject({
        token,
        title: newObjectTitle,
        address: {
          street: newObjectStreet,
          zipCode: newObjectZipCode,
          city: newObjectCity,
          additional: newObjectAdditional || undefined,
        },
        floor: newObjectFloor ? parseInt(newObjectFloor) : undefined,
        room: newObjectRoom || undefined,
        assignedTo: selectedUsers.length > 0 ? selectedUsers as any : undefined,
      });

      // Reset form
      setNewObjectTitle("");
      setNewObjectStreet("");
      setNewObjectZipCode("");
      setNewObjectCity("");
      setNewObjectAdditional("");
      setNewObjectFloor("");
      setNewObjectRoom("");
      setSelectedUsers([]);
      setShowCreateForm(false);
      toast.success("Objekt erfolgreich erstellt");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fehler beim Erstellen des Objekts");
    }
  };

  const handleStatusChange = async (objectId: string, newStatus: string) => {
    try {
      await updateObjectStatus({
        token,
        objectId: objectId as any,
        status: newStatus as any,
      });
      toast.success("Status erfolgreich geändert");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fehler beim Ändern des Status");
    }
  };

  const handleDeleteObject = async (objectId: string) => {
    if (!confirm("Sind Sie sicher, dass Sie dieses Objekt löschen möchten?")) return;
    
    try {
      await deleteObject({ token, objectId: objectId as any });
      toast.success("Objekt erfolgreich gelöscht");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fehler beim Löschen des Objekts");
    }
  };

  const canChangeStatus = (object: ObjectType, newStatus: string) => {
    if (user.role === "admin") return true;
    
    // Users can only release their own objects or assigned objects
    if (newStatus === "freigegeben") {
      return object.creatorName === user.name || 
        object.assignedUsers.some(u => u.name === user.name);
    }
    
    return false;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Objektverwaltung</h1>
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Neues Objekt
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <input
              type="text"
              placeholder="Suche (min. 3 Zeichen)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {user.role === "admin" && (
            <>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Alle Status</option>
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Alle Benutzer</option>
                  {users?.map((u) => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        {/* Objects Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {objects?.map((object) => (
            <div key={object._id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="p-4">
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {object.title}
                  </h3>
                  <div className="flex-shrink-0 ml-2">
                    {user.role === "admin" ? (
                      <select
                        value={object.status}
                        onChange={(e) => handleStatusChange(object._id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full border ${statusColors[object.status]} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      >
                        {Object.entries(statusLabels).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[object.status]}`}>
                        {statusLabels[object.status]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="mb-3">
                  <div className="text-sm text-gray-600">
                    <div className="font-medium">{object.address.street}</div>
                    <div>{object.address.zipCode} {object.address.city}</div>
                    {object.address.additional && (
                      <div className="text-gray-500 text-xs">{object.address.additional}</div>
                    )}
                  </div>
                  {(object.floor || object.room) && (
                    <div className="text-xs text-gray-500 mt-1">
                      {object.floor && `Etage ${object.floor}`}
                      {object.floor && object.room && " • "}
                      {object.room && `Raum ${object.room}`}
                    </div>
                  )}
                </div>

                {/* Creator and Assigned Users */}
                <div className="mb-4 space-y-2">
                  <div className="text-xs text-gray-500">
                    <span className="font-medium">Erstellt von:</span> {object.creatorName}
                  </div>
                  {object.assignedUsers.length > 0 && (
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">Zugewiesen:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {object.assignedUsers.map((assignedUser) => (
                          <span key={assignedUser.id} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {assignedUser.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onEditObject(object._id)}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-xs font-medium hover:bg-blue-700 transition-colors"
                  >
                    Bearbeiten
                  </button>
                  
                  {canChangeStatus(object, "freigegeben") && object.status === "entwurf" && (
                    <button
                      onClick={() => handleStatusChange(object._id, "freigegeben")}
                      className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-xs font-medium hover:bg-green-700 transition-colors"
                    >
                      Freigeben
                    </button>
                  )}
                  
                  {user.role === "admin" && ["freigegeben", "abgeschlossen"].includes(object.status) && (
                    <button
                      onClick={() => {/* TODO: Implement PDF export */}}
                      className="flex-1 bg-purple-600 text-white px-3 py-2 rounded-md text-xs font-medium hover:bg-purple-700 transition-colors"
                    >
                      PDF Export
                    </button>
                  )}
                  
                  {(user.role === "admin" || object.creatorName === user.name) && (
                    <button
                      onClick={() => handleDeleteObject(object._id)}
                      className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md text-xs font-medium hover:bg-red-700 transition-colors"
                    >
                      Löschen
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {objects?.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">Keine Objekte gefunden</div>
            <div className="text-gray-400 text-sm mt-2">
              {search || statusFilter || userFilter ? "Versuchen Sie andere Filtereinstellungen" : "Erstellen Sie Ihr erstes Objekt"}
            </div>
          </div>
        )}
      </div>

      {/* Create Object Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Neues Objekt erstellen</h3>
            <form onSubmit={handleCreateObject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Objektbezeichnung *</label>
                <input
                  type="text"
                  value={newObjectTitle}
                  onChange={(e) => setNewObjectTitle(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Straße *</label>
                <input
                  type="text"
                  value={newObjectStreet}
                  onChange={(e) => setNewObjectStreet(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">PLZ *</label>
                  <input
                    type="text"
                    value={newObjectZipCode}
                    onChange={(e) => setNewObjectZipCode(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ort *</label>
                  <input
                    type="text"
                    value={newObjectCity}
                    onChange={(e) => setNewObjectCity(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Adresszusatz</label>
                <input
                  type="text"
                  value={newObjectAdditional}
                  onChange={(e) => setNewObjectAdditional(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Etage</label>
                  <input
                    type="number"
                    value={newObjectFloor}
                    onChange={(e) => setNewObjectFloor(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Raum</label>
                  <input
                    type="text"
                    value={newObjectRoom}
                    onChange={(e) => setNewObjectRoom(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Zugewiesene Benutzer</label>
                <div className="mt-1 space-y-2 max-h-32 overflow-y-auto">
                  {users?.map((user) => (
                    <label key={user._id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user._id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== user._id));
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-900">{user.name} ({user.email})</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                >
                  Erstellen
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
