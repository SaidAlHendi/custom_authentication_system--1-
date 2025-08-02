import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { getGermanErrorMessage } from './errorHandler'

interface ObjectData {
  _id: string
  title: string
  address: string
  description: string
  status: string
  createdAt: number
  createdBy: string
  assignedUsers: string[]
  people: Array<{
    name: string
    email?: string
    phone?: string
    function: string
  }>
  keys: Array<{
    type: string
    count: number
    customType?: string
  }>
  rooms: Array<{
    name: string
    equipment?: string
    condition?: string
  }>
  meters: Array<{
    type: string
    number: string
    reading: string
    customType?: string
  }>
  signature?: string
}

interface UserData {
  _id: string
  name: string
  email: string
}

interface ImageData {
  _id: string
  filename: string
  url: string | null
}

export async function generateObjectPDF(
  object: ObjectData,
  users: UserData[],
  images: { [section: string]: ImageData[] },
  creatorName: string
): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - 2 * margin
  let yPosition = margin

  // Helper function to add text with word wrapping
  const addWrappedText = (
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    fontSize: number = 12
  ) => {
    pdf.setFontSize(fontSize)
    const lines = pdf.splitTextToSize(text, maxWidth)
    pdf.text(lines, x, y)
    return lines.length * (fontSize * 0.4) // Return height used
  }

  // Helper function to check if we need a new page
  const checkNewPage = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      pdf.addPage()
      yPosition = margin
    }
  }

  // Header
  pdf.setFontSize(24)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Objekt-Dokumentation', pageWidth / 2, yPosition, {
    align: 'center',
  })
  yPosition += 15

  // Object basic info
  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Grundinformationen', margin, yPosition)
  yPosition += 10

  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')

  const basicInfo = [
    `Titel: ${object.title}`,
    `Adresse: ${object.address}`,
    `Status: ${object.status}`,
    `Erstellt am: ${new Date(object.createdAt).toLocaleDateString('de-DE')}`,
    `Erstellt von: ${creatorName}`,
  ]

  basicInfo.forEach((info) => {
    checkNewPage(8)
    pdf.text(info, margin, yPosition)
    yPosition += 8
  })

  yPosition += 5

  // Description
  if (object.description) {
    checkNewPage(20)
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Beschreibung:', margin, yPosition)
    yPosition += 8

    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    const descHeight = addWrappedText(
      object.description,
      margin,
      yPosition,
      contentWidth
    )
    yPosition += descHeight + 5
  }

  // Assigned Users
  if (object.assignedUsers.length > 0) {
    checkNewPage(20)
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Zugewiesene Benutzer:', margin, yPosition)
    yPosition += 8

    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    const assignedUserNames = object.assignedUsers
      .map((userId) => users.find((u) => u._id === userId)?.name || 'Unbekannt')
      .join(', ')

    const userHeight = addWrappedText(
      assignedUserNames,
      margin,
      yPosition,
      contentWidth
    )
    yPosition += userHeight + 5
  }

  // People
  if (object.people.length > 0) {
    checkNewPage(30)
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Personen:', margin, yPosition)
    yPosition += 8

    object.people.forEach((person, index) => {
      checkNewPage(25)
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')

      const personInfo = [
        `  ${index + 1}. ${person.name}`,
        `     Funktion: ${person.function}`,
        `     Email: ${person.email || 'Nicht angegeben'}`,
        `     Telefon: ${person.phone || 'Nicht angegeben'}`,
      ]

      personInfo.forEach((info) => {
        pdf.text(info, margin, yPosition)
        yPosition += 6
      })
      yPosition += 2
    })
  }

  // Keys
  if (object.keys.length > 0) {
    checkNewPage(30)
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Schlüssel:', margin, yPosition)
    yPosition += 8

    object.keys.forEach((key, index) => {
      checkNewPage(25)
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')

      const keyInfo = [
        `  ${index + 1}. ${key.type}${key.customType ? ` - ${key.customType}` : ''} (${key.count}x)`,
      ]

      keyInfo.forEach((info) => {
        pdf.text(info, margin, yPosition)
        yPosition += 6
      })
      yPosition += 2
    })
  }

  // Rooms
  if (object.rooms.length > 0) {
    checkNewPage(30)
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Räume:', margin, yPosition)
    yPosition += 8

    object.rooms.forEach((room, index) => {
      checkNewPage(25)
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')

      const roomInfo = [
        `  ${index + 1}. ${room.name}`,
        `     Ausstattung: ${room.equipment || 'Nicht angegeben'}`,
        `     Zustand: ${room.condition || 'Nicht angegeben'}`,
      ]

      roomInfo.forEach((info) => {
        pdf.text(info, margin, yPosition)
        yPosition += 6
      })
      yPosition += 2
    })
  }

  // Meters
  if (object.meters.length > 0) {
    checkNewPage(30)
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Zähler:', margin, yPosition)
    yPosition += 8

    object.meters.forEach((meter, index) => {
      checkNewPage(25)
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')

      const meterInfo = [
        `  ${index + 1}. ${meter.type}${meter.customType ? ` - ${meter.customType}` : ''} - ${meter.number}`,
        `     Zählerstand: ${meter.reading}`,
      ]

      meterInfo.forEach((info) => {
        pdf.text(info, margin, yPosition)
        yPosition += 6
      })
      yPosition += 2
    })
  }

  // Images
  const allImages = [
    ...(images.keys || []),
    ...(images.rooms || []),
    ...(images.meters || []),
  ]

  if (allImages.length > 0) {
    checkNewPage(40)
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Bilder:', margin, yPosition)
    yPosition += 10

    // Process images in batches to avoid memory issues
    for (let i = 0; i < allImages.length; i += 2) {
      const image1 = allImages[i]
      const image2 = allImages[i + 1]

      checkNewPage(80)

      try {
        // Add first image
        if (image1 && image1.url) {
          const img1 = new Image()
          img1.crossOrigin = 'anonymous'

          await new Promise((resolve, reject) => {
            img1.onload = resolve
            img1.onerror = reject
            img1.src = image1.url!
          })

          const canvas1 = document.createElement('canvas')
          const ctx1 = canvas1.getContext('2d')!
          canvas1.width = img1.width
          canvas1.height = img1.height
          ctx1.drawImage(img1, 0, 0)

          const imgData1 = canvas1.toDataURL('image/jpeg', 0.8)
          pdf.addImage(imgData1, 'JPEG', margin, yPosition, 70, 50)

          pdf.setFontSize(10)
          pdf.setFont('helvetica', 'normal')
          pdf.text(image1.filename, margin, yPosition + 55)
        }

        // Add second image if exists
        if (image2 && image2.url) {
          const img2 = new Image()
          img2.crossOrigin = 'anonymous'

          await new Promise((resolve, reject) => {
            img2.onload = resolve
            img2.onerror = reject
            img2.src = image2.url!
          })

          const canvas2 = document.createElement('canvas')
          const ctx2 = canvas2.getContext('2d')!
          canvas2.width = img2.width
          canvas2.height = img2.height
          ctx2.drawImage(img2, 0, 0)

          const imgData2 = canvas2.toDataURL('image/jpeg', 0.8)
          pdf.addImage(imgData2, 'JPEG', margin + 80, yPosition, 70, 50)

          pdf.setFontSize(10)
          pdf.setFont('helvetica', 'normal')
          pdf.text(image2.filename, margin + 80, yPosition + 55)
        }

        yPosition += 70
      } catch (error) {
        const cleanMessage = getGermanErrorMessage(error)

        console.error('Error adding image to PDF:', cleanMessage)
        pdf.text('Fehler beim Laden des Bildes', margin, yPosition)
        yPosition += 20
      }
    }
  }

  // Signature
  if (object.signature) {
    checkNewPage(50)
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Unterschrift:', margin, yPosition)
    yPosition += 10

    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = object.signature!
      })

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      const imgData = canvas.toDataURL('image/png', 0.8)
      pdf.addImage(imgData, 'PNG', margin, yPosition, 80, 30)

      yPosition += 40
    } catch (error) {
      const cleanMessage = getGermanErrorMessage(error)
      console.error('Error adding signature to PDF:', cleanMessage)
      pdf.text('Fehler beim Laden der Unterschrift', margin, yPosition)
      yPosition += 20
    }
  }

  // Footer
  checkNewPage(20)
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.text(
    `Dokument erstellt am: ${new Date().toLocaleString('de-DE')}`,
    margin,
    yPosition
  )
  yPosition += 5
  pdf.text(`Objekt-ID: ${object._id}`, margin, yPosition)

  // Save PDF
  const filename = `Objekt_${object.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
  pdf.save(filename)
}
