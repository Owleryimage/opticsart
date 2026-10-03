import * as React from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog } from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ImageField } from '@/components/ImageField'
import { useToast } from '@/components/ui/toast'
import type { ColConfig, Field } from './configs'

export function CollectionManager({ config }: { config: ColConfig }) {
  const toast = useToast()
  const [items, setItems] = React.useState<any[]>([])
  const [refData, setRefData] = React.useState<Record<string, any[]>>({})
  const [loading, setLoading] = React.useState(true)
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<any | null>(null)
  const [form, setForm] = React.useState<Record<string, any>>({})
  const [saving, setSaving] = React.useState(false)

  const refs = Array.from(
    new Set(
      config.fields
        .filter((f) =>
          ['select-ref', 'year-ref', 'works-multiselect'].includes(f.type),
        )
        .map((f) => f.ref!),
    ),
  )

  const load = React.useCallback(() => {
    setLoading(true)
    Promise.all([
      api.adminList(config.name),
      ...refs.map((r) => api.adminList(r)),
    ])
      .then(([list, ...refLists]) => {
        setItems(list)
        const map: Record<string, any[]> = {}
        refs.forEach((r, i) => (map[r] = refLists[i]))
        setRefData(map)
      })
      .catch((e: any) => toast(e.message, 'error'))
      .finally(() => setLoading(false))
  }, [config.name, refs.join(',')])

  React.useEffect(() => {
    load()
  }, [load])

  function openCreate() {
    const f: Record<string, any> = {}
    config.fields.forEach((fld) => {
      if (fld.type === 'switch') f[fld.key] = fld.default ?? false
      else if (fld.type === 'works-multiselect') f[fld.key] = []
      else f[fld.key] = ''
    })
    setEditing(null)
    setForm(f)
    setOpen(true)
  }
  function openEdit(item: any) {
    const f = { ...item }
    config.fields.forEach((fld) => {
      if (fld.type === 'works-multiselect' && !Array.isArray(f[fld.key]))
        f[fld.key] = f[fld.key]
          ? String(f[fld.key]).split(',').filter(Boolean)
          : []
      if (f[fld.key] === undefined)
        f[fld.key] = fld.type === 'switch' ? false : ''
    })
    setEditing(item)
    setForm(f)
    setOpen(true)
  }
  function setField(key: string, val: any) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  async function save() {
    setSaving(true)
    const payload: Record<string, any> = { ...form }
    config.fields.forEach((fld) => {
      if (fld.type === 'number' || fld.type === 'year-ref')
        payload[fld.key] =
          payload[fld.key] === '' || payload[fld.key] == null
            ? null
            : Number(payload[fld.key])
      if (fld.type === 'switch') payload[fld.key] = !!payload[fld.key]
      if (fld.type === 'works-multiselect' && !Array.isArray(payload[fld.key]))
        payload[fld.key] = []
    })
    try {
      if (editing) await api.adminUpdate(config.name, editing.id, payload)
      else await api.adminCreate(config.name, payload)
      toast('已保存', 'success')
      setOpen(false)
      load()
    } catch (e: any) {
      toast(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }
  async function remove(item: any) {
    const name = item[config.titleKey || 'name'] || '该项'
    if (!window.confirm(`确定删除「${name}」？此操作不可撤销。`)) return
    try {
      await api.adminDelete(config.name, item.id)
      toast('已删除', 'success')
      load()
    } catch (e: any) {
      toast(e.message, 'error')
    }
  }

  function decorate(item: any) {
    const d = { ...item }
    config.fields.forEach((fld) => {
      if (fld.type === 'select-ref' && fld.ref) {
        const found = (refData[fld.ref] || []).find((x) => x.id === item[fld.key])
        d['_' + fld.key] = found
          ? fld.refLabel
            ? fld.refLabel(found)
            : found.name
          : ''
      }
    })
    return d
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-2xl text-foreground">{config.title}</h2>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> 新建
        </Button>
      </div>
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {config.columnsHeader.map((h, i) => (
                <TableHead key={i}>{h}</TableHead>
              ))}
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={config.columnsHeader.length + 1}
                  className="py-10 text-center text-muted-foreground"
                >
                  加载中…
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={config.columnsHeader.length + 1}
                  className="py-10 text-center text-muted-foreground"
                >
                  {config.emptyText || '暂无数据，点击右上角新建'}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const d = decorate(item)
                return (
                  <TableRow key={item.id}>
                    {config.columns(d).map((c, i) => (
                      <TableCell key={i}>{c}</TableCell>
                    ))}
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(item)}
                          aria-label="编辑"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => remove(item)}
                          aria-label="删除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? '编辑' + config.title : '新建' + config.title}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? '保存中…' : '保存'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {config.fields.map((fld) => (
            <FieldInput
              key={fld.key}
              field={fld}
              value={form[fld.key]}
              refData={refData}
              onChange={(v) => setField(fld.key, v)}
            />
          ))}
        </div>
      </Dialog>
    </div>
  )
}

function FieldInput({
  field,
  value,
  refData,
  onChange,
}: {
  field: Field
  value: any
  refData: Record<string, any[]>
  onChange: (v: any) => void
}) {
  switch (field.type) {
    case 'textarea':
      return (
        <div>
          <Label>{field.label}</Label>
          <Textarea
            value={value || ''}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      )
    case 'image':
      return <ImageField value={value} onChange={onChange} label={field.label} />
    case 'number':
      return (
        <div>
          <Label>{field.label}</Label>
          <Input
            type="number"
            value={value ?? ''}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      )
    case 'switch':
      return (
        <div className="flex items-center justify-between">
          <Label>{field.label}</Label>
          <Switch checked={!!value} onCheckedChange={onChange} />
        </div>
      )
    case 'select':
      return (
        <div>
          <Label>{field.label}</Label>
          <Select value={value || ''} onChange={(e) => onChange(e.target.value)}>
            {field.options?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      )
    case 'select-ref': {
      const opts = (refData[field.ref!] || []).map((x) => ({
        value: x.id,
        label: field.refLabel ? field.refLabel(x) : x.name,
      }))
      return (
        <div>
          <Label>{field.label}</Label>
          <Select value={value || ''} onChange={(e) => onChange(e.target.value)}>
            <option value="">未设置</option>
            {opts.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      )
    }
    case 'year-ref': {
      const opts = (refData['years'] || []).map((x) => ({
        value: String(x.year),
        label: String(x.year),
      }))
      return (
        <div>
          <Label>{field.label}</Label>
          <Select
            value={value != null ? String(value) : ''}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">未设置</option>
            {opts.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      )
    }
    case 'works-multiselect': {
      const list = refData['works'] || []
      const sel = Array.isArray(value) ? value : []
      return (
        <div>
          <Label>{field.label}</Label>
          <div className="mt-1 max-h-48 overflow-auto rounded-md border border-border p-2">
            {list.length === 0 ? (
              <div className="text-sm text-muted-foreground">暂无作品</div>
            ) : (
              list.map((w) => (
                <label
                  key={w.id}
                  className="flex items-center gap-2 py-1 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={sel.includes(w.id)}
                    onChange={(e) => {
                      const n = e.target.checked
                        ? [...sel, w.id]
                        : sel.filter((id) => id !== w.id)
                      onChange(n)
                    }}
                  />
                  <span className="truncate">{w.title}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )
    }
    default:
      return (
        <div>
          <Label>{field.label}</Label>
          <Input
            value={value || ''}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      )
  }
}
