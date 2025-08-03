import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { generateObjectPDF } from '../utils/pdfExport'
import { MultiSelect } from './ui/multi-select'
import { getGermanErrorMessage } from '@/utils/errorHandler'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  FileText,
  MapPin,
  Users,
  Building,
} from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

type User = {
  _id: string
  email: string
  name: string
  role: 'user' | 'admin'
  active: boolean
  isTempPassword: boolean
}

type ObjectType = {
  _id: string
  title: string
  address: {
    street: string
    zipCode: string
    city: string
    additional?: string
  }
  floor?: number
  room?: string
  status:
    | 'entwurf'
    | 'freigegeben'
    | 'in_überprüfung'
    | 'zurückgewiesen'
    | 'abgeschlossen'
    | 'gelöscht'
  creatorName: string
  assignedUsers: Array<{ id: string; name: string }>
  _creationTime: number
}

interface ObjectDashboardProps {
  user: User
  token: string
  onEditObject: (objectId: string) => void
}

const statusLabels = {
  entwurf: 'Entwurf',
  freigegeben: 'Freigegeben',
  in_überprüfung: 'In Überprüfung',
  zurückgewiesen: 'Zurückgewiesen',
  abgeschlossen: 'Abgeschlossen',
  gelöscht: 'Gelöscht',
}

const statusColors = {
  entwurf: 'bg-gray-100 text-gray-800 border-gray-300',
  freigegeben: 'bg-blue-100 text-blue-800 border-blue-300',
  in_überprüfung: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  zurückgewiesen: 'bg-red-100 text-red-800 border-red-300',
  abgeschlossen: 'bg-green-100 text-green-800 border-green-300',
  gelöscht: 'bg-red-100 text-red-800 border-red-300',
}

