import { pdf, type DocumentProps } from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import type { ResumeData } from '@/types/resume'
import { pdfFileName } from '@/lib/resumeFormat'
import ResumePdfDocument from './ResumePdfDocument'

export async function downloadResumePdf(data: ResumeData): Promise<void> {
  // ResumePdfDocument's root element is a <Document>, but TS narrows the
  // wrapper's return type to its own props. Cast at this boundary so the
  // pdf() helper sees the DocumentProps shape it expects.
  const element = (<ResumePdfDocument data={data} />) as ReactElement<DocumentProps>
  const blob = await pdf(element).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = pdfFileName(data.personal)
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Defer revoke so the browser has a tick to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
