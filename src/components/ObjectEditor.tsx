import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { ImageUpload } from "./ImageUpload";

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
  notes?: string;
  signature?: string;
  people?: Array<{
    name: string;
    function: string;
    address?: string;
    phone?: string;
    email?: string;
  }>;
  keys?: Array<{
    type: string;
    count: number;
    images?: string[];
  }>;
  rooms?: Array<{
    name: string;
    equipment?: string;
    condition?: string;
    images?: string[];
  }>;
  meters?: Array<{
    type: string;
    number: string;
    reading: string;
    images?: string[];
  }>;
  creatorName: string;
  assignedUsers: Array<{ id: string; name: string }>;
};

interface ObjectEditorProps {
  user: User;
  token: string;
  objectId: string;
  onBack: () => void;
}

const keyTypes = ["Haustürschlüssel", "Wohnungsschlüssel", "Kellerschlüssel", "Briefkastenschlüssel", "Sonstiges"];
const meterTypes = ["Strom", "Gas", "Wasser", "Heizung", "Sonstiges"];

export default function ObjectEditor({ user, token, objectId, onBack }: ObjectEditorProps) {
  // Basic info
  const [title, setTitle] = useState("");
  const [street, setStreet] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [city, setCity] = useState("");
  const [additional, setAdditional] = useState("");
  const [floor, setFloor] = useState("");
  const [room, setRoom] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [signature, setSignature] = useState("");

  // Dynamic arrays
  const [people, setPeople] = useState<Array<{
    name: string;
    function: string;
    address?: string;
    phone?: string;
    email?: string;
  }>>([]);
  
  const [keys, setKeys] = useState<Array<{
    type: string;
    count: number;
    images?: string[];
  }>>([]);
  
  const [rooms, setRooms] = useState<Array<{
    name: string;
    equipment?: string;
    condition?: string;
    images?: string[];
  }>>([]);
  
  const [meters, setMeters] = useState<Array<{
    type: string;
    number: string;
    reading: string;
    images?: string[];
  }>>([]);

  const object = useQuery(api.objects.getObject, { token, objectId: objectId as any });
  const users = useQuery(api.objects.getAllUsers, { token });
  const updateObject = useMutation(api.objects.updateObject);

  // Load object data
  useEffect(() => {
    if (object) {
      setTitle(object.title);
      setStreet(object.address.street);
      setZipCode(object.address.zipCode);
      setCity(object.address.city);
      setAdditional(object.address.additional || "");
      setFloor(object.floor?.toString() || "");
      setRoom(object.room || "");
      setSelectedUsers(object.assignedUsers.map(u => u.id));
      setNotes(object.notes || "");
      setSignature(object.signature || "");
      
      setPeople(object.people?.map(p => ({
        name: p.name,
        function: p.function,
        address: p.address || "",
        phone: p.phone || "",
        email: p.email || "",
      })) || []);
      
      setKeys(object.keys?.map(k => ({
        type: k.type,
        count: k.count,
        images: k.images || [],
      })) || []);
      
      setRooms(object.rooms?.map(r => ({
        name: r.name,
        equipment: r.equipment || "",
        condition: r.condition || "",
        images: r.images || [],
      })) || []);
      
      setMeters(object.meters?.map(m => ({
        type: m.type,
        number: m.number,
        reading: m.reading,
        images: m.images || [],
      })) || []);
    }
  }, [object]);

  const canEdit = () => {
    if (!object) return false;
    if (object.status === "abgeschlossen") return false;
    if (object.status === "freigegeben" && user.role !== "admin") return false;
    if (object.status === "in_überprüfung" && user.role !== "admin") return false;
    return true;
  };

  const handleSave = async () => {
    if (!object) return;

    try {
      await updateObject({
        token,
        objectId: object._id as any,
        title,
        address: {
          street,
          zipCode,
          city,
          additional: additional || undefined,
        },
        floor: floor ? parseInt(floor) : undefined,
        room: room || undefined,
        assignedTo: selectedUsers.length > 0 ? selectedUsers as any : undefined,
        notes: notes || undefined,
        signature: signature || undefined,
        people: people.length > 0 ? people.map(p => ({
          name: p.name,
          function: p.function,
          address: p.address || undefined,
          phone: p.phone || undefined,
          email: p.email || undefined,
        })) : undefined,
        keys: keys.length > 0 ? keys.map(k => ({
          type: k.type,
          count: k.count,
          images: k.images && k.images.length > 0 ? k.images as any : undefined,
        })) : undefined,
        rooms: rooms.length > 0 ? rooms.map(r => ({
          name: r.name,
          equipment: r.equipment || undefined,
          condition: r.condition || undefined,
          images: r.images && r.images.length > 0 ? r.images as any : undefined,
        })) : undefined,
        meters: meters.length > 0 ? meters.map(m => ({
          type: m.type,
          number: m.number,
          reading: m.reading,
          images: m.images && m.images.length > 0 ? m.images as any : undefined,
        })) : undefined,
      });
      
      toast.success("Objekt erfolgreich gespeichert");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fehler beim Speichern");
    }
  };

  const addPerson = () => {
    setPeople([...people, { name: "", function: "", address: "", phone: "", email: "" }]);
  };

  const removePerson = (index: number) => {
    setPeople(people.filter((_, i) => i !== index));
  };

  const updatePerson = (index: number, field: string, value: string) => {
    const updated = [...people];
    updated[index] = { ...updated[index], [field]: value };
    setPeople(updated);
  };

  const addKey = () => {
    setKeys([...keys, { type: keyTypes[0], count: 1, images: [] }]);
  };

  const removeKey = (index: number) => {
    setKeys(keys.filter((_, i) => i !== index));
  };

  const updateKey = (index: number, field: string, value: any) => {
    const updated = [...keys];
    updated[index] = { ...updated[index], [field]: value };
    setKeys(updated);
  };

  const addRoom = () => {
    setRooms([...rooms, { name: "", equipment: "", condition: "", images: [] }]);
  };

  const removeRoom = (index: number) => {
    setRooms(rooms.filter((_, i) => i !== index));
  };

  const updateRoom = (index: number, field: string, value: string) => {
    const updated = [...rooms];
    updated[index] = { ...updated[index], [field]: value };
    setRooms(updated);
  };

  const addMeter = () => {
    setMeters([...meters, { type: meterTypes[0], number: "", reading: "", images: [] }]);
  };

  const removeMeter = (index: number) => {
    setMeters(meters.filter((_, i) => i !== index));
  };

  const updateMeter = (index: number, field: string, value: string) => {
    const updated = [...meters];
    updated[index] = { ...updated[index], [field]: value };
    setMeters(updated);
  };

  if (!object) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isReadOnly = !canEdit();

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{object.title}</h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                object.status === "entwurf" ? "bg-gray-100 text-gray-800" :
                object.status === "freigegeben" ? "bg-blue-100 text-blue-800" :
                object.status === "in_überprüfung" ? "bg-yellow-100 text-yellow-800" :
                object.status === "zurückgewiesen" ? "bg-red-100 text-red-800" :
                object.status === "abgeschlossen" ? "bg-green-100 text-green-800" :
                "bg-red-100 text-red-800"
              }`}>
                {object.status}
              </span>
              {isReadOnly && (
                <span className="text-red-600 text-sm font-medium">(Nur lesend)</span>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {!isReadOnly && (
              <button
                onClick={handleSave}
                className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Speichern
              </button>
            )}
            <button
              onClick={onBack}
              className="w-full sm:w-auto bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 transition-colors"
            >
              Zurück
            </button>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-4 sm:p-6 space-y-8">
          
          {/* Basic Info Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🏠</div>
              <h2 className="text-xl font-semibold text-gray-900">Grunddaten</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Objektbezeichnung *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isReadOnly}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Straße *</label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  disabled={isReadOnly}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PLZ *</label>
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  disabled={isReadOnly}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ort *</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={isReadOnly}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 transition-colors"
                />
              </div>
              
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresszusatz</label>
                <input
                  type="text"
                  value={additional}
                  onChange={(e) => setAdditional(e.target.value)}
                  disabled={isReadOnly}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Etage</label>
                <input
                  type="number"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  disabled={isReadOnly}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Raum</label>
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  disabled={isReadOnly}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 transition-colors"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zugewiesene Benutzer</label>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3 bg-gray-50">
                {users?.map((u) => (
                  <label key={u._id} className="flex items-center p-2 hover:bg-white rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(u._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, u._id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== u._id));
                        }
                      }}
                      disabled={isReadOnly}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                    />
                    <span className="ml-3 text-sm text-gray-900">{u.name} ({u.email})</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* People Section */}
          <div className="space-y-6 pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">👥</div>
                <h2 className="text-xl font-semibold text-gray-900">Beteiligte Personen</h2>
              </div>
              {!isReadOnly && (
                <button
                  onClick={addPerson}
                  className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Person hinzufügen
                </button>
              )}
            </div>
            
            {people.map((person, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                  <h4 className="font-medium text-gray-900">Person {index + 1}</h4>
                  {!isReadOnly && (
                    <button
                      onClick={() => removePerson(index)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium hover:bg-red-50 px-2 py-1 rounded transition-colors"
                    >
                      Entfernen
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={person.name}
                      onChange={(e) => updatePerson(index, "name", e.target.value)}
                      disabled={isReadOnly}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Funktion *</label>
                    <input
                      type="text"
                      value={person.function}
                      onChange={(e) => updatePerson(index, "function", e.target.value)}
                      disabled={isReadOnly}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                    <input
                      type="text"
                      value={person.address || ""}
                      onChange={(e) => updatePerson(index, "address", e.target.value)}
                      disabled={isReadOnly}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                    <input
                      type="text"
                      value={person.phone || ""}
                      onChange={(e) => updatePerson(index, "phone", e.target.value)}
                      disabled={isReadOnly}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 transition-colors"
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
                    <input
                      type="email"
                      value={person.email || ""}
                      onChange={(e) => updatePerson(index, "email", e.target.value)}
                      disabled={isReadOnly}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 transition-colors"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            {people.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-gray-500 text-lg">Keine Personen hinzugefügt</div>
                <div className="text-gray-400 text-sm mt-2">Fügen Sie die ersten beteiligten Personen hinzu</div>
              </div>
            )}
          </div>

          {/* Keys Section */}
          <div className="space-y-6 pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">🔑</div>
                <h2 className="text-xl font-semibold text-gray-900">Schlüsselübergabe</h2>
              </div>
              {!isReadOnly && (
                <button
                  onClick={addKey}
                  className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Schlüssel hinzufügen
                </button>
              )}
            </div>
            
            {keys.map((key, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                  <h4 className="font-medium text-gray-900">Schlüssel {index + 1}</h4>
                  {!isReadOnly && (
                    <button
                      onClick={() => removeKey(index)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium hover:bg-red-50 px-2 py-1 rounded transition-colors"
                    >
                      Entfernen
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Typ</label>
                    <select
                      value={key.type}
                      onChange={(e) => updateKey(index, "type", e.target.value)}
                      disabled={isReadOnly}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 transition-colors"
                    >
                      {keyTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Anzahl</label>
                    <input
                      type="number"
                      min="1"
                      value={key.count}
                      onChange={(e) => updateKey(index, "count", parseInt(e.target.value) || 1)}
                      disabled={isReadOnly}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <ImageUpload
                    objectId={object._id}
                    section="keys"
                    token={token}
                    isDisabled={isReadOnly}
                  />
                </div>
              </div>
            ))}
            
            {keys.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-gray-500 text-lg">Keine Schlüssel hinzugefügt</div>
                <div className="text-gray-400 text-sm mt-2">Fügen Sie die ersten Schlüssel hinzu</div>
              </div>
            )}
          </div>

          {/* Rooms Section */}
          <div className="space-y-6 pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">🚪</div>
                <h2 className="text-xl font-semibold text-gray-900">Räume</h2>
              </div>
              {!isReadOnly && (
                <button
                  onClick={addRoom}
                  className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Raum hinzufügen
                </button>
              )}
            </div>
            
            {rooms.map((room, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                  <h4 className="font-medium text-gray-900">Raum {index + 1}</h4>
                  {!isReadOnly && (
                    <button
                      onClick={() => removeRoom(index)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium hover:bg-red-50 px-2 py-1 rounded transition-colors"
                    >
                      Entfernen
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Raumname *</label>
                    <input
                      type="text"
                      value={room.name}
                      onChange={(e) => updateRoom(index, "name", e.target.value)}
                      disabled={isReadOnly}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ausstattung</label>
                    <input
                      type="text"
                      value={room.equipment || ""}
                      onChange={(e) => updateRoom(index, "equipment", e.target.value)}
                      disabled={isReadOnly}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zustand</label>
                    <input
                      type="text"
                      value={room.condition || ""}
                      onChange={(e) => updateRoom(index, "condition", e.target.value)}
                      disabled={isReadOnly}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <ImageUpload
                    objectId={object._id}
                    section="rooms"
                    token={token}
                    isDisabled={isReadOnly}
                  />
                </div>
              </div>
            ))}
            
            {rooms.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-gray-500 text-lg">Keine Räume hinzugefügt</div>
                <div className="text-gray-400 text-sm mt-2">Fügen Sie die ersten Räume hinzu</div>
              </div>
            )}
          </div>

          {/* Meters Section */}
          <div className="space-y-6 pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">📊</div>
                <h2 className="text-xl font-semibold text-gray-900">Zähler</h2>
              </div>
              {!isReadOnly && (
                <button
                  onClick={addMeter}
                  className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Zähler hinzufügen
                </button>
              )}
            </div>
            
            {meters.map((meter, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                  <h4 className="font-medium text-gray-900">Zähler {index + 1}</h4>
                  {!isReadOnly && (
                    <button
                      onClick={() => removeMeter(index)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium hover:bg-red-50 px-2 py-1 rounded transition-colors"
                    >
                      Entfernen
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Typ</label>
                    <select
                      value={meter.type}
                      onChange={(e) => updateMeter(index, "type", e.target.value)}
                      disabled={isReadOnly}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 transition-colors"
                    >
                      {meterTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zählernummer</label>
                    <input
                      type="text"
                      value={meter.number}
                      onChange={(e) => updateMeter(index, "number", e.target.value)}
                      disabled={isReadOnly}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zählerstand</label>
                    <input
                      type="text"
                      value={meter.reading}
                      onChange={(e) => updateMeter(index, "reading", e.target.value)}
                      disabled={isReadOnly}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <ImageUpload
                    objectId={object._id}
                    section="meters"
                    token={token}
                    isDisabled={isReadOnly}
                  />
                </div>
              </div>
            ))}
            
            {meters.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-gray-500 text-lg">Keine Zähler hinzugefügt</div>
                <div className="text-gray-400 text-sm mt-2">Fügen Sie die ersten Zähler hinzu</div>
              </div>
            )}
          </div>

          {/* Notes & Signature Section */}
          <div className="space-y-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <div className="text-2xl">📝</div>
              <h2 className="text-xl font-semibold text-gray-900">Notizen & Unterschrift</h2>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notizen</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isReadOnly}
                rows={6}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 transition-colors"
                placeholder="Zusätzliche Notizen zum Objekt..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unterschrift</label>
              <textarea
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                disabled={isReadOnly}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 transition-colors"
                placeholder="Unterschrift oder Bestätigung..."
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