export default function ObjectDashboard({
  user,
  token,
  onEditObject,
}: ObjectDashboardProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [userFilter, setUserFilter] = useState('all')
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Create object form
  const [newObjectTitle, setNewObjectTitle] = useState('')
  const [newObjectStreet, setNewObjectStreet] = useState('')
  const [newObjectZipCode, setNewObjectZipCode] = useState('')
  const [newObjectCity, setNewObjectCity] = useState('')
  const [newObjectAdditional, setNewObjectAdditional] = useState('')
  const [newObjectFloor, setNewObjectFloor] = useState('')
  const [newObjectRoom, setNewObjectRoom] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  const objects = useQuery(api.objects.getObjects, {
    token,
    search: search.length >= 3 ? search : undefined,
    statusFilter:
      statusFilter === 'all' ? undefined : statusFilter || undefined,
    userFilter: userFilter === 'all' ? undefined : userFilter || undefined,
  })

  const users = useQuery(api.objects.getAllUsers, { token })
  const createObject = useMutation(api.objects.createObject)
  const updateObjectStatus = useMutation(api.objects.updateObjectStatus)
  const deleteObject = useMutation(api.objects.deleteObject)
  const getObjectImagesForPDF = useMutation(
    api.objectImages.generatePDFWithImages
  )

  const handleCreateObject = async (e: React.FormEvent) => {
    e.preventDefault()
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
        assignedTo:
          selectedUsers.length > 0 ? (selectedUsers as any) : undefined,
      })

      // Reset form
      setNewObjectTitle('')
      setNewObjectStreet('')
      setNewObjectZipCode('')
      setNewObjectCity('')
      setNewObjectAdditional('')
      setNewObjectFloor('')
      setNewObjectRoom('')
      setSelectedUsers([])
      setShowCreateForm(false)
      toast.success('Objekt erfolgreich erstellt')
    } catch (error) {
      const cleanMessage = getGermanErrorMessage(error)
      toast.error(
        error instanceof Error
          ? cleanMessage
          : 'Fehler beim Erstellen des Objekts'
      )
    }
  }

  const handleStatusChange = async (objectId: string, newStatus: string) => {
    try {
      await updateObjectStatus({
        token,
        objectId: objectId as any,
        status: newStatus as any,
      })
      toast.success('Status erfolgreich geändert')
    } catch (error) {
      const cleanMessage = getGermanErrorMessage(error)
      toast.error(
        error instanceof Error ? cleanMessage : 'Fehler beim Ändern des Status'
      )
    }
  }

  const handleDeleteObject = async (objectId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie dieses Objekt löschen möchten?'))
      return

    try {
      await deleteObject({ token, objectId: objectId as any })
      toast.success('Objekt erfolgreich gelöscht')
    } catch (error) {
      const cleanMessage = getGermanErrorMessage(error)
      toast.error(
        error instanceof Error
          ? cleanMessage
          : 'Fehler beim Löschen des Objekts'
      )
    }
  }

  const canChangeStatus = (object: ObjectType, newStatus: string) => {
    if (user.role === 'admin') return true

    // Users can only release their own objects or assigned objects
    if (newStatus === 'freigegeben') {
      return (
        object.creatorName === user.name ||
        object.assignedUsers.some((u) => u.name === user.name)
      )
    }

    return false
  }
  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      <div className='max-w-7xl mx-auto space-y-6'>
        {/* Header */}
        <Card>
          <CardHeader>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
              <div>
                <CardTitle className='text-xl sm:text-2xl flex items-center gap-2'>
                  <Building className='w-6 h-6' />
                  Objektverwaltung
                </CardTitle>
                <p className='text-sm text-muted-foreground mt-1'>
                  Verwalten Sie Ihre Objekte und deren Status
                </p>
              </div>
              <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
                <DialogTrigger asChild>
                  <Button className='w-full sm:w-auto'>
                    <Plus className='w-4 h-4 mr-2' />
                    Neues Objekt
                  </Button>
                </DialogTrigger>
                <DialogContent className='max-w-md mx-4'>
                  <DialogHeader>
                    <DialogTitle>Neues Objekt erstellen</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateObject} className='space-y-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='title'>Objektbezeichnung *</Label>
                      <Input
                        id='title'
                        value={newObjectTitle}
                        onChange={(e) => setNewObjectTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='street'>Straße *</Label>
                      <Input
                        id='street'
                        value={newObjectStreet}
                        onChange={(e) => setNewObjectStreet(e.target.value)}
                        required
                      />
                    </div>
                    <div className='grid grid-cols-2 gap-2'>
                      <div className='space-y-2'>
                        <Label htmlFor='zipCode'>PLZ *</Label>
                        <Input
                          id='zipCode'
                          value={newObjectZipCode}
                          onChange={(e) => setNewObjectZipCode(e.target.value)}
                          required
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='city'>Ort *</Label>
                        <Input
                          id='city'
                          value={newObjectCity}
                          onChange={(e) => setNewObjectCity(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='additional'>Adresszusatz</Label>
                      <Input
                        id='additional'
                        value={newObjectAdditional}
                        onChange={(e) => setNewObjectAdditional(e.target.value)}
                      />
                    </div>
                    <div className='grid grid-cols-2 gap-2'>
                      <div className='space-y-2'>
                        <Label htmlFor='floor'>Etage</Label>
                        <Input
                          id='floor'
                          type='number'
                          value={newObjectFloor}
                          onChange={(e) => setNewObjectFloor(e.target.value)}
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='room'>Raum</Label>
                        <Input
                          id='room'
                          value={newObjectRoom}
                          onChange={(e) => setNewObjectRoom(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className='flex gap-2 pt-4'>
                      <Button type='submit' className='flex-1'>
                        Erstellen
                      </Button>
                      <Button
                        type='button'
                        variant='outline'
                        onClick={() => setShowCreateForm(false)}
                        className='flex-1'
                      >
                        Abbrechen
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent>
            {/* Filters */}
            <div className='space-y-4'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                <Input
                  placeholder='Suche (min. 3 Zeichen)...'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className='pl-10'
                />
              </div>

              {user.role === 'admin' && (
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder='Alle Status' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>Alle Status</SelectItem>
                      {Object.entries(statusLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={userFilter} onValueChange={setUserFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder='Alle Benutzer' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>Alle Benutzer</SelectItem>
                      {users?.map((u) => (
                        <SelectItem key={u._id} value={u._id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        {/* Objects Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {objects?.map((object) => (
            <Card
              key={object._id}
              className='hover:shadow-md transition-shadow'
            >
              <CardHeader className='pb-3'>
                {/* Header */}
                <div className='flex justify-between items-start'>
                  <CardTitle className='text-lg truncate'>
                    {object.title}
                  </CardTitle>
                  <div className='flex-shrink-0 ml-2'>
                    {user.role === 'admin' ? (
                      <Select
                        value={object.status}
                        onValueChange={(value) =>
                          handleStatusChange(object._id, value)
                        }
                      >
                        <SelectTrigger
                          className={`text-xs px-4 py-1 rounded-full border ${statusColors[object.status]} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[object.status]}`}
                      >
                        {statusLabels[object.status]}
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className='space-y-3'>
                {/* Address */}
                <div>
                  <div className='text-sm text-gray-600'>
                    <div className='font-medium'>{object.address.street}</div>
                    <div>
                      {object.address.zipCode} {object.address.city}
                    </div>
                    {object.address.additional && (
                      <div className='text-gray-500 text-xs'>
                        {object.address.additional}
                      </div>
                    )}
                  </div>
                  {(object.floor || object.room) && (
                    <div className='text-xs text-gray-500 mt-1'>
                      {object.floor && `Etage ${object.floor}`}
                      {object.floor && object.room && ' • '}
                      {object.room && `Raum ${object.room}`}
                    </div>
                  )}
                </div>

                {/* Creator and Assigned Users */}
                <div className='space-y-2'>
                  <div className='text-xs text-gray-500'>
                    <span className='font-medium'>Erstellt von:</span>{' '}
                    {object.creatorName}
                  </div>
                  {object.assignedUsers.length > 0 && (
                    <div className='text-xs text-gray-500'>
                      <span className='font-medium'>
                        Anzahl der Zugewiesenen Benutzer:
                      </span>
                      <div className='flex flex-wrap gap-1 mt-1'>
                        {/*        {object.assignedUsers.map((assignedUser) => (
                          <span key={assignedUser.id} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {assignedUser.name}
                          </span>
                        ))} */}
                        <span className='bg-blue-100 text-blue-800 px-2 py-1 rounded-xl text-xs'>
                          {object.assignedUsers.length}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className='flex flex-wrap gap-2'>
                  <Button
                    onClick={() => onEditObject(object._id)}
                    className='flex-1'
                    size='sm'
                    variant='outline'
                  >
                    Bearbeiten
                  </Button>

                  {canChangeStatus(object, 'freigegeben') &&
                    object.status === 'entwurf' && (
                      <Button
                        onClick={() =>
                          handleStatusChange(object._id, 'freigegeben')
                        }
                        className='flex-1'
                        size='sm'
                        variant='default'
                      >
                        Freigeben
                      </Button>
                    )}

                  {user.role === 'admin' &&
                    ['freigegeben', 'abgeschlossen'].includes(
                      object.status
                    ) && (
                      <Button
                        onClick={async () => {
                          try {
                            // Get all images for this object from objectImages table
                            const allImages = await getObjectImagesForPDF({
                              token,
                              objectId: object._id as any,
                            })

                            const images = {
                              keys: allImages?.keys || [],
                              rooms: allImages?.rooms || [],
                              meters: allImages?.meters || [],
                            }

                            await generateObjectPDF(
                              {
                                _id: object._id,
                                title: object.title,
                                address: `${object.address.street}, ${object.address.zipCode} ${object.address.city}`,
                                description: object.notes || '',
                                status: object.status,
                                createdAt: object._creationTime,
                                createdBy: object.createdBy,
                                assignedUsers: object.assignedUsers.map(
                                  (u) => u.id
                                ),
                                people: object.people || [],
                                keys:
                                  object.keys?.map((k) => ({
                                    type: k.type,
                                    count: k.count,
                                    customType: k.customType,
                                  })) || [],
                                rooms: object.rooms || [],
                                meters:
                                  object.meters?.map((m) => ({
                                    type: m.type,
                                    number: m.number,
                                    reading: m.reading,
                                    customType: m.customType,
                                  })) || [],
                                signature: object.signature,
                              },
                              users || [],
                              images,
                              object.creatorName
                            )
                          } catch (error) {
                            console.error('PDF Export failed:')
                            alert(
                              'Fehler beim PDF-Export. Bitte versuchen Sie es erneut.'
                            )
                          }
                        }}
                        className='flex-1'
                        size='sm'
                        variant='secondary'
                      >
                        PDF Export
                      </Button>
                    )}

                  {(user.role === 'admin' ||
                    object.creatorName === user.name) && (
                    <Button
                      onClick={() => handleDeleteObject(object._id)}
                      className='flex-1'
                      size='sm'
                      variant='destructive'
                    >
                      Löschen
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {objects?.length === 0 && (
          <Card>
            <CardContent className='text-center py-12'>
              <Building className='w-12 h-12 text-gray-400 mx-auto mb-4' />
              <div className='text-gray-500 text-lg mb-2'>
                Keine Objekte gefunden
              </div>
              <div className='text-gray-400 text-sm'>
                {search || statusFilter !== 'all' || userFilter !== 'all'
                  ? 'Versuchen Sie andere Filtereinstellungen'
                  : 'Erstellen Sie Ihr erstes Objekt'}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
