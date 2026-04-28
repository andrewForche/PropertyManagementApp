import { useEffect, useState, useRef, useMemo } from 'react'
import { useAuth } from '../../core/auth/AuthContext'
import { tenantService } from '../../core/services/tenants/tenant.service'
import type { TenantModel } from '../../core/interfaces/api'
import { CollapseToggleButton } from '../../shared/ui/CollapseToggleButton'

interface SharedDocument {
  id: number
  tenantId: number
  tenantFullName: string
  fileName: string
  mimeType: string
  fileSizeBytes: number
  uploadedByRole: string
  uploadedAt: string
  description?: string
}

export function SharedDocumentsPage() {
  const { primaryRole, tenantId: claimTenantId, token } = useAuth()
  const [docs, setDocs] = useState<SharedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [landlordTenantId, setLandlordTenantId] = useState<number | ''>('')
  const [description, setDescription] = useState('')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [isUploadExpanded, setIsUploadExpanded] = useState(true)
  const [isDocsExpanded, setIsDocsExpanded] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)

  const [tenants, setTenants] = useState<TenantModel[]>([])

  const isLandlord = primaryRole === 'Landlord' || primaryRole === 'Admin'

  const filteredDocs = useMemo(() => {
    const q = search.toLowerCase().trim()
    const from = dateFrom ? new Date(dateFrom) : null
    const to = dateTo ? new Date(dateTo + 'T23:59:59') : null

    return docs.filter(doc => {
      const matchesSearch = !q || [
        doc.tenantFullName,
        doc.fileName,
        doc.description ?? '',
      ].some(field => field.toLowerCase().includes(q))

      const uploadedAt = new Date(doc.uploadedAt)
      const matchesFrom = !from || uploadedAt >= from
      const matchesTo = !to || uploadedAt <= to

      return matchesSearch && matchesFrom && matchesTo
    })
  }, [docs, search, dateFrom, dateTo])

  useEffect(() => { fetchDocs() }, [])

  async function fetchDocs() {
    setLoading(true)
    try {
        const [docsData, tenantData] = await Promise.all([
        fetch('/api/shareddocuments', {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
            if (!res.ok) throw new Error('Failed to fetch documents')
            return res.json()
        }),
        isLandlord ? tenantService.getAll() : Promise.resolve([])
        ])
        setDocs(docsData)
        setTenants(tenantData)
    } catch (e: any) {
        setError(e.message)
    } finally {
        setLoading(false)
    }
}
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

  async function handleUpload() {
    const file = fileRef.current?.files?.[0]
    if (!file) return setError('Please select a file')
    if (isLandlord && !landlordTenantId) return setError('Please enter a tenant ID')

    if (file.size > MAX_SIZE_BYTES) {
    return setError(`File is too large. Maximum size is 10MB (your file is ${(file.size / 1024 / 1024).toFixed(1)}MB).`)
  }

    const effectiveTenantId = isLandlord ? landlordTenantId : claimTenantId
    if (!effectiveTenantId) return setError('Tenant ID could not be determined')

    setUploading(true)
    setError(null)

    const form = new FormData()
    form.append('file', file)
    form.append('tenantId', String(effectiveTenantId))
    form.append('description', description)

    try {
      const res = await fetch('/api/shareddocuments', {
        method: 'POST',
        body: form,
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || `Server error: ${res.status}`)
      }
      const doc = await res.json()
      setDocs(prev => [doc, ...prev])
      setDescription('')
      setLandlordTenantId('')
      if (fileRef.current) fileRef.current.value = ''
    } catch (e: any) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleDownload(doc: SharedDocument) {
    const res = await fetch(`/api/shareddocuments/${doc.id}/download`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) return setError('Download failed')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = doc.fileName
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this document?')) return
    const res = await fetch(`/api/shareddocuments/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) setDocs(docs.filter(d => d.id !== id))
    else setError('Delete failed')
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString()
  }

  return (
    <article className="page-section">
      <div className="page-section-header">
        <div>
          <p className="eyebrow">Documents</p>
          <h3>Shared Documents</h3>
        </div>
        <div className="dashboard-actions">
          <span className="module-chip">Document Portal</span>
          <button
            type="button"
            className="secondary-button"
            onClick={() => void fetchDocs()}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </div>

      <p>
        Upload and manage documents shared between landlords and tenants.
        Tenants can view and upload their own documents; landlords can access all.
      </p>

      {error ? <p className="status-message error">{error}</p> : null}

      {/* Upload panel */}
      <div className="single-panel-layout">
        <section
          className={`property-list-panel collapsible-panel ${isUploadExpanded ? '' : 'collapsed'}`}
          onClick={() => { if (!isUploadExpanded) setIsUploadExpanded(true) }}
        >
          <div className="property-list-header" onClick={e => e.stopPropagation()}>
            <h4>Upload Document</h4>
            <div className="dashboard-actions">
              <button
                type="button"
                className="primary-button"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
              <CollapseToggleButton
                isExpanded={isUploadExpanded}
                onClick={() => setIsUploadExpanded(c => !c)}
                collapseLabel="Collapse upload panel"
                expandLabel="Expand upload panel"
              />
            </div>
          </div>

          {isUploadExpanded && (
            <form
              className="property-form"
              onSubmit={e => { e.preventDefault(); void handleUpload() }}
            >
              {isLandlord && (
                <label>
                  Tenant
                  <select
                    value={landlordTenantId}
                    onChange={e => setLandlordTenantId(Number(e.target.value))}
                    required
                  >
                    <option value="">Select a tenant...</option>
                    {tenants.map(t => (
                      <option key={t.tenantId} value={t.tenantId}>
                        {t.fullName} — {t.propertyName}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label>
                Description
                <input
                  type="text"
                  placeholder="Optional description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </label>

              <label>
                File
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
              </label>
            </form>
          )}
        </section>
      </div>

      {/* Document list */}
      <div className="single-panel-layout">
        <section
          className={`property-list-panel collapsible-panel ${isDocsExpanded ? '' : 'collapsed'}`}
          onClick={() => { if (!isDocsExpanded) setIsDocsExpanded(true) }}
        >
          <div className="property-list-header" onClick={e => e.stopPropagation()}>
            <h4>Documents</h4>
            <div className="dashboard-actions">
              {isLandlord && (
                <span className="module-chip">
                  {filteredDocs.length} of {docs.length}
                </span>
              )}
              <CollapseToggleButton
                isExpanded={isDocsExpanded}
                onClick={() => setIsDocsExpanded(c => !c)}
                collapseLabel="Collapse documents"
                expandLabel="Expand documents"
              />
            </div>
          </div>

          {isDocsExpanded && (
            <>
              {/* Search and filter — landlord only */}
              {isLandlord && (
                <div className="property-form" style={{ marginBottom: '1rem' }}>
                  <label>
                    Search
                    <input
                      type="text"
                      placeholder="Tenant, file name, or description..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </label>

                  <div style={{ display: 'flex', alignItems: 'end', gap: '0.75rem' }}>
                    <label style={{ margin: 0 }}>
                        From
                        <input
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        />
                    </label>
                    <label style={{ margin: 0 }}>
                        To
                        <input
                        type="date"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        />
                    </label>
                    </div>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => { setSearch(''); setDateFrom(''); setDateTo('') }}
                  >
                    Clear Filters
                  </button>
                </div>
              )}

              {loading ? <p className="status-message">Loading documents...</p> : null}

              {!loading && filteredDocs.length === 0 ? (
                <p className="status-message">
                  {docs.length === 0
                    ? 'No documents yet. Upload one above.'
                    : 'No documents match your search.'}
                </p>
              ) : null}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
  {filteredDocs.map(doc => (
    <div
      key={doc.id}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.5rem 0.75rem',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        backgroundColor: 'var(--surface)',
        fontSize: '0.8rem',
      }}
    >
      {/* File name + description */}
      <div style={{ flex: '2', minWidth: 0 }}>
        <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {doc.fileName}
        </div>
        {doc.description && (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
            {doc.description}
          </div>
        )}
      </div>

      {/* Tenant */}
      {isLandlord && (
        <div style={{ flex: '1', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>
            {doc.tenantFullName}
        </div>
)}

      {/* Size */}
      <div style={{ width: '70px', color: 'var(--text-muted)' }}>
        {formatBytes(doc.fileSizeBytes)}
      </div>

      {/* Date */}
      <div style={{ width: '80px', color: 'var(--text-muted)' }}>
        {formatDate(doc.uploadedAt)}
      </div>

      {/* Uploaded by badge */}
      <div style={{ width: '70px' }}>
        <span className={`status-pill ${doc.uploadedByRole === 'Tenant' ? 'occupied' : 'status-default'}`}>
          {doc.uploadedByRole}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
        <button
          type="button"
          className="secondary-button"
          style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
          onClick={() => handleDownload(doc)}
        >
          Download
        </button>
        {(isLandlord || doc.uploadedByRole === primaryRole) && (
          <button
            type="button"
            className="danger-button"
            style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
            onClick={() => void handleDelete(doc.id)}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  ))}
</div>
            </>
          )}
        </section>
      </div>
    </article>
  )
}