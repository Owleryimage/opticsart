import * as React from 'react'
import { Label } from '@/components/ui/label'

const MAX_DIM = 2560 // 长边最大像素（2K 屏：2560×1440）
const QUALITY = 0.9 // JPEG 压缩质量

export function ImageField({
  value,
  onChange,
  label = '图片',
}: {
  value?: string
  onChange: (v: string) => void
  label?: string
}) {
  const [preview, setPreview] = React.useState(value || '')
  React.useEffect(() => setPreview(value || ''), [value])

  function emit(dataUrl: string) {
    setPreview(dataUrl)
    onChange(dataUrl)
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    // SVG 直接透传（无法在 canvas 中重绘尺寸）
    if (f.type === 'image/svg+xml') {
      const reader = new FileReader()
      reader.onload = () => emit(reader.result as string)
      reader.readAsDataURL(f)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > MAX_DIM || height > MAX_DIM) {
          const scale = Math.min(MAX_DIM / width, MAX_DIM / height)
          width = Math.round(width * scale)
          height = Math.round(height * scale)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          emit(reader.result as string)
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        // 统一转为 JPEG，体积通常 < 200KB，避免超过服务端体积上限
        emit(canvas.toDataURL('image/jpeg', QUALITY))
      }
      img.onerror = () => emit(reader.result as string)
      img.src = reader.result as string
    }
    reader.readAsDataURL(f)
  }

  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1 flex items-center gap-3">
        <div className="h-24 w-32 overflow-hidden rounded-md border border-border bg-muted">
          {preview && (
            <img src={preview} alt="预览" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={onFile}
            className="text-sm text-muted-foreground"
          />
          {preview && (
            <button
              type="button"
              onClick={() => {
                setPreview('')
                onChange('')
              }}
              className="w-fit text-xs text-destructive hover:underline"
            >
              移除图片
            </button>
          )}
        </div>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        选择文件后会自动压缩并随表单一并提交，无需单独上传。
      </p>
    </div>
  )
}
